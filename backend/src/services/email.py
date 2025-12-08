# /backend/src/services/email.py
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType, NameEmail
from pydantic import EmailStr
from starlette.background import BackgroundTasks

from src.models import models
from src.core.config import settings

# Configuração lazy: criada apenas quando necessário
_conf: Optional[ConnectionConfig] = None


def get_email_config() -> ConnectionConfig:
    """
    Retorna a configuração de email, criando-a apenas na primeira chamada.
    Isso garante que as variáveis de ambiente foram carregadas do .env antes.
    """
    global _conf
    if _conf is None:
        _conf = ConnectionConfig(
            MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
            MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
            MAIL_FROM=os.getenv("MAIL_FROM"),
            MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
            MAIL_SERVER=os.getenv("MAIL_SERVER"),
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True,
            TEMPLATE_FOLDER=Path(__file__).parent.parent / "templates",
        )
    return _conf


class EmailService:
    @staticmethod
    def formatar_moeda(valor):
        return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    @staticmethod
    def send_order_confirmation(
        background_tasks: BackgroundTasks,
        pedido: models.Pedido,
        emails_to: List[EmailStr],
    ):
        """
        Prepara os dados e coloca o envio na fila de background tasks.
        """

        # Prepara os dados para o Template HTML
        body_data = {
            "nr_pedido": pedido.nr_pedido or f"#{pedido.id_pedido}",
            "dt_pedido": pedido.dt_pedido.strftime("%d/%m/%Y"),
            "cliente_nome": pedido.cliente.no_razao_social,
            "vendedor_nome": pedido.vendedor.no_completo,
            "itens": [
                {
                    "produto": item.produto.ds_produto,
                    "qtd": item.qt_quantidade,
                    "preco": EmailService.formatar_moeda(item.vl_unitario),
                    "total": EmailService.formatar_moeda(item.vl_total_item),
                }
                for item in pedido.itens
            ],
            "total_pedido": EmailService.formatar_moeda(pedido.vl_total),
            "observacoes": pedido.ds_observacoes or "Sem observações.",
            "status": pedido.st_pedido.upper().replace("_", " "),
        }

        message = MessageSchema(
            subject=f"Pedido {body_data['nr_pedido']} - Confirmação",
            recipients=emails_to,
            template_body=body_data,
            subtype=MessageType.html,
        )

        fm = FastMail(get_email_config())

        # Envia em background para não travar a API
        background_tasks.add_task(
            fm.send_message, message, template_name="pedido_confirmacao.html"
        )

    @staticmethod
    def send_password_reset_email(
        background_tasks: BackgroundTasks, email_to: EmailStr, reset_link: str
    ):
        """
        Envia email com link de recuperação de senha.
        """
        body_data = {"reset_link": reset_link}

        message = MessageSchema(
            subject="Recuperação de Senha - RepCom",
            recipients=[email_to],
            template_body=body_data,
            subtype=MessageType.html,
        )

        fm = FastMail(get_email_config())
        background_tasks.add_task(
            fm.send_message, message, template_name="recuperacao_senha.html"
        )
