// /frontend/src/componentes/dashboard/StatCard.tsx
// Versão ajustada - UX moderna com ícones e animações

import React from 'react';
import { Paper, Typography, Box, Skeleton, Chip, Avatar } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  isLoading: boolean;
  percentChange?: number;
  icon?: React.ReactElement;
  subtitle?: string; // "vs mês anterior", "Mês atual", etc
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  isLoading, 
  percentChange,
  icon,
  subtitle = 'vs mês anterior'
}) => {
  
  const trendColor = percentChange && percentChange >= 0 ? 'success' : 'error';
  const TrendIcon = percentChange && percentChange >= 0 ? TrendingUpIcon : TrendingDownIcon;
  
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }
      }}
    >
      {/* Header com Título e Ícone */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        mb: 2 
      }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {title}
        </Typography>
        {icon && (
          <Avatar sx={{ 
            bgcolor: 'primary.main', 
            width: 40, 
            height: 40,
            transition: 'transform 0.2s',
            '&:hover': { transform: 'scale(1.1)' }
          }}>
            {icon}
          </Avatar>
        )}
      </Box>
      
      {/* Valor Principal */}
      {isLoading ? (
        <Skeleton variant="text" width="70%" height={48} />
      ) : (
        <>
          <Typography variant="h4" component="p" fontWeight={700} gutterBottom>
            {value}
          </Typography>
          
          {/* Trend e Subtítulo */}
          {percentChange !== undefined ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                icon={<TrendIcon style={{ fontSize: 16 }} />}
                label={`${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`}
                color={trendColor}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          ) : (
            subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )
          )}
        </>
      )}
    </Paper>
  );
};