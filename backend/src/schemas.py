from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
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

# ============================================
# Schemas de Autenticação (Tokens, Respostas)
# ============================================

class Token(BaseModel):
    access_token: str
    token_type: str
    class ConfigDict:
        from_attributes = True

class TokenData(BaseModel):
    """ Schema dos dados contidos dentro do JWT """
    id_usuario: Optional[int] = None
    id_organizacao: Optional[int] = None
    tp_usuario: Optional[str] = None
    id_empresa_ativa: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

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
    pc_comissao_padrao: Optional[Decimal] = 0.00
    fl_ativa: Optional[bool] = True

class EmpresaCreate(EmpresaBase):
    pass # ID da organização virá do token

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
    
    class ConfigDict:
        from_attributes = True

# ============================================
# Schemas CRUD: Clientes
# ============================================

class ClienteBase(BaseModel):
    nr_cnpj: str
    no_razao_social: str
    no_fantasia: Optional[str] = None
    ds_email: Optional[EmailStr] = None
    nr_telefone: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

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
    vl_ajuste_preco: Optional[Decimal] = 0.00
    qt_estoque: Optional[int] = 0
    fl_ativa: Optional[bool] = True

class VariacaoProdutoCreate(VariacaoProdutoBase):
    pass # id_produto virá da URL

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
    pass # id_organizacao virá do token

class CategoriaProdutoUpdate(BaseModel):
    no_categoria: Optional[str] = None
    ds_categoria: Optional[str] = None
    fl_ativa: Optional[bool] = None
    id_categoria_pai: Optional[int] = None # Permite mover a categoria

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
    vl_base: Decimal
    sg_unidade_medida: Optional[str] = "UN"
    fl_ativo: Optional[bool] = True

class ProdutoCreate(ProdutoBase):
    id_empresa: int # Empresa que o produto representa
    id_categoria: Optional[int] = None

class ProdutoUpdate(BaseModel):
    cd_produto: Optional[str] = None
    ds_produto: Optional[str] = None
    vl_base: Optional[Decimal] = None
    sg_unidade_medida: Optional[str] = None
    fl_ativo: Optional[bool] = None
    id_categoria: Optional[int] = None

class ProdutoCompletoSchema(ProdutoBase):
    """ Schema para GET /produtos/{id} - Inclui os relacionamentos """
    id_produto: int
    id_empresa: int
    id_categoria: Optional[int] = None
    dt_criacao: datetime
    
    # Relacionamentos Aninhados
    variacoes: List[VariacaoProdutoSchema] = []
    categoria: Optional[CategoriaProdutoSchema] = None
    
    class ConfigDict:
        from_attributes = True
        
        
# ============================================
# Schemas CRUD: Vendedores (Usuários)
# ============================================

class VendedorCreate(BaseModel):
    """ Schema para criar um novo usuário (Vendedor) """
    ds_email: EmailStr
    password: str # O Pydantic valida o tipo, a lógica de força da senha fica na rota
    no_completo: str
    nr_telefone: Optional[str] = None
    fl_ativo: Optional[bool] = True

class VendedorUpdate(BaseModel):
    """ Schema para atualizar um Vendedor (PUT/PATCH) """
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
    empresas_vinculadas: List[EmpresaSchema] = [] # Lista de empresas que ele representa
    
    class ConfigDict:
        from_attributes = True

# --- Schemas para Vínculo Vendedor <-> Empresa ---

class VincularEmpresaRequest(BaseModel):
    """ Schema para POST /vendedores/vincular-empresa """
    id_usuario: int # O ID do vendedor
    id_empresa: int # O ID da empresa

class UsuarioEmpresaSchema(BaseModel):
    """ Schema de resposta para o vínculo """
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
    pass # id_cliente virá da URL

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
    tp_endereco: str # 'entrega', 'cobranca', 'comercial'
    ds_logradouro: str
    nr_endereco: Optional[str] = None
    ds_complemento: Optional[str] = None
    no_bairro: Optional[str] = None
    no_cidade: str
    sg_estado: str # Ex: 'SP'
    nr_cep: str
    fl_principal: Optional[bool] = False

