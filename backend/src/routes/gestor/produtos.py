# /src/routes/gestor/produtos.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from src.database import get_db
from src.models import models  # Importa todos os modelos
from src.schemas import (
    # Schemas de Categoria
    CategoriaProdutoCreate, CategoriaProdutoSchema, CategoriaProdutoUpdate,
    # Schemas de Produto (agora sem preço)
    ProdutoCreate, ProdutoUpdate, ProdutoCompletoSchema,
    # Schemas de Variação
    VariacaoProdutoCreate, VariacaoProdutoUpdate, VariacaoProdutoSchema,
    # NOVOS Schemas de Catálogo
    CatalogoCreate, CatalogoUpdate, CatalogoSchema,
    # NOVOS Schemas de Itens de Catálogo (Preços)
    ItemCatalogoCreate, ItemCatalogoUpdate, ItemCatalogoSchema
)
from src.core.security import get_current_gestor_org_id

# Cria o router
gestor_produtos_router = APIRouter(
    prefix="/api/gestor/catalogo",  # Mudei o prefixo para /catalogo (mais genérico)
    tags=["5. Gestor - Catálogo (Produtos e Preços)"],  # Tag atualizada
    dependencies=[Depends(get_current_gestor_org_id)]
)

# --- Funções Helper de Validação ---

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


def get_catalogo_by_id(db: Session, id_catalogo: int, id_organizacao: int) -> models.Catalogo:
    catalogo = db.query(models.Catalogo).join(models.Empresa).filter(
        models.Catalogo.id_catalogo == id_catalogo,
        models.Empresa.id_organizacao == id_organizacao
    ).first()
    if not catalogo:
        raise HTTPException(status_code=404, detail="Catálogo não encontrado.")
    return catalogo


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
    return CategoriaProdutoSchema.model_validate(db_categoria, from_attributes=True)


@gestor_produtos_router.get("/categorias", response_model=List[CategoriaProdutoSchema])
def get_categorias(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Lista todas as categorias da organização """
    categorias = db.query(models.CategoriaProduto).filter(
        models.CategoriaProduto.id_organizacao == id_organizacao
    ).order_by(models.CategoriaProduto.no_categoria).all()
    return [CategoriaProdutoSchema.model_validate(cat, from_attributes=True) for cat in categorias]


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
    return CategoriaProdutoSchema.model_validate(db_categoria, from_attributes=True)


# ============================================
# CRUD de Produtos (TB_PRODUTOS)
# ============================================

@gestor_produtos_router.post("/produtos", response_model=ProdutoCompletoSchema, status_code=status.HTTP_201_CREATED)
def create_produto(
    produto_in: ProdutoCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Cria um novo PRODUTO (definição, sem preço) """
    
    # 1. Valida a Empresa (garante que ela pertence à org)
    db_empresa = db.query(models.Empresa).filter(
        models.Empresa.id_empresa == produto_in.id_empresa,
        models.Empresa.id_organizacao == id_organizacao,
    ).first()
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    # 2. Valida a Categoria (se informada)
    if produto_in.id_categoria:
        get_categoria_by_id(db, produto_in.id_categoria, id_organizacao)
        
    # 3. Valida a constraint UK (Código + Empresa)
    existing_prod = db.query(models.Produto).filter(
        models.Produto.id_empresa == produto_in.id_empresa,
        models.Produto.cd_produto == produto_in.cd_produto
    ).first()
    if existing_prod:
        raise HTTPException(status_code=409, detail="Este código de produto já existe para esta empresa.")
        
    db_produto = models.Produto(**produto_in.model_dump())
    
    try:
        db.add(db_produto)
        db.commit()
        db.refresh(db_produto)
        
        # Re-busca o produto usando o helper, que já faz os joins/loads
        # necessários ('variacoes', 'categoria') para o response_model
        return get_produto_by_id(db, db_produto.id_produto, id_organizacao)

    except IntegrityError as e: # Captura UK (Unique Constraint)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Falha de integridade: {e.orig}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@gestor_produtos_router.get("/produtos", response_model=List[ProdutoCompletoSchema])
def get_produtos_da_organizacao(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db),
    id_empresa: Optional[int] = None
):
    """ Lista todos os PRODUTOS (definições) da organização """
    query = db.query(models.Produto).join(models.Empresa).filter(
        models.Empresa.id_organizacao == id_organizacao
    ).options(
        joinedload(models.Produto.variacoes),
        joinedload(models.Produto.listas_de_preco)  # Carrega as listas de preço
    )

    if id_empresa:
        query = query.filter(models.Produto.id_empresa == id_empresa)

    produtos = query.order_by(models.Produto.ds_produto).all()
    return [ProdutoCompletoSchema.model_validate(p, from_attributes=True) for p in produtos]


