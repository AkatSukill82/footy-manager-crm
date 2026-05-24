import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, User, MapPin, TrendingUp,
  Trophy, Plus, ArrowRight, BarChart2,
  Activity, Globe, Star, Building2
} from "lucide-react";
import TransfermarktImage from "../ui/TransfermarktImage";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useQueryClient } from "@tanstack/react-query";
import TransfermarktAPI from "../../api/transfermarkt";

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

// Normalize candidate from TM search result
function normalizeCandidate(raw) {
  return {
    id:             raw.id,
    nom:            raw.name || raw.nom || '',
    club:           (typeof raw.club === 'object' ? raw.club?.name : raw.club) || '',
    poste:          TransfermarktAPI.mapPosition(
                      typeof raw.position === 'object' ? raw.position?.main : raw.position
                    ),
    nationalite:    Array.isArray(raw.nationality) ? raw.nationality[0] : (raw.nationality || ''),
    age:            raw.age || null,
    valeur_marchande: raw.marketValue ? TransfermarktAPI.toMillion(raw.marketValue) : null,
    photo_url:      raw.imageUrl || raw.photo_url || '',
  };
}

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

  // ── Step 1: Search via real TM API ───────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setCandidates(null);
    setSaved(false);
    setError(null);

    try {
      const data = await TransfermarktAPI.searchPlayers(query.trim());
      const players = (data?.players || []).map(normalizeCandidate);

      if (players.length === 0) {
        setError(`Aucun joueur trouvé pour "${query}". Vérifiez l'orthographe.`);
        return;
      }
      if (players.length === 1) {
        await fetchFullProfile(players[0]);
      } else {
        setCandidates(players);
      }
    } catch (err) {
      setError(`Erreur de recherche : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Full profile from real TM API ────────────────────────────────
  const fetchFullProfile = async (candidate) => {
    setLoadingFull(true);
    setResult(null);
    setCandidates(null);
    setError(null);

    try {
      setLoadingStatus("Chargement du profil Transfermarkt…");
      const { profile, stats, marketValue, transfers } =
        await TransfermarktAPI.getFullPlayerData(candidate.id);

      if (!profile) throw new Error("Profil introuvable sur Transfermarkt.");

      const crmData = TransfermarktAPI.buildCRMPlayer(profile, stats, marketValue, transfers);

      // Optional LLM enrichment for scout text only (style, forces, faiblesses, palmares)
      setLoadingStatus("Analyse profil scout…");
      try {
        const scoutData = await base44.integrations.Core.InvokeLLM({
          prompt: `Profil scout pour ${profile.name}${profile.club?.name ? ` (${profile.club.name})` : ""}.
Réponds uniquement avec ces champs (null si inconnu, NE PAS inventer de stats) :
- style_jeu : style de jeu caractéristique (2-3 phrases)
- forces : points forts principaux (1-2 phrases)
- faiblesses : points faibles (1-2 phrases)
- palmares : liste des titres remportés (seulement si tu es certain)
- distinctions : distinctions individuelles
- note_globale_scout : note /100 (appréciation globale)
- selection_nationale : { equipe, matchs, buts, passes, premiere_selection } si sélectionné`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              style_jeu:          { type: "string" },
              forces:             { type: "string" },
              faiblesses:         { type: "string" },
              palmares:           { type: "array", items: { type: "string" } },
              distinctions:       { type: "string" },
              note_globale_scout: { type: "number" },
              selection_nationale: {
                type: "object",
                properties: {
                  equipe:              { type: "string" },
                  matchs:              { type: "number" },
                  buts:                { type: "number" },
                  passes:              { type: "number" },
                  premiere_selection:  { type: "string" },
                },
              },
            },
          },
        });
        if (scoutData) {
          Object.assign(crmData, {
            style_jeu:          scoutData.style_jeu          || null,
            forces:             scoutData.forces             || null,
            faiblesses:         scoutData.faiblesses         || null,
            palmares:           scoutData.palmares           || null,
            distinctions:       scoutData.distinctions       || null,
            note_globale_scout: scoutData.note_globale_scout || null,
            selection_nationale: scoutData.selection_nationale || null,
          });
        }
      } catch (_) { /* scout enrichment is optional */ }

      setResult(crmData);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement du profil.");
    } finally {
      setLoadingFull(false);
      setLoadingStatus("");
    }
  };

  // ── Step 3: Save player + club to DB ─────────────────────────────────────
  const handleSaveToApp = async () => {
    if (!result) return;
    setSaving(true);

    try {
      // Auto-create club if needed
      if (result.club_actuel) {
        const existingClubs = await base44.entities.Club.filter({ nom: result.club_actuel });
        if (!existingClubs || existingClubs.length === 0) {
          let clubData = {
            nom:  result.club_actuel,
            pays: result.pays_ligue || '',
            ligue: result.ligue    || '',
          };
          try {
            const clubInfo = await base44.integrations.Core.InvokeLLM({
              prompt: `Données du club "${result.club_actuel}" (${result.ligue || ''}, ${result.pays_ligue || ''}). Retourne stade, capacité, président, entraîneur, logo URL, site web. Si inconnu = null.`,
              add_context_from_internet: true,
              response_json_schema: {
                type: "object",
                properties: {
                  ville:            { type: "string" },
                  stade:            { type: "string" },
                  capacite_stade:   { type: "number" },
                  annee_fondation:  { type: "number" },
                  president:        { type: "string" },
                  entraineur:       { type: "string" },
                  directeur_sportif: { type: "string" },
                  logo_url:         { type: "string" },
                  site_web:         { type: "string" },
                  email:            { type: "string" },
                  telephone:        { type: "string" },
                  valeur_effectif:  { type: "number" },
                  budget_transfert: { type: "number" },
                  palmares:         { type: "string" },
                },
              },
            });
            if (clubInfo) {
              Object.keys(clubInfo).forEach(k => {
                if (clubInfo[k] != null && clubInfo[k] !== '') clubData[k] = clubInfo[k];
              });
            }
          } catch (_) { /* club enrichment is optional */ }
          await base44.entities.Club.create(clubData);
          queryClient.invalidateQueries({ queryKey: ['clubs'] });
        }
      }

      const playerData = {
        nom:                  result.nom,
        age:                  result.age,
        date_naissance:       result.date_naissance,
        lieu_naissance:       result.lieu_naissance,
        nationalite:          result.nationalite,
        nationalite_secondaire: result.nationalite_secondaire,
        poste:                result.poste,
        poste_secondaire:     result.poste_secondaire,
        pied_fort:            result.pied_fort,
        taille:               result.taille,
        photo_url:            result.photo_url,
        club_actuel:          result.club_actuel,
        ligue:                result.ligue,
        pays_ligue:           result.pays_ligue,
        numero_maillot:       result.numero_maillot,
        contrat_fin:          result.contrat_fin,
        agent:                result.agent,
        transfermarkt_id:     result.transfermarkt_id,
        valeur_marchande:     result.valeur_marchande,
        valeur_marchande_peak: result.valeur_marchande_peak,
        matchs_joues:         result.matchs_joues,
        buts:                 result.buts,
        passes_decisives:     result.passes_decisives,
        minutes_jouees:       result.minutes_jouees,
        cartons_jaunes:       result.cartons_jaunes,
        cartons_rouges:       result.cartons_rouges,
        style_jeu:            result.style_jeu,
        forces:               result.forces,
        faiblesses:           result.faiblesses,
        stats_resume:         result.description,
        note_globale_scout:   result.note_globale_scout,
        distinctions:         result.distinctions,
        palmares:             Array.isArray(result.palmares) ? result.palmares.join(", ") : result.palmares,
        matchs_international: result.selection_nationale?.matchs,
        buts_international:   result.selection_nationale?.buts,
        passes_international: result.selection_nationale?.passes,
        premier_match_selection: result.selection_nationale?.premiere_selection,
        nb_clubs:             result.historique_clubs?.length,
      };
      Object.keys(playerData).forEach(k =>
        (playerData[k] == null || playerData[k] === "") && delete playerData[k]
      );

      const created = await base44.entities.Player.create(playerData);

      // Save career history, market values, season stats in parallel
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
                .map(v => ({ player_id: created.id, date: v.date, valeur: v.valeur, source: "Transfermarkt" }))
            )
          : Promise.resolve(),

        result.stats_par_saison?.length > 0
          ? base44.entities.PlayerSeasonStats.bulkCreate(
              result.stats_par_saison.filter(s => s.saison).map(s => ({ player_id: created.id, ...s }))
            )
          : Promise.resolve(),
      ]);

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
        Données réelles via Transfermarkt · Profil scout enrichi par IA · Club créé automatiquement si absent
      </p>

      {/* Search bar */}
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

      {/* Loading search */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
          <p className="text-slate-600 font-medium">Recherche sur Transfermarkt…</p>
        </div>
      )}

      {/* Candidate selection */}
      {candidates && candidates.length > 0 && !result && !loadingFull && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-green-500" />
              {candidates.length} joueurs trouvés pour "{query}" — Lequel ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidates.map((c) => (
              <button
                key={c.id}
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
                    {c.age && <Badge variant="outline" className="text-xs">{c.age} ans</Badge>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {c.valeur_marchande != null && c.valeur_marchande > 0 && (
                    <p className="font-bold text-green-600 text-sm">{c.valeur_marchande} M€</p>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-green-500 mt-1 ml-auto" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Loading full profile */}
      {loadingFull && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          </div>
          <p className="text-slate-600 font-medium">{loadingStatus || "Chargement du profil…"}</p>
          <div className="flex flex-col items-center gap-1">
            {["Stats · Valeur marchande · Transferts…", "Historique carrière…", "Profil scout IA…"].map(t => (
              <p key={t} className="text-xs text-slate-400">{t}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── FULL PROFILE ── */}
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
                  {result.description && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3">{result.description}</p>
                  )}
                </div>
                <Button
                  onClick={handleSaveToApp}
                  disabled={saving || saved}
                  className={`flex-shrink-0 ${saved ? "bg-green-600" : "bg-slate-900 hover:bg-slate-700"}`}
                  size="sm"
                >
                  {saved
                    ? <><Trophy className="w-4 h-4 mr-1" /> Sauvegardé</>
                    : saving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Plus className="w-4 h-4 mr-1" /> Ajouter</>}
                </Button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                <StatBox label="Âge"      value={result.age ? `${result.age} ans` : null} />
                <StatBox label="Taille"   value={result.taille ? `${result.taille} cm` : null} />
                <StatBox label="Pied"     value={result.pied_fort} />
                <StatBox label="N° maillot" value={result.numero_maillot} />
                <StatBox label="Valeur"   value={result.valeur_marchande ? `${result.valeur_marchande} M€` : null} color="bg-green-50" textColor="text-green-700" />
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
                <InfoRow label="Pied fort" value={result.pied_fort} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-500" /> Contrat & Club
                  {result.club_actuel && (
                    <span className="text-xs text-green-600 font-normal ml-auto">→ club créé automatiquement</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label="Club actuel" value={result.club_actuel} />
                <InfoRow label="Ligue" value={result.ligue} />
                <InfoRow label="Pays" value={result.pays_ligue} />
                <InfoRow label="N° maillot" value={result.numero_maillot} />
                <InfoRow label="Fin contrat" value={result.contrat_fin} />
                <InfoRow label="Agent" value={result.agent} />
                <InfoRow label="ID Transfermarkt" value={result.transfermarkt_id} />
              </CardContent>
            </Card>
          </div>

          {s && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-purple-500" />
                  Stats saison {s.saison || "en cours"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <StatBox label="Matchs" value={s.matchs} />
                  <StatBox label="Minutes" value={s.minutes} />
                  <StatBox label="Buts" value={s.buts} color="bg-green-50" textColor="text-green-700" />
                  <StatBox label="Passes D." value={s.passes_decisives} color="bg-blue-50" textColor="text-blue-700" />
                  <StatBox label="Jaunes" value={s.cartons_jaunes} color="bg-yellow-50" />
                  <StatBox label="Rouges" value={s.cartons_rouges} color="bg-red-50" textColor="text-red-700" />
                </div>
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
                        <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
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

          <div className="grid md:grid-cols-2 gap-4">
            {result.selection_nationale && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" /> Sélection nationale
                  </CardTitle>
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

            {(result.style_jeu || result.forces || result.faiblesses) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> Profil scout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.style_jeu   && <div><p className="text-xs font-semibold text-slate-400 uppercase mb-1">Style de jeu</p><p className="text-sm text-slate-700">{result.style_jeu}</p></div>}
                  {result.forces      && <div><p className="text-xs font-semibold text-green-600 uppercase mb-1">Points forts</p><p className="text-sm text-slate-700">{result.forces}</p></div>}
                  {result.faiblesses  && <div><p className="text-xs font-semibold text-red-500 uppercase mb-1">Points faibles</p><p className="text-sm text-slate-700">{result.faiblesses}</p></div>}
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
          </div>

          {result.palmares?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> Palmarès
                </CardTitle>
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
              <p className="text-xs text-slate-400 self-center">
                Le club "{result.club_actuel}" sera créé automatiquement si absent
              </p>
            )}
            <Button
              onClick={handleSaveToApp}
              disabled={saving || saved}
              className={`${saved ? "bg-green-600" : "bg-slate-900 hover:bg-slate-700"} px-8`}
            >
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
