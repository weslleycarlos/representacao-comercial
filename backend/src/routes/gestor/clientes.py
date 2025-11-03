# /src/routes/gestor/clientes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from src.database import get_db
from src.models.models import Cliente, Endereco, Contato
from src.schemas import (
    ClienteCreate, ClienteCompletoSchema, EnderecoCreate, EnderecoSchema,
    ContatoCreate, ContatoSchema, ContatoUpdate
)
from src.core.security import get_current_gestor_org_id

# Cria o router
gestor_clientes_router = APIRouter(
    prefix="/api/gestor/clientes",
    tags=["4. Gestor - Clientes"],
    dependencies=[Depends(get_current_gestor_org_id)] # Protege todas as rotas
)

def get_cliente_by_id(db: Session, id_cliente: int, id_organizacao: int) -> Cliente:
    """
    Função helper para buscar um cliente, garantindo que ele pertença
    à organização do gestor.
    """
    cliente = db.query(Cliente).filter(
        Cliente.id_cliente == id_cliente,
        Cliente.id_organizacao == id_organizacao
    ).first()
    
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado ou não pertence a esta organização."
        )
    return cliente

def get_contato_by_id(db: Session, id_contato: int, id_organizacao: int) -> Contato:
    """
    Função helper para buscar um contato, garantindo que ele pertença
    à organização do gestor (através do cliente).
    """
    # Junta Cliente para verificar o id_organizacao
    contato = db.query(Contato).join(Cliente).filter(
        Contato.id_contato == id_contato,
        Cliente.id_organizacao == id_organizacao
    ).first()
    
    if not contato:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contato não encontrado ou não pertence a esta organização."
        )
    return contato

# --- CRUD de Clientes (TB_CLIENTES) ---

@gestor_clientes_router.post("/", response_model=ClienteCompletoSchema, status_code=status.HTTP_201_CREATED)
def create_cliente(
    cliente_in: ClienteCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Cria um novo cliente para a organização do gestor.
    """
    # Verifica a constraint UK_CLIENTES_CNPJ_ORG
    existing_cnpj = db.query(Cliente).filter(
        Cliente.id_organizacao == id_organizacao,
        Cliente.nr_cnpj == cliente_in.nr_cnpj
    ).first()
    
    if existing_cnpj:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"O CNPJ {cliente_in.nr_cnpj} já está cadastrado nesta organização."
        )

    db_cliente = Cliente(
        **cliente_in.model_dump(),
        id_organizacao=id_organizacao
    )
    
    try:
        db.add(db_cliente)
        db.commit()
        db.refresh(db_cliente)
        # Retorna o schema completo (com listas vazias de endereços/contatos)
        return ClienteCompletoSchema.model_validate(db_cliente, from_attributes=True)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar cliente: {str(e)}"
        )

@gestor_clientes_router.get("/", response_model=List[ClienteCompletoSchema])
def get_clientes_da_organizacao(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    ativo: bool = True # Filtro para clientes ativos
):
    """
    Lista todos os clientes da organização do gestor.
    Filtra por clientes ativos por padrão.
    """
    query = db.query(Cliente).filter(
        Cliente.id_organizacao == id_organizacao
    )
    
    if ativo:
        query = query.filter(Cliente.fl_ativo == True)
        
    clientes = query.order_by(Cliente.no_razao_social).offset(skip).limit(limit).all()
    
    # Converte a lista de modelos SQLAlchemy para o Pydantic Schema
    # (O Pydantic lidará com os relacionamentos aninhados 'enderecos' e 'contatos')
    return [ClienteCompletoSchema.model_validate(c, from_attributes=True) for c in clientes]


@gestor_clientes_router.get("/{id_cliente}", response_model=ClienteCompletoSchema)
def get_cliente(
    id_cliente: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Busca detalhes de um cliente específico (incluindo endereços e contatos).
    """
    db_cliente = get_cliente_by_id(db, id_cliente, id_organizacao) # Reusa a função helper
    
    return ClienteCompletoSchema.model_validate(db_cliente, from_attributes=True)

# (Rotas de PUT e DELETE para Cliente seriam adicionadas aqui,
# similares ao CRUD de Empresas)

# --- CRUD de Endereços (TB_ENDERECOS) ---

@gestor_clientes_router.post("/{id_cliente}/enderecos", response_model=EnderecoSchema, status_code=status.HTTP_201_CREATED)
def add_endereco_ao_cliente(
    id_cliente: int,
    endereco_in: EnderecoCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Adiciona um novo endereço a um cliente existente.
    """
    # Garante que o cliente pertence à organização do gestor
    db_cliente = get_cliente_by_id(db, id_cliente, id_organizacao)
    
    db_endereco = Endereco(
        **endereco_in.model_dump(),
        id_cliente=db_cliente.id_cliente # Associa ao cliente validado
    )
    
    try:
        db.add(db_endereco)
        db.commit()
        db.refresh(db_endereco)
        return db_endereco
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@gestor_clientes_router.delete("/enderecos/{id_endereco}", status_code=status.HTTP_204_NO_CONTENT)
def delete_endereco(
    id_endereco: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Exclui um endereço (requer validação cruzada com a organização).
    """
    db_endereco = db.query(Endereco).get(id_endereco)
    
    if not db_endereco:
        raise HTTPException(status_code=404, detail="Endereço não encontrado.")
        
    # Validação de segurança: O gestor só pode apagar endereços
    # de clientes da sua própria organização.
    if db_endereco.cliente.id_organizacao != id_organizacao:
        raise HTTPException(status_code=403, detail="Acesso negado.")
        
    try:
        db.delete(db_endereco)
        db.commit()
        return
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# ============================================
# CRUD de Contatos (TB_CONTATOS)
# ============================================

@gestor_clientes_router.post("/{id_cliente}/contatos", response_model=ContatoSchema, status_code=status.HTTP_201_CREATED)
def add_contato_ao_cliente(
    id_cliente: int,
    contato_in: ContatoCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Adiciona um novo contato a um cliente existente.
    """
    # Garante que o cliente pertence à organização do gestor
    db_cliente = get_cliente_by_id(db, id_cliente, id_organizacao)
    
    db_contato = Contato(
        **contato_in.model_dump(),
        id_cliente=db_cliente.id_cliente # Associa ao cliente validado
    )
    
    try:
        db.add(db_contato)
        db.commit()
        db.refresh(db_contato)
        return db_contato # Pydantic v2 lidará com a conversão
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@gestor_clientes_router.put("/contatos/{id_contato}", response_model=ContatoSchema)
def update_contato(
    id_contato: int,
    contato_in: ContatoUpdate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Atualiza os dados de um contato.
    """
    # O helper 'get_contato_by_id' já valida a organização
    db_contato = get_contato_by_id(db, id_contato, id_organizacao)
    
    # Converte o Pydantic model para dict, excluindo campos não enviados
    update_data = contato_in.model_dump(exclude_unset=True)
    
    # Aplica as atualizações
    for key, value in update_data.items():
        setattr(db_contato, key, value)
        
    try:
        db.commit()
        db.refresh(db_contato)
        return db_contato
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@gestor_clientes_router.delete("/contatos/{id_contato}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contato(
    id_contato: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Exclui um contato (requer validação cruzada com a organização).
    """
    # O helper 'get_contato_by_id' já valida a organização
    db_contato = get_contato_by_id(db, id_contato, id_organizacao)
        
    try:
        db.delete(db_contato)
        db.commit()
        return # Retorna 204 No Content
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )