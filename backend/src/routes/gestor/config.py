# /src/routes/gestor/config.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_  # Para buscar formas de pagamento globais
from typing import List

from src.database import get_db
from src.models import models
from src.schemas import (
    FormaPagamentoCreate, FormaPagamentoSchema, FormaPagamentoUpdate,
    RegraComissaoCreate, RegraComissaoSchema, RegraComissaoUpdate
)
from src.core.security import get_current_gestor_org_id

# Cria o router
gestor_config_router = APIRouter(
    prefix="/api/gestor/config",
    tags=["6. Gestor - Configurações"],  # Novo grupo no /docs
    dependencies=[Depends(get_current_gestor_org_id)]
)

# ============================================
# CRUD Formas de Pagamento
# ============================================

@gestor_config_router.get("/formas-pagamento", response_model=List[FormaPagamentoSchema])
def get_formas_pagamento(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Lista as Formas de Pagamento:
    - As globais (id_organizacao = NULL)
    - As específicas desta organização
    """
    formas_pgto = db.query(models.FormaPagamento).filter(
        or_(
            models.FormaPagamento.id_organizacao == id_organizacao,
            models.FormaPagamento.id_organizacao is None
        ),
        models.FormaPagamento.fl_ativa is True
    ).order_by(models.FormaPagamento.no_forma_pagamento).all()

    return [FormaPagamentoSchema.model_validate(fp, from_attributes=True) for fp in formas_pgto]


@gestor_config_router.post("/formas-pagamento", response_model=FormaPagamentoSchema, status_code=status.HTTP_201_CREATED)
def create_forma_pagamento_organizacao(
    forma_in: FormaPagamentoCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Cria uma nova forma de pagamento específica para esta organização. """

    # Validação (UK_FORMAS_PAGAMENTO_NOME)
    existing = db.query(models.FormaPagamento).filter(
        models.FormaPagamento.id_organizacao == id_organizacao,
        models.FormaPagamento.no_forma_pagamento == forma_in.no_forma_pagamento
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Esta forma de pagamento já existe nesta organização.")

    db_forma = models.FormaPagamento(
        **forma_in.model_dump(),
        id_organizacao=id_organizacao  # Vincula à organização do gestor
    )
    db.add(db_forma)
    db.commit()
    db.refresh(db_forma)
    return FormaPagamentoSchema.model_validate(db_forma, from_attributes=True)


# (Rotas PUT e DELETE para FormaPagamento seriam adicionadas aqui)

# ============================================
# CRUD Regras de Comissão
# ============================================

@gestor_config_router.get("/regras-comissao", response_model=List[RegraComissaoSchema])
def get_regras_comissao(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Lista todas as regras de comissão da organização """
    regras = db.query(models.RegraComissao).options(
        joinedload(models.RegraComissao.empresa),
        joinedload(models.RegraComissao.usuario)
    ).filter(
        models.RegraComissao.id_organizacao == id_organizacao
    ).order_by(models.RegraComissao.nr_prioridade.desc()).all()

    return [RegraComissaoSchema.model_validate(r, from_attributes=True) for r in regras]


@gestor_config_router.post("/regras-comissao", response_model=RegraComissaoSchema, status_code=status.HTTP_201_CREATED)
def create_regra_comissao(
    regra_in: RegraComissaoCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Cria uma nova regra de comissão para a organização """

    # Validação: Garante que a Empresa (se houver) pertence à organização
    if regra_in.id_empresa:
        empresa = db.query(models.Empresa).filter(
            models.Empresa.id_empresa == regra_in.id_empresa,
            models.Empresa.id_organizacao == id_organizacao
        ).first()
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa não encontrada nesta organização.")

    # Validação: Garante que o Vendedor (se houver) pertence à organização
    if regra_in.id_usuario:
        vendedor = db.query(models.Usuario).filter(
            models.Usuario.id_usuario == regra_in.id_usuario,
            models.Usuario.id_organizacao == id_organizacao,
            models.Usuario.tp_usuario == 'vendedor'
        ).first()
        if not vendedor:
            raise HTTPException(status_code=404, detail="Vendedor não encontrado nesta organização.")

    db_regra = models.RegraComissao(
        **regra_in.model_dump(),
        id_organizacao=id_organizacao
    )
    db.add(db_regra)
    db.commit()
    db.refresh(db_regra)
    return RegraComissaoSchema.model_validate(db_regra, from_attributes=True)

# (Rotas PUT e DELETE para RegraComissao seriam adicionadas aqui)