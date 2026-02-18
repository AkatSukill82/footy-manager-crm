import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, User, MapPin, Calendar, TrendingUp,
  Ruler, Trophy, Target, BarChart2, Clock, Plus, ArrowRight } from
"lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from
"recharts";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function PlayerSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setSaved(false);

    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert en football. Recherche des informations COMPLÈTES et à jour sur le joueur "${query}" en consultant UNIQUEMENT ces deux sources :
      1. **Transfermarkt** (transfermarkt.fr ou transfermarkt.com) : profil du joueur, valeur marchande actuelle, historique de la valeur marchande avec toutes les dates disponibles (au moins 8-10 points de données pour tracer une courbe précise), historique de tous ses clubs avec dates exactes d'arrivée et de départ, infos contractuelles, infos personnelles (taille, poids, pied fort, date et lieu de naissance, nationalité, agent).
      2. **Sofascore** (sofascore.com) : statistiques détaillées de la saison en cours (matchs joués, titularisations, minutes jouées, buts, passes décisives, cartons jaunes/rouges, note moyenne Sofascore), et statistiques pour chaque saison précédente (saison, club, matchs, buts, passes).

      Pour l'historique de valeur marchande : donne TOUTES les évaluations disponibles sur Transfermarkt avec leur date exacte (format YYYY-MM) pour créer une courbe d'évolution complète. C'est une priorité absolue.
      Pour l'historique des clubs : liste TOUS les clubs du joueur depuis ses débuts dans l'ordre chronologique avec les dates précises.
      Pour les stats par saison : liste toutes les saisons disponibles, de la plus récente à la plus ancienne.

      RÈGLES DE FORMAT :
      - valeur_marchande : nombre en millions d'euros (ex: 180 pour 180M€)
      - taille : nombre entier en cm
      - age : nombre entier en années
      - pied_fort : "Droit", "Gauche" ou "Les deux"
      - poste : exactement parmi Gardien, Défenseur central, Latéral droit, Latéral gauche, Milieu défensif, Milieu central, Milieu offensif, Ailier droit, Ailier gauche, Attaquant
      - toutes les dates au format YYYY-MM-DD (ou YYYY-MM pour valeur_historique)
      - Si une info est introuvable, mets null`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          nom: { type: "string" },
          nom_complet: { type: "string" },
          age: { type: "number" },
          date_naissance: { type: "string" },
          lieu_naissance: { type: "string" },
          nationalite: { type: "string" },
          deuxieme_nationalite: { type: "string" },
          poste: { type: "string" },
          poste_secondaire: { type: "string" },
          pied_fort: { type: "string" },
          taille: { type: "number" },
          poids: { type: "number" },
          club_actuel: { type: "string" },
          numero_maillot: { type: "number" },
          agent: { type: "string" },
          valeur_marchande: { type: "number" },
          salaire_mensuel_estime: { type: "string" },
          contrat_debut: { type: "string" },
          contrat_fin: { type: "string" },
          photo_url: { type: "string" },
          historique_clubs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                club: { type: "string" },
                debut: { type: "string" },
                fin: { type: "string" },
                matchs: { type: "number" },
                buts: { type: "number" },
                passes: { type: "number" }
              }
            }
          },
          stats_saison_actuelle: {
            type: "object",
            properties: {
              saison: { type: "string" },
              matchs: { type: "number" },
              titulaire: { type: "number" },
              minutes: { type: "number" },
              buts: { type: "number" },
              passes_decisives: { type: "number" },
              cartons_jaunes: { type: "number" },
              cartons_rouges: { type: "number" },
              buts_par_match: { type: "number" },
              note_sofascore: { type: "number" },
              tirs_par_match: { type: "number" },
              duels_gagnes_pct: { type: "number" },
              passes_reussies_pct: { type: "number" }
            }
          },
          stats_par_saison: {
            type: "array",
            items: {
              type: "object",
              properties: {
                saison: { type: "string" },
                club: { type: "string" },
                matchs: { type: "number" },
                buts: { type: "number" },
                passes: { type: "number" }
              }
            }
          },
          valeur_historique: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                valeur: { type: "number" }
              }
            }
          },
          palmares: {
            type: "array",
            items: { type: "string" }
          },
          selection_nationale: {
            type: "object",
            properties: {
              equipe: { type: "string" },
              matchs: { type: "number" },
              buts: { type: "number" },
              premiere_selection: { type: "string" }
            }
          },
          description: { type: "string" }
        }
      }
    });

    setResult(data);
    setLoading(false);
  };

  const handleSaveToApp = async () => {
    if (!result) return;
    setSaving(true);
    const playerData = {
      nom: result.nom || query,
      age: result.age,
      date_naissance: result.date_naissance,
      nationalite: result.nationalite,
      poste: result.poste,
      club_actuel: result.club_actuel,
      valeur_marchande: result.valeur_marchande,
      pied_fort: result.pied_fort,
      taille: result.taille,
      contrat_fin: result.contrat_fin,
      photo_url: result.photo_url
    };
    Object.keys(playerData).forEach((k) => playerData[k] == null && delete playerData[k]);
    const created = await base44.entities.Player.create(playerData);
    queryClient.invalidateQueries({ queryKey: ['players'] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate(createPageUrl("PlayerDetail") + `?id=${created.id}`), 800);
  };

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
    "Attaquant": "bg-red-100 text-red-800"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-7 h-7 text-green-500" />
            Recherche de joueur
          </h1>
          
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Kylian Mbappé, Erling Haaland..."
            className="flex-1 h-12 text-base shadow-sm" />

          <Button type="submit" disabled={loading} className="h-12 px-6 bg-green-600 hover:bg-green-700">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </form>

        {/* Loading */}
        {loading &&
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <p className="text-slate-600 font-medium">Recherche dans la base de données…</p>
            <p className="text-xs text-slate-400">Cela peut prendre 10–20 secondes</p>
          </div>
        }

        {/* Result */}
        {result &&
        <div className="space-y-4">

            {/* Identity card */}
            <Card className="overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-400" />
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0 overflow-hidden">
                    {result.photo_url ?
                  <img src={result.photo_url} alt={result.nom} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} /> :
                  <User className="w-10 h-10 text-slate-400 m-auto mt-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">{result.nom_complet || result.nom}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.poste && <Badge className={posteColors[result.poste] || "bg-slate-100 text-slate-700"}>{result.poste}</Badge>}
                      {result.poste_secondaire && <Badge variant="outline" className="text-xs">{result.poste_secondaire}</Badge>}
                      {result.nationalite && <Badge variant="outline">{result.nationalite}</Badge>}
                      {result.deuxieme_nationalite && <Badge variant="outline">{result.deuxieme_nationalite}</Badge>}
                    </div>
                    {result.description &&
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{result.description}</p>
                  }
                  </div>
                  <Button
                  onClick={handleSaveToApp}
                  disabled={saving || saved}
                  className={`flex-shrink-0 ${saved ? "bg-green-600" : "bg-slate-900 hover:bg-slate-700"}`}
                  size="sm">

                    {saved ? <><Trophy className="w-4 h-4 mr-1" /> Sauvegardé</> :
                  saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
                  <><Plus className="w-4 h-4 mr-1" /> Ajouter</>}
                  </Button>
                </div>

                {/* Key stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  {result.age &&
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <Calendar className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                      <div className="font-bold text-lg text-slate-900">{result.age}</div>
                      <div className="text-xs text-slate-500">ans</div>
                    </div>
                }
                  {result.taille &&
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <Ruler className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                      <div className="font-bold text-lg text-slate-900">{result.taille}</div>
                      <div className="text-xs text-slate-500">cm</div>
                    </div>
                }
                  {result.valeur_marchande &&
                <div className="bg-green-50 rounded-xl p-3 text-center">
                      <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                      <div className="font-bold text-lg text-green-700">{result.valeur_marchande}M€</div>
                      <div className="text-xs text-slate-500">Valeur marchande</div>
                    </div>
                }
                  {result.pied_fort &&
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <Target className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                      <div className="font-bold text-sm text-slate-900">{result.pied_fort}</div>
                      <div className="text-xs text-slate-500">Pied fort</div>
                    </div>
                }
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Infos personnelles */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" /> Infos personnelles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                ["Nom complet", result.nom_complet],
                ["Date de naissance", result.date_naissance],
                ["Lieu de naissance", result.lieu_naissance],
                ["Nationalité", result.nationalite],
                ["2ème nationalité", result.deuxieme_nationalite],
                ["Taille", result.taille ? `${result.taille} cm` : null],
                ["Poids", result.poids ? `${result.poids} kg` : null],
                ["Pied fort", result.pied_fort]].
                filter(([, v]) => v).map(([label, value]) =>
                <div key={label} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-slate-900">{value}</span>
                    </div>
                )}
                </CardContent>
              </Card>

              {/* Infos contractuelles */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" /> Contrat & Club
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                ["Club actuel", result.club_actuel],
                ["N° maillot", result.numero_maillot],
                ["Poste", result.poste],
                ["Début de contrat", result.contrat_debut],
                ["Fin de contrat", result.contrat_fin],
                ["Agent", result.agent],
                ["Salaire estimé", result.salaire_mensuel_estime]].
                filter(([, v]) => v).map(([label, value]) =>
                <div key={label} className="flex justify-between text-sm py-1 border-b border-slate-50 last:border-0">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-slate-900">{value}</span>
                    </div>
                )}
                </CardContent>
              </Card>
            </div>

            {/* Stats saison actuelle */}
            {result.stats_saison_actuelle &&
          <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-purple-500" />
                    Stats — {result.stats_saison_actuelle.saison || "Saison actuelle"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[
                ["Matchs", result.stats_saison_actuelle.matchs, "bg-slate-50"],
                ["Titulaire", result.stats_saison_actuelle.titulaire, "bg-slate-50"],
                ["Minutes", result.stats_saison_actuelle.minutes, "bg-slate-50"],
                ["Buts", result.stats_saison_actuelle.buts, "bg-green-50 text-green-700"],
                ["Passes D.", result.stats_saison_actuelle.passes_decisives, "bg-blue-50 text-blue-700"],
                ["Jaunes", result.stats_saison_actuelle.cartons_jaunes, "bg-yellow-50"],
                ["Note Sofascore", result.stats_saison_actuelle.note_sofascore, "bg-indigo-50 text-indigo-700"]].
                filter(([, v]) => v != null).map(([label, value, cls]) =>
                <div key={label} className={`${cls} rounded-xl p-3 text-center`}>
                        <div className={`font-bold text-xl`}>{value}</div>
                        <div className="text-xs text-slate-500">{label}</div>
                      </div>
                )}
                  </div>
                </CardContent>
              </Card>
          }

            {/* Valeur marchande - courbe */}
            {result.valeur_historique && result.valeur_historique.length > 1 &&
          <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" /> Évolution valeur marchande — Transfermarkt (M€)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={result.valeur_historique}>
                      <defs>
                        <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit="M" />
                      <Tooltip formatter={(v) => [`${v} M€`, "Valeur"]} />
                      <Area type="monotone" dataKey="valeur" stroke="#22c55e" strokeWidth={2} fill="url(#valGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
          }

            {/* Historique clubs */}
            {result.historique_clubs && result.historique_clubs.length > 0 &&
          <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" /> Historique des clubs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.historique_clubs.map((club, i) =>
              <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-900">{club.club}</div>
                        <div className="text-xs text-slate-500">{club.debut}{club.fin ? ` → ${club.fin}` : " → maintenant"}</div>
                      </div>
                      <div className="flex gap-3 text-xs text-right flex-shrink-0">
                        {club.matchs != null && <div><span className="font-semibold text-slate-700">{club.matchs}</span><div className="text-slate-400">matchs</div></div>}
                        {club.buts != null && <div><span className="font-semibold text-green-600">{club.buts}</span><div className="text-slate-400">buts</div></div>}
                        {club.passes != null && <div><span className="font-semibold text-blue-600">{club.passes}</span><div className="text-slate-400">passes</div></div>}
                      </div>
                    </div>
              )}
                </CardContent>
              </Card>
          }

            {/* Stats par saison */}
            {result.stats_par_saison && result.stats_par_saison.length > 0 &&
          <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-500" /> Stats par saison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-400 border-b border-slate-100">
                          <th className="text-left pb-2">Saison</th>
                          <th className="text-left pb-2">Club</th>
                          <th className="text-center pb-2">MJ</th>
                          <th className="text-center pb-2">Buts</th>
                          <th className="text-center pb-2">PD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.stats_par_saison.map((s, i) =>
                    <tr key={i} className="border-b border-slate-50 last:border-0">
                            <td className="py-2 font-medium text-slate-700">{s.saison}</td>
                            <td className="py-2 text-slate-500 text-xs">{s.club}</td>
                            <td className="py-2 text-center">{s.matchs ?? "—"}</td>
                            <td className="py-2 text-center font-semibold text-green-600">{s.buts ?? "—"}</td>
                            <td className="py-2 text-center font-semibold text-blue-600">{s.passes ?? "—"}</td>
                          </tr>
                    )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
          }

            {/* Sélection nationale */}
            {result.selection_nationale &&
          <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" /> Sélection nationale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{result.selection_nationale.equipe}</div>
                      {result.selection_nationale.premiere_selection &&
                  <div className="text-xs text-slate-500">1ère sélection: {result.selection_nationale.premiere_selection}</div>
                  }
                    </div>
                    <div className="flex gap-4 text-center">
                      {result.selection_nationale.matchs != null &&
                  <div><div className="font-bold text-xl text-slate-900">{result.selection_nationale.matchs}</div><div className="text-xs text-slate-500">matchs</div></div>
                  }
                      {result.selection_nationale.buts != null &&
                  <div><div className="font-bold text-xl text-green-600">{result.selection_nationale.buts}</div><div className="text-xs text-slate-500">buts</div></div>
                  }
                    </div>
                  </div>
                </CardContent>
              </Card>
          }

            {/* Palmarès */}
            {result.palmares && result.palmares.length > 0 &&
          <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Palmarès
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.palmares.map((t, i) =>
                <Badge key={i} className="bg-amber-50 text-amber-800 border border-amber-200">{t}</Badge>
                )}
                  </div>
                </CardContent>
              </Card>
          }

            {/* CTA Ajouter */}
            <div className="flex justify-end pb-6">
              <Button
              onClick={handleSaveToApp}
              disabled={saving || saved}
              className={`${saved ? "bg-green-600" : "bg-slate-900 hover:bg-slate-700"} px-6`}>

                {saved ? "Joueur ajouté !" : saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {!saved && !saving && <><Plus className="w-4 h-4 mr-2" /> Ajouter à mes joueurs</>}
                {saved && <><ArrowRight className="w-4 h-4 ml-2" /> Voir la fiche</>}
              </Button>
            </div>
          </div>
        }
      </div>
    </div>);

}