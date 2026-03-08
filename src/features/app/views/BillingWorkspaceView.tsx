import BillingPage from '../../../components/BillingPage';
import { Material } from '../../../types/calculator';

interface BillingWorkspaceViewProps {
  logoUrl: string;
  initialQuote: {
    category: 'policarbonato' | 'pvc' | 'wpc' | 'zacate';
    width: number;
    height: number;
    materials: Material[];
    quoteNumber?: string;
  } | null;
}

export default function BillingWorkspaceView({ logoUrl, initialQuote }: BillingWorkspaceViewProps) {
  return <BillingPage logoUrl={logoUrl} initialQuote={initialQuote} />;
}
