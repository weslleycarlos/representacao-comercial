from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime, date
from decimal import Decimal

# ============================================
# Schemas de Base (Organização, Usuário, Empresa)
# ============================================


class OrganizacaoSchema(BaseModel):
    id_organizacao: int
    no_organizacao: str
    nr_cnpj: Optional[str] = None
    st_assinatura: Optional[str] = None
    tp_plano: Optional[str] = None

    class ConfigDict:
        from_attributes = True


class EmpresaSchema(BaseModel):
    id_empresa: int
    id_organizacao: int
    no_empresa: str
    nr_cnpj: str
    pc_comissao_padrao: Decimal
    fl_ativa: bool

    class ConfigDict:
        from_attributes = True


class UsuarioSchema(BaseModel):
    id_usuario: int
    id_organizacao: Optional[int] = None
    ds_email: EmailStr
    tp_usuario: str
    no_completo: Optional[str] = None
    nr_telefone: Optional[str] = None
    fl_ativo: bool
    dt_ultimo_acesso: Optional[datetime] = None

    class ConfigDict:
        from_attributes = True


class OrganizacaoDetalhadaSchema(OrganizacaoSchema):
    gestores: List[UsuarioSchema] = []


# ============================================
# Schemas de Autenticação (Tokens, Respostas)
# ============================================


class Token(BaseModel):
    access_token: str
    token_type: str

    class ConfigDict:
        from_attributes = True


class TokenData(BaseModel):
    """Schema dos dados contidos dentro do JWT"""

    id_usuario: Optional[int] = None
    id_organizacao: Optional[int] = None
    tp_usuario: Optional[str] = None
    id_empresa_ativa: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class LoginResponse(BaseModel):
    token: Token
    usuario: UsuarioSchema
    organizacao: Optional[OrganizacaoSchema] = None
    empresas_vinculadas: List[EmpresaSchema] = []

    class ConfigDict:
        from_attributes = True


class SelectCompanyRequest(BaseModel):
    id_empresa: int


class SelectCompanyResponse(BaseModel):
    token: Token
    empresa_ativa: EmpresaSchema

    class ConfigDict:
        from_attributes = True


class MeResponse(BaseModel):
    usuario: UsuarioSchema
    organizacao: Optional[OrganizacaoSchema] = None
    empresa_ativa: Optional[EmpresaSchema] = None
    empresas_vinculadas: List[EmpresaSchema] = []

    class ConfigDict:
        from_attributes = True


# ============================================
# Schemas CRUD: Empresas
# ============================================


class EmpresaBase(BaseModel):
    no_empresa: str
    nr_cnpj: str
    nr_inscricao_estadual: Optional[str] = None
    ds_email_contato: Optional[EmailStr] = None
    nr_telefone_contato: Optional[str] = None
    ds_site: Optional[str] = None
    pc_comissao_padrao: Optional[Decimal] = 0.00  # type: ignore
    fl_ativa: Optional[bool] = True


class EmpresaCreate(EmpresaBase):
    pass  # ID da organização virá do token


class EmpresaUpdate(BaseModel):
    no_empresa: Optional[str] = None
    nr_cnpj: Optional[str] = None
    nr_inscricao_estadual: Optional[str] = None
    ds_email_contato: Optional[EmailStr] = None
    nr_telefone_contato: Optional[str] = None
    ds_site: Optional[str] = None
    pc_comissao_padrao: Optional[Decimal] = None
    fl_ativa: Optional[bool] = None


class EmpresaCompletaSchema(EmpresaSchema):
    nr_inscricao_estadual: Optional[str] = None
    ds_email_contato: Optional[EmailStr] = None
    nr_telefone_contato: Optional[str] = None
    ds_site: Optional[str] = None
    dt_criacao: datetime
    dt_atualizacao: datetime


# ============================================
# Schemas CRUD: Clientes
# ============================================


class ClienteBase(BaseModel):
    nr_cnpj: str
    no_razao_social: str
    no_fantasia: Optional[str] = None
    ds_email: Optional[EmailStr] = None
    nr_telefone: Optional[str] = None
    nr_inscricao_estadual: Optional[str] = None
    ds_observacoes: Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    """Schema para atualizar um Cliente (PUT/PATCH) - todos os campos opcionais"""

    no_razao_social: Optional[str] = None
    nr_cnpj: Optional[str] = None
    no_fantasia: Optional[str] = None
    nr_inscricao_estadual: Optional[str] = None
    ds_email: Optional[EmailStr] = None
    nr_telefone: Optional[str] = None
    ds_observacoes: Optional[str] = None
    fl_ativo: Optional[bool] = None


class ClienteSchema(ClienteBase):
    id_cliente: int
    id_organizacao: int
    fl_ativo: bool

    class ConfigDict:
        from_attributes = True


# ============================================
# Schemas CRUD: Variações de Produtos
# ============================================


class VariacaoProdutoBase(BaseModel):
    ds_tamanho: Optional[str] = None
    ds_cor: Optional[str] = None
    cd_sku: Optional[str] = None
    vl_ajuste_preco: Optional[Decimal] = 0.00  # pyright: ignore[reportAssignmentType]
    qt_estoque: Optional[int] = 0
    fl_ativa: Optional[bool] = True


class VariacaoProdutoCreate(VariacaoProdutoBase):
    pass  # id_produto virá da URL


class VariacaoProdutoUpdate(BaseModel):
    ds_tamanho: Optional[str] = None
    ds_cor: Optional[str] = None
    cd_sku: Optional[str] = None
    vl_ajuste_preco: Optional[Decimal] = None
    qt_estoque: Optional[int] = None
    fl_ativa: Optional[bool] = None


class VariacaoProdutoSchema(VariacaoProdutoBase):
    id_variacao: int
    id_produto: int

    class ConfigDict:
        from_attributes = True


# ============================================
# Schemas CRUD: Categorias de Produtos
# ============================================


class CategoriaProdutoBase(BaseModel):
    no_categoria: str
    ds_categoria: Optional[str] = None
    fl_ativa: Optional[bool] = True
    id_categoria_pai: Optional[int] = None


class CategoriaProdutoCreate(CategoriaProdutoBase):
    pass  # id_organizacao virá do token


class CategoriaProdutoUpdate(BaseModel):
    no_categoria: Optional[str] = None
    ds_categoria: Optional[str] = None
    fl_ativa: Optional[bool] = None
    id_categoria_pai: Optional[int] = None  # Permite mover a categoria


class CategoriaProdutoSchema(CategoriaProdutoBase):
    id_categoria: int
    id_organizacao: int
    # (Adicionaremos 'children' se precisarmos da árvore completa)

    class ConfigDict:
        from_attributes = True


# ============================================
# Schemas CRUD: Produtos (Versão Completa)
# ============================================


class ProdutoBase(BaseModel):
    cd_produto: str
    ds_produto: str
    sg_unidade_medida: Optional[str] = "UN"
    fl_ativo: Optional[bool] = True


class ProdutoCreate(ProdutoBase):
    id_empresa: int  # Empresa que o produto representa
    id_categoria: Optional[int] = None


class ProdutoUpdate(BaseModel):
    cd_produto: Optional[str] = None
    ds_produto: Optional[str] = None
    sg_unidade_medida: Optional[str] = None
    fl_ativo: Optional[bool] = None
    id_categoria: Optional[int] = None


class ProdutoSchemaSimples(ProdutoBase):
    id_produto: int
    id_empresa: int
    id_categoria: Optional[int] = None
    dt_criacao: datetime

    variacoes: List[VariacaoProdutoSchema] = []
    categoria: Optional[CategoriaProdutoSchema] = None

    # 'listas_de_preco' é OMITIDO AQUI para quebrar o ciclo.

    class ConfigDict:
        from_attributes = True


# ============================================
# Schemas CRUD: Itens do Catálogo (Preços)
# ============================================


class ItemCatalogoBase(BaseModel):
    id_produto: int
    vl_preco_catalogo: Decimal
    fl_ativo_no_catalogo: Optional[bool] = True


class ItemCatalogoCreate(ItemCatalogoBase):
    pass  # id_catalogo virá da URL


class ItemCatalogoUpdate(BaseModel):
    vl_preco_catalogo: Optional[Decimal] = None
    fl_ativo_no_catalogo: Optional[bool] = None


class ItemCatalogoSchema(ItemCatalogoBase):
    id_item_catalogo: int
    id_catalogo: int

    # Usa o schema simples (sem 'listas_de_preco')
    produto: Optional["ProdutoSchemaSimples"] = None

    class ConfigDict:
        from_attributes = True


class ItemCatalogoAninhadoSchema(ItemCatalogoBase):
    id_item_catalogo: int
    id_catalogo: int
    # O campo 'produto' é OMITIDO AQUI para quebrar o ciclo.

    class ConfigDict:
        from_attributes = True


class ProdutoCompletoSchema(ProdutoBase):
    id_produto: int
    id_empresa: int
    id_categoria: Optional[int] = None
    dt_criacao: datetime

    variacoes: List[VariacaoProdutoSchema] = []
    categoria: Optional[CategoriaProdutoSchema] = None

    # Usa o schema aninhado (sem 'produto')
    listas_de_preco: List["ItemCatalogoAninhadoSchema"] = []

    class ConfigDict:
        from_attributes = True


class ItemCatalogoVendaSchema(BaseModel):
    """
    Schema de resposta para o VENDEDOR.
    Combina o Produto (DNA) com o ItemCatalogo (Preço)
    """

    id_item_catalogo: int
    id_catalogo: int

    # Dados do Preço
    vl_preco_catalogo: Decimal
    fl_ativo_no_catalogo: bool

    # Dados do Produto (Aninhados)
    produto: ProdutoCompletoSchema  # Usa o schema completo (com variações, etc)

    class ConfigDict:
        from_attributes = True


# ============================================
# Schemas CRUD: Catálogos (Listas de Preço)
# ============================================


class CatalogoBase(BaseModel):
    no_catalogo: str
    ds_descricao: Optional[str] = None
    dt_inicio_vigencia: Optional[date] = None
    dt_fim_vigencia: Optional[date] = None
    fl_ativo: Optional[bool] = True


class CatalogoCreate(CatalogoBase):
    id_empresa: int  # A qual empresa este catálogo pertence


class CatalogoUpdate(BaseModel):
    no_catalogo: Optional[str] = None
    ds_descricao: Optional[str] = None
    dt_inicio_vigencia: Optional[date] = None
    dt_fim_vigencia: Optional[date] = None
    fl_ativo: Optional[bool] = None


class CatalogoSchema(CatalogoBase):
    id_catalogo: int
    id_empresa: int
    dt_criacao: datetime

    class ConfigDict:
        from_attributes = True


# ============================================
# Schemas CRUD: Vendedores (Usuários)
# ============================================


class VendedorCreate(BaseModel):
    """Schema para criar um novo usuário (Vendedor)"""

    ds_email: EmailStr
    password: str  # O Pydantic valida o tipo, a lógica de força da senha fica na rota
    no_completo: str
    nr_telefone: Optional[str] = None
    fl_ativo: Optional[bool] = True


class VendedorUpdate(BaseModel):
    """Schema para atualizar um Vendedor (PUT/PATCH)"""

    ds_email: Optional[EmailStr] = None
    no_completo: Optional[str] = None
    nr_telefone: Optional[str] = None
    fl_ativo: Optional[bool] = None
    # (A redefinição de senha deve ser uma rota separada, ex: /reset-password)


class VendedorSchema(UsuarioSchema):
    """
    Schema de resposta para Vendedor, herda de UsuarioSchema
    e adiciona a lista de empresas vinculadas.
    """

    empresas_vinculadas: List[
        EmpresaSchema
    ] = []  # Lista de empresas que ele representa


# --- Schemas para Vínculo Vendedor <-> Empresa ---


class VincularEmpresaRequest(BaseModel):
    """Schema para POST /vendedores/vincular-empresa"""

    id_usuario: int  # O ID do vendedor
    id_empresa: int  # O ID da empresa


class UsuarioEmpresaSchema(BaseModel):
    """Schema de resposta para o vínculo"""

    id_usuario: int
    id_empresa: int
    dt_vinculo: datetime

    class ConfigDict:
        from_attributes = True


# ============================================
# Schemas CRUD: Clientes, Endereços, Contatos
# ============================================


# --- Contato Schemas ---
class ContatoBase(BaseModel):
    no_contato: str
    ds_cargo: Optional[str] = None
    ds_email: Optional[EmailStr] = None
    nr_telefone: Optional[str] = None
    fl_principal: Optional[bool] = False


class ContatoCreate(ContatoBase):
    pass  # id_cliente virá da URL


class ContatoSchema(ContatoBase):
    id_contato: int
    id_cliente: int

    class ConfigDict:
        from_attributes = True


class ContatoUpdate(BaseModel):
    no_contato: Optional[str] = None
    ds_cargo: Optional[str] = None
    ds_email: Optional[EmailStr] = None
    nr_telefone: Optional[str] = None
    fl_principal: Optional[bool] = None


