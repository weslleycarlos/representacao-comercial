# Roadmap do Frontend (RepCom)

Este documento rastreia o progresso do desenvolvimento do frontend, baseado no PRD (documento de requisitos) e nas rotas de API do backend (FastAPI).

## Stack Principal (100% Concluída)

* **Fundação:** Vite + React + TypeScript
* **UI:** Material-UI (MUI) v7 (Foco em Grid v2 e componentes modernos)
* **Roteamento:** React Router DOM
* **Gerenciamento de API:** TanStack Query (React Query)
* **Cliente HTTP:** Axios (com interceptor de Token JWT)
* **Formulários:** React Hook Form + Zod (para validação)
* **Utilitários:** `react-imask` (Máscaras), `date-fns`

---

## ✅ Funcionalidades Concluídas (MVP)

### 1. Fundação e Autenticação
- [x] **Setup do Projeto:** Estrutura de pastas (`api`, `componentes`, `contextos`, `paginas`, etc.).
- [x] **Tema (UI):** Tema escuro (`theme.ts`) implementado como padrão.
- [x] **Autenticação (Context):** `AuthContext` (`useAuth`) para gerenciar estado global de login e troca de empresa.
- [x] **Roteamento (Segurança):** `RotaProtegida.tsx` para proteger rotas por login e por *Papel*.
- [x] **Página de Login:** `PaginaLogin.tsx` funcional e validada.
- [x] **Utilitários de API:** `axios.ts` e `utilsService.ts` (Busca CEP/CNPJ com Proxy no Backend).

### 2. Layouts (Shells da Aplicação)
- [x] **LayoutGestor:** Menu lateral colapsável e correção da borda.
- [x] **LayoutVendedor:** Menu lateral colapsável e modal "Trocar Empresa".
- [x] **LayoutSuperAdmin:** Menu lateral colapsável.

### 3. Perfil: Super Admin
- [x] **Dashboard:** `PaginaAdminDashboard.tsx` (KPIs globais).
- [x] **Gestão de Organizações:** `PaginaAdminOrganizacoes.tsx` (CRUD completo de Tenants).
- [x] **Logs Globais:** `PaginaAdminLogs.tsx` (Visualização de auditoria global).

### 4. Perfil: Gestor
- [x] **Dashboard:** `PaginaDashboardGestor.tsx` (KPIs, Ranking de Vendedores e dados reais).
- [x] **Gestão de Empresas:** `PaginaEmpresas.tsx` (CRUD completo + Busca CNPJ).
- [x] **Gestão de Vendedores:** `PaginaVendedores.tsx` (CRUD + Vínculo com Empresas).
- [x] **Gestão de Clientes:** `PaginaClientes.tsx` (CRUD + Endereços + Contatos + Busca CNPJ/CEP).
- [x] **Gestão de Catálogo:**
    - [x] `PaginaCatalogo.tsx` (Abas).
    - [x] `AbaProdutos.tsx` (Definição de Produtos).
    - [x] `AbaCatalogos.tsx` (Capas de Catálogos e Validação de Datas).
    - [x] `ModalGerenciarItensCatalogo.tsx` (Definição de Preços por Catálogo).
- [x] **Gestão de Pedidos:**
    - [x] `PaginaGestorPedidos.tsx` (Listagem com filtros).
    - [x] `ModalMudarStatus.tsx` (Aprovação/Cancelamento).
    - [x] `ModalDetalhePedido.tsx` (Visualização completa).
- [x] **Configurações:**
    - [x] `AbaFormasPagamento.tsx` (CRUD de Formas de Pagamento).
    - [x] `AbaRegrasComissao.tsx` (CRUD de Regras de Comissão).
- [x] **Relatórios:** `PaginaRelatorios.tsx` (Vendas por Vendedor, Empresa, Cidade, Comissões).
- [x] **Logs:** `PaginaLogs.tsx` (Auditoria da organização).

### 5. Perfil: Vendedor
- [x] **Fluxo de Entrada:** Seleção obrigatória de empresa ativa.
- [x] **Catálogo:** `PaginaVendedorCatalogo.tsx` (Visualização de Produtos com Preços do Catálogo Ativo).
- [x] **Clientes:** `PaginaVendedorClientes.tsx` (Listagem e Cadastro Rápido).
- [x] **Meus Pedidos:** `PaginaVendedorPedidos.tsx` (Listagem e Cancelamento).
- [x] **Novo Pedido (Carrinho):** `ModalNovoPedido.tsx` (Fluxo completo: Cliente -> Catálogo -> Itens -> Totais).
    - [x] Suporte a Grade/Variações (`SeletorGrade.tsx`).
    - [x] Cálculos de totais e descontos em tempo real.
    - [x] Cadastro de Endereço durante o pedido.
- [x] **Dashboard:** `PaginaVendedorDashboard.tsx` (KPIs pessoais).

- [ ] **PDF do Pedido:** Gerar documento PDF para impressão/envio.
- [ ] **Notificações em Tempo Real:** Avisar o Gestor quando entra um pedido novo.
- [ ] **Gráficos Avançados:** Substituir os gráficos CSS atuais por biblioteca `recharts`.
- [ ] **Metas:** Sistema de definição de metas para vendedores.
- [ ] **PWA:** Tornar o aplicativo instalável e com cache offline básico.