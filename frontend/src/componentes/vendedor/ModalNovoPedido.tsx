// /frontend/src/paginas/vendedor/components/ModalNovoPedido.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Grid, Paper, Alert, CircularProgress, TextField,
  MenuItem, InputAdornment, IconButton, Button, Divider, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter,
  Stepper, Step, StepLabel, Chip, Stack, Card, CardContent
} from '@mui/material';
import {
  Search as SearchIcon,
  AddShoppingCart as AddCartIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  ShoppingCart as CartIcon,
  Description as DescriptionIcon,
  Check as CheckIcon
} from '@mui/icons-material';

import { type PedidoCreateFormData, type ItemPedidoFormData, pedidoCreateSchema } from '../../tipos/validacao';
import { useAuth } from '../../contextos/AuthContext';
import { useConsultaCNPJ } from '../../api/servicos/utilsService';
import { useGetVendedorClientes, useCreateVendedorCliente } from '../../api/servicos/vendedorService';
import { useGetCatalogoVenda, useGetFormasPagamento } from '../../api/servicos/vendedorService';
import { useCreatePedido } from '../../api/servicos/vendedorService';
import type { IClienteCompleto, IItemCatalogoVenda, IEndereco } from '../../tipos/schemas';
import { MaskedInput } from '../../componentes/utils/MaskedInput';
import { formatCurrency, Decimal } from '../../utils/format'; 

interface ModalNovoPedidoProps {
  open: boolean;
  onClose: () => void;
  onPedidoCriado: () => void;
}

// Steps do processo
const steps = ['Cliente', 'Itens', 'Revisão'];