# --- Endereço Schemas ---
class EnderecoBase(BaseModel):
    tp_endereco: str  # 'entrega', 'cobranca', 'comercial'
    ds_logradouro: str
    nr_endereco: Optional[str] = None
    ds_complemento: Optional[str] = None
    no_bairro: Optional[str] = None
    no_cidade: str
    sg_estado: str  # Ex: 'SP'
    nr_cep: str
    fl_principal: Optional[bool] = False


class EnderecoUpdate(BaseModel):
    """Schema para atualizar um Endereço (PUT)"""

    tp_endereco: Optional[str] = None
    ds_logradouro: Optional[str] = None
    nr_endereco: Optional[str] = None
    ds_complemento: Optional[str] = None
    no_bairro: Optional[str] = None
    no_cidade: Optional[str] = None
    sg_estado: Optional[str] = None
    nr_cep: Optional[str] = None
    fl_principal: Optional[bool] = None


class EnderecoCreate(EnderecoBase):
    pass  # id_cliente virá da URL


class EnderecoSchema(EnderecoBase):
    id_endereco: int
    id_cliente: int

    class ConfigDict:
        from_attributes = True


class ClienteCompletoSchema(ClienteBase):
    """Schema para GET /clientes/{id} - Inclui os relacionamentos"""

    id_cliente: int
    id_organizacao: int
    fl_ativo: bool
    ds_observacoes: Optional[str] = None
    dt_criacao: datetime
    enderecos: List[EnderecoSchema] = []
    contatos: List[ContatoSchema] = []


class ConfigDict:
    from_attributes = True


# ============================================
# Schemas CRUD: Formas de Pagamento
# ============================================


class FormaPagamentoBase(BaseModel):
    no_forma_pagamento: str
    fl_permite_parcelamento: Optional[bool] = False
    qt_maximo_parcelas: Optional[int] = 1
    fl_ativa: Optional[bool] = True


class FormaPagamentoCreate(FormaPagamentoBase):
    pass  # id_organizacao virá do token (ou será global)


class FormaPagamentoSchema(FormaPagamentoBase):
    id_forma_pagamento: int
    id_organizacao: Optional[int] = None

    class ConfigDict:
        from_attributes = True


class FormaPagamentoUpdate(BaseModel):
    """Schema para atualizar uma Forma de Pagamento"""

    no_forma_pagamento: Optional[str] = None
    fl_permite_parcelamento: Optional[bool] = None
    qt_maximo_parcelas: Optional[int] = None
    fl_ativa: Optional[bool] = None


# ============================================
# Schemas CRUD: Pedidos (Criação e Leitura)
# ============================================


class ItemPedidoCreate(BaseModel):
    """Schema para um item DENTRO de um pedido de criação"""

    id_produto: int
    id_variacao: Optional[int] = None  # ID da TB_VARIACOES_PRODUTOS
    qt_quantidade: int
    pc_desconto_item: Optional[Decimal] = 0.00  # pyright: ignore[reportAssignmentType]


class PedidoCreate(BaseModel):
    """Schema para o corpo (body) da requisição de POST /pedidos"""

    id_cliente: int
    id_endereco_entrega: int
    id_endereco_cobranca: int
    id_forma_pagamento: int
    id_catalogo: int
    pc_desconto: Optional[Decimal] = 0.00  # type: ignore
    ds_observacoes: Optional[str] = None

    # Lista de itens
    itens: List[ItemPedidoCreate]


# --- Schemas de Resposta (Leitura) ---


class ItemPedidoSchema(BaseModel):
    """Schema de resposta para um item de pedido (lido do DB)"""

    id_item_pedido: int
    id_produto: int
    id_variacao: Optional[int] = None
    qt_quantidade: int
    vl_unitario: Decimal
    pc_desconto_item: Decimal
    vl_total_item: Decimal

    # Opcional: incluir dados do produto (se precisarmos no futuro)
    produto: Optional["ProdutoSchemaSimples"] = None

    class ConfigDict:
        from_attributes = True


class PedidoCompletoSchema(BaseModel):
    """Schema de resposta para um pedido completo (GET /pedidos/{id})"""

    id_pedido: int
    id_usuario: int
    id_empresa: int
    id_cliente: int
    nr_pedido: Optional[str] = None
    st_pedido: str
    vl_total: Decimal
    dt_pedido: datetime

    # Relacionamentos Aninhados
    cliente: ClienteSchema
    vendedor: UsuarioSchema  # (Opcional, mas útil)
    empresa: EmpresaSchema
    endereco_entrega: Optional[EnderecoSchema] = None
    endereco_cobranca: Optional[EnderecoSchema] = None
    forma_pagamento: Optional[FormaPagamentoSchema] = None

    itens: List[ItemPedidoSchema] = []
    # comissoes: List[ComissaoPedidoSchema] = [] # (Se precisarmos)

    class ConfigDict:
        from_attributes = True


