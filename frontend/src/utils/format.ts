// /frontend/src/utils/format.ts

/**
 * Formata um número para o padrão de moeda BRL (R$)
 * @param value O número a ser formatado
 */
export const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null) {
    // Retorna um valor padrão ou 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(0);
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata um número inteiro
 * @param value O número a ser formatado
 */
export const formatInteger = (value: number | undefined | null): string => {
   if (value === undefined || value === null) {
     return '0';
   }
   return value.toString();
};