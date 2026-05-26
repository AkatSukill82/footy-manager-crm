import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function TeamEfficiencyReport({ teams, teamPlayers, matches, players }) {
  const { lang } = useLanguage();

  const teamsWithStats = teams.map(team => {
    const teamPlayersList = teamPlayers.filter(tp => tp.team_id === team.id);
    const playerCount = teamPlayersList.length;
    const totalValue = teamPlayersList.reduce((sum, tp) => {
      const pl = players.find(p => p.id === tp.player_id);
      return sum + (pl?.valeur_marchande || 0);
    }, 0);

    const points = (team.victoires || 0) * 3 + (team.nuls || 0);
    const goalDiff = (team.buts_pour || 0) - (team.buts_contre || 0);
    const winRate = team.matchs_joues > 0 ? ((team.victoires || 0) / team.matchs_joues * 100) : 0;

    return {
      ...team,
      playerCount,
      totalValue,
      points,
      goalDiff,
      winRate,
      avgGoalsFor: team.matchs_joues > 0 ? (team.buts_pour / team.matchs_joues).toFixed(2) : 0,
      avgGoalsAgainst: team.matchs_joues > 0 ? (team.buts_contre / team.matchs_joues).toFixed(2) : 0
    };
  });

  const rankingData = [...teamsWithStats]
    .filter(tm => tm.matchs_joues > 0)
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff)
    .slice(0, 10)
    .map((tm, i) => ({
      rang: i + 1,
      nom: tm.nom.length > 12 ? tm.nom.substring(0, 10) + "..." : tm.nom,
      points: tm.points,
      victoires: tm.victoires,
      nuls: tm.nuls,
      defaites: tm.defaites
    }));

  const valueComparison = [...teamsWithStats]
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 8)
    .map(tm => ({
      nom: tm.nom.length > 10 ? tm.nom.substring(0, 8) + "..." : tm.nom,
      valeur: tm.totalValue.toFixed(1)
    }));

  const winRateData = [...teamsWithStats]
    .filter(tm => tm.matchs_joues > 0)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 8)
    .map(tm => ({
      nom: tm.nom.length > 10 ? tm.nom.substring(0, 8) + "..." : tm.nom,
      taux: tm.winRate.toFixed(1)
    }));

  const topTeams = [...teamsWithStats]
    .filter(tm => tm.matchs_joues > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const radarData = [
    { metric: t(lang, 'reports.wins'),     ...Object.fromEntries(topTeams.map(tm => [tm.nom, tm.victoires || 0])) },
    { metric: t(lang, 'reports.goalsFor'), ...Object.fromEntries(topTeams.map(tm => [tm.nom, tm.buts_pour || 0])) },
    { metric: t(lang, 'reports.goalDiff'), ...Object.fromEntries(topTeams.map(tm => [tm.nom, Math.max(0, tm.goalDiff)])) },
  ];

  const totalTeams = teams.length;
  const activeTeams = teams.filter(tm => tm.matchs_joues > 0).length;
  const totalMatches = matches.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{totalTeams}</div>
            <div className="text-sm text-slate-500 mt-2">{t(lang, 'reports.teamsCreated')}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{activeTeams}</div>
            <div className="text-sm text-slate-500 mt-2">{t(lang, 'reports.activeTeams')}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{totalMatches}</div>
            <div className="text-sm text-slate-500 mt-2">{t(lang, 'reports.matchesPlayed')}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t(lang, 'reports.teamsRanking')}</h3>
          {rankingData.length === 0 ? (
            <p className="text-center text-slate-500 py-8">{t(lang, 'reports.noMatchPlayed')}</p>
          ) : (
            <div className="space-y-2">
              {rankingData.map((team) => (
                <div key={team.rang} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {team.rang}
                    </div>
                    <span className="font-medium text-slate-900">{team.nom}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600 font-medium">
                      {team.victoires}V-{team.nuls}N-{team.defaites}D
                    </span>
                    <div className="bg-slate-900 text-white px-3 py-1 rounded-lg font-bold text-sm">
                      {team.points} {t(lang, 'reports.pts')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t(lang, 'reports.teamsValue')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={valueComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nom" angle={-45} textAnchor="end" height={80} stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="valeur" fill="#0f172a" radius={[8, 8, 0, 0]} name={t(lang, 'reports.valueMEur')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{t(lang, 'reports.winRate')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={winRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nom" angle={-45} textAnchor="end" height={80} stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="taux" fill="#0f172a" radius={[8, 8, 0, 0]} name={t(lang, 'reports.winRatePct')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {topTeams.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{t(lang, 'reports.globalPerf')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" stroke="#64748b" />
                <PolarRadiusAxis stroke="#64748b" />
                {topTeams.map((team, index) => (
                  <Radar
                    key={team.id}
                    name={team.nom}
                    dataKey={team.nom}
                    stroke={`hsl(${index * 72}, 70%, 50%)`}
                    fill={`hsl(${index * 72}, 70%, 50%)`}
                    fillOpacity={0.3}
                  />
                ))}
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
