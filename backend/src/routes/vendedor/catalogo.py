# /backend/src/routes/vendedor/catalogo.py
# (VERSÃO REATORADA PARA CATÁLOGOS)

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from src.database import get_db
from src.models import models
# --- IMPORTAÇÃO CORRIGIDA ---
from src.schemas import CategoriaProdutoSchema, ItemCatalogoVendaSchema
from src.core.security import get_current_vendedor_contexto

vendedor_catalogo_router = APIRouter(
    prefix="/api/vendedor/catalogo",
    tags=["7. Vendedor - Catálogo e Clientes"],
    dependencies=[Depends(get_current_vendedor_contexto)]
)

@vendedor_catalogo_router.get("/", response_model=List[ItemCatalogoVendaSchema])
def get_catalogo_vendedor(
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db),
    id_categoria: Optional[int] = Query(None) # Renomeado de Query
):
    """
    Lista todos os itens de venda (Produto + Preço) do ÚNICO
    catálogo ativo da empresa selecionada.
    """
    _, id_organizacao, id_empresa_ativa = contexto
    
    # 1. Encontra o catálogo ATIVO da empresa
    catalogo_ativo = db.query(models.Catalogo).filter(
        models.Catalogo.id_empresa == id_empresa_ativa,
        models.Catalogo.fl_ativo == True
    ).first()
    
    if not catalogo_ativo:
        # Se a empresa não tem catálogo ativo, o vendedor não pode vender
        return []

    # 2. Busca os Itens de Catálogo (Preços) e faz JOIN com Produtos
    query = db.query(models.ItemCatalogo).options(
        joinedload(models.ItemCatalogo.produto).joinedload(models.Produto.variacoes),
        joinedload(models.ItemCatalogo.produto).joinedload(models.Produto.categoria)
    ).filter(
        models.ItemCatalogo.id_catalogo == catalogo_ativo.id_catalogo,
        models.ItemCatalogo.fl_ativo_no_catalogo == True
    ).join(
        models.Produto, models.ItemCatalogo.id_produto == models.Produto.id_produto
    ).filter(
        models.Produto.fl_ativo == True
    )
    
    # 3. Aplica filtro de categoria (se fornecido)
    if id_categoria:
        query = query.filter(models.Produto.id_categoria == id_categoria)
        
    itens_catalogo = query.order_by(models.Produto.ds_produto).all()
    
    # Pydantic v2 fará a conversão para ItemCatalogoVendaSchema
    return itens_catalogo

@vendedor_catalogo_router.get("/categorias", response_model=List[CategoriaProdutoSchema])
def get_categorias_organizacao(
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """ Lista as categorias de produto ativas da organização """
    _, id_organizacao, _ = contexto
    
    categorias = db.query(models.CategoriaProduto).filter(
        models.CategoriaProduto.id_organizacao == id_organizacao,
        models.CategoriaProduto.fl_ativa == True
    ).order_by(models.CategoriaProduto.no_categoria).all()
    
    return categorias