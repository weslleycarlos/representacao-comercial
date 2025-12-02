import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const EsqueceuSenha = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            await api.post('/auth/forgot-password', { email });
            setMessage('Se o email estiver cadastrado, você receberá um link para redefinir sua senha.');
        } catch (err) {
            setError('Ocorreu um erro ao processar sua solicitação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Recuperar Senha
                </Typography>

                <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
                    Informe seu email para receber o link de redefinição.
                </Typography>

                {message && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{message}</Alert>}
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? 'Enviando...' : 'Enviar Link'}
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

export default EsqueceuSenha;
