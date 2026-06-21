import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GitCompare, X, User, Plus, FileDown, Loader2, BarChart2, Search,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";
import { buildPerformanceRadar } from "../lib/playerStats";
import { exportNodeToPdf } from "../lib/exportPdf";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

const posteColors = {
  "Gardien": "bg-yellow-100 text-yellow-800",
  "Défenseur central": "bg-blue-100 text-blue-800",
  "Latéral droit": "bg-blue-100 text-blue-800",
  "Latéral gauche": "bg-blue-100 text-blue-800",
  "Milieu défensif": "bg-green-100 text-green-800",
  "Milieu central": "bg-green-100 text-green-800",
  "Milieu offensif": "bg-purple-100 text-purple-800",
  "Ailier droit": "bg-orange-100 text-orange-800",
  "Ailier gauche": "bg-orange-100 text-orange-800",
  "Attaquant": "bg-red-100 text-red-800",
};

const TABLE_ROWS = [
  ["Poste",            p => p.poste || "—"],
  ["Âge",              p => p.age ? `${p.age} ans` : "—"],
  ["Nationalité",      p => p.nationalite || "—"],
  ["Club",             p => p.club_actuel || "—"],
  ["Valeur marchande", p => p.valeur_marchande ? `${p.valeur_marchande} M€` : "—"],
  ["Taille",           p => p.taille ? `${p.taille} cm` : "—"],
  ["Pied fort",        p => p.pied_fort || "—"],
  ["Matchs",           p => p.matchs_joues ?? "—"],
  ["Buts",             p => p.buts ?? "—"],
  ["Passes déc.",      p => p.passes_decisives ?? "—"],
  ["Note moyenne",     p => p.note_moyenne ?? "—"],
  ["Fin de contrat",   p => p.contrat_fin || "—"],
];

