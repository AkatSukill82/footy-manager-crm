import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, User, MapPin, TrendingUp,
  Trophy, Plus, ArrowRight, BarChart2,
  Activity, Heart, Globe, Star, Building2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useQueryClient } from "@tanstack/react-query";

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

function InfoRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function StatBox({ label, value, color = "bg-slate-50", textColor = "text-slate-900" }) {
  if (value == null) return null;
  return (
    <div className={`${color} rounded-xl p-3 text-center`}>
      <div className={`font-bold text-lg ${textColor}`}>{value}</div>
      <div className="text-xs text-slate-500 leading-tight mt-0.5">{label}</div>
    </div>
  );
}

const FULL_PROFILE_SCHEMA = {
  type: "object",
  properties: {
    nom: { type: "string" },
    nom_complet: { type: "string" },
    age: { type: "number" },
    date_naissance: { type: "string" },
    lieu_naissance: { type: "string" },
    nationalite: { type: "string" },
    nationalite_secondaire: { type: "string" },
    poste: { type: "string" },
    poste_secondaire: { type: "string" },
    pied_fort: { type: "string" },
    taille: { type: "number" },
    poids: { type: "number" },
    photo_url: { type: "string" },
    club_actuel: { type: "string" },
    ligue: { type: "string" },
    pays_ligue: { type: "string" },
    numero_maillot: { type: "number" },
    contrat_fin: { type: "string" },
    salaire_annuel: { type: "number" },
    salaire_semaine: { type: "number" },
    agent: { type: "string" },
    coach: { type: "string" },
    transfermarkt_id: { type: "string" },
    sofascore_id: { type: "string" },
    valeur_marchande: { type: "number" },
    valeur_marchande_peak: { type: "number" },
    description: { type: "string" },
    style_jeu: { type: "string" },
    forces: { type: "string" },
    faiblesses: { type: "string" },
    note_globale_scout: { type: "number" },
    distinctions: { type: "string" },
    palmares: { type: "array", items: { type: "string" } },
    blessures_total: { type: "number" },
    jours_blesses: { type: "number" },
    type_blessures: { type: "string" },
    matchs_carriere: { type: "number" },
    buts_carriere: { type: "number" },
    passes_carriere: { type: "number" },
    selection_nationale: {
      type: "object",
      properties: {
        equipe: { type: "string" },
        matchs: { type: "number" },
        buts: { type: "number" },
        passes: { type: "number" },
        premiere_selection: { type: "string" },
      },
    },
    stats_saison: {
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
        note_sofascore: { type: "number" },
        xg: { type: "number" },
        xa: { type: "number" },
        tirs: { type: "number" },
        tirs_cadres: { type: "number" },
        passes_cles: { type: "number" },
        dribbles_reussis: { type: "number" },
        interceptions: { type: "number" },
        tacles: { type: "number" },
        duels_gagnes_pct: { type: "number" },
        distance_course: { type: "number" },
        vitesse_max: { type: "number" },
      },
    },
    valeur_historique: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" },
          valeur: { type: "number" },
        },
      },
    },
    historique_clubs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          club: { type: "string" },
          debut: { type: "string" },
          fin: { type: "string" },
          montant_transfert: { type: "number" },
          type_passage: { type: "string" },
          ligue: { type: "string" },
          pays: { type: "string" },
        },
      },
    },
    stats_par_saison: {
      type: "array",
      items: {
        type: "object",
        properties: {
          saison: { type: "string" },
          club: { type: "string" },
          ligue: { type: "string" },
          matchs: { type: "number" },
          buts: { type: "number" },
          passes: { type: "number" },
          minutes: { type: "number" },
        },
      },
    },
  },
};

