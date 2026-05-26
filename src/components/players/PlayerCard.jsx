import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Star, StarOff, TrendingUp, Clock, Activity, Target, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import TransfermarktImage from "../ui/TransfermarktImage";
import { statutConfig } from "./PlayerStatusModal";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

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
  "Attaquant": "bg-red-100 text-red-800"
};

function StatBox({ label, value, color = "bg-slate-50", textColor = "text-slate-900" }) {
  if (value == null || value === "") return null;
  return (
    <div className={`${color} rounded-lg p-2 text-center`}>
      <div className={`font-bold text-sm ${textColor}`}>{value}</div>
      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{label}</div>
    </div>
  );
}

export default function PlayerCard({ player, inWatchList, watchlistItem, onAddToWatchlist }) {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const sc = watchlistItem ? statutConfig(watchlistItem.statut) : null;

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer overflow-hidden"
      onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + player.id)}
    >
      {/* Top bar: green base, colored by status if tracked */}
      <div className={`h-1.5 ${sc ? sc.bg.replace('bg-', 'bg-').split(' ')[0] : 'bg-gradient-to-r from-green-500 to-emerald-400'}`} />

      <CardContent className="pt-4 pb-4 px-4 space-y-3">

        {/* ── Identité ── */}
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            <TransfermarktImage
              src={player.photo_url}
              alt={player.nom}
              className="w-full h-full object-cover"
              fallback={<User className="w-7 h-7 text-slate-400" />}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-bold text-base text-slate-900 leading-tight truncate">{player.nom}</h3>
              {/* Status badge or add button */}
              {sc ? (
                <Badge className={`text-[10px] flex-shrink-0 border ${sc.badge}`}>
                  {watchlistItem.statut}
                </Badge>
              ) : onAddToWatchlist ? (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onAddToWatchlist(player); }}
                  className="flex-shrink-0 p-1 rounded-lg text-slate-300 hover:text-green-600 hover:bg-green-50 transition-colors"
                  title={t(lang, 'players.addToWatch')}
                >
                  <Plus className="w-4 h-4" />
                </button>
              ) : inWatchList ? (
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0 mt-0.5" />
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {player.poste && (
                <Badge className={`text-[10px] py-0 ${posteColors[player.poste] || "bg-gray-100 text-gray-800"}`}>
                  {player.poste}
                </Badge>
              )}
              {player.poste_secondaire && (
                <Badge variant="outline" className="text-[10px] py-0">{player.poste_secondaire}</Badge>
              )}
              {player.nationalite && (
                <Badge variant="outline" className="text-[10px] py-0">{player.nationalite}</Badge>
              )}
              {player.club_actuel && (
                <Badge className="text-[10px] py-0 bg-slate-800 text-white">{player.club_actuel}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* ── Infos clés ── */}
        <div className="grid grid-cols-3 gap-1.5">
          <StatBox label={t(lang,'playerDetail.age')} value={player.age ? `${player.age}` : null} />
          <StatBox label={t(lang,'playerDetail.height')} value={player.taille ? `${player.taille} cm` : null} />
          <StatBox label={t(lang,'filters.foot')} value={player.pied_fort} />
          <StatBox label={t(lang,'playerDetail.value')} value={player.valeur_marchande ? `${player.valeur_marchande} M€` : null} color="bg-green-50" textColor="text-green-700" />
          <StatBox label={t(lang,'playerDetail.contractEnd')} value={player.contrat_fin ? player.contrat_fin.substring(0, 7) : null} color="bg-orange-50" textColor="text-orange-700" />
          <StatBox label={t(lang,'fullProfile.league')} value={player.ligue} />
        </div>

        {/* ── Stats saison ── */}
        {(player.buts != null || player.passes_decisives != null || player.note_moyenne != null || player.matchs_joues != null) && (
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">{t(lang,'players.statsTitle')}</p>
            <div className="grid grid-cols-4 gap-1">
              <StatBox label={t(lang,'players.matches')} value={player.matchs_joues} />
              <StatBox label={t(lang,'players.goals')} value={player.buts} color="bg-green-50" textColor="text-green-700" />
              <StatBox label={t(lang,'players.assists')} value={player.passes_decisives} color="bg-blue-50" textColor="text-blue-700" />
              <StatBox label={t(lang,'players.rating')} value={player.note_moyenne} color="bg-indigo-50" textColor="text-indigo-700" />
            </div>
          </div>
        )}

        {/* ── Stats avancées ── */}
        {(player.xg != null || player.duels_gagnes_pct != null || player.dribbles_pct != null) && (
          <div className="grid grid-cols-3 gap-1">
            {player.xg != null && <StatBox label={t(lang,'players.xg')} value={player.xg} color="bg-purple-50" textColor="text-purple-700" />}
            {player.xa != null && <StatBox label={t(lang,'players.xa')} value={player.xa} color="bg-purple-50" textColor="text-purple-700" />}
            {player.duels_gagnes_pct != null && <StatBox label={t(lang,'players.duels')} value={`${player.duels_gagnes_pct}%`} />}
            {player.dribbles_pct != null && <StatBox label={t(lang,'players.dribbles')} value={`${player.dribbles_pct}%`} />}
            {player.passes_reussies_pct != null && <StatBox label={t(lang,'players.passes')} value={`${player.passes_reussies_pct}%`} />}
            {player.interceptions != null && <StatBox label={t(lang,'players.interceptions')} value={player.interceptions} />}
          </div>
        )}

        {/* ── Agent / contrat ── */}
        {(player.agent || player.salaire) && (
          <div className="border-t border-slate-100 pt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
            {player.agent && <span>🤝 {player.agent}</span>}
            {player.salaire && <span>💰 {player.salaire} M€/an</span>}
          </div>
        )}

        {/* ── Palmarès / distinctions ── */}
        {player.palmares && (
          <div className="border-t border-slate-100 pt-2">
            <p className="text-[10px] font-semibold text-amber-600 uppercase mb-1">{t(lang,'players.trophies')}</p>
            <p className="text-[11px] text-slate-600 line-clamp-2">{player.palmares}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}