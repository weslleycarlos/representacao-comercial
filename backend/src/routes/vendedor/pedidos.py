# /src/routes/vendedor/pedidos.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List
from decimal import Decimal

from src.database import get_db
from src.models import models
from src.schemas import PedidoCreate, PedidoCompletoSchema, FormaPagamentoSchema, PedidoUpdate, PedidoCancelRequest
from src.core.security import get_current_vendedor_contexto

# Cria o router
vendedor_pedidos_router = APIRouter(
    prefix="/api/vendedor/pedidos",
    tags=["6. Vendedor - Pedidos"],
    # Aplica a segurança de VENDEDOR COM CONTEXTO em TODAS as rotas
    dependencies=[Depends(get_current_vendedor_contexto)]
)

async def get_pedido_by_id_vendedor(
    db: Session, 
    id_pedido: int, 
    id_usuario: int
) -> models.Pedido:
    """
    Função helper para buscar um pedido, garantindo que ele pertença
    ao vendedor logado e carregando todos os relacionamentos necessários.
    """
    # Eager load (carregamento otimizado) de todos os relacionamentos
    # que o PedidoCompletoSchema precisa.
    pedido = db.query(models.Pedido).options(
        joinedload(models.Pedido.cliente),
        joinedload(models.Pedido.vendedor),
        joinedload(models.Pedido.empresa),
        joinedload(models.Pedido.forma_pagamento),
        joinedload(models.Pedido.endereco_entrega),
        joinedload(models.Pedido.endereco_cobranca),
        joinedload(models.Pedido.itens).joinedload(models.ItemPedido.produto) # Carrega itens e produtos
    ).filter(
        models.Pedido.id_pedido == id_pedido,
        models.Pedido.id_usuario == id_usuario # Garante que é DO vendedor
    ).first()

    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido não encontrado ou não pertence a este vendedor."
        )
    return pedido

@vendedor_pedidos_router.post("/", response_model=PedidoCompletoSchema, status_code=status.HTTP_201_CREATED)
def create_pedido(
    pedido_in: PedidoCreate,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """
    Cria um novo pedido para a empresa ativa do vendedor.
    """
    id_usuario, id_organizacao, id_empresa_ativa = contexto
    
    if not pedido_in.itens:
        raise HTTPException(status_code=422, detail="O pedido deve conter pelo menos um item.")

    # --- Início da Transação ---
    try:
        # 1. Validar Cliente e Endereços (se pertencem à organização)
        db_cliente = db.query(models.Cliente).filter(
            models.Cliente.id_cliente == pedido_in.id_cliente,
            models.Cliente.id_organizacao == id_organizacao,
            models.Cliente.fl_ativo == True
        ).first()
        if not db_cliente:
            raise HTTPException(status_code=404, detail="Cliente não encontrado ou inativo.")
        
        # (Validação similar para Endereços e Forma de Pagamento...)

        vl_total_calculado = Decimal(0.00)
        db_itens_pedido = []

        # 2. Validar Itens e Calcular Total
        for item_in in pedido_in.itens:
            # Valida se o produto existe E pertence à EMPRESA ATIVA
            db_produto = db.query(models.Produto).filter(
                models.Produto.id_produto == item_in.id_produto,
                models.Produto.id_empresa == id_empresa_ativa,
                models.Produto.fl_ativo == True
            ).first()
            if not db_produto:
                raise HTTPException(status_code=404, detail=f"Produto ID {item_in.id_produto} não encontrado nesta empresa.")
            
            # (Aqui entraria a validação de variação e estoque, se necessário)
            
            vl_total_item = (item_in.vl_unitario * item_in.qt_quantidade) * (1 - (item_in.pc_desconto_item / 100))
            vl_total_calculado += vl_total_item
            
            db_itens_pedido.append(models.ItemPedido(
                id_produto=item_in.id_produto,
                id_variacao=item_in.id_variacao,
                qt_quantidade=item_in.qt_quantidade,
                vl_unitario=item_in.vl_unitario,
                pc_desconto_item=item_in.pc_desconto_item,
                vl_total_item=vl_total_item
            ))

        # 3. Aplicar Desconto Geral do Pedido
        vl_final_pedido = vl_total_calculado * (1 - (pedido_in.pc_desconto / 100))

        # 4. Criar o Pedido (TB_PEDIDOS)
        db_pedido = models.Pedido(
            id_usuario=id_usuario,
            id_empresa=id_empresa_ativa,
            id_cliente=pedido_in.id_cliente,
            id_endereco_entrega=pedido_in.id_endereco_entrega,
            id_endereco_cobranca=pedido_in.id_endereco_cobranca,
            id_forma_pagamento=pedido_in.id_forma_pagamento,
            pc_desconto=pedido_in.pc_desconto,
            vl_total=vl_final_pedido,
            st_pedido='pendente', # Status inicial
            ds_observacoes=pedido_in.ds_observacoes,
            # nr_pedido (deve ser gerado pelo trigger no seu DB)
        )
        
        # 5. Associar Itens ao Pedido
        db_pedido.itens.extend(db_itens_pedido)
        
        db.add(db_pedido)
        
        # (Seu trigger/function de comissão deve ser acionado aqui)
        
        db.commit()
        db.refresh(db_pedido)
        
        # Recarrega o pedido com todos os relacionamentos para o retorno
        db_pedido_completo = db.query(models.Pedido).options(
            joinedload(models.Pedido.cliente),
            joinedload(models.Pedido.vendedor),
            joinedload(models.Pedido.empresa),
            joinedload(models.Pedido.itens),
            joinedload(models.Pedido.forma_pagamento) # <-- ADICIONE AQUI
        ).get(db_pedido.id_pedido)

        return db_pedido_completo

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao criar pedido: {str(e)}"
        )

