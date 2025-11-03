# /src/routes/vendedor/catalogo.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from src.database import get_db
from src.models import models
from src.schemas import ProdutoCompletoSchema, CategoriaProdutoSchema
# Esta é a nossa dependência de segurança chave para o Vendedor
from src.core.security import get_current_vendedor_contexto

# Cria o router
vendedor_catalogo_router = APIRouter(
    prefix="/api/vendedor/catalogo",
    tags=["7. Vendedor - Catálogo e Clientes"], # Novo grupo no /docs
    # Aplica a segurança de VENDEDOR COM CONTEXTO em TODAS as rotas
    dependencies=[Depends(get_current_vendedor_contexto)]
)

@vendedor_catalogo_router.get("/", response_model=List[ProdutoCompletoSchema])
def get_catalogo_empresa_ativa(
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db),
    id_categoria: Optional[int] = None, # Filtro opcional
    skip: int = 0,
    limit: int = 100
):
    """
    Lista todos os produtos (e suas variações) da empresa ativa
    selecionada pelo vendedor.
    """
    _, id_organizacao, id_empresa_ativa = contexto
    
    query = db.query(models.Produto).options(
        joinedload(models.Produto.variacoes),
        joinedload(models.Produto.categoria)
    ).filter(
        models.Produto.id_empresa == id_empresa_ativa,
        models.Produto.fl_ativo == True,
        models.Produto.dt_exclusao == None
    )
    
    # Aplica filtro de categoria (se fornecido)
    if id_categoria:
        query = query.filter(models.Produto.id_categoria == id_categoria)
        
    produtos = query.order_by(models.Produto.ds_produto).offset(skip).limit(limit).all()
    
    return produtos

@vendedor_catalogo_router.get("/categorias", response_model=List[CategoriaProdutoSchema])
def get_categorias_organizacao(
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """
    Lista todas as categorias de produto ativas da organização
    para que o vendedor possa filtrar o catálogo.
    """
    _, id_organizacao, _ = contexto
    
    categorias = db.query(models.CategoriaProduto).filter(
        models.CategoriaProduto.id_organizacao == id_organizacao,
        models.CategoriaProduto.fl_ativa == True
    ).order_by(models.CategoriaProduto.no_categoria).all()
    
    return categorias