export default function TransfermarktSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [candidates, setCandidates] = useState(null);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Étape 1 : recherche via LLM + internet ───────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setCandidates(null);
    setSaved(false);
    setError(null);

    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `Recherche le joueur de football professionnel "${query.trim()}" sur Transfermarkt.com et les sources sportives.

Retourne jusqu'à 5 joueurs correspondants avec leurs infos de base. Si le nom est très précis et unique, retourne 1 seul joueur. Inclus l'URL de la photo Transfermarkt si disponible.

Joueurs à retourner : ceux qui sont des footballeurs professionnels actuels ou récents.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            candidats: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nom: { type: "string" },
                  club: { type: "string" },
                  poste: { type: "string" },
                  nationalite: { type: "string" },
                  age: { type: "number" },
                  valeur_marchande: { type: "number" },
                  transfermarkt_id: { type: "string" },
                  photo_url: { type: "string" },
                },
              },
            },
          },
        },
      });

      const list = data?.candidats || [];
      if (list.length === 0) {
        setError(`Aucun joueur trouvé pour "${query}". Essayez un autre nom.`);
        setLoading(false);
        return;
      }
      if (list.length === 1) {
        setLoading(false);
        await fetchFullProfile(list[0]);
      } else {
        setCandidates(list);
        setLoading(false);
      }
    } catch (err) {
      setError(`Erreur de recherche : ${err.message}`);
      setLoading(false);
    }
  };

  // ── Étape 2 : profil complet via LLM + internet ──────────────────────────────
  const fetchFullProfile = async (candidate) => {
    setLoadingFull(true);
    setResult(null);
    setCandidates(null);
    setError(null);

    const playerName = candidate.nom;
    const playerClub = candidate.club || "";

    try {
      setLoadingStatus("Récupération du profil complet depuis Transfermarkt…");
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `Profil complet et détaillé du joueur de football professionnel : ${playerName}${playerClub ? ` (${playerClub})` : ""}.

Cherche sur Transfermarkt, SofaScore, WhoScored, L'Équipe, et toutes les sources sportives disponibles.

Données demandées :
- Identité : date/lieu naissance, nationalités, taille, poids, pied fort, numéro maillot
- Club : club actuel, ligue, pays, fin de contrat, salaire, agent, entraîneur
- IDs : Transfermarkt ID, SofaScore ID, URL photo Transfermarkt
- Valeur marchande actuelle (en millions €) et valeur peak
- Historique valeur marchande (date YYYY-MM et valeur en millions €)
- Stats saison 2024/2025 : matchs, buts, passes déc., minutes, note, xG, xA, tirs, dribbles, interceptions
- Stats par saison (toute la carrière si possible)
- Historique des transferts (clubs, dates, montants en millions €, type)
- Sélection nationale : équipe, matchs, buts, passes
- Palmarès : liste des titres remportés
- Distinctions individuelles
- Profil scout : description, style de jeu, forces, faiblesses, note /100
- Blessures : nombre, jours manqués, types
- Stats carrière complète : matchs, buts, passes

