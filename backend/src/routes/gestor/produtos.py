# /src/routes/gestor/produtos.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from src.database import get_db
from src.models import models # Importa todos os modelos
from src.schemas import (
    CategoriaProdutoCreate, CategoriaProdutoSchema, CategoriaProdutoUpdate,
    ProdutoCreate, ProdutoUpdate, ProdutoCompletoSchema,
    VariacaoProdutoCreate, VariacaoProdutoUpdate, VariacaoProdutoSchema,
    HistoricoPrecoSchema
)
from src.core.security import get_current_gestor_org_id

# Cria o router
gestor_produtos_router = APIRouter(
    prefix="/api/gestor",
    tags=["5. Gestor - Produtos e Catálogo"],
    dependencies=[Depends(get_current_gestor_org_id)] # Protege todas as rotas
)

# --- Funções Helper de Validação ---

def get_produto_by_id(db: Session, id_produto: int, id_organizacao: int) -> models.Produto:
    """ Valida se o produto existe e pertence à organização do gestor (via Empresa) """
    produto = db.query(models.Produto).join(models.Empresa).filter(
        models.Produto.id_produto == id_produto,
        models.Empresa.id_organizacao == id_organizacao
    ).first()
    
    if not produto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado ou não pertence a esta organização."
        )
    return produto

def get_categoria_by_id(db: Session, id_categoria: int, id_organizacao: int) -> models.CategoriaProduto:
    """ Valida se a categoria existe e pertence à organização do gestor """
    categoria = db.query(models.CategoriaProduto).filter(
        models.CategoriaProduto.id_categoria == id_categoria,
        models.CategoriaProduto.id_organizacao == id_organizacao
    ).first()
    
    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada ou não pertence a esta organização."
        )
    return categoria

# ============================================
# CRUD de Categorias (TB_CATEGORIAS_PRODUTOS)
# ============================================

