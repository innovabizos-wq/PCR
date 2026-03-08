import { CompanyId } from '../../types/company';

export interface Company {
  id: CompanyId;
  legalName: string;
  commercialName: string;
  quotePrefix: string;
}

export const COMPANIES: readonly Company[] = [
  {
    id: 'oz',
    legalName: 'Oscar Alfonso Zacate',
    commercialName: 'Policarbonato CR',
    quotePrefix: 'OZ'
  },
  {
    id: 'pt',
    legalName: 'Partes Torres WPC PVC',
    commercialName: 'Policarbonato CR',
    quotePrefix: 'PT'
  },
  {
    id: 'ds',
    legalName: 'Dist. Solis Policarbonato',
    commercialName: 'Policarbonato CR',
    quotePrefix: 'DS'
  }
] as const;

export const DEFAULT_COMPANY_ID: CompanyId = 'pt';
