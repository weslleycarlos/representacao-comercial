# /src/routes/auth.py
# VERSÃO CORRIGIDA E LIMPA (usando Pydantic v2 .model_validate())
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Annotated
from src.database import get_db
from src.models.models import Usuario, Empresa, UsuarioEmpresa, Organizacao
from src.schemas import (
    LoginRequest, LoginResponse, MeResponse, SelectCompanyRequest, SelectCompanyResponse,
    UsuarioSchema, OrganizacaoSchema, EmpresaSchema, Token
)
from src.core.security import create_access_token, get_current_user_data

# Substitui o Blueprint do Flask
auth_router = APIRouter(
    prefix="/api/auth",
    tags=["1. Autenticação"] # Agrupa no /docs
)

@auth_router.post("/login", response_model=LoginResponse)
def login_for_access_token(
    login_data: LoginRequest, # Validação automática de entrada
    db: Session = Depends(get_db) # Injeção de dependência do DB
):
    """
    Autentica um usuário, retorna dados da sessão e um token JWT inicial.
    """
    try:
        user = db.query(Usuario).filter(Usuario.ds_email == login_data.email).first()

        if not user or not user.check_password(login_data.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha inválidos",
            )

        if not user.fl_ativo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Esta conta de usuário está desativada",
            )

        # Atualiza a data de último acesso
        user.dt_ultimo_acesso = datetime.utcnow()
        db.commit()

        # Cria o token JWT (payload inicial)
        token_payload = {
            "sub": str(user.id_usuario),
            "org": user.id_organizacao,
            "role": user.tp_usuario,
            "emp_ativa": None # Nenhum empresa selecionada ainda
        }
        access_token = create_access_token(data=token_payload)

        # Busca empresas vinculadas
        empresas_vinculadas = [
            vinculo.empresa 
            for vinculo in user.empresas_vinculadas 
            if vinculo.empresa and vinculo.empresa.fl_ativa
        ]

        # --- CORREÇÃO AQUI: Usando .model_validate() ---
        return LoginResponse(
            token=Token(access_token=access_token, token_type="bearer"),
            usuario=UsuarioSchema.model_validate(user, from_attributes=True),
            organizacao=OrganizacaoSchema.model_validate(user.organizacao, from_attributes=True) if user.organizacao else None,
            empresas_vinculadas=[EmpresaSchema.model_validate(emp, from_attributes=True) for emp in empresas_vinculadas]
        )

    except HTTPException as e:
        raise e 
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Erro interno no servidor: {str(e)}'
        )

# /src/routes/auth.py

@auth_router.post("/login", response_model=LoginResponse)
def login_for_access_token(
    login_data: LoginRequest, # Validação automática de entrada
    db: Session = Depends(get_db) # Injeção de dependência do DB
):
    """
    Autentica um usuário, retorna dados da sessão e um token JWT inicial.
    """
    try:
        user = db.query(Usuario).filter(Usuario.ds_email == login_data.email).first()

        if not user or not user.check_password(login_data.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha inválidos",
            )

        if not user.fl_ativo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Esta conta de usuário está desativada",
            )

        # Atualiza a data de último acesso
        user.dt_ultimo_acesso = datetime.utcnow()
        db.commit()

        # Cria o token JWT (payload inicial)
        token_payload = {
            "sub": str(user.id_usuario),
            "org": user.id_organizacao,
            "role": user.tp_usuario,
            "emp_ativa": None # Nenhum empresa selecionada ainda
        }
        access_token = create_access_token(data=token_payload)

        # Busca empresas vinculadas
        empresas_vinculadas = [
            vinculo.empresa 
            for vinculo in user.empresas_vinculadas 
            if vinculo.empresa and vinculo.empresa.fl_ativa
        ]

        # --- CORREÇÃO AQUI: Usando .model_validate() ---
        return LoginResponse(
            token=Token(access_token=access_token, token_type="bearer"),
            usuario=UsuarioSchema.model_validate(user),
            organizacao=OrganizacaoSchema.model_validate(user.organizacao) if user.organizacao else None,
            empresas_vinculadas=[EmpresaSchema.model_validate(emp) for emp in empresas_vinculadas]
        )

    except HTTPException as e:
        raise e 
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'Erro interno no servidor: {str(e)}'
        )


@auth_router.post("/select-company", response_model=SelectCompanyResponse)
def select_company(
    request_data: SelectCompanyRequest,
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_data)
):
    """
    Seleciona uma empresa ativa e retorna um NOVO token JWT com essa informação.
    O frontend deve substituir o token antigo por este novo.
    """
    current_user, token_data = user_data
    id_empresa_selecionada = request_data.id_empresa

    vinculo = db.query(UsuarioEmpresa).filter(
        UsuarioEmpresa.id_usuario == current_user.id_usuario,
        UsuarioEmpresa.id_empresa == id_empresa_selecionada
    ).first()

    if not vinculo or not vinculo.empresa or not vinculo.empresa.fl_ativa:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado a esta empresa ou empresa inativa"
        )

    # Cria um NOVO token com a empresa ativa incluída
    new_token_payload = {
        "sub": str(current_user.id_usuario),
        "org": current_user.id_organizacao,
        "role": current_user.tp_usuario,
        "emp_ativa": id_empresa_selecionada # <-- A GRANDE MUDANÇA
    }
    access_token = create_access_token(data=new_token_payload)
    
    # --- CORREÇÃO AQUI: Usando .model_validate() ---
    return SelectCompanyResponse(
        token=Token(access_token=access_token, token_type="bearer"),
        empresa_ativa=EmpresaSchema.model_validate(vinculo.empresa, from_attributes=True)
    )


@auth_router.get("/me", response_model=MeResponse)
def get_current_user_session(
    user_data: tuple = Depends(get_current_user_data),
    db: Session = Depends(get_db)
):
    """
    Retorna informações da sessão atual (usuário, organização, 
    empresa ativa e lista de empresas vinculadas).
    """
    current_user, token_data = user_data
    
    empresa_ativa = None
    if token_data.id_empresa_ativa:
        empresa_ativa = db.get(Empresa, token_data.id_empresa_ativa)
        if not empresa_ativa or not empresa_ativa.fl_ativa:
            empresa_ativa = None

    empresas_vinculadas = [
        vinculo.empresa 
        for vinculo in current_user.empresas_vinculadas 
        if vinculo.empresa and vinculo.empresa.fl_ativa
    ]

    # --- CORREÇÃO AQUI: Usando .model_validate() ---
    return MeResponse(
        usuario=UsuarioSchema.model_validate(current_user, from_attributes=True),
        organizacao=OrganizacaoSchema.model_validate(current_user.organizacao, from_attributes=True) if current_user.organizacao else None,
        empresa_ativa=EmpresaSchema.model_validate(empresa_ativa, from_attributes=True) if empresa_ativa else None,
        empresas_vinculadas=[EmpresaSchema.model_validate(emp, from_attributes=True) for emp in empresas_vinculadas]
    )