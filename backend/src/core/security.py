# /src/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from src.core.config import settings
from src.database import get_db
from src.models.models import Usuario
from src.schemas import TokenData


# Define o esquema de autenticação como "Bearer Token"
bearer_scheme = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Cria um novo token JWT.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user_data(
    auth: HTTPAuthorizationCredentials = Depends(bearer_scheme), 
    db: Session = Depends(get_db)
) -> (Usuario, TokenData):
    """
    Dependência principal de autenticação.
    Decodifica o token (extraído do header "Authorization: Bearer <token>"), 
    valida os dados e retorna o (Usuário do DB, Dados do Token).
    """
    token = auth.credentials # Extrai o token do "Bearer <token>"

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception

        token_data = TokenData(
            id_usuario=int(user_id),
            id_organizacao=payload.get("org"),
            tp_usuario=payload.get("role"),
            id_empresa_ativa=payload.get("emp_ativa")
        )

    except (JWTError, ValueError):
        raise credentials_exception

    user = db.get(Usuario, token_data.id_usuario)

    if user is None or not user.fl_ativo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado ou desativado"
        )

    return user, token_data

async def get_current_user(data: tuple = Depends(get_current_user_data)) -> Usuario:
    """ Dependência simples que retorna apenas o modelo do Usuário. """
    user, _ = data
    return user

async def get_current_active_gestor(user: Usuario = Depends(get_current_user)) -> Usuario:
    """ Dependência que exige que o usuário seja 'gestor' ou 'super_admin'. """
    if user.tp_usuario not in ('gestor', 'super_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a gestores ou administradores."
        )
    return user

async def get_current_gestor_org_id(data: tuple = Depends(get_current_user_data)) -> int:
    """
    Dependência que valida se o usuário é 'gestor' ou 'super_admin'
    e retorna o ID da sua organização.
    """
    user, token_data = data
    
    if user.tp_usuario not in ('gestor', 'super_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a gestores ou administradores."
        )
    
    if not token_data.id_organizacao:
        # Isso pode acontecer se for um super_admin sem organização
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID da organização não encontrado no token da sessão."
        )
        
    return token_data.id_organizacao

async def get_current_vendedor_contexto(data: tuple = Depends(get_current_user_data)) -> (int, int, int):
    """
    Dependência que valida se o usuário é 'vendedor'
    E se ele possui uma 'empresa ativa' selecionada no token.
    Retorna: (id_usuario, id_organizacao, id_empresa_ativa)
    """
    user, token_data = data
    
    if user.tp_usuario != 'vendedor':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a vendedores."
        )
    
    if not token_data.id_empresa_ativa:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhuma empresa ativa selecionada. Faça o POST /api/auth/select-company primeiro."
        )
        
    return token_data.id_usuario, token_data.id_organizacao, token_data.id_empresa_ativa