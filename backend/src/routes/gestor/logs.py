# /src/routes/gestor/logs.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date

from src.database import get_db
from src.models import models
from src.schemas import LogAuditoriaSchema
from src.core.security import get_current_gestor_org_id
from src.routes.gestor.relatorios import get_date_filters  # Reutiliza o helper de data

# Cria o router
gestor_logs_router = APIRouter(
    prefix="/api/gestor/logs",
    tags=["9. Gestor - Logs"],  # Mesmo grupo dos Pedidos
    dependencies=[Depends(get_current_gestor_org_id)]
)


@gestor_logs_router.get("/", response_model=List[LogAuditoriaSchema])
def get_organizacao_logs(
    id_organizacao: int = Depends(get_current_gestor_org_id),  # Pega a Org do token
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    # Filtros
    id_usuario: Optional[int] = Query(None),
    tp_entidade: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    """
    (Gestor) Lista os logs de auditoria APENAS da sua organização.
    """
    # Filtro base OBRIGATÓRIO pela organização
    query = db.query(models.LogAuditoria).options(
        joinedload(models.LogAuditoria.usuario)
    ).filter(
        models.LogAuditoria.id_organizacao == id_organizacao
    )

    # Aplica filtros adicionais
    if id_usuario:
        # (Validação extra: garantir que o usuário filtrado é da org)
        query = query.filter(models.LogAuditoria.id_usuario == id_usuario)
    if tp_entidade:
        query = query.filter(models.LogAuditoria.tp_entidade == tp_entidade)

    if start_date and end_date:
        start, end = get_date_filters(start_date, end_date)
        query = query.filter(models.LogAuditoria.dt_acao.between(start, end))

    logs = query.order_by(models.LogAuditoria.dt_acao.desc()).offset(skip).limit(limit).all()

    return [LogAuditoriaSchema.model_validate(log, from_attributes=True) for log in logs]