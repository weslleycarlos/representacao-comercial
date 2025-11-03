# /src/routes/vendedor/clientes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.models import models
from src.schemas import ClienteCompletoSchema, ClienteCreate
# Reutilizamos a dependência, pois ela nos dá o id_organizacao
from src.core.security import get_current_vendedor_contexto
# Reutilizamos a rota de criação do gestor (lógica é idêntica)
from src.routes.gestor.clientes import create_cliente as gestor_create_cliente

# Cria o router
vendedor_clientes_router = APIRouter(
    prefix="/api/vendedor/clientes",
    tags=["7. Vendedor - Catálogo e Clientes"], # Mesmo grupo
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
    
    return clientes

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
        return db_cliente
    except HTTPException as e:
        # Re-levanta a exceção (ex: conflito de CNPJ)
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))