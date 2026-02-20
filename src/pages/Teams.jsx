import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search, Shield } from "lucide-react";
import TeamCard from "../components/teams/TeamCard";
import TeamForm from "../components/teams/TeamForm";

export default function TeamsPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Team.filter({ created_by: user.email });
    },
  });

  const { data: teamPlayers = [] } = useQuery({
    queryKey: ['team-players'],
    queryFn: () => base44.entities.TeamPlayer.list(),
  });

  const createTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowForm(false);
    },
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
  });

  const getPlayerCount = (teamId) => teamPlayers.filter(tp => tp.team_id === teamId).length;

  const filteredTeams = teams.filter(t =>
    !search || t.nom?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500">Chargement des équipes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-7 h-7 text-blue-600 flex-shrink-0" />
              <span className="truncate">Mes équipes</span>
            </h1>
            <p className="text-slate-500 mt-0.5 text-sm">{teams.length} équipe{teams.length > 1 ? 's' : ''} créée{teams.length > 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 flex-shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nouvelle équipe</span>
            <span className="sm:hidden">Nouvelle</span>
          </Button>
        </div>

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
              placeholder="Rechercher une équipe..."
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
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Aucune équipe créée</h3>
            <p className="text-slate-500 mb-6 text-sm">Créez votre première équipe pour commencer à gérer vos joueurs</p>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Créer une équipe
            </Button>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-16 text-slate-400">Aucune équipe ne correspond à la recherche</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                playersCount={getPlayerCount(team.id)}
                onDelete={() => {
                  if (confirm(`Supprimer l'équipe "${team.nom}" ?`)) deleteTeamMutation.mutate(team.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}