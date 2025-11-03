# /src/routes/gestor/empresas.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from src.database import get_db
from src.models.models import Empresa
from src.schemas import EmpresaCompletaSchema, EmpresaCreate, EmpresaUpdate
from src.core.security import get_current_gestor_org_id

# Cria o router
gestor_empresas_router = APIRouter(
    prefix="/api/gestor/empresas",
    tags=["2. Gestor - Empresas"],
    # Aplica a segurança de GESTOR em TODAS as rotas deste arquivo
    dependencies=[Depends(get_current_gestor_org_id)]
)

@gestor_empresas_router.post("/", response_model=EmpresaCompletaSchema, status_code=status.HTTP_201_CREATED)
def create_empresa(
    empresa_in: EmpresaCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id), # Pega o ID da Org do token
    db: Session = Depends(get_db)
):
    """
    Cria uma nova empresa representada (Representada) para a organização do gestor.
    """
    # Verifica a constraint UK_EMPRESAS_CNPJ_ORG
    existing_cnpj = db.query(Empresa).filter(
        Empresa.id_organizacao == id_organizacao,
        Empresa.nr_cnpj == empresa_in.nr_cnpj
    ).first()
    
    if existing_cnpj:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"O CNPJ {empresa_in.nr_cnpj} já está cadastrado nesta organização."
        )

    # Converte o schema Pydantic (empresa_in) para o modelo SQLAlchemy
    db_empresa = Empresa(
        **empresa_in.model_dump(), # Pega todos os campos do schema
        id_organizacao=id_organizacao # Adiciona o ID da organização
    )
    
    try:
        db.add(db_empresa)
        db.commit()
        db.refresh(db_empresa)
        return db_empresa
    except IntegrityError as e: # Captura outros erros de DB
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar empresa: {e.orig}"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@gestor_empresas_router.get("/", response_model=List[EmpresaCompletaSchema])
def get_empresas_da_organizacao(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Lista todas as empresas representadas (ativas e inativas) da organização do gestor.
    """
    empresas = db.query(Empresa).filter(
        Empresa.id_organizacao == id_organizacao
    ).order_by(Empresa.no_empresa).offset(skip).limit(limit).all()
    
    return empresas

@gestor_empresas_router.get("/{id_empresa}", response_model=EmpresaCompletaSchema)
def get_empresa_por_id(
    id_empresa: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Busca uma empresa específica pelo ID.
    """
    db_empresa = db.query(Empresa).filter(
        Empresa.id_organizacao == id_organizacao,
        Empresa.id_empresa == id_empresa
    ).first()
    
    if db_empresa is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada ou não pertence a esta organização."
        )
    return db_empresa

@gestor_empresas_router.put("/{id_empresa}", response_model=EmpresaCompletaSchema)
def update_empresa(
    id_empresa: int,
    empresa_in: EmpresaUpdate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Atualiza os dados de uma empresa.
    """
    db_empresa = get_empresa_por_id(id_empresa, id_organizacao, db) # Reutiliza a função de busca
    
    # Converte o Pydantic model para dict, excluindo campos não enviados
    update_data = empresa_in.model_dump(exclude_unset=True)
    
    # Verifica se o CNPJ está sendo alterado e se já existe
    if 'nr_cnpj' in update_data and update_data['nr_cnpj'] != db_empresa.nr_cnpj:
        existing_cnpj = db.query(Empresa).filter(
            Empresa.id_organizacao == id_organizacao,
            Empresa.nr_cnpj == update_data['nr_cnpj'],
            Empresa.id_empresa != id_empresa
        ).first()
        if existing_cnpj:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"O CNPJ {update_data['nr_cnpj']} já está em uso por outra empresa."
            )

    # Aplica as atualizações
    for key, value in update_data.items():
        setattr(db_empresa, key, value)
        
    try:
        db.commit()
        db.refresh(db_empresa)
        return db_empresa
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@gestor_empresas_router.delete("/{id_empresa}", status_code=status.HTTP_204_NO_CONTENT)
def delete_empresa(
    id_empresa: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Desativa (Soft Delete) uma empresa. (Nota: Seu DB usa FL_ATIVA e DT_EXCLUSAO)
    """
    db_empresa = get_empresa_por_id(id_empresa, id_organizacao, db)
    
    if not db_empresa.fl_ativa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa já estava desativada."
        )

    # Implementando Soft Delete
    db_empresa.fl_ativa = False
    db_empresa.dt_exclusao = datetime.utcnow()
    
    try:
        db.commit()
        # Retorna 204 No Content, sem corpo
        return
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )