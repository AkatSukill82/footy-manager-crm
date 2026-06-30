import React, { useState } from "react";
import { withOrg } from "../lib/org";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search, Shield, AlertCircle, X, LayoutGrid } from "lucide-react";
import TeamCard from "../components/teams/TeamCard";
import TeamForm from "../components/teams/TeamForm";
import FormationProjection from "../components/teams/FormationProjection";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

export default function TeamsPage() {
  const { lang } = useLanguage();
  const [view, setView] = useState("projection");   // projection (par défaut) | teams
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [mutationError, setMutationError] = useState(null);
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const userEmail = currentUser?.email;

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', userEmail],
    queryFn: () => base44.entities.Team.filter({}),
    enabled: !!userEmail,
  });

  const { data: teamPlayers = [] } = useQuery({
    queryKey: ['team-players'],
    queryFn: () => base44.entities.TeamPlayer.list(),
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(withOrg(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowForm(false);
    },
    onError: (err) => setMutationError(err.message || (lang === "en" ? "Error creating the team" : lang === "es" ? "Error al crear el equipo" : "Erreur lors de la création de l'équipe")),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId) => {
      // Remove all players from team first
      const tps = teamPlayers.filter(tp => tp.team_id === teamId);
      await Promise.all(tps.map(tp => base44.entities.TeamPlayer.delete(tp.id)));
      return base44.entities.Team.delete(teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-players'] });
    },
    onError: (err) => setMutationError(err.message || (lang === "en" ? "Error deleting the team" : lang === "es" ? "Error al eliminar el equipo" : "Erreur lors de la suppression de l'équipe")),
  });

  const getPlayerCount = (teamId) => teamPlayers.filter(tp => tp.team_id === teamId).length;

  const filteredTeams = teams.filter(t =>
    !search || t.nom?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading && view === "teams") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500">{lang === "en" ? "Loading teams..." : lang === "es" ? "Cargando equipos..." : "Chargement des équipes..."}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {mutationError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{mutationError}</span>
            <button onClick={() => setMutationError(null)} className="hover:text-red-900"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-7 h-7 text-blue-600 flex-shrink-0" />
              <span className="truncate">{t(lang, 'teams.title')}</span>
            </h1>
            <p className="text-slate-500 mt-0.5 text-sm">
              {view === "projection" ? (lang === "en" ? "Projecting your squad onto a formation" : lang === "es" ? "Proyección de tu plantilla en una formación" : "Projection de votre effectif sur une formation") : t(lang, 'teams.count', { count: teams.length })}
            </p>
          </div>
          {view === "teams" && (
            <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 flex-shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t(lang, 'teams.newTeam')}</span>
              <span className="sm:hidden">{t(lang, 'common.create')}</span>
            </Button>
          )}
        </div>

        {/* Toggle de vue */}
        <div className="bg-white border border-slate-200 rounded-lg p-1 inline-flex gap-1">
          <button onClick={() => setView("projection")} className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 ${view === "projection" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"}`}>
            <LayoutGrid className="w-3.5 h-3.5" /> Projection formation
          </button>
          <button onClick={() => setView("teams")} className={`text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 ${view === "teams" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"}`}>
            <Shield className="w-3.5 h-3.5" /> Mes équipes
          </button>
        </div>

        {view === "projection" && <FormationProjection />}

        {view === "teams" && (<>
        {/* Form */}
        {showForm && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setShowForm(false)} />
            <div className="fixed inset-x-0 bottom-0 z-50 md:static md:z-auto bg-white rounded-t-2xl md:rounded-2xl shadow-2xl md:shadow-none p-1 pb-6 md:p-0">
              <div className="flex justify-center pt-2 pb-1 md:hidden">
                <div className="w-10 h-1 bg-slate-300 rounded-full" />
              </div>
              <TeamForm
                onSubmit={(data) => createTeamMutation.mutate(data)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </>
        )}

        {/* Search */}
        {teams.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t(lang, 'teams.searchPlh')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        )}

        {/* Grid */}
        {teams.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
            <Shield className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">{t(lang, 'teams.noTeams')}</h3>
            <p className="text-slate-500 mb-6 text-sm">{t(lang, 'teams.noTeamsHint')}</p>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> {t(lang, 'teams.createFirst')}
            </Button>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-16 text-slate-400">{t(lang, 'teams.noSearchResults')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                playersCount={getPlayerCount(team.id)}
                onDelete={() => {
                  if (confirm(t(lang, 'teams.deleteConfirm', { name: team.nom }))) deleteTeamMutation.mutate(team.id);
                }}
              />
            ))}
          </div>
        )}
        </>)}
      </div>
    </div>
  );
}