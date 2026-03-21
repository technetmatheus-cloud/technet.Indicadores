import React from 'react';
import KPICard from '@/components/KPICard';
import RankingList from '@/components/RankingList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts';
import { BarChart3, Users, TrendingUp, TrendingDown, Target } from 'lucide-react';
import type { IndicadorTecnico, IndicadorKey } from '@/types/database';
import { INDICADOR_METAS, INDICADOR_INVERTIDO, atingeMeta } from '@/types/database';

interface IndicatorTabProps {
  data: IndicadorTecnico[];
  indicatorKey: IndicadorKey;
  label: string;
}

const IndicatorTab: React.FC<IndicatorTabProps> = ({ data, indicatorKey, label }) => {
  const invertido = INDICADOR_INVERTIDO[indicatorKey];
  const meta = INDICADOR_METAS[indicatorKey];

  const validData = data.filter((d) => d[indicatorKey] !== null);
  const values = validData.map((d) => d[indicatorKey] as number);
  const media = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const melhor = values.length > 0 ? (invertido ? Math.min(...values) : Math.max(...values)) : 0;
  const pior = values.length > 0 ? (invertido ? Math.max(...values) : Math.min(...values)) : 0;
  const dentroMeta = values.filter((v) => atingeMeta(indicatorKey, v)).length;
  const pctMeta = values.length > 0 ? (dentroMeta / values.length * 100) : 0;

  const byTecnico: Record<string, { sum: number; count: number; nome: string }> = {};
  validData.forEach((d) => {
    const key = d.login;
    if (!byTecnico[key]) byTecnico[key] = { sum: 0, count: 0, nome: d.tecnico };
    byTecnico[key].sum += d[indicatorKey] as number;
    byTecnico[key].count++;
  });

  const rankings = Object.values(byTecnico)
    .map((t) => ({ nome: t.nome, valor: t.sum / t.count }))
    .sort((a, b) => invertido ? a.valor - b.valor : b.valor - a.valor);

  const top5 = rankings.slice(0, 5);
  const bottom5 = [...rankings].reverse().slice(0, 5);

  const barData = rankings.slice(0, 10).map((r) => ({
    name: r.nome.length > 12 ? r.nome.substring(0, 12) + '...' : r.nome,
    valor: Number(r.valor.toFixed(1)),
  }));

  const byDate: Record<string, { sum: number; count: number }> = {};
  validData.forEach((d) => {
    const date = d.data_referencia;
    if (!byDate[date]) byDate[date] = { sum: 0, count: 0 };
    byDate[date].sum += d[indicatorKey] as number;
    byDate[date].count++;
  });
  const lineData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      data: date,
      media: Number((v.sum / v.count).toFixed(1)),
    }));

  const metaLabel = `Meta: ${meta.tipo === 'maior' ? '≥' : '≤'} ${meta.valor}%`;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <KPICard title="Média Geral" value={`${media.toFixed(1)}%`} icon={BarChart3} color={atingeMeta(indicatorKey, media) ? 'success' : 'destructive'} />
        <KPICard title="Avaliados" value={String(rankings.length)} icon={Users} color="primary" />
        <KPICard title="Melhor Média" value={`${melhor.toFixed(1)}%`} icon={TrendingUp} color="success" />
        <KPICard title="Abaixo da Média" value={`${pior.toFixed(1)}%`} icon={TrendingDown} color="destructive" />
        <KPICard title="Na Meta" value={`${pctMeta.toFixed(0)}%`} subtitle={metaLabel} icon={Target} color={pctMeta >= 70 ? 'success' : 'warning'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <RankingList title={`Top 5 - ${label}`} items={top5} type="best" invertido={invertido} />
        <RankingList title={`Bottom 5 - ${label}`} items={bottom5} type="worst" invertido={invertido} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ranking por Técnico</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, invertido ? 'auto' : 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 9 }} />
                <ReferenceLine x={meta.valor} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `${meta.valor}%`, fontSize: 9, fill: 'hsl(var(--destructive))' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evolução no Período</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="data" tick={{ fontSize: 9 }} />
                <YAxis domain={[0, invertido ? 'auto' : 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <ReferenceLine y={meta.valor} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: `${meta.valor}%`, fontSize: 9, fill: 'hsl(var(--destructive))' }} />
                <Line type="monotone" dataKey="media" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IndicatorTab;