class EnderecoCreate(EnderecoBase):
    pass # id_cliente virá da URL

class EnderecoSchema(EnderecoBase):
    id_endereco: int
    id_cliente: int
    
    class ConfigDict:
        from_attributes = True


class ClienteCompletoSchema(ClienteBase):
    """ Schema para GET /clientes/{id} - Inclui os relacionamentos """
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
# Schemas de Leitura: Histórico de Preços
# ============================================

class HistoricoPrecoSchema(BaseModel):
    id_historico: int
    id_produto: int
    vl_anterior: Decimal
    vl_novo: Decimal
    ds_motivo_alteracao: Optional[str] = None
    id_usuario_alteracao: Optional[int] = None
    dt_alteracao: datetime
    
    # Opcional: Adicionar dados do usuário que alterou
    # usuario_alteracao: Optional[UsuarioSchema] = None 
    
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
    pass # id_organizacao virá do token (ou será global)

class FormaPagamentoSchema(FormaPagamentoBase):
    id_forma_pagamento: int
    id_organizacao: Optional[int] = None
    
    class ConfigDict:
        from_attributes = True

# ============================================
# Schemas CRUD: Pedidos (Criação e Leitura)
# ============================================

class ItemPedidoCreate(BaseModel):
    """ Schema para um item DENTRO de um pedido de criação """
    id_produto: int
    id_variacao: Optional[int] = None # ID da TB_VARIACOES_PRODUTOS
    qt_quantidade: int
    vl_unitario: Decimal # Preço unitário (pode ter sido modificado no front)
    pc_desconto_item: Optional[Decimal] = 0.00
    # vl_total_item será calculado no backend

class PedidoCreate(BaseModel):
    """ Schema para o corpo (body) da requisição de POST /pedidos """
    id_cliente: int
    id_endereco_entrega: int
    id_endereco_cobranca: int
    id_forma_pagamento: int
    
    pc_desconto: Optional[Decimal] = 0.00
    ds_observacoes: Optional[str] = None
    
    # Lista de itens
    itens: List[ItemPedidoCreate]

# --- Schemas de Resposta (Leitura) ---

class ItemPedidoSchema(BaseModel):
    """ Schema de resposta para um item de pedido (lido do DB) """
    id_item_pedido: int
    id_produto: int
    id_variacao: Optional[int] = None
    qt_quantidade: int
    vl_unitario: Decimal
    pc_desconto_item: Decimal
    vl_total_item: Decimal
    
    # Opcional: incluir dados do produto (se precisarmos no futuro)
    # produto: ProdutoSchema
    
    class ConfigDict:
        from_attributes = True

class PedidoCompletoSchema(BaseModel):
    """ Schema de resposta para um pedido completo (GET /pedidos/{id}) """
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
    vendedor: UsuarioSchema # (Opcional, mas útil)
    empresa: EmpresaSchema
    endereco_entrega: Optional[EnderecoSchema] = None
    endereco_cobranca: Optional[EnderecoSchema] = None
    forma_pagamento: Optional[FormaPagamentoSchema] = None
    
    itens: List[ItemPedidoSchema] = []
    # comissoes: List[ComissaoPedidoSchema] = [] # (Se precisarmos)
    
    class ConfigDict:
        from_attributes = True
        
class PedidoUpdate(BaseModel):
    """ Schema para atualizar campos de um pedido PENDENTE """
    # Por enquanto, permitindo apenas a atualização de observações
    # (Editar itens exigiria uma lógica de recálculo complexa)
    ds_observacoes: Optional[str] = None
    pc_desconto: Optional[Decimal] = None # Permitir ajuste de desconto geral

class PedidoCancelRequest(BaseModel):
    """ Schema para o body de POST /{id_pedido}/cancelar """
    motivo: str # Motivo do cancelamento (será salvo nas observações)
