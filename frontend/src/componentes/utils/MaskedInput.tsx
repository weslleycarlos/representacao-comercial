// /frontend/src/componentes/utils/MaskedInput.tsx
// (VERSÃO CORRIGIDA QUE MESCLA INPUTPROPS)

import React from 'react';
import { IMaskInput } from 'react-imask';
import { TextField, type TextFieldProps } from '@mui/material';

// Define as máscaras
const MASKS = {
  cnpj: '00.000.000/0000-00',
  telefone: '(00) 00000-0000',
  cep: '00000-000',
};

// Interface das props
interface MaskedInputProps {
  mask: keyof typeof MASKS;
  value: string;
  onChange: (value: string) => void;
}

// Adaptador (sem 'unmask=true', como corrigimos antes)
const IMaskAdapter = React.forwardRef<HTMLElement, any>((props, ref) => {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      unmask={false} // Mantém a máscara no valor
      inputRef={ref}
      onAccept={(value: any) => onChange({ target: { value } })}
      overwrite
    />
  );
});

// O Componente Final (Corrigido)
export const MaskedInput: React.FC<TextFieldProps & MaskedInputProps> = ({
  mask,
  value,
  onChange,
  InputProps, // 1. Extrai o InputProps que vem do pai (que tem a lupa)
  ...rest
}) => {
  return (
    <TextField
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      // 2. Mescla o InputProps do pai com o nosso
      InputProps={{
        ...InputProps, // <-- Adiciona as props do pai (ex: endAdornment)
        inputComponent: IMaskAdapter as any, // Adiciona o adaptador de máscara
        inputProps: {
          mask: MASKS[mask],
          ...InputProps?.inputProps, // Mescla 'inputProps' internos (se houver)
        },
      }}
    />
  );
};