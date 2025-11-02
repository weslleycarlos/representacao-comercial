.\venv\Scripts\activate
flask run

pnpm run dev

Plano de Melhorias - Sistema de Representação Comercial
Este documento descreve as próximas funcionalidades e melhorias a serem implementadas no sistema, organizadas por ordem de prioridade para agregar o máximo de valor em cada etapa.
Prioridade 1: Funcionalidades Essenciais Incompletas (Crítico)
Estas são as funcionalidades que completam os fluxos de trabalho já iniciados, tornando a aplicação plenamente operacional.
1.1. Gerenciamento de Status de Pedidos
O que é? Permitir que um administrador altere o status de um pedido de "Pendente" para "Concluído" ou "Cancelado".
Por que é importante? É a etapa final do ciclo de vida de uma venda, essencial para o controle e para futuros relatórios. Atualmente, todos os pedidos ficam como "Pendentes" para sempre.
Como implementar?
Backend: Criar um endpoint PUT /api/orders/<id>/status que aceita um novo status.
Frontend: Na página de detalhes do pedido (OrderDetailPage), adicionar botões (ex: "Marcar como Concluído") que chamam este novo endpoint.
1.2. Funcionalidade de Edição nos Módulos
O que é? Implementar os formulários e a lógica para editar as informações nos módulos de Clientes, Empresas, Produtos e Usuários.
Por que é importante? Atualmente, criamos os registros, mas não há como corrigir um erro de digitação ou atualizar uma informação sem acessar o banco de dados diretamente.
Como implementar?
Backend: As rotas PUT para atualização na API já existem para a maioria dos módulos.
Frontend: Nas páginas de detalhe (ex: ClientDetailPage, UserDetailPage), transformar as exibições de dados em formulários editáveis que, ao serem salvos, enviam uma requisição PUT para a API.
Prioridade 2: Cumprir a Visão Original do Projeto (Alta Prioridade)
Recursos que foram centrais na concepção do projeto e que representam um grande diferencial.
2.1. Modo Offline Completo com Catálogo Local
O que é? Fazer com que o catálogo de produtos seja salvo no navegador do usuário, permitindo a criação de pedidos offline com busca e preenchimento automático dos itens, mesmo sem internet.
Por que é importante? Este é o principal recurso "offline" que foi planejado. Ele transforma a aplicação em uma verdadeira ferramenta de campo para o representante.
Como implementar?
Frontend: Utilizar uma biblioteca como Dexie.js para gerenciar um banco de dados IndexedDB no navegador.
Frontend: Após o login, criar uma rotina que baixa os produtos da empresa e os salva no IndexedDB.
Frontend: Modificar o componente OrderItemRow para que a busca de produtos por código consulte primeiro o IndexedDB e só depois (se online) a API.
2.2. Dashboard com Métricas Avançadas
O que é? Implementar os cálculos de variação percentual no dashboard, como "Pedidos Hoje (+10% vs ontem)".
Por que é importante? Transforma o dashboard de um simples display de números em uma ferramenta de análise rápida, conforme idealizado no prompt inicial.
Como implementar?
Backend: Refatorar o endpoint /api/dashboard/metrics para realizar queries mais complexas que comparem períodos (dia atual vs. dia anterior; últimos 30 dias vs. 30 dias anteriores) e retornem os percentuais já calculados.
Prioridade 3: Polimento e Qualidade de Vida (Média Prioridade)
Melhorias que aprimoram a experiência do usuário e a usabilidade geral da aplicação.
3.1. Sistema de Notificações (Toasts)
O que é? Substituir todos os alert() por um sistema de "toasts" (notificações não-bloqueantes que aparecem no canto da tela).
Por que é importante? Oferece um feedback muito mais profissional e agradável para o usuário após uma ação (ex: "Pedido salvo com sucesso!").
Como implementar?
Frontend: Integrar uma biblioteca como react-hot-toast ou sonner.
3.2. Busca e Filtros nas Listagens
O que é? Adicionar um campo de busca no topo das páginas de listagem (/clients, /orders, /products, etc.) para filtrar os resultados.
Por que é importante? À medida que a quantidade de dados cresce, torna-se inviável apenas rolar a lista. A busca é uma necessidade básica de usabilidade.
Como implementar?
Backend: Modificar os endpoints GET de listagem para aceitarem parâmetros de query (ex: GET /api/clients?search=...).
Frontend: Adicionar um Input de busca na UI e refatorar a chamada da API para incluir o termo de busca.
Prioridade 4: Expansão e Visão Futura
Grandes funcionalidades que podem ser adicionadas após a aplicação estar completamente estável e polida.
4.1. Módulo de Relatórios
O que é? Uma nova seção na aplicação dedicada a gerar relatórios analíticos.
Por que é importante? Permite uma visão estratégica do negócio, extraindo inteligência dos dados coletados.
Como implementar?
Backend: Criar novos endpoints (ex: /api/reports/sales-by-user) que realizam agregações complexas no banco de dados.
Frontend: Criar uma nova página de relatórios com filtros (ex: por período) e exibir os dados em tabelas ou gráficos.
