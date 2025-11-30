# /backend/src/routes/vendedor/pedidos.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List
from decimal import Decimal
from datetime import datetime
from src.services.email import EmailService
from src.database import get_db
from src.models import models
from src.schemas import (
    PedidoCreate, PedidoCompletoSchema,
    PedidoUpdate, PedidoCancelRequest
)
from src.core.security import get_current_vendedor_contexto

# Cria o router
vendedor_pedidos_router = APIRouter(
    prefix="/api/vendedor/pedidos",
    tags=["10. Vendedor - Pedidos"],
    dependencies=[Depends(get_current_vendedor_contexto)]
)

# --- FUNÇÃO HELPER ---
def get_pedido_by_id_vendedor(
    db: Session,
    id_pedido: int,
    id_usuario: int
) -> models.Pedido:
    """
    Função helper síncrona para buscar um pedido.
    """
    pedido = db.query(models.Pedido).options(
        joinedload(models.Pedido.cliente),
        joinedload(models.Pedido.vendedor),
        joinedload(models.Pedido.empresa),
        joinedload(models.Pedido.forma_pagamento),
        joinedload(models.Pedido.endereco_entrega),
        joinedload(models.Pedido.endereco_cobranca),
        joinedload(models.Pedido.itens).joinedload(models.ItemPedido.produto)
    ).filter(
        models.Pedido.id_pedido == id_pedido,
        models.Pedido.id_usuario == id_usuario
    ).first()

    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado ou não pertence a este vendedor."
        )
    return pedido


# --- ROTA CREATE ---
@vendedor_pedidos_router.post("/", response_model=PedidoCompletoSchema, status_code=status.HTTP_201_CREATED)
def create_pedido(
    pedido_in: PedidoCreate,
    background_tasks: BackgroundTasks,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """
    Cria um novo pedido.
    """
    id_usuario, id_organizacao, id_empresa_ativa = contexto

    if not pedido_in.itens:
        raise HTTPException(status_code=422, detail="O pedido deve conter pelo menos um item.")

    catalogo_ativo = db.query(models.Catalogo).filter(
        models.Catalogo.id_catalogo == pedido_in.id_catalogo,
        models.Catalogo.id_empresa == id_empresa_ativa,
        models.Catalogo.fl_ativo == True
    ).first()

    if not catalogo_ativo:
        raise HTTPException(status_code=400, detail="Nenhum catálogo de preços ativo encontrado para esta empresa.")

    try:
        db_cliente = db.get(models.Cliente, pedido_in.id_cliente)
        if not db_cliente or db_cliente.id_organizacao != id_organizacao:
            raise HTTPException(status_code=404, detail="Cliente não encontrado.")

        vl_total_calculado = Decimal(0.00)
        db_itens_pedido = []

        for item_in in pedido_in.itens:
            
            variacoes_produto = db.query(models.VariacaoProduto).filter(
                models.VariacaoProduto.id_produto == item_in.id_produto,
                models.VariacaoProduto.fl_ativa == True
            ).count()

            # Regra: Se tem variação, id_variacao é obrigatório
            if variacoes_produto > 0 and not item_in.id_variacao:
                 raise HTTPException(
                    status_code=422, 
                    detail=f"O produto {item_in.id_produto} possui grade (tamanho/cor). É necessário especificar a variação."
                )
            
            # Regra: Se NÃO tem variação, id_variacao deve ser nulo (ou ignorado)
            if variacoes_produto == 0 and item_in.id_variacao:
                 item_in.id_variacao = None
            
            item_catalogo = db.query(models.ItemCatalogo).filter(
                models.ItemCatalogo.id_catalogo == catalogo_ativo.id_catalogo,
                models.ItemCatalogo.id_produto == item_in.id_produto,
                models.ItemCatalogo.fl_ativo_no_catalogo == True
            ).first()

            if not item_catalogo:
                raise HTTPException(status_code=404, detail=f"Produto ID {item_in.id_produto} não encontrado ou inativo no catálogo.")

            preco_base = item_catalogo.vl_preco_catalogo

            if item_in.id_variacao:
                variacao = db.get(models.VariacaoProduto, item_in.id_variacao)
                if not variacao or variacao.id_produto != item_in.id_produto:
                    raise HTTPException(status_code=404, detail="Variação inválida.")
                preco_base += variacao.vl_ajuste_preco

            vl_unitario_seguro = preco_base
            vl_total_item = (vl_unitario_seguro * item_in.qt_quantidade) * (1 - (item_in.pc_desconto_item / 100))
            vl_total_calculado += vl_total_item

            db_itens_pedido.append(models.ItemPedido(
                id_produto=item_in.id_produto,
                id_variacao=item_in.id_variacao,
                qt_quantidade=item_in.qt_quantidade,
                vl_unitario=vl_unitario_seguro,
                pc_desconto_item=item_in.pc_desconto_item,
                vl_total_item=vl_total_item
            ))

        vl_final_pedido = vl_total_calculado * (1 - (pedido_in.pc_desconto / 100))

        db_pedido = models.Pedido(
            id_usuario=id_usuario,
            id_empresa=id_empresa_ativa,
            id_cliente=pedido_in.id_cliente,
            id_endereco_entrega=pedido_in.id_endereco_entrega,
            id_endereco_cobranca=pedido_in.id_endereco_cobranca,
            id_forma_pagamento=pedido_in.id_forma_pagamento,
            pc_desconto=pedido_in.pc_desconto,
            vl_total=vl_final_pedido,
            st_pedido='pendente',
            ds_observacoes=pedido_in.ds_observacoes,
        )

        db_pedido.itens.extend(db_itens_pedido)
        db.add(db_pedido)
        db.commit()
        db.refresh(db_pedido)

        db_pedido_completo = get_pedido_by_id_vendedor(db, db_pedido.id_pedido, id_usuario)
    
        # --- ENVIO DE EMAIL ---
        if db_pedido_completo.cliente.ds_email:
            EmailService.send_order_confirmation(
                background_tasks=background_tasks,
                pedido=db_pedido_completo,
                emails_to=[db_pedido_completo.cliente.ds_email]
            )
        return PedidoCompletoSchema.model_validate(db_pedido_completo, from_attributes=True)

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao criar pedido: {str(e)}"
        )


