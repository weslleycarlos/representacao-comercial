import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Grid, Paper, Alert, CircularProgress, TextField,
  MenuItem, InputAdornment, IconButton, Button, Divider, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Stepper, Step, StepLabel, Stack, Card, CardContent, Chip, Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  AddShoppingCart as AddCartIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  ShoppingCart as CartIcon,
  Description as DescriptionIcon,
  Check as CheckIcon,
  Add as AddIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { type PedidoCreateFormData, type ItemPedidoFormData, pedidoCreateSchema, type ClienteFormData } from '../../tipos/validacao';
import { useAuth } from '../../contextos/AuthContext';
import { useGetVendedorClientes, useCreateVendedorCliente } from '../../api/servicos/vendedorService';
import { useGetCatalogoVenda, useGetFormasPagamento } from '../../api/servicos/vendedorService';
import { useCreatePedido } from '../../api/servicos/vendedorService';
import { useAddVendedorEndereco, useUpdateVendedorEndereco, useGetCatalogosDisponiveis } from '../../api/servicos/vendedorService';
import type { IClienteCompleto, IItemCatalogoVenda, IEndereco } from '../../tipos/schemas';
import { formatCurrency, Decimal } from '../../utils/format';
import { ModalFormCliente } from '../../componentes/gestor/ModalFormCliente';
import { ModalFormEndereco } from '../../componentes/gestor/ModalFormEndereco';

interface ModalNovoPedidoProps {
  open: boolean;
  onClose: () => void;
  onPedidoCriado: () => void;
}

// Steps do processo
const steps = ['Cliente', 'Produtos', 'Confirmar'];
// Função helper para calcular subtotal (mantém da Solução 2)
const calcularSubtotalItem = (item: any) => {
  const precoUnit = Number(item.vl_unitario_base) || 0;
  const qtd = Number(item.qt_quantidade) || 0;
  const desc = Number(item.pc_desconto_item) || 0;
  const totalBruto = precoUnit * qtd;
  return totalBruto * (1 - desc / 100);
};

