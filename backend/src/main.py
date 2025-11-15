from decimal import Decimal
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

# Importações da nossa aplicação
from src.database import engine, Base, SessionLocal
from src.models import models  # Importa o models.py
from src.routes.auth import auth_router
from src.routes.utils import utils_router

# Gestor
from src.routes.gestor.logs import gestor_logs_router
from src.routes.gestor.empresas import gestor_empresas_router
from src.routes.gestor.vendedores import gestor_vendedores_router
from src.routes.gestor.clientes import gestor_clientes_router
from src.routes.gestor.produtos import gestor_produtos_router as gestor_catalogo_router
from src.routes.gestor.config import gestor_config_router
from src.routes.gestor.relatorios import gestor_relatorios_router
from src.routes.gestor.pedidos import gestor_pedidos_router

# Admin
from src.routes.admin.organizacoes import admin_orgs_router
from src.routes.admin.logs import admin_logs_router
from src.routes.admin.dashboard import admin_dashboard_router

# Vendedor
from src.routes.vendedor.pedidos import vendedor_pedidos_router
from src.routes.vendedor.catalogo import vendedor_catalogo_router
from src.routes.vendedor.clientes import vendedor_clientes_router
from src.routes.vendedor.dashboard import vendedor_dashboard_router


# --- 1. CRIAÇÃO DAS TABELAS ---
# Isso é o equivalente ao db.create_all() do Flask
# Ele garante que todas as tabelas (TB_USUARIOS, etc.) existam
print("Criando tabelas no banco de dados, se não existirem...")
Base.metadata.create_all(bind=engine)
print("Tabelas criadas com sucesso.")

# --- 2. DEFINIÇÃO DAS TAGS PARA ORDENAÇÃO NO SWAGGER UI ---
tags_metadata = [
    {"name": "1. Autenticação", "description": "Operações de login e sessão."},
    {"name": "2. Gestor - Empresas", "description": "Gerenciamento de empresas."},
    {"name": "3. Gestor - Vendedores", "description": "Gerenciamento de vendedores."},
    {"name": "4. Gestor - Clientes", "description": "Gerenciamento de clientes."},
    {"name": "5. Gestor - Catálogo (Produtos e Preços)", "description": "Gerenciamento de produtos e catálogos."},
    {"name": "6. Gestor - Configurações", "description": "Configurações gerais do gestor."},
    {"name": "7. Gestor - Relatórios", "description": "Relatórios e estatísticas."},
    {"name": "8. Gestor - Pedidos", "description": "Gerenciamento de pedidos."},
    {"name": "9. Gestor - Logs", "description": "Logs e auditoria de ações do gestor."},
    {"name": "10. Vendedor - Pedidos", "description": "Pedidos do vendedor."},
    {"name": "11. Vendedor - Catálogo", "description": "Catálogo de produtos para vendedores."},
    {"name": "12. Vendedor - Clientes", "description": "Clientes do vendedor."},
    {"name": "13. Vendedor - Dashboard", "description": "Dashboard do vendedor."},
    {"name": "14. Super Admin - Organizações", "description": "Gerenciamento de organizações."},
    {"name": "15. Super Admin - Logs", "description": "Logs de sistema."},
    {"name": "16. Super Admin - Dashboard", "description": "Dashboard do administrador."},
    {"name": "Utilitários", "description": "Utilitários e funções auxiliares."},
]

# --- 3. CRIAÇÃO DA APLICAÇÃO FASTAPI ---
app = FastAPI(
    title="API de Representação Comercial",
    description="Backend profissional para o sistema RepCom.",
    version="1.0.0",
    openapi_tags=tags_metadata,  # Define a ordem das tags
)

# --- 4. CONFIGURAÇÃO DO CORS ---
# Lista de origens permitidas (seu frontend)
origins = [
    "http://localhost:5173",  # Frontend Vite local
    "https://representacao-frontend.onrender.com"  # Frontend Produção
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Essencial para cookies/tokens
    allow_methods=["*"],     # Permitir todos os métodos (GET, POST, etc.)
    allow_headers=["*"],     # Permitir todos os headers
)

