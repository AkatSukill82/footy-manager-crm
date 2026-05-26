import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Users, TrendingUp, ArrowRightLeft, Star } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, Legend
} from "recharts";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../i18n/translations";

const PLAYER_COLORS = ["#8b5cf6", "#22c55e", "#f59e0b", "#ef4444"];

function projectValue(player) {
  const age = player.age || 25;
  const value = player.valeur_marchande || 0;
  const points = [];
  for (let i = -1; i <= 5; i++) {
    const futureAge = age + i;
    let mult = 1;
    if (i < 0) mult = 0.9;
    else if (futureAge <= 25) mult = 1 + i * 0.18;
    else if (futureAge <= 28) mult = 1 + i * 0.05;
    else if (futureAge <= 30) mult = 1 - (futureAge - 28) * 0.08;
    else mult = 1 - (futureAge - 28) * 0.15;
    points.push({ year: 2025 + i, valeur: Math.max(0, Math.round(value * mult * 10) / 10) });
  }
  return points;
}

function predictTransfer(player) {
  const today = new Date();
  const contractEnd = player.contrat_fin ? new Date(player.contrat_fin) : null;
  const monthsLeft = contractEnd
    ? Math.max(0, (contractEnd - today) / (1000 * 60 * 60 * 24 * 30))
    : null;

  let transferScore = 0;
  if (monthsLeft !== null) {
    if (monthsLeft < 6) transferScore += 35;
    else if (monthsLeft < 12) transferScore += 20;
    else if (monthsLeft < 18) transferScore += 10;
  }
  const age = player.age || 25;
  if (age >= 30) transferScore += 15;
  else if (age <= 23) transferScore += 10;
  if (player.valeur_marchande && player.valeur_marchande_peak) {
    const ratio = player.valeur_marchande / player.valeur_marchande_peak;
    if (ratio >= 0.9) transferScore += 15;
  }
  if (player.note_moyenne >= 7.5) transferScore += 10;

  const renewalScore = Math.max(0, 70 - transferScore);
  const total = transferScore + renewalScore || 1;
  return {
    transferPct: Math.round((transferScore / total) * 100),
    renewalPct: Math.round((renewalScore / total) * 100),
    monthsLeft,
  };
}

function radarData(players) {
  const normalize = (val, min, max) => {
    if (!val || max === min) return 0;
    return Math.round(((val - min) / (max - min)) * 100);
  };

  const keys = [
    { key: "note_moyenne", labelKey: "predictive.statRating" },
    { key: "buts", labelKey: "predictive.statGoals" },
    { key: "passes_decisives", labelKey: "predictive.statAssists" },
    { key: "dribbles_reussis", labelKey: "predictive.statDribbles" },
    { key: "interceptions", labelKey: "predictive.statInterceptions" },
    { key: "duels_gagnes_pct", labelKey: "predictive.statDuels" },
  ];

  return { keys, players };
}

