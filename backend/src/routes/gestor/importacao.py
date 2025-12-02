# /src/routes/gestor/importacao.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import io
import json
import re
import os

from src.database import get_db
from src.models import models
from src.core.security import get_current_gestor_org_id
from src.routes.gestor.produtos import get_catalogo_by_id, get_produto_by_id

importacao_router = APIRouter(
    prefix="/api/gestor/importacao",
    tags=["15. Gestor - Importação"],
    dependencies=[Depends(get_current_gestor_org_id)],
)


def parse_sizes(size_str: str) -> List[str]:
    """
    Separa string de tamanhos em lista.
    Ex: "P/M/G" -> ["P", "M", "G"]
    Ex: "38-40-42" -> ["38", "40", "42"]
    """
    if not size_str or pd.isna(size_str):
        return []
    # Converte para string e remove espaços extras
    s = str(size_str).strip()
    # Separa por barra, traço, vírgula ou espaço
    parts = re.split(r"[/\-,\s]+", s)
    return [p.strip() for p in parts if p.strip()]


@importacao_router.post("/preview", status_code=status.HTTP_200_OK)
async def preview_importacao(
    file: UploadFile = File(...),
    id_organizacao: int = Depends(get_current_gestor_org_id),
):
    """
    Lê as primeiras 5 linhas do arquivo Excel para permitir o mapeamento de colunas.
    Retorna: { "headers": [...], "rows": [[...], [...]] }
    """
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Apenas arquivos Excel (.xlsx, .xls) são permitidos.",
        )

    contents = await file.read()
    try:
        # Lê apenas as primeiras linhas
        df = pd.read_excel(io.BytesIO(contents), header=None, nrows=6)
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Erro ao ler arquivo Excel: {str(e)}"
        )

    df = df.dropna(how="all")

    # Converte NaN para None (JSON null)
    df = df.where(pd.notnull(df), None)

    # Retorna lista de listas
    data = df.values.tolist()

    return {"rows": data}


