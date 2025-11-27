# /backend/src/main.py
from dotenv import load_dotenv
load_dotenv()
import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
from decimal import Decimal

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
from src.routes.vendedor.config import vendedor_config_router


# --- DEFINIÇÃO DAS TAGS PARA ORDENAÇÃO NO SWAGGER UI ---
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

# --- CRIAÇÃO DA APLICAÇÃO FASTAPI ---
app = FastAPI(
    title="API de Representação Comercial",
    description="Backend profissional para o sistema RepCom.",
    version="1.0.0",
    openapi_tags=tags_metadata,  # Define a ordem das tags
)

# --- CONFIGURAÇÃO DO CORS ---
origins = [
    "http://localhost:5173",  # Frontend Vite local
    "https://representacao-frontend.onrender.com"  # Frontend Produção
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- FUNÇÃO PARA CRIAR TRIGGERS (LOGS AUTOMÁTICOS) ---
def create_sqlite_triggers(db: Session):
    """
    Cria triggers no SQLite para popular a TB_LOGS_AUDITORIA automaticamente.
    """
    print("Verificando/Criando Triggers de Auditoria...")
    
    # Trigger: Insert Pedido
    db.execute(text("""
    CREATE TRIGGER IF NOT EXISTS tg_log_pedido_ins AFTER INSERT ON TB_PEDIDOS
    BEGIN
        INSERT INTO TB_LOGS_AUDITORIA (TP_ENTIDADE, ID_ENTIDADE, TP_ACAO, DT_ACAO, ID_USUARIO, ID_ORGANIZACAO)
        VALUES (
            'Pedido', 
            NEW.ID_PEDIDO, 
            'CREATE', 
            datetime('now'), 
            NEW.ID_USUARIO,
            (SELECT ID_ORGANIZACAO FROM TB_EMPRESAS WHERE ID_EMPRESA = NEW.ID_EMPRESA)
        );
    END;
    """))
    
    # Trigger: Update Pedido (Mudança de Status)
    db.execute(text("""
    CREATE TRIGGER IF NOT EXISTS tg_log_pedido_upd AFTER UPDATE ON TB_PEDIDOS
    WHEN OLD.ST_PEDIDO <> NEW.ST_PEDIDO
    BEGIN
        INSERT INTO TB_LOGS_AUDITORIA (TP_ENTIDADE, ID_ENTIDADE, TP_ACAO, DT_ACAO, ID_USUARIO, ID_ORGANIZACAO, DS_VALORES_ANTIGOS, DS_VALORES_NOVOS)
        VALUES (
            'Pedido', 
            NEW.ID_PEDIDO, 
            'UPDATE_STATUS', 
            datetime('now'), 
            NEW.ID_USUARIO,
            (SELECT ID_ORGANIZACAO FROM TB_EMPRESAS WHERE ID_EMPRESA = NEW.ID_EMPRESA),
            json_object('status', OLD.ST_PEDIDO),
            json_object('status', NEW.ST_PEDIDO)
        );
    END;
    """))
    
    db.commit()
    print("Triggers de auditoria criados com sucesso.")


def create_sqlite_views(db: Session):
    """
    (Apenas SQLite) Cria as Views necessárias para os Dashboards.
    Usa 'date(..., 'start of month')' para garantir compatibilidade de datas.
    """
    print("Recriando Views no SQLite...")
    
    views = [
        "VW_VENDAS_VENDEDOR_MES", 
        "VW_COMISSOES_CALCULADAS", 
        "VW_VENDAS_EMPRESA_MES", 
        "VW_VENDAS_POR_CIDADE"
    ]
    for view in views:
        try: db.execute(text(f"DROP VIEW IF EXISTS {view}"))
        except: pass
        try: db.execute(text(f"DROP TABLE IF EXISTS {view}"))
        except: pass
        
    # 1. View: Vendas por Vendedor
    # (Usa datetime(..., 'start of month') para gerar 'YYYY-MM-01 00:00:00')
    db.execute(text("""
    CREATE VIEW VW_VENDAS_VENDEDOR_MES AS
    SELECT 
        u.ID_USUARIO,
        u.NO_COMPLETO AS NO_VENDEDOR,
        u.ID_ORGANIZACAO,
        datetime(p.DT_PEDIDO, 'start of month') AS DT_MES_REFERENCIA,
        COUNT(p.ID_PEDIDO) AS QT_PEDIDOS,
        SUM(p.VL_TOTAL) AS VL_TOTAL_VENDAS,
        AVG(p.VL_TOTAL) AS VL_TICKET_MEDIO
    FROM TB_USUARIOS u
    INNER JOIN TB_PEDIDOS p ON u.ID_USUARIO = p.ID_USUARIO
    WHERE u.TP_USUARIO = 'vendedor' AND p.ST_PEDIDO != 'cancelado'
    GROUP BY u.ID_USUARIO, u.NO_COMPLETO, u.ID_ORGANIZACAO, datetime(p.DT_PEDIDO, 'start of month');
    """))

    # 2. View: Vendas por Empresa
    db.execute(text("""
    CREATE VIEW VW_VENDAS_EMPRESA_MES AS
    SELECT 
        e.ID_EMPRESA,
        e.NO_EMPRESA,
        e.ID_ORGANIZACAO,
        datetime(p.DT_PEDIDO, 'start of month') AS DT_MES_REFERENCIA,
        COUNT(p.ID_PEDIDO) AS QT_PEDIDOS,
        SUM(p.VL_TOTAL) AS VL_TOTAL_VENDAS,
        COUNT(DISTINCT p.ID_CLIENTE) AS QT_CLIENTES_ATENDIDOS
    FROM TB_EMPRESAS e
    INNER JOIN TB_PEDIDOS p ON e.ID_EMPRESA = p.ID_EMPRESA
    WHERE p.ST_PEDIDO != 'cancelado'
    GROUP BY e.ID_EMPRESA, e.NO_EMPRESA, e.ID_ORGANIZACAO, datetime(p.DT_PEDIDO, 'start of month');
    """))
    
    # 3. View: Vendas por Cidade
    db.execute(text("""
    CREATE VIEW VW_VENDAS_POR_CIDADE AS
    SELECT 
        en.NO_CIDADE,
        en.SG_ESTADO,
        c.ID_ORGANIZACAO,
        datetime(p.DT_PEDIDO, 'start of month') AS DT_MES_REFERENCIA,
        COUNT(p.ID_PEDIDO) AS QT_PEDIDOS,
        SUM(p.VL_TOTAL) AS VL_TOTAL_VENDAS
    FROM TB_PEDIDOS p
    INNER JOIN TB_CLIENTES c ON p.ID_CLIENTE = c.ID_CLIENTE
    INNER JOIN TB_ENDERECOS en ON p.ID_ENDERECO_ENTREGA = en.ID_ENDERECO
    WHERE p.ST_PEDIDO != 'cancelado'
    GROUP BY en.NO_CIDADE, en.SG_ESTADO, c.ID_ORGANIZACAO, datetime(p.DT_PEDIDO, 'start of month');
    """))

    # 4. View: Comissões (Mantida, pois já funcionava)
    db.execute(text("""
    CREATE VIEW VW_COMISSOES_CALCULADAS AS
    SELECT 
        p.ID_PEDIDO,
        p.NR_PEDIDO,
        p.ID_USUARIO,
        u.NO_COMPLETO AS NO_VENDEDOR,
        p.ID_EMPRESA,
        e.NO_EMPRESA,
        p.VL_TOTAL,
        COALESCE(e.PC_COMISSAO_PADRAO, 0) AS PC_COMISSAO_APLICADA,
        (p.VL_TOTAL * COALESCE(e.PC_COMISSAO_PADRAO, 0) / 100) AS VL_COMISSAO_CALCULADA,
        p.DT_PEDIDO
    FROM TB_PEDIDOS p
    INNER JOIN TB_USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
    INNER JOIN TB_EMPRESAS e ON p.ID_EMPRESA = e.ID_EMPRESA
    WHERE p.ST_PEDIDO != 'cancelado';
    """))

    db.commit()
    print("Views SQLite recriadas com sucesso.")

# --- POPULAÇÃO DE DADOS INICIAIS (SEED COMPLETO) ---
def seed_initial_data():
    db: Session = SessionLocal()
    try:
        print("Verificando dados iniciais (seed)...")

        # 1. SUPER ADMIN (Global)
        super_admin = db.query(models.Usuario).filter(models.Usuario.tp_usuario == 'super_admin').first()
        if not super_admin:
            print("Criando Super Admin...")
            super_admin = models.Usuario(
                id_organizacao=None,
                ds_email="admin@repcom.com",
                tp_usuario="super_admin",
                no_completo="Super Administrador",
                fl_ativo=True
            )
            super_admin.set_password("admin123")
            db.add(super_admin)
            db.commit()

        # 2. ORGANIZAÇÃO (Tenant)
        org = db.query(models.Organizacao).first()
        if not org:
            print("Criando Organização e ecossistema completo...")

            org = models.Organizacao(
                no_organizacao="Organização Modelo (Demo)",
                nr_cnpj="00.000.000/0001-91",
                st_assinatura="ativo",
                tp_plano="premium",
                qt_limite_usuarios=50,
                qt_limite_empresas=20
            )
            db.add(org)
            db.flush()

            # 3. USUÁRIOS DA ORGANIZACAO
            gestor = models.Usuario(
                id_organizacao=org.id_organizacao,
                ds_email="gestor@repcom.com",
                tp_usuario="gestor",
                no_completo="Gestor da Silva",
                fl_ativo=True,
                id_usuario_criador=super_admin.id_usuario
            )
            gestor.set_password("123456")
            db.add(gestor)

            vendedor = models.Usuario(
                id_organizacao=org.id_organizacao,
                ds_email="vendedor@repcom.com",
                tp_usuario="vendedor",
                no_completo="Vendedor Campeão",
                fl_ativo=True,
                id_usuario_criador=super_admin.id_usuario
            )
            vendedor.set_password("123456")
            db.add(vendedor)
            db.flush()

            # 4. CONFIGURAÇÕES GERAIS
            cats = [
                models.CategoriaProduto(no_categoria="Roupas Masculinas", id_organizacao=org.id_organizacao),
                models.CategoriaProduto(no_categoria="Roupas Femininas", id_organizacao=org.id_organizacao),
                models.CategoriaProduto(no_categoria="Calçados", id_organizacao=org.id_organizacao),
                models.CategoriaProduto(no_categoria="Acessórios", id_organizacao=org.id_organizacao),
            ]
            db.bulk_save_objects(cats)

            pgtos = [
                models.FormaPagamento(no_forma_pagamento='Dinheiro', fl_ativa=True, id_organizacao=None),
                models.FormaPagamento(no_forma_pagamento='PIX', fl_ativa=True, id_organizacao=None),
                models.FormaPagamento(no_forma_pagamento='Boleto 30 Dias', fl_ativa=True, id_organizacao=org.id_organizacao),
                models.FormaPagamento(no_forma_pagamento='Cartão Crédito', fl_ativa=True, id_organizacao=None),
            ]
            db.bulk_save_objects(pgtos)
            db.flush()

            # 5. EMPRESA E PRODUTOS
            empresa = models.Empresa(
                id_organizacao=org.id_organizacao,
                no_empresa="Moda Fashion Ltda",
                nr_cnpj="12.345.678/0001-00",
                pc_comissao_padrao=10.0
            )
            db.add(empresa)
            db.flush()

            vinculo = models.UsuarioEmpresa(
                id_usuario=vendedor.id_usuario,
                id_empresa=empresa.id_empresa
            )
            db.add(vinculo)

            prods = [
                models.Produto(id_empresa=empresa.id_empresa, cd_produto="CAM-001", ds_produto="Camiseta Básica Algodão", sg_unidade_medida="UN", id_categoria=1),
                models.Produto(id_empresa=empresa.id_empresa, cd_produto="CAL-JEANS", ds_produto="Calça Jeans Slim", sg_unidade_medida="UN", id_categoria=1),
                models.Produto(id_empresa=empresa.id_empresa, cd_produto="VEST-FLO", ds_produto="Vestido Floral Verão", sg_unidade_medida="UN", id_categoria=2),
                models.Produto(id_empresa=empresa.id_empresa, cd_produto="TEN-RUN", ds_produto="Tênis Running Pro", sg_unidade_medida="PAR", id_categoria=3),
            ]
            for p in prods:
                db.add(p)
            db.flush()

            # 6. CATÁLOGO E PREÇOS
            catalogo = models.Catalogo(
                id_empresa=empresa.id_empresa,
                no_catalogo="Coleção Verão 2025",
                ds_descricao="Preços vigentes para a temporada",
                dt_inicio_vigencia=datetime.utcnow(),
                dt_fim_vigencia=datetime.utcnow() + timedelta(days=180),
                fl_ativo=True
            )
            db.add(catalogo)
            db.flush()

            itens_catalogo = [
                models.ItemCatalogo(id_catalogo=catalogo.id_catalogo, id_produto=prods[0].id_produto, vl_preco_catalogo=Decimal("49.90")),
                models.ItemCatalogo(id_catalogo=catalogo.id_catalogo, id_produto=prods[1].id_produto, vl_preco_catalogo=Decimal("129.90")),
                models.ItemCatalogo(id_catalogo=catalogo.id_catalogo, id_produto=prods[2].id_produto, vl_preco_catalogo=Decimal("199.00")),
                models.ItemCatalogo(id_catalogo=catalogo.id_catalogo, id_produto=prods[3].id_produto, vl_preco_catalogo=Decimal("299.50")),
            ]
            for item in itens_catalogo:
                db.add(item)

            # 7. CLIENTE E PEDIDO EXEMPLO
            cliente = models.Cliente(
                id_organizacao=org.id_organizacao,
                no_razao_social="Loja do Centro S.A.",
                no_fantasia="Magazine Centro",
                nr_cnpj="99.888.777/0001-66",
                ds_email="compras@lojacentro.com.br",
                nr_telefone="(11) 99999-8888"
            )
            db.add(cliente)
            db.flush()

            endereco = models.Endereco(
                id_cliente=cliente.id_cliente,
                tp_endereco="entrega",
                ds_logradouro="Rua Principal",
                nr_endereco="1000",
                no_bairro="Centro",
                no_cidade="São Paulo",
                sg_estado="SP",
                nr_cep="01000-000",
                fl_principal=True
            )
            db.add(endereco)
            db.flush()

            contato = models.Contato(
                id_cliente=cliente.id_cliente,
                no_contato="Sr. João",
                ds_cargo="Gerente",
                fl_principal=True
            )
            db.add(contato)
            db.flush()

            pedido = models.Pedido(
                id_usuario=vendedor.id_usuario,
                id_empresa=empresa.id_empresa,
                id_cliente=cliente.id_cliente,
                id_endereco_entrega=endereco.id_endereco,
                id_endereco_cobranca=endereco.id_endereco,
                id_forma_pagamento=3,  # Boleto 30 Dias
                vl_total=Decimal("758.80"),
                st_pedido="pendente",
                ds_observacoes="Pedido de teste gerado automaticamente.",
                dt_pedido=datetime.utcnow()
            )
            db.add(pedido)
            db.flush()

            itens_pedido = [
                models.ItemPedido(
                    id_pedido=pedido.id_pedido,
                    id_produto=prods[0].id_produto,
                    qt_quantidade=10,
                    vl_unitario=Decimal("49.90"),
                    vl_total_item=Decimal("499.00")
                ),
                models.ItemPedido(
                    id_pedido=pedido.id_pedido,
                    id_produto=prods[1].id_produto,
                    qt_quantidade=2,
                    vl_unitario=Decimal("129.90"),
                    vl_total_item=Decimal("259.80")
                )
            ]
            for ip in itens_pedido:
                db.add(ip)

            # Comissão
            comissao = models.ComissaoPedido(
                id_pedido=pedido.id_pedido,
                id_usuario=vendedor.id_usuario,
                pc_comissao=10.0,
                vl_comissao=Decimal("75.88")
            )
            db.add(comissao)

            db.commit()
            print("Dados de teste completos criados com sucesso!")
        else:
            print("Banco de dados já populado.")

    except Exception as e:
        print(f"Erro ao popular dados: {e}")
        db.rollback()
    finally:
        db.close()


# --- INICIALIZAÇÃO CONDICIONAL (APENAS EM DESENVOLVIMENTO) ---
if os.getenv("AMBIENTE") == "dev":
    print("🔧 MODO DE DESENVOLVIMENTO ATIVADO")
    # 1. Cria as tabelas
    print("Criando tabelas no banco de dados, se não existirem...")
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas com sucesso.")

    # 2. Se for SQLite, corrige as views e cria triggers
    if 'sqlite' in str(engine.url).lower():
        db = SessionLocal()
        try:
            create_sqlite_views(db)
            create_sqlite_triggers(db)  # <-- NOVA FUNÇÃO ADICIONADA
        finally:
            db.close()

    # 3. Popula os dados iniciais
    seed_initial_data()


# --- INCLUSÃO DAS ROTAS ---
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
app.include_router(vendedor_config_router)


# --- ROTA RAIZ ---
@app.get("/", include_in_schema=False)
async def root_redirect():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")


# --- EXECUÇÃO ---
if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=5000,
        reload=True
    )