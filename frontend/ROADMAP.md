# Roadmap do Frontend (RepCom)

Este documento rastreia o progresso do desenvolvimento do frontend, baseado no PRD (documento de requisitos) e nas rotas de API do backend (FastAPI).

## Stack Principal (100% Concluída)

* **Fundação:** Vite + React + TypeScript
* **UI:** Material-UI (MUI) v7 (com Tema Escuro)
* **Roteamento:** React Router DOM
* **Gerenciamento de API:** TanStack Query (React Query)
* **Cliente HTTP:** Axios (com interceptor de Token JWT)
* **Formulários:** React Hook Form + Zod (para validação)
* **Utilitários:** `react-imask` (Máscaras), `date-fns` (ou similar, se necessário)

---

## ✅ Funcionalidades Concluídas (MVP)

### 1. Fundação e Autenticação
- [x] **Setup do Projeto:** Estrutura de pastas (`api`, `componentes`, `contextos`, `paginas`, etc.).
- [x] **Tema (UI):** Tema escuro (`theme.ts`) implementado como padrão.
- [x] **Autenticação (Context):** `AuthContext` (`useAuth`) para gerenciar estado global de login.
- [x] **Roteamento (Base):** `App.tsx` configurado com `react-router-dom`.
- [x] **Roteamento (Segurança):** `RotaProtegida.tsx` para proteger rotas por login e por *Papel* (`tp_usuario`).
- [x] **Página de Login:** `PaginaLogin.tsx` funcional, com validação (Zod) e chamada de API (`useLogin`).
- [x] **Utilitários de API:** `axios.ts` (com interceptor de Bearer Token) e `utilsService.ts` (Busca CEP/CNPJ).

### 2. Layouts (Shells da Aplicação)
- [x] **LayoutGestor:** Menu lateral colapsável (mini-variant) e correção da borda (TOC) com a AppBar.
- [x] **LayoutVendedor:** Menu lateral colapsável, correção da borda e modal "Trocar Empresa" (UX melhorada).
- [x] **LayoutSuperAdmin:** Menu lateral colapsável e correção da borda.

### 3. Perfil: Super Admin
- [x] **Dashboard:** `PaginaAdminDashboard.tsx` (KPIs globais via `useGetAdminKpis`).

### 4. Perfil: Gestor
- [x] **Dashboard:** `PaginaDashboardGestor.tsx` (KPIs da organização via `useGetGestorKpis`).
- [x] **Gestão de Empresas:** `PaginaEmpresas.tsx` (CRUD completo com `DataGrid` e `ModalFormEmpresa`).
- [x] **Gestão de Vendedores:** `PaginaVendedores.tsx` (CRUD de Vendedores + Modal de Vínculo N:N com Empresas).
- [x] **Gestão de Clientes:** `PaginaClientes.tsx` (CRUD de Clientes + Sub-CRUDs de Endereços/Contatos com busca de API).
- [x] **Gestão de Catálogo (Completo):**
    - [x] `PaginaCatalogo.tsx` (Layout de Abas).
    - [x] `AbaProdutos.tsx` (CRUD de Definição de Produto).
    - [x] `AbaCatalogos.tsx` (CRUD de "Capas" de Catálogo).
    - [x] `ModalGerenciarItensCatalogo.tsx` (CRUD de Preços / Itens do Catálogo).

### 5. Perfil: Vendedor
- [x] **Página de Seleção:** `PaginaSelecionarEmpresa.tsx` (guarda-costas se `empresaAtiva` for `null`).
- [x] **Catálogo:** `PaginaVendedorCatalogo.tsx` (Visão de Cards e Tabela, com filtros, lendo da API de Catálogo).
- [x] **Clientes:** `PaginaVendedorClientes.tsx` (Listagem e "Cadastro Rápido" reutilizando `ModalFormCliente`).

---

## ⬜ Funcionalidades Pendentes (Próximas Etapas)

### 1. Perfil: VENDEDOR (Prioridade Alta)
O fluxo principal do Vendedor (criar um pedido) ainda não foi implementado.

