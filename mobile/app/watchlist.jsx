import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, Trash2, ChevronRight } from 'lucide-react-native';
import { base44 } from '../src/api/base44Client';
import { Card, CardContent } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import LoadingSpinner from '../src/components/ui/LoadingSpinner';
import EmptyState from '../src/components/ui/EmptyState';
import Avatar from '../src/components/ui/Avatar';
import { formatCurrency, daysUntil } from '../src/utils';

export default function WatchlistPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: watchList = [], isLoading, refetch } = useQuery({
    queryKey: ['my-watchlist'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.WatchList.filter({ created_by: user.email });
    },
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.WatchList.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-watchlist'] }),
  });

  if (isLoading) return <LoadingSpinner message="Chargement de la liste..." />;

  const watchedPlayers = watchList.map(w => {
    const player = players.find(p => p.id === w.player_id);
    return { ...w, player };
  }).filter(w => w.player);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <Star size={20} color="#f59e0b" />
        <View className="flex-1">
          <Text className="text-xl font-bold text-slate-900">Ma liste</Text>
          <Text className="text-sm text-slate-400">{watchedPlayers.length} joueur{watchedPlayers.length > 1 ? 's' : ''} suivi{watchedPlayers.length > 1 ? 's' : ''}</Text>
        </View>
      </View>

      {watchedPlayers.length === 0 ? (
        <EmptyState icon={Star} title="Liste vide" description="Ajoutez des joueurs depuis leur fiche pour les suivre ici." />
      ) : (
        <FlatList
          data={watchedPlayers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const p = item.player;
            const contractDays = daysUntil(p.date_fin_contrat);
            return (
              <View className="px-4 mt-3">
                <Card>
                  <CardContent className="pt-4">
                    <View className="flex-row items-center gap-3">
                      <Avatar src={p.photo_url} name={`${p.prenom} ${p.nom}`} size={44} />
                      <TouchableOpacity
                        className="flex-1"
                        onPress={() => router.push({ pathname: '/player-detail', params: { id: p.id } })}
                      >
                        <Text className="font-bold text-slate-900">{p.prenom} {p.nom}</Text>
                        <Text className="text-sm text-slate-500">{p.club_actuel} · {p.poste}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeMutation.mutate(item.id)} className="p-2 bg-red-50 rounded-xl">
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row gap-2 mt-3 flex-wrap">
                      {p.valeur_marchande ? <Badge variant="default">{formatCurrency(p.valeur_marchande)}</Badge> : null}
                      {p.age ? <Badge variant="secondary">{p.age} ans</Badge> : null}
                      {contractDays !== null && contractDays <= 365 && contractDays >= 0 ? (
                        <Badge variant={contractDays <= 90 ? 'destructive' : 'warning'}>Contrat {contractDays}j</Badge>
                      ) : null}
                      {item.statut ? <Badge variant="blue">{item.statut}</Badge> : null}
                    </View>
                  </CardContent>
                </Card>
              </View>
            );
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor="#16a34a" />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}
