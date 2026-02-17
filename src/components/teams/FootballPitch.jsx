import React, { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import PlayerPickerModal from "./PlayerPickerModal";

const FORMATIONS = {
  "4-3-3": [
    { id: "GK",   label: "GB", positionGroup: "Gardien",   left: 50, top: 85 },
    { id: "LB",   label: "LG", positionGroup: "Défenseur", left: 12, top: 68 },
    { id: "CB1",  label: "DC", positionGroup: "Défenseur", left: 35, top: 68 },
    { id: "CB2",  label: "DC", positionGroup: "Défenseur", left: 65, top: 68 },
    { id: "RB",   label: "LD", positionGroup: "Défenseur", left: 88, top: 68 },
    { id: "LM",   label: "MG", positionGroup: "Milieu",    left: 18, top: 47 },
    { id: "CM",   label: "MC", positionGroup: "Milieu",    left: 50, top: 47 },
    { id: "RM",   label: "MD", positionGroup: "Milieu",    left: 82, top: 47 },
    { id: "LW",   label: "AG", positionGroup: "Attaquant", left: 18, top: 22 },
    { id: "ST",   label: "AT", positionGroup: "Attaquant", left: 50, top: 16 },
    { id: "RW",   label: "AD", positionGroup: "Attaquant", left: 82, top: 22 },
  ],
  "4-4-2": [
    { id: "GK",   label: "GB", positionGroup: "Gardien",   left: 50, top: 85 },
    { id: "LB",   label: "LG", positionGroup: "Défenseur", left: 12, top: 68 },
    { id: "CB1",  label: "DC", positionGroup: "Défenseur", left: 35, top: 68 },
    { id: "CB2",  label: "DC", positionGroup: "Défenseur", left: 65, top: 68 },
    { id: "RB",   label: "LD", positionGroup: "Défenseur", left: 88, top: 68 },
    { id: "LM",   label: "MG", positionGroup: "Milieu",    left: 12, top: 47 },
    { id: "CM1",  label: "MC", positionGroup: "Milieu",    left: 37, top: 47 },
    { id: "CM2",  label: "MC", positionGroup: "Milieu",    left: 63, top: 47 },
    { id: "RM",   label: "MD", positionGroup: "Milieu",    left: 88, top: 47 },
    { id: "ST1",  label: "AT", positionGroup: "Attaquant", left: 35, top: 20 },
    { id: "ST2",  label: "AT", positionGroup: "Attaquant", left: 65, top: 20 },
  ],
  "4-2-3-1": [
    { id: "GK",   label: "GB", positionGroup: "Gardien",   left: 50, top: 85 },
    { id: "LB",   label: "LG", positionGroup: "Défenseur", left: 12, top: 68 },
    { id: "CB1",  label: "DC", positionGroup: "Défenseur", left: 35, top: 68 },
    { id: "CB2",  label: "DC", positionGroup: "Défenseur", left: 65, top: 68 },
    { id: "RB",   label: "LD", positionGroup: "Défenseur", left: 88, top: 68 },
    { id: "CDM1", label: "MD", positionGroup: "Milieu",    left: 35, top: 53 },
    { id: "CDM2", label: "MD", positionGroup: "Milieu",    left: 65, top: 53 },
    { id: "LM",   label: "MO", positionGroup: "Milieu",    left: 15, top: 36 },
    { id: "CAM",  label: "MO", positionGroup: "Milieu",    left: 50, top: 34 },
    { id: "RM",   label: "MO", positionGroup: "Milieu",    left: 85, top: 36 },
    { id: "ST",   label: "AT", positionGroup: "Attaquant", left: 50, top: 16 },
  ],
  "3-5-2": [
    { id: "GK",   label: "GB", positionGroup: "Gardien",   left: 50, top: 85 },
    { id: "CB1",  label: "DC", positionGroup: "Défenseur", left: 25, top: 68 },
    { id: "CB2",  label: "DC", positionGroup: "Défenseur", left: 50, top: 68 },
    { id: "CB3",  label: "DC", positionGroup: "Défenseur", left: 75, top: 68 },
    { id: "LM",   label: "MG", positionGroup: "Milieu",    left: 10, top: 47 },
    { id: "CM1",  label: "MC", positionGroup: "Milieu",    left: 30, top: 47 },
    { id: "CM2",  label: "MC", positionGroup: "Milieu",    left: 50, top: 47 },
    { id: "CM3",  label: "MC", positionGroup: "Milieu",    left: 70, top: 47 },
    { id: "RM",   label: "MD", positionGroup: "Milieu",    left: 90, top: 47 },
    { id: "ST1",  label: "AT", positionGroup: "Attaquant", left: 35, top: 20 },
    { id: "ST2",  label: "AT", positionGroup: "Attaquant", left: 65, top: 20 },
  ],
  "3-4-3": [
    { id: "GK",   label: "GB", positionGroup: "Gardien",   left: 50, top: 85 },
    { id: "CB1",  label: "DC", positionGroup: "Défenseur", left: 25, top: 68 },
    { id: "CB2",  label: "DC", positionGroup: "Défenseur", left: 50, top: 68 },
    { id: "CB3",  label: "DC", positionGroup: "Défenseur", left: 75, top: 68 },
    { id: "LM",   label: "MG", positionGroup: "Milieu",    left: 18, top: 48 },
    { id: "CM1",  label: "MC", positionGroup: "Milieu",    left: 38, top: 48 },
    { id: "CM2",  label: "MC", positionGroup: "Milieu",    left: 62, top: 48 },
    { id: "RM",   label: "MD", positionGroup: "Milieu",    left: 82, top: 48 },
    { id: "LW",   label: "AG", positionGroup: "Attaquant", left: 18, top: 22 },
    { id: "ST",   label: "AT", positionGroup: "Attaquant", left: 50, top: 16 },
    { id: "RW",   label: "AD", positionGroup: "Attaquant", left: 82, top: 22 },
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

const GROUP_COLORS = {
  Gardien:   { bg: "from-yellow-400 to-yellow-500", border: "#fde68a", badge: "rgba(113,63,18,0.85)" },
  Défenseur: { bg: "from-blue-500 to-blue-600",     border: "#93c5fd", badge: "rgba(23,37,84,0.85)" },
  Milieu:    { bg: "from-green-500 to-green-600",   border: "#86efac", badge: "rgba(20,83,45,0.85)" },
  Attaquant: { bg: "from-red-500 to-red-600",       border: "#fca5a5", badge: "rgba(127,29,29,0.85)" },
  any:       { bg: "from-slate-500 to-slate-600",   border: "#cbd5e1", badge: "rgba(15,23,42,0.85)" },
};

function PlayerCard({ slot, player, onClick, cardW, photoH }) {
  const colors = GROUP_COLORS[slot.positionGroup] || GROUP_COLORS.any;
  const fontSize = Math.max(9, cardW * 0.15);

  if (!player) {
    return (
      <button
        onClick={onClick}
        style={{
          width: cardW,
          height: cardW * 1.25,
          borderColor: colors.border,
        }}
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white/10 active:bg-white/30 transition-all active:scale-95 touch-manipulation"
      >
        <Plus style={{ width: cardW * 0.3, height: cardW * 0.3 }} className="text-white/70" />
        <span style={{ fontSize: fontSize - 1 }} className="text-white/70 mt-1 font-bold">{slot.label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{ width: cardW, borderColor: colors.border }}
      className={`flex flex-col items-center rounded-xl overflow-hidden border-2 shadow-lg bg-gradient-to-b ${colors.bg} active:scale-95 transition-all touch-manipulation`}
    >
      <div
        style={{ height: photoH }}
        className="w-full bg-black/20 overflow-hidden flex items-center justify-center"
      >
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.nom} className="w-full h-full object-cover object-top" />
        ) : (
          <span style={{ fontSize: cardW * 0.35 }} className="text-white font-black leading-none">
            {player.nom[0]}
          </span>
        )}
      </div>
      <div className="w-full px-0.5 py-1 text-center">
        <div
          style={{ fontSize: fontSize - 1, backgroundColor: colors.badge }}
          className="text-white/95 rounded px-0.5 mb-0.5 font-bold inline-block"
        >
          {slot.label}
        </div>
        <div style={{ fontSize: fontSize }} className="text-white font-semibold leading-tight truncate w-full px-0.5">
          {player.nom.split(" ").pop()}
        </div>
        {player.valeur_marchande && (
          <div style={{ fontSize: fontSize - 1 }} className="text-white/80 font-bold">
            {player.valeur_marchande}M
          </div>
        )}
      </div>
    </button>
  );
}

export default function FootballPitch({ formation = "4-3-3", players = [], initialLineup = {}, onLineupChange }) {
  const slots = FORMATIONS[formation] || FORMATIONS["4-3-3"];
  const [lineup, setLineup] = useState(initialLineup);
  const [pickerSlot, setPickerSlot] = useState(null);
  const pitchRef = useRef(null);
  const [pitchWidth, setPitchWidth] = useState(320);

  // Measure pitch width for responsive card sizing
  useEffect(() => {
    const measure = () => {
      if (pitchRef.current) {
        setPitchWidth(pitchRef.current.offsetWidth);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (pitchRef.current) ro.observe(pitchRef.current);
    return () => ro.disconnect();
  }, []);

  // Card size: 12% of pitch width, min 42px, max 72px
  const cardW = Math.min(72, Math.max(42, pitchWidth * 0.12));
  const photoH = cardW * 0.85;

  const updateLineup = (newLineup) => {
    setLineup(newLineup);
    onLineupChange?.(newLineup);
  };

  const handleSelect = (player) => {
    const newLineup = { ...lineup, [pickerSlot.id]: player || undefined };
    if (!player) delete newLineup[pickerSlot.id];
    updateLineup(newLineup);
    setPickerSlot(null);
  };

  const startingValue = slots.map(s => lineup[s.id]?.valeur_marchande || 0).reduce((a, b) => a + b, 0);
  const benchValue = BENCH_SLOTS.map(s => lineup[s.id]?.valeur_marchande || 0).reduce((a, b) => a + b, 0);
  const filledSlots = slots.filter(s => lineup[s.id]).length;

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center justify-between bg-slate-800 rounded-xl px-3 py-2.5 text-white">
        <span className="text-xs text-slate-300">
          <span className="font-bold text-white text-base">{filledSlots}</span>/11
        </span>
        <span className="text-xs text-slate-300">
          XI : <span className="font-bold text-green-400">{startingValue}M€</span>
        </span>
        <span className="text-xs text-slate-300">
          Total : <span className="font-bold text-blue-400">{(startingValue + benchValue).toFixed(0)}M€</span>
        </span>
      </div>

      {/* Pitch */}
      <div
        ref={pitchRef}
        className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{
          paddingBottom: "130%",
          background: "linear-gradient(180deg,#166534 0%,#15803d 15%,#16a34a 30%,#15803d 45%,#16a34a 60%,#15803d 75%,#166534 100%)"
        }}
      >
        {/* Field lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 130" preserveAspectRatio="none">
          <rect x="4" y="2" width="92" height="126" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
          <line x1="4" y1="65" x2="96" y2="65" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
          <circle cx="50" cy="65" r="11" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
          <circle cx="50" cy="65" r="0.8" fill="rgba(255,255,255,0.4)" />
          <rect x="25" y="2" width="50" height="17" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
          <rect x="36" y="2" width="28" height="9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
          <rect x="25" y="111" width="50" height="17" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
          <rect x="36" y="119" width="28" height="9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
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
              cardW={cardW}
              photoH={photoH}
            />
          </div>
        ))}
      </div>

      {/* Bench */}
      <div className="bg-slate-900 rounded-2xl p-3">
        <div className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">
          Banc de touche
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {BENCH_SLOTS.map(slot => (
            <div key={slot.id} className="flex-shrink-0">
              <PlayerCard
                slot={slot}
                player={lineup[slot.id]}
                onClick={() => setPickerSlot(slot)}
                cardW={Math.min(60, Math.max(48, pitchWidth * 0.11))}
                photoH={Math.min(52, Math.max(40, pitchWidth * 0.095))}
              />
            </div>
          ))}
        </div>
      </div>

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