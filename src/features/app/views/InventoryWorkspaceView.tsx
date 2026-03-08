import InventoryPage from '../../../components/InventoryPage';

interface InventoryWorkspaceViewProps {
  companyId: 'oz' | 'pt' | 'ds';
}

export default function InventoryWorkspaceView({ companyId }: InventoryWorkspaceViewProps) {
  return <InventoryPage companyId={companyId} />;
}
