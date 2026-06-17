import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
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

// ── Liens externes (toujours affichés, direct si disponible, recherche sinon) ─
function ExternalLinks({ nom, tmUrl, bsUrl, sofaUrl, fmUrl }) {
  const q = encodeURIComponent(nom || "");
  const links = [
    {
      label: "Transfermarkt",
      url: tmUrl || `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${q}`,
      color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
      direct: !!tmUrl,
    },
    {
      label: "BeSoccer",
      url: bsUrl || `https://www.besoccer.com/search/${q}`,
      color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
      direct: !!bsUrl,
    },
    {
      label: "SofaScore",
      url: sofaUrl || `https://www.sofascore.com/search#query=${q}`,
      color: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
      direct: !!sofaUrl,
    },
    {
      label: "FotMob",
      url: fmUrl || `https://www.fotmob.com/search?q=${q}`,
      color: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100",
      direct: !!fmUrl,
    },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ label, url, color, direct }) => (
        <a key={label} href={url} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 font-medium transition-colors ${color}`}>
          <ExternalLink className="w-3 h-3" />
          {label}
          {!direct && <span className="text-[9px] opacity-50">recherche</span>}
        </a>
      ))}
    </div>
  );
}

// ── Fusion stats (SofaScore xG/avancé, FotMob titularisations, BeSoccer backup) ─
function mergeStats(ss, fm, bs) {
  if (!ss && !fm && !bs) return null;
  const a = ss || {};  // SofaScore
  const b = fm || {};  // FotMob
  const c = bs || {};  // BeSoccer (extrait de l'objet player BS)

  const bsMatchs = c.matchs_joues;
  const bsButs   = c.buts;
  const bsPasses = c.passes_decisives;

  return {
    matchs_joues:     a.matchs_joues     ?? b.matchs_joues     ?? bsMatchs,
    titularisations:  b.titularisations  ?? null,
    minutes_jouees:   a.minutes_jouees   ?? b.minutes_jouees   ?? c.minutes_jouees,
    buts:             a.buts             ?? b.buts             ?? bsButs,
    passes_decisives: a.passes_decisives ?? b.passes_decisives ?? bsPasses,
    cartons_jaunes:   a.cartons_jaunes   ?? b.cartons_jaunes   ?? c.cartons_jaunes,
    cartons_rouges:   a.cartons_rouges   ?? b.cartons_rouges   ?? c.cartons_rouges,
    // Stats avancées — SofaScore uniquement
    tirs:             a.tirs,
    tirs_cadres:      a.tirs_cadres,
    passes_cles:      a.passes_cles,
    dribbles_reussis: a.dribbles_reussis,
    tacles:           a.tacles,
    interceptions:    a.interceptions,
    xg:               a.xg,
    xa:               a.xa,
    note_moyenne:     a.note_moyenne     ?? b.note_fotmob,
    besoccer_elo:     c.besoccer_elo,
    sources: [ss && "SofaScore", fm && "FotMob", (bsMatchs || bsButs) && "BeSoccer"].filter(Boolean),
  };
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
    // Photo : TM prioritaire, puis BeSoccer CDN, puis candidat (FotMob CDN)
    photo_url:        t.photo_url     || b.photo_url  || c.photo_url,
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
  const [result, setResult]           = useState(null);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState(null);
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  // ── 1. Recherche via API-Football (clé API → fonctionne depuis cloud) ──────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setCandidates(null);
    setSaved(false);
    setError(null);

    try {
      const res = await base44.functions.invoke("apiFootballProxy", {
        action: "searchPlayer",
        name:   query.trim(),
      });

      const list = Array.isArray(res?.players) ? res.players : [];

      if (list.length === 0) {
        setError(`Aucun joueur trouvé pour "${query}". Essayez le nom en anglais sans accents.`);
        setLoading(false);
        return;
      }
      if (list.length === 1) { setLoading(false); fetchFullProfile(list[0]); }
      else                   { setCandidates(list); setLoading(false); }
    } catch (err) {
      setError("Erreur de recherche : " + (err?.message || "connexion impossible."));
      setLoading(false);
    }
  };

  // ── 2. Profil : TM (principal) + TDB + BS + FM stats + SS stats en parallèle ─
  const fetchFullProfile = async (candidate) => {
    setLoadingFull(true);
    setCandidates(null);

    try {
      const nom  = candidate.nom;
      const club = candidate.club_actuel;

      const [tmRes, bsRes, fmStatsRes, ssStatsRes] = await Promise.allSettled([
        // Transfermarkt — infos perso + stats
        base44.functions.invoke("transfermarktProxy", { action: "searchAndGet", query: nom }),
        // BeSoccer — lien profil + ELO + stats
        base44.functions.invoke("besoccerProxy", { action: "searchAndGetPlayer", query: nom }),
        // FotMob — stats (recherche par nom car IDs différents de AF)
        base44.functions.invoke("fotmobProxy", { action: "searchAndGetStats", query: nom, club }),
        // SofaScore — stats avancées xG/xA (best effort)
        base44.functions.invoke("sofascoreProxy", { action: "searchAndGetStats", query: nom, club }),
      ]);

      const tmData  = tmRes.status      === "fulfilled" && tmRes.value?.ok      ? tmRes.value.player  : null;
      const bsData  = bsRes.status      === "fulfilled" && bsRes.value?.ok      ? bsRes.value.player  : null;
      const fmStats = fmStatsRes.status === "fulfilled" && fmStatsRes.value?.ok ? fmStatsRes.value.stats : null;
      const ssStats = ssStatsRes.status === "fulfilled" && ssStatsRes.value?.ok ? ssStatsRes.value.stats : null;

      const personal = mergePersonal(tmData, null, bsData, candidate);
      const stats    = mergeStats(ssStats, fmStats, bsData);

      setResult({ ...personal, stats_saison: stats });
    } catch (err) {
      setResult({ nom: candidate.nom, club_actuel: candidate.club_actuel, photo_url: candidate.photo_url, stats_saison: null, sources_perso: [] });
    } finally {
      setLoadingFull(false);
    }
  };

  // ── 3. Sauvegarder ────────────────────────────────────────────────────────
  const handleSaveToApp = async () => {
    if (!result) return;
    setSaving(true);
    const s = result.stats_saison;
    try {
      const raw = {
        nom:              result.nom || query,
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
        transfermarkt_id: result.transfermarkt_id,
        matchs_joues:     s?.matchs_joues,
        titularisations:  s?.titularisations,
        minutes_jouees:   s?.minutes_jouees,
        buts:             s?.buts,
        passes_decisives: s?.passes_decisives,
        cartons_jaunes:   s?.cartons_jaunes,
        cartons_rouges:   s?.cartons_rouges,
        tirs:             s?.tirs,
        tirs_cadres:      s?.tirs_cadres,
        passes_cles:      s?.passes_cles,
        dribbles_reussis: s?.dribbles_reussis,
        tacles:           s?.tacles,
        interceptions:    s?.interceptions,
        xg:               s?.xg,
        xa:               s?.xa,
        note_moyenne:     s?.note_moyenne,
      };
      const clean = Object.fromEntries(Object.entries(raw).filter(([, v]) => v != null && v !== ""));
      const created = await base44.entities.Player.create(clean);
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setSaved(true);
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
