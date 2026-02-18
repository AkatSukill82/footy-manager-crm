import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitCompare, X, TrendingUp, User, Plus, Loader2 } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

function normalizeVal(val, max) {
  if (!val || !max) return 0;
  return Math.round((val / max) * 100);
}

function buildRadarData(players) {
  const maxVal = Math.max(...players.map(p => p.valeur_marchande || 0));
  const maxAge = Math.max(...players.map(p => p.age || 0));

  return [
    { attribute: "Valeur", ...Object.fromEntries(players.map(p => [p.nom, normalizeVal(p.valeur_marchande, maxVal)])) },
    { attribute: "Âge inv.", ...Object.fromEntries(players.map(p => [p.nom, p.age ? Math.round((1 - p.age / 40) * 100) : 0])) },
    { attribute: "Taille", ...Object.fromEntries(players.map(p => [p.nom, p.taille ? normalizeVal(p.taille, 210) : 50])) },
  ];
}

function buildBarData(players) {
  return [
    { label: "Valeur (M€)", ...Object.fromEntries(players.map(p => [p.nom, p.valeur_marchande || 0])) },
    { label: "Âge", ...Object.fromEntries(players.map(p => [p.nom, p.age || 0])) },
    { label: "Taille (cm)", ...Object.fromEntries(players.map(p => [p.nom, p.taille || 0])) },
  ];
}

export default function PlayerComparison({ currentPlayer, allPlayers }) {
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

  const radarData = allComparePlayers.length >= 2 ? buildRadarData(allComparePlayers) : [];
  const barData = allComparePlayers.length >= 2 ? buildBarData(allComparePlayers) : [];

  return (
    <Card className="border-2 border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-indigo-500" />
          Analyse comparative
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Filter + select */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-500 font-medium">Filtrer par :</span>
            {[
              { value: "poste", label: "Même poste" },
              { value: "age", label: "Même tranche d'âge" },
              { value: "club", label: "Même club" },
              { value: "tous", label: "Tous" },
            ].map(f => (
              <Button
                key={f.value}
                size="sm"
                variant={filterMode === f.value ? "default" : "outline"}
                className={filterMode === f.value ? "bg-indigo-600 hover:bg-indigo-700 h-7 text-xs" : "h-7 text-xs"}
                onClick={() => setFilterMode(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 items-center">
            <Select onValueChange={addPlayer} disabled={selectedIds.length >= 3}>
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder={selectedIds.length >= 3 ? "Max 3 joueurs" : "Ajouter un joueur à comparer..."} />
              </SelectTrigger>
              <SelectContent>
                {candidates.filter(p => !selectedIds.includes(p.id)).map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nom} — {p.poste} {p.age ? `(${p.age} ans)` : ""} {p.valeur_marchande ? `| ${p.valeur_marchande}M€` : ""}
                  </SelectItem>
                ))}
                {candidates.filter(p => !selectedIds.includes(p.id)).length === 0 && (
                  <SelectItem value="none" disabled>Aucun joueur disponible</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selected tags */}
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
              <User className="w-3 h-3" /> {currentPlayer.nom} <span className="text-green-500 text-xs">(référence)</span>
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
              <span className="text-xs text-slate-400 italic">Sélectionnez au moins un joueur à comparer</span>
            )}
          </div>
        </div>

        {/* Charts */}
        {allComparePlayers.length >= 2 && (
          <div className="space-y-5">
            {/* Tableau comparatif */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tableau comparatif</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">Attribut</th>
                      {allComparePlayers.map((p, i) => (
                        <th key={p.id} className="text-center px-3 py-2.5 text-xs font-medium" style={{ color: COLORS[i] }}>
                          {p.nom}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Poste", p => p.poste || "—"],
                      ["Âge", p => p.age ? `${p.age} ans` : "—"],
                      ["Nationalité", p => p.nationalite || "—"],
                      ["Club", p => p.club_actuel || "—"],
                      ["Valeur", p => p.valeur_marchande ? `${p.valeur_marchande} M€` : "—"],
                      ["Taille", p => p.taille ? `${p.taille} cm` : "—"],
                      ["Pied fort", p => p.pied_fort || "—"],
                      ["Fin contrat", p => p.contrat_fin || "—"],
                    ].map(([label, getter]) => (
                      <tr key={label} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 text-slate-500 font-medium text-xs">{label}</td>
                        {allComparePlayers.map((p, i) => (
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

            {/* Bar chart valeur */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Valeur marchande (M€)</h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={[{ label: "Valeur", ...Object.fromEntries(allComparePlayers.map(p => [p.nom, p.valeur_marchande || 0])) }]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="M€" />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={50} />
                  <Tooltip formatter={(v) => `${v} M€`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {allComparePlayers.map((p, i) => (
                    <Bar key={p.id} dataKey={p.nom} fill={COLORS[i]} radius={[0, 4, 4, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar chart */}
            {radarData.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Profil radar (normalisé)</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
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
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* AI Analysis */}
            <div className="border-t border-slate-100 pt-4">
              <Button
                onClick={handleAIAnalysis}
                disabled={loadingAI}
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-9"
                size="sm"
              >
                {loadingAI ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyse en cours…</>
                ) : (
                  <><TrendingUp className="w-4 h-4 mr-2" /> Analyse IA comparative</>
                )}
              </Button>

              {aiAnalysis && (
                <div className="mt-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wider">Analyse IA</p>
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