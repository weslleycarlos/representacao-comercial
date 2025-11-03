# /src/routes/gestor/vendedores.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from src.database import get_db
from src.models.models import Usuario, Empresa, UsuarioEmpresa
from src.schemas import (
    VendedorCreate, VendedorUpdate, VendedorSchema, 
    VincularEmpresaRequest, UsuarioEmpresaSchema, EmpresaSchema, UsuarioSchema
)
from src.core.security import get_current_gestor_org_id

# Cria o router
gestor_vendedores_router = APIRouter(
    prefix="/api/gestor/vendedores",
    tags=["3. Gestor - Vendedores"],
    dependencies=[Depends(get_current_gestor_org_id)] # Protege todas as rotas
)

def get_vendedor_by_id(db: Session, id_vendedor: int, id_organizacao: int) -> Usuario:
    """
    Função helper para buscar um vendedor, garantindo que ele pertença
    à organização do gestor e que seja do tipo 'vendedor'.
    """
    user = db.query(Usuario).filter(
        Usuario.id_usuario == id_vendedor,
        Usuario.id_organizacao == id_organizacao,
        Usuario.tp_usuario == 'vendedor' # Garante que só podemos gerenciar vendedores
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendedor não encontrado ou não pertence a esta organização."
        )
    return user

@gestor_vendedores_router.post("/", response_model=VendedorSchema, status_code=status.HTTP_201_CREATED)
def create_vendedor(
    vendedor_in: VendedorCreate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Cria um novo usuário do tipo 'vendedor' para a organização do gestor.
    """
    # Verifica se o email já existe
    existing_user = db.query(Usuario).filter(Usuario.ds_email == vendedor_in.ds_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"O email {vendedor_in.ds_email} já está em uso."
        )

    # Cria o novo objeto Usuário
    db_vendedor = Usuario(
        ds_email=vendedor_in.ds_email,
        no_completo=vendedor_in.no_completo,
        nr_telefone=vendedor_in.nr_telefone,
        fl_ativo=vendedor_in.fl_ativo,
        tp_usuario='vendedor', # Define o tipo
        id_organizacao=id_organizacao # Associa à organização do gestor
    )
    db_vendedor.set_password(vendedor_in.password) # Criptografa a senha
    
    try:
        db.add(db_vendedor)
        db.commit()
        db.refresh(db_vendedor)
        # Retorna o schema de Vendedor (que é vazio de empresas por enquanto)
        return VendedorSchema.model_validate(db_vendedor, from_attributes=True)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar vendedor: {str(e)}"
        )

# /vendedores.py (CORRETO)
@gestor_vendedores_router.get("/", response_model=List[VendedorSchema])
def get_vendedores_da_organizacao(
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Lista todos os usuários do tipo 'vendedor' da organização do gestor.
    """
    vendedores = db.query(Usuario).filter(
        Usuario.id_organizacao == id_organizacao,
        Usuario.tp_usuario == 'vendedor'
    ).order_by(Usuario.no_completo).offset(skip).limit(limit).all()
    
    response = []
    for user in vendedores:
        # 1. Converte o usuário base (sem os relacionamentos problemáticos)
        user_data = UsuarioSchema.model_validate(user, from_attributes=True)

        # 2. Converte manualmente as empresas vinculadas
        empresas_list = [
            EmpresaSchema.model_validate(vinculo.empresa, from_attributes=True) 
            for vinculo in user.empresas_vinculadas 
            if vinculo.empresa and vinculo.empresa.fl_ativa
        ]
        
        # 3. Constrói o schema final combinando os dados
        vendedor_schema_data = VendedorSchema(
            **user_data.model_dump(), # Pega dados do UsuarioSchema
            empresas_vinculadas=empresas_list # Adiciona a lista correta
        )
        response.append(vendedor_schema_data)
        
    return response

# /vendedores.py (CORRETO)
@gestor_vendedores_router.get("/{id_vendedor}", response_model=VendedorSchema)
def get_vendedor(
    id_vendedor: int,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Busca detalhes de um vendedor específico, incluindo suas empresas vinculadas.
    """
    user = get_vendedor_by_id(db, id_vendedor, id_organizacao) # Reusa a função helper

    # 1. Converte o usuário base
    user_data = UsuarioSchema.model_validate(user, from_attributes=True)

    # 2. Converte manualmente as empresas
    empresas_list = [
        EmpresaSchema.model_validate(vinculo.empresa, from_attributes=True) 
        for vinculo in user.empresas_vinculadas 
        if vinculo.empresa and vinculo.empresa.fl_ativa
    ]
    
    # 3. Constrói o schema final
    vendedor_schema_data = VendedorSchema(
        **user_data.model_dump(),
        empresas_vinculadas=empresas_list
    )
    
    return vendedor_schema_data

@gestor_vendedores_router.put("/{id_vendedor}", response_model=VendedorSchema)
def update_vendedor(
    id_vendedor: int,
    vendedor_in: VendedorUpdate,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Atualiza os dados de um vendedor (nome, email, status, telefone).
    """
    db_vendedor = get_vendedor_by_id(db, id_vendedor, id_organizacao)
    
    update_data = vendedor_in.model_dump(exclude_unset=True)

    # Verifica se o email está sendo alterado e se já existe
    if 'ds_email' in update_data and update_data['ds_email'] != db_vendedor.ds_email:
        existing_user = db.query(Usuario).filter(
            Usuario.ds_email == update_data['ds_email'],
            Usuario.id_usuario != id_vendedor
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"O email {update_data['ds_email']} já está em uso."
            )

    # Aplica as atualizações
    for key, value in update_data.items():
        setattr(db_vendedor, key, value)
        
    try:
        db.commit()
        db.refresh(db_vendedor)
        return get_vendedor(id_vendedor, id_organizacao, db) # Retorna a visão completa
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# --- ROTAS DE VÍNCULO (TB_USUARIO_EMPRESAS) ---

@gestor_vendedores_router.post("/vincular-empresa", response_model=UsuarioEmpresaSchema, status_code=status.HTTP_201_CREATED)
def vincular_vendedor_empresa(
    vinculo_in: VincularEmpresaRequest,
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Vincula um Vendedor (id_usuario) a uma Empresa Representada (id_empresa).
    Garante que ambos pertençam à organização do Gestor.
    """
    # 1. Valida o Vendedor
    db_vendedor = get_vendedor_by_id(db, vinculo_in.id_usuario, id_organizacao)
    
    # 2. Valida a Empresa
    db_empresa = db.query(Empresa).filter(
        Empresa.id_empresa == vinculo_in.id_empresa,
        Empresa.id_organizacao == id_organizacao,
        Empresa.fl_ativa == True
    ).first()
    
    if not db_empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada ou não pertence a esta organização."
        )
        
    # 3. Verifica se o vínculo já existe
    existing_vinculo = db.query(UsuarioEmpresa).filter(
        UsuarioEmpresa.id_usuario == vinculo_in.id_usuario,
        UsuarioEmpresa.id_empresa == vinculo_in.id_empresa
    ).first()
    
    if existing_vinculo:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este vendedor já está vinculado a esta empresa."
        )
        
    # 4. Cria o Vínculo
    db_vinculo = UsuarioEmpresa(
        id_usuario=vinculo_in.id_usuario,
        id_empresa=vinculo_in.id_empresa
    )
    
    try:
        db.add(db_vinculo)
        db.commit()
        db.refresh(db_vinculo)
        return db_vinculo
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@gestor_vendedores_router.delete("/desvincular-empresa", status_code=status.HTTP_204_NO_CONTENT)
def desvincular_vendedor_empresa(
    vinculo_in: VincularEmpresaRequest, # Reutiliza o schema de request
    id_organizacao: int = Depends(get_current_gestor_org_id),
    db: Session = Depends(get_db)
):
    """
    Remove o vínculo entre um Vendedor e uma Empresa.
    """
    # Busca o vínculo
    db_vinculo = db.query(UsuarioEmpresa).filter(
        UsuarioEmpresa.id_usuario == vinculo_in.id_usuario,
        UsuarioEmpresa.id_empresa == vinculo_in.id_empresa
    ).first()
    
    if not db_vinculo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vínculo não encontrado."
        )
        
    # Validação extra (opcional): garante que o gestor só desvincule da sua org
    if db_vinculo.usuario.id_organizacao != id_organizacao:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado."
        )
        
    try:
        db.delete(db_vinculo)
        db.commit()
        return # Retorna 204 No Content
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )