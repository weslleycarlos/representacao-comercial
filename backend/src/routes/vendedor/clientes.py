# /src/routes/vendedor/clientes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from src.database import get_db
from src.models import models
from src.schemas import (
    ClienteCompletoSchema, ClienteCreate,
    EnderecoSchema, EnderecoCreate, EnderecoUpdate  # <-- Adicione os schemas de Endereço
)
# Reutilizamos a dependência, pois ela nos dá o id_organizacao
from src.core.security import get_current_vendedor_contexto
# Reutilizamos a rota de criação do gestor (lógica é idêntica)
from src.routes.gestor.clientes import create_cliente as gestor_create_cliente, get_cliente_by_id, get_endereco_by_id

# Cria o router
vendedor_clientes_router = APIRouter(
    prefix="/api/vendedor/clientes",
    tags=["12. Vendedor - Clientes"],  # Mesmo grupo
    dependencies=[Depends(get_current_vendedor_contexto)]
)


@vendedor_clientes_router.get("/", response_model=List[ClienteCompletoSchema])
def get_clientes_para_vendedor(
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Lista todos os clientes ATIVOS da organização para o vendedor selecionar.
    """
    _, id_organizacao, _ = contexto

    # Conforme o PRD, o vendedor vê todos os clientes da organização
    clientes = db.query(models.Cliente).filter(
        models.Cliente.id_organizacao == id_organizacao,
        models.Cliente.fl_ativo == True
    ).order_by(models.Cliente.no_razao_social).offset(skip).limit(limit).all()

    return [ClienteCompletoSchema.model_validate(c, from_attributes=True) for c in clientes]


@vendedor_clientes_router.post("/", response_model=ClienteCompletoSchema, status_code=status.HTTP_201_CREATED)
def create_cliente_rapido_vendedor(
    cliente_in: ClienteCreate,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """
    Cadastro rápido de cliente (Vendedor).
    A lógica é idêntica à do Gestor, então reutilizamos a função.
    """
    _, id_organizacao, _ = contexto

    # Reutiliza a função de criação do router do gestor
    # (Não podemos chamar a rota, mas podemos chamar a função Python)
    try:
        db_cliente = gestor_create_cliente(cliente_in, id_organizacao, db)
        return ClienteCompletoSchema.model_validate(db_cliente, from_attributes=True)
    except HTTPException as e:
        # Re-levanta a exceção (ex: conflito de CNPJ)
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# CRUD de Endereços (Vendedor)
# ============================================

@vendedor_clientes_router.get("/{id_cliente}/enderecos", response_model=List[EnderecoSchema])
def get_enderecos_do_cliente_vendedor(
    id_cliente: int,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """
    (Vendedor) Lista todos os endereços de um cliente específico.
    """
    _, id_organizacao, _ = contexto
    # Reutiliza o helper do Gestor, pois a lógica de validação é a mesma
    db_cliente = get_cliente_by_id(db, id_cliente, id_organizacao)
    return [EnderecoSchema.model_validate(end, from_attributes=True) for end in db_cliente.enderecos]


@vendedor_clientes_router.post("/{id_cliente}/enderecos", response_model=EnderecoSchema, status_code=status.HTTP_201_CREATED)
def add_endereco_ao_cliente_vendedor(
    id_cliente: int,
    endereco_in: EnderecoCreate,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """
    (Vendedor) Adiciona um novo endereço a um cliente.
    """
    _, id_organizacao, _ = contexto
    db_cliente = get_cliente_by_id(db, id_cliente, id_organizacao)

    db_endereco = models.Endereco(
        **endereco_in.model_dump(),
        id_cliente=db_cliente.id_cliente
    )
    db.add(db_endereco)
    db.commit()
    db.refresh(db_endereco)
    return EnderecoSchema.model_validate(db_endereco, from_attributes=True)


@vendedor_clientes_router.put("/enderecos/{id_endereco}", response_model=EnderecoSchema)
def update_endereco_vendedor(
    id_endereco: int,
    endereco_in: EnderecoUpdate,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """ (Vendedor) Atualiza um endereço """
    _, id_organizacao, _ = contexto
    db_endereco = get_endereco_by_id(db, id_endereco, id_organizacao)  # Valida

    update_data = endereco_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_endereco, key, value)

    db.commit()
    db.refresh(db_endereco)
    return EnderecoSchema.model_validate(db_endereco, from_attributes=True)


@vendedor_clientes_router.delete("/enderecos/{id_endereco}", status_code=status.HTTP_204_NO_CONTENT)
def delete_endereco_vendedor(
    id_endereco: int,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """ (Vendedor) Exclui um endereço """
    _, id_organizacao, _ = contexto
    db_endereco = get_endereco_by_id(db, id_endereco, id_organizacao)  # Valida

    db.delete(db_endereco)
    db.commit()
    return