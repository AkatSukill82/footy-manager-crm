import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import PlayerAvatar from "../ui/PlayerAvatar";
import { statutConfig } from "./PlayerStatusModal";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const posteColors = {
  "Gardien": "text-yellow-600",
  "Défenseur central": "text-blue-600",
  "Latéral droit": "text-blue-500",
  "Latéral gauche": "text-blue-500",
  "Milieu défensif": "text-green-600",
  "Milieu central": "text-green-600",
  "Milieu offensif": "text-purple-600",
  "Ailier droit": "text-orange-500",
  "Ailier gauche": "text-orange-500",
  "Attaquant": "text-red-500"
};

function StatPill({ label, value, color = "text-slate-700" }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex flex-col items-center min-w-[48px]">
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-slate-400 leading-tight mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

export default function PlayerCard({ player, inWatchList, watchlistItem, onAddToWatchlist }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const sc = watchlistItem ? statutConfig(watchlistItem.statut) : null;

  const isContractSoon = (() => {
    if (!player.contrat_fin) return false;
    const now = new Date();
    const contractEnd = new Date(player.contrat_fin);
    return contractEnd >= now && contractEnd <= new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  })();

  const contractLabel = player.contrat_fin
    ? player.contrat_fin.substring(0, 7)
    : null;

  const hasSeasonStats = player.buts != null || player.passes_decisives != null || player.note_moyenne != null || player.matchs_joues != null;
  const hasAdvancedStats = player.xg != null || player.xa != null || player.duels_gagnes_pct != null;

  return (
    <div
      className="bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + player.id)}
    >
      {/* Main row */}
      <div className="flex items-center gap-4 px-4 py-3">

        {/* Avatar */}
        <PlayerAvatar
          src={player.photo_url}
          name={player.nom}
          type="player"
          club={player.club_actuel}
          entityId={player.id}
          entityType="Player"
          className="w-12 h-12"
          textClassName="text-sm"
        />

        {/* Name + position + club */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-slate-900 truncate">{player.nom}</h3>
            {sc && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${sc.badge} flex-shrink-0`}>
                {watchlistItem.statut}
              </span>
            )}
            {!sc && inWatchList && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {player.poste && (
              <span className={`text-xs font-medium ${posteColors[player.poste] || "text-slate-500"}`}>
                {player.poste}
              </span>
            )}
            {player.nationalite && (
              <span className="text-xs text-slate-400">· {player.nationalite}</span>
            )}
            {player.club_actuel && (
              <span className="text-xs text-slate-400">· {player.club_actuel}</span>
            )}
          </div>
        </div>

        {/* Key metrics */}
        <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
          {player.valeur_marchande != null && (
            <StatPill
              label={t(lang, 'playerDetail.value')}
              value={`${player.valeur_marchande} MC`}
              color="text-green-600"
            />
          )}
          {player.age != null && (
            <StatPill label={t(lang, 'playerDetail.age')} value={player.age} />
          )}
          {player.taille != null && (
            <StatPill label={t(lang, 'playerDetail.height')} value={`${player.taille} cm`} />
          )}
          {player.pied_fort && (
            <StatPill label={t(lang, 'filters.foot')} value={player.pied_fort} />
          )}
          {player.ligue && (
            <StatPill label="Ligue" value={player.ligue} />
          )}
          {contractLabel && (
            <StatPill
              label={t(lang, 'playerDetail.contractEnd')}
              value={contractLabel}
              color={isContractSoon ? "text-orange-500" : "text-slate-700"}
            />
          )}
        </div>

        {/* Status dot + add button */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Active
          </span>
          {!sc && onAddToWatchlist && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onAddToWatchlist(player); }}
              className="p-1 rounded-lg text-slate-300 hover:text-green-600 hover:bg-green-50 transition-colors"
              title={t(lang, 'players.addToWatch')}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
        </div>
      </div>

      {/* Stats saison row */}
      {hasSeasonStats && (
        <div className="border-t border-slate-50 px-4 py-2 flex items-center gap-6 bg-slate-50/50">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex-shrink-0">
            {t(lang, 'players.statsTitle')}
          </span>
          <div className="flex items-center gap-5">
            {player.matchs_joues != null && <StatPill label={t(lang,'players.matches')} value={player.matchs_joues} />}
            {player.buts != null && <StatPill label={t(lang,'players.goals')} value={player.buts} color="text-green-600" />}
            {player.passes_decisives != null && <StatPill label={t(lang,'players.assists')} value={player.passes_decisives} color="text-blue-600" />}
            {player.note_moyenne != null && <StatPill label={t(lang,'players.rating')} value={player.note_moyenne} color="text-indigo-600" />}
            {hasAdvancedStats && <>
              {player.xg != null && <StatPill label="xG" value={player.xg} color="text-purple-600" />}
              {player.xa != null && <StatPill label="xA" value={player.xa} color="text-purple-500" />}
              {player.duels_gagnes_pct != null && <StatPill label={t(lang,'players.duels')} value={`${player.duels_gagnes_pct}%`} />}
              {player.passes_reussies_pct != null && <StatPill label={t(lang,'players.passes')} value={`${player.passes_reussies_pct}%`} />}
              {player.interceptions != null && <StatPill label={t(lang,'players.interceptions')} value={player.interceptions} />}
            </>}
          </div>
        </div>
      )}

      {/* Agent + palmarès */}
      {(player.agent || player.palmares) && (
        <div className="border-t border-slate-50 px-4 py-2 flex flex-wrap gap-x-4 gap-y-0.5">
          {player.agent && player.agent !== "null" && (
            <span className="text-[11px] text-slate-500">🤝 {player.agent}</span>
          )}
          {player.palmares && (
            <div className="w-full">
              <span className="text-[10px] font-semibold text-amber-600 uppercase">{t(lang,'players.trophies')} </span>
              <span className="text-[11px] text-slate-500 line-clamp-1">{player.palmares}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}