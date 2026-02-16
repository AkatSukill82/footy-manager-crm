import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

export default function TransferTrendsReport({ transfers, players, filters }) {
  // Filter by date
  const filteredTransfers = transfers.filter(transfer => {
    const transferDate = new Date(transfer.date_transfert);
    if (filters.dateDebut && transferDate < new Date(filters.dateDebut)) return false;
    if (filters.dateFin && transferDate > new Date(filters.dateFin)) return false;
    return true;
  });

  // Transfers by month
  const transfersByMonth = {};
  filteredTransfers.forEach(t => {
    const date = new Date(t.date_transfert);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    transfersByMonth[monthKey] = (transfersByMonth[monthKey] || 0) + 1;
  });
  const monthlyData = Object.entries(transfersByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  // Transfer types distribution
  const typeDistribution = {};
  filteredTransfers.forEach(t => {
    typeDistribution[t.type_transfert] = (typeDistribution[t.type_transfert] || 0) + 1;
  });
  const typeData = Object.entries(typeDistribution).map(([name, value]) => ({ name, value }));

  // Total transfer value over time
  const valueByMonth = {};
  filteredTransfers.forEach(t => {
    if (t.montant) {
      const date = new Date(t.date_transfert);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      valueByMonth[monthKey] = (valueByMonth[monthKey] || 0) + t.montant;
    }
  });
  const valueData = Object.entries(valueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value: value.toFixed(1) }));

  // Top transfer destinations
  const clubDestinations = {};
  filteredTransfers.forEach(t => {
    if (t.club_arrivee) {
      clubDestinations[t.club_arrivee] = (clubDestinations[t.club_arrivee] || 0) + 1;
    }
  });
  const topDestinations = Object.entries(clubDestinations)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([club, count]) => ({ 
      club: club.length > 15 ? club.substring(0, 12) + "..." : club, 
      count 
    }));

  const totalValue = filteredTransfers.reduce((sum, t) => sum + (t.montant || 0), 0);
  const avgValue = filteredTransfers.filter(t => t.montant).length > 0 
    ? totalValue / filteredTransfers.filter(t => t.montant).length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{filteredTransfers.length}</div>
            <div className="text-sm text-slate-500 mt-2">Transferts totaux</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{totalValue.toFixed(1)}M€</div>
            <div className="text-sm text-slate-500 mt-2">Valeur totale</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{avgValue.toFixed(1)}M€</div>
            <div className="text-sm text-slate-500 mt-2">Valeur moyenne</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Évolution mensuelle des transferts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="count" stroke="#0f172a" strokeWidth={3} name="Nombre de transferts" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Types de transferts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Valeur des transferts par mois</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={valueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} name="Valeur (M€)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Top 10 clubs de destination</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topDestinations} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" stroke="#64748b" />
              <YAxis dataKey="club" type="category" width={100} stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="count" fill="#0f172a" radius={[0, 8, 8, 0]} name="Nombre de transferts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}