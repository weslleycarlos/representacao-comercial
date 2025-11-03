# /src/routes/vendedor/dashboard.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List
from datetime import datetime
from decimal import Decimal

from src.database import get_db
from src.models import models
from src.schemas import DashboardVendedorKpiSchema
from src.core.security import get_current_vendedor_contexto # Reutiliza a dependência

# Cria o router
vendedor_dashboard_router = APIRouter(
    prefix="/api/vendedor/dashboard",
    tags=["7. Vendedor - Catálogo e Clientes"], # Mesmo grupo
    dependencies=[Depends(get_current_vendedor_contexto)]
)

@vendedor_dashboard_router.get("/kpis", response_model=DashboardVendedorKpiSchema)
def get_dashboard_vendedor(
    contexto: tuple = Depends(get_current_vendedor_contexto),
    db: Session = Depends(get_db)
):
    """
    Retorna os KPIs (Indicadores Chave) para o dashboard do vendedor logado.
    Utiliza as Views pré-calculadas do banco de dados.
    """
    id_usuario_logado, _, _ = contexto
    mes_atual = datetime.utcnow().month
    ano_atual = datetime.utcnow().year

    # 1. Busca dados da View de Vendas
    vendas_mes = db.query(models.VwVendasVendedorMes).filter(
        models.VwVendasVendedorMes.id_usuario == id_usuario_logado,
        extract('year', models.VwVendasVendedorMes.dt_mes_referencia) == ano_atual,
        extract('month', models.VwVendasVendedorMes.dt_mes_referencia) == mes_atual
    ).first()

    # 2. Busca dados da View de Comissões
    comissoes_mes = db.query(
        func.sum(models.VwComissoesCalculadas.vl_comissao_calculada).label("total_comissao")
    ).filter(
        models.VwComissoesCalculadas.id_usuario == id_usuario_logado,
        extract('year', models.VwComissoesCalculadas.dt_pedido) == ano_atual,
        extract('month', models.VwComissoesCalculadas.dt_pedido) == mes_atual
    ).scalar() # .scalar() retorna o valor da primeira coluna da primeira linha

    # 3. Monta a resposta
    if vendas_mes:
        kpis = DashboardVendedorKpiSchema(
            vendas_mes_atual=vendas_mes.vl_total_vendas,
            pedidos_mes_atual=vendas_mes.qt_pedidos,
            ticket_medio_mes_atual=vendas_mes.vl_ticket_medio,
            comissao_mes_atual=comissoes_mes or Decimal(0.0)
        )
    else:
        # Caso o vendedor não tenha vendas no mês
        kpis = DashboardVendedorKpiSchema(
            vendas_mes_atual=Decimal(0.0),
            pedidos_mes_atual=0,
            ticket_medio_mes_atual=Decimal(0.0),
            comissao_mes_atual=comissoes_mes or Decimal(0.0)
        )

    return kpis