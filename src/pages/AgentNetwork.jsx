import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Sparkles, Search, Filter } from "lucide-react";
import ShareContentModal from "../components/network/ShareContentModal";
import SharedContentCard from "../components/network/SharedContentCard";
import InsightCard from "../components/network/InsightCard";
import AgentInsightGenerator from "../components/network/AgentInsightGenerator";

export default function AgentNetworkPage() {
  const queryClient = useQueryClient();
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("shared");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: sharedContents = [] } = useQuery({
    queryKey: ['sharedContents'],
    queryFn: () => base44.entities.SharedContent.list('-created_date'),
  });

  const { data: agentInsights = [] } = useQuery({
    queryKey: ['agentInsights'],
    queryFn: () => base44.entities.AgentInsight.list('-created_date'),
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Team.filter({ created_by: user.email });
    },
  });

  const createContentMutation = useMutation({
    mutationFn: (data) => base44.entities.SharedContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedContents'] });
      setShowShareModal(false);
    },
  });

  const likeContentMutation = useMutation({
    mutationFn: async (contentId) => {
      const content = sharedContents.find(c => c.id === contentId);
      const newLikes = (content.likes || 0) + 1;
      await base44.entities.SharedContent.update(contentId, { likes: newLikes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedContents'] });
    },
  });

  const filteredSharedContents = sharedContents.filter(content => {
    const matchesSearch = content.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || content.type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredInsights = agentInsights.filter(insight => {
    const matchesSearch = insight.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         insight.contenu.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Réseau des Agents</h1>
          <p className="text-slate-500 mt-2">Partagez et découvrez des insights avec la communauté</p>
        </div>
        <Button 
          onClick={() => setShowShareModal(true)}
          className="bg-slate-900 hover:bg-slate-800 shadow-lg"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Partager du contenu
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher du contenu ou des insights..."
              className="pl-10"
            />
          </div>
          {activeTab === "shared" && (
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="player_profile">Profils joueurs</SelectItem>
                  <SelectItem value="team_analysis">Analyses d'équipe</SelectItem>
                  <SelectItem value="market_insight">Insights marché</SelectItem>
                  <SelectItem value="transfer_opportunity">Opportunités</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("shared")}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "shared"
                ? "bg-slate-900 text-white shadow-lg"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Share2 className="w-4 h-4 inline mr-2" />
            Contenus partagés ({filteredSharedContents.length})
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "insights"
                ? "bg-slate-900 text-white shadow-lg"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Insights IA ({filteredInsights.length})
          </button>
        </div>
      </div>

      {activeTab === "shared" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSharedContents.map(content => {
            const player = content.player_id ? players.find(p => p.id === content.player_id) : null;
            const team = content.team_id ? teams.find(t => t.id === content.team_id) : null;
            return (
              <SharedContentCard
                key={content.id}
                content={content}
                player={player}
                team={team}
                currentUserEmail={user?.email}
                onLike={(id) => likeContentMutation.mutate(id)}
              />
            );
          })}
        </div>
      )}

      {activeTab === "insights" && (
        <div className="space-y-6">
          <AgentInsightGenerator 
            onInsightGenerated={() => queryClient.invalidateQueries({ queryKey: ['agentInsights'] })}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInsights.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>

          {filteredInsights.length === 0 && !searchQuery && (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucun insight généré pour le moment</p>
              <p className="text-sm text-slate-400 mt-1">Utilisez le générateur ci-dessus pour commencer</p>
            </div>
          )}
        </div>
      )}

      <ShareContentModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSubmit={(data) => createContentMutation.mutate(data)}
        players={players}
        teams={teams}
      />
    </div>
  );
}