# /src/routes/admin/organizacoes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from src.database import get_db
from src.models import models
from src.schemas import (
    AdminOrganizacaoCreate, AdminOrganizacaoUpdate, OrganizacaoSchema
)
from src.core.security import get_current_super_admin

# Cria o router
admin_orgs_router = APIRouter(
    prefix="/api/admin/organizacoes",
    tags=["14. Super Admin - Organizações"],
    dependencies=[Depends(get_current_super_admin)]  # Protege TODAS as rotas
)


@admin_orgs_router.post("/", response_model=OrganizacaoSchema, status_code=status.HTTP_201_CREATED)
def create_organizacao_e_gestor(
    org_in: AdminOrganizacaoCreate,
    db: Session = Depends(get_db)
):
    """
    (Super Admin) Cria uma nova Organização e seu primeiro usuário Gestor.
    """
    # Valida email (único globalmente)
    if db.query(models.Usuario).filter(models.Usuario.ds_email == org_in.gestor.ds_email).first():
        raise HTTPException(status_code=409, detail="Email do gestor já está em uso.")
    # Valida CNPJ (único globalmente)
    if org_in.nr_cnpj and db.query(models.Organizacao).filter(models.Organizacao.nr_cnpj == org_in.nr_cnpj).first():
        raise HTTPException(status_code=409, detail="CNPJ da organização já está em uso.")

    try:
        # --- Início da Transação ---

        # 1. Cria a Organização
        db_org = models.Organizacao(
            no_organizacao=org_in.no_organizacao,
            nr_cnpj=org_in.nr_cnpj,
            ds_email_contato=org_in.ds_email_contato,
            nr_telefone_contato=org_in.nr_telefone_contato,
            tp_plano=org_in.tp_plano,
            qt_limite_usuarios=org_in.qt_limite_usuarios,
            qt_limite_empresas=org_in.qt_limite_empresas,
            st_assinatura='ativo'  # Padrão
        )
        db.add(db_org)
        db.flush()  # Pega o ID_ORGANIZACAO gerado (ex: db_org.id_organizacao)

        # 2. Cria o Usuário Gestor
        db_gestor = models.Usuario(
            id_organizacao=db_org.id_organizacao,  # Vincula à nova organização
            ds_email=org_in.gestor.ds_email,
            no_completo=org_in.gestor.no_completo,
            nr_telefone=org_in.gestor.nr_telefone,
            tp_usuario='gestor',  # Define o tipo
            fl_ativo=True
        )
        db_gestor.set_password(org_in.gestor.password)
        db.add(db_gestor)

        db.commit()
        db.refresh(db_org)
        return OrganizacaoSchema.model_validate(db_org, from_attributes=True)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar organização: {str(e)}")


@admin_orgs_router.get("/", response_model=List[OrganizacaoSchema])
def get_todas_organizacoes(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """ (Super Admin) Lista todas as organizações do sistema """
    orgs = db.query(models.Organizacao).order_by(models.Organizacao.no_organizacao).offset(skip).limit(limit).all()
    return [OrganizacaoSchema.model_validate(org, from_attributes=True) for org in orgs]


@admin_orgs_router.put("/{id_organizacao}", response_model=OrganizacaoSchema)
def update_organizacao(
    id_organizacao: int,
    org_in: AdminOrganizacaoUpdate,
    db: Session = Depends(get_db)
):
    """ (Super Admin) Atualiza o plano, status ou limites de uma organização """
    db_org = db.get(models.Organizacao, id_organizacao)
    if not db_org:
        raise HTTPException(status_code=404, detail="Organização não encontrada.")

    update_data = org_in.model_dump(exclude_unset=True)

    # Validação de CNPJ (se estiver sendo alterado)
    if 'nr_cnpj' in update_data and update_data['nr_cnpj'] != db_org.nr_cnpj:
        if db.query(models.Organizacao).filter(
            models.Organizacao.nr_cnpj == update_data['nr_cnpj'],
            models.Organizacao.id_organizacao != id_organizacao
        ).first():
            raise HTTPException(status_code=409, detail="CNPJ já está em uso por outra organização.")

    for key, value in update_data.items():
        setattr(db_org, key, value)

    db.commit()
    db.refresh(db_org)
    return OrganizacaoSchema.model_validate(db_org, from_attributes=True)