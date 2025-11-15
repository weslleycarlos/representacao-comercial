// /frontend/src/paginas/vendedor/NovoPedido.tsx
// (Página de Criação de Pedido - "Carrinho de Compras")

import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Paper, Alert, CircularProgress, TextField,
  MenuItem, InputAdornment, IconButton, Button, Divider, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter
} from '@mui/material';
import {
  Search as SearchIcon,
  AddShoppingCart as AddCartIcon,
  Delete as DeleteIcon
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

export const PaginaNovoPedido: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // --- Estado Local ---
  const [clienteSelecionado, setClienteSelecionado] = useState<IClienteCompleto | null>(null);
  const [modoCadastroRapido, setModoCadastroRapido] = useState(false);

  // --- Configuração do Formulário Principal (RHF) ---
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PedidoCreateFormData>({
    resolver: zodResolver(pedidoCreateSchema),
    defaultValues: {
      itens: [],
      pc_desconto: 0,
      ds_observacoes: '',
    },
  });

  // 'useFieldArray' é o "carrinho"
  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens",
  });

  // Observa o carrinho para recalcular o total
  const itensDoFormulario = useWatch({ control, name: 'itens' });
  const descontoGeral = useWatch({ control, name: 'pc_desconto' });

  // --- Hooks de API (TanStack Query) ---
  // (Busca de dados para os dropdowns)
  const { data: clientes, isLoading: isLoadingClientes } = useGetVendedorClientes();
  const { data: catalogo, isLoading: isLoadingCatalogo } = useGetCatalogoVenda();
  const { data: formasPgto, isLoading: isLoadingFormasPgto } = useGetFormasPagamento();
  
  // (Mutações - Ações)
  const { mutate: buscarCNPJ, isPending: isBuscandoCNPJ, error: erroCNPJ } = useConsultaCNPJ();
  const { mutate: criarClienteRapido, isPending: isCriandoCliente, error: erroCriarCliente } = useCreateVendedorCliente();
  const { mutate: salvarPedido, isPending: isSalvando, error: erroSalvar } = useCreatePedido();

  const apiError = erroCNPJ || erroCriarCliente || erroSalvar;

  // --- Lógica de Negócio ---

  // Atualiza os campos do cliente quando um cliente é selecionado no Autocomplete
  const handleSelecionarCliente = (cliente: IClienteCompleto | null) => {
    setClienteSelecionado(cliente);
    setModoCadastroRapido(false);
    if (cliente) {
      setValue('id_cliente', cliente.id_cliente);
      setValue('nr_cnpj', cliente.nr_cnpj);
      setValue('no_razao_social', cliente.no_razao_social);
      // Auto-seleciona o primeiro endereço (se existir)
      if (cliente.enderecos && cliente.enderecos.length > 0) {
        const endPrincipal = cliente.enderecos.find(e => e.fl_principal) || cliente.enderecos[0];
        setValue('id_endereco_entrega', endPrincipal.id_endereco);
        setValue('id_endereco_cobranca', endPrincipal.id_endereco);
      }
    } else {
      setValue('id_cliente', null);
    }
  };

  // Botão "Buscar CNPJ" (Fluxo de cadastro rápido)
  const handleBuscaCNPJ = () => {
    const cnpj = watch('nr_cnpj');
    buscarCNPJ(cnpj, {
      onSuccess: (data) => {
        setValue('no_razao_social', data.razao_social || '', { shouldValidate: true });
        // (Preenche outros campos se a API retornar)
      },
    });
  };

  // Botão "Adicionar Item"
  const [produtoSelecionado, setProdutoSelecionado] = useState<IItemCatalogoVenda | null>(null);
  const [qtdItem, setQtdItem] = useState(1);

  const handleAddItemAoCarrinho = () => {
    if (!produtoSelecionado || qtdItem <= 0) return;

    // (Calcula o preço base + ajuste de variação, se houver)
    const precoBase = produtoSelecionado.vl_preco_catalogo;
    // const precoFinal = precoBase + (variacaoSelecionada?.vl_ajuste_preco || 0);

    append({
      id_produto: produtoSelecionado.produto.id_produto,
      id_variacao: undefined, // (Lógica de variação viria daqui)
      cd_produto: produtoSelecionado.produto.cd_produto,
      ds_produto: produtoSelecionado.produto.ds_produto,
      vl_unitario_base: precoBase,
      qt_quantidade: qtdItem,
      pc_desconto_item: 0,
    });
    
    // Limpa os campos de adicionar item
    setProdutoSelecionado(null);
    setQtdItem(1);
  };

  // Cálculo de Totais (inspirado no Excel)
  const { subTotal, totalDescontoItens, totalPedido } = React.useMemo(() => {
    let subTotal = Decimal(0);
    let totalDescontoItens = Decimal(0);
    
    for (const item of itensDoFormulario) {
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

  // Função Principal de Salvar
  const onSubmit = (data: PedidoCreateFormData) => {
    // Se estamos no modo "Cadastro Rápido" (sem id_cliente)
    if (modoCadastroRapido && !data.id_cliente) {
      criarClienteRapido({
        nr_cnpj: data.nr_cnpj || '',
        no_razao_social: data.no_razao_social || '',
        // (Envia dados mínimos para a API de Vendedor)
      }, {
        onSuccess: (novoCliente) => {
          // Cliente criado! Agora, precisamos dos endereços dele...
          // (Este fluxo é complexo - por enquanto, vamos focar no cliente existente)
          alert("Cliente criado! (Fluxo de endereço pendente)");
        },
      });
    } else {
      // Cliente já existe, apenas salva o pedido
      salvarPedido(data, {
        onSuccess: (pedidoSalvo) => {
          alert(`Pedido ${pedidoSalvo.nr_pedido} salvo com sucesso!`);
          navigate('/vendedor/pedidos'); // Redireciona para a lista
        },
      });
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Novo Pedido
      </Typography>

      {/* Formulário Principal */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        
        {/* Seção 1: Cliente e Detalhes */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>1. Cliente e Detalhes</Typography>
          
          {/* Seletor de Cliente (inspirado no Fimga) */}
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={8} md={6}>
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
                    disabled={modoCadastroRapido} // Desabilita se estiver cadastrando
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Selecionar Cliente Existente"
                        error={!!errors.id_cliente}
                        helperText={errors.id_cliente?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={6}>
              <Button
                variant="outlined"
                onClick={() => {
                  setModoCadastroRapido(!modoCadastroRapido);
                  handleSelecionarCliente(null);
                }}
                disabled={isBuscandoCNPJ || isCriandoCliente}
              >
                {modoCadastroRapido ? 'Cancelar Cadastro' : 'Novo Cliente (Rápido)'}
              </Button>
            </Grid>
          </Grid>
          
          {/* Formulário de Cadastro Rápido (só aparece se 'modoCadastroRapido' for true) */}
          {modoCadastroRapido && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <MaskedInput
                  mask="cnpj"
                  label="CNPJ (Novo Cliente)"
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
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register("no_razao_social")}
                  label="Razão Social (Novo Cliente)"
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.no_razao_social}
                  helperText={errors.no_razao_social?.message}
                />
              </Grid>
              {/* (Nota: Este fluxo simplificado exigiria que o Vendedor
                   cadastrasse Endereços ANTES de salvar o pedido) */}
            </Grid>
          )}
          
          {/* Endereços e Pagamento (só aparecem se um cliente ESTIVER selecionado) */}
          {clienteSelecionado && !modoCadastroRapido && (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12} sm={6}>
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
          )}

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
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
        </Paper>

        {/* Seção 2: Itens do Pedido (O Carrinho) */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>2. Itens do Pedido</Typography>
          
          {/* Formulário de Adicionar Item (Inspirado no Figma) */}
          <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 2 }}>
            <Grid item xs={12} md={5}>
              <Autocomplete
                options={catalogo || []}
                getOptionLabel={(option) => `(${option.produto.cd_produto}) ${option.produto.ds_produto}`}
                value={produtoSelecionado}
                onChange={(_, newValue) => setProdutoSelecionado(newValue)}
                loading={isLoadingCatalogo}
                renderInput={(params) => (
                  <TextField {...params} label="Buscar Produto no Catálogo" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <TextField
                label="Qtd."
                type="number"
                value={qtdItem}
                onChange={(e) => setQtdItem(Number(e.target.value))}
                fullWidth
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                label="Preço Unit. (R$)"
                value={formatCurrency(produtoSelecionado?.vl_preco_catalogo || 0)}
                fullWidth
                disabled // O preço vem do catálogo
              />
            </Grid>
            <Grid item xs={12} sm={5} md={2}>
              <Button
                variant="contained"
                startIcon={<AddCartIcon />}
                onClick={handleAddItemAoCarrinho}
                disabled={!produtoSelecionado || qtdItem <= 0}
                fullWidth
                sx={{ height: '56px' }} // Altura padrão do TextField
              >
                Adicionar
              </Button>
            </Grid>
          </Grid>
          
          {/* Tabela de Itens (O Carrinho) */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Produto</TableCell>
                  <TableCell align="right">Qtd.</TableCell>
                  <TableCell align="right">Vl. Unitário</TableCell>
                  <TableCell align="right">Desc. (%)</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="center">Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhum item adicionado ao pedido.
                    </TableCell>
                  </TableRow>
                )}
                {fields.map((item, index) => {
                  // Calcula o subtotal do item
                  const subtotalItem = (item.vl_unitario_base * item.qt_quantidade) * (1 - (item.pc_desconto_item || 0) / 100);
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{item.ds_produto}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.cd_produto}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          sx={{ width: '80px' }}
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
                          sx={{ width: '80px' }}
                          InputProps={{ inputProps: { min: 0, max: 100 } }}
                          {...register(`itens.${index}.pc_desconto_item`)}
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(subtotalItem)}</TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => remove(index)} color="error" size="small">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              {/* Footer de Totais */}
              {fields.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} rowSpan={3} />
                    <TableCell align="right"><Typography variant="body2" fontWeight={600}>Subtotal:</Typography></TableCell>
                    <TableCell align="right">{formatCurrency(subTotal)}</TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell align="right"><Typography variant="body2" color="text.secondary">Desc. Itens:</Typography></TableCell>
                    <TableCell align="right">{formatCurrency(totalDescontoItens * -1)}</TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell align="right"><Typography variant="h6" fontWeight={700}>Total:</Typography></TableCell>
                    <TableCell align="right"><Typography variant="h6" fontWeight={700}>{formatCurrency(totalPedido)}</Typography></TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>
        </Paper>
        
        {/* Seção 3: Observações e Salvar */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>3. Observações</Typography>
          <TextField
            {...register("ds_observacoes")}
            label="Observações do Pedido (instruções, etc.)"
            multiline
            rows={4}
            fullWidth
          />
        </Paper>
        
        {/* Footer Fixo (Inspirado no Figma) */}
        <Paper 
          elevation={3} 
          sx={{ 
            position: 'sticky', 
            bottom: 0, 
            p: 2,
            backgroundColor: 'background.paper'
          }}
        >
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {(apiError as any)?.response?.data?.detail || (apiError as any).message}
            </Alert>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body1" color="text.secondary">Total do Pedido:</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                {formatCurrency(totalPedido)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" color="inherit" disabled={isSalvando}>
                Salvar Rascunho
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={isSalvando}
                startIcon={isSalvando ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isSalvando ? 'Salvando...' : 'Salvar Pedido'}
              </Button>
            </Box>
          </Box>
        </Paper>

      </Box>
    </Box>
  );
};


