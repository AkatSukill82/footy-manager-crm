import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, User, Trophy, BarChart2, Plus, ArrowRight,
  Building2, ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../lib/LanguageContext";

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

function InfoRow({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function StatBox({ label, value, color = "bg-slate-50", textColor = "text-slate-900", source }) {
  if (value == null) return null;
  return (
    <div className={`${color} rounded-xl p-3 text-center`}>
      <div className={`font-bold text-lg ${textColor}`}>{value}</div>
      <div className="text-xs text-slate-500 leading-tight mt-0.5">{label}</div>
      {source && <div className="text-[9px] text-slate-300 mt-0.5">{source}</div>}
    </div>
  );
}

function SourceBadge({ sources = [] }) {
  if (!sources.length) return null;
  const colors = {
    "SofaScore":     "bg-purple-100 text-purple-700",
    "FotMob":        "bg-orange-100 text-orange-700",
    "Transfermarkt": "bg-blue-100 text-blue-700",
    "BeSoccer":      "bg-emerald-100 text-emerald-700",
  };
  return (
    <div className="flex flex-wrap gap-1 ml-auto">
      {sources.map(s => (
        <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors[s] || "bg-slate-100 text-slate-500"}`}>
          {s}
        </span>
      ))}
    </div>
  );
}

// ── Fusion stats (SofaScore prioritaire, FotMob backup) ───────────────────────
function mergeStats(ss, fm) {
  if (!ss && !fm) return null;
  const a = ss || {};
  const b = fm || {};
  return {
    matchs_joues:     a.matchs_joues     ?? b.matchs_joues,
    titularisations:  b.titularisations  ?? null,
    minutes_jouees:   a.minutes_jouees   ?? b.minutes_jouees,
    buts:             a.buts             ?? b.buts,
    passes_decisives: a.passes_decisives ?? b.passes_decisives,
    cartons_jaunes:   a.cartons_jaunes   ?? b.cartons_jaunes,
    cartons_rouges:   a.cartons_rouges   ?? b.cartons_rouges,
    tirs:             a.tirs,
    tirs_cadres:      a.tirs_cadres,
    passes_cles:      a.passes_cles,
    dribbles_reussis: a.dribbles_reussis,
    tacles:           a.tacles,
    interceptions:    a.interceptions,
    xg:               a.xg,
    xa:               a.xa,
    note_moyenne:     a.note_moyenne     ?? b.note_fotmob,
    sources: [ss && "SofaScore", fm && "FotMob"].filter(Boolean),
  };
}

// ── Fusion infos perso (SofaScore principal, TM pour agent/valeur, BS pour lien/ELO) ─
function mergePersonal(ssInfo, tmData, bsData, candidate) {
  const ss = ssInfo   || {};
  const tm = tmData   || {};
  const bs = bsData   || {};
  const ca = candidate || {};

  return {
    nom:              ss.nom            || ca.nom,
    nom_complet:      ss.nom_complet    || ss.nom || ca.nom,
    age:              ss.age            || ca.age,
    date_naissance:   ss.date_naissance || tm.date_naissance,
    lieu_naissance:   tm.lieu_naissance || null,
    nationalite:      ss.nationalite    || ca.nationalite,
    nationalite_secondaire: null,
    taille:           ss.taille         || tm.taille,
    poids:            tm.poids          || null,
    pied_fort:        ss.pied_fort      || tm.pied_fort,
    poste:            ss.poste          || ca.poste,
    numero_maillot:   ss.numero_maillot || ca.numero_maillot,
    club_actuel:      ss.club_actuel    || ca.club_actuel,
    ligue:            bs.ligue          || null,
    // Valeur marchande: TM prioritaire (leur spécialité), sinon SofaScore
    valeur_marchande: tm.valeur_marchande || ss.valeur_marchande || bs.valeur_marchande,
    contrat_fin:      ss.contrat_fin    || bs.contrat_fin || tm.contrat_fin,
    agent:            tm.agent          || null,
    transfermarkt_id: tm.transfermarkt_id || null,
    photo_url:        ss.photo_url      || bs.photo_url || ca.photo_url,
    // Liens externes
    sofascore_url:       ss.sofascore_url || null,
    besoccer_url:        bs.besoccer_url  || null,
    transfermarkt_url:   tm.transfermarkt_url || null,
    transfermarkt_search_url: `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(ss.nom || ca.nom || "")}`,
    besoccer_elo:     bs.besoccer_elo   || null,
    sofascore_id:     ss.sofascore_id   || String(ca.sofascore_id || ""),
    sources: [ssInfo && "SofaScore", tmData && "Transfermarkt", bsData && "BeSoccer"].filter(Boolean),
  };
}

export default function PlayerSearchPage() {
  const [query, setQuery]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [candidates, setCandidates] = useState(null);
  const [result, setResult]         = useState(null);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState(null);
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  // ── 1. Recherche via SofaScore (JSON API — fiable depuis cloud) ────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setCandidates(null);
    setSaved(false);
    setError(null);

    try {
      const res = await base44.functions.invoke("sofascoreProxy", {
        action: "searchPlayer",
        query:  query.trim(),
      });
      const list = res?.players || [];
      if (list.length === 0) {
        setError(`Aucun joueur trouvé pour "${query}".`);
        setLoading(false);
        return;
      }
      if (list.length === 1) {
        setLoading(false);
        fetchFullProfile(list[0]);
      } else {
        setCandidates(list);
        setLoading(false);
      }
    } catch (err) {
      setError("Erreur de recherche : " + (err?.message || "connexion impossible."));
      setLoading(false);
    }
  };

  // ── 2. Profil : SofaScore (perso + stats) + TM + BeSoccer en parallèle ────
  const fetchFullProfile = async (candidate) => {
    setLoadingFull(true);
    setCandidates(null);
    setLoadingStatus("SofaScore · Transfermarkt · FotMob · BeSoccer…");

    try {
      const ssId = candidate.sofascore_id;
      const nom  = candidate.nom;
      const club = candidate.club_actuel;

      const [ssInfoRes, ssStatsRes, fmRes, tmRes, bsRes] = await Promise.allSettled([
        // SofaScore infos perso (fiable)
        base44.functions.invoke("sofascoreProxy", {
          action:       "getPersonalInfo",
          sofascore_id: ssId,
        }),
        // SofaScore stats (fiable)
        base44.functions.invoke("sofascoreProxy", {
          action:       "getStats",
          sofascore_id: ssId,
        }),
        // FotMob stats (backup + titularisations)
        base44.functions.invoke("fotmobProxy", {
          action: "searchAndGetStats",
          query:  nom,
          club,
        }),
        // Transfermarkt (valeur marchande, agent — best effort)
        base44.functions.invoke("transfermarktProxy", {
          action: "searchAndGet",
          query:  nom,
        }),
        // BeSoccer (lien profil + ELO — best effort)
        base44.functions.invoke("besoccerProxy", {
          action: "searchAndGetPlayer",
          query:  nom,
        }),
      ]);

      const ssInfo  = ssInfoRes.status  === "fulfilled" && ssInfoRes.value?.ok  ? ssInfoRes.value.player  : null;
      const ssStats = ssStatsRes.status === "fulfilled" && ssStatsRes.value?.ok ? ssStatsRes.value.stats  : null;
      const fmStats = fmRes.status      === "fulfilled" && fmRes.value?.ok      ? fmRes.value.stats       : null;
      const tmData  = tmRes.status      === "fulfilled" && tmRes.value?.ok      ? tmRes.value.player      : null;
      const bsData  = bsRes.status      === "fulfilled" && bsRes.value?.ok      ? bsRes.value.player      : null;

      const personal = mergePersonal(ssInfo, tmData, bsData, candidate);
      const stats    = mergeStats(ssStats, fmStats);

      setResult({ ...personal, stats_saison: stats });
    } catch (err) {
      setResult({ ...candidate, stats_saison: null, sources: [] });
    } finally {
      setLoadingFull(false);
      setLoadingStatus("");
    }
  };

  // ── 3. Sauvegarder ──────────────────────────────────────────────────────────
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
        sofascore_id:     result.sofascore_id,
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
      const cleanData = Object.fromEntries(Object.entries(raw).filter(([, v]) => v != null && v !== ""));
      const created = await base44.entities.Player.create(cleanData);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-7 h-7 text-green-500" />
            Recherche Joueurs
          </h1>
          <div className="flex flex-wrap gap-1.5 mt-2 items-center">
            <span className="text-[11px] text-slate-400">Infos :</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">SofaScore</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Transfermarkt</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">BeSoccer</span>
            <span className="text-[11px] text-slate-400 ml-2">Stats :</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">SofaScore</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">FotMob</span>
          </div>
        </div>

        {/* Recherche */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ex: Kylian Mbappé, Erling Haaland, Pedri…"
            className="flex-1 h-12 text-base shadow-sm"
          />
          <Button type="submit" disabled={loading} className="h-12 px-6 bg-green-600 hover:bg-green-700">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            <p className="text-slate-600 font-medium">Recherche sur SofaScore…</p>
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
                <button key={c.sofascore_id || i} onClick={() => fetchFullProfile(c)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left group">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                    {c.photo_url
                      ? <img src={c.photo_url} alt={c.nom} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.target.style.display = "none"} />
                      : <User className="w-7 h-7 text-slate-400 m-auto mt-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 group-hover:text-green-700">{c.nom}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {c.poste       && <Badge className={`text-xs ${posteColors[c.poste] || "bg-slate-100 text-slate-700"}`}>{c.poste}</Badge>}
                      {c.nationalite && <Badge variant="outline" className="text-xs">{c.nationalite}</Badge>}
                      {c.club_actuel && <Badge className="bg-slate-800 text-white text-xs">{c.club_actuel}</Badge>}
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
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            <p className="text-slate-600 font-medium">{loadingStatus}</p>
            <div className="flex gap-2">
              {["SofaScore", "Transfermarkt", "FotMob", "BeSoccer"].map(src => (
                <span key={src} className="text-xs px-2 py-1 bg-white rounded-full border border-slate-200 text-slate-500 animate-pulse">{src}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── PROFIL COMPLET ── */}
        {result && (
          <div className="space-y-4">

            {/* Carte identité */}
            <Card className="overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-400" />
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0 overflow-hidden">
                    {result.photo_url
                      ? <img src={result.photo_url} alt={result.nom} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.target.style.display = "none"} />
                      : <User className="w-10 h-10 text-slate-400 m-auto mt-7" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">{result.nom_complet || result.nom}</h2>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.poste       && <Badge className={posteColors[result.poste] || "bg-slate-100 text-slate-700"}>{result.poste}</Badge>}
                      {result.nationalite && <Badge variant="outline">{result.nationalite}</Badge>}
                      {result.club_actuel && <Badge className="bg-slate-800 text-white">{result.club_actuel}</Badge>}
                      {result.ligue       && <Badge variant="outline" className="text-xs">{result.ligue}</Badge>}
                      {result.besoccer_elo && <Badge className="bg-emerald-100 text-emerald-800 text-xs">ELO {result.besoccer_elo}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                      <span className="text-[10px] text-slate-400">Sources :</span>
                      <SourceBadge sources={result.sources || []} />
                    </div>
                    {/* Liens externes */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {result.besoccer_url && (
                        <a href={result.besoccer_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-100 transition-colors font-medium">
                          <ExternalLink className="w-3.5 h-3.5" /> BeSoccer
                        </a>
                      )}
                      {result.sofascore_url && (
                        <a href={result.sofascore_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-100 transition-colors font-medium">
                          <ExternalLink className="w-3.5 h-3.5" /> SofaScore
                        </a>
                      )}
                      {(result.transfermarkt_url || result.transfermarkt_search_url) && (
                        <a href={result.transfermarkt_url || result.transfermarkt_search_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors font-medium">
                          <ExternalLink className="w-3.5 h-3.5" /> Transfermarkt
                        </a>
                      )}
                    </div>
                  </div>
                  <Button onClick={handleSaveToApp} disabled={saving || saved}
                    className={`flex-shrink-0 ${saved ? "bg-green-600" : "bg-slate-900 hover:bg-slate-700"}`} size="sm">
                    {saved ? <><Trophy className="w-4 h-4 mr-1" /> Sauvegardé</> :
                      saving ? <Loader2 className="w-4 h-4 animate-spin" /> :
                        <><Plus className="w-4 h-4 mr-1" /> Ajouter</>}
                  </Button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                  <StatBox label="Âge"             value={result.age ? `${result.age} ans` : null} />
                  <StatBox label="Taille"           value={result.taille ? `${result.taille} cm` : null} />
                  <StatBox label="Poids"            value={result.poids  ? `${result.poids} kg`  : null} />
                  <StatBox label="Pied fort"        value={result.pied_fort} />
                  <StatBox label="Valeur marchande" value={result.valeur_marchande ? `${result.valeur_marchande} M€` : null} color="bg-green-50" textColor="text-green-700"
                    source={result.sources?.includes("Transfermarkt") ? "TM" : "SofaScore"} />
                  <StatBox label="ELO BeSoccer"     value={result.besoccer_elo} color="bg-emerald-50" textColor="text-emerald-700" source="BeSoccer" />
                </div>
              </CardContent>
            </Card>

            {/* Identité + Contrat */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" /> Identité
                    <SourceBadge sources={["SofaScore"]} />
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
                    <SourceBadge sources={result.sources?.filter(s => ["SofaScore","Transfermarkt","BeSoccer"].includes(s)) || []} />
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
            {s && (
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
                    <StatBox label="Matchs"          value={s.matchs_joues}      source="SS" />
                    <StatBox label="Titularisations"  value={s.titularisations}   source="FM" />
                    <StatBox label="Minutes"          value={s.minutes_jouees}    source="SS" />
                    <StatBox label="Buts"             value={s.buts}              color="bg-green-50" textColor="text-green-700" source="SS" />
                    <StatBox label="Passes déc."      value={s.passes_decisives}  color="bg-blue-50"  textColor="text-blue-700"  source="SS" />
                    <StatBox label="Cartons J."       value={s.cartons_jaunes}    color="bg-yellow-50" source="SS" />
                    <StatBox label="Note"             value={s.note_moyenne}      color="bg-indigo-50" textColor="text-indigo-700" source="SS" />
                  </div>
                  {(s.xg != null || s.tirs != null || s.passes_cles != null) && (
                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mt-2">
                      <StatBox label="xG"             value={s.xg}               color="bg-green-50" textColor="text-green-700" source="SS" />
                      <StatBox label="xA"             value={s.xa}               color="bg-blue-50"  textColor="text-blue-700"  source="SS" />
                      <StatBox label="Tirs"           value={s.tirs}             source="SS" />
                      <StatBox label="Tirs cadrés"    value={s.tirs_cadres}      source="SS" />
                      <StatBox label="Passes clés"    value={s.passes_cles}      source="SS" />
                      <StatBox label="Dribbles"       value={s.dribbles_reussis} source="SS" />
                      <StatBox label="Tacles"         value={s.tacles}           source="SS" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* CTA final */}
            <div className="flex justify-end pb-6 gap-3">
              {result.besoccer_url && (
                <a href={result.besoccer_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    <ExternalLink className="w-4 h-4 mr-2" /> BeSoccer
                  </Button>
                </a>
              )}
              {(result.transfermarkt_url || result.transfermarkt_search_url) && (
                <a href={result.transfermarkt_url || result.transfermarkt_search_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    <ExternalLink className="w-4 h-4 mr-2" /> Transfermarkt
                  </Button>
                </a>
              )}
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