export default function ComparatorPage() {
  const exportRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [exporting, setExporting] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
  });

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["players", user?.id],
    queryFn: () => base44.entities.Player.filter({}, "-created_date"),
    enabled: !!user?.id,
    staleTime: Infinity,
  });

  const selected = players.filter(p => selectedIds.includes(p.id));

  const addPlayer = (id) => {
    if (selectedIds.length < 4 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };
  const removePlayer = (id) => setSelectedIds(selectedIds.filter(x => x !== id));

  const perfRadar = selected.length >= 2
    ? buildPerformanceRadar(selected, players, selected[0].poste)
    : { data: [], mode: "relatif" };

  const handleExport = async () => {
    setExporting(true);
    try {
      const names = selected.map(p => p.nom).join(" vs ");
      await exportNodeToPdf(exportRef.current, `Comparaison - ${names}.pdf`, {
        title: `Comparaison joueurs — ${names}`,
        orientation: "portrait",
      });
    } catch (e) {
      // silencieux — l'export est un bonus
    } finally {
      setExporting(false);
    }
  };

  const available = players.filter(p => !selectedIds.includes(p.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="w-7 h-7 text-indigo-500" />
              Comparateur de joueurs
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Comparez jusqu'à 4 joueurs — radar de performance par percentiles, table détaillée, export PDF.
            </p>
          </div>
          {selected.length >= 2 && (
            <Button onClick={handleExport} disabled={exporting}
              className="bg-slate-900 hover:bg-slate-700">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
              Exporter PDF
            </Button>
          )}
        </div>

        {/* Sélecteur */}
        <Card>
          <CardContent className="pt-5 space-y-3">
            <Select onValueChange={addPlayer} disabled={selectedIds.length >= 4}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={
                  selectedIds.length >= 4 ? "Maximum 4 joueurs" : "Ajouter un joueur à comparer…"
                } />
              </SelectTrigger>
              <SelectContent>
                {available.length === 0
                  ? <SelectItem value="none" disabled>Aucun joueur disponible</SelectItem>
                  : available.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom} — {p.poste || "?"} {p.age ? `(${p.age} ans)` : ""} {p.valeur_marchande ? `· ${p.valeur_marchande}M€` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {selected.map((p, i) => (
                <Badge key={p.id} className="flex items-center gap-1.5 py-1.5 px-2.5"
                  style={{ backgroundColor: COLORS[i] + "22", color: COLORS[i], border: `1px solid ${COLORS[i]}44` }}>
                  {p.nom}
                  <button onClick={() => removePlayer(p.id)} className="hover:opacity-60">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {selected.length === 0 && (
                <span className="text-xs text-slate-400 italic">Sélectionnez au moins 2 joueurs pour comparer.</span>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}

        {!isLoading && players.length === 0 && (
          <Card><CardContent className="py-16 text-center text-slate-400">
            <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            Aucun joueur dans votre base. Ajoutez des joueurs pour les comparer.
          </CardContent></Card>
        )}

        {/* ── COMPARAISON (zone exportée) ── */}
        {selected.length >= 2 && (
          <div ref={exportRef} className="space-y-4 bg-slate-50 p-1 rounded-2xl">

            {/* Cartes joueurs */}
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(0, 1fr))` }}>
              {selected.map((p, i) => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="h-1.5" style={{ backgroundColor: COLORS[i] }} />
                  <CardContent className="pt-4 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 overflow-hidden mb-2">
                      {p.photo_url
                        ? <img src={p.photo_url} alt={p.nom} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.target.style.display = "none"} />
                        : <User className="w-8 h-8 text-slate-300 m-auto mt-4" />}
                    </div>
                    <p className="font-bold text-sm text-slate-900 truncate">{p.nom}</p>
                    {p.poste && <Badge className={`text-[10px] mt-1 ${posteColors[p.poste] || "bg-slate-100 text-slate-700"}`}>{p.poste}</Badge>}
                    {p.valeur_marchande != null && <p className="text-xs text-green-700 font-semibold mt-1">{p.valeur_marchande} M€</p>}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Radar de performance */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-500" /> Radar de performance
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {perfRadar.mode === "percentile" ? "Percentiles vs même poste" : "Relatif aux comparés"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {perfRadar.data.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={320}>
                      <RadarChart data={perfRadar.data} outerRadius="70%">
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 11 }} />
                        {selected.map((p, i) => (
                          <Radar key={p.id} name={p.nom} dataKey={p.nom}
                            stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                        ))}
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => `${v}/100`} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <p className="text-[10px] text-slate-400 text-center mt-1">
                      {perfRadar.mode === "percentile"
                        ? "100 = meilleur que tous vos joueurs au même poste · stats ramenées à 90 min."
                        : "Échelle relative : 100 = meilleur parmi les joueurs comparés."}
                    </p>
                  </>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Pas assez de statistiques renseignées. Synchronisez les stats sur les fiches joueurs.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Table comparative */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Comparaison détaillée</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs text-slate-500 font-medium">Critère</th>
                        {selected.map((p, i) => (
                          <th key={p.id} className="text-center px-3 py-2.5 text-xs font-semibold" style={{ color: COLORS[i] }}>
                            {p.nom}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TABLE_ROWS.map(([label, getter]) => (
                        <tr key={label} className="border-t border-slate-50">
                          <td className="px-4 py-2.5 text-slate-500 font-medium text-xs">{label}</td>
                          {selected.map(p => (
                            <td key={p.id} className="px-3 py-2.5 text-center text-slate-800 text-xs font-medium">
                              {getter(p)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Valeur marchande */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Valeur marchande</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={70 + selected.length * 24}>
                  <BarChart data={selected.map(p => ({ nom: p.nom, valeur: p.valeur_marchande || 0 }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit="M€" />
                    <YAxis type="category" dataKey="nom" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip formatter={(v) => `${v} M€`} />
                    <Bar dataKey="valeur" radius={[0, 4, 4, 0]}>
                      {selected.map((p, i) => (
                        <Cell key={p.id} fill={COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
