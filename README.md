# Sistema de Representação Comercial (RepCom)

Este é um sistema SaaS multi-tenant para gestão de representação comercial, dividido em um Backend (FastAPI) e um Frontend (Vite).

## Visão Geral da Arquitetura

* **Backend:**
    * Framework: FastAPI
    * Banco de Dados: SQLAlchemy (PostgreSQL em produção, SQLite em desenvolvimento)
    * Autenticação: Tokens JWT
    * Local: `/backend`
* **Frontend:**
    * Framework: React (Vite)
    * Local: `/frontend`

---

## 🚀 Configuração do Ambiente de Desenvolvimento

Siga estes passos para configurar e rodar o projeto em uma nova máquina.

### Pré-requisitos

* [Python](https://www.python.org/downloads/) (v3.11+)
* [Node.js](https://nodejs.org/en) (v18+)

---

### 1. Configuração do Backend (FastAPI)

O Backend roda na porta `5000`.

1.  **Navegue até a pasta do backend:**
    ```bash
    cd backend
    ```

2.  **Crie e Ative um Ambiente Virtual (Venv):**
    ```bash
    # Criar o venv (Windows)
    python -m venv venv
    
    # Ativar o venv (Windows CMD/PowerShell)
    .\venv\Scripts\activate
    
    # Ativar o venv (Git Bash / macOS / Linux)
    source venv/Scripts/activate
    ```

3.  **Instale as Dependências do Python:**
    ```bash
    pip install -r requirements.txt
    ```
    *(Se ocorrer erro no `pydantic[email]`, rode `pip install email-validator` separadamente).*

4.  **Crie o Arquivo de Ambiente (`.env`):**
    Crie um arquivo chamado `.env` dentro da pasta `/backend`. Este arquivo **não** será enviado ao Git e contém suas credenciais locais.

    Copie e cole o conteúdo abaixo no arquivo `backend/.env`:

    ```ini
    # backend/.env

    # --- Configuração do Banco de Dados Local (SQLite) ---
    # Use o caminho absoluto COMPLETO para a pasta /backend do seu projeto.
    # IMPORTANTE: Use barras normais (/) mesmo no Windows.
    # Exemplo (Windows): DATABASE_URL=sqlite:///C:/Users/SeuUsuario/Projetos/representacao-comercial/backend/local_api.db
    # Exemplo (macOS/Linux): DATABASE_URL=sqlite:////Users/SeuUsuario/Projetos/representacao-comercial/backend/local_api.db
    
    DATABASE_URL=sqlite:///C:/COLOQUE/SEU/CAMINHO/ABSOLUTO/AQUI/backend/local_api.db

    # --- Chave Secreta para Tokens JWT ---
    # Use um gerador de chaves online para criar uma string aleatória forte.
    SECRET_KEY=SUA_CHAVE_SECRETA_ALEATORIA_DE_64_CARACTERES_AQUI
    ```

5.  **Rode o Servidor do Backend:**
    ```bash
    uvicorn src.main:app --reload --port 5000
    ```
    * O servidor deve iniciar.
    * Acesse [http://127.0.0.1:5000/docs](http://127.0.0.1:5000/docs) no seu navegador.
    * Ao iniciar, o servidor criará o banco `local_api.db` e executará o *seed* (criando o usuário `gestor@repcom.com`).

---

### 2. Configuração do Frontend (Vite)

O Frontend roda na porta `5173`.

1.  **Abra um SEGUNDO terminal.**

2.  **Navegue até a pasta do frontend:**
    ```bash
    cd frontend
    ```

3.  **Instale as Dependências do Node.js:**
    ```bash
    npm install
    ```
    *(Se você receber erros de dependência (ERESOLVE), use o comando abaixo para ignorar conflitos de peer-deps):*
    ```bash
    npm install --legacy-peer-deps
    ```

4.  **Crie o Arquivo de Ambiente (`.env`):**
    Crie um arquivo chamado `.env` dentro da pasta `/frontend`.

    Copie e cole o conteúdo abaixo no arquivo `frontend/.env`:

    ```ini
    # frontend/.env

    # Aponta para a URL base da API do Backend que está rodando localmente
    VITE_API_BASE_URL=[http://127.0.0.1:5000/api](http://127.0.0.1:5000/api)
    ```

5.  **Rode o Servidor de Desenvolvimento do Frontend:**
    ```bash
    npm run dev
    ```
    * O servidor deve iniciar e abrir [http://localhost:5173](http://localhost:5173) no seu navegador.

---

### ✅ Pronto para Testar!

1.  Acesse [http://127.0.0.1:5000/docs](http://127.0.0.1:5000/docs) para testar a API.
2.  Acesse [http://localhost:5173](http://localhost:5173) para usar a aplicação.

**Credenciais de Teste (Gestor Padrão):**
* **Email:** `gestor@repcom.com`
* **Senha:** `123456`