- [ ] **Criar Pedido (Formulário)** (`/vendedor/pedidos/novo`):
    - [x] Criar a `PaginaNovoPedido.tsx`.
    - [ ] UI do "Carrinho de Compras" (Adicionar/Remover itens do catálogo).
    - [ ] UI para selecionar Cliente, Endereço de Entrega, Endereço de Cobrança.
    - [ ] UI para selecionar Forma de Pagamento.
    - [ ] Lógica para aplicar `pc_desconto` (item e pedido).
    - [ ] Chamar `useCreatePedido` (que já refatoramos no backend para calcular preços).

- [ ] **Meus Pedidos (Lista)** (`/vendedor/pedidos`):
    - [ ] Substituir o placeholder `<h1>` pela `PaginaMeusPedidos.tsx`.
    - [ ] Tabela (`DataGrid`) usando `useGetMeusPedidos` (API `GET /api/vendedor/pedidos/`).
    - [ ] Criar `ModalDetalhePedido.tsx` (para ver um pedido específico).
    - [ ] Implementar a lógica de `Cancelar Pedido` (API `POST /vendedor/pedidos/{id}/cancelar`).

- [ ] **Dashboard (KPIs)** (`/vendedor/dashboard`):
    - [ ] Substituir o placeholder `<h1>` pela `PaginaVendedorDashboard.tsx`.
    - [ ] Usar `useGetVendedorKpis` para exibir os `StatCard` (Vendas do Mês, Comissões, etc.).

### 2. Perfil: GESTOR (Prioridade Média)
Finalizar as telas de gerenciamento.

- [ ] **Gestão de Pedidos** (`/gestor/pedidos`):
    - [ ] Substituir o placeholder `<h1>` pela `PaginaGestorPedidos.tsx`.
    - [ ] `DataGrid` (com filtros) para `GET /api/gestor/pedidos/`.
    - [ ] Criar o modal/lógica principal para **Mudar Status** (API `PUT /.../status`).

- [ ] **Configurações** (`/gestor/configuracoes`):
    - [ ] Substituir o placeholder `<h1>` pela `PaginaConfiguracoes.tsx`.
    - [ ] **Aba 1:** CRUD para `TB_FORMAS_PAGAMENTO` (API `.../config/formas-pagamento`).
    - [ ] **Aba 2:** CRUD para `TB_REGRAS_COMISSAO` (API `.../config/regras-comissao`). (Esta UI será complexa).

- [ ] **Relatórios** (`/gestor/relatorios`):
    - [ ] Substituir o placeholder `<h1>` pela `PaginaRelatorios.tsx`.
    - [ ] UI (Tabelas, Filtros de Data) para as APIs das *Views* (Vendas/Vendedor, Vendas/Empresa, etc.).

- [ ] **Logs** (`/gestor/logs`):
    - [ ] Substituir o placeholder `<h1>` pela `PaginaLogs.tsx` (UI para `GET /api/gestor/logs`).

### 3. Perfil: SUPER ADMIN (Prioridade Média)
Finalizar o painel SaaS.

- [ ] **Gestão de Organizações** (`/admin/organizacoes`):
    - [ ] Substituir o placeholder `<h1>` pela `PaginaAdminOrganizacoes.tsx`.
    - [ ] `DataGrid` (API `GET /api/admin/organizacoes`).
    - [ ] Modal/Formulário para Criar/Editar Organização + Gestor (API `POST` e `PUT`).

- [ ] **Logs** (`/admin/logs`):
    - [ ] Substituir o placeholder `<h1>` pela `PaginaAdminLogs.tsx` (UI para `GET /api/admin/logs`).

---

## 🌟 Fase 2 (Pós-MVP)
(Funcionalidades desejáveis do PRD que não estão no fluxo principal)

- [ ] **Gráficos:** Adicionar gráficos (Recharts/Chart.js) aos dashboards (Gestor e Vendedor).
- [ ] **Notificações:** Implementar `socket.io` (ou Realtime do Supabase) para notificações.
- [ ] **PDFs:** Gerar PDF do Pedido (com `jsPDF`).
- [ ] **Imagens:** Lógica de Upload de Imagens de Produto.
- [ ] **Metas:** UI para definir e acompanhar metas de Vendedores.
- [ ] **PWA:** Configurar o Vite para modo PWA (Vendedor offline).