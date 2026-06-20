import React from "react";
import { Star, Plus, ChevronRight } from "lucide-react";
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

function PlayerCard({ player, inWatchList, watchlistItem, onAddToWatchlist }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const sc = watchlistItem ? statutConfig(watchlistItem.statut) : null;
  const contract = contractStatus(player.contrat_fin);
  const abbr = POSTE_ABBR[player.poste];
  const posteColor = POSTE_COLOR[player.poste] || "bg-slate-100 text-slate-600";

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
    </div>
  );
}

export default React.memo(PlayerCard);
