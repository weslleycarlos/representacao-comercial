# /src/routes/gestor/pedidos.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from src.database import get_db
from src.models import models
from src.schemas import PedidoCompletoSchema, PedidoStatusUpdate
from src.core.security import get_current_gestor_org_id, get_current_user

# Cria o router
gestor_pedidos_router = APIRouter(
    prefix="/api/gestor/pedidos",
    tags=["8. Gestor - Pedidos"],  # Novo grupo no /docs
    dependencies=[Depends(get_current_gestor_org_id)]
)


async def get_pedido_by_id_gestor(
    db: Session,
    id_pedido: int,
    id_organizacao: int
) -> models.Pedido:
    """
    Função helper para buscar um pedido, garantindo que ele pertença
    à organização do gestor e carregando todos os relacionamentos.
    """
    pedido = db.query(models.Pedido).options(
        joinedload(models.Pedido.cliente),
        joinedload(models.Pedido.vendedor),
        joinedload(models.Pedido.empresa),
        joinedload(models.Pedido.forma_pagamento),
        joinedload(models.Pedido.endereco_entrega),
        joinedload(models.Pedido.endereco_cobranca),
        joinedload(models.Pedido.itens).joinedload(models.ItemPedido.produto)
    ).join(
        models.Empresa, models.Pedido.id_empresa == models.Empresa.id_empresa
    ).filter(
        models.Pedido.id_pedido == id_pedido,
        models.Empresa.id_organizacao == id_organizacao  # Valida a organização
    ).first()

    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado ou não pertence a esta organização."
        )
    return pedido


@gestor_pedidos_router.get("/", response_model=List[PedidoCompletoSchema])
async def get_pedidos_da_organizacao(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    # Filtros do PRD
    id_vendedor: Optional[int] = Query(None),
    id_empresa: Optional[int] = Query(None),
    id_cliente: Optional[int] = Query(None),
    st_pedido: Optional[str] = Query(None)
):
    """
    Lista todos os pedidos da organização, com filtros.
    """
    query = db.query(models.Pedido).options(
        joinedload(models.Pedido.cliente),
        joinedload(models.Pedido.vendedor),
        joinedload(models.Pedido.empresa)
    ).join(
        models.Empresa, models.Pedido.id_empresa == models.Empresa.id_empresa
    ).filter(
        models.Empresa.id_organizacao == id_organizacao
    )

    # Aplica filtros
    if id_vendedor:
        query = query.filter(models.Pedido.id_usuario == id_vendedor)
    if id_empresa:
        query = query.filter(models.Pedido.id_empresa == id_empresa)
    if id_cliente:
        query = query.filter(models.Pedido.id_cliente == id_cliente)
    if st_pedido:
        query = query.filter(models.Pedido.st_pedido == st_pedido)

    pedidos = query.order_by(models.Pedido.dt_pedido.desc()).offset(skip).limit(limit).all()

    return [PedidoCompletoSchema.model_validate(p, from_attributes=True) for p in pedidos]


@gestor_pedidos_router.get("/{id_pedido}", response_model=PedidoCompletoSchema)
async def get_pedido_especifico_gestor(
    id_pedido: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Busca os detalhes de um pedido específico da organização.
    """
    # A função helper já faz a busca, validação e eager loading
    db_pedido = await get_pedido_by_id_gestor(db, id_pedido, id_organizacao)

    return PedidoCompletoSchema.model_validate(db_pedido, from_attributes=True)


@gestor_pedidos_router.put("/{id_pedido}/status", response_model=PedidoCompletoSchema)
async def update_status_pedido(
    id_pedido: int,
    status_in: PedidoStatusUpdate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    current_user: models.Usuario = Depends(get_current_user),  # Pega o usuário (Gestor)
    db: Session = Depends(get_db)
):
    """
    Atualiza o status de um pedido (ex: pendente -> confirmado).
    (Esta é a principal rota de gerenciamento do gestor)
    """
    db_pedido = await get_pedido_by_id_gestor(db, id_pedido, id_organizacao)

    status_antigo = db_pedido.st_pedido
    novo_status = status_in.novo_status

    # Regra de Negócio (PRD): Não pode reverter status finalizado
    if status_antigo in ('entregue', 'cancelado'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível alterar o status de um pedido '{status_antigo}'."
        )

    # (O PRD menciona status sequencial, mas por enquanto vamos permitir a troca)

    db_pedido.st_pedido = novo_status

    # Adiciona uma observação de auditoria
    observacao = (db_pedido.ds_observacoes or "") + \
        f"\n[Status alterado: {status_antigo} -> {novo_status} por {current_user.ds_email} em {datetime.utcnow().isoformat()}]"
    db_pedido.ds_observacoes = observacao

    try:
        db.commit()
        db.refresh(db_pedido)

        # (Aqui dispararia a lógica de Notificações em tempo real - Fase 2)

        return PedidoCompletoSchema.model_validate(db_pedido, from_attributes=True)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )