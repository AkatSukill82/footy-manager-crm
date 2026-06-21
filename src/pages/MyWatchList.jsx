import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Loader2, Trash2, UserCheck, Zap, FileText, Eye, Edit2, AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import TransfermarktImage from "../components/ui/TransfermarktImage";
import { useCurrentUser } from "../lib/useCurrentUser";
import PlayerStatusModal, { STATUTS, statutConfig } from "../components/players/PlayerStatusModal";
import { format } from "date-fns";

const TABS = (lang) => [
  { value: "all", label: t(lang, 'watchlist.tabAll'), Icon: Star },
  { value: "Client", label: t(lang, 'watchlist.tabClient'), Icon: UserCheck },
  { value: "Prospect", label: t(lang, 'watchlist.tabProspect'), Icon: Zap },
  { value: "Mandaté", label: t(lang, 'watchlist.tabMandated'), Icon: FileText },
  { value: "En observation", label: t(lang, 'watchlist.tabWatching'), Icon: Eye },
];

function PlayerRow({ item, player, note, onEditStatus, onRemove, lang }) {
  const navigate = useNavigate();
  const sc = statutConfig(item.statut);
  const Icon = sc.Icon || Eye;

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-slate-200 hover:shadow-sm transition-all">
      <div className={`h-0.5 ${sc.bg.split(' ')[0]}`} />
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Photo */}
          <div
            className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center flex-shrink-0 cursor-pointer border border-slate-200"
            onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + player.id)}
          >
            <TransfermarktImage
              src={player.photo_url}
              alt={player.nom}
              className="w-full h-full object-cover"
              fallback={<Star className="w-7 h-7 text-slate-400" />}
            />
          </div>

          {/* Info */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + player.id)}
          >
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base leading-tight">{player.nom}</h3>
              <Badge className={`text-xs border flex items-center gap-1 ${sc.badge}`}>
                <Icon className="w-3 h-3" />
                {item.statut}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {player.poste && (
                <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {player.poste}
                </span>
              )}
              {player.club_actuel && (
                <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {player.club_actuel}
                </span>
              )}
              {player.age && (
                <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {player.age} ans
                </span>
              )}
              {player.valeur_marchande && (
                <span className="text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                  {player.valeur_marchande} M€
                </span>
              )}
            </div>
            {/* Scout note if exists */}
            {note && (
              <div className="flex items-center gap-2 mt-1.5">
                {note.evaluation != null && (
                  <span className="text-sm font-bold text-slate-800">{note.evaluation}/10</span>
                )}
                {note.interet && (
                  <Badge className="text-[10px] bg-slate-100 text-slate-600 border-slate-200">
                    Intérêt : {note.interet}
                  </Badge>
                )}
                {note.note && (
                  <span className="text-xs text-slate-400 italic line-clamp-1">"{note.note}"</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onEditStatus(item, player)}
            >
              <Edit2 className="w-3 h-3 mr-1" />
              {t(lang, 'watchlist.statusBtn')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Retirer de la watchlist"
              className="h-8 text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Contract alert */}
        {player.contrat_fin && (() => {
          const end = new Date(player.contrat_fin);
          const now = new Date();
          const months = Math.round((end - now) / (1000 * 60 * 60 * 24 * 30));
          if (months < 0) return (
            <div className="mt-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-1.5">
              {t(lang, 'watchlist.contractExpired', { date: format(end, "MM/yyyy") })}
            </div>
          );
          if (months <= 6) return (
            <div className="mt-2 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-lg px-3 py-1.5">
              {t(lang, 'watchlist.contractExpiring', { months, date: format(end, "MM/yyyy") })}
            </div>
          );
          return null;
        })()}
      </div>
    </div>
  );
}

export default function MyWatchListPage() {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [modalData, setModalData] = useState(null); // { item, player }
  const [mutationError, setMutationError] = useState(null);
  const user = useCurrentUser();
  const userEmail = user?.email;

  const { data: watchList = [], isLoading } = useQuery({
    queryKey: ['watchList', userEmail],
    queryFn: () => base44.entities.WatchList.filter({}),
    enabled: !!userEmail,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players', user?.id],
    queryFn: () => base44.entities.Player.filter({}),
    enabled: !!user?.id,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['myNotes', userEmail],
    queryFn: () => base44.entities.PlayerNote.filter({}),
    enabled: !!userEmail,
  });

  const updateWatchListMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WatchList.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchList', userEmail] }),
    onError: (err) => setMutationError(err.message || "Erreur lors de la mise à jour"),
  });

  const removeFromWatchListMutation = useMutation({
    mutationFn: (id) => base44.entities.WatchList.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchList', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['watchListItem'] });
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la suppression"),
  });

  const playersMap = useMemo(() => Object.fromEntries(players.map(p => [p.id, p])), [players]);
  const notesMap   = useMemo(() => Object.fromEntries(notes.map(n => [n.player_id, n])), [notes]);

  const enriched = useMemo(() =>
    watchList
      .map(w => ({ ...w, player: playersMap[w.player_id], note: notesMap[w.player_id] }))
      .filter(w => w.player),
    [watchList, playersMap, notesMap]
  );

  const filtered = useMemo(() =>
    activeTab === "all" ? enriched : enriched.filter(w => w.statut === activeTab),
    [enriched, activeTab]
  );

  const counts = useMemo(() =>
    Object.fromEntries(STATUTS.map(s => [s.value, enriched.filter(w => w.statut === s.value).length])),
    [enriched]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {mutationError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{mutationError}</span>
            <button onClick={() => setMutationError(null)} className="hover:text-red-900"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center gap-3">
          <Star className="w-8 h-8 fill-yellow-400 text-yellow-400 flex-shrink-0" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{t(lang, 'watchlist.title')}</h1>
            <p className="text-slate-500 text-sm">
              {t(lang, 'watchlist.count', { count: watchList.length })}
            </p>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS(lang).map(({ value, label, Icon }) => {
            const count = value === "all" ? enriched.length : (counts[value] || 0);
            const active = activeTab === value;
            const sc = value !== "all" ? statutConfig(value) : null;
            return (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                  active
                    ? sc ? `${sc.bg} ${sc.text} border-current` : "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    active ? "bg-white/30" : "bg-slate-100"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Summary cards by status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATUTS.map(({ value, bg, text, Icon }) => {
            const label = TABS(lang).find(tab => tab.value === value)?.label || value;
            return (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`${bg} rounded-2xl p-4 text-left transition-all hover:opacity-80 border border-transparent ${activeTab === value ? "ring-2 ring-current" : ""}`}
            >
              <Icon className={`w-5 h-5 ${text} mb-2`} />
              <div className={`text-2xl font-bold ${text}`}>{counts[value] || 0}</div>
              <div className={`text-xs font-medium ${text} opacity-70 mt-0.5`}>{label}</div>
            </button>
          );})}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-20 text-center">
            <Star className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg font-medium">
              {activeTab === "all"
                ? t(lang, 'watchlist.emptyAll')
                : t(lang, 'watchlist.emptyStatus', { status: activeTab })}
            </p>
            <p className="text-slate-400 mt-2 text-sm">
              {t(lang, 'watchlist.emptyHint')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <PlayerRow
                key={item.id}
                item={item}
                player={item.player}
                note={item.note}
                lang={lang}
                onEditStatus={(i, p) => setModalData({ item: i, player: p })}
                onRemove={(id) => removeFromWatchListMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status edit modal */}
      {modalData && (
        <PlayerStatusModal
          player={modalData.player}
          existingItem={modalData.item}
          open={!!modalData}
          onClose={() => setModalData(null)}
          onConfirm={(statut) =>
            updateWatchListMutation.mutateAsync({ id: modalData.item.id, data: { statut } }).catch(() => {})
          }
        />
      )}
    </div>
  );
}