function PlayerSelector({ allPlayers, selected, onSelect, onRemove, max, lang }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const available = allPlayers
    .filter(p => !selected.find(s => s.id === p.id))
    .filter(p => p.nom.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 20);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {selected.map((p, i) => (
        <div
          key={p.id}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border-2"
          style={{ borderColor: PLAYER_COLORS[i], color: PLAYER_COLORS[i], backgroundColor: PLAYER_COLORS[i] + "18" }}
        >
          {p.photo_url && <img src={p.photo_url} alt="" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />}
          {p.nom}
          <button onClick={() => onRemove(p.id)} className="hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {selected.length < max && (
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed border-slate-300 text-slate-500 text-sm hover:border-purple-400 hover:text-purple-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {t(lang, 'predictive.addPlayer')}
          </button>
          {open && (
            <div className="absolute top-9 left-0 z-20 bg-white border border-slate-200 rounded-xl shadow-xl w-64 overflow-hidden">
              <div className="p-2 border-b border-slate-100">
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t(lang, 'common.search') || "Rechercher…"}
                  className="w-full text-sm px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {available.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">{t(lang, 'teams.noPlayerFound')}</p>
                )}
                {available.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onSelect(p); setOpen(false); setSearch(""); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-purple-50 transition-colors"
                  >
                    {p.photo_url
                      ? <img src={p.photo_url} alt="" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                      : <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><Star className="w-3 h-3 text-slate-400" /></div>
                    }
                    <div>
                      <p className="font-medium text-slate-800">{p.nom}</p>
                      <p className="text-[10px] text-slate-400">{p.poste} · {p.age} {t(lang, 'common.ageUnit')} · {p.club_actuel || "—"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatRow({ label, players, field, format = v => v ?? "—", higherIsBetter = true }) {
  const values = players.map(p => p[field]);
  const numericValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  const best = higherIsBetter ? Math.max(...numericValues) : Math.min(...numericValues);

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `140px repeat(${players.length}, 1fr)` }}>
      <span className="text-xs text-slate-500 flex items-center">{label}</span>
      {players.map((p, i) => {
        const val = p[field];
        const isBest = numericValues.length > 1 && val === best;
        return (
          <div key={p.id} className={`text-sm font-semibold text-center py-1 rounded-lg ${isBest ? "bg-opacity-20" : ""}`}
            style={isBest ? { backgroundColor: PLAYER_COLORS[i] + "22", color: PLAYER_COLORS[i] } : { color: "#475569" }}
          >
            {format(val)}
          </div>
        );
      })}
    </div>
  );
}

export default function PlayerComparisonTool({ allPlayers }) {
  const { lang } = useLanguage();
  const [selected, setSelected] = useState([]);

  const onSelect = (p) => setSelected(prev => prev.length < 4 ? [...prev, p] : prev);
  const onRemove = (id) => setSelected(prev => prev.filter(p => p.id !== id));

  const projections = useMemo(() => selected.map(projectValue), [selected]);
  const projYears = projections[0] || [];

  const chartData = projYears.map(row => {
    const point = { year: row.year };
    selected.forEach((p, i) => {
      point[p.nom] = projections[i]?.find(r => r.year === row.year)?.valeur ?? null;
    });
    return point;
  });

  const transferPreds = useMemo(() => selected.map(predictTransfer), [selected]);

  const { keys: radarKeys } = useMemo(() => radarData(selected), [selected]);
  const radar = useMemo(() => {
    const normalize = (val, min, max) => {
      if (!val || max === min) return 0;
      return Math.round(((val - min) / (max - min)) * 100);
    };
    return radarKeys.map(({ key, labelKey }) => {
      const values = selected.map(p => p[key] || 0);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const row = { label: t(lang, labelKey) };
      selected.forEach(p => { row[p.nom] = normalize(p[key] || 0, min, max); });
      return row;
    });
  }, [selected, lang]);

  const ageUnit = t(lang, 'common.ageUnit');

  return (
    <Card className="border-purple-100">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4 text-purple-600" />
          {t(lang, 'predictive.compareTitle')}
          <Badge className="bg-purple-100 text-purple-700 border-0 ml-1">{t(lang, 'predictive.compareBadge')}</Badge>
        </CardTitle>
        <p className="text-xs text-slate-500">{t(lang, 'predictive.compareDesc')}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <PlayerSelector
          allPlayers={allPlayers}
          selected={selected}
          onSelect={onSelect}
          onRemove={onRemove}
          max={4}
          lang={lang}
        />

        {selected.length < 2 && (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t(lang, 'predictive.selectMin2')}</p>
          </div>
        )}

        {selected.length >= 2 && (
          <>
            {/* Player headers */}
            <div className="grid gap-3" style={{ gridTemplateColumns: `140px repeat(${selected.length}, 1fr)` }}>
              <div />
              {selected.map((p, i) => (
                <div key={p.id} className="text-center p-3 rounded-xl border-2" style={{ borderColor: PLAYER_COLORS[i] + "55" }}>
                  {p.photo_url
                    ? <img src={p.photo_url} alt="" className="w-12 h-12 rounded-full object-cover mx-auto mb-2 border-2" referrerPolicy="no-referrer" style={{ borderColor: PLAYER_COLORS[i] }} />
                    : <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: PLAYER_COLORS[i] + "22" }}>
                        <Star className="w-6 h-6" style={{ color: PLAYER_COLORS[i] }} />
                      </div>
                  }
                  <p className="font-bold text-xs text-slate-900 leading-tight">{p.nom}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.poste}</p>
                  <p className="text-[10px] text-slate-400">{p.age} {ageUnit} · {p.club_actuel || "—"}</p>
                </div>
              ))}
            </div>

            {/* Key stats */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">{t(lang, 'predictive.keyStats')}</p>
              <div className="space-y-1.5 bg-slate-50 rounded-xl p-3">
                <StatRow label={t(lang, 'predictive.statValue')} players={selected} field="valeur_marchande" format={v => v ? `${v} M€` : "—"} />
                <StatRow label={t(lang, 'predictive.statAge')} players={selected} field="age" format={v => v ? `${v} ${ageUnit}` : "—"} higherIsBetter={false} />
                <StatRow label={t(lang, 'predictive.statRating')} players={selected} field="note_moyenne" format={v => v ?? "—"} />
                <StatRow label={t(lang, 'predictive.statGoals')} players={selected} field="buts" format={v => v ?? "—"} />
                <StatRow label={t(lang, 'predictive.statAssists')} players={selected} field="passes_decisives" format={v => v ?? "—"} />
                <StatRow label={t(lang, 'predictive.statXG')} players={selected} field="xg" format={v => v ?? "—"} />
                <StatRow label={t(lang, 'predictive.statDribbles')} players={selected} field="dribbles_reussis" format={v => v ?? "—"} />
                <StatRow label={t(lang, 'predictive.statInterceptions')} players={selected} field="interceptions" format={v => v ?? "—"} />
                <StatRow label={t(lang, 'predictive.statDuels')} players={selected} field="duels_gagnes_pct" format={v => v ? `${v}%` : "—"} />
                <StatRow label={t(lang, 'predictive.statMinutes')} players={selected} field="minutes_jouees" format={v => v ?? "—"} />
              </div>
            </div>

            {/* Value trajectories */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-600" /> {t(lang, 'predictive.projTraj')}
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}M`} />
                  <Tooltip formatter={(v, name) => [`${v} M€`, name]} />
                  <ReferenceLine x={2025} stroke="#cbd5e1" strokeDasharray="4 4" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {selected.map((p, i) => (
                    <Line key={p.id} type="monotone" dataKey={p.nom} stroke={PLAYER_COLORS[i]} strokeWidth={2.5} dot={{ r: 3, fill: PLAYER_COLORS[i] }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Radar */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">{t(lang, 'predictive.radarTitle')}</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radar}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748b" }} />
                  {selected.map((p, i) => (
                    <Radar key={p.id} name={p.nom} dataKey={p.nom} stroke={PLAYER_COLORS[i]} fill={PLAYER_COLORS[i]} fillOpacity={0.12} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Transfer probability */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-orange-500" /> {t(lang, 'predictive.transferProbTitle')}
              </p>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
                {selected.map((p, i) => {
                  const { transferPct, renewalPct, monthsLeft } = transferPreds[i];
                  const isTransfer = transferPct >= 55;
                  return (
                    <div key={p.id} className="rounded-xl border border-slate-100 p-3 text-center">
                      <p className="text-xs font-semibold text-slate-800 mb-2 truncate">{p.nom}</p>
                      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full transition-all" style={{ width: `${transferPct}%`, backgroundColor: PLAYER_COLORS[i] }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-2">
                        <span>🔄 {renewalPct}%</span>
                        <span>{transferPct}% ✈️</span>
                      </div>
                      <Badge className={`text-[10px] border-0 px-2 ${isTransfer ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"}`}>
                        {isTransfer ? t(lang, 'predictive.transferLikely') : t(lang, 'predictive.renewalLikely')}
                      </Badge>
                      {monthsLeft !== null && (
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          {monthsLeft < 1 ? t(lang, 'predictive.freeAgent') : t(lang, 'predictive.monthsContract', { count: Math.round(monthsLeft) })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
