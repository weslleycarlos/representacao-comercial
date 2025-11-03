from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, Numeric, Text, BigInteger, Date,
    ForeignKey, UniqueConstraint, JSON, text, extract
)
from sqlalchemy.orm import relationship
from datetime import datetime
import bcrypt

# Importa o Base do nosso novo arquivo database.py
from src.database import Base

# ============================================
# TABELAS PRINCIPAIS (ORGANIZAÇÕES, USUÁRIOS, EMPRESAS)
# ============================================

class Organizacao(Base):
    __tablename__ = 'TB_ORGANIZACOES'
    
    id_organizacao = Column('ID_ORGANIZACAO', Integer, primary_key=True)
    no_organizacao = Column('NO_ORGANIZACAO', String(200), nullable=False)
    nr_cnpj = Column('NR_CNPJ', String(18), unique=True)
    ds_email_contato = Column('DS_EMAIL_CONTATO', String(150))
    nr_telefone_contato = Column('NR_TELEFONE_CONTATO', String(20))
    st_assinatura = Column('ST_ASSINATURA', String(20), default='ativo')
    tp_plano = Column('TP_PLANO', String(50)) 
    qt_limite_usuarios = Column('QT_LIMITE_USUARIOS', Integer)
    qt_limite_empresas = Column('QT_LIMITE_EMPRESAS', Integer)
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    dt_atualizacao = Column('DT_ATUALIZACAO', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    usuarios = relationship('Usuario', back_populates='organizacao', cascade='all, delete-orphan')
    empresas = relationship('Empresa', back_populates='organizacao', cascade='all, delete-orphan')
    clientes = relationship('Cliente', back_populates='organizacao', cascade='all, delete-orphan')
    categorias_produto = relationship('CategoriaProduto', back_populates='organizacao', cascade='all, delete-orphan')
    formas_pagamento = relationship('FormaPagamento', back_populates='organizacao', cascade='all, delete-orphan')
    regras_comissao = relationship('RegraComissao', back_populates='organizacao', cascade='all, delete-orphan')
    logs_auditoria = relationship('LogAuditoria', back_populates='organizacao', cascade='all, delete-orphan')

class Usuario(Base):
    __tablename__ = 'TB_USUARIOS'
    
    id_usuario = Column('ID_USUARIO', Integer, primary_key=True)
    id_organizacao = Column('ID_ORGANIZACAO', Integer, ForeignKey('TB_ORGANIZACOES.ID_ORGANIZACAO', ondelete='CASCADE'), nullable=True)
    ds_email = Column('DS_EMAIL', String(150), unique=True, nullable=False)
    ds_senha_hash = Column('DS_SENHA_HASH', String(255), nullable=False)
    tp_usuario = Column('TP_USUARIO', String(20), nullable=False, default='vendedor')
    no_completo = Column('NO_COMPLETO', String(200))
    nr_telefone = Column('NR_TELEFONE', String(20))
    fl_ativo = Column('FL_ATIVO', Boolean, default=True)
    id_usuario_criador = Column('ID_USUARIO_CRIADOR', Integer, ForeignKey('TB_USUARIOS.ID_USUARIO'))
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    dt_atualizacao = Column('DT_ATUALIZACAO', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    dt_ultimo_acesso = Column('DT_ULTIMO_ACESSO', DateTime)
    
    organizacao = relationship('Organizacao', back_populates='usuarios')
    criador = relationship('Usuario', remote_side=[id_usuario], backref='usuarios_criados')
    empresas_vinculadas = relationship('UsuarioEmpresa', back_populates='usuario', cascade='all, delete-orphan')
    pedidos = relationship('Pedido', back_populates='vendedor', foreign_keys='Pedido.id_usuario')
    comissoes_pedido = relationship('ComissaoPedido', back_populates='vendedor', foreign_keys='ComissaoPedido.id_usuario')
    historico_precos = relationship('HistoricoPreco', back_populates='usuario_alteracao', foreign_keys='HistoricoPreco.id_usuario_alteracao')
    logs_auditoria = relationship('LogAuditoria', back_populates='usuario', foreign_keys='LogAuditoria.id_usuario')
    regras_comissao = relationship('RegraComissao', back_populates='usuario', foreign_keys='RegraComissao.id_usuario')

    def set_password(self, password):
        self.ds_senha_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        if not self.ds_senha_hash:
            return False
        return bcrypt.checkpw(password.encode('utf-8'), self.ds_senha_hash.encode('utf-8'))

class Empresa(Base):
    __tablename__ = 'TB_EMPRESAS'
    
    id_empresa = Column('ID_EMPRESA', Integer, primary_key=True)
    id_organizacao = Column('ID_ORGANIZACAO', Integer, ForeignKey('TB_ORGANIZACOES.ID_ORGANIZACAO', ondelete='CASCADE'), nullable=False)
    no_empresa = Column('NO_EMPRESA', String(200), nullable=False)
    nr_cnpj = Column('NR_CNPJ', String(18), nullable=False)
    nr_inscricao_estadual = Column('NR_INSCRICAO_ESTADUAL', String(50))
    ds_email_contato = Column('DS_EMAIL_CONTATO', String(150))
    nr_telefone_contato = Column('NR_TELEFONE_CONTATO', String(20))
    ds_site = Column('DS_SITE', String(200))
    pc_comissao_padrao = Column('PC_COMISSAO_PADRAO', Numeric(5,2), default=0.00)
    fl_ativa = Column('FL_ATIVA', Boolean, default=True)
    dt_exclusao = Column('DT_EXCLUSAO', DateTime)
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    dt_atualizacao = Column('DT_ATUALIZACAO', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (UniqueConstraint('ID_ORGANIZACAO', 'NR_CNPJ', name='UK_EMPRESAS_CNPJ_ORG'),)
    
    organizacao = relationship('Organizacao', back_populates='empresas')
    usuarios_vinculados = relationship('UsuarioEmpresa', back_populates='empresa', cascade='all, delete-orphan')
    produtos = relationship('Produto', back_populates='empresa', cascade='all, delete-orphan')
    regras_comissao = relationship('RegraComissao', back_populates='empresa', cascade='all, delete-orphan')
    pedidos = relationship('Pedido', back_populates='empresa', cascade='all, delete-orphan')

class UsuarioEmpresa(Base):
    __tablename__ = 'TB_USUARIO_EMPRESAS'
    id_usuario = Column('ID_USUARIO', Integer, ForeignKey('TB_USUARIOS.ID_USUARIO', ondelete='CASCADE'), primary_key=True)
    id_empresa = Column('ID_EMPRESA', Integer, ForeignKey('TB_EMPRESAS.ID_EMPRESA', ondelete='CASCADE'), primary_key=True)
    dt_vinculo = Column('DT_VINCULO', DateTime, default=datetime.utcnow)
    
    usuario = relationship('Usuario', back_populates='empresas_vinculadas')
    empresa = relationship('Empresa', back_populates='usuarios_vinculados')

# ============================================
# CLIENTES
# ============================================

class Cliente(Base):
    __tablename__ = 'TB_CLIENTES'
    
    id_cliente = Column('ID_CLIENTE', Integer, primary_key=True)
    id_organizacao = Column('ID_ORGANIZACAO', Integer, ForeignKey('TB_ORGANIZACOES.ID_ORGANIZACAO', ondelete='CASCADE'), nullable=False)
    nr_cnpj = Column('NR_CNPJ', String(18), nullable=False)
    no_razao_social = Column('NO_RAZAO_SOCIAL', String(200), nullable=False)
    no_fantasia = Column('NO_FANTASIA', String(200))
    nr_inscricao_estadual = Column('NR_INSCRICAO_ESTADUAL', String(50))
    ds_email = Column('DS_EMAIL', String(150))
    nr_telefone = Column('NR_TELEFONE', String(20))
    ds_observacoes = Column('DS_OBSERVACOES', Text)
    fl_ativo = Column('FL_ATIVO', Boolean, default=True)
    dt_exclusao = Column('DT_EXCLUSAO', DateTime)
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    dt_atualizacao = Column('DT_ATUALIZACAO', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (UniqueConstraint('ID_ORGANIZACAO', 'NR_CNPJ', name='UK_CLIENTES_CNPJ_ORG'),)
    
    organizacao = relationship('Organizacao', back_populates='clientes')
    enderecos = relationship('Endereco', back_populates='cliente', cascade='all, delete-orphan')
    contatos = relationship('Contato', back_populates='cliente', cascade='all, delete-orphan')
    pedidos = relationship('Pedido', back_populates='cliente', cascade='all, delete-orphan')

class Endereco(Base):
    __tablename__ = 'TB_ENDERECOS'
    
    id_endereco = Column('ID_ENDERECO', Integer, primary_key=True)
    id_cliente = Column('ID_CLIENTE', Integer, ForeignKey('TB_CLIENTES.ID_CLIENTE', ondelete='CASCADE'), nullable=False)
    tp_endereco = Column('TP_ENDERECO', String(20), nullable=False)
    ds_logradouro = Column('DS_LOGRADOURO', String(200), nullable=False)
    nr_endereco = Column('NR_ENDERECO', String(20))
    ds_complemento = Column('DS_COMPLEMENTO', String(100))
    no_bairro = Column('NO_BAIRRO', String(100))
    no_cidade = Column('NO_CIDADE', String(100), nullable=False)
    sg_estado = Column('SG_ESTADO', String(2), nullable=False)
    nr_cep = Column('NR_CEP', String(10), nullable=False)
    fl_principal = Column('FL_PRINCIPAL', Boolean, default=False)
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    dt_atualizacao = Column('DT_ATUALIZACAO', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    cliente = relationship('Cliente', back_populates='enderecos')

class Contato(Base):
    __tablename__ = 'TB_CONTATOS'
    
    id_contato = Column('ID_CONTATO', Integer, primary_key=True)
    id_cliente = Column('ID_CLIENTE', Integer, ForeignKey('TB_CLIENTES.ID_CLIENTE', ondelete='CASCADE'), nullable=False)
    no_contato = Column('NO_CONTATO', String(200), nullable=False)
    ds_cargo = Column('DS_CARGO', String(100))
    ds_email = Column('DS_EMAIL', String(150))
    nr_telefone = Column('NR_TELEFONE', String(20))
    fl_principal = Column('FL_PRINCIPAL', Boolean, default=False)
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    dt_atualizacao = Column('DT_ATUALIZACAO', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    cliente = relationship('Cliente', back_populates='contatos')

# ============================================
# PRODUTOS E CATÁLOGO
# ============================================

class CategoriaProduto(Base):
    __tablename__ = 'TB_CATEGORIAS_PRODUTOS'
    
    id_categoria = Column('ID_CATEGORIA', Integer, primary_key=True)
    id_organizacao = Column('ID_ORGANIZACAO', Integer, ForeignKey('TB_ORGANIZACOES.ID_ORGANIZACAO', ondelete='CASCADE'), nullable=False)
    no_categoria = Column('NO_CATEGORIA', String(100), nullable=False)
    id_categoria_pai = Column('ID_CATEGORIA_PAI', Integer, ForeignKey('TB_CATEGORIAS_PRODUTOS.ID_CATEGORIA'))
    ds_categoria = Column('DS_CATEGORIA', Text)
    fl_ativa = Column('FL_ATIVA', Boolean, default=True)
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    
    __table_args__ = (UniqueConstraint('ID_ORGANIZACAO', 'NO_CATEGORIA', 'ID_CATEGORIA_PAI', name='UK_CATEGORIAS_NOME_ORG'),)
    
    organizacao = relationship('Organizacao', back_populates='categorias_produto')
    produtos = relationship('Produto', back_populates='categoria')
    parent = relationship('CategoriaProduto', remote_side=[id_categoria], backref='children')

class Produto(Base):
    __tablename__ = 'TB_PRODUTOS'
    
    id_produto = Column('ID_PRODUTO', Integer, primary_key=True)
    id_empresa = Column('ID_EMPRESA', Integer, ForeignKey('TB_EMPRESAS.ID_EMPRESA', ondelete='CASCADE'), nullable=False)
    id_categoria = Column('ID_CATEGORIA', Integer, ForeignKey('TB_CATEGORIAS_PRODUTOS.ID_CATEGORIA'))
    cd_produto = Column('CD_PRODUTO', String(50), nullable=False)
    ds_produto = Column('DS_PRODUTO', Text, nullable=False)
    vl_base = Column('VL_BASE', Numeric(15,2), nullable=False)
    sg_unidade_medida = Column('SG_UNIDADE_MEDIDA', String(10))
    fl_ativo = Column('FL_ATIVO', Boolean, default=True)
    dt_exclusao = Column('DT_EXCLUSAO', DateTime)
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    dt_atualizacao = Column('DT_ATUALIZACAO', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (UniqueConstraint('ID_EMPRESA', 'CD_PRODUTO', name='UK_PRODUTOS_CODIGO_EMPRESA'),)
    
    empresa = relationship('Empresa', back_populates='produtos')
    categoria = relationship('CategoriaProduto', back_populates='produtos')
    variacoes = relationship('VariacaoProduto', back_populates='produto', cascade='all, delete-orphan')
    historico_precos = relationship('HistoricoPreco', back_populates='produto', cascade='all, delete-orphan')
    itens_pedido = relationship('ItemPedido', back_populates='produto')

class VariacaoProduto(Base):
    __tablename__ = 'TB_VARIACOES_PRODUTOS'
    
    id_variacao = Column('ID_VARIACAO', Integer, primary_key=True)
    id_produto = Column('ID_PRODUTO', Integer, ForeignKey('TB_PRODUTOS.ID_PRODUTO', ondelete='CASCADE'), nullable=False)
    ds_tamanho = Column('DS_TAMANHO', String(20))
    ds_cor = Column('DS_COR', String(50))
    cd_sku = Column('CD_SKU', String(100), unique=True)
    vl_ajuste_preco = Column('VL_AJUSTE_PRECO', Numeric(15,2), default=0.00)
    qt_estoque = Column('QT_ESTOQUE', Integer, default=0)
    fl_ativa = Column('FL_ATIVA', Boolean, default=True)
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    
    produto = relationship('Produto', back_populates='variacoes')
    itens_pedido = relationship('ItemPedido', back_populates='variacao')

class HistoricoPreco(Base):
    __tablename__ = 'TB_HISTORICO_PRECOS'
    
    id_historico = Column('ID_HISTORICO', Integer, primary_key=True)
    id_produto = Column('ID_PRODUTO', Integer, ForeignKey('TB_PRODUTOS.ID_PRODUTO', ondelete='CASCADE'), nullable=False)
    vl_anterior = Column('VL_ANTERIOR', Numeric(15,2), nullable=False)
    vl_novo = Column('VL_NOVO', Numeric(15,2), nullable=False)
    ds_motivo_alteracao = Column('DS_MOTIVO_ALTERACAO', String(200))
    id_usuario_alteracao = Column('ID_USUARIO_ALTERACAO', Integer, ForeignKey('TB_USUARIOS.ID_USUARIO'))
    dt_alteracao = Column('DT_ALTERACAO', DateTime, default=datetime.utcnow)
    
    produto = relationship('Produto', back_populates='historico_precos')
    usuario_alteracao = relationship('Usuario', back_populates='historico_precos', foreign_keys=[id_usuario_alteracao])

# ============================================
# PAGAMENTOS E COMISSÕES
# ============================================

class FormaPagamento(Base):
    __tablename__ = 'TB_FORMAS_PAGAMENTO'
    
    id_forma_pagamento = Column('ID_FORMA_PAGAMENTO', Integer, primary_key=True)
    id_organizacao = Column('ID_ORGANIZACAO', Integer, ForeignKey('TB_ORGANIZACOES.ID_ORGANIZACAO', ondelete='CASCADE'), nullable=True) # NULL = Global
    no_forma_pagamento = Column('NO_FORMA_PAGAMENTO', String(100), nullable=False)
    fl_permite_parcelamento = Column('FL_PERMITE_PARCELAMENTO', Boolean, default=False)
    qt_maximo_parcelas = Column('QT_MAXIMO_PARCELAS', Integer, default=1)
    fl_ativa = Column('FL_ATIVA', Boolean, default=True)
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    dt_atualizacao = Column('DT_ATUALIZACAO', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (UniqueConstraint('ID_ORGANIZACAO', 'NO_FORMA_PAGAMENTO', name='UK_FORMAS_PAGAMENTO_NOME'),)
    
    organizacao = relationship('Organizacao', back_populates='formas_pagamento')
    pedidos = relationship('Pedido', back_populates='forma_pagamento')

class RegraComissao(Base):
    __tablename__ = 'TB_REGRAS_COMISSAO'
    
    id_regra_comissao = Column('ID_REGRA_COMISSAO', Integer, primary_key=True)
    id_organizacao = Column('ID_ORGANIZACAO', Integer, ForeignKey('TB_ORGANIZACOES.ID_ORGANIZACAO', ondelete='CASCADE'), nullable=False)
    id_empresa = Column('ID_EMPRESA', Integer, ForeignKey('TB_EMPRESAS.ID_EMPRESA', ondelete='CASCADE'), nullable=True) 
    id_usuario = Column('ID_USUARIO', Integer, ForeignKey('TB_USUARIOS.ID_USUARIO', ondelete='CASCADE'), nullable=True)
    pc_comissao = Column('PC_COMISSAO', Numeric(5,2), nullable=False)
    nr_prioridade = Column('NR_PRIORIDADE', Integer, default=0)
    dt_inicio_vigencia = Column('DT_INICIO_VIGENCIA', Date)
    dt_fim_vigencia = Column('DT_FIM_VIGENCIA', Date)
    fl_ativa = Column('FL_ATIVA', Boolean, default=True)
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    
    organizacao = relationship('Organizacao', back_populates='regras_comissao')
    empresa = relationship('Empresa', back_populates='regras_comissao')
    usuario = relationship('Usuario', back_populates='regras_comissao', foreign_keys=[id_usuario])

# ============================================
# PEDIDOS
# ============================================

class Pedido(Base):
    __tablename__ = 'TB_PEDIDOS'
    
    id_pedido = Column('ID_PEDIDO', Integer, primary_key=True)
    id_usuario = Column('ID_USUARIO', Integer, ForeignKey('TB_USUARIOS.ID_USUARIO'), nullable=False) # Vendedor
    id_empresa = Column('ID_EMPRESA', Integer, ForeignKey('TB_EMPRESAS.ID_EMPRESA'), nullable=False)
    id_cliente = Column('ID_CLIENTE', Integer, ForeignKey('TB_CLIENTES.ID_CLIENTE'), nullable=False)
    id_endereco_entrega = Column('ID_ENDERECO_ENTREGA', Integer, ForeignKey('TB_ENDERECOS.ID_ENDERECO'))
    id_endereco_cobranca = Column('ID_ENDERECO_COBRANCA', Integer, ForeignKey('TB_ENDERECOS.ID_ENDERECO'))
    id_forma_pagamento = Column('ID_FORMA_PAGAMENTO', Integer, ForeignKey('TB_FORMAS_PAGAMENTO.ID_FORMA_PAGAMENTO'))
    
    nr_pedido = Column('NR_PEDIDO', String(50))
    pc_desconto = Column('PC_DESCONTO', Numeric(5,2), default=0.00)
    vl_total = Column('VL_TOTAL', Numeric(15,2), nullable=False)
    st_pedido = Column('ST_PEDIDO', String(20), nullable=False, default='pendente')
    ds_observacoes = Column('DS_OBSERVACOES', Text)
    dt_pedido = Column('DT_PEDIDO', DateTime, default=datetime.utcnow)
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    dt_atualizacao = Column('DT_ATUALIZACAO', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    vendedor = relationship('Usuario', back_populates='pedidos', foreign_keys=[id_usuario])
    empresa = relationship('Empresa', back_populates='pedidos')
    cliente = relationship('Cliente', back_populates='pedidos')
    forma_pagamento = relationship('FormaPagamento', back_populates='pedidos')
    endereco_entrega = relationship('Endereco', foreign_keys=[id_endereco_entrega])
    endereco_cobranca = relationship('Endereco', foreign_keys=[id_endereco_cobranca])
    
    itens = relationship('ItemPedido', back_populates='pedido', cascade='all, delete-orphan')
    comissoes = relationship('ComissaoPedido', back_populates='pedido', cascade='all, delete-orphan')

class ItemPedido(Base):
    __tablename__ = 'TB_ITENS_PEDIDO'
    
    id_item_pedido = Column('ID_ITEM_PEDIDO', Integer, primary_key=True)
    id_pedido = Column('ID_PEDIDO', Integer, ForeignKey('TB_PEDIDOS.ID_PEDIDO', ondelete='CASCADE'), nullable=False)
    id_produto = Column('ID_PRODUTO', Integer, ForeignKey('TB_PRODUTOS.ID_PRODUTO'), nullable=False)
    id_variacao = Column('ID_VARIACAO', Integer, ForeignKey('TB_VARIACOES_PRODUTOS.ID_VARIACAO'), nullable=True)
    qt_quantidade = Column('QT_QUANTIDADE', Integer, nullable=False)
    vl_unitario = Column('VL_UNITARIO', Numeric(15,2), nullable=False)
    pc_desconto_item = Column('PC_DESCONTO_ITEM', Numeric(5,2), default=0.00)
    vl_total_item = Column('VL_TOTAL_ITEM', Numeric(15,2), nullable=False)
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    dt_atualizacao = Column('DT_ATUALIZACAO', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    pedido = relationship('Pedido', back_populates='itens')
    produto = relationship('Produto', back_populates='itens_pedido')
    variacao = relationship('VariacaoProduto', back_populates='itens_pedido')

class ComissaoPedido(Base):
    __tablename__ = 'TB_COMISSOES_PEDIDO'
    
    id_comissao_pedido = Column('ID_COMISSAO_PEDIDO', Integer, primary_key=True)
    id_pedido = Column('ID_PEDIDO', Integer, ForeignKey('TB_PEDIDOS.ID_PEDIDO', ondelete='CASCADE'), nullable=False)
    id_usuario = Column('ID_USUARIO', Integer, ForeignKey('TB_USUARIOS.ID_USUARIO'), nullable=False) # Vendedor
    pc_comissao = Column('PC_COMISSAO', Numeric(5,2), nullable=False)
    vl_comissao = Column('VL_COMISSAO', Numeric(15,2))
    ds_observacao = Column('DS_OBSERVACAO', String(200))
    dt_criacao = Column('DT_CRIACAO', DateTime, default=datetime.utcnow)
    dt_atualizacao = Column('DT_ATUALIZACAO', DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    pedido = relationship('Pedido', back_populates='comissoes')
    vendedor = relationship('Usuario', back_populates='comissoes_pedido', foreign_keys=[id_usuario])

# ============================================
# AUDITORIA
# ============================================

class LogAuditoria(Base):
    """ Mapeia a tabela TB_LOGS_AUDITORIA (COM TIPOS CORRIGIDOS) """
    __tablename__ = 'TB_LOGS_AUDITORIA'
    
    id_log = Column('ID_LOG', BigInteger, primary_key=True)
    id_organizacao = Column('ID_ORGANIZACAO', Integer, ForeignKey('TB_ORGANIZACOES.ID_ORGANIZACAO', ondelete='CASCADE'))
    id_usuario = Column('ID_USUARIO', Integer, ForeignKey('TB_USUARIOS.ID_USUARIO', ondelete='SET NULL'))
    tp_entidade = Column('TP_ENTIDADE', String(50), nullable=False)
    id_entidade = Column('ID_ENTIDADE', Integer, nullable=False)
    tp_acao = Column('TP_ACAO', String(20), nullable=False)
    
    # --- CORREÇÃO AQUI ---
    # Trocado 'JSONB(astext_type=Text())' por 'JSON'
    # O SQLAlchemy usará JSONB no Postgres e um fallback no SQLite.
    ds_valores_antigos = Column('DS_VALORES_ANTIGOS', JSON) 
    ds_valores_novos = Column('DS_VALORES_NOVOS', JSON)
    
    # --- CORREÇÃO AQUI ---
    # Trocado 'INET' por 'String(45)' (compatível com IPv6)
    ds_endereco_ip = Column('DS_ENDERECO_IP', String(45)) 
    ds_user_agent = Column('DS_USER_AGENT', Text)
    dt_acao = Column('DT_ACAO', DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    organizacao = relationship('Organizacao', back_populates='logs_auditoria')
    usuario = relationship('Usuario', back_populates='logs_auditoria', foreign_keys=[id_usuario])

# ============================================
# VIEWS (Mapeadas como Tabelas Read-Only)
# ============================================
# NOTA: O Base.metadata.create_all() (em main.py) não tentará
# criar estas "tabelas" pois elas já existem no DB (são Views).

class VwVendasVendedorMes(Base):
    """ Mapeia a View VW_VENDAS_VENDEDOR_MES """
    __tablename__ = 'VW_VENDAS_VENDEDOR_MES'
    
    # Definimos as colunas exatamente como na sua View
    # Precisamos de uma "chave primária" para o SQLAlchemy,
    # mesmo que a View não tenha uma. Usamos uma combinação única.
    id_usuario = Column('ID_USUARIO', Integer, primary_key=True)
    no_vendedor = Column('NO_VENDEDOR', String)
    id_organizacao = Column('ID_ORGANIZACAO', Integer)
    # Usamos .server_default para 'datas', pois elas não são definidas pelo Python
    dt_mes_referencia = Column('DT_MES_REFERENCIA', DateTime, primary_key=True, server_default=text('CURRENT_TIMESTAMP'))
    qt_pedidos = Column('QT_PEDIDOS', Integer)
    vl_total_vendas = Column('VL_TOTAL_VENDAS', Numeric)
    vl_ticket_medio = Column('VL_TICKET_MEDIO', Numeric)

class VwComissoesCalculadas(Base):
    """ Mapeia a View VW_COMISSOES_CALCULADAS """
    __tablename__ = 'VW_COMISSOES_CALCULADAS'

    # Precisamos definir uma chave primária para o SQLAlchemy
    id_pedido = Column('ID_PEDIDO', Integer, primary_key=True) 
    
    nr_pedido = Column('NR_PEDIDO', String)
    id_usuario = Column('ID_USUARIO', Integer)
    no_vendedor = Column('NO_VENDEDOR', String)
    id_empresa = Column('ID_EMPRESA', Integer)
    no_empresa = Column('NO_EMPRESA', String)
    vl_total = Column('VL_TOTAL', Numeric)
    pc_comissao_aplicada = Column('PC_COMISSAO_APLICADA', Numeric)
    vl_comissao_calculada = Column('VL_COMISSAO_CALCULADA', Numeric)
    dt_pedido = Column('DT_PEDIDO', DateTime)

class VwVendasEmpresaMes(Base):
    """ Mapeia a View VW_VENDAS_EMPRESA_MES """
    __tablename__ = 'VW_VENDAS_EMPRESA_MES'
    
    # Chave primária composta para o SQLAlchemy
    id_empresa = Column('ID_EMPRESA', Integer, primary_key=True)
    dt_mes_referencia = Column('DT_MES_REFERENCIA', DateTime, primary_key=True, server_default=text('CURRENT_TIMESTAMP'))
    
    no_empresa = Column('NO_EMPRESA', String)
    id_organizacao = Column('ID_ORGANIZACAO', Integer)
    qt_pedidos = Column('QT_PEDIDOS', Integer)
    vl_total_vendas = Column('VL_TOTAL_VENDAS', Numeric)
    qt_clientes_atendidos = Column('QT_CLIENTES_ATENDIDOS', Integer)

class VwVendasPorCidade(Base):
    """ Mapeia a View VW_VENDAS_POR_CIDADE """
    __tablename__ = 'VW_VENDAS_POR_CIDADE'

    # Chave primária composta (complexa) para o SQLAlchemy
    no_cidade = Column('NO_CIDADE', String, primary_key=True)
    sg_estado = Column('SG_ESTADO', String, primary_key=True)
    id_organizacao = Column('ID_ORGANIZACAO', Integer, primary_key=True)
    dt_mes_referencia = Column('DT_MES_REFERENCIA', DateTime, primary_key=True, server_default=text('CURRENT_TIMESTAMP'))

    qt_pedidos = Column('QT_PEDIDOS', Integer)
    vl_total_vendas = Column('VL_TOTAL_VENDAS', Numeric)