export const ModalNovoPedido: React.FC<ModalNovoPedidoProps> = ({
  open,
  onClose,
  onPedidoCriado
}) => {
  const { usuario } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [clienteSelecionado, setClienteSelecionado] = useState<IClienteCompleto | null>(null);
  const [modoCadastroRapido, setModoCadastroRapido] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<IItemCatalogoVenda | null>(null);
  const [qtdItem, setQtdItem] = useState(1);

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

  // Field Array para os itens do carrinho
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "itens",
  });

  // Observadores para cálculos
  const itensDoFormulario = useWatch({ control, name: 'itens' });
  const descontoGeral = useWatch({ control, name: 'pc_desconto' });

  // Hooks de API
  const { data: clientes, isLoading: isLoadingClientes } = useGetVendedorClientes();
  const { data: catalogo, isLoading: isLoadingCatalogo } = useGetCatalogoVenda();
  const { data: formasPgto, isLoading: isLoadingFormasPgto } = useGetFormasPagamento();
  
  const { mutate: buscarCNPJ, isPending: isBuscandoCNPJ, error: erroCNPJ } = useConsultaCNPJ();
  const { mutate: criarClienteRapido, isPending: isCriandoCliente, error: erroCriarCliente } = useCreateVendedorCliente();
  const { mutate: salvarPedido, isPending: isSalvando, error: erroSalvar } = useCreatePedido();

  const apiError = erroCNPJ || erroCriarCliente || erroSalvar;

  // Reset do modal quando abrir/fechar
  useEffect(() => {
    if (open) {
      reset();
      setActiveStep(0);
      setClienteSelecionado(null);
      setModoCadastroRapido(false);
      setProdutoSelecionado(null);
      setQtdItem(1);
    }
  }, [open, reset]);

  // Handlers de Cliente
  const handleSelecionarCliente = (cliente: IClienteCompleto | null) => {
    setClienteSelecionado(cliente);
    setModoCadastroRapido(false);
    if (cliente) {
      setValue('id_cliente', cliente.id_cliente);
      setValue('nr_cnpj', cliente.nr_cnpj);
      setValue('no_razao_social', cliente.no_razao_social);
      if (cliente.enderecos && cliente.enderecos.length > 0) {
        const endPrincipal = cliente.enderecos.find(e => e.fl_principal) || cliente.enderecos[0];
        setValue('id_endereco_entrega', endPrincipal.id_endereco);
        setValue('id_endereco_cobranca', endPrincipal.id_endereco);
      }
    } else {
      setValue('id_cliente', null);
    }
  };

  const handleBuscaCNPJ = () => {
    const cnpj = watch('nr_cnpj');
    buscarCNPJ(cnpj, {
      onSuccess: (data) => {
        setValue('no_razao_social', data.razao_social || '', { shouldValidate: true });
      },
    });
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

  // Cálculos (mantido da página original)
  const { subTotal, totalDescontoItens, totalPedido } = React.useMemo(() => {
    let subTotal = Decimal(0);
    let totalDescontoItens = Decimal(0);
    
    for (const item of itensDoFormulario || []) {
      const precoUnit = Decimal(item.vl_unitario_base);
      const qtd = Decimal(item.qt_quantidade);
      const descItem = Decimal(item.pc_desconto_item || 0).div(100);
      
      const totalItemBruto = precoUnit.mul(qtd);
      const valorDescontoItem = totalItemBruto.mul(descItem);
      
      subTotal = subTotal.add(totalItemBruto);
      totalDescontoItens = totalDescontoItens.add(valorDescontoItem);
    }
    
    const descGeral = Decimal(descontoGeral || 0).div(100);
    const valorDescontoGeral = (subTotal.sub(totalDescontoItens)).mul(descGeral);
    
    const totalPedido = subTotal.sub(totalDescontoItens).sub(valorDescontoGeral);
    
    return {
      subTotal: subTotal.toNumber(),
      totalDescontoItens: totalDescontoItens.toNumber(),
      totalPedido: totalPedido.toNumber(),
    };
  }, [itensDoFormulario, descontoGeral]);

  // Navegação entre steps
  const handleNext = async () => {
    let isValid = false;

    if (activeStep === 0) {
      // Valida step do cliente
      isValid = await trigger(['id_cliente', 'nr_cnpj', 'no_razao_social']);
      if (isValid) setActiveStep(1);
    } else if (activeStep === 1) {
      // Valida step dos itens
      isValid = fields.length > 0;
      if (isValid) {
        setActiveStep(2);
      } else {
        // Mostrar feedback de que precisa adicionar itens
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Submit final
  const onSubmit = (data: PedidoCreateFormData) => {
    if (modoCadastroRapido && !data.id_cliente) {
      criarClienteRapido({
        nr_cnpj: data.nr_cnpj || '',
        no_razao_social: data.no_razao_social || '',
      }, {
        onSuccess: (novoCliente) => {
          // TODO: Implementar fluxo completo de cadastro rápido
          console.log('Cliente criado:', novoCliente);
        },
      });
    } else {
      salvarPedido(data, {
        onSuccess: (pedidoSalvo) => {
          onPedidoCriado();
          onClose();
        },
      });
    }
  };

  // Renderização condicional por step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon /> Selecione o Cliente
            </Typography>

            {/* Seletor de Cliente */}
            <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Controller
                  name="id_cliente"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={clientes || []}
                      getOptionLabel={(option) => `(${option.nr_cnpj}) ${option.no_razao_social}`}
                      isOptionEqualToValue={(option, value) => option.id_cliente === value.id_cliente}
                      value={clienteSelecionado}
                      onChange={(_, newValue) => handleSelecionarCliente(newValue)}
                      loading={isLoadingClientes}
                      disabled={modoCadastroRapido}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar Cliente Existente"
                          error={!!errors.id_cliente}
                          helperText={errors.id_cliente?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant={modoCadastroRapido ? "contained" : "outlined"}
                  onClick={() => {
                    setModoCadastroRapido(!modoCadastroRapido);
                    handleSelecionarCliente(null);
                  }}
                  disabled={isBuscandoCNPJ || isCriandoCliente}
                  fullWidth
                >
                  {modoCadastroRapido ? 'Cancelar' : 'Novo Cliente'}
                </Button>
              </Grid>
            </Grid>

            {/* Cadastro Rápido */}
            {modoCadastroRapido && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Cadastro Rápido de Cliente
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <MaskedInput
                        mask="cnpj"
                        label="CNPJ"
                        required
                        fullWidth
                        value={watch('nr_cnpj') || ""}
                        onChange={(value) => setValue('nr_cnpj', value)}
                        error={!!errors.nr_cnpj}
                        helperText={errors.nr_cnpj?.message}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={handleBuscaCNPJ} disabled={isBuscandoCNPJ}>
                                {isBuscandoCNPJ ? <CircularProgress size={20} /> : <SearchIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        {...register("no_razao_social")}
                        label="Razão Social"
                        required
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.no_razao_social}
                        helperText={errors.no_razao_social?.message}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Endereços e Pagamento */}
            {clienteSelecionado && !modoCadastroRapido && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register("id_endereco_entrega")}
                      label="Endereço de Entrega"
                      select
                      required
                      fullWidth
                      defaultValue=""
                      error={!!errors.id_endereco_entrega}
                      helperText={errors.id_endereco_entrega?.message}
                    >
                      <MenuItem value="" disabled>Selecione...</MenuItem>
                      {(clienteSelecionado.enderecos || []).map((end) => (
                        <MenuItem key={end.id_endereco} value={end.id_endereco}>
                          {`${end.ds_logradouro}, ${end.nr_endereco || 'S/N'} - ${end.no_cidade}`}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register("id_endereco_cobranca")}
                      label="Endereço de Cobrança"
                      select
                      required
                      fullWidth
                      defaultValue=""
                      error={!!errors.id_endereco_cobranca}
                      helperText={errors.id_endereco_cobranca?.message}
                    >
                      <MenuItem value="" disabled>Selecione...</MenuItem>
                      {(clienteSelecionado.enderecos || []).map((end) => (
                        <MenuItem key={end.id_endereco} value={end.id_endereco}>
                          {`${end.ds_logradouro}, ${end.nr_endereco || 'S/N'} - ${end.no_cidade}`}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register("id_forma_pagamento")}
                      label="Forma de Pagamento"
                      select
                      required
                      fullWidth
                      defaultValue=""
                      disabled={isLoadingFormasPgto}
                      error={!!errors.id_forma_pagamento}
                      helperText={errors.id_forma_pagamento?.message}
                    >
                      <MenuItem value="" disabled>Selecione...</MenuItem>
                      {(formasPgto || []).map((pgto) => (
                        <MenuItem key={pgto.id_forma_pagamento} value={pgto.id_forma_pagamento}>
                          {pgto.no_forma_pagamento}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register("pc_desconto")}
                      label="Desconto Geral (%)"
                      type="number"
                      fullWidth
                      InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                      error={!!errors.pc_desconto}
                      helperText={errors.pc_desconto?.message}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CartIcon /> Adicionar Itens
            </Typography>

            {/* Formulário de Adição */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={12} md={5}>
                    <Autocomplete
                      options={catalogo || []}
                      getOptionLabel={(option) => `(${option.produto.cd_produto}) ${option.produto.ds_produto}`}
                      value={produtoSelecionado}
                      onChange={(_, newValue) => setProdutoSelecionado(newValue)}
                      loading={isLoadingCatalogo}
                      renderInput={(params) => (
                        <TextField {...params} label="Buscar Produto" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={2}>
                    <TextField
                      label="Quantidade"
                      type="number"
                      value={qtdItem}
                      onChange={(e) => setQtdItem(Number(e.target.value))}
                      fullWidth
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={3}>
                    <TextField
                      label="Preço Unitário"
                      value={formatCurrency(produtoSelecionado?.vl_preco_catalogo || 0)}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={2}>
                    <Button
                      variant="contained"
                      startIcon={<AddCartIcon />}
                      onClick={handleAddItemAoCarrinho}
                      disabled={!produtoSelecionado || qtdItem <= 0}
                      fullWidth
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Carrinho */}
            <Typography variant="subtitle1" gutterBottom>
              Itens no Pedido ({fields.length})
            </Typography>
            
            {fields.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                <CartIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  Nenhum item adicionado ao pedido
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Use o formulário acima para adicionar produtos
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell align="right">Qtd</TableCell>
                      <TableCell align="right">Preço</TableCell>
                      <TableCell align="right">Desc. %</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                      <TableCell align="center">Ação</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fields.map((item, index) => {
                      const subtotalItem = (item.vl_unitario_base * item.qt_quantidade) * (1 - (item.pc_desconto_item || 0) / 100);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.ds_produto}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.cd_produto}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              sx={{ width: '70px' }}
                              InputProps={{ inputProps: { min: 1 } }}
                              {...register(`itens.${index}.qt_quantidade`)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.vl_unitario_base)}
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              sx={{ width: '70px' }}
                              InputProps={{ inputProps: { min: 0, max: 100 } }}
                              {...register(`itens.${index}.pc_desconto_item`)}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(subtotalItem)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              onClick={() => remove(index)} 
                              color="error" 
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Resumo Rápido */}
            {fields.length > 0 && (
              <Card sx={{ mt: 2, bgcolor: 'primary.50' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total Parcial:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {formatCurrency(totalPedido)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon /> Revisão do Pedido
            </Typography>

            {/* Resumo do Cliente */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Cliente
                </Typography>
                <Typography>
                  {clienteSelecionado ? 
                    `(${clienteSelecionado.nr_cnpj}) ${clienteSelecionado.no_razao_social}` :
                    `(${watch('nr_cnpj')}) ${watch('no_razao_social')}`
                  }
                </Typography>
              </CardContent>
            </Card>

            {/* Resumo dos Itens */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Itens do Pedido ({fields.length})
                </Typography>
                <Stack spacing={1}>
                  {fields.map((item, index) => (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {item.ds_produto}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.cd_produto} • {item.qt_quantidade} × {formatCurrency(item.vl_unitario_base)}
                          {item.pc_desconto_item > 0 && ` • ${item.pc_desconto_item}% desc.`}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency((item.vl_unitario_base * item.qt_quantidade) * (1 - (item.pc_desconto_item || 0) / 100))}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Observações
                </Typography>
                <TextField
                  {...register("ds_observacoes")}
                  label="Observações do pedido"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Instruções especiais, observações de entrega, etc."
                />
              </CardContent>
            </Card>

            {/* Totais Finais */}
            <Card sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Subtotal:</Typography>
                    <Typography>{formatCurrency(subTotal)}</Typography>
                  </Box>
                  {totalDescontoItens > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Desconto nos Itens:</Typography>
                      <Typography color="error.main">-{formatCurrency(totalDescontoItens)}</Typography>
                    </Box>
                  )}
                  {descontoGeral > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Desconto Geral ({descontoGeral}%):</Typography>
                      <Typography color="error.main">
                        -{formatCurrency((subTotal - totalDescontoItens) * (descontoGeral / 100))}
                      </Typography>
                    </Box>
                  )}
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold">Total do Pedido:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {formatCurrency(totalPedido)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
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
          height: '90vh',
          maxHeight: '900px'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            Novo Pedido
          </Typography>
          <IconButton onClick={onClose} disabled={isSalvando}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mt: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {(apiError as any)?.response?.data?.detail || (apiError as any).message}
            </Alert>
          )}

          {renderStepContent()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={activeStep === 0 ? onClose : handleBack}
          disabled={isSalvando}
        >
          {activeStep === 0 ? 'Cancelar' : 'Voltar'}
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        {activeStep === 2 ? (
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={isSalvando}
            startIcon={isSalvando ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {isSalvando ? 'Salvando...' : 'Finalizar Pedido'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (activeStep === 0 && !clienteSelecionado && !modoCadastroRapido) ||
              (activeStep === 1 && fields.length === 0)
            }
          >
            {activeStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};