import React, { useState } from "react";
import { Plus } from "lucide-react";
import PlayerPickerModal from "./PlayerPickerModal";

// Formations : chaque slot a label, positionGroup, et coordonnées % (left, top)
const FORMATIONS = {
  "4-3-3": [
    { id: "GK",  label: "GB",  positionGroup: "Gardien",   left: 50, top: 85 },
    { id: "LB",  label: "LG",  positionGroup: "Défenseur", left: 12, top: 68 },
    { id: "CB1", label: "DC",  positionGroup: "Défenseur", left: 35, top: 68 },
    { id: "CB2", label: "DC",  positionGroup: "Défenseur", left: 65, top: 68 },
    { id: "RB",  label: "LD",  positionGroup: "Défenseur", left: 88, top: 68 },
    { id: "LM",  label: "MG",  positionGroup: "Milieu",    left: 18, top: 47 },
    { id: "CM",  label: "MC",  positionGroup: "Milieu",    left: 50, top: 47 },
    { id: "RM",  label: "MD",  positionGroup: "Milieu",    left: 82, top: 47 },
    { id: "LW",  label: "AG",  positionGroup: "Attaquant", left: 18, top: 22 },
    { id: "ST",  label: "AT",  positionGroup: "Attaquant", left: 50, top: 16 },
    { id: "RW",  label: "AD",  positionGroup: "Attaquant", left: 82, top: 22 },
  ],
  "4-4-2": [
    { id: "GK",  label: "GB",  positionGroup: "Gardien",   left: 50, top: 85 },
    { id: "LB",  label: "LG",  positionGroup: "Défenseur", left: 12, top: 68 },
    { id: "CB1", label: "DC",  positionGroup: "Défenseur", left: 35, top: 68 },
    { id: "CB2", label: "DC",  positionGroup: "Défenseur", left: 65, top: 68 },
    { id: "RB",  label: "LD",  positionGroup: "Défenseur", left: 88, top: 68 },
    { id: "LM",  label: "MG",  positionGroup: "Milieu",    left: 12, top: 47 },
    { id: "CM1", label: "MC",  positionGroup: "Milieu",    left: 37, top: 47 },
    { id: "CM2", label: "MC",  positionGroup: "Milieu",    left: 63, top: 47 },
    { id: "RM",  label: "MD",  positionGroup: "Milieu",    left: 88, top: 47 },
    { id: "ST1", label: "AT",  positionGroup: "Attaquant", left: 35, top: 20 },
    { id: "ST2", label: "AT",  positionGroup: "Attaquant", left: 65, top: 20 },
  ],
  "4-2-3-1": [
    { id: "GK",  label: "GB",  positionGroup: "Gardien",   left: 50, top: 85 },
    { id: "LB",  label: "LG",  positionGroup: "Défenseur", left: 12, top: 68 },
    { id: "CB1", label: "DC",  positionGroup: "Défenseur", left: 35, top: 68 },
    { id: "CB2", label: "DC",  positionGroup: "Défenseur", left: 65, top: 68 },
    { id: "RB",  label: "LD",  positionGroup: "Défenseur", left: 88, top: 68 },
    { id: "CDM1",label: "MD",  positionGroup: "Milieu",    left: 35, top: 53 },
    { id: "CDM2",label: "MD",  positionGroup: "Milieu",    left: 65, top: 53 },
    { id: "LM",  label: "MO",  positionGroup: "Milieu",    left: 15, top: 36 },
    { id: "CAM", label: "MO",  positionGroup: "Milieu",    left: 50, top: 34 },
    { id: "RM",  label: "MO",  positionGroup: "Milieu",    left: 85, top: 36 },
    { id: "ST",  label: "AT",  positionGroup: "Attaquant", left: 50, top: 16 },
  ],
  "3-5-2": [
    { id: "GK",  label: "GB",  positionGroup: "Gardien",   left: 50, top: 85 },
    { id: "CB1", label: "DC",  positionGroup: "Défenseur", left: 25, top: 68 },
    { id: "CB2", label: "DC",  positionGroup: "Défenseur", left: 50, top: 68 },
    { id: "CB3", label: "DC",  positionGroup: "Défenseur", left: 75, top: 68 },
    { id: "LM",  label: "MG",  positionGroup: "Milieu",    left: 10, top: 47 },
    { id: "CM1", label: "MC",  positionGroup: "Milieu",    left: 30, top: 47 },
    { id: "CM2", label: "MC",  positionGroup: "Milieu",    left: 50, top: 47 },
    { id: "CM3", label: "MC",  positionGroup: "Milieu",    left: 70, top: 47 },
    { id: "RM",  label: "MD",  positionGroup: "Milieu",    left: 90, top: 47 },
    { id: "ST1", label: "AT",  positionGroup: "Attaquant", left: 35, top: 20 },
    { id: "ST2", label: "AT",  positionGroup: "Attaquant", left: 65, top: 20 },
  ],
  "3-4-3": [
    { id: "GK",  label: "GB",  positionGroup: "Gardien",   left: 50, top: 85 },
    { id: "CB1", label: "DC",  positionGroup: "Défenseur", left: 25, top: 68 },
    { id: "CB2", label: "DC",  positionGroup: "Défenseur", left: 50, top: 68 },
    { id: "CB3", label: "DC",  positionGroup: "Défenseur", left: 75, top: 68 },
    { id: "LM",  label: "MG",  positionGroup: "Milieu",    left: 18, top: 48 },
    { id: "CM1", label: "MC",  positionGroup: "Milieu",    left: 38, top: 48 },
    { id: "CM2", label: "MC",  positionGroup: "Milieu",    left: 62, top: 48 },
    { id: "RM",  label: "MD",  positionGroup: "Milieu",    left: 82, top: 48 },
    { id: "LW",  label: "AG",  positionGroup: "Attaquant", left: 18, top: 22 },
    { id: "ST",  label: "AT",  positionGroup: "Attaquant", left: 50, top: 16 },
    { id: "RW",  label: "AD",  positionGroup: "Attaquant", left: 82, top: 22 },
  ],
};

