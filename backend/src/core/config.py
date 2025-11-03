# /src/core/config.py
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Carrega o .env da raiz do backend
# (Assume que o .env está na pasta 'backend', um nível acima de 'src')
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    """
    Configurações da aplicação carregadas do ambiente.
    """
    # Chave secreta para assinar os tokens JWT
    # (No seu .env, crie uma SECRET_KEY longa e aleatória)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "hjP2avgsctKsYjiQ")
    
    # Algoritmo de assinatura do JWT
    ALGORITHM: str = "HS256"
    
    # Tempo de expiração do token (em minutos)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 dias

    # URL do Banco de Dados (carregada pelo database.py, mas bom ter aqui)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

# Instância única das configurações
settings = Settings()