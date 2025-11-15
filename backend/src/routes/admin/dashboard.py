# /src/routes/admin/dashboard.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal

from src.database import get_db
from src.models import models
from src.schemas import AdminDashboardKpiSchema
from src.core.security import get_current_super_admin  # Proteção da rota

# Cria o router
admin_dashboard_router = APIRouter(
    prefix="/api/admin/dashboard",
    tags=["16. Super Admin - Dashboard"],  # Mesmo grupo dos Logs
    dependencies=[Depends(get_current_super_admin)]  # Protege a rota
)


@admin_dashboard_router.get("/kpis", response_model=AdminDashboardKpiSchema)
def get_admin_dashboard_kpis(
    db: Session = Depends(get_db)
):
    """
    (Super Admin) Retorna KPIs globais de todo o sistema SaaS.
    """
    try:
        # 1. KPIs de Organizações
        total_ativas = db.query(models.Organizacao).filter(
            models.Organizacao.st_assinatura == 'ativo'
        ).count()

        total_suspensas = db.query(models.Organizacao).filter(
            models.Organizacao.st_assinatura == 'suspenso'
        ).count()

        # 2. KPIs de Usuários (apenas ativos)
        total_gestores = db.query(models.Usuario).filter(
            models.Usuario.tp_usuario == 'gestor',
            models.Usuario.fl_ativo is True
        ).count()

        total_vendedores = db.query(models.Usuario).filter(
            models.Usuario.tp_usuario == 'vendedor',
            models.Usuario.fl_ativo is True
        ).count()

        # 3. KPIs de Pedidos (Globais)
        # Agrega a contagem e a soma dos valores de todos os pedidos não cancelados
        kpis_pedidos = db.query(
            func.count(models.Pedido.id_pedido).label("total_pedidos"),
            func.sum(models.Pedido.vl_total).label("valor_total")
        ).filter(
            models.Pedido.st_pedido != 'cancelado'
        ).first()

        return AdminDashboardKpiSchema(
            total_organizacoes_ativas=total_ativas,
            total_organizacoes_suspensas=total_suspensas,
            total_gestores_ativos=total_gestores,
            total_vendedores_ativos=total_vendedores,
            total_pedidos_sistema=kpis_pedidos.total_pedidos or 0,
            valor_total_pedidos_sistema=kpis_pedidos.valor_total or Decimal(0.0)
        )

    except Exception as e:
        # Se as queries falharem
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao calcular KPIs: {str(e)}"
        )