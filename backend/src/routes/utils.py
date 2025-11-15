# /backend/src/routes/utils.py
import httpx
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Any

# (Vamos proteger essas rotas para que apenas usuários logados possam usá-las)
from src.core.security import get_current_user

utils_router = APIRouter(
    prefix="/api/utils",
    tags=["Utilitários"],  # Corrigido: removido "Utilitários" para manter consistência com main.py
    dependencies=[Depends(get_current_user)]  # Protegido por login
)

# Define a URL base da API pública
BRASIL_API_URL = "https://brasilapi.com.br/api"


@utils_router.get("/cep/v1/{cep}", response_model=Any)
async def consulta_cep(cep: str):
    """
    Consulta um CEP na BrasilAPI (v1).
    """
    try:
        # Usamos um cliente assíncrono
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BRASIL_API_URL}/cep/v1/{cep}")

            # Repassa o erro se a BrasilAPI não encontrar (ex: 404)
            response.raise_for_status()

            return response.json()

    except httpx.HTTPStatusError as e:
        # Retorna o mesmo erro que a API pública (ex: 404 CEP não encontrado)
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Erro ao consultar CEP: {e.response.json().get('message', 'Não encontrado')}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno no servidor: {str(e)}"
        )


@utils_router.get("/cnpj/v1/{cnpj}", response_model=Any)
async def consulta_cnpj(cnpj: str):
    """
    Consulta um CNPJ na BrasilAPI (v1).
    """
    try:
        async with httpx.AsyncClient() as client:
            # O timeout padrão é 5s, aumentamos para 15s pois CNPJ pode demorar
            response = await client.get(f"{BRASIL_API_URL}/cnpj/v1/{cnpj}", timeout=15.0)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Erro ao consultar CNPJ: {e.response.json().get('message', 'Não encontrado ou inválido')}"
        )
    except httpx.ReadTimeout:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="A consulta ao CNPJ demorou muito (timeout)."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno no servidor: {str(e)}"
        )