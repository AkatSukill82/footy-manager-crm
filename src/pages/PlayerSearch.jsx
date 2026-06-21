import React, { useState } from "react";
import { withOrg } from "../lib/org";
import { base44, invokeFn } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, User, Trophy, BarChart2, Plus, ArrowRight,
  Building2, ExternalLink, Link
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQueryClient } from "@tanstack/react-query";
import { getCache, setCache, normalizeQuery } from "../lib/searchCache";
import { playerExternalLinks } from "../lib/externalLinks";
import { ensureClubForPlayer } from "../lib/ensureClub";
import { cleanPlayerName } from "../lib/cleanName";

const posteColors = {
  "Gardien":           "bg-yellow-100 text-yellow-800",
  "Défenseur central": "bg-blue-100 text-blue-800",
  "Latéral droit":     "bg-blue-100 text-blue-800",
  "Latéral gauche":    "bg-blue-100 text-blue-800",
  "Milieu défensif":   "bg-green-100 text-green-800",
  "Milieu central":    "bg-green-100 text-green-800",
  "Milieu offensif":   "bg-purple-100 text-purple-800",
  "Ailier droit":      "bg-orange-100 text-orange-800",
  "Ailier gauche":     "bg-orange-100 text-orange-800",
  "Attaquant":         "bg-red-100 text-red-800",
};

const POSTES = [
  "Gardien", "Défenseur central", "Latéral droit", "Latéral gauche",
  "Milieu défensif", "Milieu central", "Milieu offensif",
  "Ailier droit", "Ailier gauche", "Attaquant",
];

// ── Helpers UI ────────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function StatBox({ label, value, color = "bg-slate-50", textColor = "text-slate-900", src }) {
  if (value == null) return null;
  return (
    <div className={`${color} rounded-xl p-3 text-center`}>
      <div className={`font-bold text-lg ${textColor}`}>{value}</div>
      <div className="text-xs text-slate-500 leading-tight mt-0.5">{label}</div>
      {src && <div className="text-[9px] text-slate-300 mt-0.5">{src}</div>}
    </div>
  );
}

function SourceBadge({ sources = [] }) {
  if (!sources.length) return null;
  const colors = {
    "Transfermarkt": "bg-blue-100 text-blue-700",
    "TheSportsDB":   "bg-slate-100 text-slate-600",
    "BeSoccer":      "bg-emerald-100 text-emerald-700",
    "SofaScore":     "bg-purple-100 text-purple-700",
    "FotMob":        "bg-orange-100 text-orange-700",
  };
  return (
    <div className="flex flex-wrap gap-1">
      {sources.map(s => (
        <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors[s] || "bg-slate-100 text-slate-500"}`}>
          {s}
        </span>
      ))}
    </div>
  );
}

// ── Liens externes (toujours affichés, direct si dispo sinon recherche Google site:) ─
function ExternalLinks({ nom, tmUrl, bsUrl, sofaUrl }) {
  const links = playerExternalLinks({
    nom, transfermarkt_url: tmUrl, besoccer_url: bsUrl, sofascore_url: sofaUrl,
  });
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ label, url, direct }) => (
        <a key={label} href={url} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 font-medium transition-colors bg-white ${
            label === "Transfermarkt" ? "border-blue-200 text-blue-700 hover:bg-blue-50" :
            label === "BeSoccer"     ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" :
            label === "SofaScore"    ? "border-purple-200 text-purple-700 hover:bg-purple-50" :
                                       "border-orange-200 text-orange-700 hover:bg-orange-50"
          }`}>
          <ExternalLink className="w-3 h-3" />
          {label}
          {!direct && <span className="text-[9px] opacity-50">↗</span>}
        </a>
      ))}
    </div>
  );
}

