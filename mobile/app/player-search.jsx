import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, SearchCheck, Save } from 'lucide-react-native';
import { base44 } from '../src/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import { formatCurrency, sanitizePlayerData } from '../src/utils';

export default function PlayerSearchPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());

  const saveMutation = useMutation({
    mutationFn: (playerData) => base44.entities.Player.create(sanitizePlayerData(playerData)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setSavedIds(prev => new Set([...prev, variables._searchId]));
    },
  });

  const searchPlayers = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await base44.functions.invoke('apiFootballProxy', {
        action: 'searchPlayer',
        name: query.trim(),
      });

      if (res?.players?.length > 0) {
        setResults(res.players.map((p, i) => ({
          ...p,
          _searchId: `${p.nom}_${p.prenom || ''}_${i}`,
        })));
      } else {
        Alert.alert('Aucun résultat', `Aucun joueur trouvé pour "${query.trim()}".`);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'effectuer la recherche. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const savePlayer = (player) => {
    const { _searchId, stats_saison, ...raw } = player;
    const flat = {
      ...raw,
      buts:             stats_saison?.buts             ?? raw.buts,
      passes_decisives: stats_saison?.passes_decisives ?? raw.passes_decisives,
      minutes_jouees:   stats_saison?.minutes          ?? raw.minutes_jouees,
    };
    saveMutation.mutate({ ...sanitizePlayerData(flat), _searchId });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <SearchCheck size={20} color="#16a34a" />
        <Text className="text-xl font-bold text-slate-900 flex-1">Recherche Joueurs</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {/* Barre de recherche */}
        <Card>
          <CardContent className="pt-4">
            <Input
              label="Nom du joueur"
              value={query}
              onChangeText={setQuery}
              placeholder="Ex: Kylian Mbappé, Haaland..."
              onSubmitEditing={searchPlayers}
              returnKeyType="search"
            />
            <Button onPress={searchPlayers} loading={loading} className="mt-3" icon={<SearchCheck size={16} color="white" />}>
              Rechercher
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <View className="items-center py-8 gap-3">
            <ActivityIndicator size="large" color="#16a34a" />
            <Text className="text-slate-500">Recherche via API-Football...</Text>
          </View>
        )}

        {results.length > 0 && (
          <View className="gap-3">
            <Text className="font-bold text-slate-900">{results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}</Text>
            {results.map((player, i) => {
              const isSaved = savedIds.has(player._searchId);
              const s = player.stats_saison;
              return (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-row items-center gap-3 flex-1">
                        {player.photo_url ? (
                          <Image
                            source={{ uri: player.photo_url }}
                            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9' }}
                          />
                        ) : (
                          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 18, color: '#94a3b8' }}>👤</Text>
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className="font-bold text-slate-900 text-base">{player.prenom} {player.nom}</Text>
                          <Text className="text-sm text-slate-500">{player.club_actuel} · {player.nationalite}</Text>
                        </View>
                      </View>
                      <Button
                        size="sm"
                        variant={isSaved ? 'secondary' : 'default'}
                        onPress={() => !isSaved && savePlayer(player)}
                        icon={<Save size={14} color={isSaved ? '#64748b' : 'white'} />}
                      >
                        {isSaved ? 'Sauvé' : 'Sauver'}
                      </Button>
                    </View>

                    <View className="flex-row gap-2 flex-wrap mb-2">
                      {player.poste ? <Badge variant="secondary">{player.poste}</Badge> : null}
                      {player.age ? <Badge variant="secondary">{player.age} ans</Badge> : null}
                      {player.ligue ? <Badge variant="secondary">{player.ligue}</Badge> : null}
                    </View>

                    {s && (
                      <View className="flex-row gap-4 py-2 border-t border-slate-50">
                        <View className="items-center">
                          <Text className="font-bold text-green-600">{s.buts ?? '—'}</Text>
                          <Text className="text-xs text-slate-400">Buts</Text>
                        </View>
                        <View className="items-center">
                          <Text className="font-bold text-blue-600">{s.passes_decisives ?? '—'}</Text>
                          <Text className="text-xs text-slate-400">Passes</Text>
                        </View>
                        <View className="items-center">
                          <Text className="font-bold text-slate-700">{s.minutes ?? '—'}</Text>
                          <Text className="text-xs text-slate-400">Min</Text>
                        </View>
                        {s.matchs_joues != null && (
                          <View className="items-center">
                            <Text className="font-bold text-slate-700">{s.matchs_joues}</Text>
                            <Text className="text-xs text-slate-400">Matchs</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
