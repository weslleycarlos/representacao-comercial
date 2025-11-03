# /src/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Carrega as variáveis de ambiente (ex: DATABASE_URL do .env)
load_dotenv()

# Pega a URL do banco de dados do ambiente
DATABASE_URL = os.environ.get('DATABASE_URL')

# Se estiver usando SQLite localmente (como fizemos antes)
if not DATABASE_URL:
    # Garante um caminho absoluto para o SQLite local para evitar erros
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__))) # Aponta para a pasta /backend
    DATABASE_URL = f"sqlite:///{os.path.join(base_dir, 'local_api.db')}"
    print(f"Aviso: DATABASE_URL não definida, usando SQLite local em: {DATABASE_URL}")
elif DATABASE_URL.startswith("postgres://"):
     # Corrige o dialeto do Postgres para compatibilidade com SQLAlchemy
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Cria o "Engine" do SQLAlchemy
# connect_args é específico para SQLite para permitir multithreading (necessário para FastAPI)
engine_args = {"connect_args": {"check_same_thread": False}} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, **engine_args)

# Cria uma fábrica de sessões (SessionLocal)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Cria uma classe Base para nossos modelos ORM herdarem
Base = declarative_base()

# --- Função de Dependência (Dependency) ---
# Isso será usado em todas as rotas para obter uma sessão do banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()