@gestor_produtos_router.get("/produtos/{id_produto}", response_model=ProdutoCompletoSchema)
def get_produto(
    id_produto: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Busca um PRODUTO (definição) com suas variações e listas de preço """
    db_produto = db.query(models.Produto).options(
        joinedload(models.Produto.variacoes),
        joinedload(models.Produto.categoria),
        joinedload(models.Produto.listas_de_preco)  # Carrega as listas
    ).join(models.Empresa).filter(
        models.Produto.id_produto == id_produto,
        models.Empresa.id_organizacao == id_organizacao
    ).first()

# CRUD de Variações (TB_VARIACOES_PRODUTOS)
# ============================================

@gestor_produtos_router.get("/produtos/{id_produto}/variacoes", response_model=List[VariacaoProdutoSchema])
def get_variacoes_produto(
    id_produto: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Lista todas as variações de um produto """
    db_produto = get_produto_by_id(db, id_produto, id_organizacao)
    return [VariacaoProdutoSchema.model_validate(v, from_attributes=True) for v in db_produto.variacoes]


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
    elif variacao_in.cd_sku == "":
        variacao_in.cd_sku = None

    db_variacao = models.VariacaoProduto(
        **variacao_in.model_dump(),
        id_produto=db_produto.id_produto
    )
    db.add(db_variacao)
    db.commit()
    db.refresh(db_variacao)
    return VariacaoProdutoSchema.model_validate(db_variacao, from_attributes=True)


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

    # Converte string vazia para None no SKU
    if 'cd_sku' in update_data and update_data['cd_sku'] == "":
        update_data['cd_sku'] = None

    for key, value in update_data.items():
        setattr(db_variacao, key, value)

    db.commit()
    db.refresh(db_variacao)
    return VariacaoProdutoSchema.model_validate(db_variacao, from_attributes=True)


@gestor_produtos_router.delete("/variacoes/{id_variacao}", status_code=status.HTTP_204_NO_CONTENT)
def delete_variacao(
    id_variacao: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Remove uma variação """
    db_variacao = db.query(models.VariacaoProduto).join(models.Produto).join(models.Empresa).filter(
        models.VariacaoProduto.id_variacao == id_variacao,
        models.Empresa.id_organizacao == id_organizacao
    ).first()

    if not db_variacao:
        raise HTTPException(status_code=404, detail="Variação não encontrada.")

    db.delete(db_variacao)
    db.commit()
    return


# ============================================
# (NOVO) CRUD de Catálogos (TB_CATALOGOS)
# ============================================

@gestor_produtos_router.post("/catalogos", response_model=CatalogoSchema, status_code=status.HTTP_201_CREATED)
def create_catalogo(
    catalogo_in: CatalogoCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ (NOVO) Cria uma "capa" de catálogo (ex: Verão 2025) """
    # Valida a Empresa
    db_empresa = db.query(models.Empresa).filter(
        models.Empresa.id_empresa == catalogo_in.id_empresa,
        models.Empresa.id_organizacao == id_organizacao
    ).first()
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")

    db_catalogo = models.Catalogo(**catalogo_in.model_dump())
    db.add(db_catalogo)
    db.commit()
    db.refresh(db_catalogo)
    return CatalogoSchema.model_validate(db_catalogo, from_attributes=True)


@gestor_produtos_router.get("/catalogos", response_model=List[CatalogoSchema])
def get_catalogos_da_organizacao(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db),
    id_empresa: Optional[int] = None  # Filtro obrigatório
):
    """ (NOVO) Lista os catálogos (listas de preço) da organização, filtrados por empresa """
    if not id_empresa:
        raise HTTPException(status_code=400, detail="O 'id_empresa' é obrigatório para listar catálogos.")

    query = db.query(models.Catalogo).join(models.Empresa).filter(
        models.Empresa.id_organizacao == id_organizacao,
        models.Catalogo.id_empresa == id_empresa
    )

    catalogos = query.order_by(models.Catalogo.no_catalogo).all()
    return [CatalogoSchema.model_validate(cat, from_attributes=True) for cat in catalogos]


@gestor_produtos_router.put("/catalogos/{id_catalogo}", response_model=CatalogoSchema)
def update_catalogo(
    id_catalogo: int,
    catalogo_in: CatalogoUpdate,  # O schema de atualização (campos opcionais)
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ (NOVO) Atualiza uma "capa" de catálogo """
    # O helper valida se o catálogo pertence à organização
    db_catalogo = get_catalogo_by_id(db, id_catalogo, id_organizacao)

    update_data = catalogo_in.model_dump(exclude_unset=True)

    # Validação (se o nome estiver sendo alterado)
    if 'no_catalogo' in update_data:
        existing = db.query(models.Catalogo).filter(
            models.Catalogo.id_empresa == db_catalogo.id_empresa,
            models.Catalogo.no_catalogo == update_data['no_catalogo'],
            models.Catalogo.id_catalogo != id_catalogo
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Este nome de catálogo já está em uso nesta empresa.")

    for key, value in update_data.items():
        setattr(db_catalogo, key, value)

    db.commit()
    db.refresh(db_catalogo)
    return CatalogoSchema.model_validate(db_catalogo, from_attributes=True)


# ============================================
# (NOVO) CRUD de Itens de Catálogo (TB_ITENS_CATALOGO)
# ============================================

@gestor_produtos_router.post("/catalogos/{id_catalogo}/itens", response_model=ItemCatalogoSchema, status_code=status.HTTP_201_CREATED)
def add_item_ao_catalogo(
    id_catalogo: int,
    item_in: ItemCatalogoCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ (NOVO) Adiciona um produto e seu preço a um catálogo """
    # 1. Valida o Catálogo
    db_catalogo = get_catalogo_by_id(db, id_catalogo, id_organizacao)

    # 2. Valida o Produto (e se pertence à mesma empresa do catálogo)
    db_produto = get_produto_by_id(db, item_in.id_produto, id_organizacao)
    if db_produto.id_empresa != db_catalogo.id_empresa:
        raise HTTPException(status_code=400, detail="Produto não pertence à mesma empresa do catálogo.")

    # 3. (UK_CATALOGO_PRODUTO será validada pelo DB, mas podemos checar)
    existing = db.query(models.ItemCatalogo).filter(
        models.ItemCatalogo.id_catalogo == id_catalogo,
        models.ItemCatalogo.id_produto == item_in.id_produto
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Este produto já está neste catálogo.")

    db_item = models.ItemCatalogo(
        **item_in.model_dump(),
        id_catalogo=id_catalogo
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return ItemCatalogoSchema.model_validate(db_item, from_attributes=True)


@gestor_produtos_router.get("/catalogos/{id_catalogo}/itens", response_model=List[ItemCatalogoSchema])
def get_itens_do_catalogo(
    id_catalogo: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Lista todos os produtos (e seus preços) de um catálogo """

    # Valida o catálogo
    db_catalogo = get_catalogo_by_id(db, id_catalogo, id_organizacao)

    # ✅ QUERY CORRIGIDA COM EAGER LOADING EXPLÍCITO
    itens = db.query(models.ItemCatalogo).filter(
        models.ItemCatalogo.id_catalogo == db_catalogo.id_catalogo
    ).options(
        # Carrega o produto COM TODAS as suas relações
        joinedload(models.ItemCatalogo.produto).selectinload(models.Produto.variacoes),
        joinedload(models.ItemCatalogo.produto).selectinload(models.Produto.categoria)
    ).all()

    # ✅ DEBUG: Imprime os dados carregados
    print(f"\n=== DEBUG: Itens carregados ===")
    for item in itens:
        print(f"Item ID: {item.id_item_catalogo}")
        print(f"  Produto: {item.produto}")
        if item.produto:
            print(f"    CD: {item.produto.cd_produto}")
            print(f"    DS: {item.produto.ds_produto}")
            print(f"    Variações: {len(item.produto.variacoes)}")
            print(f"    Categoria: {item.produto.categoria}")
    print("=" * 40 + "\n")

    return [ItemCatalogoSchema.model_validate(item, from_attributes=True) for item in itens]


def get_item_catalogo_by_id(db: Session, id_item_catalogo: int, id_organizacao: int) -> models.ItemCatalogo:
    """ Helper que valida se o item pertence à organização """
    item = db.query(models.ItemCatalogo).join(
        models.Catalogo, models.ItemCatalogo.id_catalogo == models.Catalogo.id_catalogo
    ).join(
        models.Empresa, models.Catalogo.id_empresa == models.Empresa.id_empresa
    ).filter(
        models.ItemCatalogo.id_item_catalogo == id_item_catalogo,
        models.Empresa.id_organizacao == id_organizacao
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item de catálogo não encontrado.")
    return item


@gestor_produtos_router.put("/itens/{id_item_catalogo}", response_model=ItemCatalogoSchema)
def update_item_catalogo(
    id_item_catalogo: int,
    item_in: ItemCatalogoUpdate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ (NOVO) Atualiza um item (preço) em um catálogo """
    db_item = get_item_catalogo_by_id(db, id_item_catalogo, id_organizacao)  # Valida

    update_data = item_in.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)
    return ItemCatalogoSchema.model_validate(db_item, from_attributes=True)


@gestor_produtos_router.delete("/itens/{id_item_catalogo}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item_catalogo(
    id_item_catalogo: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ (NOVO) Remove um item (produto) de um catálogo """
    db_item = get_item_catalogo_by_id(db, id_item_catalogo, id_organizacao)  # Valida

    db.delete(db_item)
    db.commit()
    return