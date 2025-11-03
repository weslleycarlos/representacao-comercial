# /src/routes/admin/logs.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date

from src.database import get_db
from src.models import models
from src.schemas import LogAuditoriaSchema
from src.core.security import get_current_super_admin
from src.routes.gestor.relatorios import get_date_filters # Reutiliza o helper de data

# Cria o router
admin_logs_router = APIRouter(
    prefix="/api/admin/logs",
    tags=["12. Super Admin - Auditoria"],
    dependencies=[Depends(get_current_super_admin)] # Protege TODAS as rotas
)

@admin_logs_router.get("/", response_model=List[LogAuditoriaSchema])
def get_all_logs(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    # Filtros
    id_organizacao: Optional[int] = Query(None),
    id_usuario: Optional[int] = Query(None),
    tp_entidade: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    """
    (Super Admin) Lista todos os logs de auditoria do sistema, com filtros.
    """
    query = db.query(models.LogAuditoria).options(
        joinedload(models.LogAuditoria.usuario) # Carrega dados do usuário
    )
    
    # Aplica filtros
    if id_organizacao:
        query = query.filter(models.LogAuditoria.id_organizacao == id_organizacao)
    if id_usuario:
        query = query.filter(models.LogAuditoria.id_usuario == id_usuario)
    if tp_entidade:
        query = query.filter(models.LogAuditoria.tp_entidade == tp_entidade)
    
    # Filtro de data
    if start_date and end_date:
        start, end = get_date_filters(start_date, end_date)
        query = query.filter(models.LogAuditoria.dt_acao.between(start, end))

    logs = query.order_by(models.LogAuditoria.dt_acao.desc()).offset(skip).limit(limit).all()
    
    return logs