// ── Fusion stats (SofaScore xG/avancé, FotMob titularisations, BeSoccer backup) ─
// Champs de stats pris EN BLOC depuis une seule source primaire (cohérence du
// périmètre : on ne mélange pas SofaScore/FotMob/BeSoccer champ par champ).
const STAT_FIELDS = [
  "matchs_joues", "titularisations", "minutes_jouees", "buts", "passes_decisives",
  "cartons_jaunes", "cartons_rouges", "note_moyenne",
  "xg", "xa", "xg_hors_penalty", "xgot", "tirs", "tirs_cadres", "tirs_cadres_pct",
  "grandes_chances", "grandes_chances_manquees", "penaltys_marques",
  "passes_reussies", "passes_reussies_pct", "passes_cles", "passes_longues", "passes_longues_pct",
  "centres", "centres_reussis_pct",
  "dribbles_reussis", "dribbles_tentes", "dribbles_pct", "dribbles_subis",
  "touches_balle", "touches_surface_adverse", "pertes_balle",
  "duels_gagnes", "duels_gagnes_pct", "duels_aeriens_pct",
  "actions_defensives", "tacles", "interceptions", "degagements", "recuperations",
  "buts_encaisses_terrain", "xg_concede_terrain",
  "fautes_commises", "fautes_subies", "hors_jeu",
  "arrets", "buts_encaisses", "clean_sheets",
];
const statSourceHasData = (s) =>
  !!s && (s.matchs_joues != null || s.buts != null || s.minutes_jouees != null);

function mergeStats(ss, fm, bs) {
  if (!ss && !fm && !bs) return null;

  // Normaliser la note FotMob vers le champ commun.
  if (fm && fm.note_moyenne == null && fm.note_fotmob != null) fm.note_moyenne = fm.note_fotmob;

  // Source primaire unique : SofaScore (riche), sinon FotMob, sinon BeSoccer.
  const primary = statSourceHasData(ss) ? ss
                : statSourceHasData(fm) ? fm
                : statSourceHasData(bs) ? bs : null;
  const primaryName = primary === ss ? "SofaScore"
                    : primary === fm ? "FotMob"
                    : primary === bs ? "BeSoccer" : null;

  const out = {};
  if (primary) for (const k of STAT_FIELDS) out[k] = primary[k] ?? null;

  // Métadonnées propres à chaque source (indépendantes du périmètre stats).
  out.besoccer_elo = bs?.besoccer_elo ?? null;
  out.sofascore_id = ss?.sofascore_id ?? null;
  out.fotmob_id    = fm?.fotmob_id    ?? null;
  out.saison       = primary?.saison  ?? null;        // périmètre affiché à l'utilisateur
  out.sources      = primaryName ? [primaryName] : [];
  return out;
}

// ── Fusion infos perso (Transfermarkt prioritaire, TDB/BS en fallback) ────────
function mergePersonal(tm, tdb, bs, candidate) {
  // tm  = Transfermarkt  (principal)
  // bs  = BeSoccer       (complément : ligue, ELO, lien)
  // ca  = candidat de recherche (FotMob ou TDB)
  const t = tm  || {};
  const d = tdb || {};
  const b = bs  || {};
  const c = candidate || {};

  const nom = t.nom || d.nom || b.nom || c.nom || "";

  return {
    nom,
    nom_complet:      t.nom           || d.nom_complet || d.nom || c.nom,
    age:              d.age           || null,
    date_naissance:   t.date_naissance || d.date_naissance || c.date_naissance,
    lieu_naissance:   t.lieu_naissance || null,
    nationalite:      t.nationalite   || d.nationalite   || b.nationalite || c.nationalite,
    nationalite_secondaire: b.nationalite_secondaire || null,
    taille:           t.taille        || d.taille        || b.taille,
    poids:            t.poids         || d.poids,
    pied_fort:        t.pied_fort     || d.pied_fort     || b.pied_fort,
    poste:            t.poste         || d.poste         || b.poste  || c.poste,
    numero_maillot:   b.numero_maillot || null,
    club_actuel:      t.club_actuel   || b.club_actuel   || d.club_actuel || c.club_actuel,
    ligue:            b.ligue         || null,
    // Valeur marchande : Transfermarkt est la référence absolue
    valeur_marchande: t.valeur_marchande || b.valeur_marchande,
    contrat_fin:      t.contrat_fin   || b.contrat_fin,
    agent:            t.agent         || null,
    transfermarkt_id: t.transfermarkt_id || null,
    besoccer_id:      b.besoccer_id   || null,
    // Photo : on GARDE celle vue/sélectionnée dans la recherche (candidat),
    // car TM/BeSoccer peuvent renvoyer un autre joueur ou un mauvais portrait.
    photo_url:        c.photo_url     || t.photo_url  || b.photo_url,
    // Liens
    transfermarkt_url:  t.transfermarkt_url || null,
    besoccer_url:       b.besoccer_url      || null,
    sofascore_url:      null,
    sources_perso: [tm && "Transfermarkt", bs && "BeSoccer"].filter(Boolean),
  };
}

