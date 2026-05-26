import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X, UserX } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const POSITION_GROUPS = {
  Gardien:   ["Gardien"],
  Défenseur: ["Défenseur central", "Latéral droit", "Latéral gauche"],
  Milieu:    ["Milieu défensif", "Milieu central", "Milieu offensif"],
  Attaquant: ["Ailier droit", "Ailier gauche", "Attaquant"],
};

function getGroupForPosition(poste) {
  for (const [group, positions] of Object.entries(POSITION_GROUPS)) {
    if (positions.includes(poste)) return group;
  }
  return null;
}

const groupColors = {
  Gardien:   "bg-yellow-400 text-yellow-900",
  Défenseur: "bg-blue-500 text-white",
  Milieu:    "bg-green-500 text-white",
  Attaquant: "bg-red-500 text-white",
};

export default function PlayerPickerModal({ slot, players, onSelect, onClose }) {
  const { lang } = useLanguage();
  const [search, setSearch] = useState("");
  const compatibleGroup = slot.positionGroup;

  const filtered = players.filter(pl => {
    const matchesSearch =
      pl.nom.toLowerCase().includes(search.toLowerCase()) ||
      (pl.club_actuel || "").toLowerCase().includes(search.toLowerCase());
    if (!compatibleGroup || compatibleGroup === "any") return matchesSearch;
    const group = getGroupForPosition(pl.poste);
    return matchesSearch && group === compatibleGroup;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white w-full md:max-w-2xl md:mx-4 md:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/30 rounded-full md:hidden" />
          <div className="mt-1">
            <h2 className="text-white font-bold text-lg">{t(lang, 'teams.choosePlayer')}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-slate-300 text-sm">{t(lang, 'teams.posLabel')} <span className="text-white font-semibold">{slot.label}</span></span>
              {compatibleGroup && compatibleGroup !== "any" && (
                <Badge className={`${groupColors[compatibleGroup]} text-xs`}>{compatibleGroup}</Badge>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 ml-2 mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              autoFocus
              placeholder={t(lang, 'teams.pickerSearch')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* Remove player */}
        <div className="px-4 pt-2 pb-1 flex-shrink-0">
          <button
            onClick={() => onSelect(null)}
            className="flex items-center gap-2 text-sm text-red-500 active:text-red-700 transition-colors py-1"
          >
            <UserX className="w-4 h-4" />
            {t(lang, 'teams.removePlayer')}
          </button>
        </div>

        {/* Player list */}
        <div className="overflow-y-auto flex-1 px-3 pb-4 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-500 py-10">{t(lang, 'teams.noPlayerFound')}</p>
          ) : (
            filtered.map(player => {
              const group = getGroupForPosition(player.poste);
              return (
                <button
                  key={player.id}
                  onClick={() => onSelect(player)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left touch-manipulation"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.nom} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-lg">
                        {player.nom[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{player.nom}</div>
                    <div className="text-xs text-slate-500 truncate">{player.club_actuel || t(lang, 'players.noClub')}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {group && (
                      <Badge className={`${groupColors[group]} text-xs px-1.5`}>{player.poste?.split(" ")[0]}</Badge>
                    )}
                    {player.valeur_marchande && (
                      <span className="text-sm font-bold text-green-600">{player.valeur_marchande}M€</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
