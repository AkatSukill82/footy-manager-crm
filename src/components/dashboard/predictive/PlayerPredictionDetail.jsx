import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Minus, ArrowRightLeft, RefreshCw,
  AlertCircle, DollarSign, Star, Activity, Target, Shield, Zap, Sparkles
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { format, differenceInMonths } from "date-fns";
import { fr, es, enUS } from "date-fns/locale";
import { useLanguage } from "../../../lib/LanguageContext";
import { t } from "../../../i18n/translations";

const DATE_LOCALES = { fr, es, en: enUS };

// ─── Helpers ────────────────────────────────────────────────────────────────

function getAgeCategory(age) {
  if (age <= 20) return { key: "ageCatHope", color: "text-blue-600", bg: "bg-blue-50" };
  if (age <= 23) return { key: "ageCatDev",  color: "text-purple-600", bg: "bg-purple-50" };
  if (age <= 27) return { key: "ageCatPrime", color: "text-green-600", bg: "bg-green-50" };
  if (age <= 30) return { key: "ageCatExp",  color: "text-yellow-600", bg: "bg-yellow-50" };
  return { key: "ageCatVet", color: "text-orange-600", bg: "bg-orange-50" };
}

function projectValue(player) {
  const age = player.age || 25;
  const value = player.valeur_marchande || 0;
  const peak = player.valeur_marchande_peak || value;
  const note = player.note_moyenne || 7;
  const currentYear = new Date().getFullYear();
  const points = [];

  for (let i = -1; i <= 6; i++) {
    const futureAge = age + i;
    let mult = 1;

    if (i < 0) {
      mult = 0.9;
    } else if (futureAge <= 21) {
      mult = 1 + i * 0.25;
    } else if (futureAge <= 24) {
      mult = 1 + i * 0.15;
    } else if (futureAge <= 27) {
      const perfBonus = note >= 7.5 ? 0.05 : note >= 7 ? 0.02 : -0.02;
      mult = 1 + i * (0.04 + perfBonus);
    } else if (futureAge <= 30) {
      const ratio = peak > 0 ? value / peak : 1;
      mult = 1 - (futureAge - 27) * (0.08 + (1 - ratio) * 0.05);
    } else {
      mult = 1 - (futureAge - 27) * 0.14;
    }

    mult = Math.max(0.05, mult);
    points.push({
      annee: currentYear + i,
      age: futureAge,
      valeur: Math.round(value * mult * 10) / 10,
      projected: i > 0,
    });
  }
  return points;
}

function predictTransfer(player) {
  const today = new Date();
  const contractEnd = player.contrat_fin ? new Date(player.contrat_fin) : null;
  const monthsLeft = contractEnd ? Math.max(0, differenceInMonths(contractEnd, today)) : null;

  let score = 0;
  const reasons = [];
  const positive = [];

  if (monthsLeft !== null) {
    if (monthsLeft < 6) { score += 40; reasons.push("predictive.reasonContract6m"); }
    else if (monthsLeft < 12) { score += 25; reasons.push("predictive.reasonContract12m"); }
    else if (monthsLeft < 18) { score += 12; reasons.push("predictive.reasonContract18m"); }
    else positive.push({ key: "contractUntil", contractEnd });
  }

  const age = player.age || 25;
  if (age >= 32) { score += 20; reasons.push("predictive.reason32plus"); }
  else if (age >= 30) { score += 12; reasons.push("predictive.reason30plus"); }
  else if (age <= 22) { score += 15; reasons.push("predictive.reasonYoungCoveted2"); }
  else positive.push({ key: "contractIdealAge" });

  if (player.valeur_marchande && player.valeur_marchande_peak) {
    const ratio = player.valeur_marchande / player.valeur_marchande_peak;
    if (ratio >= 0.92) { score += 18; reasons.push("predictive.reasonAtPeak"); }
    else if (ratio >= 0.75) { score += 8; }
    else { positive.push({ key: "contractValueNeg" }); }
  }

  if (player.note_moyenne >= 7.5) { score += 12; reasons.push("predictive.reasonExcForm"); }
  else if (player.note_moyenne < 6.5) { positive.push({ key: "contractPoorForm" }); }

  if ((player.buts || 0) + (player.passes_decisives || 0) >= 15) {
    score += 10; reasons.push("predictive.reasonContrib15b");
  }

  const transferPct = Math.min(95, Math.max(5, score));
  const renewalPct = 100 - transferPct;

  return { transferPct, renewalPct, reasons, positive, monthsLeft, contractEnd };
}

