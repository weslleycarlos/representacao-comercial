// /frontend/src/utils/format.ts

/**
 * Formata um número para o padrão de moeda BRL (R$)
 */
export const formatCurrency = (value: number | undefined | null | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === undefined || num === null || isNaN(num)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(0);
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
};

/**
 * Formata um número inteiro
 */
export const formatInteger = (value: number | undefined | null): string => {
   if (value === undefined || value === null) {
     return '0';
   }
   return value.toString();
};

// Interface para o retorno do Decimal
interface DecimalResult {
  toNumber: () => number;
  mul: (n: number | string) => DecimalResult;
  div: (n: number | string) => DecimalResult;
  add: (n: number | string) => DecimalResult;
  sub: (n: number | string) => DecimalResult;
}

/**
 * Função auxiliar para operações de ponto flutuante
 */
export const Decimal = (value: number | string): DecimalResult => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const safeNum = isNaN(num) ? 0 : num;

  return {
    toNumber: () => safeNum,
    mul: (n: number | string) => Decimal(safeNum * (typeof n === 'string' ? parseFloat(n) : n)),
    div: (n: number | string) => Decimal(safeNum / (typeof n === 'string' ? parseFloat(n) : n)),
    add: (n: number | string) => Decimal(safeNum + (typeof n === 'string' ? parseFloat(n) : n)),
    sub: (n: number | string) => Decimal(safeNum - (typeof n === 'string' ? parseFloat(n) : n)),
  };
};