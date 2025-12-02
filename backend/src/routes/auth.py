# /src/routes/auth.py
# VERSÃO CORRIGIDA E LIMPA (usando Pydantic v2 .model_validate())
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
from src.database import get_db
from src.models.models import (
    Usuario,
    Empresa,
    UsuarioEmpresa,
    Organizacao,
    RecuperacaoSenha,
)
from src.schemas import (
    LoginRequest,
    LoginResponse,
    MeResponse,
    SelectCompanyRequest,
    SelectCompanyResponse,
    UsuarioSchema,
    OrganizacaoSchema,
    EmpresaSchema,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
)
from src.core.security import (
    create_access_token,
    get_current_user_data,
    get_current_user,
)
from src.services.email import EmailService


# Substitui o Blueprint do Flask
auth_router = APIRouter(
    prefix="/api/auth",
    tags=["1. Autenticação"],  # Agrupa no /docs
)


@auth_router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    request: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Permite que o usuário logado altere sua própria senha.
    """
    # Verifica a senha atual
    if not current_user.check_password(request.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Senha atual incorreta."
        )

    # Define a nova senha
    current_user.set_password(request.new_password)

    try:
        db.commit()
        return {"message": "Senha alterada com sucesso."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao alterar senha: {str(e)}",
        )


@auth_router.post("/login", response_model=LoginResponse)
def login_for_access_token(
    login_data: LoginRequest,  # Validação automática de entrada
    db: Session = Depends(get_db),  # Injeção de dependência do DB
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
            "emp_ativa": None,  # Nenhum empresa selecionada ainda
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
            organizacao=OrganizacaoSchema.model_validate(
                user.organizacao, from_attributes=True
            )
            if user.organizacao
            else None,
            empresas_vinculadas=[
                EmpresaSchema.model_validate(emp, from_attributes=True)
                for emp in empresas_vinculadas
            ],
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno no servidor: {str(e)}",
        )


@auth_router.post("/select-company", response_model=SelectCompanyResponse)
def select_company(
    request_data: SelectCompanyRequest,
    db: Session = Depends(get_db),
    user_data: tuple = Depends(get_current_user_data),
):
    """
    Seleciona uma empresa ativa e retorna um NOVO token JWT com essa informação.
    O frontend deve substituir o token antigo por este novo.
    """
    current_user, token_data = user_data
    id_empresa_selecionada = request_data.id_empresa

    vinculo = (
        db.query(UsuarioEmpresa)
        .filter(
            UsuarioEmpresa.id_usuario == current_user.id_usuario,
            UsuarioEmpresa.id_empresa == id_empresa_selecionada,
        )
        .first()
    )

    if not vinculo or not vinculo.empresa or not vinculo.empresa.fl_ativa:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado a esta empresa ou empresa inativa",
        )

    # Cria um NOVO token com a empresa ativa incluída
    new_token_payload = {
        "sub": str(current_user.id_usuario),
        "org": current_user.id_organizacao,
        "role": current_user.tp_usuario,
        "emp_ativa": id_empresa_selecionada,  # <-- A GRANDE MUDANÇA
    }
    access_token = create_access_token(data=new_token_payload)

    # --- CORREÇÃO AQUI: Usando .model_validate() ---
    return SelectCompanyResponse(
        token=Token(access_token=access_token, token_type="bearer"),
        empresa_ativa=EmpresaSchema.model_validate(
            vinculo.empresa, from_attributes=True
        ),
    )


@auth_router.get("/me", response_model=MeResponse)
def get_current_user_session(
    user_data: tuple = Depends(get_current_user_data), db: Session = Depends(get_db)
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
        organizacao=OrganizacaoSchema.model_validate(
            current_user.organizacao, from_attributes=True
        )
        if current_user.organizacao
        else None,
        empresa_ativa=EmpresaSchema.model_validate(empresa_ativa, from_attributes=True)
        if empresa_ativa
        else None,
        empresas_vinculadas=[
            EmpresaSchema.model_validate(emp, from_attributes=True)
            for emp in empresas_vinculadas
        ],
    )


@auth_router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Gera um token de recuperação de senha e envia por email.
    """
    try:
        user = db.query(Usuario).filter(Usuario.ds_email == request.email).first()
        if not user:
            # Por segurança, não informamos se o email existe ou não
            return {
                "message": "Se o email existir, um link de recuperação será enviado."
            }

        # Gera token único
        token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=1)

        # Salva no banco
        recuperacao = RecuperacaoSenha(
            id_usuario=user.id_usuario, ds_token=token, dt_expiracao=expires_at
        )
        db.add(recuperacao)
        db.commit()

        # Monta o link (ajuste a URL do frontend conforme necessário)
        # Em produção, usar variável de ambiente para o domínio do front
        import os

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        reset_link = f"{frontend_url}/redefinir-senha?token={token}"

        # Envia email
        EmailService.send_password_reset_email(
            background_tasks, user.ds_email, reset_link
        )

        return {"message": "Se o email existir, um link de recuperação será enviado."}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar solicitação: {str(e)}",
        )


@auth_router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Redefine a senha usando um token válido.
    """
    try:
        # Busca o token
        recuperacao = (
            db.query(RecuperacaoSenha)
            .filter(RecuperacaoSenha.ds_token == request.token)
            .first()
        )

        if not recuperacao:
            raise HTTPException(status_code=400, detail="Token inválido ou expirado.")

        # Verifica expiração
        if recuperacao.dt_expiracao < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Token expirado.")

        # Busca o usuário
        user = db.get(Usuario, recuperacao.id_usuario)
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        # Atualiza a senha
        user.set_password(request.new_password)

        # Remove o token usado (e outros tokens antigos desse usuário, opcionalmente)
        db.delete(recuperacao)

        db.commit()

        return {"message": "Senha redefinida com sucesso."}

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao redefinir senha: {str(e)}",
        )