# --- 5. POPULAÇÃO DE DADOS INICIAIS (SEED) ---
# (Lógica movida do seu antigo main.py para cá, adaptada para FastAPI)
# Isso garante que temos um usuário para testar o login.
def seed_initial_data():
    db: Session = SessionLocal()
    try:
        print("Verificando dados iniciais (seed)...")

        # 1. Verifica/Cria o Super Admin
        super_admin = db.query(models.Usuario).filter(models.Usuario.tp_usuario == 'super_admin').first()
        if not super_admin:
            print("Criando Super Admin padrão...")
            super_admin = models.Usuario(
                id_organizacao=None,
                ds_email="admin@repcom.com",
                tp_usuario="super_admin",
                no_completo="Admin Global",
                fl_ativo=True
            )
            super_admin.set_password("admin123")
            db.add(super_admin)
            db.commit()  # Commit para obter o ID do super_admin

        # 2. Verifica/Cria a Organização Padrão
        org = db.query(models.Organizacao).first()
        if not org:
            print("Nenhuma organização encontrada. Criando Organização Padrão e Gestor...")

            # 2.1. Cria a Organização
            org = models.Organizacao(
                no_organizacao="Organização Padrão (Teste)",
                st_assinatura="ativo",
                tp_plano="premium",
                qt_limite_usuarios=10,
                qt_limite_empresas=10
            )
            db.add(org)
            db.flush()  # Pega o ID da Org

            # 2.2. Cria o Usuário Gestor
            gestor = models.Usuario(
                id_organizacao=org.id_organizacao,
                ds_email="gestor@repcom.com",
                tp_usuario="gestor",
                no_completo="Gestor Padrão",
                fl_ativo=True,
                id_usuario_criador=super_admin.id_usuario
            )
            gestor.set_password("123456")
            db.add(gestor)

            # 2.3. Cria Formas de Pagamento Padrão (Globais)
            payment_methods = [
                models.FormaPagamento(no_forma_pagamento='Dinheiro', fl_ativa=True, id_organizacao=None),
                models.FormaPagamento(no_forma_pagamento='PIX', fl_ativa=True, id_organizacao=None),
            ]
            db.bulk_save_objects(payment_methods)

            # --- 2.4 (NOVO) CRIA DADOS DE TESTE (Empresa, Produto, Catálogo, Preço) ---

            # Cria 1 Empresa Representada (vinculada à Org)
            empresa_teste = models.Empresa(
                id_organizacao=org.id_organizacao,
                no_empresa="Empresa Teste (Sementes)",
                nr_cnpj="00.000.000/0001-00",
                pc_comissao_padrao=5.0
            )
            db.add(empresa_teste)
            db.flush()  # Pega o ID da Empresa

            # Cria 1 Produto (vinculado à Empresa)
            produto_teste = models.Produto(
                id_empresa=empresa_teste.id_empresa,
                cd_produto="PROD-001",
                ds_produto="Produto de Teste (Ex: Camiseta)"
            )
            db.add(produto_teste)
            db.flush()  # Pega o ID do Produto

            # Cria 1 Catálogo (vinculado à Empresa)
            catalogo_teste = models.Catalogo(
                id_empresa=empresa_teste.id_empresa,
                no_catalogo="Lista de Preços Padrão 2025",
                fl_ativo=True  # <-- Marcado como ativo para venda
            )
            db.add(catalogo_teste)
            db.flush()  # Pega o ID do Catálogo

            # Cria 1 Preço (vinculando Produto ao Catálogo)
            item_catalogo = models.ItemCatalogo(
                id_catalogo=catalogo_teste.id_catalogo,
                id_produto=produto_teste.id_produto,
                vl_preco_catalogo=Decimal("120.50")  # Define o preço
            )
            db.add(item_catalogo)

            # --- FIM DO NOVO BLOCO ---

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

# --- 6. INCLUSÃO DAS ROTAS ---
app.include_router(auth_router)
app.include_router(utils_router)

# Admin
app.include_router(admin_orgs_router)
app.include_router(admin_logs_router)
app.include_router(admin_dashboard_router)

# Gestor
app.include_router(gestor_empresas_router)
app.include_router(gestor_vendedores_router)
app.include_router(gestor_clientes_router)
app.include_router(gestor_catalogo_router)
app.include_router(gestor_config_router)
app.include_router(gestor_relatorios_router)
app.include_router(gestor_pedidos_router)
app.include_router(gestor_logs_router)

# Vendedor
app.include_router(vendedor_pedidos_router)
app.include_router(vendedor_catalogo_router)
app.include_router(vendedor_clientes_router)
app.include_router(vendedor_dashboard_router)


# --- 7. ROTA RAIZ (Redireciona para /docs) ---
@app.get("/", include_in_schema=False)
async def root_redirect():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")


# --- 8. EXECUTANDO O SERVIDOR ---
# (Este bloco só é usado se você rodar 'python src/main.py')
if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=5000,
        reload=True  # Ativa o auto-reload (como o debug=True do Flask)
    )