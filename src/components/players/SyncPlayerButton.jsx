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
    const res = await base44.functions.invoke("enrichPlayerFromAPI", {
      playerName: player.nom,
    });
    if (!res?.data || Object.keys(res.data).length === 0) {
      throw new Error("Aucune donnée trouvée pour ce joueur sur les APIs disponibles.");
    }
    const toApply = {};
    Object.entries(res.data).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "" && String(v) !== String(player[k] ?? "")) {
        toApply[k] = v;
      }
    });
    return { raw: res.data, toApply, sources: res.sources || [], fieldsFound: res.fieldsFound || 0 };
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
          className="flex items-center gap-1.5 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-medium"
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
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 px-2"
        >
          <RefreshCw className="w-3 h-3" />
          {t(lang, 'playerDetail.syncBtn')}
        </Button>

        {state === "loading" && (
          <span className="text-xs text-slate-400 italic">Transfermarkt · SofaScore · FotMob…</span>
        )}

        {state === "done" && result && (
          <>
            {autoApplied ? (
              <Badge className="bg-slate-100 text-slate-700 border-0 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {newFieldsCount} stat{s} appliquée{s}
              </Badge>
            ) : newFieldsCount > 0 ? (
              <>
                <Badge className="bg-slate-100 text-slate-700 border-0 text-xs">
                  {t(lang, 'playerDetail.newFields', { count: newFieldsCount, s, x })}
                </Badge>
                <button
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                  onClick={() => setShowDetail(!showDetail)}
                >
                  {showDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {t(lang, 'playerDetail.viewChanges')}
                </button>
                <Button size="sm" onClick={handleApply} className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-7 px-3">
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
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">
              {t(lang, 'playerDetail.sourcesLabel')} {result.sources.join(", ")}
            </p>
            {result.raw?.transfermarkt_id && (
              <a
                href={`https://www.transfermarkt.fr/${
                  (player.nom || "joueur")
                    .toLowerCase()
                    .normalize("NFD").replace(/[̀-ͯ]/g, "")
                    .replace(/[^a-z0-9\s-]/g, "")
                    .trim().replace(/\s+/g, "-")
                }/profil/spieler/${result.raw.transfermarkt_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-slate-400 hover:text-slate-700 underline"
              >
                Voir sur Transfermarkt ↗
              </a>
            )}
          </div>
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