class PedidoUpdate(BaseModel):
    """Schema para atualizar campos de um pedido PENDENTE"""

    # Por enquanto, permitindo apenas a atualização de observações
    # (Editar itens exigiria uma lógica de recálculo complexa)
    ds_observacoes: Optional[str] = None
    pc_desconto: Optional[Decimal] = None  # Permitir ajuste de desconto geral


class PedidoCancelRequest(BaseModel):
    """Schema para o body de POST /{id_pedido}/cancelar"""

    motivo: str  # Motivo do cancelamento (será salvo nas observações)


class PedidoStatusUpdate(BaseModel):
    """Schema para o body de PUT /{id_pedido}/status"""

    # Valida o novo status contra os valores permitidos
    novo_status: str

    # Validação (opcional, mas recomendada)
    from pydantic import field_validator

    @field_validator("novo_status")
    @classmethod
    def validate_status(cls, v: str):
        allowed_status = [
            "pendente",
            "confirmado",
            "em_separacao",
            "enviado",
            "entregue",
            "cancelado",
        ]
        if v not in allowed_status:
            raise ValueError(
                f"Status '{v}' não é permitido. Valores permitidos: {allowed_status}"
            )
        return v


# ============================================
# Schemas para Dashboards e Relatórios
# ============================================


class VendaVendedorMesSchema(BaseModel):
    """Schema para a View VW_VENDAS_VENDEDOR_MES"""

    id_usuario: int
    no_vendedor: Optional[str] = None
    dt_mes_referencia: datetime
    qt_pedidos: int
    vl_total_vendas: Decimal
    vl_ticket_medio: Decimal

    class ConfigDict:
        from_attributes = True


class ComissaoCalculadaSchema(BaseModel):
    """Schema para a View VW_COMISSOES_CALCULADAS"""

    id_pedido: int
    nr_pedido: Optional[str] = None
    no_vendedor: Optional[str] = None
    no_empresa: Optional[str] = None
    vl_total: Decimal
    pc_comissao_aplicada: Decimal
    vl_comissao_calculada: Decimal
    dt_pedido: datetime

    class ConfigDict:
        from_attributes = True


class DashboardVendedorKpiSchema(BaseModel):
    """Schema de resposta para o Dashboard do Vendedor"""

    vendas_mes_atual: Decimal
    comissao_mes_atual: Decimal
    pedidos_mes_atual: int
    ticket_medio_mes_atual: Decimal
    # (Adicionaremos ranking de produtos e metas aqui no futuro)


# ============================================
# Schemas CRUD: Regras de Comissão
# ============================================


class RegraComissaoBase(BaseModel):
    """Schema base para regras de comissão"""

    pc_comissao: Decimal
    id_empresa: Optional[int] = None  # NULL = Regra da Organização
    id_usuario: Optional[int] = None  # NULL = Regra da Empresa/Organização
    nr_prioridade: Optional[int] = 0
    dt_inicio_vigencia: Optional[date] = None
    dt_fim_vigencia: Optional[date] = None
    fl_ativa: Optional[bool] = True


class RegraComissaoCreate(RegraComissaoBase):
    """Schema para criar uma nova regra"""

    pass  # id_organizacao virá do token


class RegraComissaoUpdate(BaseModel):
    """Schema para atualizar uma regra"""

    pc_comissao: Optional[Decimal] = None
    id_empresa: Optional[int] = None
    id_usuario: Optional[int] = None
    nr_prioridade: Optional[int] = None
    dt_inicio_vigencia: Optional[date] = None
    dt_fim_vigencia: Optional[date] = None
    fl_ativa: Optional[bool] = None


class RegraComissaoSchema(RegraComissaoBase):
    """Schema de resposta para ler uma regra (inclui relacionamentos)"""

    id_regra_comissao: int
    id_organizacao: int

    # Schemas aninhados para mostrar os nomes
    empresa: Optional[EmpresaSchema] = None
    usuario: Optional[UsuarioSchema] = None

    class ConfigDict:
        from_attributes = True