@gestor_produtos_router.post("/categorias", response_model=CategoriaProdutoSchema, status_code=status.HTTP_201_CREATED)
def create_categoria(
    categoria_in: CategoriaProdutoCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Cria uma nova categoria de produto para a organização """
    # Valida se a categoria pai (se existir) pertence à organização
    if categoria_in.id_categoria_pai:
        get_categoria_by_id(db, categoria_in.id_categoria_pai, id_organizacao)

    db_categoria = models.CategoriaProduto(
        **categoria_in.model_dump(),
        id_organizacao=id_organizacao
    )
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria

@gestor_produtos_router.get("/categorias", response_model=List[CategoriaProdutoSchema])
def get_categorias(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Lista todas as categorias da organização """
    categorias = db.query(models.CategoriaProduto).filter(
        models.CategoriaProduto.id_organizacao == id_organizacao
    ).order_by(models.CategoriaProduto.no_categoria).all()
    return categorias

@gestor_produtos_router.put("/categorias/{id_categoria}", response_model=CategoriaProdutoSchema)
def update_categoria(
    id_categoria: int,
    categoria_in: CategoriaProdutoUpdate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Atualiza uma categoria """
    db_categoria = get_categoria_by_id(db, id_categoria, id_organizacao)
    
    update_data = categoria_in.model_dump(exclude_unset=True)
    
    # Valida a categoria pai (se for alterada)
    if 'id_categoria_pai' in update_data and update_data['id_categoria_pai']:
        get_categoria_by_id(db, update_data['id_categoria_pai'], id_organizacao)
        
    for key, value in update_data.items():
        setattr(db_categoria, key, value)
        
    db.commit()
    db.refresh(db_categoria)
    return db_categoria

# ============================================
# CRUD de Produtos (TB_PRODUTOS)
# ============================================

@gestor_produtos_router.post("/produtos", response_model=ProdutoCompletoSchema, status_code=status.HTTP_201_CREATED)
def create_produto(
    produto_in: ProdutoCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Cria um novo produto, vinculando-o a uma empresa da organização """
    # 1. Valida a Empresa
    db_empresa = db.query(models.Empresa).filter(
        models.Empresa.id_empresa == produto_in.id_empresa,
        models.Empresa.id_organizacao == id_organizacao,
        models.Empresa.fl_ativa == True
    ).first()
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada ou inativa.")

    # 2. Valida a Categoria (se informada)
    if produto_in.id_categoria:
        get_categoria_by_id(db, produto_in.id_categoria, id_organizacao)
        
    # 3. Valida a constraint UK_PRODUTOS_CODIGO_EMPRESA
    existing_prod = db.query(models.Produto).filter(
        models.Produto.id_empresa == produto_in.id_empresa,
        models.Produto.cd_produto == produto_in.cd_produto
    ).first()
    if existing_prod:
        raise HTTPException(status_code=409, detail="Este código de produto já existe para esta empresa.")
        
    db_produto = models.Produto(**produto_in.model_dump())
    
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto # Pydantic v2 lidará com a conversão

@gestor_produtos_router.get("/produtos", response_model=List[ProdutoCompletoSchema])
def get_produtos_da_organizacao(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db),
    id_empresa: Optional[int] = None, # Filtro opcional
    skip: int = 0,
    limit: int = 100
):
    """ Lista todos os produtos da organização, com filtro opcional por empresa """
    query = db.query(models.Produto).join(models.Empresa).filter(
        models.Empresa.id_organizacao == id_organizacao
    ).options(joinedload(models.Produto.variacoes)) # Eager load das variações
    
    if id_empresa:
        query = query.filter(models.Produto.id_empresa == id_empresa)
        
    produtos = query.order_by(models.Produto.ds_produto).offset(skip).limit(limit).all()
    return produtos

@gestor_produtos_router.get("/produtos/{id_produto}", response_model=ProdutoCompletoSchema)
def get_produto(
    id_produto: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Busca um produto específico com suas variações e categoria """
    # options(joinedload(...)) faz o "eager loading" dos relacionamentos
    # para evitar queries N+1 quando o Pydantic for serializar.
    db_produto = db.query(models.Produto).options(
        joinedload(models.Produto.variacoes),
        joinedload(models.Produto.categoria)
    ).join(models.Empresa).filter(
        models.Produto.id_produto == id_produto,
        models.Empresa.id_organizacao == id_organizacao
    ).first()
    
    if not db_produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado.")
        
    return db_produto

@gestor_produtos_router.put("/produtos/{id_produto}", response_model=ProdutoCompletoSchema)
def update_produto(
    id_produto: int,
    produto_in: ProdutoUpdate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Atualiza um produto """
    db_produto = get_produto_by_id(db, id_produto, id_organizacao) # Valida e busca
    update_data = produto_in.model_dump(exclude_unset=True)

    # (Lógica de trigger para TB_HISTORICO_PRECOS deve estar no banco)
    
    for key, value in update_data.items():
        setattr(db_produto, key, value)
        
    db.commit()
    db.refresh(db_produto)
    return db_produto

# ============================================
# CRUD de Variações (TB_VARIACOES_PRODUTOS)
# ============================================

@gestor_produtos_router.post("/produtos/{id_produto}/variacoes", response_model=VariacaoProdutoSchema, status_code=status.HTTP_201_CREATED)
def create_variacao(
    id_produto: int,
    variacao_in: VariacaoProdutoCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Adiciona uma nova variação (tamanho, cor, etc.) a um produto """
    # Valida se o produto pai pertence à organização
    db_produto = get_produto_by_id(db, id_produto, id_organizacao)
    
    # Valida SKU (se informado)
    if variacao_in.cd_sku:
        existing_sku = db.query(models.VariacaoProduto).filter(
            models.VariacaoProduto.cd_sku == variacao_in.cd_sku
        ).first()
        if existing_sku:
            raise HTTPException(status_code=409, detail="Este SKU já está em uso.")
            
    db_variacao = models.VariacaoProduto(
        **variacao_in.model_dump(),
        id_produto=db_produto.id_produto
    )
    db.add(db_variacao)
    db.commit()
    db.refresh(db_variacao)
    return db_variacao

@gestor_produtos_router.put("/variacoes/{id_variacao}", response_model=VariacaoProdutoSchema)
def update_variacao(
    id_variacao: int,
    variacao_in: VariacaoProdutoUpdate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Atualiza uma variação específica """
    # Valida se a variação pertence à organização (via join com Produto e Empresa)
    db_variacao = db.query(models.VariacaoProduto).join(models.Produto).join(models.Empresa).filter(
        models.VariacaoProduto.id_variacao == id_variacao,
        models.Empresa.id_organizacao == id_organizacao
    ).first()
    
    if not db_variacao:
        raise HTTPException(status_code=404, detail="Variação não encontrada.")
        
    update_data = variacao_in.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_variacao, key, value)
        
    db.commit()
    db.refresh(db_variacao)
    return db_variacao

# ============================================
# Leitura de Histórico (TB_HISTORICO_PRECOS)
# ============================================

@gestor_produtos_router.get("/produtos/{id_produto}/historico-precos", response_model=List[HistoricoPrecoSchema])
def get_historico_precos_produto(
    id_produto: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Lista o histórico de alterações de preço para um produto específico.
    """
    # Valida se o produto pertence à organização
    db_produto = get_produto_by_id(db, id_produto, id_organizacao)
    
    historico = db.query(models.HistoricoPreco).filter(
        models.HistoricoPreco.id_produto == db_produto.id_produto
    ).order_by(models.HistoricoPreco.dt_alteracao.desc()).all()
    
    return historico