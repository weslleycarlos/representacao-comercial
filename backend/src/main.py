# /src/main.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

# Importações da nossa aplicação
from src.database import engine, Base, SessionLocal
from src.models import models # Importa o models.py
from src.routes.auth import auth_router
from src.routes.gestor.empresas import gestor_empresas_router
from src.routes.gestor.vendedores import gestor_vendedores_router
from src.routes.gestor.clientes import gestor_clientes_router
from src.routes.gestor.produtos import gestor_produtos_router
from src.routes.vendedor.pedidos import vendedor_pedidos_router
# (Importaremos os outros routers aqui no futuro)

# --- 1. CRIAÇÃO DAS TABELAS ---
# Isso é o equivalente ao db.create_all() do Flask
# Ele garante que todas as tabelas (TB_USUARIOS, etc.) existam
print("Criando tabelas no banco de dados, se não existirem...")
Base.metadata.create_all(bind=engine)
print("Tabelas criadas com sucesso.")

# --- 2. CRIAÇÃO DA APLICAÇÃO FASTAPI ---
app = FastAPI(
    title="API de Representação Comercial",
    description="Backend profissional para o sistema RepCom.",
    version="1.0.0"
)

# --- 3. CONFIGURAÇÃO DO CORS ---
# Lista de origens permitidas (seu frontend)
origins = [
    "http://localhost:5173", # Frontend Vite local
    "https://representacao-frontend.onrender.com" # Frontend Produção
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # Essencial para cookies/tokens
    allow_methods=["*"],    # Permitir todos os métodos (GET, POST, etc.)
    allow_headers=["*"],    # Permitir todos os headers
)

# --- 4. POPULAÇÃO DE DADOS INICIAIS (SEED) ---
# (Lógica movida do seu antigo main.py para cá, adaptada para FastAPI)
# Isso garante que temos um usuário para testar o login.
def seed_initial_data():
    db: Session = SessionLocal()
    try:
        print("Verificando dados iniciais (seed)...")
        # Verifica se já existe uma organização
        org = db.query(models.Organizacao).first()
        if org is None:
            print("Nenhuma organização encontrada. Criando dados iniciais...")
            
            # 1. Cria a Organização
            org = models.Organizacao(
                no_organizacao="Organização Padrão",
                st_assinatura="ativo",
                tp_plano="premium"
            )
            db.add(org)
            db.flush() # Garante que org.id_organizacao esteja disponível

            # 2. Cria o Usuário Gestor
            gestor = models.Usuario(
                id_organizacao=org.id_organizacao,
                ds_email="gestor@repcom.com", # Email de teste
                tp_usuario="gestor",
                no_completo="Gestor Padrão",
                fl_ativo=True
            )
            gestor.set_password("123456") # Senha de teste
            db.add(gestor)
            
            # 3. Cria Formas de Pagamento Padrão (Globais)
            payment_methods = [
                models.FormaPagamento(no_forma_pagamento='Dinheiro', fl_ativa=True, id_organizacao=None),
                models.FormaPagamento(no_forma_pagamento='Cartão de Crédito', fl_ativa=True, id_organizacao=None),
                models.FormaPagamento(no_forma_pagamento='PIX', fl_ativa=True, id_organizacao=None),
                models.FormaPagamento(no_forma_pagamento='Boleto', fl_ativa=True, id_organizacao=None)
            ]
            db.bulk_save_objects(payment_methods)
            
            db.commit()
            print("Dados iniciais criados com sucesso.")
        else:
            print("Banco de dados já populado.")
            
    except Exception as e:
        print(f"Erro ao popular dados: {e}")
        db.rollback()
    finally:
        db.close()

# Executa a função de seed na inicialização
seed_initial_data()

# --- 5. INCLUSÃO DAS ROTAS ---
app.include_router(auth_router)
app.include_router(gestor_empresas_router)
app.include_router(gestor_vendedores_router)
app.include_router(gestor_clientes_router)
app.include_router(gestor_produtos_router)
app.include_router(vendedor_pedidos_router)
# (Incluiremos os outros routers aqui)

# --- 6. ROTA RAIZ (Redireciona para /docs) ---
@app.get("/", include_in_schema=False)
async def root_redirect():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")

# --- 7. EXECUTANDO O SERVIDOR ---
# (Este bloco só é usado se você rodar 'python src/main.py')
if __name__ == "__main__":
    uvicorn.run(
        "src.main:app", 
        host="0.0.0.0", 
        port=5000, 
        reload=True # Ativa o auto-reload (como o debug=True do Flask)
    )