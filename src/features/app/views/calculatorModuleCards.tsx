import { Leaf, PanelsTopLeft, Waves } from 'lucide-react';
import { ReactNode } from 'react';
import { MaterialModule } from '../types';

export const calculatorModuleCards: { id: MaterialModule; label: string; icon: ReactNode }[] = [
  {
    id: 'pvc',
    label: 'Piso PVC',
    icon: (
      <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none">
        <rect x="5" y="5" width="38" height="38" rx="7" stroke="currentColor" strokeWidth="2" />
        <path d="M5 24h38M24 5v38M13 13h8v8h-8zM27 27h8v8h-8z" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  },
  { id: 'zacate', label: 'Zacate Artificial', icon: <Leaf className="h-7 w-7" /> },
  { id: 'wpc', label: 'Tablilla WPC', icon: <PanelsTopLeft className="h-7 w-7" /> },
  { id: 'policarbonato', label: 'Policarbonato', icon: <Waves className="h-7 w-7" /> }
];