@vendedor_pedidos_router.get("/", response_model=List[PedidoCompletoSchema])
def get_meus_pedidos(
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 25
):
    """
    Lista todos os pedidos feitos pelo Vendedor logado.
    """
    id_usuario, _, _ = contexto
    
    pedidos = db.query(models.Pedido).options(
        joinedload(models.Pedido.cliente),
        joinedload(models.Pedido.empresa),
        joinedload(models.Pedido.forma_pagamento) # <-- ADICIONE AQUI
    ).filter(
        models.Pedido.id_usuario == id_usuario
    ).order_by(models.Pedido.dt_pedido.desc()).offset(skip).limit(limit).all()
    
    return pedidos

@vendedor_pedidos_router.get("/{id_pedido}", response_model=PedidoCompletoSchema)
async def get_meu_pedido_especifico(
    id_pedido: int,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """
    Busca os detalhes de um pedido específico feito pelo vendedor.
    """
    id_usuario, _, _ = contexto
    
    # A função helper já faz a busca, validação e eager loading
    db_pedido = await get_pedido_by_id_vendedor(db, id_pedido, id_usuario)
    
    return db_pedido # Pydantic v2 fará a conversão


@vendedor_pedidos_router.put("/{id_pedido}", response_model=PedidoCompletoSchema)
async def update_meu_pedido(
    id_pedido: int,
    pedido_in: PedidoUpdate,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """
    Atualiza um pedido (ex: observações ou desconto geral).
    SÓ É PERMITIDO se o status for 'pendente'.
    """
    id_usuario, _, _ = contexto
    db_pedido = await get_pedido_by_id_vendedor(db, id_pedido, id_usuario)

    # Regra de Negócio (PRD): Só pode editar se "pendente"
    if db_pedido.st_pedido != 'pendente':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Não é possível editar um pedido com status '{db_pedido.st_pedido}'."
        )

    # Pega os dados que foram enviados (excluindo os que não vieram)
    update_data = pedido_in.model_dump(exclude_unset=True)
    
    # (Lógica de recálculo de total se o desconto for alterado)
    if 'pc_desconto' in update_data:
        # Lógica de recálculo complexa iria aqui...
        # Por enquanto, apenas atualizamos o campo.
        db_pedido.pc_desconto = update_data['pc_desconto']
        # (Seu trigger no DB deve recalcular o vl_total se o pc_desconto mudar)

    if 'ds_observacoes' in update_data:
        db_pedido.ds_observacoes = update_data['ds_observacoes']

    try:
        db.commit()
        db.refresh(db_pedido)
        return db_pedido
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@vendedor_pedidos_router.post("/{id_pedido}/cancelar", response_model=PedidoCompletoSchema)
async def cancelar_meu_pedido(
    id_pedido: int,
    cancel_in: PedidoCancelRequest,
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """
    Muda o status de um pedido para 'cancelado'.
    """
    id_usuario, _, _ = contexto
    db_pedido = await get_pedido_by_id_vendedor(db, id_pedido, id_usuario)

    # Regra de Negócio: Não pode cancelar pedido já finalizado
    if db_pedido.st_pedido in ('cancelado', 'entregue'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível cancelar um pedido com status '{db_pedido.st_pedido}'."
        )
    
    db_pedido.st_pedido = 'cancelado'
    # Adiciona o motivo às observações
    db_pedido.ds_observacoes = (db_pedido.ds_observacoes or "") + \
        f"\n[CANCELADO PELO VENDEDOR]: {cancel_in.motivo}"

    try:
        db.commit()
        db.refresh(db_pedido)
        return db_pedido
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )