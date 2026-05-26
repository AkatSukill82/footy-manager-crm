import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Square, AlertTriangle, HeartPulse, ArrowRightLeft,
  Trophy, Globe, Users, Building2, MapPin, User2, Briefcase,
  Shirt, Star
} from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

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
  const { lang } = useLanguage();

  return (
    <div className="space-y-5">

      <Section title={t(lang, 'playerDetail.sectionClub')}>
        <Stat icon={Building2} label={t(lang, 'playerDetail.statCurrentClub')} value={player.club_actuel} bg="bg-blue-50" color="text-blue-700" />
        <Stat icon={MapPin} label={t(lang, 'playerDetail.statLeague')} value={player.ligue} bg="bg-blue-50" color="text-blue-700" />
        <Stat icon={MapPin} label={t(lang, 'playerDetail.statStadium')} value={player.stade} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={User2} label={t(lang, 'playerDetail.statCoach')} value={player.coach} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={Briefcase} label={t(lang, 'playerDetail.statManager')} value={player.manager} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={Shirt} label={t(lang, 'playerDetail.statJerseyNumber')} value={player.numero_maillot ? `#${player.numero_maillot}` : null} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={Users} label={t(lang, 'playerDetail.statAgent')} value={player.agent} bg="bg-slate-50" color="text-slate-700" />
      </Section>

      <Section title={t(lang, 'playerDetail.sectionStats')}>
        <Stat icon={Activity} label={t(lang, 'playerDetail.statMatchesPlayed')} value={player.matchs_joues} bg="bg-green-50" color="text-green-700" />
        <Stat icon={Star} label={t(lang, 'playerDetail.statRating')} value={player.note_moyenne ? `${player.note_moyenne} / 10` : null} bg="bg-yellow-50" color="text-yellow-700" />
        <Stat icon={Activity} label={t(lang, 'playerDetail.statGoals')} value={player.buts} bg="bg-green-50" color="text-green-700" />
        <Stat icon={Activity} label={t(lang, 'playerDetail.statAssists')} value={player.passes_decisives} bg="bg-green-50" color="text-green-700" />
        <Stat icon={Square} label={t(lang, 'playerDetail.statYellowCards')} value={player.cartons_jaunes} bg="bg-yellow-50" color="text-yellow-700" />
        <Stat icon={AlertTriangle} label={t(lang, 'playerDetail.statRedCards')} value={player.cartons_rouges} bg="bg-red-50" color="text-red-700" />
        <Stat icon={HeartPulse} label={t(lang, 'playerDetail.statInjuries')} value={player.blessures} bg="bg-red-50" color="text-red-700" />
        <Stat icon={ArrowRightLeft} label={t(lang, 'playerDetail.statClubsCount')} value={player.nb_clubs ?? (transfers.length > 0 ? transfers.length : null)} bg="bg-purple-50" color="text-purple-700" />
      </Section>

      <Section title={t(lang, 'playerDetail.sectionCareer')}>
        <Stat icon={Activity} label={t(lang, 'playerDetail.statCareerMatches')} value={player.matchs_carriere} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={Activity} label={t(lang, 'playerDetail.statCareerGoals')} value={player.buts_carriere} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={Activity} label={t(lang, 'playerDetail.statCareerAssists')} value={player.passes_carriere} bg="bg-slate-50" color="text-slate-700" />
        <Stat icon={Globe} label={t(lang, 'playerDetail.statIntlCaps')} value={player.matchs_international} bg="bg-blue-50" color="text-blue-700" />
        <Stat icon={Globe} label={t(lang, 'playerDetail.statIntlGoals')} value={player.buts_international} bg="bg-blue-50" color="text-blue-700" />
      </Section>

      {player.palmares && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" /> {t(lang, 'playerDetail.sectionTrophies')}
          </h4>
          <div className="bg-yellow-50 rounded-xl p-3 flex flex-wrap gap-1.5">
            {player.palmares.split(",").map((tr, i) => (
              <Badge key={i} className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs font-medium">
                🏆 {tr.trim()}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {player.stats_resume && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            {t(lang, 'playerDetail.sectionCareerSummary')}
          </h4>
          <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">{player.stats_resume}</p>
        </div>
      )}
    </div>
  );
}
