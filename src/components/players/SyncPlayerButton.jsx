import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

// Champs de stats purs — appliqués automatiquement sans confirmation
const STATS_FIELDS = new Set([
  'matchs_joues', 'titularisations', 'minutes_jouees', 'buts', 'passes_decisives',
  'cartons_jaunes', 'cartons_rouges', 'tirs', 'tirs_cadres', 'passes_cles',
  'dribbles_reussis', 'dribbles_tentes', 'tacles', 'interceptions',
  'fautes_commises', 'fautes_subies', 'buts_encaisses', 'arrets',
  'penaltys_marques', 'club_actuel', 'ligue', 'pays_ligue', 'poste',
]);

const POS_MAP = {
  "Goalkeeper": "Gardien", "Goalie": "Gardien",
  "Center Back": "Défenseur central", "Centre Back": "Défenseur central",
  "Defender": "Défenseur central",
  "Right Back": "Latéral droit", "Left Back": "Latéral gauche",
  "Defensive Midfielder": "Milieu défensif",
  "Midfielder": "Milieu central", "Central Midfielder": "Milieu central",
  "Attacking Midfielder": "Milieu offensif",
  "Right Wing": "Ailier droit", "Right Winger": "Ailier droit",
  "Left Wing": "Ailier gauche", "Left Winger": "Ailier gauche",
  "Forward": "Attaquant", "Striker": "Attaquant", "Centre Forward": "Attaquant",
};

function mapPos(raw) {
  if (!raw) return null;
  return POS_MAP[raw] || null;
}

