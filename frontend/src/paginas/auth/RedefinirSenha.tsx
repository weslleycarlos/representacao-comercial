import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    Link
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

const RedefinirSenha = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Token de redefinição inválido ou ausente.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não conferem.');
            return;
        }
        if (!token) {
            setError('Token inválido.');
            return;
        }

        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            await api.post('/auth/reset-password', { token, new_password: password });
            setMessage('Senha redefinida com sucesso! Redirecionando para o login...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError('Erro ao redefinir senha. O token pode ter expirado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Redefinir Senha
                </Typography>

                {message && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{message}</Alert>}
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Nova Senha"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirmar Nova Senha"
                        type="password"
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading || !token}
                    >
                        {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                    </Button>
                    <Box sx={{ textAlign: 'center' }}>
                        <Link component="button" variant="body2" onClick={() => navigate('/login')}>
                            Voltar para o Login
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default RedefinirSenha;
