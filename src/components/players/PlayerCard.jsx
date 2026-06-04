import React from "react";
import { Star, Plus, ChevronRight, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import PlayerAvatar from "../ui/PlayerAvatar";
import { statutConfig } from "./PlayerStatusModal";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const POSTE_ABBR = {
  "Gardien": "GK", "Défenseur central": "DC",
  "Latéral droit": "LD", "Latéral gauche": "LG",
  "Milieu défensif": "MD", "Milieu central": "MC",
  "Milieu offensif": "MO", "Ailier droit": "AD",
  "Ailier gauche": "AG", "Attaquant": "ATT",
};

const POSTE_COLOR = {
  "Gardien": "bg-amber-50 text-amber-700",
  "Défenseur central": "bg-slate-100 text-slate-600",
  "Latéral droit": "bg-slate-100 text-slate-600",
  "Latéral gauche": "bg-slate-100 text-slate-600",
  "Milieu défensif": "bg-slate-100 text-slate-600",
  "Milieu central": "bg-slate-100 text-slate-600",
  "Milieu offensif": "bg-slate-100 text-slate-600",
  "Ailier droit": "bg-slate-100 text-slate-600",
  "Ailier gauche": "bg-slate-100 text-slate-600",
  "Attaquant": "bg-slate-900 text-white",
};

function Stat({ label, value, color = "text-slate-800" }) {
  if (value == null || value === "") return null;
  return (
    <span className="flex flex-col items-center min-w-[36px]">
      <span className={`text-sm font-bold leading-tight ${color}`}>{value}</span>
      <span className="text-[10px] text-slate-400 leading-tight">{label}</span>
    </span>
  );
}

function contractStatus(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const end = new Date(dateStr);
  if (isNaN(end)) return null;
  const diffDays = (end - now) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return { label: "Expiré", rowBadge: "bg-red-100 text-red-700 border border-red-200", sideColor: null, warn: true, critical: true };
  if (diffDays < 90) return { label: "Expire bientôt", rowBadge: "bg-orange-100 text-orange-700 border border-orange-200", sideColor: "text-orange-500 bg-orange-50", warn: true, critical: true, date: dateStr.substring(0, 7) };
  if (diffDays < 365) return { label: dateStr.substring(0, 7), sideColor: "text-orange-500 bg-orange-50", warn: true, critical: false };
  return { label: dateStr.substring(0, 7), sideColor: "text-slate-400", warn: false, critical: false };
}

function formatVM(v) {
  if (v == null) return null;
  if (v >= 1) return `${v}M€`;
  return `${Math.round(v * 1000)}K€`;
}

export default function PlayerCard({ player, inWatchList, watchlistItem, onAddToWatchlist }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const sc = watchlistItem ? statutConfig(watchlistItem.statut) : null;
  const contract = contractStatus(player.contrat_fin);
  const abbr = POSTE_ABBR[player.poste];
  const posteColor = POSTE_COLOR[player.poste] || "bg-slate-100 text-slate-600";

  const hasStats = player.buts != null || player.passes_decisives != null ||
    player.note_moyenne != null || player.matchs_joues != null ||
    player.xg != null || player.valeur_marchande != null;

  return (
    <div
      className="flex flex-col bg-white hover:bg-slate-50/70 transition-colors cursor-pointer border-b border-slate-100 last:border-b-0 group"
      onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + player.id)}
    >
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Avatar */}
        <PlayerAvatar
          src={player.photo_url}
          name={player.nom}
          type="player"
          club={player.club_actuel}
          entityId={player.id}
          entityType="Player"
          className="w-10 h-10 flex-shrink-0"
          textClassName="text-xs"
        />

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-900 truncate">{player.nom}</span>
            {abbr && (
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${posteColor}`}>
                {abbr}
              </span>
            )}
            {!player.club_actuel && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 bg-slate-100 text-slate-500 border border-slate-200">
                Libre
              </span>
            )}
            {contract?.critical && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${contract.rowBadge}`}>
                {contract.label}
              </span>
            )}
            {sc && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${sc.badge} flex-shrink-0`}>
                {watchlistItem.statut}
              </span>
            )}
            {!sc && inWatchList && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400 flex-wrap">
            {player.club_actuel && <span className="truncate max-w-[120px]">{player.club_actuel}</span>}
            {player.ligue && <><span>·</span><span className="truncate max-w-[100px]">{player.ligue}</span></>}
            {player.nationalite && <><span>·</span><span>{player.nationalite}</span></>}
            {player.age != null && <><span>·</span><span>{player.age} ans</span></>}
          </div>
        </div>

        {/* Key stats — desktop */}
        {hasStats && (
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
            {player.matchs_joues != null && <Stat label="MJ" value={player.matchs_joues} />}
            {player.buts != null && <Stat label="⚽ Buts" value={player.buts} color="text-green-700" />}
            {player.passes_decisives != null && <Stat label="🅰 Ass." value={player.passes_decisives} color="text-blue-700" />}
            {player.note_moyenne != null && <Stat label="★ Note" value={player.note_moyenne} color="text-amber-600" />}
            {player.xg != null && <Stat label="xG" value={player.xg} color="text-purple-600" />}
            {player.valeur_marchande != null && (
              <Stat label="Val. march." value={formatVM(player.valeur_marchande)} color="text-emerald-700" />
            )}
          </div>
        )}

        {/* Contract date — only non-critical (critical ones appear in the name row) */}
        {contract && !contract.critical && contract.warn && (
          <span className={`hidden md:flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${contract.sideColor}`}>
            <AlertTriangle className="w-3 h-3" />
            {contract.label}
          </span>
        )}
        {contract && !contract.warn && (
          <span className="hidden md:block text-[11px] text-slate-400 flex-shrink-0">
            {contract.label}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!sc && onAddToWatchlist && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onAddToWatchlist(player); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title={t(lang, 'players.addToWatch')}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </div>
      </div>

      {/* Mobile stats row */}
      {hasStats && (
        <div className="sm:hidden flex items-center gap-3 px-4 pb-2.5 flex-wrap">
          {player.buts != null && <span className="text-xs text-green-700 font-semibold">⚽ {player.buts}</span>}
          {player.passes_decisives != null && <span className="text-xs text-blue-700 font-semibold">🅰 {player.passes_decisives}</span>}
          {player.note_moyenne != null && <span className="text-xs text-amber-600 font-semibold">★ {player.note_moyenne}</span>}
          {player.valeur_marchande != null && <span className="text-xs text-emerald-700 font-semibold">{formatVM(player.valeur_marchande)}</span>}
          {contract && !contract.critical && (
            <span className={`text-xs font-medium ${contract.warn ? contract.sideColor?.split(" ")[0] : "text-slate-400"}`}>
              {contract.warn && "⚠ "}{contract.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
