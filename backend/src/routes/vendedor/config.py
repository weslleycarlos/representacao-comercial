# /backend/src/routes/vendedor/config.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List

from src.database import get_db
from src.models import models
from src.schemas import FormaPagamentoSchema
from src.core.security import get_current_vendedor_contexto # Protegido pelo Vendedor

# Cria o router
vendedor_config_router = APIRouter(
    prefix="/api/vendedor/config",
    tags=["11. Vendedor - Catálogo"], # (Adiciona ao grupo existente)
    dependencies=[Depends(get_current_vendedor_contexto)]
)

@vendedor_config_router.get("/formas-pagamento", response_model=List[FormaPagamentoSchema])
def get_formas_pagamento_vendedor(
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """
    (Vendedor) Lista as Formas de Pagamento:
    - As globais (id_organizacao = NULL)
    - As específicas da organização do vendedor
    """
    _, id_organizacao, _ = contexto
    
    formas_pgto = db.query(models.FormaPagamento).filter(
        and_(
            or_(
                models.FormaPagamento.id_organizacao == id_organizacao,
                models.FormaPagamento.id_organizacao.is_(None) # <-- Mais seguro
            ),
            models.FormaPagamento.fl_ativa == True
        )
    ).order_by(models.FormaPagamento.no_forma_pagamento).all()
    
    return formas_pgto