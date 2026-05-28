import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, User, MapPin, TrendingUp,
  Trophy, Plus, ArrowRight, BarChart2,
  Activity, Globe, Star, Building2, Heart
} from "lucide-react";
import TransfermarktImage from "../ui/TransfermarktImage";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

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
  const { lang } = useLanguage();
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

  // Map positions API-Football → notre enum
  const mapPosteAF = (pos) => {
    const m = { Goalkeeper: "Gardien", Defender: "Défenseur central", Midfielder: "Milieu central", Attacker: "Attaquant" };
    return m[pos] || null;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setCandidates(null);
    setSaved(false);
    setError(null);

    try {
      // ── Source 1 : API-Football (données réelles, photos fiables) ──
      let list = [];
      try {
        const afRes = await base44.functions.invoke("apiFootballProxy", {
          action: "searchPlayer",
          name: query.trim(),
        });
        if (afRes?.players?.length > 0) {
          list = afRes.players.map(p => ({
            id_apifootball: p.id,
            nom:            p.nom,
            club:           p.club_actuel || "",
            poste:          p.poste || "",
            nationalite:    p.nationalite || "",
            age:            p.age,
            valeur_marchande: null,
            photo_url:      p.photo_url,   // URL fiable API-Football
          }));
        }
      } catch (_) { /* fallback ci-dessous */ }

      // ── Source 2 : LLM (si API-Football ne trouve rien) ─────────────
      if (list.length === 0) {
        const data = await base44.integrations.Core.InvokeLLM({
          prompt: `Recherche le joueur de football professionnel "${query.trim()}".
Retourne jusqu'à 5 joueurs correspondants avec : nom exact, club actuel, poste, nationalité, âge, valeur marchande en millions €, URL photo (Wikipedia ou site officiel — PAS Transfermarkt).`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              candidats: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    nom:              { type: "string" },
                    club:             { type: "string" },
                    poste:            { type: "string" },
                    nationalite:      { type: "string" },
                    age:              { type: "number" },
                    valeur_marchande: { type: "number" },
                    photo_url:        { type: "string" },
                  },
                },
              },
            },
          },
        });
        list = data?.candidats || [];
      }

      if (list.length === 0) {
        setError(t(lang, 'playerSearch.noPlayerFound', { query: query.trim() }));
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
      setError(t(lang, 'playerSearch.searchError', { msg: err.message }));
      setLoading(false);
    }
  };

  const fetchFullProfile = async (candidate) => {
    setLoadingFull(true);
    setResult(null);
    setCandidates(null);
    setError(null);

    const playerName = candidate.nom;
    const playerClub = candidate.club || "";

    try {
      // ── Source 1 : API-Football (stats réelles si on a l'ID) ────────
      let afPlayer = null;
      if (candidate.id_apifootball) {
        setLoadingStatus(t(lang, 'playerSearch.loadingLine1'));
        try {
          const afRes = await base44.functions.invoke("apiFootballProxy", {
            action: "getPlayer",
            id: candidate.id_apifootball,
          });
          if (afRes?.ok && afRes?.player) afPlayer = afRes.player;
        } catch (_) { /* optional */ }
      }

      // ── Source 2 : TheSportsDB (photo + social si AF n'a pas de photo) ─
      let photoUrl = candidate.photo_url || afPlayer?.photo_url || null;
      if (!photoUrl) {
        try {
          const tsdbRes = await base44.functions.invoke("enrichPlayerFromAPI", { playerName });
          if (tsdbRes?.data?.photo_url) photoUrl = tsdbRes.data.photo_url;
        } catch (_) { /* optional */ }
      }

      // ── Source 3 : LLM pour les gaps (agent, palmarès, valeur, scout) ─
      setLoadingStatus(t(lang, 'playerSearch.loadingProfile'));

      // Prépare le contexte AF pour le prompt LLM
      const afContext = afPlayer ? `
Données déjà récupérées depuis API-Football (fiables, ne pas réinventer) :
- Nom : ${afPlayer.nom}
- Âge : ${afPlayer.age}
- Nationalité : ${afPlayer.nationalite}
- Club actuel : ${afPlayer.club_actuel}
- Ligue : ${afPlayer.ligue} (${afPlayer.pays_ligue})
- Taille : ${afPlayer.taille} cm, Poids : ${afPlayer.poids} kg
- Stats saison ${afPlayer.stats_saison?.saison || '2024'} : ${afPlayer.stats_saison ? JSON.stringify(afPlayer.stats_saison) : 'non disponible'}

Complète UNIQUEMENT les informations manquantes (agent, valeur marchande, historique valeur, palmarès, distinctions, profil scout, fin de contrat, salaire, historique clubs, sélection nationale, stats par saison).` : `Recherche le profil complet de ${playerName}${playerClub ? ` (${playerClub})` : ""}.`;

      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `Profil complet du joueur de football professionnel : ${playerName}${playerClub ? ` (${playerClub})` : ""}.

${afContext}

Données à retourner si non déjà connues :
- Valeur marchande actuelle (millions €), valeur peak
- Historique valeur marchande (date YYYY-MM, valeur en millions €)
- Fin de contrat, salaire annuel, agent, agence
- Sélection nationale : équipe, matchs, buts, passes
- Palmarès, distinctions individuelles
- Profil scout : style de jeu, forces, faiblesses, note /100
- Historique clubs (clubs, dates, montants en millions €, type)
- Stats par saison (carrière complète)
- IDs : Transfermarkt, SofaScore

Ne PAS réinventer les stats déjà fournies. null si inconnu.`,
        add_context_from_internet: true,
        response_json_schema: FULL_PROFILE_SCHEMA,
      });

      if (!data || !data.nom) throw new Error(t(lang, 'playerSearch.profileNotFound'));

      // ── Merge : API-Football (fiable) > LLM (gaps) ───────────────────
      const merged = { ...data };

      if (afPlayer) {
        // Les champs AF sont toujours prioritaires (données réelles)
        if (afPlayer.nom)          merged.nom          = afPlayer.nom;
        if (afPlayer.age)          merged.age          = afPlayer.age;
        if (afPlayer.date_naissance) merged.date_naissance = afPlayer.date_naissance;
        if (afPlayer.lieu_naissance) merged.lieu_naissance = afPlayer.lieu_naissance;
        if (afPlayer.nationalite)  merged.nationalite  = afPlayer.nationalite;
        if (afPlayer.taille)       merged.taille       = afPlayer.taille;
        if (afPlayer.poids)        merged.poids        = afPlayer.poids;
        if (afPlayer.poste)        merged.poste        = afPlayer.poste;
        if (afPlayer.club_actuel)  merged.club_actuel  = afPlayer.club_actuel;
        if (afPlayer.ligue)        merged.ligue        = afPlayer.ligue;
        if (afPlayer.pays_ligue)   merged.pays_ligue   = afPlayer.pays_ligue;
        if (afPlayer.numero_maillot) merged.numero_maillot = afPlayer.numero_maillot;

        // Stats saison AF → champs stats_saison du profil LLM
        if (afPlayer.stats_saison) {
          const s = afPlayer.stats_saison;
          merged.stats_saison = {
            ...(merged.stats_saison || {}),
            saison:           s.saison || merged.stats_saison?.saison,
            matchs:           s.matchs ?? merged.stats_saison?.matchs,
            titulaire:        s.titulaire ?? merged.stats_saison?.titulaire,
            minutes:          s.minutes ?? merged.stats_saison?.minutes,
            buts:             s.buts ?? merged.stats_saison?.buts,
            passes_decisives: s.passes_decisives ?? merged.stats_saison?.passes_decisives,
            cartons_jaunes:   s.cartons_jaunes ?? merged.stats_saison?.cartons_jaunes,
            cartons_rouges:   s.cartons_rouges ?? merged.stats_saison?.cartons_rouges,
            tirs:             s.tirs ?? merged.stats_saison?.tirs,
            tirs_cadres:      s.tirs_cadres ?? merged.stats_saison?.tirs_cadres,
            passes_cles:      s.passes_cles ?? merged.stats_saison?.passes_cles,
            dribbles_reussis: s.dribbles_reussis ?? merged.stats_saison?.dribbles_reussis,
            tacles:           s.tacles ?? merged.stats_saison?.tacles,
            interceptions:    s.interceptions ?? merged.stats_saison?.interceptions,
          };
        }

        // Historique multi-saisons AF si disponible
        if (afPlayer.toutes_stats?.length > 1 && (!merged.stats_par_saison || merged.stats_par_saison.length < 2)) {
          merged.stats_par_saison = afPlayer.toutes_stats.map(s => ({
            saison: s.saison,
            club:   s.club,
            ligue:  s.ligue,
            matchs: s.matchs,
            buts:   s.buts,
            passes: s.passes,
            minutes: s.minutes,
          }));
        }
      }

      // Photo : priorité API-Football → TheSportsDB → LLM
      merged.photo_url = photoUrl
        || (merged.photo_url && !merged.photo_url.includes('transfermarkt') ? merged.photo_url : null)
        || null;

      setResult(merged);
    } catch (err) {
      setError(err.message || t(lang, 'playerSearch.loadError'));
    } finally {
      setLoadingFull(false);
      setLoadingStatus("");
    }
  };

  const handleSaveToApp = async () => {
    if (!result) return;
    setSaving(true);
    const s = result.stats_saison;

    try {
      if (result.club_actuel) {
        const existingClubs = await base44.entities.Club.filter({ nom: result.club_actuel });
        if (!existingClubs || existingClubs.length === 0) {
          let clubData = {
            nom:   result.club_actuel,
            pays:  result.pays_ligue || '',
            ligue: result.ligue      || '',
          };
          try {
            const clubInfo = await base44.integrations.Core.InvokeLLM({
              prompt: `Données du club "${result.club_actuel}" (${result.ligue || ''}, ${result.pays_ligue || ''}). Retourne stade, capacité, président, entraîneur, logo URL, site web. Si inconnu = null.`,
              add_context_from_internet: true,
              response_json_schema: {
                type: "object",
                properties: {
                  ville:             { type: "string" },
                  stade:             { type: "string" },
                  capacite_stade:    { type: "number" },
                  annee_fondation:   { type: "number" },
                  president:         { type: "string" },
                  entraineur:        { type: "string" },
                  directeur_sportif: { type: "string" },
                  logo_url:          { type: "string" },
                  site_web:          { type: "string" },
                  email:             { type: "string" },
                  telephone:         { type: "string" },
                  valeur_effectif:   { type: "number" },
                  budget_transfert:  { type: "number" },
                  palmares:          { type: "string" },
                },
              },
            });
            if (clubInfo) {
              Object.keys(clubInfo).forEach(k => {
                if (clubInfo[k] != null && clubInfo[k] !== '') clubData[k] = clubInfo[k];
              });
            }
          } catch (_) { /* optional */ }
          await base44.entities.Club.create(clubData);
          queryClient.invalidateQueries({ queryKey: ['clubs'] });
        }
      }

      const playerData = {
        nom:                    result.nom || query,
        age:                    result.age,
        date_naissance:         result.date_naissance,
        lieu_naissance:         result.lieu_naissance,
        nationalite:            result.nationalite,
        nationalite_secondaire: result.nationalite_secondaire,
        poste:                  result.poste,
        poste_secondaire:       result.poste_secondaire,
        pied_fort:              result.pied_fort,
        taille:                 result.taille,
        poids:                  result.poids,
        photo_url:              result.photo_url,
        club_actuel:            result.club_actuel,
        ligue:                  result.ligue,
        pays_ligue:             result.pays_ligue,
        numero_maillot:         result.numero_maillot,
        contrat_fin:            result.contrat_fin,
        salaire:                result.salaire_annuel,
        salaire_semaine:        result.salaire_semaine,
        agent:                  result.agent,
        coach:                  result.coach,
        transfermarkt_id:       result.transfermarkt_id,
        sofascore_id:           result.sofascore_id,
        valeur_marchande:       result.valeur_marchande,
        valeur_marchande_peak:  result.valeur_marchande_peak,
        matchs_joues:           s?.matchs,
        buts:                   s?.buts,
        passes_decisives:       s?.passes_decisives,
        minutes_jouees:         s?.minutes,
        note_moyenne:           s?.note_sofascore,
        xg:                     s?.xg,
        xa:                     s?.xa,
        tirs:                   s?.tirs,
        tirs_cadres:            s?.tirs_cadres,
        passes_cles:            s?.passes_cles,
        dribbles_reussis:       s?.dribbles_reussis,
        interceptions:          s?.interceptions,
        tacles:                 s?.tacles,
        cartons_jaunes:         s?.cartons_jaunes,
        cartons_rouges:         s?.cartons_rouges,
        matchs_international:   result.selection_nationale?.matchs,
        buts_international:     result.selection_nationale?.buts,
        passes_international:   result.selection_nationale?.passes,
        premier_match_selection: result.selection_nationale?.premiere_selection,
        matchs_carriere:        result.matchs_carriere,
        buts_carriere:          result.buts_carriere,
        passes_carriere:        result.passes_carriere,
        blessures:              result.blessures_total,
        jours_blesses:          result.jours_blesses,
        type_blessures:         result.type_blessures,
        palmares:               Array.isArray(result.palmares) ? result.palmares.join(", ") : result.palmares,
        distinctions:           result.distinctions,
        style_jeu:              result.style_jeu,
        forces:                 result.forces,
        faiblesses:             result.faiblesses,
        stats_resume:           result.description,
        note_globale_scout:     result.note_globale_scout,
        nb_clubs:               result.historique_clubs?.length,
      };
      Object.keys(playerData).forEach(k =>
        (playerData[k] == null || playerData[k] === "") && delete playerData[k]
      );

      const created = await base44.entities.Player.create(playerData);

      await Promise.allSettled([
        result.historique_clubs?.length > 0
          ? base44.entities.PlayerCareerHistory.bulkCreate(
              result.historique_clubs.filter(c => c.club).map(c => ({ player_id: created.id, ...c }))
            )
          : Promise.resolve(),
        result.valeur_historique?.length > 0
          ? base44.entities.PlayerMarketValue.bulkCreate(
              result.valeur_historique
                .filter(v => v.date && v.valeur != null)
                .map(v => ({ player_id: created.id, date: v.date, valeur: v.valeur, source: "LLM" }))
            )
          : Promise.resolve(),
        result.stats_par_saison?.length > 0
          ? base44.entities.PlayerSeasonStats.bulkCreate(
              result.stats_par_saison.filter(s2 => s2.saison).map(s2 => ({ player_id: created.id, ...s2 }))
            )
          : Promise.resolve(),
      ]);

      queryClient.invalidateQueries({ queryKey: ['players'] });
      setSaved(true);
      setTimeout(() => navigate(createPageUrl("PlayerDetail") + `?id=${created.id}`), 800);
    } catch (err) {
      console.error("Save error:", err);
      setError(t(lang, 'playerSearch.saveError', { msg: err.message || "inconnue" }));
    } finally {
      setSaving(false);
    }
  };

  const s = result?.stats_saison;

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">
        {t(lang, 'playerSearch.subtitle')}
      </p>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t(lang, 'playerSearch.searchPlh')}
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

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
          <p className="text-slate-600 font-medium">{t(lang, 'playerSearch.searching')}</p>
          <p className="text-xs text-slate-400">{t(lang, 'playerSearch.searchingSources')}</p>
        </div>
      )}

      {candidates && candidates.length > 0 && !result && !loadingFull && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-green-500" />
              {t(lang, 'playerSearch.candidatesFor', { count: candidates.length, query })}
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
                  <TransfermarktImage
                    src={c.photo_url}
                    alt={c.nom}
                    className="w-full h-full object-cover"
                    fallback={<User className="w-7 h-7 text-slate-400 m-auto mt-3.5" />}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 group-hover:text-green-700">{c.nom}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {c.poste && <Badge className={`text-xs ${posteColors[c.poste] || "bg-slate-100 text-slate-700"}`}>{c.poste}</Badge>}
                    {c.nationalite && <Badge variant="outline" className="text-xs">{c.nationalite}</Badge>}
                    {c.club && <Badge className="bg-slate-800 text-white text-xs">{c.club}</Badge>}
                    {c.age && <Badge variant="outline" className="text-xs">{c.age} {t(lang, 'common.ageUnit')}</Badge>}
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

      {loadingFull && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
          <p className="text-slate-600 font-medium">{loadingStatus || t(lang, 'playerSearch.loadingProfile')}</p>
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-slate-400">{t(lang, 'playerSearch.loadingLine1')}</p>
            <p className="text-xs text-slate-400">{t(lang, 'playerSearch.loadingLine2')}</p>
            <p className="text-xs text-slate-400">{t(lang, 'playerSearch.loadingLine3')}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-400" />
            <CardContent className="pt-5">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0 overflow-hidden">
                  <TransfermarktImage
                    src={result.photo_url}
                    alt={result.nom}
                    className="w-full h-full object-cover"
                    fallback={<User className="w-10 h-10 text-slate-400 m-auto mt-7" />}
                  />
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
                  {saved ? <><Trophy className="w-4 h-4 mr-1" /> {t(lang, 'playerSearch.saved')}</> :
                    saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
                      <><Plus className="w-4 h-4 mr-1" /> {t(lang, 'playerSearch.add')}</>}
                </Button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                <StatBox label={t(lang, 'playerDetail.age')} value={result.age ? `${result.age} ${t(lang, 'common.ageUnit')}` : null} />
                <StatBox label={t(lang, 'playerDetail.height')} value={result.taille ? `${result.taille} cm` : null} />
                <StatBox label={t(lang, 'fullProfile.weight')} value={result.poids ? `${result.poids} kg` : null} />
                <StatBox label={t(lang, 'playerForm.foot')} value={result.pied_fort} />
                <StatBox label={t(lang, 'playerDetail.value')} value={result.valeur_marchande ? `${result.valeur_marchande} M€` : null} color="bg-green-50" textColor="text-green-700" />
                <StatBox label={t(lang, 'playerSearch.marketValuePeak')} value={result.valeur_marchande_peak ? `${result.valeur_marchande_peak} M€` : null} color="bg-emerald-50" textColor="text-emerald-700" />
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> {t(lang, 'playerSearch.identity')}</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label={t(lang, 'playerSearch.dob')} value={result.date_naissance} />
                <InfoRow label={t(lang, 'playerSearch.birthplace')} value={result.lieu_naissance} />
                <InfoRow label={t(lang, 'playerDetail.nationality')} value={result.nationalite} />
                <InfoRow label={t(lang, 'playerSearch.nationality2')} value={result.nationalite_secondaire} />
                <InfoRow label={t(lang, 'playerDetail.height')} value={result.taille ? `${result.taille} cm` : null} />
                <InfoRow label={t(lang, 'fullProfile.weight')} value={result.poids ? `${result.poids} kg` : null} />
                <InfoRow label={t(lang, 'playerForm.foot')} value={result.pied_fort} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-500" /> {t(lang, 'playerSearch.contractClub')}
                  {result.club_actuel && <span className="text-xs text-green-600 font-normal ml-auto">{t(lang, 'playerSearch.autoClub')}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label={t(lang, 'playerSearch.currentClub')} value={result.club_actuel} />
                <InfoRow label={t(lang, 'playerSearch.league')} value={result.ligue} />
                <InfoRow label={t(lang, 'playerSearch.country')} value={result.pays_ligue} />
                <InfoRow label={t(lang, 'playerSearch.jerseyNum')} value={result.numero_maillot} />
                <InfoRow label={t(lang, 'playerSearch.contractEnd')} value={result.contrat_fin} />
                <InfoRow label={t(lang, 'playerSearch.annualSalary')} value={result.salaire_annuel ? `${result.salaire_annuel} M€` : null} />
                <InfoRow label={t(lang, 'playerSearch.agent')} value={result.agent} />
                <InfoRow label={t(lang, 'playerSearch.coach')} value={result.coach} />
                <InfoRow label={t(lang, 'playerSearch.tmId')} value={result.transfermarkt_id} />
              </CardContent>
            </Card>
          </div>

          {s && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-500" />
                  {t(lang, 'playerSearch.statsSeason')} {s.saison || "2024/2025"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  <StatBox label={t(lang, 'playerSearch.matches')} value={s.matchs} />
                  <StatBox label={t(lang, 'playerSearch.starter')} value={s.titulaire} />
                  <StatBox label={t(lang, 'playerSearch.minutes')} value={s.minutes} />
                  <StatBox label={t(lang, 'playerSearch.goals')} value={s.buts} color="bg-green-50" textColor="text-green-700" />
                  <StatBox label={t(lang, 'playerSearch.assists')} value={s.passes_decisives} color="bg-blue-50" textColor="text-blue-700" />
                  <StatBox label={t(lang, 'playerSearch.yellows')} value={s.cartons_jaunes} color="bg-yellow-50" />
                  <StatBox label={t(lang, 'playerSearch.rating')} value={s.note_sofascore} color="bg-indigo-50" textColor="text-indigo-700" />
                </div>
                {(s.xg != null || s.tirs != null) && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                    <StatBox label="xG" value={s.xg} color="bg-green-50" textColor="text-green-700" />
                    <StatBox label="xA" value={s.xa} color="bg-blue-50" textColor="text-blue-700" />
                    <StatBox label={t(lang, 'playerSearch.shots')} value={s.tirs} />
                    <StatBox label={t(lang, 'playerSearch.shotsOnTarget')} value={s.tirs_cadres} />
                    <StatBox label={t(lang, 'playerSearch.keyPasses')} value={s.passes_cles} />
                    <StatBox label={t(lang, 'playerSearch.dribbles')} value={s.dribbles_reussis} />
                    <StatBox label={t(lang, 'playerSearch.interceptions')} value={s.interceptions} />
                    <StatBox label={t(lang, 'playerSearch.tackles')} value={s.tacles} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {result.valeur_historique?.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" /> {t(lang, 'playerSearch.valueChartTitle')}
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
                    <Tooltip formatter={v => [`${v} M€`, t(lang, 'playerDetail.value')]} />
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
                  <BarChart2 className="w-4 h-4 text-indigo-500" /> {t(lang, 'playerSearch.statsPerSeason')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-slate-100">
                        <th className="text-left pb-2 pr-3">{t(lang, 'playerSearch.thSeason')}</th>
                        <th className="text-left pb-2 pr-3">{t(lang, 'playerSearch.thCompetition')}</th>
                        <th className="text-center pb-2">{t(lang, 'playerSearch.thApps')}</th>
                        <th className="text-center pb-2">{t(lang, 'playerSearch.thMins')}</th>
                        <th className="text-center pb-2">{t(lang, 'playerSearch.thGoals')}</th>
                        <th className="text-center pb-2">{t(lang, 'playerSearch.thAssists')}</th>
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
                  <MapPin className="w-4 h-4 text-red-500" /> {t(lang, 'playerSearch.transferHistory')}
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
                  <CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> {t(lang, 'playerSearch.national')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-slate-900 mb-2">{result.selection_nationale.equipe}</p>
                  <InfoRow label={t(lang, 'playerSearch.matches')} value={result.selection_nationale.matchs} />
                  <InfoRow label={t(lang, 'playerSearch.goals')} value={result.selection_nationale.buts} />
                  <InfoRow label={t(lang, 'playerSearch.assists')} value={result.selection_nationale.passes} />
                  <InfoRow label={t(lang, 'playerSearch.firstCap')} value={result.selection_nationale.premiere_selection} />
                </CardContent>
              </Card>
            )}
            {(result.blessures_total != null || result.jours_blesses != null) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> {t(lang, 'playerSearch.injuries')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label={t(lang, 'playerSearch.injuryCount')} value={result.blessures_total} />
                  <InfoRow label={t(lang, 'playerSearch.injuryDays')} value={result.jours_blesses} />
                  <InfoRow label={t(lang, 'playerSearch.injuryTypes')} value={result.type_blessures} />
                </CardContent>
              </Card>
            )}
            {(result.matchs_carriere != null || result.buts_carriere != null) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-slate-500" /> {t(lang, 'playerSearch.career')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label={t(lang, 'playerSearch.matches')} value={result.matchs_carriere} />
                  <InfoRow label={t(lang, 'playerSearch.goals')} value={result.buts_carriere} />
                  <InfoRow label={t(lang, 'playerSearch.passesCareer')} value={result.passes_carriere} />
                  <InfoRow label={t(lang, 'playerSearch.careerClubs')} value={result.historique_clubs?.length} />
                </CardContent>
              </Card>
            )}
          </div>

          {(result.style_jeu || result.forces || result.faiblesses) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> {t(lang, 'playerSearch.scoutProfile')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.style_jeu && <div><p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t(lang, 'playerSearch.playStyle')}</p><p className="text-sm text-slate-700">{result.style_jeu}</p></div>}
                {result.forces && <div><p className="text-xs font-semibold text-green-600 uppercase mb-1">{t(lang, 'playerSearch.strengths')}</p><p className="text-sm text-slate-700">{result.forces}</p></div>}
                {result.faiblesses && <div><p className="text-xs font-semibold text-red-500 uppercase mb-1">{t(lang, 'playerSearch.weaknesses')}</p><p className="text-sm text-slate-700">{result.faiblesses}</p></div>}
                {result.note_globale_scout != null && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-lg">{result.note_globale_scout}/100</span>
                    <span className="text-xs text-slate-500">{t(lang, 'playerSearch.scoutRating')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {result.palmares?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> {t(lang, 'playerSearch.trophies')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.palmares.map((tr, i) => (
                    <Badge key={i} className="bg-amber-50 text-amber-800 border border-amber-200">{tr}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pb-6 gap-3">
            {result.club_actuel && (
              <p className="text-xs text-slate-400 self-center">{t(lang, 'playerSearch.autoClubNote', { club: result.club_actuel })}</p>
            )}
            <Button onClick={handleSaveToApp} disabled={saving || saved}
              className={`${saved ? "bg-green-600" : "bg-slate-900 hover:bg-slate-700"} px-8`}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {saved
                ? <><Trophy className="w-4 h-4 mr-2" /> {t(lang, 'playerSearch.playerAdded')} <ArrowRight className="w-4 h-4 ml-2" /></>
                : <><Plus className="w-4 h-4 mr-2" /> {t(lang, 'playerSearch.addToPlayers')}</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
