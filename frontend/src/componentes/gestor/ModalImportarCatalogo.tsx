// /frontend/src/componentes/gestor/ModalImportarCatalogo.tsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Stepper, Step, StepLabel,
    Alert, CircularProgress, MenuItem, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Close as CloseIcon,
    Download as DownloadIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';

import type { ICatalogo } from '../../tipos/schemas';
import {
    useImportarCatalogo,
    previewImportacao,
    downloadModeloImportacao,
    useGetCatalogosPorEmpresa
} from '../../api/servicos/gestorCatalogoService';

interface Props {
    open: boolean;
    onClose: () => void;
    catalogo?: ICatalogo; // Se passado, importa para este. Se não, usuário escolhe.
    idEmpresa: number;
}

const STEPS = ['Upload de Arquivo', 'Mapeamento de Colunas', 'Confirmação'];

export const ModalImportarCatalogo: React.FC<Props> = ({ open, onClose, catalogo, idEmpresa }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[][]>([]);
    const [selectedCatalogoId, setSelectedCatalogoId] = useState<number | null>(catalogo?.id_catalogo || null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // Mapeamento: chave -> índice da coluna
    const [mapping, setMapping] = useState<{ [key: string]: string }>({
        codigo: '',
        descricao: '',
        tamanhos: '',
        cores: '',
        preco: ''
    });

    const { data: catalogos } = useGetCatalogosPorEmpresa(idEmpresa);
    const { mutate: importar, isPending: isImporting, error: importError, isSuccess, data: importResult } = useImportarCatalogo();

    useEffect(() => {
        if (open) {
            setActiveStep(0);
            setFile(null);
            setPreviewData([]);
            setPreviewError(null);
            setSelectedCatalogoId(catalogo?.id_catalogo || null);
            setMapping({
                codigo: '',
                descricao: '',
                tamanhos: '',
                cores: '',
                preco: ''
            });
        }
    }, [open, catalogo]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewError(null);
            setIsLoadingPreview(true);

            try {
                const data = await previewImportacao(selectedFile);
                if (data.rows && data.rows.length > 0) {
                    setPreviewData(data.rows);
                } else {
                    setPreviewError("O arquivo parece estar vazio.");
                }
            } catch (err: any) {
                setPreviewError(err.response?.data?.detail || "Erro ao ler arquivo.");
                setFile(null);
            } finally {
                setIsLoadingPreview(false);
            }
        }
    };

    const handleNext = () => {
        if (activeStep === 0) {
            if (!file || !selectedCatalogoId) return;
            setActiveStep(1);
        } else if (activeStep === 1) {
            // Valida mapeamento obrigatório
            if (mapping.codigo === '' || mapping.descricao === '' || mapping.preco === '') {
                alert("Campos obrigatórios: Código, Descrição e Preço.");
                return;
            }
            setActiveStep(2);
        } else {
            // Importar
            if (file && selectedCatalogoId) {
                importar({
                    idCatalogo: selectedCatalogoId,
                    file: file,
                    mapping: JSON.stringify(mapping)
                });
            }
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleClose = () => {
        if (!isImporting) {
            onClose();
        }
    };

    // Renderiza Step 1: Upload
    const renderStep1 = () => (
        <Box sx={{ mt: 2 }}>
            {!catalogo && (
                <TextField
                    select
                    label="Selecione o Catálogo de Destino"
                    fullWidth
                    value={selectedCatalogoId || ''}
                    onChange={(e) => setSelectedCatalogoId(Number(e.target.value))}
                    sx={{ mb: 3 }}
                >
                    {catalogos?.map((cat) => (
                        <MenuItem key={cat.id_catalogo} value={cat.id_catalogo}>
                            {cat.no_catalogo}
                        </MenuItem>
                    ))}
                </TextField>
            )}

            <Box
                sx={{
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                }}
                component="label"
            >
                <input
                    type="file"
                    hidden
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                />
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="h6" color="text.primary">
                    {file ? file.name : "Clique para selecionar o arquivo Excel"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Formatos suportados: .xlsx, .xls
                </Typography>
            </Box>

            {isLoadingPreview && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <CircularProgress size={24} />
                    <Typography sx={{ ml: 1 }}>Lendo arquivo...</Typography>
                </Box>
            )}

            {previewError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {previewError}
                </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                    startIcon={<DownloadIcon />}
                    onClick={downloadModeloImportacao}
                    variant="text"
                >
                    Baixar Modelo de Planilha
                </Button>
            </Box>
        </Box>
    );

    // Renderiza Step 2: Mapeamento
    const renderStep2 = () => (
        <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
                Selecione qual coluna do seu arquivo corresponde a cada campo do sistema.
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                    select
                    label="Coluna Código (Obrigatório)"
                    value={mapping.codigo}
                    onChange={(e) => setMapping({ ...mapping, codigo: String(e.target.value) })}
                    sx={{ minWidth: 200 }}
                    size="small"
                >
                    {previewData[0]?.map((_, idx) => (
                        <MenuItem key={idx} value={idx}>Coluna {idx + 1}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Coluna Descrição (Obrigatório)"
                    value={mapping.descricao}
                    onChange={(e) => setMapping({ ...mapping, descricao: String(e.target.value) })}
                    sx={{ minWidth: 200 }}
                    size="small"
                >
                    {previewData[0]?.map((_, idx) => (
                        <MenuItem key={idx} value={idx}>Coluna {idx + 1}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Coluna Preço (Obrigatório)"
                    value={mapping.preco}
                    onChange={(e) => setMapping({ ...mapping, preco: String(e.target.value) })}
                    sx={{ minWidth: 200 }}
                    size="small"
                >
                    {previewData[0]?.map((_, idx) => (
                        <MenuItem key={idx} value={idx}>Coluna {idx + 1}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Coluna Tamanhos (Opcional)"
                    value={mapping.tamanhos}
                    onChange={(e) => setMapping({ ...mapping, tamanhos: String(e.target.value) })}
                    sx={{ minWidth: 200 }}
                    size="small"
                >
                    <MenuItem value="">-- Ignorar --</MenuItem>
                    {previewData[0]?.map((_, idx) => (
                        <MenuItem key={idx} value={idx}>Coluna {idx + 1}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Coluna Cores (Opcional)"
                    value={mapping.cores}
                    onChange={(e) => setMapping({ ...mapping, cores: String(e.target.value) })}
                    sx={{ minWidth: 200 }}
                    size="small"
                >
                    <MenuItem value="">-- Ignorar --</MenuItem>
                    {previewData[0]?.map((_, idx) => (
                        <MenuItem key={idx} value={idx}>Coluna {idx + 1}</MenuItem>
                    ))}
                </TextField>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
                Pré-visualização dos dados (5 primeiras linhas):
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            {previewData[0]?.map((col, idx) => (
                                <TableCell key={idx} sx={{ bgcolor: 'background.default', fontWeight: 'bold' }}>
                                    {col || `Coluna ${idx + 1}`}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {previewData.slice(1).map((row, rIdx) => (
                            <TableRow key={rIdx}>
                                {row.map((cell, cIdx) => (
                                    <TableCell key={cIdx}>{cell}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    // Renderiza Step 3: Confirmação
    const renderStep3 = () => (
        <Box sx={{ mt: 2, textAlign: 'center', py: 4 }}>
            {isSuccess ? (
                <>
                    <CheckIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Importação Concluída!
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {importResult?.processed_count} produtos processados.
                    </Typography>

                    {importResult?.errors && importResult.errors.length > 0 ? (
                        <Box sx={{ mt: 2, textAlign: 'left' }}>
                            <Alert severity="warning">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Alguns itens não foram importados ({importResult.errors.length}):
                                </Typography>
                                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                    {importResult.errors.slice(0, 5).map((err: string, idx: number) => (
                                        <li key={idx}><Typography variant="caption">{err}</Typography></li>
                                    ))}
                                    {importResult.errors.length > 5 && (
                                        <li><Typography variant="caption">... e mais {importResult.errors.length - 5} erros.</Typography></li>
                                    )}
                                </ul>
                            </Alert>
                        </Box>
                    ) : (
                        <Typography color="text.secondary">
                            Todos os produtos foram adicionados/atualizados com sucesso.
                        </Typography>
                    )}
                </>
            ) : (
                <>
                    <Typography variant="h6" gutterBottom>
                        Pronto para Importar
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        Você selecionou o arquivo <strong>{file?.name}</strong>.
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        Serão importados produtos para o catálogo selecionado.
                        Produtos existentes serão atualizados (preço) e novos serão criados.
                    </Typography>

                    {importError && (
                        <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
                            {(importError as any)?.response?.data?.detail || "Erro ao importar."}
                        </Alert>
                    )}
                </>
            )}
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                Importar Catálogo via Excel
                <IconButton
                    onClick={handleClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Stepper activeStep={activeStep}>
                    {STEPS.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === 0 && renderStep1()}
                {activeStep === 1 && renderStep2()}
                {activeStep === 2 && renderStep3()}

            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                {isSuccess ? (
                    <Button onClick={handleClose} variant="contained">
                        Fechar
                    </Button>
                ) : (
                    <>
                        <Button
                            disabled={activeStep === 0 || isImporting}
                            onClick={handleBack}
                        >
                            Voltar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={
                                (activeStep === 0 && (!file || !selectedCatalogoId)) ||
                                isImporting
                            }
                            startIcon={isImporting ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {activeStep === STEPS.length - 1 ? (isImporting ? 'Importando...' : 'Confirmar Importação') : 'Próximo'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};
