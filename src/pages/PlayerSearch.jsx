import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, User, MapPin, Calendar, TrendingUp,
  Ruler, Trophy, Target, BarChart2, Clock, Plus, ArrowRight,
  Activity, Shield, Zap, Heart, Globe, Star, Building2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { createPageUrl, sanitizePlayerData } from "../utils";
import { useQueryClient } from "@tanstack/react-query";
import TransfermarktSearch from "../components/players/TransfermarktSearch";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

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

export default function PlayerSearchPage() {
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

  // ── Recherche via API-Football ───────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setCandidates(null);
    setSaved(false);
    setError(null);

    try {
      const afRes = await base44.functions.invoke("apiFootballProxy", {
        action: "searchPlayer",
        name: query.trim(),
      });

      const list = afRes?.players || [];

      if (list.length === 0) {
        setError(`Aucun joueur trouvé pour "${query}" sur API-Football.`);
        setLoading(false);
        return;
      }

      if (list.length === 1) {
        setLoading(false);
        buildResult(list[0]);
      } else {
        setCandidates(list);
        setLoading(false);
      }
    } catch (err) {
      setError("Erreur de connexion à API-Football. Vérifiez votre connexion.");
      setLoading(false);
    }
  };

  // ── Construit l'objet résultat depuis un joueur API-Football ─────────────────
  const buildResult = (afPlayer) => {
    const s = afPlayer.stats_saison;
    setResult({
      nom:              afPlayer.nom,
      nom_complet:      [afPlayer.prenom, afPlayer.nom].filter(Boolean).join(' '),
      prenom:           afPlayer.prenom,
      age:              afPlayer.age,
      nationalite:      afPlayer.nationalite,
      photo_url:        afPlayer.photo_url || null,
      club_actuel:      afPlayer.club_actuel,
      ligue:            afPlayer.ligue,
      pays_ligue:       afPlayer.pays_ligue,
      poste:            afPlayer.poste,
      stats_saison:     s ? { ...s, source: "API-Football" } : null,
      historique_clubs: [],
      valeur_historique: [],
      stats_par_saison:  [],
    });
  };

  // ── Sélection d'un candidat ──────────────────────────────────────────────────
  const fetchFullProfile = async (candidate) => {
    buildResult(candidate);
  };

  // ── Sauvegarder joueur ────────────────────────────────────────────────────────
  const handleSaveToApp = async () => {
    if (!result) return;
    setSaving(true);
    const s = result.stats_saison;

    try {
      const playerData = {
        nom:              result.nom || query,
        age:              result.age,
        nationalite:      result.nationalite,
        poste:            result.poste,
        photo_url:        result.photo_url,
        club_actuel:      result.club_actuel,
        ligue:            result.ligue,
        pays_ligue:       result.pays_ligue,
        matchs_joues:     s?.matchs,
        titularisations:  s?.titulaire,
        minutes_jouees:   s?.minutes,
        buts:             s?.buts,
        passes_decisives: s?.passes_decisives,
        cartons_jaunes:   s?.cartons_jaunes,
        cartons_rouges:   s?.cartons_rouges,
        tirs:             s?.tirs,
        tirs_cadres:      s?.tirs_cadres,
        passes_cles:      s?.passes_cles,
        dribbles_reussis: s?.dribbles_reussis,
        interceptions:    s?.interceptions,
        tacles:           s?.tacles,
      };
      const created = await base44.entities.Player.create(sanitizePlayerData(playerData));

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-7 h-7 text-green-500" />
            Recherche Joueurs
          </h1>
          <p className="text-xs text-slate-500 mt-1">Recherche via API-Football — données officielles en temps réel.</p>
        </div>

        {/* Stub redirect notice */}
        <TransfermarktSearch />

        {/* Search */}
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

        {/* Erreur */}
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
            <p className="text-slate-600 font-medium">{t(lang, 'playerSearch.searching')}</p>
          </div>
        )}

        {/* Sélection candidat */}
        {candidates && candidates.length > 0 && !result && !loadingFull && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-green-500" />
                {candidates.length} joueur{candidates.length > 1 ? 's' : ''} trouvé{candidates.length > 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {candidates.map((c, i) => (
                <button
                  key={c.id || i}
                  onClick={() => fetchFullProfile(c)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl border border-slate-200 hover:border-green-400 hover:bg-green-50 transition-all text-left group"
                >
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                    {c.photo_url
                      ? <img src={c.photo_url} alt={c.nom} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={e => e.target.style.display = 'none'} />
                      : <User className="w-7 h-7 text-slate-400 m-auto mt-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 group-hover:text-green-700">{c.prenom} {c.nom}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {c.poste && <Badge className={`text-xs ${posteColors[c.poste] || "bg-slate-100 text-slate-700"}`}>{c.poste}</Badge>}
                      {c.nationalite && <Badge variant="outline" className="text-xs">{c.nationalite}</Badge>}
                      {c.club_actuel && <Badge className="bg-slate-800 text-white text-xs">{c.club_actuel}</Badge>}
                      {c.age && <Badge variant="outline" className="text-xs">{c.age} {t(lang, 'common.ageUnit')}</Badge>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
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
                  <StatBox label={t(lang,'playerDetail.age')} value={result.age ? `${result.age} ${t(lang,'common.ageUnit')}` : null} />
                  <StatBox label={t(lang,'playerSearch.height')} value={result.taille ? `${result.taille} cm` : null} />
                  <StatBox label={t(lang,'playerSearch.weight')} value={result.poids ? `${result.poids} kg` : null} />
                  <StatBox label={t(lang,'playerSearch.foot')} value={result.pied_fort} />
                  <StatBox label={t(lang,'playerSearch.marketValue')} value={result.valeur_marchande ? `${result.valeur_marchande} M€` : null} color="bg-green-50" textColor="text-green-700" />
                  <StatBox label={t(lang,'playerSearch.marketValuePeak')} value={result.valeur_marchande_peak ? `${result.valeur_marchande_peak} M€` : null} color="bg-emerald-50" textColor="text-emerald-700" />
                </div>
              </CardContent>
            </Card>

            {/* Identité + Contrat */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> {t(lang,'playerSearch.identity')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label={t(lang,'playerSearch.dob')} value={result.date_naissance} />
                  <InfoRow label={t(lang,'playerSearch.birthplace')} value={result.lieu_naissance} />
                  <InfoRow label={t(lang,'playerDetail.nationality')} value={result.nationalite} />
                  <InfoRow label={t(lang,'playerSearch.nationality2')} value={result.nationalite_secondaire} />
                  <InfoRow label={t(lang,'playerSearch.height')} value={result.taille ? `${result.taille} cm` : null} />
                  <InfoRow label={t(lang,'playerSearch.weight')} value={result.poids ? `${result.poids} kg` : null} />
                  <InfoRow label={t(lang,'playerSearch.foot')} value={result.pied_fort} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-500" /> {t(lang,'playerSearch.contractClub')}
                    {result.club_actuel && <span className="text-xs text-green-600 font-normal ml-auto">{t(lang,'playerSearch.autoClub')}</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <InfoRow label={t(lang,'playerSearch.currentClub')} value={result.club_actuel} />
                  <InfoRow label={t(lang,'playerSearch.league')} value={result.ligue} />
                  <InfoRow label={t(lang,'playerSearch.country')} value={result.pays_ligue} />
                  <InfoRow label={t(lang,'playerSearch.jerseyNum')} value={result.numero_maillot} />
                  <InfoRow label={t(lang,'playerSearch.contractEnd')} value={result.contrat_fin} />
                  <InfoRow label={t(lang,'playerSearch.annualSalary')} value={result.salaire_annuel ? `${result.salaire_annuel} M€` : null} />
                  <InfoRow label={t(lang,'playerSearch.weeklySalary')} value={result.salaire_semaine ? `${result.salaire_semaine} k€` : null} />
                  <InfoRow label={t(lang,'playerSearch.agent')} value={result.agent} />
                  <InfoRow label={t(lang,'playerSearch.coach')} value={result.coach} />
                  <InfoRow label={t(lang,'playerSearch.tmId')} value={result.transfermarkt_id} />
                  <InfoRow label={t(lang,'playerSearch.ssId')} value={result.sofascore_id} />
                </CardContent>
              </Card>
            </div>

            {/* Stats saison */}
            {s && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-purple-500" />
                    {t(lang,'playerSearch.statsSeason')} {s.saison || "2024/2025"}
                    {s.source && (
                      <span className={`ml-auto text-[10px] font-normal px-1.5 py-0.5 rounded-full ${s.source === "API-Football" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {s.source}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                    <StatBox label={t(lang,'playerSearch.matches')} value={s.matchs} />
                    <StatBox label={t(lang,'playerSearch.starter')} value={s.titulaire} />
                    <StatBox label={t(lang,'playerSearch.minutes')} value={s.minutes} />
                    <StatBox label={t(lang,'playerSearch.goals')} value={s.buts} color="bg-green-50" textColor="text-green-700" />
                    <StatBox label={t(lang,'playerSearch.assists')} value={s.passes_decisives} color="bg-blue-50" textColor="text-blue-700" />
                    <StatBox label={t(lang,'playerSearch.yellows')} value={s.cartons_jaunes} color="bg-yellow-50" />
                    <StatBox label={t(lang,'playerSearch.rating')} value={s.note_sofascore} color="bg-indigo-50" textColor="text-indigo-700" />
                  </div>
                  {(s.xg != null || s.tirs != null) && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                      <StatBox label="xG" value={s.xg} color="bg-green-50" textColor="text-green-700" />
                      <StatBox label="xA" value={s.xa} color="bg-blue-50" textColor="text-blue-700" />
                      <StatBox label={t(lang,'playerSearch.shots')} value={s.tirs} />
                      <StatBox label={t(lang,'playerSearch.shotsOnTarget')} value={s.tirs_cadres} />
                      <StatBox label={t(lang,'playerSearch.keyPasses')} value={s.passes_cles} />
                      <StatBox label={t(lang,'playerSearch.dribbles')} value={s.dribbles_reussis} />
                      <StatBox label={t(lang,'playerSearch.interceptions')} value={s.interceptions} />
                      <StatBox label={t(lang,'playerSearch.tackles')} value={s.tacles} />
                      <StatBox label={t(lang,'playerSearch.duelsPct')} value={s.duels_gagnes_pct != null ? `${s.duels_gagnes_pct}%` : null} />
                      <StatBox label={t(lang,'playerSearch.distance')} value={s.distance_course} />
                      <StatBox label={t(lang,'playerSearch.topSpeed')} value={s.vitesse_max ? `${s.vitesse_max} km/h` : null} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Évolution valeur marchande */}
            {result.valeur_historique?.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" /> {t(lang,'playerSearch.marketValueChart')}
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

            {/* Stats par saison */}
            {result.stats_par_saison?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-500" /> {t(lang,'playerSearch.seasonStats')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-400 border-b border-slate-100">
                          <th className="text-left pb-2 pr-3">{t(lang,'playerSearch.thSeason')}</th>
                          <th className="text-left pb-2 pr-3">{t(lang,'playerSearch.thCompetition')}</th>
                          <th className="text-center pb-2">{t(lang,'playerSearch.thApps')}</th>
                          <th className="text-center pb-2">{t(lang,'playerSearch.thMins')}</th>
                          <th className="text-center pb-2">{t(lang,'playerSearch.thGoals')}</th>
                          <th className="text-center pb-2">{t(lang,'playerSearch.thAssists')}</th>
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

            {/* Historique clubs */}
            {result.historique_clubs?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" /> {t(lang,'playerSearch.transferHistory')}
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

            {/* Sélection + Blessures + Carrière */}
            <div className="grid md:grid-cols-3 gap-4">
              {result.selection_nationale && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500" /> {t(lang,'playerSearch.national')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-slate-900 mb-2">{result.selection_nationale.equipe}</p>
                    <InfoRow label={t(lang,'playerSearch.matches')} value={result.selection_nationale.matchs} />
                    <InfoRow label={t(lang,'playerSearch.goals')} value={result.selection_nationale.buts} />
                    <InfoRow label={t(lang,'playerSearch.passesCareer')} value={result.selection_nationale.passes} />
                    <InfoRow label={t(lang,'playerSearch.firstCap')} value={result.selection_nationale.premiere_selection} />
                  </CardContent>
                </Card>
              )}
              {(result.blessures_total != null || result.jours_blesses != null) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> {t(lang,'playerSearch.injuries')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InfoRow label={t(lang,'playerSearch.injuryCount')} value={result.blessures_total} />
                    <InfoRow label={t(lang,'playerSearch.injuryDays')} value={result.jours_blesses} />
                    <InfoRow label={t(lang,'playerSearch.injuryTypes')} value={result.type_blessures} />
                  </CardContent>
                </Card>
              )}
              {(result.matchs_carriere != null || result.buts_carriere != null) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-slate-500" /> {t(lang,'playerSearch.career')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InfoRow label={t(lang,'playerSearch.matches')} value={result.matchs_carriere} />
                    <InfoRow label={t(lang,'playerSearch.goals')} value={result.buts_carriere} />
                    <InfoRow label={t(lang,'playerSearch.passesCareer')} value={result.passes_carriere} />
                    <InfoRow label={t(lang,'playerSearch.careerClubs')} value={result.historique_clubs?.length} />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Profil scout */}
            {(result.style_jeu || result.forces || result.faiblesses) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" /> {t(lang,'playerSearch.scoutProfile')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.style_jeu && <div><p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t(lang,'playerSearch.playStyle')}</p><p className="text-sm text-slate-700">{result.style_jeu}</p></div>}
                  {result.forces && <div><p className="text-xs font-semibold text-green-600 uppercase mb-1">{t(lang,'playerSearch.strengths')}</p><p className="text-sm text-slate-700">{result.forces}</p></div>}
                  {result.faiblesses && <div><p className="text-xs font-semibold text-red-500 uppercase mb-1">{t(lang,'playerSearch.weaknesses')}</p><p className="text-sm text-slate-700">{result.faiblesses}</p></div>}
                  {result.note_globale_scout != null && <div className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /><span className="font-bold text-lg">{result.note_globale_scout}/100</span><span className="text-xs text-slate-500">{t(lang,'playerSearch.scoutRating')}</span></div>}
                </CardContent>
              </Card>
            )}

            {/* Palmarès */}
            {result.palmares?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> {t(lang,'playerSearch.trophies')}</CardTitle>
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

            {/* CTA final */}
            <div className="flex justify-end pb-6 gap-3">
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
