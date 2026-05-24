import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

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
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("apifootball_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);

  async function handleSync() {
    setState("loading");
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("enrichPlayerFromAPI", {
        playerName: player.nom,
        ...(apiKey ? { apiFootballKey: apiKey } : {}),
      });
      if (res?.data && Object.keys(res.data).length > 0) {
        // Filter: only keep fields that are new or different, never overwrite with null
        const toApply = {};
        Object.entries(res.data).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== "" && String(v) !== String(player[k] ?? "")) {
            toApply[k] = v;
          }
        });
        setResult({ raw: res.data, toApply, sources: res.sources || [], fieldsFound: res.fieldsFound || 0 });
        setState("done");
      } else {
        setError("Aucune donnée trouvée pour ce joueur sur les APIs disponibles.");
        setState("error");
      }
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

  function saveApiKey(k) {
    setApiKey(k);
    localStorage.setItem("apifootball_key", k);
  }

  const newFieldsCount = result ? Object.keys(result.toApply).length : 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Main button row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={state === "loading"}
          className="flex items-center gap-1.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          {state === "loading"
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCw className="w-3.5 h-3.5" />}
          {state === "loading" ? "Synchronisation…" : "Sync API"}
        </Button>

        {state === "loading" && (
          <span className="text-xs text-slate-400 italic">TheSportsDB{apiKey ? " + API-Football" : ""}…</span>
        )}

        {state === "done" && result && (
          <>
            {newFieldsCount > 0 ? (
              <>
                <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                  {newFieldsCount} champ{newFieldsCount > 1 ? "s" : ""} nouveaux
                </Badge>
                <button
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                  onClick={() => setShowDetail(!showDetail)}
                >
                  {showDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Voir
                </button>
                <Button size="sm" onClick={handleApply} className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-3">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Appliquer
                </Button>
              </>
            ) : (
              <Badge className="bg-slate-100 text-slate-500 border-0 text-xs">Déjà à jour</Badge>
            )}
          </>
        )}

        {state === "error" && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />{error}
          </span>
        )}

        <button
          className="text-xs text-slate-300 hover:text-slate-500 ml-auto"
          onClick={() => setShowKeyInput(!showKeyInput)}
          title="Configurer API-Football (optionnel)"
        >
          ⚙
        </button>
      </div>

      {/* API-Football key config */}
      {showKeyInput && (
        <div className="flex items-center gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={e => saveApiKey(e.target.value)}
            placeholder="Clé API-Football RapidAPI (optionnel — stats avancées)"
            className="text-xs border border-slate-200 rounded px-2 py-1 flex-1 bg-white"
          />
          <span className="text-[10px] text-slate-400">Sans clé : TheSportsDB (photo + bio). Avec clé : stats complètes.</span>
        </div>
      )}

      {/* Detail list of new fields */}
      {showDetail && result && newFieldsCount > 0 && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-2 max-h-48 overflow-y-auto">
          <p className="text-[10px] text-slate-400 mb-1.5 font-semibold uppercase">
            Sources : {result.sources.join(", ")}
          </p>
          {Object.entries(result.toApply).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
              <span className="text-xs text-slate-500 capitalize">{k.replace(/_/g, " ")}</span>
              <span className="text-xs font-medium text-green-700 max-w-[55%] truncate text-right">
                {k === "photo_url" ? "📷 URL photo trouvée" : String(v)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