function estimatePerformanceScore(player) {
  return [
    { subjectKey: "radarForm",       value: Math.min(100, ((player.note_moyenne || 6.5) / 10) * 100) },
    { subjectKey: "radarContrib",    value: Math.min(100, ((player.buts || 0) + (player.passes_decisives || 0)) * 4) },
    { subjectKey: "radarPhysique",   value: player.minutes_jouees ? Math.min(100, (player.minutes_jouees / 3000) * 100) : 50 },
    { subjectKey: "radarRegularity", value: player.matchs_joues ? Math.min(100, (player.matchs_joues / 38) * 100) : 50 },
    {
      subjectKey: "radarEfficiency",
      value: player.xg > 0 && player.buts > 0 ? Math.min(100, (player.buts / player.xg) * 70) : 50,
    },
    { subjectKey: "radarDefense",    value: Math.min(100, ((player.interceptions || 0) + (player.tacles || 0)) * 5) },
  ];
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function PlayerPredictionDetail({ player, allPlayers }) {
  const { lang } = useLanguage();
  const dateLocale = DATE_LOCALES[lang] || fr;

  const age = player.age || 25;
  const ageCategory = getAgeCategory(age);
  const projData = projectValue(player);
  const transfer = predictTransfer(player);
  const radarDataRaw = estimatePerformanceScore(player);
  const radarData = radarDataRaw.map(d => ({ ...d, subject: t(lang, `predictive.${d.subjectKey}`) }));
  const currentYear = new Date().getFullYear();

  const comparables = allPlayers
    .filter(p => p.id !== player.id && p.poste === player.poste && Math.abs((p.age || 25) - age) <= 3 && p.valeur_marchande > 0)
    .sort((a, b) => b.valeur_marchande - a.valeur_marchande)
    .slice(0, 3);

  const peakProjection = projData.reduce((max, pd) => pd.valeur > max.valeur ? pd : max, projData[0]);
  const proj3ans = projData.find(d => d.annee === currentYear + 3);

  return (
    <div className="space-y-5">

      {/* Identity card */}
      <Card className="border-purple-100 bg-gradient-to-r from-purple-50/50 to-white">
        <CardContent className="pt-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              {player.photo_url ? (
                <img src={player.photo_url} alt={player.nom} className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-100 shadow" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <Star className="w-8 h-8 text-purple-400" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-slate-900">{player.nom}</h2>
                <p className="text-sm text-slate-500">{player.poste}{player.club_actuel ? ` · ${player.club_actuel}` : ""}{player.ligue ? ` · ${player.ligue}` : ""}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge className={`${ageCategory.bg} ${ageCategory.color} border-0`}>
                    {age} {t(lang, 'common.ageUnit')} — {t(lang, `predictive.${ageCategory.key}`)}
                  </Badge>
                  {player.note_moyenne && (
                    <Badge className="bg-blue-50 text-blue-700 border-0">⭐ {player.note_moyenne}/10</Badge>
                  )}
                  {player.valeur_marchande && (
                    <Badge className="bg-green-50 text-green-700 border-0">💶 {player.valeur_marchande} M€</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: t(lang, 'players.goals'), value: player.buts ?? "—" },
                { label: t(lang, 'players.assists'), value: player.passes_decisives ?? "—" },
                { label: t(lang, 'players.matches'), value: player.minutes_jouees ? `${player.minutes_jouees}'` : "—" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-lg font-bold text-slate-900">{s.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Market value projection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              {t(lang, 'predictive.projTitle')}
            </CardTitle>
            <p className="text-xs text-slate-500">{t(lang, 'predictive.projDesc')}</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={projData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="annee" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}M`} />
                <Tooltip
                  formatter={(v) => [`${v} M€`, t(lang, 'predictive.statValue')]}
                  labelFormatter={(l) => {
                    const pt = projData.find(d => d.annee === l);
                    return `${l} (${pt?.age} ${t(lang, 'common.ageUnit')})`;
                  }}
                />
                <ReferenceLine
                  x={currentYear}
                  stroke="#a855f7"
                  strokeDasharray="4 4"
                  label={{ value: t(lang, 'predictive.today'), fontSize: 9, fill: "#a855f7" }}
                />
                <Line
                  type="monotone"
                  dataKey="valeur"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    return (
                      <circle
                        key={payload.annee}
                        cx={cx} cy={cy} r={payload.projected ? 3 : 5}
                        fill={payload.projected ? "#22c55e" : "#fff"}
                        stroke="#22c55e"
                        strokeWidth={payload.projected ? 1 : 2.5}
                        strokeDasharray={payload.projected ? "4 2" : "none"}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-green-50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-slate-500">{t(lang, 'predictive.peakEstimate')}</p>
                <p className="font-bold text-green-700">{peakProjection?.valeur} M€</p>
                <p className="text-[10px] text-slate-400">
                  {peakProjection?.annee} ({t(lang, 'predictive.atAge', { age: peakProjection?.age })})
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-slate-500">{t(lang, 'predictive.in3years')}</p>
                <p className="font-bold text-purple-700">{proj3ans?.valeur ?? "—"} M€</p>
                <p className="text-[10px] text-slate-400">{t(lang, 'predictive.atAge', { age: proj3ans?.age })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transfer / renewal probability */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-orange-500" />
              {t(lang, 'predictive.transferTitle2')}
            </CardTitle>
            <p className="text-xs text-slate-500">{t(lang, 'predictive.transferDesc2')}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-6 my-4">
              <div className="text-center">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="#f97316" strokeWidth="3"
                      strokeDasharray={`${transfer.transferPct} ${100 - transfer.transferPct}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-orange-600">
                    {transfer.transferPct}%
                  </span>
                </div>
                <p className="text-xs font-medium text-orange-600 mt-1">{t(lang, 'predictive.transferLabel')}</p>
              </div>

              <div className="text-center">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="#22c55e" strokeWidth="3"
                      strokeDasharray={`${transfer.renewalPct} ${100 - transfer.renewalPct}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-green-600">
                    {transfer.renewalPct}%
                  </span>
                </div>
                <p className="text-xs font-medium text-green-600 mt-1">{t(lang, 'predictive.renewalLabel')}</p>
              </div>
            </div>

            {transfer.contractEnd && (
              <div className="text-center text-xs text-slate-500 mb-3">
                {t(lang, 'predictive.contractUntil', {
                  date: format(transfer.contractEnd, "dd/MM/yyyy", { locale: dateLocale }),
                })}
                {transfer.monthsLeft !== null && (
                  <span className={`ml-2 font-semibold ${transfer.monthsLeft < 12 ? "text-red-600" : "text-slate-600"}`}>
                    {t(lang, 'predictive.monthsRemaining', { count: transfer.monthsLeft })}
                  </span>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              {transfer.reasons.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 rounded-lg px-2 py-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />{t(lang, r)}
                </div>
              ))}
              {transfer.positive.map((item, i) => {
                const text = item.key === "contractUntil"
                  ? t(lang, 'predictive.contractUntil', { date: format(item.contractEnd, "dd/MM/yyyy", { locale: dateLocale }) })
                  : t(lang, `predictive.${item.key}`);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1">
                    <RefreshCw className="w-3 h-3 flex-shrink-0" />{text}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Performance radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              {t(lang, 'predictive.perfProfile')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {radarData.map(d => (
                <div key={d.subject} className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">{d.subject}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${d.value}%` }} />
                    </div>
                    <span className="text-slate-700 font-semibold w-7 text-right">{Math.round(d.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparable players */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-slate-600" />
              {t(lang, 'predictive.comparablesTitle')}
            </CardTitle>
            <p className="text-xs text-slate-500">{t(lang, 'predictive.comparablesDesc')}</p>
          </CardHeader>
          <CardContent>
            {comparables.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">{t(lang, 'predictive.noComparables')}</p>
            ) : (
              <div className="space-y-3">
                {[player, ...comparables].map((pl, i) => (
                  <div key={pl.id} className={`flex items-center justify-between p-2.5 rounded-xl text-sm ${i === 0 ? "bg-purple-50 border border-purple-200" : "bg-slate-50 border border-slate-100"}`}>
                    <div className="flex items-center gap-2">
                      {i === 0 && <Zap className="w-3.5 h-3.5 text-purple-500" />}
                      <span className={`font-semibold ${i === 0 ? "text-purple-800" : "text-slate-700"}`}>{pl.nom}</span>
                      <span className="text-xs text-slate-400">{pl.age} {t(lang, 'common.ageUnit')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {pl.note_moyenne && <span className="text-xs text-slate-500">⭐ {pl.note_moyenne}</span>}
                      <span className={`font-bold text-xs ${i === 0 ? "text-purple-700" : "text-slate-700"}`}>{pl.valeur_marchande} M€</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {comparables.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-2">{t(lang, 'predictive.comparedValue')}</p>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={[player, ...comparables].map(pl => ({ nom: pl.nom.split(" ").slice(-1)[0], valeur: pl.valeur_marchande || 0, isSelected: pl.id === player.id }))}>
                    <XAxis dataKey="nom" tick={{ fontSize: 10 }} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={v => [`${v} M€`, t(lang, 'predictive.statValue')]} />
                    <Bar dataKey="valeur" radius={[4, 4, 0, 0]}>
                      {[player, ...comparables].map((pl, i) => (
                        <Cell key={i} fill={pl.id === player.id ? "#8b5cf6" : "#cbd5e1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="border-purple-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            {t(lang, 'predictive.recoTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`rounded-xl p-4 ${transfer.transferPct >= 60 ? "bg-orange-50 border border-orange-200" : "bg-green-50 border border-green-200"}`}>
              <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                <ArrowRightLeft className={`w-3.5 h-3.5 ${transfer.transferPct >= 60 ? "text-orange-600" : "text-green-600"}`} />
                <span className={transfer.transferPct >= 60 ? "text-orange-700" : "text-green-700"}>
                  {transfer.transferPct >= 60 ? t(lang, 'predictive.riskLabel') : t(lang, 'predictive.stableLabel')}
                </span>
              </p>
              <p className="text-xs text-slate-600">
                {transfer.transferPct >= 60
                  ? t(lang, 'predictive.riskDesc', { pct: transfer.transferPct })
                  : t(lang, 'predictive.stableDesc', { pct: transfer.renewalPct })}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                {t(lang, 'predictive.valueSectionLabel')}
              </p>
              <p className="text-xs text-slate-600">
                {age <= 24
                  ? t(lang, 'predictive.valueDevDesc', { peak: peakProjection?.valeur, year: peakProjection?.annee })
                  : age <= 27
                    ? t(lang, 'predictive.valuePrimeDesc')
                    : t(lang, 'predictive.valueDeclineDesc', { value: player.valeur_marchande })}
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-700 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                {t(lang, 'predictive.scoutOpinion')}
              </p>
              <p className="text-xs text-slate-600">
                {(player.note_moyenne || 0) >= 7.5
                  ? t(lang, 'predictive.scoutExcellent')
                  : (player.note_moyenne || 0) >= 7.0
                    ? t(lang, 'predictive.scoutGood')
                    : player.note_moyenne
                      ? t(lang, 'predictive.scoutPoor')
                      : t(lang, 'predictive.scoutNoData')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