// ═════════════════════════════════════════════════════════════════════════════

export default function PlayerSearchPage() {
  const [query, setQuery]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [candidates, setCandidates]   = useState(null);
  const [searchSource, setSearchSource] = useState(null);   // source qui a trouvé les candidats
  const [result, setResult]           = useState(null);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState(null);
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  // ── Recherche de candidats multi-sources (chaîne de fallback) ───────────────
  // FotMob couvre surtout les grands championnats ; quand il ne renvoie rien
  // (jeunes, divisions inférieures, orthographe différente), on enchaîne
  // automatiquement sur BeSoccer (large index) puis Transfermarkt.
  // Chaque source est défensive : un échec réseau renvoie [] sans casser la chaîne.
  const searchCandidates = async (q) => {
    // 1. FotMob
    try {
      const body = await invokeFn("fotmobProxy", { action: "searchPlayer", query: q });
      const list = Array.isArray(body?.players) ? body.players : [];
      if (list.length) return { list, source: "FotMob" };
    } catch { /* on tente la source suivante */ }

    // 2. BeSoccer — meilleur index pour les joueurs peu connus
    try {
      const body = await invokeFn("besoccerProxy", { action: "searchPlayer", query: q });
      const list = Array.isArray(body?.players) ? body.players : [];
      if (list.length) return { list, source: "BeSoccer" };
    } catch { /* on tente la source suivante */ }

    // 3. Transfermarkt — ne renvoie qu'un profil → 1 candidat
    try {
      const body = await invokeFn("transfermarktProxy", { action: "searchAndGet", query: q });
      const p = body?.ok ? body.player : null;
      if (p?.nom) {
        return {
          list: [{
            nom:              p.nom,
            poste:            p.poste ?? null,
            nationalite:      p.nationalite ?? null,
            club_actuel:      p.club_actuel ?? null,
            photo_url:        p.photo_url ?? null,
            date_naissance:   p.date_naissance ?? null,
            transfermarkt_id: p.transfermarkt_id ?? null,
          }],
          source: "Transfermarkt",
        };
      }
    } catch { /* on tente la source suivante */ }

    // 4. Soccerdonna — football FÉMININ (les sources ci-dessus n'ont pas les joueuses)
    try {
      const body = await invokeFn("soccerdonnaProxy", { action: "searchAndGet", query: q });
      const p = body?.ok ? body.player : null;
      if (p?.nom) {
        // Candidat riche : la fiche soccerdonna porte déjà toutes les infos perso.
        return {
          list: [{
            nom:            p.nom,
            poste:          p.poste ?? null,
            nationalite:    p.nationalite ?? null,
            club_actuel:    p.club_actuel ?? null,
            photo_url:      p.photo_url ?? null,
            date_naissance: p.date_naissance ?? null,
            taille:         p.taille ?? null,
            pied_fort:      p.pied_fort ?? null,
            valeur_marchande: p.valeur_marchande ?? null,
            contrat_fin:    p.contrat_fin ?? null,
            soccerdonna_id: p.soccerdonna_id ?? null,
            sexe:           "Féminin",
            _soccerdonna:   true,
          }],
          source: "Soccerdonna",
        };
      }
    } catch { /* aucune source n'a abouti */ }

    return { list: [], source: null };
  };

  // ── 1. Recherche (FotMob → BeSoccer → Transfermarkt) ───────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setCandidates(null);
    setSearchSource(null);
    setSaved(false);
    setError(null);

    const cacheKey = `search:${normalizeQuery(query)}`;
    const cached   = getCache(cacheKey);

    // Cache frais → résultat instantané, pas d'appel réseau
    if (cached?.fresh && Array.isArray(cached.data) && cached.data.length > 0) {
      const list = cached.data;
      setLoading(false);
      if (list.length === 1) fetchFullProfile(list[0]);
      else                   setCandidates(list);
      return;
    }

    try {
      const { list, source } = await searchCandidates(query.trim());

      if (list.length === 0) {
        // Toutes les sources vides → on ressert le cache périmé s'il existe
        if (cached?.data?.length) {
          setLoading(false);
          cached.data.length === 1 ? fetchFullProfile(cached.data[0]) : setCandidates(cached.data);
          return;
        }
        setError(`Aucun joueur trouvé pour "${query}" sur FotMob, BeSoccer ni Transfermarkt. Essayez le nom complet sans accents, ou un seul nom de famille.`);
        setLoading(false);
        return;
      }

      setCache(cacheKey, list);
      setSearchSource(source);
      if (list.length === 1) { setLoading(false); fetchFullProfile(list[0]); }
      else                   { setCandidates(list); setLoading(false); }
    } catch (err) {
      // Échec global → fallback sur le cache périmé si disponible
      if (cached?.data?.length) {
        setLoading(false);
        cached.data.length === 1 ? fetchFullProfile(cached.data[0]) : setCandidates(cached.data);
        return;
      }
      setError("Erreur de recherche : " + (err?.message || "connexion impossible."));
      setLoading(false);
    }
  };

  // ── 2. Profil : TM (principal) + BS + FM stats + SS stats en parallèle ─
  const fetchFullProfile = async (candidate) => {
    setLoadingFull(true);
    setCandidates(null);

    // Joueuse trouvée sur Soccerdonna : la fiche porte déjà toutes les infos
    // perso ; les sources masculines ne l'ont pas → on l'utilise directement.
    if (candidate._soccerdonna) {
      setResult({ ...candidate, stats_saison: null, sources_perso: ["Soccerdonna"] });
      setLoadingFull(false);
      return;
    }

    const profileKey = `profile:${candidate.fotmob_id || normalizeQuery(candidate.nom)}`;
    const cachedProfile = getCache(profileKey);

    // Cache frais → affichage instantané du profil
    if (cachedProfile?.fresh && cachedProfile.data) {
      setResult(cachedProfile.data);
      setLoadingFull(false);
      return;
    }

    try {
      const nom  = candidate.nom;
      const club = candidate.club_actuel;

      const [tm, bs, fmS, ssS] = await Promise.allSettled([
        // Transfermarkt — infos perso + stats
        invokeFn("transfermarktProxy", { action: "searchAndGet", query: nom }),
        // BeSoccer — lien profil + ELO + stats
        invokeFn("besoccerProxy", { action: "searchAndGetPlayer", query: nom }),
        // FotMob — stats (recherche par nom)
        invokeFn("fotmobProxy", { action: "searchAndGetStats", query: nom, club }),
        // SofaScore — stats avancées xG/xA (best effort)
        invokeFn("sofascoreProxy", { action: "searchAndGetStats", query: nom, club }),
      ]);

      const tmV = tm.status  === "fulfilled" ? tm.value  : null;
      const bsV = bs.status  === "fulfilled" ? bs.value  : null;
      const fmV = fmS.status === "fulfilled" ? fmS.value : null;
      const ssV = ssS.status === "fulfilled" ? ssS.value : null;

      const tmData  = tmV?.ok ? tmV.player : null;
      const bsData  = bsV?.ok ? bsV.player : null;
      const fmStats = fmV?.ok ? fmV.stats  : null;
      const ssStats = ssV?.ok ? ssV.stats  : null;

      const personal = mergePersonal(tmData, null, bsData, candidate);
      const stats    = mergeStats(ssStats, fmStats, bsData);

      // Poste : TM/BeSoccer prioritaires, sinon FotMob (fiable depuis le cloud)
      if (!personal.poste && fmStats?.poste) personal.poste = fmStats.poste;
      // Compléments FotMob si infos perso vides (TM/BeSoccer bloqués)
      if (!personal.nom            && fmStats?.nom)            personal.nom = fmStats.nom;
      if (!personal.date_naissance && fmStats?.date_naissance) personal.date_naissance = fmStats.date_naissance;
      if (!personal.club_actuel    && fmStats?.club_actuel)    personal.club_actuel = fmStats.club_actuel;

      const full = { ...personal, stats_saison: stats };
      // On ne met en cache que si on a obtenu des données exploitables
      if (personal.poste || stats) setCache(profileKey, full);
      setResult(full);
    } catch (err) {
      // Toutes les sources ont échoué → cache périmé en dernier recours
      if (cachedProfile?.data) {
        setResult(cachedProfile.data);
      } else {
        setResult({ nom: candidate.nom, club_actuel: candidate.club_actuel, photo_url: candidate.photo_url, stats_saison: null, sources_perso: [] });
      }
    } finally {
      setLoadingFull(false);
    }
  };

  // Permet à l'utilisateur de corriger/renseigner le poste si manquant
  const setPoste = (poste) => setResult(r => ({ ...r, poste }));

  // ── 3. Sauvegarder ────────────────────────────────────────────────────────
  const handleSaveToApp = async () => {
    if (!result) return;
    // Le poste est requis par l'entité Player — on guide l'utilisateur au lieu de planter
    if (!result.poste) {
      setError("Le poste n'a pas été trouvé automatiquement. Sélectionnez-le ci-dessous avant d'ajouter le joueur.");
      return;
    }
    setSaving(true);
    setError(null);
    const s = result.stats_saison;
    try {
      const raw = {
        nom:              cleanPlayerName(result.nom || query),
        age:              result.age,
        date_naissance:   result.date_naissance,
        lieu_naissance:   result.lieu_naissance,
        nationalite:      result.nationalite,
        poste:            result.poste,
        photo_url:        result.photo_url,
        club_actuel:      result.club_actuel,
        ligue:            result.ligue,
        taille:           result.taille,
        poids:            result.poids,
        pied_fort:        result.pied_fort,
        contrat_fin:      result.contrat_fin,
        valeur_marchande: result.valeur_marchande,
        numero_maillot:   result.numero_maillot,
        agent:            result.agent,
        sexe:             result.sexe,
        soccerdonna_id:   result.soccerdonna_id,
        transfermarkt_id: result.transfermarkt_id,
        sofascore_id:     s?.sofascore_id,
        fotmob_id:        s?.fotmob_id,
        besoccer_id:      result.besoccer_id,
        matchs_joues:     s?.matchs_joues,
        titularisations:  s?.titularisations,
        minutes_jouees:   s?.minutes_jouees,
        note_moyenne:     s?.note_moyenne,
        buts:             s?.buts,
        passes_decisives: s?.passes_decisives,
        xg:               s?.xg,
        xa:               s?.xa,
        xg_hors_penalty:  s?.xg_hors_penalty,
        xgot:             s?.xgot,
        tirs:             s?.tirs,
        tirs_cadres:      s?.tirs_cadres,
        tirs_cadres_pct:  s?.tirs_cadres_pct,
        grandes_chances:          s?.grandes_chances,
        grandes_chances_manquees: s?.grandes_chances_manquees,
        penaltys_marques: s?.penaltys_marques,
        passes_reussies:     s?.passes_reussies,
        passes_reussies_pct: s?.passes_reussies_pct,
        passes_cles:         s?.passes_cles,
        passes_longues:      s?.passes_longues,
        passes_longues_pct:  s?.passes_longues_pct,
        centres:             s?.centres,
        centres_reussis_pct: s?.centres_reussis_pct,
        dribbles_reussis: s?.dribbles_reussis,
        dribbles_tentes:  s?.dribbles_tentes,
        dribbles_pct:     s?.dribbles_pct,
        dribbles_subis:   s?.dribbles_subis,
        touches_balle:    s?.touches_balle,
        touches_surface_adverse: s?.touches_surface_adverse,
        pertes_balle:     s?.pertes_balle,
        duels_gagnes:      s?.duels_gagnes,
        duels_gagnes_pct:  s?.duels_gagnes_pct,
        duels_aeriens_pct: s?.duels_aeriens_pct,
        actions_defensives: s?.actions_defensives,
        tacles:           s?.tacles,
        interceptions:    s?.interceptions,
        degagements:      s?.degagements,
        recuperations:    s?.recuperations,
        buts_encaisses_terrain: s?.buts_encaisses_terrain,
        xg_concede_terrain:     s?.xg_concede_terrain,
        cartons_jaunes:   s?.cartons_jaunes,
        cartons_rouges:   s?.cartons_rouges,
        fautes_commises:  s?.fautes_commises,
        fautes_subies:    s?.fautes_subies,
        hors_jeu:         s?.hors_jeu,
        arrets:           s?.arrets,
        buts_encaisses:   s?.buts_encaisses,
        clean_sheets:     s?.clean_sheets,
      };
      const clean = Object.fromEntries(Object.entries(raw).filter(([, v]) => v != null && v !== ""));
      const created = await base44.entities.Player.create(withOrg(clean));
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setSaved(true);

      // Crée automatiquement le club du joueur s'il n'existe pas encore
      // (permet notamment d'avoir ses prochains matchs). Non bloquant.
      if (clean.club_actuel) {
        ensureClubForPlayer(clean.club_actuel)
          .then((c) => { if (c) queryClient.invalidateQueries({ queryKey: ["clubs"] }); })
          .catch(() => {});
      }

      // Photo manquante → recherche automatique en arrière-plan (non bloquant)
      if (!clean.photo_url) {
        invokeFn("fetchEntityPhoto", { type: "player", name: clean.nom, club: clean.club_actuel })
          .then((res) => {
            if (res?.photo_url) {
              base44.entities.Player.update(created.id, { photo_url: res.photo_url })
                .then(() => queryClient.invalidateQueries({ queryKey: ["players"] }))
                .catch(() => {});
            }
          })
          .catch(() => {});
      }

      setTimeout(() => navigate(createPageUrl("PlayerDetail") + `?id=${created.id}`), 800);
    } catch (err) {
      setError("Erreur lors de la sauvegarde : " + (err.message || "inconnue"));
    } finally {
      setSaving(false);
    }
  };

  const s = result?.stats_saison;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-7 h-7 text-green-500" /> Recherche Joueurs
          </h1>
          <div className="flex flex-wrap gap-1.5 mt-2 items-center text-[11px]">
            <span className="text-slate-400">Infos :</span>
            {["Transfermarkt","BeSoccer"].map(s => (
              <span key={s} className={`px-2 py-0.5 rounded-full font-medium ${
                s === "Transfermarkt" ? "bg-blue-100 text-blue-700" :
                "bg-emerald-100 text-emerald-700"}`}>{s}</span>
            ))}
            <span className="text-slate-400 ml-2">Stats :</span>
            {["FotMob","SofaScore","BeSoccer"].map(s => (
              <span key={s} className={`px-2 py-0.5 rounded-full font-medium ${
                s === "FotMob"    ? "bg-orange-100 text-orange-700" :
                s === "SofaScore" ? "bg-purple-100 text-purple-700" :
                "bg-emerald-100 text-emerald-700"}`}>{s}</span>
            ))}
          </div>
        </div>

        {/* Barre de recherche */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Ex: Cristiano Ronaldo, Kylian Mbappé, Noah Makanza…"
            className="flex-1 h-12 text-base shadow-sm" />
          <Button type="submit" disabled={loading} className="h-12 px-6 bg-green-600 hover:bg-green-700">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm space-y-2">
            <p>{error}</p>
            {query && (
              <ExternalLinks nom={query} />
            )}
          </div>
        )}

        {/* Loading recherche */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            <p className="text-slate-600 font-medium">Recherche en cours…</p>
          </div>
        )}

        {/* Candidats */}
        {candidates?.length > 0 && !result && !loadingFull && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-green-500" />
                {candidates.length} joueur{candidates.length > 1 ? "s" : ""} trouvé{candidates.length > 1 ? "s" : ""}
                {searchSource && <SourceBadge sources={[searchSource]} />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {candidates.map((c, i) => (
                <button key={c.fotmob_id || i} onClick={() => fetchFullProfile(c)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left group">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                    {c.photo_url
                      ? <img src={c.photo_url} alt={c.nom} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.target.style.display = "none"} />
                      : <User className="w-7 h-7 text-slate-400 m-auto mt-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 group-hover:text-green-700">{c.nom}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {c.poste        && <Badge className={`text-xs ${posteColors[c.poste] || "bg-slate-100 text-slate-700"}`}>{c.poste}</Badge>}
                      {c.nationalite  && <Badge variant="outline" className="text-xs">{c.nationalite}</Badge>}
                      {c.club_actuel  && <Badge className="bg-slate-800 text-white text-xs">{c.club_actuel}</Badge>}
                      {c.date_naissance && <Badge variant="outline" className="text-xs">{c.date_naissance?.slice(0,4)}</Badge>}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-green-500 flex-shrink-0" />
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Loading profil */}
        {loadingFull && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            <p className="text-slate-600 font-medium">Transfermarkt · BeSoccer · FotMob · SofaScore…</p>
          </div>
        )}

        {/* ── PROFIL COMPLET ── */}
        {result && (
          <div className="space-y-4">

            {/* Identité principale */}
            <Card className="overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-400" />
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  {/* Photo */}
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0 overflow-hidden">
                    {result.photo_url
                      ? <img src={result.photo_url} alt={result.nom} className="w-full h-full object-cover"
                          referrerPolicy="no-referrer" onError={e => e.target.style.display = "none"} />
                      : <User className="w-10 h-10 text-slate-400 m-auto mt-7" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">{result.nom_complet || result.nom}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.poste      && <Badge className={posteColors[result.poste] || "bg-slate-100 text-slate-700"}>{result.poste}</Badge>}
                      {result.nationalite && <Badge variant="outline">{result.nationalite}</Badge>}
                      {result.club_actuel && <Badge className="bg-slate-800 text-white">{result.club_actuel}</Badge>}
                      {result.ligue      && <Badge variant="outline" className="text-xs">{result.ligue}</Badge>}
                    </div>

                    {/* Sélecteur de poste si introuvable (champ requis) */}
                    {!result.poste && (
                      <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                        <span className="text-xs text-amber-700 font-medium">Poste à confirmer :</span>
                        <select
                          value=""
                          onChange={e => setPoste(e.target.value)}
                          className="text-xs border border-amber-300 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        >
                          <option value="" disabled>Choisir…</option>
                          {POSTES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    )}
                    {result.sources_perso?.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400">Sources infos :</span>
                        <SourceBadge sources={result.sources_perso} />
                      </div>
                    )}
                    {/* Liens externes — TOUJOURS affichés */}
                    <div className="mt-3">
                      <ExternalLinks
                        nom={result.nom}
                        tmUrl={result.transfermarkt_url}
                        bsUrl={result.besoccer_url}
                        sofaUrl={result.sofascore_url}
                        fmUrl={null}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveToApp} disabled={saving || saved}
                    className={`flex-shrink-0 ${saved ? "bg-green-600" : "bg-slate-900 hover:bg-slate-700"}`} size="sm">
                    {saved   ? <><Trophy className="w-4 h-4 mr-1" /> Sauvegardé</>
                     : saving ? <Loader2 className="w-4 h-4 animate-spin" />
                     : <><Plus className="w-4 h-4 mr-1" /> Ajouter</>}
                  </Button>
                </div>

                {/* Stats identité rapides */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                  <StatBox label="Âge"             value={result.age ? `${result.age} ans` : null} />
                  <StatBox label="Taille"           value={result.taille ? `${result.taille} cm` : null} />
                  <StatBox label="Poids"            value={result.poids  ? `${result.poids} kg`  : null} />
                  <StatBox label="Pied fort"        value={result.pied_fort} />
                  <StatBox label="Valeur marchande" value={result.valeur_marchande ? `${result.valeur_marchande} M€` : null}
                    color="bg-green-50" textColor="text-green-700"
                    src={result.sources_perso?.includes("Transfermarkt") ? "TM" : null} />
                  <StatBox label="ELO BeSoccer"     value={s?.besoccer_elo}
                    color="bg-emerald-50" textColor="text-emerald-700" src="BS" />
                </div>
              </CardContent>
            </Card>

            {/* Identité + Contrat */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" /> Identité
                    <SourceBadge sources={result.sources_perso || []} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label="Date de naissance" value={result.date_naissance} />
                  <InfoRow label="Lieu de naissance" value={result.lieu_naissance} />
                  <InfoRow label="Nationalité"       value={result.nationalite} />
                  <InfoRow label="Taille"            value={result.taille ? `${result.taille} cm` : null} />
                  <InfoRow label="Poids"             value={result.poids  ? `${result.poids} kg`  : null} />
                  <InfoRow label="Pied fort"         value={result.pied_fort} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-500" /> Club &amp; Contrat
                    <SourceBadge sources={result.sources_perso || []} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label="Club actuel"      value={result.club_actuel} />
                  <InfoRow label="Ligue"            value={result.ligue} />
                  <InfoRow label="Numéro maillot"   value={result.numero_maillot} />
                  <InfoRow label="Fin de contrat"   value={result.contrat_fin} />
                  <InfoRow label="Valeur marchande" value={result.valeur_marchande ? `${result.valeur_marchande} M€` : null} />
                  <InfoRow label="Agent"            value={result.agent} />
                </CardContent>
              </Card>
            </div>

            {/* Stats saison */}
            {s && (s.matchs_joues != null || s.buts != null) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-purple-500" />
                    Stats saison en cours
                    <SourceBadge sources={s.sources || []} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                    <StatBox label="Matchs"         value={s.matchs_joues}      src="FM" />
                    <StatBox label="Titularisat."    value={s.titularisations}   src="FM" />
                    <StatBox label="Minutes"         value={s.minutes_jouees}    src="FM" />
                    <StatBox label="Buts"            value={s.buts}              color="bg-green-50" textColor="text-green-700" src="FM" />
                    <StatBox label="Passes déc."     value={s.passes_decisives}  color="bg-blue-50"  textColor="text-blue-700" src="FM" />
                    <StatBox label="Cartons J."      value={s.cartons_jaunes}    color="bg-yellow-50" src="FM" />
                    <StatBox label="Note"            value={s.note_moyenne}      color="bg-indigo-50" textColor="text-indigo-700" src="SS" />
                  </div>
                  {(s.xg != null || s.tirs != null || s.passes_cles != null) && (
                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mt-2">
                      <StatBox label="xG"           value={s.xg}               color="bg-green-50" textColor="text-green-700" src="SS" />
                      <StatBox label="xA"           value={s.xa}               color="bg-blue-50"  textColor="text-blue-700" src="SS" />
                      <StatBox label="Tirs"         value={s.tirs}             src="SS" />
                      <StatBox label="Tirs cadrés"  value={s.tirs_cadres}      src="SS" />
                      <StatBox label="Passes clés"  value={s.passes_cles}      src="SS" />
                      <StatBox label="Dribbles"     value={s.dribbles_reussis} src="SS" />
                      <StatBox label="Tacles"       value={s.tacles}           src="SS" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Liens externes — rappel en bas de fiche */}
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Link className="w-4 h-4 text-slate-400" />
                  <p className="text-sm text-slate-500 font-medium">Infos manquantes ? Consultez directement :</p>
                </div>
                <ExternalLinks
                  nom={result.nom}
                  tmUrl={result.transfermarkt_url}
                  bsUrl={result.besoccer_url}
                  sofaUrl={result.sofascore_url}
                  fmUrl={null}
                />
              </CardContent>
            </Card>

            {/* CTA final */}
            <div className="flex justify-end pb-6">
              <Button onClick={handleSaveToApp} disabled={saving || saved}
                className={`${saved ? "bg-green-600" : "bg-slate-900 hover:bg-slate-700"} px-8`}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {saved
                  ? <><Trophy className="w-4 h-4 mr-2" /> Joueur ajouté <ArrowRight className="w-4 h-4 ml-2" /></>
                  : <><Plus className="w-4 h-4 mr-2" /> Ajouter aux joueurs</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
