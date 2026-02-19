import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Square, AlertTriangle, HeartPulse, ArrowRightLeft,
  Trophy, Globe, Users, Building2, MapPin, User2, Briefcase,
  Shirt, Star
} from "lucide-react";

const Stat = ({ icon: Icon, label, value, color = "text-slate-700", bg = "bg-slate-50" }) => {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${bg}`}>
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 leading-none mb-0.5">{label}</p>
        <p className={`text-sm font-bold truncate ${color}`}>{value}</p>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => {
  const hasContent = React.Children.toArray(children).some(c => c !== null && c !== undefined && c !== false);
  if (!hasContent) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">{title}</h4>
      <div className="grid grid-cols-2 gap-2">
        {children}
      </div>
    </div>
  );
};

export default function PlayerStatsPanel({ player, transfers = [] }) {
  return (
    <div className="space-y-5">

      {/* Club & encadrement */}
      <Section title="Club & encadrement">
        <Stat icon={Building2} label="Club actuel" value={player.club_actuel} bg="bg-blue-50" color="text-blue-700" />
        <Stat icon={MapPin} label="Ligue" value={player.ligue} bg="bg-blue-50" color="text-blue-700" />
        <Stat icon={MapPin} label="Stade" value={player.stade} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={User2} label="Entraîneur" value={player.coach} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={Briefcase} label="Manager / DS" value={player.manager} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={Shirt} label="Numéro de maillot" value={player.numero_maillot ? `#${player.numero_maillot}` : null} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={Users} label="Agent" value={player.agent} bg="bg-slate-50" color="text-slate-700" />
      </Section>

      {/* Stats saison */}
      <Section title="Statistiques — Saison en cours">
        <Stat icon={Activity} label="Matchs joués" value={player.matchs_joues} bg="bg-green-50" color="text-green-700" />
        <Stat icon={Star} label="Note SofaScore" value={player.note_moyenne ? `${player.note_moyenne} / 10` : null} bg="bg-yellow-50" color="text-yellow-700" />
        <Stat icon={Activity} label="Buts" value={player.buts} bg="bg-green-50" color="text-green-700" />
        <Stat icon={Activity} label="Passes déc." value={player.passes_decisives} bg="bg-green-50" color="text-green-700" />
        <Stat icon={Square} label="Cartons jaunes" value={player.cartons_jaunes} bg="bg-yellow-50" color="text-yellow-700" />
        <Stat icon={AlertTriangle} label="Cartons rouges" value={player.cartons_rouges} bg="bg-red-50" color="text-red-700" />
        <Stat icon={HeartPulse} label="Blessures (carrière)" value={player.blessures} bg="bg-red-50" color="text-red-700" />
        <Stat icon={ArrowRightLeft} label="Clubs différents" value={player.nb_clubs ?? (transfers.length > 0 ? transfers.length : null)} bg="bg-purple-50" color="text-purple-700" />
      </Section>

      {/* Carrière */}
      <Section title="Carrière complète">
        <Stat icon={Activity} label="Matchs (carrière)" value={player.matchs_carriere} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={Activity} label="Buts (carrière)" value={player.buts_carriere} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={Activity} label="Passes (carrière)" value={player.passes_carriere} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={Globe} label="Sélections nationales" value={player.matchs_international} bg="bg-blue-50" color="text-blue-700" />
        <Stat icon={Globe} label="Buts en sélection" value={player.buts_international} bg="bg-blue-50" color="text-blue-700" />
      </Section>

      {/* Palmarès */}
      {player.palmares && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Palmarès
          </h4>
          <div className="bg-yellow-50 rounded-xl p-3 flex flex-wrap gap-1.5">
            {player.palmares.split(",").map((t, i) => (
              <Badge key={i} className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs font-medium">
                🏆 {t.trim()}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Résumé stats */}
      {player.stats_resume && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Résumé carrière</h4>
          <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">{player.stats_resume}</p>
        </div>
      )}
    </div>
  );
}