Si une info est inconnue = null. Ne PAS inventer de chiffres.`,
        add_context_from_internet: true,
        response_json_schema: FULL_PROFILE_SCHEMA,
      });

      if (!data || !data.nom) {
        throw new Error("Données introuvables pour ce joueur.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement du profil.");
    } finally {
      setLoadingFull(false);
      setLoadingStatus("");
    }
  };

  // ── Étape 3 : sauvegarder joueur + club ──────────────────────────────────────
  const handleSaveToApp = async () => {
    if (!result) return;
    setSaving(true);
    const s = result.stats_saison;

    try {
      if (result.club_actuel) {
        const existingClubs = await base44.entities.Club.filter({ nom: result.club_actuel });
        if (!existingClubs || existingClubs.length === 0) {
          await base44.entities.Club.create({
            nom: result.club_actuel,
            pays: result.pays_ligue || '',
            ligue: result.ligue || '',
          });
          queryClient.invalidateQueries({ queryKey: ['clubs'] });
        }
      }

      const playerData = {
        nom: result.nom || query,
        age: result.age,
        date_naissance: result.date_naissance,
        lieu_naissance: result.lieu_naissance,
        nationalite: result.nationalite,
        nationalite_secondaire: result.nationalite_secondaire,
        poste: result.poste,
        poste_secondaire: result.poste_secondaire,
        pied_fort: result.pied_fort,
        taille: result.taille,
        poids: result.poids,
        photo_url: result.photo_url,
        club_actuel: result.club_actuel,
        ligue: result.ligue,
        pays_ligue: result.pays_ligue,
        numero_maillot: result.numero_maillot,
        contrat_fin: result.contrat_fin,
        salaire: result.salaire_annuel,
        salaire_semaine: result.salaire_semaine,
        agent: result.agent,
        coach: result.coach,
        transfermarkt_id: result.transfermarkt_id,
        sofascore_id: result.sofascore_id,
        valeur_marchande: result.valeur_marchande,
        valeur_marchande_peak: result.valeur_marchande_peak,
        matchs_joues: s?.matchs,
        buts: s?.buts,
        passes_decisives: s?.passes_decisives,
        minutes_jouees: s?.minutes,
        note_moyenne: s?.note_sofascore,
        xg: s?.xg,
        xa: s?.xa,
        tirs: s?.tirs,
        tirs_cadres: s?.tirs_cadres,
        passes_cles: s?.passes_cles,
        dribbles_reussis: s?.dribbles_reussis,
        interceptions: s?.interceptions,
        tacles: s?.tacles,
        duels_gagnes_pct: s?.duels_gagnes_pct,
        cartons_jaunes: s?.cartons_jaunes,
        cartons_rouges: s?.cartons_rouges,
        distance_course: s?.distance_course,
        vitesse_max: s?.vitesse_max,
        matchs_international: result.selection_nationale?.matchs,
        buts_international: result.selection_nationale?.buts,
        passes_international: result.selection_nationale?.passes,
        premier_match_selection: result.selection_nationale?.premiere_selection,
        matchs_carriere: result.matchs_carriere,
        buts_carriere: result.buts_carriere,
        passes_carriere: result.passes_carriere,
        blessures: result.blessures_total,
        jours_blesses: result.jours_blesses,
        type_blessures: result.type_blessures,
        palmares: Array.isArray(result.palmares) ? result.palmares.join(", ") : result.palmares,
        distinctions: result.distinctions,
        style_jeu: result.style_jeu,
        forces: result.forces,
        faiblesses: result.faiblesses,
        stats_resume: result.description,
        note_globale_scout: result.note_globale_scout,
        nb_clubs: result.historique_clubs?.length,
      };
      Object.keys(playerData).forEach(k => (playerData[k] == null || playerData[k] === "") && delete playerData[k]);

      const created = await base44.entities.Player.create(playerData);

      if (result.historique_clubs?.length > 0) {
        await base44.entities.PlayerCareerHistory.bulkCreate(
          result.historique_clubs.filter(c => c.club).map(c => ({ player_id: created.id, ...c }))
        );
      }

      if (result.valeur_historique?.length > 0) {
        await base44.entities.PlayerMarketValue.bulkCreate(
          result.valeur_historique
            .filter(v => v.date && v.valeur != null)
            .map(v => ({ player_id: created.id, date: v.date, valeur: v.valeur, source: "Transfermarkt" }))
        );
      }

      const allSeasons = [];
      (result.stats_par_saison || []).filter(s2 => s2.saison).forEach(s2 => {
        allSeasons.push({ player_id: created.id, ...s2 });
      });
      if (s?.matchs) {
        allSeasons.unshift({
          player_id: created.id,
          saison: s.saison || "2024/2025",
          club: result.club_actuel,
          ligue: result.ligue,
          matchs: s.matchs, buts: s.buts,
          passes_decisives: s.passes_decisives,
          minutes: s.minutes,
          note_sofascore: s.note_sofascore,
          xg: s.xg, xa: s.xa,
        });
      }
      if (allSeasons.length > 0) {
        await base44.entities.PlayerSeasonStats.bulkCreate(allSeasons.filter(s2 => s2.saison));
      }

      queryClient.invalidateQueries({ queryKey: ['players'] });
      setSaved(true);
      setTimeout(() => navigate(createPageUrl("PlayerDetail") + `?id=${created.id}`), 800);
    } catch (err) {
      console.error("Save error:", err);
      setError("Erreur lors de la sauvegarde : " + (err.message || "inconnue"));
    } finally {
      setSaving(false);
    }
  };

  const s = result?.stats_saison;

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">
        Données via IA + sources web (Transfermarkt, SofaScore…) · Club créé automatiquement si absent
      </p>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ex: Kylian Mbappé, Erling Haaland, Pedri…"
          className="flex-1 h-12 text-base shadow-sm"
        />
        <Button type="submit" disabled={loading || loadingFull} className="h-12 px-6 bg-green-600 hover:bg-green-700">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </Button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Loading recherche */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
          <p className="text-slate-600 font-medium">Recherche en cours…</p>
          <p className="text-xs text-slate-400">Consultation des sources sportives</p>
        </div>
      )}

      {/* Sélection candidat */}
      {candidates && candidates.length > 0 && !result && !loadingFull && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-green-500" />
              {candidates.length} joueurs trouvés pour "{query}" — Lequel ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidates.map((c, i) => (
              <button
                key={i}
                onClick={() => fetchFullProfile(c)}
                className="w-full flex items-center gap-4 p-3 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left group"
              >
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                  {c.photo_url
                    ? <img src={c.photo_url} alt={c.nom} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
                    : <User className="w-7 h-7 text-slate-400 m-auto mt-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 group-hover:text-green-700">{c.nom}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {c.poste && <Badge className={`text-xs ${posteColors[c.poste] || "bg-slate-100 text-slate-700"}`}>{c.poste}</Badge>}
                    {c.nationalite && <Badge variant="outline" className="text-xs">{c.nationalite}</Badge>}
                    {c.club && <Badge className="bg-slate-800 text-white text-xs">{c.club}</Badge>}
                    {c.age && <Badge variant="outline" className="text-xs">{c.age} ans</Badge>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {c.valeur_marchande && <p className="font-bold text-green-600 text-sm">{c.valeur_marchande} M€</p>}
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-green-500 mt-1 ml-auto" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Loading profil complet */}
      {loadingFull && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
          <p className="text-slate-600 font-medium">{loadingStatus || "Chargement du profil…"}</p>
          <div className="flex flex-col items-center gap-1">
            {["Transfermarkt · SofaScore · WhoScored…", "Stats, valeur marchande, transferts…", "Profil scout & palmarès…"].map(t => (
              <p key={t} className="text-xs text-slate-400">{t}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── PROFIL COMPLET ── */}
      {result && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-400" />
            <CardContent className="pt-5">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0 overflow-hidden">
                  {result.photo_url
                    ? <img src={result.photo_url} alt={result.nom} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
                    : <User className="w-10 h-10 text-slate-400 m-auto mt-7" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900">{result.nom_complet || result.nom}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {result.poste && <Badge className={posteColors[result.poste] || "bg-slate-100 text-slate-700"}>{result.poste}</Badge>}
                    {result.poste_secondaire && <Badge variant="outline" className="text-xs">{result.poste_secondaire}</Badge>}
                    {result.nationalite && <Badge variant="outline">{result.nationalite}</Badge>}
                    {result.club_actuel && <Badge className="bg-slate-800 text-white">{result.club_actuel}</Badge>}
                    {result.ligue && <Badge variant="outline" className="text-xs">{result.ligue}</Badge>}
                  </div>
                  {result.description && <p className="text-xs text-slate-500 mt-2 line-clamp-3">{result.description}</p>}
                </div>
                <Button onClick={handleSaveToApp} disabled={saving || saved}
                  className={`flex-shrink-0 ${saved ? "bg-green-600" : "bg-slate-900 hover:bg-slate-700"}`} size="sm">
                  {saved ? <><Trophy className="w-4 h-4 mr-1" /> Sauvegardé</> :
                    saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
                      <><Plus className="w-4 h-4 mr-1" /> Ajouter</>}
                </Button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                <StatBox label="Âge" value={result.age ? `${result.age} ans` : null} />
                <StatBox label="Taille" value={result.taille ? `${result.taille} cm` : null} />
                <StatBox label="Poids" value={result.poids ? `${result.poids} kg` : null} />
                <StatBox label="Pied fort" value={result.pied_fort} />
                <StatBox label="Valeur" value={result.valeur_marchande ? `${result.valeur_marchande} M€` : null} color="bg-green-50" textColor="text-green-700" />
                <StatBox label="Valeur max" value={result.valeur_marchande_peak ? `${result.valeur_marchande_peak} M€` : null} color="bg-emerald-50" textColor="text-emerald-700" />
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> Identité</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label="Date de naissance" value={result.date_naissance} />
                <InfoRow label="Lieu de naissance" value={result.lieu_naissance} />
                <InfoRow label="Nationalité" value={result.nationalite} />
                <InfoRow label="2ème nationalité" value={result.nationalite_secondaire} />
                <InfoRow label="Taille" value={result.taille ? `${result.taille} cm` : null} />
                <InfoRow label="Poids" value={result.poids ? `${result.poids} kg` : null} />
                <InfoRow label="Pied fort" value={result.pied_fort} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-500" /> Contrat & Club
                  {result.club_actuel && <span className="text-xs text-green-600 font-normal ml-auto">→ club créé automatiquement</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label="Club actuel" value={result.club_actuel} />
                <InfoRow label="Ligue" value={result.ligue} />
                <InfoRow label="Pays" value={result.pays_ligue} />
                <InfoRow label="N° maillot" value={result.numero_maillot} />
                <InfoRow label="Fin contrat" value={result.contrat_fin} />
                <InfoRow label="Salaire annuel" value={result.salaire_annuel ? `${result.salaire_annuel} M€` : null} />
                <InfoRow label="Salaire / semaine" value={result.salaire_semaine ? `${result.salaire_semaine} k€` : null} />
                <InfoRow label="Agent" value={result.agent} />
                <InfoRow label="Entraîneur" value={result.coach} />
                <InfoRow label="ID Transfermarkt" value={result.transfermarkt_id} />
              </CardContent>
            </Card>
          </div>

          {s && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-500" />
                  Stats saison {s.saison || "2024/2025"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  <StatBox label="Matchs" value={s.matchs} />
                  <StatBox label="Titulaire" value={s.titulaire} />
                  <StatBox label="Minutes" value={s.minutes} />
                  <StatBox label="Buts" value={s.buts} color="bg-green-50" textColor="text-green-700" />
                  <StatBox label="Passes D." value={s.passes_decisives} color="bg-blue-50" textColor="text-blue-700" />
                  <StatBox label="Jaunes" value={s.cartons_jaunes} color="bg-yellow-50" />
                  <StatBox label="Note" value={s.note_sofascore} color="bg-indigo-50" textColor="text-indigo-700" />
                </div>
                {(s.xg != null || s.tirs != null) && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                    <StatBox label="xG" value={s.xg} color="bg-green-50" textColor="text-green-700" />
                    <StatBox label="xA" value={s.xa} color="bg-blue-50" textColor="text-blue-700" />
                    <StatBox label="Tirs" value={s.tirs} />
                    <StatBox label="Tirs cadrés" value={s.tirs_cadres} />
                    <StatBox label="Passes clés" value={s.passes_cles} />
                    <StatBox label="Dribbles" value={s.dribbles_reussis} />
                    <StatBox label="Interceptions" value={s.interceptions} />
                    <StatBox label="Tacles" value={s.tacles} />
                    <StatBox label="% duels" value={s.duels_gagnes_pct != null ? `${s.duels_gagnes_pct}%` : null} />
                    <StatBox label="Distance" value={s.distance_course} />
                    <StatBox label="Vitesse max" value={s.vitesse_max ? `${s.vitesse_max} km/h` : null} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {result.valeur_historique?.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" /> Évolution valeur marchande
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
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} unit="M" />
                    <Tooltip formatter={v => [`${v} M€`, "Valeur"]} />
                    <Area type="monotone" dataKey="valeur" stroke="#22c55e" strokeWidth={2} fill="url(#valGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {result.stats_par_saison?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-indigo-500" /> Stats par saison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-slate-100">
                        <th className="text-left pb-2 pr-3">Saison</th>
                        <th className="text-left pb-2 pr-3">Compétition</th>
                        <th className="text-center pb-2">MJ</th>
                        <th className="text-center pb-2">Min.</th>
                        <th className="text-center pb-2">Buts</th>
                        <th className="text-center pb-2">PD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.stats_par_saison.map((ss, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                          <td className="py-2 pr-3 font-medium text-slate-700 whitespace-nowrap">{ss.saison}</td>
                          <td className="py-2 pr-3 text-slate-500 text-xs">{ss.ligue}</td>
                          <td className="py-2 text-center">{ss.matchs ?? "—"}</td>
                          <td className="py-2 text-center text-slate-400">{ss.minutes ?? "—"}</td>
                          <td className="py-2 text-center font-semibold text-green-600">{ss.buts ?? "—"}</td>
                          <td className="py-2 text-center font-semibold text-blue-600">{ss.passes ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {result.historique_clubs?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" /> Historique transferts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.historique_clubs.map((club, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-900">{club.club}</div>
                      <div className="text-xs text-slate-500">
                        {club.debut}{club.fin ? ` → ${club.fin}` : ""}
                        {club.ligue && ` · ${club.ligue}`}
                        {club.type_passage && ` · ${club.type_passage}`}
                        {club.montant_transfert ? ` · ${club.montant_transfert} M€` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            {result.selection_nationale && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> Sélection nationale</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-slate-900 mb-2">{result.selection_nationale.equipe}</p>
                  <InfoRow label="Matchs" value={result.selection_nationale.matchs} />
                  <InfoRow label="Buts" value={result.selection_nationale.buts} />
                  <InfoRow label="Passes déc." value={result.selection_nationale.passes} />
                  <InfoRow label="1ère sélection" value={result.selection_nationale.premiere_selection} />
                </CardContent>
              </Card>
            )}
            {(result.blessures_total != null || result.jours_blesses != null) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Blessures</CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label="Nombre" value={result.blessures_total} />
                  <InfoRow label="Jours manqués" value={result.jours_blesses} />
                  <InfoRow label="Types" value={result.type_blessures} />
                </CardContent>
              </Card>
            )}
            {(result.matchs_carriere != null || result.buts_carriere != null) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-slate-500" /> Carrière complète</CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label="Matchs" value={result.matchs_carriere} />
                  <InfoRow label="Buts" value={result.buts_carriere} />
                  <InfoRow label="Passes déc." value={result.passes_carriere} />
                  <InfoRow label="Clubs" value={result.historique_clubs?.length} />
                </CardContent>
              </Card>
            )}
          </div>

          {(result.style_jeu || result.forces || result.faiblesses) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Profil scout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.style_jeu && <div><p className="text-xs font-semibold text-slate-400 uppercase mb-1">Style de jeu</p><p className="text-sm text-slate-700">{result.style_jeu}</p></div>}
                {result.forces && <div><p className="text-xs font-semibold text-green-600 uppercase mb-1">Points forts</p><p className="text-sm text-slate-700">{result.forces}</p></div>}
                {result.faiblesses && <div><p className="text-xs font-semibold text-red-500 uppercase mb-1">Points faibles</p><p className="text-sm text-slate-700">{result.faiblesses}</p></div>}
                {result.note_globale_scout != null && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-lg">{result.note_globale_scout}/100</span>
                    <span className="text-xs text-slate-500">Note scout</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {result.palmares?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Palmarès</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.palmares.map((t, i) => (
                    <Badge key={i} className="bg-amber-50 text-amber-800 border border-amber-200">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pb-6 gap-3">
            {result.club_actuel && (
              <p className="text-xs text-slate-400 self-center">Le club "{result.club_actuel}" sera créé automatiquement si absent</p>
            )}
            <Button onClick={handleSaveToApp} disabled={saving || saved}
              className={`${saved ? "bg-green-600" : "bg-slate-900 hover:bg-slate-700"} px-8`}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {saved
                ? <><Trophy className="w-4 h-4 mr-2" /> Joueur ajouté ! <ArrowRight className="w-4 h-4 ml-2" /></>
                : <><Plus className="w-4 h-4 mr-2" /> Ajouter à mes joueurs</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
