import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, BarChart2, MapPin, Activity, Target, Shield, Zap, Clock
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend
} from "recharts";

function SectionTitle({ icon: Icon, children, color = "text-slate-700" }) {
  return (
    <h3 className={`text-sm font-semibold flex items-center gap-2 mb-3 ${color}`}>
      <Icon className="w-4 h-4" />
      {children}
    </h3>
  );
}

export default function PlayerChartsPanel({ playerId, player }) {
  const [activeSeasonTab, setActiveSeasonTab] = useState("buts");

  const { data: marketValues = [] } = useQuery({
    queryKey: ["marketValues", playerId],
    queryFn: () => base44.entities.PlayerMarketValue.filter({ player_id: playerId }, "date", 50),
    enabled: !!playerId,
  });

  const { data: seasonStats = [] } = useQuery({
    queryKey: ["seasonStats", playerId],
    queryFn: () => base44.entities.PlayerSeasonStats.filter({ player_id: playerId }, "-saison", 20),
    enabled: !!playerId,
  });

  const { data: careerHistory = [] } = useQuery({
    queryKey: ["careerHistory", playerId],
    queryFn: () => base44.entities.PlayerCareerHistory.filter({ player_id: playerId }, "debut", 30),
    enabled: !!playerId,
  });

  // Trier les valeurs marchandes par date
  const sortedValues = [...marketValues].sort((a, b) => (a.date > b.date ? 1 : -1));

  // Trier les stats saison (du plus ancien au plus récent pour les courbes)
  const sortedSeasons = [...seasonStats].sort((a, b) => (a.saison > b.saison ? 1 : -1));

  // Données Radar pour profil actuel
  const radarData = player ? [
    { subject: "Buts", A: Math.min((player.buts || 0) * 5, 100) },
    { subject: "Passes D.", A: Math.min((player.passes_decisives || 0) * 6, 100) },
    { subject: "xG", A: Math.min((player.xg || 0) * 5, 100) },
    { subject: "Duels %", A: player.duels_gagnes_pct || 0 },
    { subject: "Dribbles %", A: player.dribbles_pct || 0 },
    { subject: "Passes %", A: player.passes_reussies_pct || 0 },
    { subject: "Interceptions", A: Math.min((player.interceptions || 0) * 4, 100) },
    { subject: "Note", A: Math.min(((player.note_moyenne || 0) - 5) * 20, 100) },
  ] : [];

  const seasonTabsConfig = [
    { key: "buts", label: "Buts", color: "#22c55e" },
    { key: "passes_decisives", label: "Passes D.", color: "#3b82f6" },
    { key: "matchs", label: "Matchs", color: "#8b5cf6" },
    { key: "note_sofascore", label: "Note", color: "#f59e0b" },
    { key: "xg", label: "xG", color: "#10b981" },
    { key: "minutes", label: "Minutes", color: "#6366f1" },
  ];

  const activeTabConfig = seasonTabsConfig.find(t => t.key === activeSeasonTab);

  if (marketValues.length === 0 && seasonStats.length === 0 && careerHistory.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">

      {/* ── Courbe valeur marchande ── */}
      {sortedValues.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Évolution valeur marchande — Transfermarkt
              {player?.valeur_marchande_peak && (
                <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                  Peak: {player.valeur_marchande_peak} M€
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={sortedValues} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="valGradDetail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit="M" />
                <Tooltip formatter={v => [`${v} M€`, "Valeur marchande"]} />
                <Area type="monotone" dataKey="valeur" stroke="#22c55e" strokeWidth={2.5} fill="url(#valGradDetail)" dot={{ r: 3, fill: "#22c55e" }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Courbes stats par saison ── */}
      {sortedSeasons.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-500" />
              Évolution statistiques saison par saison
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex gap-1 flex-wrap mb-3">
              {seasonTabsConfig.filter(t => sortedSeasons.some(s => s[t.key] != null)).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSeasonTab(tab.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeSeasonTab === tab.key
                      ? "text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  style={activeSeasonTab === tab.key ? { backgroundColor: tab.color } : {}}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sortedSeasons} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="saison" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={v => [v, activeTabConfig?.label]}
                  labelFormatter={l => `Saison ${l}`}
                />
                <Bar dataKey={activeSeasonTab} fill={activeTabConfig?.color || "#6366f1"} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Tableau stats saison complet ── */}
      {sortedSeasons.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              Statistiques détaillées par saison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 text-left">
                    <th className="pb-2 pr-3 font-medium">Saison</th>
                    <th className="pb-2 pr-3 font-medium">Club</th>
                    <th className="pb-2 text-center font-medium">MJ</th>
                    <th className="pb-2 text-center font-medium">Tit.</th>
                    <th className="pb-2 text-center font-medium">Min.</th>
                    <th className="pb-2 text-center font-medium">Buts</th>
                    <th className="pb-2 text-center font-medium">PD</th>
                    <th className="pb-2 text-center font-medium">⚡ Note</th>
                    <th className="pb-2 text-center font-medium">xG</th>
                    <th className="pb-2 text-center font-medium">xA</th>
                    <th className="pb-2 text-center font-medium">Jaunes</th>
                    <th className="pb-2 text-center font-medium">Rouges</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sortedSeasons].reverse().map((ss, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="py-1.5 pr-3 font-semibold text-slate-700 whitespace-nowrap">{ss.saison}</td>
                      <td className="py-1.5 pr-3 text-slate-500 whitespace-nowrap">{ss.club || "—"}</td>
                      <td className="py-1.5 text-center">{ss.matchs ?? "—"}</td>
                      <td className="py-1.5 text-center text-slate-400">{ss.titularisations ?? "—"}</td>
                      <td className="py-1.5 text-center text-slate-400">{ss.minutes ?? "—"}</td>
                      <td className="py-1.5 text-center font-bold text-green-600">{ss.buts ?? "—"}</td>
                      <td className="py-1.5 text-center font-bold text-blue-600">{ss.passes_decisives ?? "—"}</td>
                      <td className="py-1.5 text-center font-semibold text-amber-600">{ss.note_sofascore ?? "—"}</td>
                      <td className="py-1.5 text-center text-purple-600">{ss.xg ?? "—"}</td>
                      <td className="py-1.5 text-center text-indigo-600">{ss.xa ?? "—"}</td>
                      <td className="py-1.5 text-center text-yellow-600">{ss.cartons_jaunes ?? "—"}</td>
                      <td className="py-1.5 text-center text-red-600">{ss.cartons_rouges ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Radar profil actuel ── */}
      {player && radarData.some(d => d.A > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              Profil de performance — Saison actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name={player.nom} dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Historique des clubs ── */}
      {careerHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              Parcours en carrière — Transfermarkt
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Timeline */}
            <div className="relative pl-4">
              <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-slate-200" />
              <div className="space-y-3">
                {[...careerHistory].sort((a, b) => (a.debut > b.debut ? 1 : -1)).map((club, i) => (
                  <div key={i} className="relative pl-4">
                    <div className={`absolute -left-[11px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${i === careerHistory.length - 1 ? "bg-green-500" : "bg-slate-300"}`} />
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{club.club}</p>
                          <p className="text-xs text-slate-500">
                            {club.debut && club.debut.substring(0, 4)}
                            {club.fin ? ` → ${club.fin.substring(0, 4)}` : " → maintenant"}
                            {club.ligue && <span className="ml-2 text-slate-400">· {club.ligue}</span>}
                            {club.type_passage && club.type_passage !== "Transfert" && (
                              <Badge className="ml-2 text-[10px] bg-blue-50 text-blue-700 border-0 py-0">{club.type_passage}</Badge>
                            )}
                          </p>
                          {club.montant_transfert ? (
                            <p className="text-xs text-green-600 font-medium mt-0.5">{club.montant_transfert} M€</p>
                          ) : null}
                        </div>
                        <div className="flex gap-3 text-xs text-right flex-shrink-0">
                          {club.matchs != null && (
                            <div className="text-center">
                              <div className="font-bold text-slate-700">{club.matchs}</div>
                              <div className="text-slate-400">MJ</div>
                            </div>
                          )}
                          {club.buts != null && (
                            <div className="text-center">
                              <div className="font-bold text-green-600">{club.buts}</div>
                              <div className="text-slate-400">buts</div>
                            </div>
                          )}
                          {club.passes != null && (
                            <div className="text-center">
                              <div className="font-bold text-blue-600">{club.passes}</div>
                              <div className="text-slate-400">PD</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Résumé carrière */}
            {careerHistory.length > 1 && (
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                <div className="text-center">
                  <div className="font-bold text-lg text-slate-900">
                    {careerHistory.reduce((s, c) => s + (c.matchs || 0), 0)}
                  </div>
                  <div className="text-xs text-slate-400">Matchs totaux</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-green-600">
                    {careerHistory.reduce((s, c) => s + (c.buts || 0), 0)}
                  </div>
                  <div className="text-xs text-slate-400">Buts totaux</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-blue-600">
                    {careerHistory.reduce((s, c) => s + (c.passes || 0), 0)}
                  </div>
                  <div className="text-xs text-slate-400">Passes totales</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Stats saison actuelle avancées ── */}
      {player && (player.xg != null || player.dribbles_reussis != null || player.duels_gagnes_pct != null) && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Offensif */}
          {(player.xg != null || player.tirs != null) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" /> Stats offensives avancées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    layout="vertical"
                    data={[
                      { name: "xG", valeur: player.xg },
                      { name: "xA", valeur: player.xa },
                      { name: "Tirs/match", valeur: player.tirs && player.matchs_joues ? +(player.tirs / player.matchs_joues).toFixed(1) : null },
                      { name: "Passes clés/m.", valeur: player.passes_cles },
                      { name: "Grandes chances", valeur: player.grandes_chances },
                    ].filter(d => d.valeur != null)}
                    margin={{ left: 80, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="valeur" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Défensif */}
          {(player.duels_gagnes_pct != null || player.interceptions != null) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" /> Stats défensives avancées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    layout="vertical"
                    data={[
                      { name: "% duels", valeur: player.duels_gagnes_pct },
                      { name: "% duels aériens", valeur: player.duels_aeriens_pct },
                      { name: "% dribbles", valeur: player.dribbles_pct },
                      { name: "% passes", valeur: player.passes_reussies_pct },
                      { name: "% tirs cadrés", valeur: player.tirs_cadres_pct },
                    ].filter(d => d.valeur != null)}
                    margin={{ left: 100, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip formatter={v => [`${v}%`, ""]} />
                    <Bar dataKey="valeur" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

    </div>
  );
}