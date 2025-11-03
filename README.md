# Backend API - Sistema de Representação Comercial

Este diretório contém o backend da API para o sistema RepCom, construído com FastAPI e SQLAlchemy.

## Stack Tecnológica

* **Framework:** FastAPI
* **Servidor:** Uvicorn (desenvolvimento), Gunicorn (produção)
* **Banco de Dados:** SQLAlchemy ORM
* **Driver de DB (Produção):** PostgreSQL (via `psycopg2-binary`)
* **Autenticação:** Tokens JWT (via `python-jose`)
* **Validação:** Pydantic

---

## 1. Configuração de Desenvolvimento Local

(Resumo dos passos que já fizemos)

1.  **Criar Ambiente Virtual:**
    ```bash
    cd backend
    python -m venv venv
    source venv/Scripts/activate # (ou ./venv/bin/activate)
    ```

2.  **Instalar Dependências:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configurar `.env` Local:**
    Crie `backend/.env` com sua string de conexão local (SQLite) e uma chave secreta.
    ```ini
    # Use o caminho absoluto para o seu arquivo .db
    DATABASE_URL=sqlite:///C:/Users/SeuUsuario/Projetos/representacao-comercial/backend/local_api.db
    SECRET_KEY=uma_chave_secreta_de_teste_longa_e_aleatoria
    
    # Flag para rodar o seed de dados
    AMBIENTE=dev 
    ```

4.  **Rodar o Servidor Local (com auto-reload):**
    ```bash
    uvicorn src.main:app --reload --port 5000
    ```

---

## 2. Configuração de Produção (Deploy no Railway/Supabase)

O deploy em produção é mais simples, pois depende apenas das variáveis de ambiente e do comando de start.

### A. Preparação do `src/main.py` (IMPORTANTE!)

O nosso `main.py` atualmente executa `Base.metadata.create_all()` e `seed_initial_data()` toda vez que inicia. Isso é ótimo para desenvolvimento, mas **terrível** para produção (você não quer recriar tabelas ou o usuário admin a cada deploy).

Precisamos condicionar isso à variável `AMBIENTE=dev` que definimos no `.env` local.

**Substitua** as seções 4 e 5 do seu `src/main.py`:

```python
# /src/main.py
# ... (importações) ...
import os # <-- Adicione esta importação

# ... (código do app = FastAPI()) ...
# ... (código do CORS) ...

# --- 4. CRIAÇÃO DE TABELAS E SEED (APENAS EM DEV) ---
# Verifica se estamos em ambiente de desenvolvimento (definido no .env local)
if os.getenv("AMBIENTE") == "dev":
    print("MODO DE DESENVOLVIMENTO: Criando tabelas (se não existirem)...")
    Base.metadata.create_all(bind=engine)
    print("Tabelas verificadas.")
    
    # Executa a função de seed
    seed_initial_data()
else:
    print("MODO DE PRODUÇÃO: Conectando ao banco de dados existente.")


# --- 5. INCLUSÃO DAS ROTAS ---
# ... (todo o seu app.include_router(...)) ...