import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

function estimateDevelopmentImpact(player) {
  const age = player.age || 25;
  const currentValue = player.valeur_marchande || 0;
  const note = player.note_moyenne || 7;
  const xg = player.xg || 0;
  const goals = player.buts || 0;
  const assists = player.passes_decisives || 0;

  let impactPct = 0;
  const factors = [];

  // Âge = potentiel de progression
  if (age <= 20) { impactPct += 30; factors.push({ label: "Jeune (≤20 ans)", delta: "+30%" }); }
  else if (age <= 23) { impactPct += 20; factors.push({ label: "Âge développement", delta: "+20%" }); }
  else if (age <= 26) { impactPct += 8; factors.push({ label: "Prime de carrière", delta: "+8%" }); }
  else if (age <= 29) { impactPct -= 5; factors.push({ label: "Phase déclin", delta: "-5%" }); }
  else { impactPct -= 15; factors.push({ label: "30+ ans", delta: "-15%" }); }

  // Performance récente
  if (note >= 7.5) { impactPct += 15; factors.push({ label: "Excellente note", delta: "+15%" }); }
  else if (note >= 7.0) { impactPct += 5; factors.push({ label: "Bonne note", delta: "+5%" }); }
  else if (note < 6.5) { impactPct -= 10; factors.push({ label: "Forme décevante", delta: "-10%" }); }

  if (xg > 0 && goals > 0) {
    const ratio = goals / xg;
    if (ratio > 1.2) { impactPct += 10; factors.push({ label: "Sur-performance xG", delta: "+10%" }); }
    else if (ratio < 0.7) { impactPct -= 5; factors.push({ label: "Sous-performance xG", delta: "-5%" }); }
  }

  if (goals + assists >= 15) { impactPct += 10; factors.push({ label: "15+ contributions", delta: "+10%" }); }

  const projectedValue = currentValue * (1 + impactPct / 100);
  const delta = projectedValue - currentValue;

  return { impactPct, projectedValue, delta, factors };
}

export default function MarketValueImpact({ players }) {
  const data = players
    .filter(p => p.valeur_marchande > 0 && p.age)
    .sort((a, b) => b.valeur_marchande - a.valeur_marchande)
    .slice(0, 10)
    .map(p => {
      const { impactPct, projectedValue, delta, factors } = estimateDevelopmentImpact(p);
      return {
        nom: p.nom.split(" ").pop(), // Nom de famille
        fullName: p.nom,
        actuelle: p.valeur_marchande,
        projetee: Math.round(projectedValue * 10) / 10,
        delta: Math.round(delta * 10) / 10,
        impactPct: Math.round(impactPct),
        factors,
        age: p.age,
        poste: p.poste,
      };
    });

  const [selected, setSelected] = React.useState(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          Impact développement sur la valeur marchande
        </CardTitle>
        <p className="text-xs text-slate-500">Estimation de l'évolution de la valeur selon la performance, l'âge et le potentiel</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="nom" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}M`} />
            <Tooltip
              formatter={(v, name) => [`${v} M€`, name === "actuelle" ? "Actuelle" : "Projetée"]}
              labelFormatter={l => {
                const item = data.find(d => d.nom === l);
                return item?.fullName || l;
              }}
            />
            <Bar dataKey="actuelle" fill="#94a3b8" radius={[4, 4, 0, 0]} name="actuelle" />
            <Bar dataKey="projetee" radius={[4, 4, 0, 0]} name="projetee">
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.delta >= 0 ? "#22c55e" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 space-y-2">
          {data.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-sm"
              onClick={() => setSelected(selected?.fullName === item.fullName ? null : item)}
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-800 font-medium">{item.fullName}</span>
                <span className="text-xs text-slate-400">{item.age} ans</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">{item.actuelle} M€</span>
                <span className="text-slate-300">→</span>
                <span className={`font-bold text-xs ${item.delta >= 0 ? "text-green-600" : "text-red-600"}`}>{item.projetee} M€</span>
                <Badge className={`border-0 text-[10px] px-1.5 ${item.impactPct >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {item.impactPct >= 0 ? "+" : ""}{item.impactPct}%
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">Facteurs pour {selected.fullName}</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.factors.map((f, i) => (
                <Badge key={i} className={`border-0 text-xs ${f.delta.startsWith("+") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {f.label} {f.delta}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}