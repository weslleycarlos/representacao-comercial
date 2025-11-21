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
* **UI:** Material-UI (MUI) v7
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
    # Ex: DATABASE_URL=sqlite:///C:/Users/SeuUsuario/Projetos/representacao-comercial/backend/local_api.db
    DATABASE_URL=sqlite:///C:/CAMINHO/ABSOLUTO/PARA/backend/local_api.db

    # Gere uma chave forte
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
    * *Nota: Se encontrar erros de dependência, use:* `npm install --legacy-peer-deps`

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

## 3. Acesso e Credenciais (Ambiente Dev)

Ao rodar pela primeira vez com `AMBIENTE=dev`, o sistema cria automaticamente os dados iniciais.

* **Super Admin:**
    * Email: `admin@repcom.com`
    * Senha: `admin123`

* **Gestor Padrão:**
    * Email: `gestor@repcom.com`
    * Senha: `123456`

* **Vendedor Padrão:**
    * Email: `vendedor@repcom.com`
    * Senha: `123456`

---

## 4. Configuração de Produção (Deploy)

Para deploy (ex: Railway, Supabase, Render), siga estas configurações nas variáveis de ambiente do serviço:

### Variáveis de Ambiente (Environment Variables)

* **`DATABASE_URL`**: String de conexão do PostgreSQL (ex: `postgresql://user:pass@host:port/db`).
* **`SECRET_KEY`**: Uma chave secreta forte e única para produção.
* **`AMBIENTE`**: Defina como `prod` (ou deixe vazio). **NÃO** use `dev`, para evitar recriar o banco de dados a cada deploy.

### Comando de Inicialização (Start Command)

O comando para iniciar o backend em produção deve usar o Gunicorn:

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker src.main:app