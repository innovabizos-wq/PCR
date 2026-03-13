import BillingPage from '../../../components/BillingPage';
import { StoredQuote } from '../../../services/quoteStoreService';
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
  onSaveQuote: (quote: {
    category: 'policarbonato' | 'pvc' | 'wpc' | 'zacate';
    width: number;
    height: number;
    materials: Material[];
    clientName: string;
    phone: string;
  }) => void;
  availableDrafts: StoredQuote[];
}

export default function BillingWorkspaceView({ logoUrl, initialQuote, onSaveQuote, availableDrafts }: BillingWorkspaceViewProps) {
  return <BillingPage logoUrl={logoUrl} initialQuote={initialQuote} onSaveQuote={onSaveQuote} availableDrafts={availableDrafts} />;
}
