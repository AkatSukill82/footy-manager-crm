import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, SearchCheck, Save, ChevronDown, ChevronUp } from 'lucide-react-native';
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

  // Full profile state
  const [result, setResult] = useState(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [showAllStats, setShowAllStats] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (playerData) => {
      const { _searchId, transferts: tList, ...rest } = playerData;
      const created = await base44.entities.Player.create(sanitizePlayerData(rest));
      // Créer les transferts associés
      if (tList?.length > 0) {
        for (const t of tList.slice(0, 10)) {
          try {
            await base44.entities.Transfer.create({
              player_id: created.id,
              club_depart: t.club_depart || '',
              club_arrivee: t.club_arrivee || '',
              date_transfert: t.date,
              type_transfert: t.type || 'Inconnu',
            });
          } catch {}
        }
      }
      return { created, _searchId };
    },
    onSuccess: ({ created, _searchId }) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setSavedIds(prev => new Set([...prev, _searchId]));
    },
  });

  const searchPlayers = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setResult(null);
    try {
      const res = await base44.functions.invoke('apiFootballProxy', {
        action: 'searchPlayer',
        name: query.trim(),
      });

      if (res?.players?.length > 0) {
        const mapped = res.players.map((p, i) => ({
          ...p,
          _searchId: `${p.nom}_${p.prenom || ''}_${i}`,
        }));
        setResults(mapped);
        // Si un seul résultat, charger automatiquement le profil complet
        if (mapped.length === 1) {
          fetchFullProfile(mapped[0]);
        }
      } else {
        Alert.alert('Aucun résultat', `Aucun joueur trouvé pour "${query.trim()}".`);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'effectuer la recherche. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const buildResult = (candidate) => {
    setResult({
      ...candidate,
      nom_complet: [candidate.prenom, candidate.nom].filter(Boolean).join(' '),
      toutes_stats: candidate.toutes_stats || [],
      transferts: [],
      blessures_liste: [],
      stats_saison: candidate.stats_saison,
    });
  };

  const fetchFullProfile = async (candidate) => {
    setLoadingFull(true);
    setLoadingStatus('Chargement du profil complet...');
    try {
      const fullRes = await base44.functions.invoke('apiFootballProxy', {
        action: 'getPlayerFull',
        id: candidate.id,
      });
      if (fullRes?.ok && fullRes.player) {
        setResult({
          ...fullRes.player,
          _searchId: candidate._searchId,
          nom_complet: [fullRes.player.prenom, fullRes.player.nom].filter(Boolean).join(' '),
          toutes_stats: fullRes.toutes_stats || [],
          transferts: fullRes.transferts || [],
          blessures_liste: fullRes.blessures || [],
          stats_saison: fullRes.player.stats_saison,
        });
      } else {
        buildResult(candidate);
      }
    } catch (e) {
      buildResult(candidate);
    } finally {
      setLoadingFull(false);
      setLoadingStatus('');
    }
  };

  const handleSaveToApp = () => {
    if (!result) return;
    const { nom_complet, toutes_stats, blessures_liste, transferts: tList, stats_saison, _searchId, ...raw } = result;
    const flat = {
      ...raw,
      buts:             stats_saison?.buts             ?? raw.buts,
      passes_decisives: stats_saison?.passes_decisives ?? raw.passes_decisives,
      minutes_jouees:   stats_saison?.minutes          ?? raw.minutes_jouees,
    };
    saveMutation.mutate({ ...sanitizePlayerData(flat), _searchId, transferts: tList });
  };

  const savePlayer = (player) => {
    const { _searchId, stats_saison, toutes_stats, transferts: tList, blessures_liste, ...raw } = player;
    const flat = {
      ...raw,
      buts:             stats_saison?.buts             ?? raw.buts,
      passes_decisives: stats_saison?.passes_decisives ?? raw.passes_decisives,
      minutes_jouees:   stats_saison?.minutes          ?? raw.minutes_jouees,
    };
    saveMutation.mutate({ ...sanitizePlayerData(flat), _searchId, transferts: tList || [] });
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

        {/* Liste des candidats (plusieurs résultats) */}
        {results.length > 1 && !result && (
          <View className="gap-3">
            <Text className="font-bold text-slate-900">{results.length} résultats — sélectionnez un joueur</Text>
            {results.map((player, i) => {
              const s = player.stats_saison;
              return (
                <TouchableOpacity key={i} onPress={() => fetchFullProfile(player)}>
                  <Card>
                    <CardContent className="pt-4">
                      <View className="flex-row items-center gap-3">
                        {player.photo_url ? (
                          <Image
                            source={{ uri: player.photo_url }}
                            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9' }}
                          />
                        ) : (
                          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 16, color: '#94a3b8' }}>👤</Text>
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className="font-bold text-slate-900">{player.prenom} {player.nom}</Text>
                          <Text className="text-sm text-slate-500">{player.club_actuel} · {player.nationalite}</Text>
                        </View>
                        <View className="flex-row gap-2">
                          {player.poste ? <Badge variant="secondary">{player.poste}</Badge> : null}
                          {player.age ? <Badge variant="secondary">{player.age} ans</Badge> : null}
                        </View>
                      </View>
                      {s && (
                        <View className="flex-row gap-4 pt-2 mt-2 border-t border-slate-50">
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
                        </View>
                      )}
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Chargement du profil complet */}
        {loadingFull && (
          <View className="items-center py-8 gap-3">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-slate-500">{loadingStatus}</Text>
          </View>
        )}

        {/* Profil complet */}
        {result && !loadingFull && (
          <View className="gap-4">
            {/* Header joueur */}
            <Card>
              <CardContent className="pt-4">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    {result.photo_url ? (
                      <Image
                        source={{ uri: result.photo_url }}
                        style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#f1f5f9' }}
                      />
                    ) : (
                      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 22, color: '#94a3b8' }}>👤</Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="font-bold text-slate-900 text-lg">{result.prenom} {result.nom}</Text>
                      <Text className="text-sm text-slate-500">{result.club_actuel}</Text>
                      {result.nationalite ? <Text className="text-xs text-slate-400">{result.nationalite}</Text> : null}
                    </View>
                  </View>
                  <Button
                    size="sm"
                    variant={savedIds.has(result._searchId) ? 'secondary' : 'default'}
                    onPress={() => !savedIds.has(result._searchId) && handleSaveToApp()}
                    loading={saveMutation.isPending}
                    icon={<Save size={14} color={savedIds.has(result._searchId) ? '#64748b' : 'white'} />}
                  >
                    {savedIds.has(result._searchId) ? 'Sauvé' : 'Sauver'}
                  </Button>
                </View>

                <View className="flex-row gap-2 flex-wrap mb-3">
                  {result.poste ? <Badge variant="secondary">{result.poste}</Badge> : null}
                  {result.age ? <Badge variant="secondary">{result.age} ans</Badge> : null}
                  {result.ligue ? <Badge variant="secondary">{result.ligue}</Badge> : null}
                  {result.taille ? <Badge variant="secondary">{result.taille} cm</Badge> : null}
                </View>

                {result.stats_saison && (
                  <View className="flex-row gap-3 pt-3 border-t border-slate-100">
                    <View className="flex-1 items-center">
                      <Text className="font-bold text-green-600 text-lg">{result.stats_saison.buts ?? '—'}</Text>
                      <Text className="text-xs text-slate-400">Buts</Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="font-bold text-blue-600 text-lg">{result.stats_saison.passes_decisives ?? '—'}</Text>
                      <Text className="text-xs text-slate-400">Passes D</Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="font-bold text-slate-700 text-lg">{result.stats_saison.matchs ?? '—'}</Text>
                      <Text className="text-xs text-slate-400">Matchs</Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="font-bold text-slate-700 text-lg">{result.stats_saison.minutes ?? '—'}</Text>
                      <Text className="text-xs text-slate-400">Min</Text>
                    </View>
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Stats multi-saisons */}
            {result.toutes_stats?.length > 0 && (
              <Card>
                <CardHeader>
                  <TouchableOpacity
                    onPress={() => setShowAllStats(v => !v)}
                    className="flex-row items-center justify-between"
                  >
                    <CardTitle>Statistiques par saison ({result.toutes_stats.length})</CardTitle>
                    {showAllStats
                      ? <ChevronUp size={16} color="#64748b" />
                      : <ChevronDown size={16} color="#64748b" />}
                  </TouchableOpacity>
                </CardHeader>
                {showAllStats && (
                  <CardContent>
                    {/* En-têtes */}
                    <View className="flex-row py-1 mb-1 border-b border-slate-100">
                      <Text className="text-xs font-semibold text-slate-500 w-14">Saison</Text>
                      <Text className="text-xs font-semibold text-slate-500 flex-1">Club</Text>
                      <Text className="text-xs font-semibold text-slate-500 w-8 text-center">MJ</Text>
                      <Text className="text-xs font-semibold text-green-600 w-8 text-center">B</Text>
                      <Text className="text-xs font-semibold text-blue-600 w-8 text-center">PD</Text>
                      <Text className="text-xs font-semibold text-slate-500 w-12 text-right">Min</Text>
                    </View>
                    {result.toutes_stats.map((s, i) => (
                      <View key={i} className="flex-row py-1.5 border-b border-slate-50">
                        <Text className="text-xs text-slate-700 font-semibold w-14">{s.saison || '—'}</Text>
                        <Text className="text-xs text-slate-600 flex-1" numberOfLines={1}>{s.club || '—'}</Text>
                        <Text className="text-xs text-slate-700 w-8 text-center">{s.matchs ?? '—'}</Text>
                        <Text className="text-xs font-bold text-green-600 w-8 text-center">{s.buts ?? '—'}</Text>
                        <Text className="text-xs font-bold text-blue-600 w-8 text-center">{s.passes_decisives ?? s.passes ?? '—'}</Text>
                        <Text className="text-xs text-slate-500 w-12 text-right">{s.minutes ?? '—'}</Text>
                      </View>
                    ))}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Historique transferts */}
            {result.transferts?.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Historique transferts ({result.transferts.length})</CardTitle></CardHeader>
                <CardContent>
                  {result.transferts.map((t, i) => (
                    <View key={i} className="flex-row items-center justify-between py-2 border-b border-slate-50">
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-slate-900" numberOfLines={1}>
                          {t.club_depart || '?'} → {t.club_arrivee || '?'}
                        </Text>
                        <Text className="text-xs text-slate-400">{t.date || 'Date inconnue'}</Text>
                      </View>
                      {t.type ? <Badge variant="secondary">{t.type}</Badge> : null}
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Blessures */}
            {result.blessures_liste?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Blessures ({result.blessures_liste.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {result.blessures_liste.map((b, i) => (
                    <View key={i} className="flex-row items-center justify-between py-2 border-b border-slate-50">
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-slate-900">{b.raison || b.type || 'Inconnu'}</Text>
                        <Text className="text-xs text-slate-400">{b.club || ''}{b.date ? ` · ${b.date}` : ''}</Text>
                      </View>
                      {b.saison ? <Badge variant="secondary">{b.saison}</Badge> : null}
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Bouton retour à la liste si plusieurs candidats */}
            {results.length > 1 && (
              <TouchableOpacity onPress={() => setResult(null)} className="py-2">
                <Text className="text-sm text-blue-600 font-semibold text-center">
                  ← Retour aux résultats ({results.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
