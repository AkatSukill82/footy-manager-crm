import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Star } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../i18n/translations";

function getTrend(player) {
  const age = player.age || 25;
  const value = player.valeur_marchande || 0;
  const peakValue = player.valeur_marchande_peak || value;
  const note = player.note_moyenne || 7;

  let score = 0;
  if (age <= 23) score += 3;
  else if (age <= 26) score += 1;
  else if (age <= 29) score -= 1;
  else score -= 3;

  if (value > 0 && peakValue > 0) {
    const ratio = value / peakValue;
    if (ratio >= 0.95) score += 2;
    else if (ratio >= 0.75) score += 0;
    else score -= 2;
  }
  if (note >= 7.5) score += 2;
  else if (note >= 7.0) score += 1;
  else if (note < 6.5) score -= 1;

  if (score >= 3) return "ascendante";
  if (score <= -2) return "déclinante";
  return "stable";
}

function projectValue(player) {
  const age = player.age || 25;
  const value = player.valeur_marchande || 0;
  const points = [];
  const currentYear = 2025;

  for (let i = -1; i <= 5; i++) {
    let mult = 1;
    const futureAge = age + i;
    if (i < 0) { mult = 0.9; }
    else if (futureAge <= 25) mult = 1 + (i * 0.18);
    else if (futureAge <= 28) mult = 1 + (i * 0.05);
    else if (futureAge <= 30) mult = 1 - ((futureAge - 28) * 0.08);
    else mult = 1 - ((futureAge - 28) * 0.15);

    points.push({
      year: currentYear + i,
      valeur: Math.max(0, Math.round(value * mult * 10) / 10),
      projected: i > 0,
    });
  }
  return points;
}

const TREND_CONFIG = {
  ascendante: { labelKey: "predictive.trajUp", color: "text-green-600", bg: "bg-green-100", icon: TrendingUp },
  stable:     { labelKey: "predictive.trajStable", color: "text-blue-600", bg: "bg-blue-100", icon: Minus },
  déclinante: { labelKey: "predictive.trajDown", color: "text-red-600", bg: "bg-red-100", icon: TrendingDown },
};

export default function CareerTrajectory({ players }) {
  const { lang } = useLanguage();

  const topPlayers = players
    .filter(p => p.valeur_marchande > 0 && p.age)
    .sort((a, b) => (b.valeur_marchande || 0) - (a.valeur_marchande || 0))
    .slice(0, 6);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-green-600" />
          {t(lang, 'predictive.trajTitle')}
        </CardTitle>
        <p className="text-xs text-slate-500">{t(lang, 'predictive.trajDesc')}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {topPlayers.map(player => {
            const trend = getTrend(player);
            const config = TREND_CONFIG[trend];
            const Icon = config.icon;
            const data = projectValue(player);

            return (
              <div key={player.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.nom} className="w-9 h-9 rounded-full object-cover border" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
                        <Star className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{player.nom}</p>
                      <p className="text-xs text-slate-500">{player.poste} · {player.age} {t(lang, 'common.ageUnit')} · {player.club_actuel || "—"}</p>
                    </div>
                  </div>
                  <Badge className={`${config.bg} ${config.color} border-0 flex items-center gap-1`}>
                    <Icon className="w-3 h-3" />{t(lang, config.labelKey)}
                  </Badge>
                </div>
                <ResponsiveContainer width="100%" height={90}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}M`} />
                    <Tooltip formatter={v => [`${v} M€`, t(lang, 'predictive.tooltipValue')]} labelFormatter={l => `${l}`} />
                    <ReferenceLine x={2025} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: t(lang, 'predictive.now'), fontSize: 9 }} />
                    <Line type="monotone" dataKey="valeur" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>{t(lang, 'predictive.currentValueLabel', { value: player.valeur_marchande })}</span>
                  <span>{t(lang, 'predictive.proj3y', { value: data.find(d => d.year === 2028)?.valeur ?? "—" })}</span>
                </div>
              </div>
            );
          })}
          {topPlayers.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">{t(lang, 'predictive.noTrajData')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
