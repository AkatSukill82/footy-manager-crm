import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, User, MapPin, Calendar, TrendingUp,
  Ruler, Trophy, Target, BarChart2, Clock, Plus, ArrowRight,
  Activity, Shield, Zap, Heart, Globe, Star, Dumbbell
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
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
  "Attaquant": "bg-red-100 text-red-800"
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

export default function PlayerSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [candidates, setCandidates] = useState(null); // liste de candidats
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Étape 1 : chercher les candidats possibles
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setCandidates(null);
    setSaved(false);

    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert en données football. Pour la recherche "${query}", trouve TOUS les joueurs de football professionnels qui correspondent à ce nom (homonymes, variations du nom, joueurs actifs et récents).

Retourne une liste de 1 à 6 joueurs possibles avec leurs infos de base. Si le nom est très précis et ne correspond qu'à un seul joueur connu, retourne juste ce joueur.

Ne retourne QUE des joueurs de football professionnels réels.`,
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
                nom_complet: { type: "string" },
                age: { type: "number" },
                nationalite: { type: "string" },
                poste: { type: "string" },
                club_actuel: { type: "string" },
                ligue: { type: "string" },
                valeur_marchande: { type: "number" },
                photo_url: { type: "string" },
                description_courte: { type: "string" }
              }
            }
          }
        }
      }
    });

    const list = data?.candidats || [];
    if (list.length === 1) {
      // Un seul résultat → charger directement le profil complet
      setLoading(false);
      await fetchFullProfile(list[0].nom_complet || list[0].nom);
    } else {
      setCandidates(list);
      setLoading(false);
    }
  };

  // Étape 2 : charger le profil complet d'un candidat choisi
  const fetchFullProfile = async (playerName) => {
    setLoadingFull(true);
    setResult(null);
    setCandidates(null);

    const data = await base44.integrations.Core.InvokeLLM({
      prompt: `Tu es un expert en données football. Recherche des informations ULTRA-COMPLÈTES et à jour sur le joueur "${playerName}".

Consulte impérativement ces sources :
1. **Transfermarkt.fr** : profil complet, valeur marchande actuelle + tout l'historique de valeurs avec dates (minimum 8-10 points), historique de TOUS les clubs depuis les débuts avec dates précises, infos contractuelles, agent/agence, données physiques, blessures, palmarès.
2. **SofaScore.com** : stats complètes saison en cours (matchs, titulaire, minutes, buts, passes, cartons, note, xG, xA, tirs, passes clés, dribbles, duels, interceptions, physique), et stats pour TOUTES les saisons précédentes.
3. **Wikipedia / presse** : biographie, distinctions individuelles, style de jeu, anecdotes.

RETOURNE TOUTES LES DONNÉES. Si une info est inconnue = null. NE PAS INVENTER.