export const ModalNovoPedido: React.FC<ModalNovoPedidoProps> = ({
  open,
  onClose,
  onPedidoCriado
}) => {

  const { usuario, empresaAtiva } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [activeStep, setActiveStep] = useState(0);
  const [clienteSelecionado, setClienteSelecionado] = useState<IClienteCompleto | null>(null);
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [modalEnderecoAberto, setModalEnderecoAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<IItemCatalogoVenda | null>(null);
  const addEnderecoHook = useAddVendedorEndereco();
  const updateEnderecoHook = useUpdateVendedorEndereco();
  const [qtdItem, setQtdItem] = useState(1);
  
  // Busque os catálogos
  const { data: listaCatalogos } = useGetCatalogosDisponiveis(empresaAtiva?.id_empresa);

  // Configuração do Formulário
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    trigger
  } = useForm<PedidoCreateFormData>({
    resolver: zodResolver(pedidoCreateSchema),
    defaultValues: {
      itens: [],
      pc_desconto: 0,
      ds_observacoes: '',
    },
  });

  // Assista o campo id_catalogo do formulário
  const idCatalogoSelecionado = useWatch({ control, name: 'id_catalogo' });

  // Field Array para os itens do carrinho
  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens",
  });

  const handleOpenNovoEndereco = () => {
    setModalEnderecoAberto(true);
  };

  // Observadores para cálculos
  const itensDoFormulario = useWatch({ control, name: 'itens' });
  const descontoGeral = useWatch({ control, name: 'pc_desconto' });

  // Hooks de API
  const { data: clientes, isLoading: isLoadingClientes, refetch: refetchClientes } = useGetVendedorClientes(empresaAtiva?.id_empresa);
  const { data: catalogo, isLoading: isLoadingCatalogo } = useGetCatalogoVenda(empresaAtiva?.id_empresa,idCatalogoSelecionado);
  const { data: formasPgto, isLoading: isLoadingFormasPgto } = useGetFormasPagamento();

  // Adicione logo após os hooks de API
  useEffect(() => {
    if (clienteSelecionado && clientes) {
      const clienteAtualizado = clientes.find(c => c.id_cliente === clienteSelecionado.id_cliente);
      if (clienteAtualizado) {
        // Atualiza o state local com os novos dados (incluindo o novo endereço)
        setClienteSelecionado(clienteAtualizado);
        
        // Opcional: Se for o único endereço, já seleciona ele nos campos
        if (clienteAtualizado.enderecos.length === 1) {
             const endId = clienteAtualizado.enderecos[0].id_endereco;
             setValue('id_endereco_entrega', endId);
             setValue('id_endereco_cobranca', endId);
        }
      }
    }
  }, [clientes]);

  // Auto-selecionar o primeiro catálogo se houver apenas um (UX)
  useEffect(() => {
    if (listaCatalogos && listaCatalogos.length > 0 && !idCatalogoSelecionado) {
       setValue('id_catalogo', listaCatalogos[0].id_catalogo);
    }
  }, [listaCatalogos, idCatalogoSelecionado, setValue]); 

  const { mutate: criarCliente, isPending: isCriandoCliente, error: erroCriarCliente } = useCreateVendedorCliente();
  const { mutate: salvarPedido, isPending: isSalvando, error: erroSalvar } = useCreatePedido();

  const apiError = erroCriarCliente || erroSalvar;

  // Reset do modal quando abrir/fechar
  useEffect(() => {
    if (open) {
      reset();
      setActiveStep(0);
      setClienteSelecionado(null);
      setModalClienteAberto(false);
      setProdutoSelecionado(null);
      setQtdItem(1);
    }
  }, [open, reset]);

  // Handlers de Cliente
  const handleSelecionarCliente = (cliente: IClienteCompleto | null) => {
    setClienteSelecionado(cliente);
    if (cliente) {
      setValue('id_cliente', cliente.id_cliente);
      // Auto-seleciona endereços
      if (cliente.enderecos && cliente.enderecos.length > 0) {
        const endPrincipal = cliente.enderecos.find(e => e.fl_principal) || cliente.enderecos[0];
        setValue('id_endereco_entrega', endPrincipal.id_endereco);
        setValue('id_endereco_cobranca', endPrincipal.id_endereco);
      } else {
        // Se o cliente não tem endereços, limpa (usuário terá que adicionar)
        setValue('id_endereco_entrega', 0);
        setValue('id_endereco_cobranca', 0);
      }
    } else {
      setValue('id_cliente', 0);
    }
  };

  // Handlers de Itens
  const handleAddItemAoCarrinho = () => {
    if (!produtoSelecionado || qtdItem <= 0) return;

    const precoBase = produtoSelecionado.vl_preco_catalogo;

    append({
      id_produto: produtoSelecionado.produto.id_produto,
      id_variacao: undefined,
      cd_produto: produtoSelecionado.produto.cd_produto,
      ds_produto: produtoSelecionado.produto.ds_produto,
      vl_unitario_base: precoBase,
      qt_quantidade: qtdItem,
      pc_desconto_item: 0,
    });

    setProdutoSelecionado(null);
    setQtdItem(1);
  };

  // Cálculos
  const { subTotal, totalDescontoItens, valorDescontoGeral, totalPedido } = React.useMemo(() => {
  let subTotalCalc = 0;
  let totalDescontosCalc = 0;
  
  // Itera sobre os itens do formulário - AGORA OBSERVA TODOS OS CAMPOS
  (itensDoFormulario || []).forEach((item) => {
    // Garante que os valores sejam números (usando os valores atuais do formulário)
    const precoUnit = Number(item.vl_unitario_base) || 0;
    const qtd = Number(item.qt_quantidade) || 0;
    const descItemPct = Number(item.pc_desconto_item) || 0;

    const totalBrutoItem = precoUnit * qtd;
    const valorDescontoItem = totalBrutoItem * (descItemPct / 100);
    
    subTotalCalc += totalBrutoItem;
    totalDescontosCalc += valorDescontoItem;
  });
  
  const descGeralPct = Number(descontoGeral) || 0;
  const subTotalLiquido = subTotalCalc - totalDescontosCalc;
  const valorDescontoGeralCalc = subTotalLiquido * (descGeralPct / 100);
  const totalFinal = subTotalLiquido - valorDescontoGeralCalc;
  
  return {
    subTotal: subTotalCalc,
    totalDescontoItens: totalDescontosCalc,
    valorDescontoGeral: valorDescontoGeralCalc,
    totalPedido: totalFinal > 0 ? totalFinal : 0, // Garante que não seja negativo
  };
}, [itensDoFormulario, descontoGeral]); // Já está observando as mudanças

  // Navegação entre steps
  const handleNext = async () => {
    let isValid = false;

    if (activeStep === 0) {
      isValid = await trigger([
        'id_cliente',
        'id_endereco_entrega',
        'id_endereco_cobranca',
        'id_forma_pagamento'
      ]);
      if (isValid) setActiveStep(1);
    } else if (activeStep === 1) {
      isValid = fields.length > 0;
      if (isValid) {
        setActiveStep(2);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Submit final
  const onSubmit = (data: PedidoCreateFormData) => {
    salvarPedido(data, {
      onSuccess: (pedidoSalvo) => {
        onPedidoCriado();
        onClose();
      },
    });
  };

  // Handler para o modal de cliente
  const handleSaveClienteModal = (
    data: ClienteFormData,
    options: { onSuccess: () => void }
  ) => {
    criarCliente(data, {
      onSuccess: () => {
        options.onSuccess();
        refetchClientes();
        setModalClienteAberto(false);
      },
    });
  };

  // Renderização condicional por step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            {/* Header da Etapa */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  p: 1,
                  borderRadius: 2,
                  display: 'flex'
                }}
              >
                <PersonIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Selecione o Cliente
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Escolha um cliente existente ou cadastre um novo
                </Typography>
              </Box>
            </Stack>

            {/* Seletor de Cliente */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Controller
                    name="id_cliente"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={clientes || []}
                        getOptionLabel={(option) => `${option.no_razao_social} (${option.nr_cnpj})`}
                        isOptionEqualToValue={(option, value) => option.id_cliente === value.id_cliente}
                        value={clienteSelecionado}
                        onChange={(_, newValue) => handleSelecionarCliente(newValue)}
                        loading={isLoadingClientes}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Buscar por nome ou CNPJ"
                            placeholder="Digite o nome do cliente..."
                            fullWidth
                            error={!!errors.id_cliente}
                            helperText={errors.id_cliente?.message || "Busque na lista de clientes cadastrados"}
                          />
                        )}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Button
                    variant={"outlined"}
                    color={"primary"}
                    onClick={() => setModalClienteAberto(true)}
                    disabled={isCriandoCliente}
                    startIcon={<AddIcon />}
                    fullWidth
                    size="large"
                    sx={{ 
                      height: '76px',
                      minHeight: '56px'
                    }}
                  >             
                    Novo Cliente
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Se selecionou cliente mas ele não tem endereços */}
            {clienteSelecionado && clienteSelecionado.enderecos.length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Alert 
                  severity="warning" 
                  action={
                    <Button color="inherit" size="small" onClick={handleOpenNovoEndereco}>
                      Cadastrar Endereço
                    </Button>
                  }
                >
                  Este cliente não possui endereços cadastrados.
                </Alert>
              </Grid>
            )}

            {/* Renderiza os selects de endereço APENAS se houver endereços */}
            {clienteSelecionado && clienteSelecionado.enderecos.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Informações do Pedido
                </Typography>
                <Grid container spacing={2}>
                  {/* Endereço de Entrega */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      {...register("id_endereco_entrega")}
                      label="Endereço de Entrega *"
                      select
                      required
                      fullWidth
                      value={watch('id_endereco_entrega') || ''}
                      error={!!errors.id_endereco_entrega}
                      helperText={
                        (clienteSelecionado.enderecos?.length === 0)
                          ? "Este cliente não possui endereços. Cadastre na tela de Clientes."
                          : (errors.id_endereco_entrega?.message || "Onde os produtos serão entregues")
                      }
                      disabled={clienteSelecionado.enderecos?.length === 0}
                      InputLabelProps={{ shrink: true }}
                    >
                      <MenuItem value="" disabled>Selecione um endereço...</MenuItem>
                      {(clienteSelecionado.enderecos || []).map((end) => (
                        <MenuItem key={end.id_endereco} value={end.id_endereco}>
                          {`${end.ds_logradouro}, ${end.nr_endereco || 'S/N'} - ${end.no_cidade}`}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Endereço de Cobrança */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      {...register("id_endereco_cobranca")}
                      label="Endereço de Cobrança *"
                      select
                      required
                      fullWidth
                      value={watch('id_endereco_cobranca') || ''}
                      error={!!errors.id_endereco_cobranca}
                      helperText={
                        (clienteSelecionado.enderecos?.length === 0)
                          ? "Este cliente não possui endereços."
                          : (errors.id_endereco_cobranca?.message)
                      }
                      disabled={clienteSelecionado.enderecos?.length === 0}
                      InputLabelProps={{ shrink: true }}
                    >
                      <MenuItem value="" disabled>Selecione um endereço...</MenuItem>
                      {(clienteSelecionado.enderecos || []).map((end) => (
                        <MenuItem key={end.id_endereco} value={end.id_endereco}>
                          {`${end.ds_logradouro}, ${end.nr_endereco || 'S/N'} - ${end.no_cidade}`}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Forma de Pagamento e Desconto */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      {...register("id_forma_pagamento")}
                      label="Forma de Pagamento *"
                      select
                      required
                      fullWidth
                      defaultValue=""
                      error={!!errors.id_forma_pagamento}
                      helperText={errors.id_forma_pagamento?.message || "Selecione a forma de pagamento"}
                    >
                      <MenuItem value="" disabled>Selecione uma forma...</MenuItem>
                      {(formasPgto || []).map((fp) => (
                        <MenuItem key={fp.id_forma_pagamento} value={fp.id_forma_pagamento}>
                          {fp.no_forma_pagamento}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      {...register("pc_desconto", { valueAsNumber: true })}
                      label="Desconto Geral (%)"
                      type="number"
                      fullWidth
                      InputProps={{
                        inputProps: { min: 0, max: 100 },
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                      helperText="Desconto aplicado sobre o subtotal do pedido"
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            {/* Header da Etapa */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  p: 1,
                  borderRadius: 2,
                  display: 'flex'
                }}
              >
                <CartIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Adicionar Produtos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Escolha os produtos e quantidades do pedido
                </Typography>
              </Box>
            </Stack>

            {/* Seletor de Tabela de Preço (Catálogo) - VERSÃO SIMPLIFICADA */}
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mb: 3,
                borderRadius: 2,
                borderColor: 'divider'
              }}
            >
              <Stack spacing={2}>
                <TextField
                  select
                  label="Tabela de Preços"
                  fullWidth
                  value={idCatalogoSelecionado || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setValue('id_catalogo', val);
                    setProdutoSelecionado(null);
                  }}
                  slotProps={{
                    select: {
                      displayEmpty: true,
                    },
                    input: {
                      sx: { height: '48px' }
                    }
                  }}
                  helperText="Selecione a tabela de preços para visualizar os produtos"
                >
                  <MenuItem value="" disabled>
                    Selecione uma tabela de preços
                  </MenuItem>
                  {(listaCatalogos || []).map((cat) => (
                    <MenuItem key={cat.id_catalogo} value={cat.id_catalogo}>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {cat.no_catalogo}
                        </Typography>
                        {cat.ds_descricao && (
                          <Typography variant="caption" color="text.secondary">
                            {cat.ds_descricao}
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Paper>

            {/* Formulário de Adicionar Item (Só mostra se tiver catálogo) */}
            {idCatalogoSelecionado ? (
              <Paper variant="outlined" sx={{ p: 2.5, mb: 3, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                  Adicionar Item ao Pedido
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Autocomplete
                      options={catalogo || []}
                      getOptionLabel={(option) => `${option.produto.ds_produto} (${option.produto.cd_produto})`}
                      value={produtoSelecionado}
                      onChange={(_, newValue) => setProdutoSelecionado(newValue)}
                      loading={isLoadingCatalogo}
                      renderOption={(props, option) => {
                        const { key, ...restProps } = props as any; 
                        return (
                          <Box component="li" key={key} {...restProps}> 
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {option.produto.ds_produto}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Código: {option.produto.cd_produto} • Preço: {formatCurrency(option.vl_preco_catalogo)}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar Produto"
                          placeholder="Digite o nome ou código..."
                          helperText="Selecione o produto desejado"
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 2 }}>
                    <TextField
                      label="Quantidade"
                      type="number"
                      value={qtdItem}
                      onChange={(e) => setQtdItem(Math.max(1, Number(e.target.value)))}
                      fullWidth
                      InputProps={{ inputProps: { min: 1 } }}
                      helperText="Qtd."
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 2 }}>
                    <TextField
                      label="Preço Unit."
                      value={formatCurrency(produtoSelecionado?.vl_preco_catalogo || 0)}
                      fullWidth
                      disabled
                      helperText="Preço"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Button
                      variant="filled"
                      startIcon={<AddCartIcon />}
                      onClick={handleAddItemAoCarrinho}
                      disabled={!produtoSelecionado || qtdItem <= 0}
                      fullWidth
                      size="large"
                      sx={{ height: '56px' }}
                    >
                      Adicionar
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            ) : (
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <InfoIcon color="info" />
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      Selecione uma tabela de preços
                    </Typography>
                    <Typography variant="caption">
                      Escolha um catálogo acima para visualizar e adicionar produtos ao pedido
                    </Typography>
                  </Box>
                </Stack>
              </Alert>
            )}

            {/* Lista de Itens */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Itens do Pedido
              </Typography>
              <Chip
                label={`${fields.length} ${fields.length === 1 ? 'item' : 'itens'}`}
                color="primary"
                size="small"
              />
            </Stack>

            {fields.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50', border: '2px dashed', borderColor: 'grey.300' }}>
                <CartIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhum produto adicionado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use o formulário acima para adicionar produtos ao pedido
                </Typography>
              </Paper>
            ) : (
              <>
                <TableContainer 
                  component={Paper} 
                  variant="outlined" 
                  sx={{ 
                    mb: 2,
                    maxHeight: { xs: 300, md: 400 },
                    overflow: 'auto'
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Produto</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>Qtd.</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', width: 120 }}>Preço Unit.</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', width: 100 }}>Desc. %</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', width: 130 }}>Subtotal</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', width: 80 }}>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                    {fields.map((item, index) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.ds_produto}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Cód: {item.cd_produto}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            sx={{ width: '70px' }}
                            InputProps={{
                              inputProps: { min: 1 },
                              sx: { textAlign: 'center' }
                            }}
                            {...register(`itens.${index}.qt_quantidade`, { valueAsNumber: true })}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatCurrency(item.vl_unitario_base)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            sx={{ width: '70px' }}
                            InputProps={{
                              inputProps: { min: 0, max: 100 },
                              sx: { textAlign: 'center' }
                            }}
                            {...register(`itens.${index}.pc_desconto_item`, { valueAsNumber: true })}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="primary.main">
                            {formatCurrency(calcularSubtotalItem(item))}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Remover item">
                            <IconButton
                              onClick={() => {
                                remove(index);
                              }}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </TableContainer>

                {/* Resumo Visual */}
                <Paper sx={{ p: 2, bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.200' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total de Itens: <strong>{fields.length}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quantidade Total: <strong>{fields.reduce((sum, item) => sum + Number(item.qt_quantidade || 0), 0)}</strong> unidades
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="body2" color="text.secondary">
                        Total do Pedido (atual)
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {formatCurrency(totalPedido)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            {/* Header da Etapa */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Box
                sx={{
                  bgcolor: 'success.main',
                  color: 'white',
                  p: 1,
                  borderRadius: 2,
                  display: 'flex'
                }}
              >
                <CheckIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Confirmar Pedido
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Revise os dados antes de finalizar
                </Typography>
              </Box>
            </Stack>

            {/* Resumo do Cliente */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" color="primary" />
                  Cliente
                </Typography>
                <Chip label="Etapa 1" size="small" variant="outlined" />
              </Stack>
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {clienteSelecionado?.no_razao_social || 'Cliente não selecionado'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CNPJ: {clienteSelecionado?.nr_cnpj || 'N/D'}
                </Typography>
              </Box>
            </Paper>

            {/* Resumo dos Itens */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CartIcon fontSize="small" color="primary" />
                  Produtos
                </Typography>
                <Chip
                  label={`${fields.length} ${fields.length === 1 ? 'item' : 'itens'}`}
                  size="small"
                  color="primary"
                />
              </Stack>

              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Produto</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Qtd.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Preço</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fields.map((item) => {
                      const subtotal = (item.vl_unitario_base * item.qt_quantidade) * (1 - (item.pc_desconto_item || 0) / 100);
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {item.ds_produto}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.cd_produto}
                              {item.pc_desconto_item > 0 && ` • ${item.pc_desconto_item}% desc.`}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{item.qt_quantidade}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{formatCurrency(item.vl_unitario_base)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(subtotal)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Observações */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                Observações
              </Typography>
              <TextField
                {...register("ds_observacoes")}
                placeholder="Ex: Entrega urgente, produto frágil, instruções especiais..."
                multiline
                rows={3}
                fullWidth
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Informações adicionais sobre o pedido (opcional)
              </Typography>
            </Paper>

            {/* Totais Finais */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                background: `linear-gradient(135deg, #4A90E2 0%, #2D5FA4 100%)`,
                color: 'white'
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Resumo Financeiro
              </Typography>

              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
                    Subtotal dos Produtos:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" sx={{ color: 'white' }}>
                    {formatCurrency(subTotal)}
                  </Typography>
                </Stack>

                {totalDescontoItens > 0 && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
                        Descontos nos Itens:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        -{formatCurrency(totalDescontoItens)}
                      </Typography>
                    </Stack>
                  )}

                  {Number(descontoGeral) > 0 && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
                        Desconto Geral ({descontoGeral}%):
                      </Typography>
                      <Typography variant="body1" fontWeight="medium" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                        -{formatCurrency(valorDescontoGeral)}
                      </Typography>
                    </Stack>
                  )}

                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)', my: 1 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold">
                    TOTAL DO PEDIDO:
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(totalPedido)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* Alerta de Confirmação */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Atenção:</strong> Ao clicar em "Finalizar Pedido", o pedido será enviado para análise.
                Você poderá acompanhar o status na tela de pedidos.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: { xs: '100vh', md: '90vh' },
          maxHeight: { xs: '100vh', md: '900px' },
          m: { xs: 0, md: 2 },
          borderRadius: { xs: 0, md: 2 }
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Novo Pedido
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Preencha as informações para criar o pedido
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            disabled={isSalvando}
            sx={{
              bgcolor: 'grey.100',
              '&:hover': { bgcolor: 'grey.200' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mt: 2 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    '&.Mui-active': {
                      color: 'primary.main',
                      fontSize: '2rem'
                    },
                    '&.Mui-completed': {
                      color: 'success.main'
                    }
                  }
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={activeStep === index ? 'bold' : 'normal'}
                >
                  {label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => { }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Erro ao processar solicitação
              </Typography>
              <Typography variant="body2">
                {(apiError as any)?.response?.data?.detail || (apiError as any).message || 'Ocorreu um erro. Tente novamente.'}
              </Typography>
            </Alert>
          )}

          {renderStepContent()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1, bgcolor: 'grey.50' }}>
        <Button
          onClick={activeStep === 0 ? onClose : handleBack}
          disabled={isSalvando}
          variant="outlined"
          size="large"
        >
          {activeStep === 0 ? 'Cancelar' : 'Voltar'}
        </Button>

        <Box sx={{ flex: 1 }} />

        {/* Indicador de Progresso */}
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
          Etapa {activeStep + 1} de {steps.length}
        </Typography>

        {activeStep === 2 ? (
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={isSalvando}
            size="large"
          >
            {isSalvando ? 'Salvando...' : 'Finalizar Pedido'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (activeStep === 0 && !clienteSelecionado) ||
              (activeStep === 1 && fields.length === 0)
            }
            size="large"
          >
            Avançar
          </Button>
        )}
      </DialogActions>

      {/* Modal de Cliente */}
      {modalClienteAberto && (
        <ModalFormCliente
          open={modalClienteAberto}
          onClose={() => setModalClienteAberto(false)}
          onSave={handleSaveClienteModal}
          isSaving={isCriandoCliente}
          mutationError={erroCriarCliente}
        />
      )}

      {/* Modal de Endereço */}
      {modalEnderecoAberto && clienteSelecionado && (
        <ModalFormEndereco
          open={modalEnderecoAberto}
          onClose={() => setModalEnderecoAberto(false)}
          idCliente={clienteSelecionado.id_cliente}
          addHook={addEnderecoHook}
          updateHook={updateEnderecoHook}
        />
      )}
    </Dialog>
  );
};