# --- ROTA GET LIST ---
@vendedor_pedidos_router.get("/", response_model=List[PedidoCompletoSchema])
def get_meus_pedidos(
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 25
):
    id_usuario, _, id_empresa_ativa = contexto

    pedidos = db.query(models.Pedido).options(
        joinedload(models.Pedido.cliente),
        joinedload(models.Pedido.empresa),
        joinedload(models.Pedido.forma_pagamento)
    ).filter(
        models.Pedido.id_usuario == id_usuario,
        models.Pedido.id_empresa == id_empresa_ativa
    ).order_by(models.Pedido.dt_pedido.desc()).offset(skip).limit(limit).all()

    return [PedidoCompletoSchema.model_validate(p, from_attributes=True) for p in pedidos]


# --- ROTA GET BY ID ---
@vendedor_pedidos_router.get("/{id_pedido}", response_model=PedidoCompletoSchema)
def get_meu_pedido_especifico(
    id_pedido: int,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    id_usuario, _, _ = contexto
    db_pedido = get_pedido_by_id_vendedor(db, id_pedido, id_usuario)
    return PedidoCompletoSchema.model_validate(db_pedido, from_attributes=True)


# --- ROTA REENVIAR EMAIL ---
@vendedor_pedidos_router.post("/{id_pedido}/reenviar-email")
def reenviar_email_pedido_vendedor(
    id_pedido: int,
    background_tasks: BackgroundTasks,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    id_usuario, _, _ = contexto
    db_pedido = get_pedido_by_id_vendedor(db, id_pedido, id_usuario)
    
    if not db_pedido.cliente.ds_email:
        raise HTTPException(status_code=400, detail="Cliente não possui e-mail cadastrado.")
        
    EmailService.send_order_confirmation(
        background_tasks=background_tasks,
        pedido=db_pedido,
        emails_to=[db_pedido.cliente.ds_email]
    )
    return {"message": "E-mail enviado para a fila de processamento."}


# --- ROTA PUT ---
@vendedor_pedidos_router.put("/{id_pedido}", response_model=PedidoCompletoSchema)
def update_meu_pedido(
    id_pedido: int,
    pedido_in: PedidoUpdate,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    id_usuario, _, _ = contexto
    db_pedido = get_pedido_by_id_vendedor(db, id_pedido, id_usuario)

    if db_pedido.st_pedido != 'pendente':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Não é possível editar um pedido com status '{db_pedido.st_pedido}'."
        )

    update_data = pedido_in.model_dump(exclude_unset=True)

    if 'pc_desconto' in update_data:
        db_pedido.pc_desconto = update_data['pc_desconto']

    if 'ds_observacoes' in update_data:
        db_pedido.ds_observacoes = update_data['ds_observacoes']

    try:
        db.commit()
        db.refresh(db_pedido)
        return PedidoCompletoSchema.model_validate(db_pedido, from_attributes=True)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# --- ROTA CANCELAR ---
@vendedor_pedidos_router.post("/{id_pedido}/cancelar", response_model=PedidoCompletoSchema)
def cancelar_meu_pedido(
    id_pedido: int,
    cancel_in: PedidoCancelRequest,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    id_usuario, _, _ = contexto
    db_pedido = get_pedido_by_id_vendedor(db, id_pedido, id_usuario)

    if db_pedido.st_pedido in ('cancelado', 'entregue'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível cancelar um pedido com status '{db_pedido.st_pedido}'."
        )

    db_pedido.st_pedido = 'cancelado'
    db_pedido.ds_observacoes = (db_pedido.ds_observacoes or "") + \
        f"\n[CANCELADO PELO VENDEDOR]: {cancel_in.motivo}"

    try:
        db.commit()
        db.refresh(db_pedido)
        return PedidoCompletoSchema.model_validate(db_pedido, from_attributes=True)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )