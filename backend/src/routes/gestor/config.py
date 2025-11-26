# /backend/src/routes/gestor/config.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
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
    tags=["6. Gestor - Configurações"],
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
    """ Lista as Formas de Pagamento (Globais + Org) """
    formas_pgto = db.query(models.FormaPagamento).filter(
        and_(
            or_(
                models.FormaPagamento.id_organizacao == id_organizacao,
                models.FormaPagamento.id_organizacao.is_(None)
            ),
            models.FormaPagamento.fl_ativa.is_(True)
        )
    ).order_by(models.FormaPagamento.no_forma_pagamento).all()
    
    return formas_pgto

@gestor_config_router.post("/formas-pagamento", response_model=FormaPagamentoSchema, status_code=status.HTTP_201_CREATED)
def create_forma_pagamento(
    forma_in: FormaPagamentoCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Cria uma nova forma de pagamento """
    existing = db.query(models.FormaPagamento).filter(
        models.FormaPagamento.id_organizacao == id_organizacao,
        models.FormaPagamento.no_forma_pagamento == forma_in.no_forma_pagamento
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Esta forma de pagamento já existe.")

    db_forma = models.FormaPagamento(
        **forma_in.model_dump(),
        id_organizacao=id_organizacao
    )
    db.add(db_forma)
    db.commit()
    db.refresh(db_forma)
    return db_forma

# --- ROTAS QUE FALTAVAM ---

@gestor_config_router.put("/formas-pagamento/{id_forma}", response_model=FormaPagamentoSchema)
def update_forma_pagamento(
    id_forma: int,
    forma_in: FormaPagamentoUpdate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Atualiza uma forma de pagamento (apenas se for da organização) """
    db_forma = db.query(models.FormaPagamento).filter(
        models.FormaPagamento.id_forma_pagamento == id_forma,
        models.FormaPagamento.id_organizacao == id_organizacao
    ).first()

    if not db_forma:
        # Verifica se é global
        is_global = db.query(models.FormaPagamento).filter(
            models.FormaPagamento.id_forma_pagamento == id_forma,
            models.FormaPagamento.id_organizacao.is_(None)
        ).first()
        if is_global:
             raise HTTPException(status_code=403, detail="Não é permitido editar formas de pagamento globais.")
        raise HTTPException(status_code=404, detail="Forma de pagamento não encontrada.")

    update_data = forma_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_forma, key, value)

    db.commit()
    db.refresh(db_forma)
    return db_forma

@gestor_config_router.delete("/formas-pagamento/{id_forma}", status_code=status.HTTP_204_NO_CONTENT)
def delete_forma_pagamento(
    id_forma: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Exclui (Soft Delete) uma forma de pagamento """
    db_forma = db.query(models.FormaPagamento).filter(
        models.FormaPagamento.id_forma_pagamento == id_forma,
        models.FormaPagamento.id_organizacao == id_organizacao
    ).first()

    if not db_forma:
        # Verifica se é global
        is_global = db.query(models.FormaPagamento).filter(
            models.FormaPagamento.id_forma_pagamento == id_forma,
            models.FormaPagamento.id_organizacao.is_(None)
        ).first()
        if is_global:
             raise HTTPException(status_code=403, detail="Não é permitido excluir formas de pagamento globais.")
        raise HTTPException(status_code=404, detail="Forma de pagamento não encontrada.")

    # Soft Delete
    db_forma.fl_ativa = False
    db.commit()
    return

# ============================================
# CRUD Regras de Comissão
# ============================================

@gestor_config_router.get("/regras-comissao", response_model=List[RegraComissaoSchema])
def get_regras_comissao(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Lista regras de comissão """
    regras = db.query(models.RegraComissao).options(
        joinedload(models.RegraComissao.empresa),
        joinedload(models.RegraComissao.usuario)
    ).filter(
        models.RegraComissao.id_organizacao == id_organizacao
    ).order_by(models.RegraComissao.nr_prioridade.desc()).all()
    return regras

@gestor_config_router.post("/regras-comissao", response_model=RegraComissaoSchema, status_code=status.HTTP_201_CREATED)
def create_regra_comissao(
    regra_in: RegraComissaoCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Cria regra de comissão """
    # Valida Empresa
    if regra_in.id_empresa:
        empresa = db.query(models.Empresa).filter(
            models.Empresa.id_empresa == regra_in.id_empresa,
            models.Empresa.id_organizacao == id_organizacao
        ).first()
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa não encontrada.")
            
    # Valida Vendedor
    if regra_in.id_usuario:
        vendedor = db.query(models.Usuario).filter(
            models.Usuario.id_usuario == regra_in.id_usuario,
            models.Usuario.id_organizacao == id_organizacao,
            models.Usuario.tp_usuario == 'vendedor'
        ).first()
        if not vendedor:
            raise HTTPException(status_code=404, detail="Vendedor não encontrado.")

    db_regra = models.RegraComissao(
        **regra_in.model_dump(),
        id_organizacao=id_organizacao
    )
    db.add(db_regra)
    db.commit()
    db.refresh(db_regra)
    
    # Re-busca para carregar relacionamentos
    return db.query(models.RegraComissao).options(
        joinedload(models.RegraComissao.empresa),
        joinedload(models.RegraComissao.usuario)
    ).get(db_regra.id_regra_comissao)

# --- ROTAS QUE FALTAVAM ---

@gestor_config_router.put("/regras-comissao/{id_regra}", response_model=RegraComissaoSchema)
def update_regra_comissao(
    id_regra: int,
    regra_in: RegraComissaoUpdate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Atualiza regra de comissão """
    db_regra = db.query(models.RegraComissao).filter(
        models.RegraComissao.id_regra_comissao == id_regra,
        models.RegraComissao.id_organizacao == id_organizacao
    ).first()
    if not db_regra:
        raise HTTPException(status_code=404, detail="Regra não encontrada.")

    update_data = regra_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_regra, key, value)

    db.commit()
    db.refresh(db_regra)
    return db_regra

@gestor_config_router.delete("/regras-comissao/{id_regra}", status_code=status.HTTP_204_NO_CONTENT)
def delete_regra_comissao(
    id_regra: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """ Exclui regra de comissão """
    db_regra = db.query(models.RegraComissao).filter(
        models.RegraComissao.id_regra_comissao == id_regra,
        models.RegraComissao.id_organizacao == id_organizacao
    ).first()
    if not db_regra:
        raise HTTPException(status_code=404, detail="Regra não encontrada.")
        
    db.delete(db_regra)
    db.commit()
    return