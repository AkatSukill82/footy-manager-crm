import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, UserX } from "lucide-react";

const POSITION_GROUPS = {
  Gardien: ["Gardien"],
  Défenseur: ["Défenseur central", "Latéral droit", "Latéral gauche"],
  Milieu: ["Milieu défensif", "Milieu central", "Milieu offensif"],
  Attaquant: ["Ailier droit", "Ailier gauche", "Attaquant"],
};

function getGroupForPosition(poste) {
  for (const [group, positions] of Object.entries(POSITION_GROUPS)) {
    if (positions.includes(poste)) return group;
  }
  return null;
}

const groupColors = {
  Gardien: "bg-yellow-400 text-yellow-900",
  Défenseur: "bg-blue-500 text-white",
  Milieu: "bg-green-500 text-white",
  Attaquant: "bg-red-500 text-white",
};

export default function PlayerPickerModal({ slot, players, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const compatibleGroup = slot.positionGroup;

  const filtered = players.filter(p => {
    const matchesSearch =
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      (p.club_actuel || "").toLowerCase().includes(search.toLowerCase());
    if (!compatibleGroup || compatibleGroup === "any") return matchesSearch;
    const group = getGroupForPosition(p.poste);
    return matchesSearch && group === compatibleGroup;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">Choisir un joueur</h2>
            <p className="text-slate-300 text-sm mt-1">
              Poste : <span className="text-white font-semibold">{slot.label}</span>
              {compatibleGroup && (
                <span className="ml-2">
                  <Badge className={groupColors[compatibleGroup]}>{compatibleGroup}</Badge>
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              autoFocus
              placeholder="Rechercher par nom ou club..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Retirer le joueur */}
        <div className="px-4 pt-3">
          <button
            onClick={() => onSelect(null)}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors mb-2"
          >
            <UserX className="w-4 h-4" />
            Retirer le joueur
          </button>
        </div>

        {/* Liste */}
        <div className="overflow-y-auto max-h-[420px] p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Aucun joueur trouvé</p>
          ) : (
            filtered.map(player => {
              const group = getGroupForPosition(player.poste);
              return (
                <button
                  key={player.id}
                  onClick={() => onSelect(player)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.nom} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg font-bold">
                        {player.nom[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{player.nom}</div>
                    <div className="text-sm text-slate-500 truncate">{player.club_actuel || "Sans club"}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {group && (
                      <Badge className={`${groupColors[group]} text-xs`}>{player.poste}</Badge>
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