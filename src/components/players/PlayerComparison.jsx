import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitCompare, X, TrendingUp, User, Plus, Loader2, BarChart2 } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";
import { buildPerformanceRadar } from "../../lib/playerStats";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

export default function PlayerComparison({ currentPlayer, allPlayers }) {
  const { lang } = useLanguage();
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterMode, setFilterMode] = useState("poste");
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const candidates = allPlayers.filter(p => {
    if (p.id === currentPlayer.id) return false;
    if (filterMode === "poste") return p.poste === currentPlayer.poste;
    if (filterMode === "age") return p.age && currentPlayer.age && Math.abs(p.age - currentPlayer.age) <= 3;
    if (filterMode === "club") return p.club_actuel === currentPlayer.club_actuel;
    return true;
  });

  const selectedPlayers = allPlayers.filter(p => selectedIds.includes(p.id));
  const allComparePlayers = [currentPlayer, ...selectedPlayers];

  const addPlayer = (id) => {
    if (selectedIds.length < 3 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removePlayer = (id) => setSelectedIds(selectedIds.filter(x => x !== id));

  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    setAiAnalysis(null);
    const playersList = allComparePlayers.map(p =>
      `${p.nom} (${p.poste}, ${p.age} ans, ${p.club_actuel || "?"}, ${p.valeur_marchande || "?"}M€)`
    ).join(" | ");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyse comparative football de ces joueurs : ${playersList}.
      Pour chaque joueur, donne une analyse concise de ses points forts, points faibles, et son profil par rapport aux autres.
      Puis donne une conclusion sur qui offre le meilleur rapport qualité/prix et quel profil est le plus adapté pour un recruteur.
      Réponds en français, de façon structurée et professionnelle.`,
      add_context_from_internet: true,
    });
    setAiAnalysis(res);
    setLoadingAI(false);
  };

  const perfRadar = allComparePlayers.length >= 2
    ? buildPerformanceRadar(allComparePlayers, allPlayers, currentPlayer.poste)
    : { data: [], mode: "relatif" };
  const radarData = perfRadar.data;

  const filters = [
    { value: "poste", labelKey: "comparison.filterPosition" },
    { value: "age", labelKey: "comparison.filterAge" },
    { value: "club", labelKey: "comparison.filterClub" },
    { value: "tous", labelKey: "comparison.filterAll" },
  ];

  const tableRows = [
    [t(lang, 'filters.position'), p => p.poste || "—"],
    [t(lang, 'playerDetail.age'), p => p.age ? `${p.age} ${t(lang, 'common.ageUnit')}` : "—"],
    [t(lang, 'playerDetail.nationality'), p => p.nationalite || "—"],
    [t(lang, 'playerDetail.club'), p => p.club_actuel || "—"],
    [t(lang, 'playerDetail.value'), p => p.valeur_marchande ? `${p.valeur_marchande} M€` : "—"],
    [t(lang, 'playerDetail.height'), p => p.taille ? `${p.taille} cm` : "—"],
    [t(lang, 'comparison.attrFoot'), p => p.pied_fort || "—"],
    [t(lang, 'comparison.attrContractEnd'), p => p.contrat_fin || "—"],
  ];

  return (
    <Card className="border-2 border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-indigo-500" />
          {t(lang, 'comparison.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-500 font-medium">{t(lang, 'comparison.filterBy')}</span>
            {filters.map(f => (
              <Button
                key={f.value}
                size="sm"
                variant={filterMode === f.value ? "default" : "outline"}
                className={filterMode === f.value ? "bg-indigo-600 hover:bg-indigo-700 h-7 text-xs" : "h-7 text-xs"}
                onClick={() => setFilterMode(f.value)}
              >
                {t(lang, f.labelKey)}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <Select onValueChange={addPlayer} disabled={selectedIds.length >= 3}>
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder={selectedIds.length >= 3 ? t(lang, 'comparison.maxPlayers') : t(lang, 'comparison.addPlayerPlh')} />
              </SelectTrigger>
              <SelectContent>
                {candidates.filter(p => !selectedIds.includes(p.id)).map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nom} — {p.poste} {p.age ? `(${p.age} ${t(lang, 'common.ageUnit')})` : ""} {p.valeur_marchande ? `| ${p.valeur_marchande}M€` : ""}
                  </SelectItem>
                ))}
                {candidates.filter(p => !selectedIds.includes(p.id)).length === 0 && (
                  <SelectItem value="none" disabled>{t(lang, 'comparison.noPlayers')}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
              <User className="w-3 h-3" /> {currentPlayer.nom} <span className="text-green-500 text-xs">({t(lang, 'comparison.reference')})</span>
            </Badge>
            {selectedPlayers.map(p => (
              <Badge key={p.id} className="bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                {p.nom}
                <button onClick={() => removePlayer(p.id)} className="ml-1 hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {selectedIds.length === 0 && (
              <span className="text-xs text-slate-400 italic">{t(lang, 'comparison.selectAtLeast')}</span>
            )}
          </div>
        </div>

        {allComparePlayers.length >= 2 && (
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t(lang, 'comparison.compareTable')}</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">{t(lang, 'common.select')}</th>
                      {allComparePlayers.map((p, i) => (
                        <th key={p.id} className="text-center px-3 py-2.5 text-xs font-medium" style={{ color: COLORS[i] }}>
                          {p.nom}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map(([label, getter]) => (
                      <tr key={label} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 text-slate-500 font-medium text-xs">{label}</td>
                        {allComparePlayers.map((p) => (
                          <td key={p.id} className="px-3 py-2.5 text-center font-medium text-slate-800 text-xs">
                            {getter(p)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t(lang, 'comparison.valueTitle')}</h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={[{ label: "M€", ...Object.fromEntries(allComparePlayers.map(p => [p.nom, p.valeur_marchande || 0])) }]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="M€" />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={30} />
                  <Tooltip formatter={(v) => `${v} M€`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {allComparePlayers.map((p, i) => (
                    <Bar key={p.id} dataKey={p.nom} fill={COLORS[i]} radius={[0, 4, 4, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Radar de performance
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  {perfRadar.mode === "percentile"
                    ? "Percentiles vs joueurs du même poste"
                    : "Relatif aux joueurs comparés"}
                </Badge>
              </div>
              {radarData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData} outerRadius="72%">
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 11 }} />
                      {allComparePlayers.map((p, i) => (
                        <Radar
                          key={p.id}
                          name={p.nom}
                          dataKey={p.nom}
                          stroke={COLORS[i]}
                          fill={COLORS[i]}
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `${v}/100`} />
                    </RadarChart>
                  </ResponsiveContainer>
                  <p className="text-[10px] text-slate-400 text-center mt-1">
                    {perfRadar.mode === "percentile"
                      ? "100 = meilleur que tous les joueurs de votre base au même poste. Stats de volume ramenées à 90 min."
                      : "Échelle relative : 100 = meilleur parmi les joueurs comparés."}
                  </p>
                </>
              ) : (
                <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <BarChart2 className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    Pas assez de statistiques renseignées pour comparer ces joueurs.
                    Synchronisez leurs stats (bouton « Actualiser ») sur leur fiche.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <Button
                onClick={handleAIAnalysis}
                disabled={loadingAI}
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-9"
                size="sm"
              >
                {loadingAI ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {t(lang, 'comparison.aiAnalyzing')}</>
                ) : (
                  <><TrendingUp className="w-4 h-4 mr-2" /> {t(lang, 'comparison.aiBtn')}</>
                )}
              </Button>

              {aiAnalysis && (
                <div className="mt-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wider">{t(lang, 'comparison.aiResult')}</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{aiAnalysis}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
