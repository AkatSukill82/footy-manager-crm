import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export default function PlayerPerformanceReport({ players, filters }) {
  const { lang } = useLanguage();

  const filteredPlayers = players.filter(player => {
    if (filters.dateDebut && player.created_date) {
      return new Date(player.created_date) >= new Date(filters.dateDebut);
    }
    return true;
  });

  const topByValue = [...filteredPlayers]
    .filter(p => p.valeur_marchande)
    .sort((a, b) => b.valeur_marchande - a.valeur_marchande)
    .slice(0, 10)
    .map(p => ({
      nom: p.nom.length > 15 ? p.nom.substring(0, 12) + "..." : p.nom,
      valeur: p.valeur_marchande
    }));

  const ageDistribution = {};
  filteredPlayers.forEach(p => {
    if (p.age) {
      const range = p.age < 23 ? "16-22" : p.age < 27 ? "23-26" : p.age < 31 ? "27-30" : "31+";
      ageDistribution[range] = (ageDistribution[range] || 0) + 1;
    }
  });
  const ageData = Object.entries(ageDistribution).map(([range, count]) => ({ range, count }));

  const positionData = {};
  filteredPlayers.forEach(p => {
    if (p.poste) positionData[p.poste] = (positionData[p.poste] || 0) + 1;
  });
  const pieData = Object.entries(positionData).map(([name, value]) => ({ name, value }));

  const valueByPosition = {};
  const countByPosition = {};
  filteredPlayers.forEach(p => {
    if (p.poste && p.valeur_marchande) {
      valueByPosition[p.poste] = (valueByPosition[p.poste] || 0) + p.valeur_marchande;
      countByPosition[p.poste] = (countByPosition[p.poste] || 0) + 1;
    }
  });
  const avgValueData = Object.entries(valueByPosition).map(([poste, total]) => ({
    poste: poste.length > 12 ? poste.substring(0, 10) + "..." : poste,
    moyenne: (total / countByPosition[poste]).toFixed(1)
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{filteredPlayers.length}</div>
            <div className="text-sm text-slate-500 mt-2">{t(lang, 'reports.playersAnalyzed')}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">
              {(filteredPlayers.reduce((sum, p) => sum + (p.valeur_marchande || 0), 0)).toFixed(1)}M€
            </div>
            <div className="text-sm text-slate-500 mt-2">{t(lang, 'reports.totalValue')}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">
              {(filteredPlayers.reduce((sum, p) => sum + (p.age || 0), 0) / filteredPlayers.length).toFixed(1)} {t(lang, 'common.ageUnit')}
            </div>
            <div className="text-sm text-slate-500 mt-2">{t(lang, 'reports.avgAge')}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t(lang, 'reports.top10ByValue')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topByValue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nom" angle={-45} textAnchor="end" height={100} stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="valeur" fill="#0f172a" radius={[8, 8, 0, 0]} name={t(lang, 'reports.valueMEur')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t(lang, 'reports.byPosition')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name.substring(0, 8)}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t(lang, 'reports.ageDistribution')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" fill="#0f172a" radius={[8, 8, 0, 0]} name={t(lang, 'reports.playerCount')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t(lang, 'reports.avgValueByPosition')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={avgValueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="poste" angle={-45} textAnchor="end" height={80} stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="moyenne" stroke="#0f172a" strokeWidth={3} name={t(lang, 'reports.avgValueMEur')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
