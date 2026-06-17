import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "../lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Sparkles, Search, Filter, AlertCircle, X } from "lucide-react";
import ShareContentModal from "../components/network/ShareContentModal";
import SharedContentCard from "../components/network/SharedContentCard";
import InsightCard from "../components/network/InsightCard";
import AgentInsightGenerator from "../components/network/AgentInsightGenerator";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

export default function AgentNetworkPage() {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("shared");
  const [mutationError, setMutationError] = useState(null);

  const user = useCurrentUser();

  const { data: sharedContents = [], isLoading: loadingShared } = useQuery({
    queryKey: ['sharedContents'],
    queryFn: () => base44.entities.SharedContent.list('-created_date'),
  });

  const { data: agentInsights = [], isLoading: loadingInsights } = useQuery({
    queryKey: ['agentInsights'],
    queryFn: () => base44.entities.AgentInsight.list('-created_date'),
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players', user?.id],
    queryFn: () => base44.entities.Player.filter({ created_by_id: user.id }),
    enabled: !!user?.id,
  });

  const userEmail = user?.email;
  const { data: teams = [] } = useQuery({
    queryKey: ['teams', userEmail],
    queryFn: () => base44.entities.Team.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const createContentMutation = useMutation({
    mutationFn: (data) => base44.entities.SharedContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedContents'] });
      setShowShareModal(false);
    },
    onError: (err) => setMutationError(err.message || "Erreur lors du partage"),
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
    onError: (err) => setMutationError(err.message || "Erreur lors du like"),
  });

  const filteredSharedContents = sharedContents.filter(content => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (content.titre || "").toLowerCase().includes(q) ||
                         (content.description || "").toLowerCase().includes(q);
    const matchesType = filterType === "all" || content.type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredInsights = agentInsights.filter(insight => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (insight.titre || "").toLowerCase().includes(q) ||
                         (insight.contenu || "").toLowerCase().includes(q);
    return matchesSearch;
  });

  return (
    <div className="p-8 space-y-8">
      {mutationError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{mutationError}</span>
          <button onClick={() => setMutationError(null)} className="hover:text-red-900"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">{t(lang, 'network.title')}</h1>
          <p className="text-slate-500 mt-2">{t(lang, 'network.subtitle')}</p>
        </div>
        <Button 
          onClick={() => setShowShareModal(true)}
          className="bg-slate-900 hover:bg-slate-800 shadow-lg"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {t(lang, 'network.shareBtn')}
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(lang, 'network.searchPlh')}
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
                  <SelectItem value="all">{t(lang, 'network.filterAll')}</SelectItem>
                  <SelectItem value="player_profile">{t(lang, 'network.filterPlayerProfiles')}</SelectItem>
                  <SelectItem value="team_analysis">{t(lang, 'network.filterTeamAnalysis')}</SelectItem>
                  <SelectItem value="market_insight">{t(lang, 'network.filterMarketInsight')}</SelectItem>
                  <SelectItem value="transfer_opportunity">{t(lang, 'network.filterOpportunities')}</SelectItem>
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
            {t(lang, 'network.tabShared', { count: filteredSharedContents.length })}
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
            {t(lang, 'network.tabInsights', { count: filteredInsights.length })}
          </button>
        </div>
      </div>

      {activeTab === "shared" && loadingShared && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      )}
      {activeTab === "shared" && !loadingShared && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSharedContents.map(content => {
            const player = content.player_id ? players.find(p => p.id === content.player_id) : null;
            const team = content.team_id ? teams.find(tm => tm.id === content.team_id) : null;
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

      {activeTab === "insights" && loadingInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      )}
      {activeTab === "insights" && !loadingInsights && (
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
              <p className="text-slate-500">{t(lang, 'network.noInsights')}</p>
              <p className="text-sm text-slate-400 mt-1">{t(lang, 'network.noInsightsHint')}</p>
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