# Sistema de Representação Comercial (RepCom)

Este é um projeto monorepo para um sistema SaaS multi-tenant de representação comercial.

* **/backend**: API em FastAPI (Python)
* **/frontend**: Aplicação em React (Vite + TypeScript + MUI)

---

## 🚀 Stack Tecnológica

### Backend (FastAPI)
* **Framework:** FastAPI
* **Servidor:** Uvicorn (dev), Gunicorn (prod)
* **Banco de Dados:** SQLAlchemy ORM (PostgreSQL em produção, SQLite em dev)
* **Autenticação:** Tokens JWT (via `python-jose`)
* **Validação:** Pydantic

### Frontend (React)
* **Base:** Vite + React + TypeScript
* **UI:** Material-UI (MUI)
* **Roteamento:** `react-router-dom`
* **Gerenciamento de API/Cache:** `TanStack Query` (React Query)
* **Cliente HTTP:** `axios`
* **Formulários:** `React Hook Form` + `Zod`

---

## 1. Configuração do Backend (FastAPI)

O Backend roda na porta `5000`.

1.  **Navegue até a pasta:**
    ```bash
    cd backend
    ```

2.  **Crie o Ambiente Virtual:**
    ```bash
    python -m venv venv
    ```

3.  **Ative o Ambiente Virtual:**
    * **No Windows (CMD ou PowerShell):**
        ```bash
        .\venv\Scripts\activate
        ```
    * **No Windows (Git Bash) ou macOS/Linux:**
        ```bash
        source venv/Scripts/activate
        ```

4.  **Instale as Dependências:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Configurar `.env` Local:**
    Crie um arquivo chamado `.env` dentro da pasta `/backend`.
    ```ini
    # /backend/.env
    
    # Use o caminho absoluto para o seu arquivo .db (use barras /)
    # Ex: DATABASE_URL=sqlite:///C:/Users/SeuUsuario/Projetos/repcom/backend/local_api.db
    DATABASE_URL=sqlite:///C:/COLOQUE/SEU/CAMINHO/ABSOLUTO/AQUI/backend/local_api.db

    # Gere uma chave forte ([https://1password.com/pt-br/password-generator/](https://1password.com/pt-br/password-generator/))
    SECRET_KEY=SUA_CHAVE_SECRETA_ALEATORIA_DE_64_CARACTERES_AQUI
    
    # Flag para rodar o seed de dados (criação de tabelas e usuários admin)
    AMBIENTE=dev 
    ```

6.  **Rodar o Servidor Local (com auto-reload):**
    ```bash
    uvicorn src.main:app --reload --port 5000
    ```
    * A API estará acessível em: `http://127.0.0.1:5000/docs`

---

## 2. Configuração do Frontend (Vite + React)

O Frontend roda na porta `5173`.

1.  **Abra um SEGUNDO terminal.**

2.  **Navegue até a pasta:**
    ```bash
    cd frontend
    ```

3.  **Instale as Dependências:**
    ```bash
    npm install
    ```
    * *Nota: Se você encontrar erros `ERESOLVE` (conflitos de dependência), use o comando alternativo:*
        ```bash
        npm install --legacy-peer-deps
        ```

4.  **Configurar `.env` Local:**
    Crie um arquivo chamado `.env` dentro da pasta `/frontend`.
    ```ini
    # /frontend/.env
    
    # Aponta para a API do Backend que está rodando localmente
    VITE_API_BASE_URL=[http://127.0.0.1:5000/api](http://127.0.0.1:5000/api)
    ```

5.  **Rodar o Servidor de Desenvolvimento:**
    ```bash
    npm run dev
    ```
    * A aplicação estará acessível em: `http://localhost:5173`

---

## 3. Rodando o Projeto (Resumo)

1.  **Terminal 1 (Backend):** `cd backend` -> `.\venv\Scripts\activate` -> `uvicorn src.main:app --reload --port 5000`
2.  **Terminal 2 (Frontend):** `cd frontend` -> `npm run dev`
3.  **Acessar a Aplicação:** `http://localhost:5173`

---

## 4. Configuração de Produção (Deploy no Railway/Supabase)

(Esta seção foi mantida do seu arquivo original)

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