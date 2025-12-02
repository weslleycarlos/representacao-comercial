import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Alert
} from '@mui/material';
import api from '../../api/axios';
import type { IVendedor } from '../../tipos/schemas';

interface ModalResetSenhaProps {
    open: boolean;
    onClose: () => void;
    vendedor?: IVendedor;
}

export const ModalResetSenha: React.FC<ModalResetSenhaProps> = ({ open, onClose, vendedor }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendedor) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await api.put(`/gestor/vendedores/${vendedor.id_usuario}/reset-password`, { password });
            setSuccess('Senha alterada com sucesso!');
            setTimeout(() => {
                onClose();
                setPassword('');
                setSuccess(null);
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erro ao resetar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Resetar Senha - {vendedor?.no_completo}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <TextField
                        autoFocus
                        margin="dense"
                        id="new-password"
                        label="Nova Senha"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button type="submit" variant="contained" color="warning" disabled={loading}>
                        {loading ? 'Salvando...' : 'Resetar Senha'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};