RÈGLES FORMAT STRICTES :
- valeur_marchande, valeur_marchande_peak, salaire_annuel : en millions € (ex: 85.0)
- salaire_semaine : en milliers € (ex: 250)  
- taille : cm entier, poids : kg entier
- age : entier, dates : YYYY-MM-DD (valeur_historique dates : YYYY-MM)
- pied_fort : "Droit", "Gauche" ou "Les deux" UNIQUEMENT
- poste/poste_secondaire parmi : Gardien, Défenseur central, Latéral droit, Latéral gauche, Milieu défensif, Milieu central, Milieu offensif, Ailier droit, Ailier gauche, Attaquant
- pourcentages : entre 0 et 100 sans symbole %
- xg, xa : décimaux (ex: 14.3)
- distance_course : km/match (ex: 11.2), vitesse_max : km/h (ex: 36.5)
- palmares : tableau de strings (ex: ["Ligue 1 2022", "Champions League 2023"])
- historique_valeur : TOUTES les évaluations Transfermarkt avec date YYYY-MM et valeur en M€`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          // Identité
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
          photo_url: { type: "string" },
          description: { type: "string" },
          style_jeu: { type: "string" },
          forces: { type: "string" },
          faiblesses: { type: "string" },
          // Club & contrat
          club_actuel: { type: "string" },
          ligue: { type: "string" },
          pays_ligue: { type: "string" },
          stade: { type: "string" },
          numero_maillot: { type: "number" },
          contrat_debut: { type: "string" },
          contrat_fin: { type: "string" },
          salaire_annuel: { type: "number" },
          salaire_semaine: { type: "number" },
          agent: { type: "string" },
          agence: { type: "string" },
          coach: { type: "string" },
          manager: { type: "string" },
          transfermarkt_id: { type: "string" },
          sofascore_id: { type: "string" },
          // Valeur marchande
          valeur_marchande: { type: "number" },
          valeur_marchande_peak: { type: "number" },
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
          // Stats saison en cours (SofaScore)
          stats_saison: {
            type: "object",
            properties: {
              saison: { type: "string" },
              matchs: { type: "number" },
              titulaire: { type: "number" },
              minutes: { type: "number" },
              buts: { type: "number" },
              passes_decisives: { type: "number" },
              buts_passes: { type: "number" },
              cartons_jaunes: { type: "number" },
              cartons_rouges: { type: "number" },
              note_sofascore: { type: "number" },
              // Offensif
              xg: { type: "number" },
              xa: { type: "number" },
              xg_par_90: { type: "number" },
              tirs: { type: "number" },
              tirs_cadres: { type: "number" },
              tirs_cadres_pct: { type: "number" },
              grandes_chances: { type: "number" },
              grandes_chances_manquees: { type: "number" },
              buts_tete: { type: "number" },
              buts_pied_droit: { type: "number" },
              buts_pied_gauche: { type: "number" },
              penaltys_marques: { type: "number" },
              penaltys_tires: { type: "number" },
              // Passes
              passes_reussies_pct: { type: "number" },
              passes_longues_pct: { type: "number" },
              passes_cles: { type: "number" },
              centres: { type: "number" },
              centres_reussis_pct: { type: "number" },
              // Dribbles & physique
              dribbles_reussis: { type: "number" },
              dribbles_tentes: { type: "number" },
              dribbles_pct: { type: "number" },
              touches_balle: { type: "number" },
              pertes_balle: { type: "number" },
              distance_course: { type: "number" },
              sprints: { type: "number" },
              vitesse_max: { type: "number" },
              // Défense
              interceptions: { type: "number" },
              tacles: { type: "number" },
              tacles_reussis_pct: { type: "number" },
              degagements: { type: "number" },
              duels_gagnes_pct: { type: "number" },
              duels_aeriens_pct: { type: "number" },
              recuperations: { type: "number" },
              fautes_commises: { type: "number" },
              fautes_subies: { type: "number" },
              hors_jeu: { type: "number" },
              // Gardien
              arrets: { type: "number" },
              arrets_pct: { type: "number" },
              clean_sheets: { type: "number" },
              buts_encaisses: { type: "number" },
              xg_contre: { type: "number" },
              sorties_reussies: { type: "number" }
            }
          },
          // Historique stats saison par saison
          stats_par_saison: {
            type: "array",
            items: {
              type: "object",
              properties: {
                saison: { type: "string" },
                club: { type: "string" },
                ligue: { type: "string" },
                matchs: { type: "number" },
                titulaire: { type: "number" },
                minutes: { type: "number" },
                buts: { type: "number" },
                passes: { type: "number" },
                cartons_jaunes: { type: "number" },
                cartons_rouges: { type: "number" },
                note_sofascore: { type: "number" },
                xg: { type: "number" },
                xa: { type: "number" }
              }
            }
          },
          // Historique des clubs
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
                passes: { type: "number" },
                ligue: { type: "string" },
                pays: { type: "string" },
                type_passage: { type: "string" },
                montant_transfert: { type: "number" }
              }
            }
          },
          // Sélection nationale
          selection_nationale: {
            type: "object",
            properties: {
              equipe: { type: "string" },
              matchs: { type: "number" },
              buts: { type: "number" },
              passes: { type: "number" },
              premiere_selection: { type: "string" },
              selection_u21: { type: "boolean" }
            }
          },
          // Blessures
          blessures_total: { type: "number" },
          jours_blesses: { type: "number" },
          type_blessures: { type: "string" },
          // Carrière totale
          matchs_carriere: { type: "number" },
          buts_carriere: { type: "number" },
          passes_carriere: { type: "number" },
          // Palmarès
          palmares: {
            type: "array",
            items: { type: "string" }
          },
          distinctions: { type: "string" },
          note_globale_scout: { type: "number" }
        }
      }
    });

    setResult(data);
    setLoadingFull(false);
  };

  const handleSaveToApp = async () => {
    if (!result) return;
    setSaving(true);
    const s = result.stats_saison;

    // ── 1. Fiche joueur principale ──
    const playerData = {
      nom: result.nom || query,
      age: result.age,
      date_naissance: result.date_naissance,
      lieu_naissance: result.lieu_naissance,
      nationalite: result.nationalite,
      nationalite_secondaire: result.deuxieme_nationalite,
      poste: result.poste,
      poste_secondaire: result.poste_secondaire,
      pied_fort: result.pied_fort,
      taille: result.taille,
      poids: result.poids,
      photo_url: result.photo_url,
      club_actuel: result.club_actuel,
      ligue: result.ligue,
      pays_ligue: result.pays_ligue,
      stade: result.stade,
      numero_maillot: result.numero_maillot,
      contrat_fin: result.contrat_fin,
      salaire: result.salaire_annuel,
      salaire_semaine: result.salaire_semaine,
      agent: result.agent,
      agence: result.agence,
      coach: result.coach,
      manager: result.manager,
      transfermarkt_id: result.transfermarkt_id,
      sofascore_id: result.sofascore_id,
      valeur_marchande: result.valeur_marchande,
      valeur_marchande_peak: result.valeur_marchande_peak,
      // Stats saison
      matchs_joues: s?.matchs,
      titularisations: s?.titulaire,
      minutes_jouees: s?.minutes,
      buts: s?.buts,
      passes_decisives: s?.passes_decisives,
      buts_passes: s?.buts_passes,
      cartons_jaunes: s?.cartons_jaunes,
      cartons_rouges: s?.cartons_rouges,
      note_moyenne: s?.note_sofascore,
      xg: s?.xg,
      xa: s?.xa,
      xg_par_90: s?.xg_par_90,
      tirs: s?.tirs,
      tirs_cadres: s?.tirs_cadres,
      tirs_cadres_pct: s?.tirs_cadres_pct,
      grandes_chances: s?.grandes_chances,
      grandes_chances_manquees: s?.grandes_chances_manquees,
      buts_tete: s?.buts_tete,
      buts_pied_droit: s?.buts_pied_droit,
      buts_pied_gauche: s?.buts_pied_gauche,
      penaltys_marques: s?.penaltys_marques,
      penaltys_tires: s?.penaltys_tires,
      passes_reussies_pct: s?.passes_reussies_pct,
      passes_longues_pct: s?.passes_longues_pct,
      passes_cles: s?.passes_cles,
      centres: s?.centres,
      centres_reussis_pct: s?.centres_reussis_pct,
      dribbles_reussis: s?.dribbles_reussis,
      dribbles_tentes: s?.dribbles_tentes,
      dribbles_pct: s?.dribbles_pct,
      touches_balle: s?.touches_balle,
      pertes_balle: s?.pertes_balle,
      distance_course: s?.distance_course,
      sprints: s?.sprints,
      vitesse_max: s?.vitesse_max,
      interceptions: s?.interceptions,
      tacles: s?.tacles,
      tacles_reussis_pct: s?.tacles_reussis_pct,
      degagements: s?.degagements,
      duels_gagnes_pct: s?.duels_gagnes_pct,
      duels_aeriens_pct: s?.duels_aeriens_pct,
      recuperations: s?.recuperations,
      fautes_commises: s?.fautes_commises,
      fautes_subies: s?.fautes_subies,
      hors_jeu: s?.hors_jeu,
      arrets: s?.arrets,
      arrets_pct: s?.arrets_pct,
      clean_sheets: s?.clean_sheets,
      buts_encaisses: s?.buts_encaisses,
      xg_contre: s?.xg_contre,
      sorties_reussies: s?.sorties_reussies,
      // Sélection
      matchs_international: result.selection_nationale?.matchs,
      buts_international: result.selection_nationale?.buts,
      passes_international: result.selection_nationale?.passes,
      premier_match_selection: result.selection_nationale?.premiere_selection,
      selection_u21: result.selection_nationale?.selection_u21,
      // Carrière
      matchs_carriere: result.matchs_carriere,
      buts_carriere: result.buts_carriere,
      passes_carriere: result.passes_carriere,
      nb_clubs: result.historique_clubs?.length,
      blessures: result.blessures_total,
      jours_blesses: result.jours_blesses,
      type_blessures: result.type_blessures,
      // Profil
      palmares: Array.isArray(result.palmares) ? result.palmares.join(", ") : result.palmares,
      distinctions: result.distinctions,
      stats_resume: result.description,
      style_jeu: result.style_jeu,
      forces: result.forces,
      faiblesses: result.faiblesses,
      note_globale_scout: result.note_globale_scout,
    };
    Object.keys(playerData).forEach(k => (playerData[k] == null || playerData[k] === "") && delete playerData[k]);

    const created = await base44.entities.Player.create(playerData);

    // ── 2. Historique clubs (PlayerCareerHistory) ──
    if (result.historique_clubs?.length > 0) {
      await base44.entities.PlayerCareerHistory.bulkCreate(
        result.historique_clubs
          .filter(c => c.club)
          .map(c => ({
            player_id: created.id,
            club: c.club,
            debut: c.debut,
            fin: c.fin || null,
            matchs: c.matchs,
            buts: c.buts,
            passes: c.passes,
            ligue: c.ligue,
            pays: c.pays,
            type_passage: c.type_passage || "Transfert",
            montant_transfert: c.montant_transfert
          }))
      );
    }

    // ── 3. Historique valeur marchande (PlayerMarketValue) ──
    if (result.valeur_historique?.length > 0) {
      await base44.entities.PlayerMarketValue.bulkCreate(
        result.valeur_historique
          .filter(v => v.date && v.valeur != null)
          .map(v => ({ player_id: created.id, date: v.date, valeur: v.valeur, source: "Transfermarkt" }))
      );
    }

    // ── 4. Stats par saison (PlayerSeasonStats) ──
    const allSeasons = [];
    if (result.stats_par_saison?.length > 0) {
      result.stats_par_saison.filter(s2 => s2.saison).forEach(s2 => {
        allSeasons.push({
          player_id: created.id,
          saison: s2.saison,
          club: s2.club,
          ligue: s2.ligue,
          matchs: s2.matchs,
          titularisations: s2.titulaire,
          minutes: s2.minutes,
          buts: s2.buts,
          passes_decisives: s2.passes,
          cartons_jaunes: s2.cartons_jaunes,
          cartons_rouges: s2.cartons_rouges,
          note_sofascore: s2.note_sofascore,
          xg: s2.xg,
          xa: s2.xa
        });
      });
    }
    // Saison actuelle dans PlayerSeasonStats
    if (s) {
      allSeasons.unshift({
        player_id: created.id,
        saison: s.saison || "2024/2025",
        club: result.club_actuel,
        ligue: result.ligue,
        matchs: s.matchs,
        titularisations: s.titulaire,
        minutes: s.minutes,
        buts: s.buts,
        passes_decisives: s.passes_decisives,
        cartons_jaunes: s.cartons_jaunes,
        cartons_rouges: s.cartons_rouges,
        note_sofascore: s.note_sofascore,
        xg: s.xg,
        xa: s.xa,
        tirs_par_match: s.tirs ? (s.tirs / (s.matchs || 1)).toFixed(1) : null,
        passes_reussies_pct: s.passes_reussies_pct,
        duels_gagnes_pct: s.duels_gagnes_pct,
        dribbles_reussis: s.dribbles_reussis,
        interceptions: s.interceptions,
        clean_sheets: s.clean_sheets
      });
    }
    if (allSeasons.length > 0) {
      await base44.entities.PlayerSeasonStats.bulkCreate(allSeasons.filter(s2 => s2.saison));
    }

    queryClient.invalidateQueries({ queryKey: ['players'] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate(createPageUrl("PlayerDetail") + `?id=${created.id}`), 800);
  };

  const s = result?.stats_saison;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-7 h-7 text-green-500" />
            Recherche de joueur
          </h1>
          <p className="text-xs text-slate-500 mt-1">Toutes les données Transfermarkt & SofaScore enregistrées automatiquement</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Ex: Kylian Mbappé, Erling Haaland, Pedri…"
            className="flex-1 h-12 text-base shadow-sm" />
          <Button type="submit" disabled={loading} className="h-12 px-6 bg-green-600 hover:bg-green-700">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </form>

        {/* Loading candidats */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <p className="text-slate-600 font-medium">Recherche des joueurs correspondants…</p>
          </div>
        )}

        {/* Sélection du candidat */}
        {candidates && candidates.length > 0 && !result && !loadingFull && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-green-500" />
                Plusieurs joueurs correspondent à "{query}" — Lequel voulez-vous ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {candidates.map((c, i) => (
                <button
                  key={i}
                  onClick={() => fetchFullProfile(c.nom_complet || c.nom)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left group"
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                    {c.photo_url
                      ? <img src={c.photo_url} alt={c.nom} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                      : <User className="w-7 h-7 text-slate-400 m-auto mt-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 group-hover:text-green-700 transition-colors">{c.nom_complet || c.nom}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {c.poste && <Badge className={`text-xs ${posteColors[c.poste] || "bg-slate-100 text-slate-700"}`}>{c.poste}</Badge>}
                      {c.nationalite && <Badge variant="outline" className="text-xs">{c.nationalite}</Badge>}
                      {c.club_actuel && <Badge className="bg-slate-800 text-white text-xs">{c.club_actuel}</Badge>}
                      {c.age && <Badge variant="outline" className="text-xs">{c.age} ans</Badge>}
                    </div>
                    {c.description_courte && <p className="text-xs text-slate-400 mt-1 truncate">{c.description_courte}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {c.valeur_marchande && <p className="font-bold text-green-600 text-sm">{c.valeur_marchande} M€</p>}
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-green-500 transition-colors mt-1 ml-auto" />
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
            <p className="text-slate-600 font-medium">Recherche complète en cours…</p>
            <div className="flex flex-col items-center gap-1">
              {["Transfermarkt…", "SofaScore…", "Historique & palmarès…"].map(t => (
                <p key={t} className="text-xs text-slate-400">{t}</p>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">

            {/* ── Carte identité ── */}
            <Card className="overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-400" />
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0 overflow-hidden">
                    {result.photo_url
                      ? <img src={result.photo_url} alt={result.nom} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                      : <User className="w-10 h-10 text-slate-400 m-auto mt-7" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">{result.nom_complet || result.nom}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.poste && <Badge className={posteColors[result.poste] || "bg-slate-100 text-slate-700"}>{result.poste}</Badge>}
                      {result.poste_secondaire && <Badge variant="outline" className="text-xs">{result.poste_secondaire}</Badge>}
                      {result.nationalite && <Badge variant="outline">{result.nationalite}</Badge>}
                      {result.deuxieme_nationalite && <Badge variant="outline">{result.deuxieme_nationalite}</Badge>}
                      {result.club_actuel && <Badge className="bg-slate-800 text-white">{result.club_actuel}</Badge>}
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

                {/* Quick stats */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                  <StatBox label="Âge" value={result.age ? `${result.age} ans` : null} />
                  <StatBox label="Taille" value={result.taille ? `${result.taille} cm` : null} />
                  <StatBox label="Poids" value={result.poids ? `${result.poids} kg` : null} />
                  <StatBox label="Pied fort" value={result.pied_fort} />
                  <StatBox label="Valeur marchande" value={result.valeur_marchande ? `${result.valeur_marchande} M€` : null} color="bg-green-50" textColor="text-green-700" />
                  <StatBox label="Valeur max" value={result.valeur_marchande_peak ? `${result.valeur_marchande_peak} M€` : null} color="bg-emerald-50" textColor="text-emerald-700" />
                </div>
              </CardContent>
            </Card>

            {/* ── Identité + Contrat ── */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> Identité</CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label="Nom complet" value={result.nom_complet} />
                  <InfoRow label="Date de naissance" value={result.date_naissance} />
                  <InfoRow label="Lieu de naissance" value={result.lieu_naissance} />
                  <InfoRow label="Nationalité" value={result.nationalite} />
                  <InfoRow label="2ème nationalité" value={result.deuxieme_nationalite} />
                  <InfoRow label="Taille" value={result.taille ? `${result.taille} cm` : null} />
                  <InfoRow label="Poids" value={result.poids ? `${result.poids} kg` : null} />
                  <InfoRow label="Pied fort" value={result.pied_fort} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Contrat & Club</CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label="Club actuel" value={result.club_actuel} />
                  <InfoRow label="Ligue" value={result.ligue} />
                  <InfoRow label="Stade" value={result.stade} />
                  <InfoRow label="N° maillot" value={result.numero_maillot} />
                  <InfoRow label="Début contrat" value={result.contrat_debut} />
                  <InfoRow label="Fin contrat" value={result.contrat_fin} />
                  <InfoRow label="Salaire annuel" value={result.salaire_annuel ? `${result.salaire_annuel} M€` : null} />
                  <InfoRow label="Salaire / semaine" value={result.salaire_semaine ? `${result.salaire_semaine} k€` : null} />
                  <InfoRow label="Agent" value={result.agent} />
                  <InfoRow label="Agence" value={result.agence} />
                  <InfoRow label="Entraîneur" value={result.coach} />
                  <InfoRow label="Directeur sportif" value={result.manager} />
                  <InfoRow label="ID Transfermarkt" value={result.transfermarkt_id} />
                  <InfoRow label="ID SofaScore" value={result.sofascore_id} />
                </CardContent>
              </Card>
            </div>

            {/* ── Stats saison actuelle ── */}
            {s && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-purple-500" />
                    Stats saison {s.saison || "2024/2025"} — SofaScore
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Basiques */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Général</p>
                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                      <StatBox label="Matchs" value={s.matchs} />
                      <StatBox label="Titulaire" value={s.titulaire} />
                      <StatBox label="Minutes" value={s.minutes} />
                      <StatBox label="Buts" value={s.buts} color="bg-green-50" textColor="text-green-700" />
                      <StatBox label="Passes D." value={s.passes_decisives} color="bg-blue-50" textColor="text-blue-700" />
                      <StatBox label="Jaunes" value={s.cartons_jaunes} color="bg-yellow-50" />
                      <StatBox label="Note" value={s.note_sofascore} color="bg-indigo-50" textColor="text-indigo-700" />
                    </div>
                  </div>
                  {/* Offensif */}
                  {(s.xg != null || s.tirs != null || s.grandes_chances != null) && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Offensif</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        <StatBox label="xG" value={s.xg} color="bg-green-50" textColor="text-green-700" />
                        <StatBox label="xA" value={s.xa} color="bg-blue-50" textColor="text-blue-700" />
                        <StatBox label="xG/90" value={s.xg_par_90} />
                        <StatBox label="Tirs" value={s.tirs} />
                        <StatBox label="Tirs cadrés" value={s.tirs_cadres} />
                        <StatBox label="% cadrés" value={s.tirs_cadres_pct != null ? `${s.tirs_cadres_pct}%` : null} />
                        <StatBox label="Gdes chances" value={s.grandes_chances} />
                        <StatBox label="Gdes ch. manq." value={s.grandes_chances_manquees} />
                        <StatBox label="Buts tête" value={s.buts_tete} />
                        <StatBox label="Buts pied D" value={s.buts_pied_droit} />
                        <StatBox label="Buts pied G" value={s.buts_pied_gauche} />
                        <StatBox label="Penaltys" value={s.penaltys_marques != null ? `${s.penaltys_marques}/${s.penaltys_tires}` : null} />
                      </div>
                    </div>
                  )}
                  {/* Passes */}
                  {(s.passes_reussies_pct != null || s.passes_cles != null) && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Passes & création</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        <StatBox label="% passes" value={s.passes_reussies_pct != null ? `${s.passes_reussies_pct}%` : null} />
                        <StatBox label="% pass. longues" value={s.passes_longues_pct != null ? `${s.passes_longues_pct}%` : null} />
                        <StatBox label="Passes clés" value={s.passes_cles} />
                        <StatBox label="Centres" value={s.centres} />
                        <StatBox label="% centres" value={s.centres_reussis_pct != null ? `${s.centres_reussis_pct}%` : null} />
                      </div>
                    </div>
                  )}
                  {/* Dribbles & physique */}
                  {(s.dribbles_reussis != null || s.distance_course != null) && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Dribbles & physique</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        <StatBox label="Dribbles réussis" value={s.dribbles_reussis} />
                        <StatBox label="% dribbles" value={s.dribbles_pct != null ? `${s.dribbles_pct}%` : null} />
                        <StatBox label="Touches/match" value={s.touches_balle} />
                        <StatBox label="Pertes balle" value={s.pertes_balle} />
                        <StatBox label="Distance km/match" value={s.distance_course} />
                        <StatBox label="Vitesse max" value={s.vitesse_max ? `${s.vitesse_max} km/h` : null} />
                        <StatBox label="Sprints/match" value={s.sprints} />
                      </div>
                    </div>
                  )}
                  {/* Défense */}
                  {(s.interceptions != null || s.tacles != null || s.duels_gagnes_pct != null) && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Défense & duels</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        <StatBox label="Interceptions" value={s.interceptions} />
                        <StatBox label="Tacles" value={s.tacles} />
                        <StatBox label="% tacles" value={s.tacles_reussis_pct != null ? `${s.tacles_reussis_pct}%` : null} />
                        <StatBox label="Dégagements" value={s.degagements} />
                        <StatBox label="% duels" value={s.duels_gagnes_pct != null ? `${s.duels_gagnes_pct}%` : null} />
                        <StatBox label="% duels aériens" value={s.duels_aeriens_pct != null ? `${s.duels_aeriens_pct}%` : null} />
                        <StatBox label="Récupérations" value={s.recuperations} />
                        <StatBox label="Fautes commises" value={s.fautes_commises} />
                        <StatBox label="Fautes subies" value={s.fautes_subies} />
                        <StatBox label="Hors-jeu" value={s.hors_jeu} />
                      </div>
                    </div>
                  )}
                  {/* Gardien */}
                  {(s.arrets != null || s.clean_sheets != null) && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Gardien</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        <StatBox label="Arrêts" value={s.arrets} />
                        <StatBox label="% arrêts" value={s.arrets_pct != null ? `${s.arrets_pct}%` : null} />
                        <StatBox label="Clean sheets" value={s.clean_sheets} color="bg-green-50" textColor="text-green-700" />
                        <StatBox label="Buts encaissés" value={s.buts_encaisses} />
                        <StatBox label="xG encaissés" value={s.xg_contre} />
                        <StatBox label="Sorties" value={s.sorties_reussies} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Évolution valeur marchande ── */}
            {result.valeur_historique?.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" /> Évolution valeur marchande — Transfermarkt
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

            {/* ── Stats par saison ── */}
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
                          <th className="text-left pb-2 pr-3">Club</th>
                          <th className="text-left pb-2 pr-3">Ligue</th>
                          <th className="text-center pb-2">MJ</th>
                          <th className="text-center pb-2">Tit.</th>
                          <th className="text-center pb-2">Min.</th>
                          <th className="text-center pb-2">Buts</th>
                          <th className="text-center pb-2">PD</th>
                          <th className="text-center pb-2">Note</th>
                          <th className="text-center pb-2">xG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.stats_par_saison.map((ss, i) => (
                          <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                            <td className="py-2 pr-3 font-medium text-slate-700 whitespace-nowrap">{ss.saison}</td>
                            <td className="py-2 pr-3 text-slate-500 text-xs whitespace-nowrap">{ss.club}</td>
                            <td className="py-2 pr-3 text-slate-400 text-xs">{ss.ligue}</td>
                            <td className="py-2 text-center">{ss.matchs ?? "—"}</td>
                            <td className="py-2 text-center text-slate-400">{ss.titulaire ?? "—"}</td>
                            <td className="py-2 text-center text-slate-400">{ss.minutes ?? "—"}</td>
                            <td className="py-2 text-center font-semibold text-green-600">{ss.buts ?? "—"}</td>
                            <td className="py-2 text-center font-semibold text-blue-600">{ss.passes ?? "—"}</td>
                            <td className="py-2 text-center text-indigo-600">{ss.note_sofascore ?? "—"}</td>
                            <td className="py-2 text-center text-purple-600">{ss.xg ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Historique clubs ── */}
            {result.historique_clubs?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" /> Historique des clubs — Transfermarkt
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.historique_clubs.map((club, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-900">{club.club}</div>
                        <div className="text-xs text-slate-500">
                          {club.debut}{club.fin ? ` → ${club.fin}` : " → maintenant"}
                          {club.ligue && ` · ${club.ligue}`}
                          {club.type_passage && ` · ${club.type_passage}`}
                          {club.montant_transfert ? ` · ${club.montant_transfert} M€` : ""}
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-right flex-shrink-0">
                        {club.matchs != null && <div><span className="font-semibold text-slate-700">{club.matchs}</span><div className="text-slate-400">MJ</div></div>}
                        {club.buts != null && <div><span className="font-semibold text-green-600">{club.buts}</span><div className="text-slate-400">buts</div></div>}
                        {club.passes != null && <div><span className="font-semibold text-blue-600">{club.passes}</span><div className="text-slate-400">PD</div></div>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ── Sélection + Blessures + Carrière ── */}
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
                    <InfoRow label="U21" value={result.selection_nationale.selection_u21 != null ? (result.selection_nationale.selection_u21 ? "Oui" : "Non") : null} />
                  </CardContent>
                </Card>
              )}

              {(result.blessures_total != null || result.jours_blesses != null) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Blessures (carrière)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InfoRow label="Nombre de blessures" value={result.blessures_total} />
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
                    <InfoRow label="Matchs (carrière)" value={result.matchs_carriere} />
                    <InfoRow label="Buts (carrière)" value={result.buts_carriere} />
                    <InfoRow label="Passes (carrière)" value={result.passes_carriere} />
                    <InfoRow label="Clubs différents" value={result.historique_clubs?.length} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ── Profil scout ── */}
            {(result.style_jeu || result.forces || result.faiblesses) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> Profil scout</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.style_jeu && <div><p className="text-xs font-semibold text-slate-400 uppercase mb-1">Style de jeu</p><p className="text-sm text-slate-700">{result.style_jeu}</p></div>}
                  {result.forces && <div><p className="text-xs font-semibold text-green-600 uppercase mb-1">Points forts</p><p className="text-sm text-slate-700">{result.forces}</p></div>}
                  {result.faiblesses && <div><p className="text-xs font-semibold text-red-500 uppercase mb-1">Points faibles</p><p className="text-sm text-slate-700">{result.faiblesses}</p></div>}
                  {result.note_globale_scout != null && <div className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /><span className="font-bold text-lg text-slate-900">{result.note_globale_scout}/100</span><span className="text-xs text-slate-500">Note scout</span></div>}
                </CardContent>
              </Card>
            )}

            {/* ── Palmarès & distinctions ── */}
            {(result.palmares?.length > 0 || result.distinctions) && (
              <div className="grid md:grid-cols-2 gap-4">
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
                {result.distinctions && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-purple-500" /> Distinctions individuelles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-700">{result.distinctions}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ── CTA final ── */}
            <div className="flex justify-end pb-6 gap-3">
              <p className="text-xs text-slate-400 self-center">Toutes les données ci-dessus seront sauvegardées</p>
              <Button onClick={handleSaveToApp} disabled={saving || saved}
                className={`${saved ? "bg-green-600" : "bg-slate-900 hover:bg-slate-700"} px-8`}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {saved ? <><Trophy className="w-4 h-4 mr-2" /> Joueur ajouté ! <ArrowRight className="w-4 h-4 ml-2" /></> : <><Plus className="w-4 h-4 mr-2" /> Ajouter à mes joueurs</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}