@importacao_router.post("/catalogo", status_code=status.HTTP_200_OK)
async def importar_catalogo(
    id_catalogo: int = Form(...),
    mapping: str = Form(...),  # JSON string: {"col_codigo": 0, "col_descricao": 1, ...}
    file: UploadFile = File(...),
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db),
):
    """
    Importa produtos de um arquivo Excel para um catálogo existente.
    Cria produtos e variações se não existirem.
    """
    # 1. Validações Iniciais
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Apenas arquivos Excel (.xlsx, .xls) são permitidos.",
        )

    try:
        col_map = json.loads(mapping)
    except:
        raise HTTPException(status_code=400, detail="Mapeamento de colunas inválido.")

    # Valida Catálogo
    db_catalogo = get_catalogo_by_id(db, id_catalogo, id_organizacao)
    id_empresa = db_catalogo.id_empresa

    # 2. Ler Arquivo
    contents = await file.read()
    try:
        df = pd.read_excel(
            io.BytesIO(contents), header=None
        )  # Lê sem header para usar índices
    except Exception as e:
        raise HTTPException(
            status_code=400, detail=f"Erro ao ler arquivo Excel: {str(e)}"
        )

    # Remove linhas vazias
    df = df.dropna(how="all")

    # Pula a primeira linha se for cabeçalho (opcional, mas comum)
    df = df.iloc[1:]

    processed_count = 0
    errors = []

    for index, row in df.iterrows():
        try:
            # Extrai dados usando o mapeamento (índices das colunas)
            # col_map ex: {"codigo": 0, "descricao": 1, "tamanhos": 2, "cores": 3, "preco": 4}

            def get_val(key):
                idx = col_map.get(key)
                if idx is not None and str(idx).isdigit():
                    idx = int(idx)
                    if idx < len(row):
                        val = row.iloc[idx]
                        return val if not pd.isna(val) else None
                return None

            cd_produto = get_val("codigo")
            ds_produto = get_val("descricao")
            tamanhos_str = get_val("tamanhos")
            cores_str = get_val("cores")
            vl_preco = get_val("preco")

            # Validações básicas de linha
            if not cd_produto or not ds_produto or not vl_preco:
                continue  # Pula linha incompleta (ou loga erro)

            cd_produto = str(cd_produto).strip()
            ds_produto = str(ds_produto).strip()

            # Limpa preço (R$ 10,00 -> 10.00)
            if isinstance(vl_preco, str):
                vl_preco = (
                    str(vl_preco)
                    .replace("R$", "")
                    .replace(".", "")
                    .replace(",", ".")
                    .strip()
                )

            try:
                vl_preco = float(vl_preco)
            except:
                errors.append(f"Linha {index + 1}: Preço inválido ({vl_preco})")
                continue

            # 3. Busca ou Cria Produto
            produto = (
                db.query(models.Produto)
                .filter(
                    models.Produto.id_empresa == id_empresa,
                    models.Produto.cd_produto == cd_produto,
                )
                .first()
            )

            if not produto:
                produto = models.Produto(
                    id_empresa=id_empresa,
                    cd_produto=cd_produto,
                    ds_produto=ds_produto,
                    fl_ativo=True,
                )
                db.add(produto)
                db.flush()  # Para ter ID

            # 4. Processa Variações (Grade)
            tamanhos = parse_sizes(tamanhos_str)
            cores = parse_sizes(cores_str)  # Pode ser lista de cores também

            # Se não tiver tamanho nem cor, cria variação "Única"
            if not tamanhos and not cores:
                variacoes_to_create = [{"tamanho": "Único", "cor": None}]
            else:
                # Combina Tamanhos e Cores (Produto Cartesiano ou apenas um deles)
                variacoes_to_create = []
                if tamanhos and cores:
                    for t in tamanhos:
                        for c in cores:
                            variacoes_to_create.append({"tamanho": t, "cor": c})
                elif tamanhos:
                    for t in tamanhos:
                        variacoes_to_create.append({"tamanho": t, "cor": None})
                elif cores:
                    for c in cores:
                        variacoes_to_create.append({"tamanho": None, "cor": c})

            for v_data in variacoes_to_create:
                # Verifica se variação já existe
                var_exists = (
                    db.query(models.VariacaoProduto)
                    .filter(
                        models.VariacaoProduto.id_produto == produto.id_produto,
                        models.VariacaoProduto.ds_tamanho == v_data["tamanho"],
                        models.VariacaoProduto.ds_cor == v_data["cor"],
                    )
                    .first()
                )

                if not var_exists:
                    nova_var = models.VariacaoProduto(
                        id_produto=produto.id_produto,
                        ds_tamanho=v_data["tamanho"],
                        ds_cor=v_data["cor"],
                        qt_estoque=0,  # Default
                        fl_ativa=True,
                    )
                    db.add(nova_var)

            # 5. Atualiza/Cria Preço no Catálogo
            item_catalogo = (
                db.query(models.ItemCatalogo)
                .filter(
                    models.ItemCatalogo.id_catalogo == id_catalogo,
                    models.ItemCatalogo.id_produto == produto.id_produto,
                )
                .first()
            )

            if item_catalogo:
                item_catalogo.vl_preco_catalogo = vl_preco
            else:
                item_catalogo = models.ItemCatalogo(
                    id_catalogo=id_catalogo,
                    id_produto=produto.id_produto,
                    vl_preco_catalogo=vl_preco,
                    fl_ativo_no_catalogo=True,
                )
                db.add(item_catalogo)

            processed_count += 1

        except Exception as e:
            errors.append(f"Linha {index + 1}: {str(e)}")

    db.commit()

    return {
        "message": "Importação concluída",
        "processed_count": processed_count,
        "errors": errors,
    }


@importacao_router.get("/modelo")
def baixar_modelo():
    """Retorna um arquivo Excel modelo para preenchimento"""
    # Cria um DataFrame simples
    df = pd.DataFrame(
        {
            "Código": ["REF001", "REF002"],
            "Descrição": ["Camiseta Básica", "Calça Jeans"],
            "Tamanhos": ["P/M/G", "38-40-42"],
            "Cores": ["Branca/Preta", "Azul"],
            "Preço": ["59.90", "129.90"],
        }
    )

    # Salva em memória
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Modelo Importação")
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=modelo_importacao_produtos.xlsx"
        },
    )
