import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { COMPANIES } from '../../domain/company/company';
import { useAuth } from '../auth/AuthProvider';

interface CompanyContextValue {
  activeCompanyId: string;
  availableCompanies: typeof COMPANIES;
  setActiveCompanyId: (companyId: string) => void;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();

  const availableCompanies = useMemo(() => {
    const allowed = new Set(user?.companyIds ?? COMPANIES.map((company) => company.id));
    return COMPANIES.filter((company) => allowed.has(company.id));
  }, [user?.companyIds]);

  const [activeCompanyId, setActiveCompanyId] = useState<string>(availableCompanies[0]?.id ?? COMPANIES[0].id);

  useEffect(() => {
    if (!availableCompanies.length) return;
    const isStillAllowed = availableCompanies.some((company) => company.id === activeCompanyId);
    if (!isStillAllowed) {
      setActiveCompanyId(availableCompanies[0].id);
    }
  }, [activeCompanyId, availableCompanies]);

  const value = useMemo<CompanyContextValue>(
    () => ({
      activeCompanyId,
      availableCompanies,
      setActiveCompanyId
    }),
    [activeCompanyId, availableCompanies]
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export const useCompany = (): CompanyContextValue => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany debe usarse dentro de CompanyProvider');
  return ctx;
};