class VendaEmpresaMesSchema(BaseModel):
    """Schema para a View VW_VENDAS_EMPRESA_MES"""

    id_empresa: int
    no_empresa: Optional[str] = None
    id_organizacao: int
    dt_mes_referencia: datetime
    qt_pedidos: int
    vl_total_vendas: Decimal
    qt_clientes_atendidos: int

    class ConfigDict:
        from_attributes = True


class VendaPorCidadeSchema(BaseModel):
    """Schema para a View VW_VENDAS_POR_CIDADE"""

    no_cidade: str
    sg_estado: str
    id_organizacao: int
    dt_mes_referencia: datetime
    qt_pedidos: int
    vl_total_vendas: Decimal

    class ConfigDict:
        from_attributes = True


class GestorDashboardKpiSchema(BaseModel):
    """Schema de resposta para o Dashboard principal do Gestor"""

    vendas_mes_atual: Decimal
    pedidos_mes_atual: int
    ticket_medio_mes_atual: Decimal
    clientes_atendidos_mes_atual: int
    comissoes_pendentes_mes_atual: (
        Decimal  # (Assumindo que VW_COMISSOES lida com status)
    )


# ============================================
# Schemas Super Admin: Organizações
# ============================================


class AdminGestorCreate(BaseModel):
    """Schema para os dados do primeiro gestor, aninhado na criação da organização"""

    ds_email: EmailStr
    password: str
    no_completo: str
    nr_telefone: Optional[str] = None


class AdminOrganizacaoCreate(BaseModel):
    """Schema para POST /api/admin/organizacoes"""

    no_organizacao: str
    nr_cnpj: Optional[str] = None
    ds_email_contato: Optional[EmailStr] = None
    nr_telefone_contato: Optional[str] = None
    tp_plano: str  # ex: 'basico', 'premium'
    qt_limite_usuarios: int
    qt_limite_empresas: int

    # Dados do Gestor aninhados
    gestor: AdminGestorCreate


class AdminOrganizacaoUpdate(BaseModel):
    """Schema para PUT /api/admin/organizacoes/{id}"""

    no_organizacao: Optional[str] = None
    nr_cnpj: Optional[str] = None
    ds_email_contato: Optional[EmailStr] = None
    nr_telefone_contato: Optional[str] = None
    st_assinatura: Optional[str] = None  # 'ativo', 'suspenso', 'cancelado'
    tp_plano: Optional[str] = None
    qt_limite_usuarios: Optional[int] = None
    qt_limite_empresas: Optional[int] = None


class LogUsuarioSchema(BaseModel):
    """Schema simplificado para o usuário dentro do log"""

    id_usuario: int
    ds_email: EmailStr
    no_completo: Optional[str] = None

    class ConfigDict:
        from_attributes = True


class LogAuditoriaSchema(BaseModel):
    """Schema de resposta para um item de log de auditoria"""

    id_log: int
    id_organizacao: Optional[int] = None
    id_usuario: Optional[int] = None
    tp_entidade: str
    id_entidade: int
    tp_acao: str
    ds_valores_antigos: Optional[dict] = None  # Pydantic v2 lida com JSON
    ds_valores_novos: Optional[dict] = None
    ds_endereco_ip: Optional[str] = None
    dt_acao: datetime

    # Relacionamento aninhado (usando o schema simplificado)
    usuario: Optional[LogUsuarioSchema] = None

    class ConfigDict:
        from_attributes = True


# ============================================
# Schemas Super Admin: Dashboard
# ============================================


class AdminDashboardKpiSchema(BaseModel):
    """Schema de resposta para o Dashboard principal do Super Admin"""

    total_organizacoes_ativas: int
    total_organizacoes_suspensas: int
    total_gestores_ativos: int
    total_vendedores_ativos: int
    total_pedidos_sistema: int  # Contagem total de pedidos (não cancelados)
    valor_total_pedidos_sistema: Decimal  # Soma do VL_TOTAL (não cancelados)


# ============================================
# RESOLUÇÃO DE REFERÊNCIAS (FINAL DO ARQUIVO)
# ============================================
# Isso resolve as referências circulares (strings)
# 1. Resolvemos os schemas 'aninhados' (folhas) primeiro.
ProdutoSchemaSimples.model_rebuild()
ItemCatalogoAninhadoSchema.model_rebuild()

# 2. Agora, resolvemos os schemas 'pais' (troncos) que dependem deles.
ItemCatalogoSchema.model_rebuild()
ProdutoCompletoSchema.model_rebuild()
