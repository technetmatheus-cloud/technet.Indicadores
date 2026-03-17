import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCity } from '@/contexts/CityContext';
import { supabase } from '@/lib/supabase';
import DashboardHeader from '@/components/DashboardHeader';
import DashboardFilters from '@/components/DashboardFilters';
import IndicatorTab from '@/components/IndicatorTab';
import SupervisorTab from '@/components/SupervisorTab';
import HorarioTab from '@/components/HorarioTab';
import ResumoTab from '@/components/ResumoTab';
import ImportDialog from '@/components/ImportDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { IndicadorTecnico, HorarioPrimeiroCliente, IndicadorKey } from '@/types/database';
import { INDICADOR_LABELS } from '@/types/database';
import * as XLSX from 'xlsx';

const INDICATOR_KEYS: IndicadorKey[] = ['nr35', 'tnps', 'inspecao_e', 'revisita', 'os_dig', 'geo', 'ura', 'tec1', 'bds'];

const getStoredTab = (): string => {
  try {
    return localStorage.getItem('technet_active_tab') || 'resumo';
  } catch { return 'resumo'; }
};

const Dashboard = () => {
  const { profile } = useAuth();
  const { selectedCity } = useCity();
  const navigate = useNavigate();

  const [indicadores, setIndicadores] = useState<IndicadorTecnico[]>([]);
  const [horarios, setHorarios] = useState<HorarioPrimeiroCliente[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(getStoredTab);
  const [filters, setFilters] = useState({
    tecnico: 'todos',
    supervisor: 'todos',
    dataInicial: '',
    dataFinal: '',
    busca: '',
  });

  useEffect(() => {
    if (!selectedCity) {
      navigate('/selecionar-cidade');
      return;
    }
    fetchData();
  }, [selectedCity]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    try { localStorage.setItem('technet_active_tab', value); } catch {}
  };

  const fetchData = async () => {
    if (!selectedCity) return;

    const [indRes, horRes] = await Promise.all([
      supabase.from('indicadores_tecnicos').select('*').eq('cidade', selectedCity),
      supabase.from('horario_primeiro_cliente').select('*').eq('cidade', selectedCity),
    ]);

    setIndicadores((indRes.data as IndicadorTecnico[]) || []);
    setHorarios((horRes.data as HorarioPrimeiroCliente[]) || []);
  };

  // Filter data
  const filteredData = useMemo(() => {
    let data = indicadores;
    if (filters.tecnico && filters.tecnico !== 'todos') {
      data = data.filter((d) => d.tecnico === filters.tecnico);
    }
    if (filters.supervisor && filters.supervisor !== 'todos') {
      data = data.filter((d) => d.supervisor === filters.supervisor);
    }
    if (filters.dataInicial) {
      data = data.filter((d) => d.data_referencia >= filters.dataInicial);
    }
    if (filters.dataFinal) {
      data = data.filter((d) => d.data_referencia <= filters.dataFinal);
    }
    if (filters.busca) {
      const q = filters.busca.toLowerCase();
      data = data.filter((d) =>
        d.tecnico.toLowerCase().includes(q) ||
        d.supervisor.toLowerCase().includes(q) ||
        d.login.toLowerCase().includes(q)
      );
    }
    return data;
  }, [indicadores, filters]);

  const filteredHorarios = useMemo(() => {
    let data = horarios;
    if (filters.tecnico && filters.tecnico !== 'todos') {
      data = data.filter((d) => d.tecnico === filters.tecnico);
    }
    if (filters.supervisor && filters.supervisor !== 'todos') {
      data = data.filter((d) => d.supervisor === filters.supervisor);
    }
    if (filters.dataInicial) {
      data = data.filter((d) => d.data_referencia >= filters.dataInicial);
    }
    if (filters.dataFinal) {
      data = data.filter((d) => d.data_referencia <= filters.dataFinal);
    }
    if (filters.busca) {
      const q = filters.busca.toLowerCase();
      data = data.filter((d) =>
        d.tecnico.toLowerCase().includes(q) ||
        d.supervisor.toLowerCase().includes(q) ||
        d.login.toLowerCase().includes(q)
      );
    }
    return data;
  }, [horarios, filters]);

  const tecnicos = useMemo(() => [...new Set(indicadores.map((d) => d.tecnico))].sort(), [indicadores]);
  const supervisores = useMemo(() => [...new Set(indicadores.map((d) => d.supervisor))].sort(), [indicadores]);

  const clearFilters = () => setFilters({ tecnico: 'todos', supervisor: 'todos', dataInicial: '', dataFinal: '', busca: '' });

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `technet_${selectedCity}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Indicadores');
    XLSX.writeFile(wb, `technet_${selectedCity}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        <DashboardFilters
          tecnicos={tecnicos}
          supervisores={supervisores}
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={clearFilters}
          onExportCSV={exportCSV}
          onExportExcel={exportExcel}
          onImport={() => setImportOpen(true)}
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
            <TabsList className="inline-flex w-max sm:flex sm:flex-wrap sm:w-full h-auto gap-1 bg-card border border-border p-1">
              <TabsTrigger value="resumo" className="text-xs whitespace-nowrap">Resumo</TabsTrigger>
              {INDICATOR_KEYS.map((key) => (
                <TabsTrigger key={key} value={key} className="text-xs whitespace-nowrap">
                  {INDICADOR_LABELS[key]}
                </TabsTrigger>
              ))}
              <TabsTrigger value="horario" className="text-xs whitespace-nowrap">HORÁRIO</TabsTrigger>
              <TabsTrigger value="supervisor" className="text-xs whitespace-nowrap">SUPERVISOR</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="resumo">
            <ResumoTab data={filteredData} horarioData={filteredHorarios} cidade={selectedCity || ''} />
          </TabsContent>

          {INDICATOR_KEYS.map((key) => (
            <TabsContent key={key} value={key}>
              <IndicatorTab data={filteredData} indicatorKey={key} label={INDICADOR_LABELS[key]} />
            </TabsContent>
          ))}

          <TabsContent value="horario">
            <HorarioTab data={filteredHorarios} />
          </TabsContent>

          <TabsContent value="supervisor">
            <SupervisorTab data={filteredData} />
          </TabsContent>
        </Tabs>
      </main>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImportComplete={fetchData} />
    </div>
  );
};

export default Dashboard;