const BENCH_SLOTS = [
  { id: "B1", label: "SUB", positionGroup: "any" },
  { id: "B2", label: "SUB", positionGroup: "any" },
  { id: "B3", label: "SUB", positionGroup: "any" },
  { id: "B4", label: "SUB", positionGroup: "any" },
  { id: "B5", label: "SUB", positionGroup: "any" },
  { id: "B6", label: "SUB", positionGroup: "any" },
  { id: "B7", label: "SUB", positionGroup: "any" },
];

const positionGroupColors = {
  Gardien:   { bg: "from-yellow-400 to-yellow-500",  border: "border-yellow-300", badge: "bg-yellow-900/80" },
  Défenseur: { bg: "from-blue-500 to-blue-600",       border: "border-blue-300",   badge: "bg-blue-900/80" },
  Milieu:    { bg: "from-green-500 to-green-600",     border: "border-green-300",  badge: "bg-green-900/80" },
  Attaquant: { bg: "from-red-500 to-red-600",         border: "border-red-300",    badge: "bg-red-900/80" },
  any:       { bg: "from-slate-500 to-slate-600",     border: "border-slate-300",  badge: "bg-slate-900/80" },
};

function PlayerCard({ slot, player, onClick }) {
  const colors = positionGroupColors[slot.positionGroup] || positionGroupColors.any;

  if (!player) {
    return (
      <button
        onClick={onClick}
        className={`
          flex flex-col items-center justify-center
          w-16 h-20 rounded-xl border-2 border-dashed
          ${colors.border} bg-white/10 hover:bg-white/20
          transition-all hover:scale-110 group
        `}
      >
        <Plus className="w-5 h-5 text-white/70 group-hover:text-white" />
        <span className="text-white/70 text-xs mt-1 font-bold group-hover:text-white">{slot.label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center
        w-16 rounded-xl overflow-hidden border-2 ${colors.border}
        shadow-lg hover:scale-110 transition-all hover:shadow-xl
        bg-gradient-to-b ${colors.bg}
      `}
    >
      {/* Photo */}
      <div className="w-full h-14 bg-black/20 overflow-hidden flex items-center justify-center">
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.nom} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="text-white text-2xl font-black">{player.nom[0]}</div>
        )}
      </div>
      {/* Infos */}
      <div className="w-full px-1 py-1.5 text-center">
        <div className={`text-xs font-bold text-white/90 rounded px-1 ${colors.badge} mb-0.5`}>
          {slot.label}
        </div>
        <div className="text-white text-xs font-semibold leading-tight truncate w-full">
          {player.nom.split(" ").pop()}
        </div>
        {player.valeur_marchande && (
          <div className="text-white/80 text-xs font-bold">{player.valeur_marchande}M</div>
        )}
      </div>
    </button>
  );
}

export default function FootballPitch({ formation = "4-3-3", players = [], initialLineup = {}, onLineupChange }) {
  const slots = FORMATIONS[formation] || FORMATIONS["4-3-3"];
  const [lineup, setLineup] = useState(initialLineup);
  const [pickerSlot, setPickerSlot] = useState(null);

  const updateLineup = (newLineup) => {
    setLineup(newLineup);
    onLineupChange?.(newLineup);
  };

  const handleSelect = (player) => {
    const newLineup = { ...lineup, [pickerSlot.id]: player };
    updateLineup(newLineup);
    setPickerSlot(null);
  };

  const startingValue = slots
    .map(s => lineup[s.id]?.valeur_marchande || 0)
    .reduce((a, b) => a + b, 0);

  const benchValue = BENCH_SLOTS
    .map(s => lineup[s.id]?.valeur_marchande || 0)
    .reduce((a, b) => a + b, 0);

  const filledSlots = slots.filter(s => lineup[s.id]).length;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between bg-slate-800 rounded-xl px-5 py-3 text-white">
        <span className="text-sm text-slate-300">
          <span className="font-bold text-white text-lg">{filledSlots}</span>/11 joueurs
        </span>
        <span className="text-sm text-slate-300">
          Valeur XI : <span className="font-bold text-green-400">{startingValue}M€</span>
        </span>
        <span className="text-sm text-slate-300">
          Valeur totale : <span className="font-bold text-blue-400">{(startingValue + benchValue).toFixed(0)}M€</span>
        </span>
      </div>

      {/* Pitch */}
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{ paddingBottom: "130%", background: "linear-gradient(180deg, #166534 0%, #15803d 15%, #16a34a 30%, #15803d 45%, #16a34a 60%, #15803d 75%, #166534 100%)" }}
      >
        {/* Lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 130" preserveAspectRatio="none">
          {/* Border */}
          <rect x="5" y="3" width="90" height="124" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          {/* Center line */}
          <line x1="5" y1="65" x2="95" y2="65" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          {/* Center circle */}
          <circle cx="50" cy="65" r="12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <circle cx="50" cy="65" r="0.8" fill="rgba(255,255,255,0.5)" />
          {/* Penalty areas */}
          <rect x="25" y="3" width="50" height="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <rect x="35" y="3" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <rect x="25" y="109" width="50" height="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <rect x="35" y="119" width="30" height="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
        </svg>

        {/* Player slots */}
        {slots.map(slot => (
          <div
            key={slot.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${slot.left}%`, top: `${slot.top}%` }}
          >
            <PlayerCard
              slot={slot}
              player={lineup[slot.id]}
              onClick={() => setPickerSlot(slot)}
            />
          </div>
        ))}
      </div>

      {/* Bench */}
      <div className="bg-slate-900 rounded-2xl p-4">
        <div className="text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider">
          Banc de touche
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {BENCH_SLOTS.map(slot => (
            <div key={slot.id} className="flex-shrink-0">
              <PlayerCard
                slot={slot}
                player={lineup[slot.id]}
                onClick={() => setPickerSlot(slot)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {pickerSlot && (
        <PlayerPickerModal
          slot={pickerSlot}
          players={players}
          onSelect={handleSelect}
          onClose={() => setPickerSlot(null)}
        />
      )}
    </div>
  );
}