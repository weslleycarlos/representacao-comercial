// /frontend/src/paginas/Login.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  Alert,
  Grid,        // ou Grid2 se você importar especificamente
  Link,
  Avatar,
  CircularProgress
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import { useAuth } from '../contextos/AuthContext';
import { loginSchema, type LoginFormData } from '../tipos/validacao';
import { useLogin } from '../api/servicos/authService';

const imagemFundoUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCm87jb9E_CnCr8niIekc3Lj__5LrNJKRpEouCmTiiOjvnT5rhiNOwkd9V3U1hvwjYJ_gUtLO6H6_J-gUN-xx0ulUTEdEWFMlb_ZlqsrecWD5n34AKNLOv8rhc6y8q5w_a5A9yUzdngGTCsH4mBHqrk3kccM0igBK2kofaNnEPNL246sfYkEJ-3V9VwAszzuoq_WXZy40AsRepCh2oSWPhUrZdv1sIEQ2VGXAPNmNt-4Wt2PMFFH8vYdjZIjj9Ohuv7tqxb-8OQt9M5";

export const PaginaLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const { mutate: executarLogin, isPending, error } = useLogin();

  const onSubmit = (data: LoginFormData) => {
    executarLogin(data, {
      onSuccess: (responseData) => {
        authLogin(responseData);
        navigate('/');
      }
    });
  };

  const apiErrorMessage = (error as any)?.response?.data?.detail;

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      {/* Lado da Imagem */}
      <Grid
        size={{ sm: 4, md: 7 }}
        display={{ xs: 'none', sm: 'block' }}
        sx={{
          backgroundImage: `url(${imagemFundoUrl})`,
          backgroundRepeat: 'no-repeat',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.grey[900]
              : theme.palette.grey[50],
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Lado do Formulário */}
      <Grid
        size={{ xs: 12, sm: 8, md: 5 }}
        component={Paper}
        elevation={6}
        square
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Container maxWidth="xs">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
              <LockOutlinedIcon />
            </Avatar>

            <Typography component="h1" variant="h4" sx={{ mt: 2 }}>
              Bem-vindo de volta!
            </Typography>
            <Typography component="p" color="text.secondary" sx={{ mt: 1 }}>
              Insira suas credenciais para acessar o painel.
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              sx={{ mt: 3, width: '100%' }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                autoComplete="email"
                autoFocus
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Senha"
                type="password"
                id="password"
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
              />

              <Grid container sx={{ mt: 1, mb: 1 }}>
                <Grid size="grow">
                  <Link href="#" variant="body2" color="primary">
                    Esqueceu sua senha?
                  </Link>
                </Grid>
              </Grid>

              {apiErrorMessage && (
                <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                  {apiErrorMessage}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, height: 48, fontWeight: 'bold' }}
                disabled={isPending}
              >
                {isPending ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Entrar'
                )}
              </Button>
            </Box>
          </Box>
        </Container>
      </Grid>
    </Grid>
  );
};
