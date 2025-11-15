# /src/routes/gestor/relatorios.py
# (VERSÃO CORRIGIDA)

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import datetime, date, timedelta  # <-- 1. CORREÇÃO: Importa o 'timedelta'
from decimal import Decimal

from src.database import get_db
from src.models import models
from src.schemas import (
    GestorDashboardKpiSchema, VendaVendedorMesSchema,
    VendaEmpresaMesSchema, VendaPorCidadeSchema, ComissaoCalculadaSchema
)
from src.core.security import get_current_gestor_org_id

# Cria o router
gestor_relatorios_router = APIRouter(
    prefix="/api/gestor/dashboard",
    tags=["7. Gestor - Relatórios"],
    dependencies=[Depends(get_current_gestor_org_id)]
)


def get_date_filters(start_date: Optional[date], end_date: Optional[date]):
    """ Helper para criar filtros de data padrão (Mês Atual) """
    if not start_date or not end_date:
        today = datetime.utcnow()
        start_date = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Encontra o último dia do mês
        # (Usa timedelta, que agora está importado)
        next_month = (today.replace(day=28) + timedelta(days=4))
        end_date = next_month - timedelta(days=next_month.day)
        end_date = end_date.replace(hour=23, minute=59, second=59)

    return start_date, end_date


@gestor_relatorios_router.get("/kpis", response_model=GestorDashboardKpiSchema)
def get_dashboard_gestor_kpis(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Retorna os KPIs (Indicadores Chave) para o dashboard principal do gestor
    (Focado no Mês Atual).
    """
    start_date, end_date = get_date_filters(None, None)  # Mês Atual

    # 1. Total de Vendas, Pedidos e Clientes (usando VW_VENDAS_EMPRESA_MES)
    # Esta query estava correta, pois a View já tem id_organizacao
    kpis_vendas = db.query(
        func.sum(models.VwVendasEmpresaMes.vl_total_vendas).label("vendas"),
        func.sum(models.VwVendasEmpresaMes.qt_pedidos).label("pedidos"),
        func.sum(models.VwVendasEmpresaMes.qt_clientes_atendidos).label("clientes")
    ).filter(
        models.VwVendasEmpresaMes.id_organizacao == id_organizacao,
        models.VwVendasEmpresaMes.dt_mes_referencia >= start_date,
        models.VwVendasEmpresaMes.dt_mes_referencia <= end_date
    ).first()

    # --- 2. CORREÇÃO DA QUERY DE COMISSÕES ---
    # A View VW_COMISSOES_CALCULADAS não tem id_organizacao.
    # Devemos fazer o JOIN com a TB_EMPRESAS (via id_empresa) para filtrar.
    kpis_comissoes = db.query(
        func.sum(models.VwComissoesCalculadas.vl_comissao_calculada).label("comissoes")
    ).join(
        models.Empresa, models.VwComissoesCalculadas.id_empresa == models.Empresa.id_empresa
    ).filter(
        models.Empresa.id_organizacao == id_organizacao,  # Filtra pela Organização da Empresa
        models.VwComissoesCalculadas.dt_pedido.between(start_date, end_date)
    ).scalar()

    vendas = kpis_vendas.vendas or Decimal(0.0)
    pedidos = kpis_vendas.pedidos or 0
    clientes = kpis_vendas.clientes or 0
    ticket_medio = (vendas / pedidos) if pedidos > 0 else Decimal(0.0)

    return GestorDashboardKpiSchema(
        vendas_mes_atual=vendas,
        pedidos_mes_atual=pedidos,
        ticket_medio_mes_atual=ticket_medio,
        clientes_atendidos_mes_atual=clientes,
        comissoes_pendentes_mes_atual=kpis_comissoes or Decimal(0.0)
    )


@gestor_relatorios_router.get("/relatorio/vendas-vendedor", response_model=List[VendaVendedorMesSchema])
def get_relatorio_vendas_vendedor(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    """ Relatório de Vendas por Vendedor (filtrável por data) """
    start, end = get_date_filters(start_date, end_date)

    dados = db.query(models.VwVendasVendedorMes).filter(
        models.VwVendasVendedorMes.id_organizacao == id_organizacao,
        models.VwVendasVendedorMes.dt_mes_referencia.between(start, end)
    ).order_by(models.VwVendasVendedorMes.vl_total_vendas.desc()).all()

    return [VendaVendedorMesSchema.model_validate(d, from_attributes=True) for d in dados]


@gestor_relatorios_router.get("/relatorio/vendas-empresa", response_model=List[VendaEmpresaMesSchema])
def get_relatorio_vendas_empresa(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    """ Relatório de Vendas por Empresa Representada (filtrável por data) """
    start, end = get_date_filters(start_date, end_date)

    dados = db.query(models.VwVendasEmpresaMes).filter(
        models.VwVendasEmpresaMes.id_organizacao == id_organizacao,
        models.VwVendasEmpresaMes.dt_mes_referencia.between(start, end)
    ).order_by(models.VwVendasEmpresaMes.vl_total_vendas.desc()).all()

    return [VendaEmpresaMesSchema.model_validate(d, from_attributes=True) for d in dados]


@gestor_relatorios_router.get("/relatorio/vendas-cidade", response_model=List[VendaPorCidadeSchema])
def get_relatorio_vendas_cidade(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    """ Relatório de Vendas por Cidade (filtrável por data) """
    start, end = get_date_filters(start_date, end_date)

    dados = db.query(models.VwVendasPorCidade).filter(
        models.VwVendasPorCidade.id_organizacao == id_organizacao,
        models.VwVendasPorCidade.dt_mes_referencia.between(start, end)
    ).order_by(models.VwVendasPorCidade.vl_total_vendas.desc()).all()

    return [VendaPorCidadeSchema.model_validate(d, from_attributes=True) for d in dados]


@gestor_relatorios_router.get("/relatorio/comissoes", response_model=List[ComissaoCalculadaSchema])
def get_relatorio_comissoes(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    """ Relatório de Comissões Calculadas (filtrável por data) """
    start, end = get_date_filters(start_date, end_date)

    # --- 3. CORREÇÃO DA QUERY DE COMISSÕES (Refinamento) ---
    # Juntamos a View direto com a Empresa (pois a View já tem id_empresa)
    dados = db.query(models.VwComissoesCalculadas).join(
        models.Empresa, models.VwComissoesCalculadas.id_empresa == models.Empresa.id_empresa
    ).filter(
        models.Empresa.id_organizacao == id_organizacao,
        models.VwComissoesCalculadas.dt_pedido.between(start, end)
    ).order_by(models.VwComissoesCalculadas.dt_pedido.desc()).all()

    return [ComissaoCalculadaSchema.model_validate(d, from_attributes=True) for d in dados]