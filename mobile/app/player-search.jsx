import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, SearchCheck, Plus, Save } from 'lucide-react-native';
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
    mutationFn: (playerData) => base44.entities.Player.create(playerData),
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
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un expert en football qui connait parfaitement les joueurs professionnels. L'utilisateur cherche: "${query}".

Génère des données réalistes pour 5 joueurs correspondant à cette recherche (comme si tu consultais Transfermarkt et SofaScore).
Inclus des joueurs réels ou fictifs mais réalistes.

Réponds en JSON: {
  "players": [{
    "nom": "...", "prenom": "...", "poste": "...", "age": 0, "nationalite": "...",
    "club_actuel": "...", "valeur_marchande": 0, "buts_saison": 0, "passes_saison": 0,
    "note_moyenne": 0.0, "pied_fort": "Droite|Gauche", "date_fin_contrat": "YYYY-MM-DD",
    "description": "..."
  }]
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            players: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nom: { type: 'string' }, prenom: { type: 'string' }, poste: { type: 'string' },
                  age: { type: 'number' }, nationalite: { type: 'string' }, club_actuel: { type: 'string' },
                  valeur_marchande: { type: 'number' }, buts_saison: { type: 'number' },
                  passes_saison: { type: 'number' }, note_moyenne: { type: 'number' },
                  pied_fort: { type: 'string' }, date_fin_contrat: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
      });

      if (result?.players) {
        setResults(result.players.map((p, i) => ({ ...p, _searchId: `${p.nom}_${p.prenom}_${i}` })));
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'effectuer la recherche. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const savePlayer = (player) => {
    const { _searchId, description, ...raw } = player;
    saveMutation.mutate({ ...sanitizePlayerData(raw), _searchId });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <SearchCheck size={20} color="#16a34a" />
        <Text className="text-xl font-bold text-slate-900 flex-1">Recherche Joueurs IA</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {/* Barre de recherche */}
        <Card>
          <CardContent className="pt-4">
            <Input
              label="Recherche IA"
              value={query}
              onChangeText={setQuery}
              placeholder="Ex: milieu offensif français de Ligue 1, moins de 25 ans"
              multiline
              numberOfLines={2}
            />
            <Button onPress={searchPlayers} loading={loading} className="mt-3" icon={<SearchCheck size={16} color="white" />}>
              Rechercher
            </Button>
          </CardContent>
        </Card>

        {loading && (
          <View className="items-center py-8 gap-3">
            <ActivityIndicator size="large" color="#16a34a" />
            <Text className="text-slate-500">Recherche en cours via l'IA...</Text>
          </View>
        )}

        {results.length > 0 && (
          <View className="gap-3">
            <Text className="font-bold text-slate-900">{results.length} résultats trouvés</Text>
            {results.map((player, i) => {
              const isSaved = savedIds.has(player._searchId);
              return (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="font-bold text-slate-900 text-base">{player.prenom} {player.nom}</Text>
                        <Text className="text-sm text-slate-500">{player.club_actuel} · {player.nationalite}</Text>
                      </View>
                      <Button
                        size="sm"
                        variant={isSaved ? 'secondary' : 'default'}
                        onPress={() => !isSaved && savePlayer(player)}
                        icon={<Save size={14} color={isSaved ? '#64748b' : 'white'} />}
                      >
                        {isSaved ? 'Sauvegardé' : 'Sauver'}
                      </Button>
                    </View>

                    <View className="flex-row gap-2 flex-wrap mb-2">
                      <Badge variant="secondary">{player.poste}</Badge>
                      {player.age ? <Badge variant="secondary">{player.age} ans</Badge> : null}
                      {player.valeur_marchande ? <Badge variant="default">{formatCurrency(player.valeur_marchande)}</Badge> : null}
                      {player.pied_fort ? <Badge variant="secondary">🦶 {player.pied_fort}</Badge> : null}
                    </View>

                    <View className="flex-row gap-4 py-2 border-y border-slate-50 mb-2">
                      <View className="items-center"><Text className="font-bold text-green-600">{player.buts_saison ?? '—'}</Text><Text className="text-xs text-slate-400">Buts</Text></View>
                      <View className="items-center"><Text className="font-bold text-blue-600">{player.passes_saison ?? '—'}</Text><Text className="text-xs text-slate-400">Passes</Text></View>
                      <View className="items-center"><Text className="font-bold text-orange-600">{player.note_moyenne?.toFixed(1) ?? '—'}</Text><Text className="text-xs text-slate-400">Note</Text></View>
                    </View>

                    {player.description && <Text className="text-xs text-slate-500 leading-relaxed">{player.description}</Text>}
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
