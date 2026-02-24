import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import db, { getSettings, updateSettings } from '../db/database';
import type { Company, FinancialYear } from '../types';

interface CompanyContextType {
    companies: Company[];
    activeCompany: Company | null;
    activeFY: FinancialYear | null;
    financialYears: FinancialYear[];
    loading: boolean;
    setActiveCompany: (companyId: number) => Promise<void>;
    setActiveFY: (fyId: number) => Promise<void>;
    refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
    companies: [],
    activeCompany: null,
    activeFY: null,
    financialYears: [],
    loading: true,
    setActiveCompany: async () => { },
    setActiveFY: async () => { },
    refreshCompanies: async () => { },
});

export function CompanyProvider({ children }: { children: ReactNode }) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
    const [activeFY, setActiveFYState] = useState<FinancialYear | null>(null);
    const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCompanies = async () => {
        const allCompanies = await db.companies.toArray();
        setCompanies(allCompanies);

        const settings = await getSettings();
        if (settings?.activeCompanyId) {
            const company = allCompanies.find(c => c.id === settings.activeCompanyId);
            if (company) {
                setActiveCompanyState(company);
                const fys = await db.financialYears
                    .where({ companyId: company.id! })
                    .toArray();
                setFinancialYears(fys);

                if (settings.activeFyId) {
                    const fy = fys.find(f => f.id === settings.activeFyId);
                    setActiveFYState(fy || fys[fys.length - 1] || null);
                } else if (fys.length > 0) {
                    const latestFy = fys[fys.length - 1];
                    setActiveFYState(latestFy);
                    await updateSettings({ activeFyId: latestFy.id });
                }
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCompanies();
    }, []);

    const setActiveCompany = async (companyId: number) => {
        const company = companies.find(c => c.id === companyId);
        if (company) {
            setActiveCompanyState(company);
            await updateSettings({ activeCompanyId: companyId });

            const fys = await db.financialYears
                .where({ companyId })
                .toArray();
            setFinancialYears(fys);
            if (fys.length > 0) {
                const latestFy = fys[fys.length - 1];
                setActiveFYState(latestFy);
                await updateSettings({ activeFyId: latestFy.id });
            }
        }
    };

    const setActiveFY = async (fyId: number) => {
        const fy = financialYears.find(f => f.id === fyId);
        if (fy) {
            setActiveFYState(fy);
            await updateSettings({ activeFyId: fyId });
        }
    };

    const refreshCompanies = async () => {
        await loadCompanies();
    };

    return (
        <CompanyContext.Provider value={{
            companies,
            activeCompany,
            activeFY,
            financialYears,
            loading,
            setActiveCompany,
            setActiveFY,
            refreshCompanies,
        }}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
}

export default CompanyContext;