export default function SyncPlayerButton({ player, onApply }) {
  const { lang } = useLanguage();
  const [state, setState] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [autoApplied, setAutoApplied] = useState(false);

  async function fetchData() {
    const name = player.nom;
    const club = player.club_actuel;

    // Infos perso (BeSoccer) + stats (SofaScore + FotMob) en parallèle
    const [bsRes, ssRes, fmRes] = await Promise.allSettled([
      base44.functions.invoke("besoccerProxy", {
        action: "searchAndGetPlayer",
        query:  name,
      }),
      base44.functions.invoke("sofascoreProxy", {
        action: "searchAndGetStats",
        query:  name,
        club,
      }),
      base44.functions.invoke("fotmobProxy", {
        action: "searchAndGetStats",
        query:  name,
        club,
      }),
    ]);

    const bs = bsRes.status === "fulfilled" && bsRes.value?.ok ? bsRes.value.player : null;
    const ss = ssRes.status === "fulfilled" && ssRes.value?.ok ? ssRes.value.stats  : null;
    const fm = fmRes.status === "fulfilled" && fmRes.value?.ok ? fmRes.value.stats  : null;

    if (!bs && !ss && !fm) throw new Error("Aucune donnée trouvée (BeSoccer, SofaScore et FotMob ont échoué).");

    const sources = [bs && "BeSoccer", ss && "SofaScore", fm && "FotMob"].filter(Boolean);

    const flat: Record<string, any> = {
      // Infos perso depuis BeSoccer
      ...(bs ? {
        age:              bs.age,
        date_naissance:   bs.date_naissance,
        nationalite:      bs.nationalite,
        taille:           bs.taille,
        poids:            bs.poids,
        pied_fort:        bs.pied_fort,
        club_actuel:      bs.club_actuel,
        ligue:            bs.ligue,
        valeur_marchande: bs.valeur_marchande,
        contrat_fin:      bs.contrat_fin,
        photo_url:        bs.photo_url,
        numero_maillot:   bs.numero_maillot,
      } : {}),
      // Stats depuis SofaScore (prioritaire)
      matchs_joues:     ss?.matchs_joues     ?? fm?.matchs_joues,
      titularisations:  fm?.titularisations  ?? null,
      minutes_jouees:   ss?.minutes_jouees   ?? fm?.minutes_jouees,
      buts:             ss?.buts             ?? fm?.buts,
      passes_decisives: ss?.passes_decisives ?? fm?.passes_decisives,
      cartons_jaunes:   ss?.cartons_jaunes   ?? fm?.cartons_jaunes,
      cartons_rouges:   ss?.cartons_rouges   ?? fm?.cartons_rouges,
      tirs:             ss?.tirs,
      tirs_cadres:      ss?.tirs_cadres,
      passes_cles:      ss?.passes_cles,
      dribbles_reussis: ss?.dribbles_reussis,
      tacles:           ss?.tacles,
      interceptions:    ss?.interceptions,
      xg:               ss?.xg,
      xa:               ss?.xa,
      note_moyenne:     ss?.note_moyenne    ?? fm?.note_fotmob,
    };

    const toApply: Record<string, any> = {};
    Object.entries(flat).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "" && String(v) !== String(player[k] ?? "")) {
        toApply[k] = v;
      }
    });
    return { raw: flat, toApply, sources, fieldsFound: Object.keys(flat).length };
  }

  // Bouton 1 : actualiser les stats en 1 clic (auto-applique les champs stats)
  async function handleQuickStats() {
    setState("loading");
    setError(null);
    setResult(null);
    setAutoApplied(false);
    try {
      const data = await fetchData();
      const statsOnly = Object.fromEntries(
        Object.entries(data.toApply).filter(([k]) => STATS_FIELDS.has(k))
      );
      if (Object.keys(statsOnly).length > 0) {
        onApply(statsOnly);
        setAutoApplied(true);
        setState("done");
        setResult({ ...data, toApply: statsOnly });
      } else {
        setState("done");
        setResult({ ...data, toApply: {} });
      }
    } catch (e) {
      setError(e.message || "Erreur de synchronisation");
      setState("error");
    }
  }

  // Bouton 2 : sync complète avec confirmation (identité + stats)
  async function handleFullSync() {
    setState("loading");
    setError(null);
    setResult(null);
    setAutoApplied(false);
    try {
      const data = await fetchData();
      setResult(data);
      setState("done");
    } catch (e) {
      setError(e.message || "Erreur de synchronisation");
      setState("error");
    }
  }

  function handleApply() {
    if (result?.toApply) {
      onApply(result.toApply);
      setResult(null);
      setState("idle");
    }
  }

  const newFieldsCount = result ? Object.keys(result.toApply).length : 0;
  const s = newFieldsCount > 1 ? "s" : "";
  const x = newFieldsCount > 1 ? "x" : "";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">

        {/* Bouton principal : stats en 1 clic */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleQuickStats}
          disabled={state === "loading"}
          className="flex items-center gap-1.5 text-xs border-green-200 text-green-700 hover:bg-green-50 font-semibold"
        >
          {state === "loading"
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Zap className="w-3.5 h-3.5" />}
          Actualiser les stats
        </Button>

        {/* Bouton secondaire : sync complète */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFullSync}
          disabled={state === "loading"}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 px-2"
        >
          <RefreshCw className="w-3 h-3" />
          {t(lang, 'playerDetail.syncBtn')}
        </Button>

        {state === "loading" && (
          <span className="text-xs text-slate-400 italic">BeSoccer · SofaScore · FotMob…</span>
        )}

        {state === "done" && result && (
          <>
            {autoApplied ? (
              <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {newFieldsCount} stat{s} appliquée{s}
              </Badge>
            ) : newFieldsCount > 0 ? (
              <>
                <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                  {t(lang, 'playerDetail.newFields', { count: newFieldsCount, s, x })}
                </Badge>
                <button
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                  onClick={() => setShowDetail(!showDetail)}
                >
                  {showDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {t(lang, 'playerDetail.viewChanges')}
                </button>
                <Button size="sm" onClick={handleApply} className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-3">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />{t(lang, 'playerDetail.applyBtn')}
                </Button>
              </>
            ) : (
              <Badge className="bg-slate-100 text-slate-500 border-0 text-xs">{t(lang, 'playerDetail.upToDate')}</Badge>
            )}
          </>
        )}

        {state === "error" && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />{error}
          </span>
        )}
      </div>

      {showDetail && result && newFieldsCount > 0 && !autoApplied && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-2 max-h-48 overflow-y-auto">
          <p className="text-[10px] text-slate-400 mb-1.5 font-semibold uppercase">
            {t(lang, 'playerDetail.sourcesLabel')} {result.sources.join(", ")}
          </p>
          {Object.entries(result.toApply).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
              <span className="text-xs text-slate-500 capitalize">{k.replace(/_/g, " ")}</span>
              <span className="text-xs font-medium text-green-700 max-w-[55%] truncate text-right">
                {k === "photo_url" ? t(lang, 'playerDetail.photoUrlFound') : String(v)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
