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

/**
 * Função auxiliar para operações de ponto flutuante (inspirada no Decimal.js)
 * @param value O número a ser manipulado
 */
export const Decimal = (value: number | string): {
  toNumber: () => number;
  mul: (n: number | string) => ReturnType<typeof Decimal>;
  div: (n: number | string) => ReturnType<typeof Decimal>;
  add: (n: number | string) => ReturnType<typeof Decimal>;
  sub: (n: number | string) => ReturnType<typeof Decimal>;
} => {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  return {
    toNumber: () => num,
    mul: (n: number | string) => Decimal(num * (typeof n === 'string' ? parseFloat(n) : n)),
    div: (n: number | string) => Decimal(num / (typeof n === 'string' ? parseFloat(n) : n)),
    add: (n: number | string) => Decimal(num + (typeof n === 'string' ? parseFloat(n) : n)),
    sub: (n: number | string) => Decimal(num - (typeof n === 'string' ? parseFloat(n) : n)),
  };
};
