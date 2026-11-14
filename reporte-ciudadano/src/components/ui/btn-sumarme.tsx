import { Button } from '@expo/ui';

interface BtnSumarmeProps {
  onPress: () => void;
  activo?: boolean;
}

export default function BtnSumarme({ onPress, activo = false }: BtnSumarmeProps) {
  return (
    <Button
      variant={activo ? 'filled' : 'outlined'}
      onPress={onPress}
    >
      {activo ? 'Sumado' : 'Sumarme'}
    </Button>
  );
}