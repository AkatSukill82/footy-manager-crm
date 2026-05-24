import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sparkles, TrendingUp, Target, Zap } from 'lucide-react-native';
import { base44 } from '../src/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import Button from '../src/components/ui/Button';
import { formatCurrency, daysUntil } from '../src/utils';

export default function PredictivePage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: watchList = [] } = useQuery({
    queryKey: ['my-watchlist'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.WatchList.filter({ created_by: user.email });
    },
  });

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const watchedIds = new Set(watchList.map(w => w.player_id));
      const watchedPlayers = players.filter(p => watchedIds.has(p.id));
      const expiringContracts = players.filter(p => { const d = daysUntil(p.date_fin_contrat); return d !== null && d >= 0 && d <= 365; });

      const summary = {
        total: players.length,
        watched: watchedPlayers.length,
        expiringContracts: expiringContracts.length,
        avgAge: players.length ? (players.reduce((s, p) => s + (p.age || 0), 0) / players.length).toFixed(1) : 0,
        totalValue: players.reduce((s, p) => s + (p.valeur_marchande || 0), 0),
        topPlayers: players.filter(p => p.valeur_marchande).sort((a, b) => b.valeur_marchande - a.valeur_marchande).slice(0, 5).map(p => `${p.prenom} ${p.nom} (${p.valeur_marchande}M€)`),
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un analyste de football expert en data. Voici les données de la base:
- Total joueurs: ${summary.total}
- Joueurs surveillés: ${summary.watched}
- Contrats expirant <1 an: ${summary.expiringContracts}
- Âge moyen: ${summary.avgAge} ans
- Valeur totale: ${summary.totalValue}M€
- Top joueurs: ${summary.topPlayers.join(', ')}

Génère une analyse prédictive complète avec:
1. Trajectoires de carrière prometteuses (2-3 joueurs)
2. Risques à surveiller (contrats, forme)
3. Opportunités de transfert
4. Prédiction de valeur dans 12 mois

JSON: {
  "trajectoires": [{"joueur": "...", "prediction": "...", "evolution_valeur": "..."}],
  "risques": [{"type": "...", "description": "...", "urgence": "haute|moyenne|basse"}],
  "opportunites": [{"titre": "...", "detail": "..."}],
  "resume": "..."
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            trajectoires: { type: 'array', items: { type: 'object' } },
            risques: { type: 'array', items: { type: 'object' } },
            opportunites: { type: 'array', items: { type: 'object' } },
            resume: { type: 'string' },
          },
        },
      });

      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const urgenceBadge = { haute: 'destructive', moyenne: 'warning', basse: 'secondary' };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <Sparkles size={20} color="#8b5cf6" />
        <Text className="text-xl font-bold text-slate-900 flex-1">Dashboard Prédictif IA</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* KPIs */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-blue-50 rounded-2xl p-4">
            <Text className="text-2xl font-bold text-blue-700">{players.length}</Text>
            <Text className="text-xs text-blue-500">Joueurs analysés</Text>
          </View>
          <View className="flex-1 bg-amber-50 rounded-2xl p-4">
            <Text className="text-2xl font-bold text-amber-700">
              {players.filter(p => { const d = daysUntil(p.date_fin_contrat); return d !== null && d >= 0 && d <= 365; }).length}
            </Text>
            <Text className="text-xs text-amber-500">Contrats à risque</Text>
          </View>
          <View className="flex-1 bg-green-50 rounded-2xl p-4">
            <Text className="text-lg font-bold text-green-700">{formatCurrency(players.reduce((s, p) => s + (p.valeur_marchande || 0), 0))}</Text>
            <Text className="text-xs text-green-500">Valeur base</Text>
          </View>
        </View>

        <Button onPress={runAnalysis} loading={loading} icon={<Sparkles size={16} color="white" />}>
          Lancer l'analyse prédictive
        </Button>

        {loading && (
          <View className="items-center py-8 gap-3">
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text className="text-slate-500">Analyse en cours...</Text>
          </View>
        )}

        {analysis && (
          <>
            {analysis.resume && (
              <Card>
                <CardContent className="pt-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Sparkles size={16} color="#8b5cf6" />
                    <Text className="font-bold text-slate-900">Résumé IA</Text>
                  </View>
                  <Text className="text-sm text-slate-600 leading-relaxed">{analysis.resume}</Text>
                </CardContent>
              </Card>
            )}

            {analysis.trajectoires?.length > 0 && (
              <Card>
                <CardHeader>
                  <View className="flex-row items-center gap-2">
                    <TrendingUp size={16} color="#16a34a" />
                    <CardTitle>Trajectoires prometteuses</CardTitle>
                  </View>
                </CardHeader>
                <CardContent>
                  {analysis.trajectoires.map((t, i) => (
                    <View key={i} className="py-3 border-b border-slate-50 last:border-0">
                      <Text className="font-semibold text-slate-900">{t.joueur}</Text>
                      <Text className="text-sm text-slate-600 mt-1">{t.prediction}</Text>
                      {t.evolution_valeur && <Badge variant="default" className="mt-1 self-start">{t.evolution_valeur}</Badge>}
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}

            {analysis.risques?.length > 0 && (
              <Card>
                <CardHeader>
                  <View className="flex-row items-center gap-2">
                    <Zap size={16} color="#f59e0b" />
                    <CardTitle>Risques identifiés</CardTitle>
                  </View>
                </CardHeader>
                <CardContent>
                  {analysis.risques.map((r, i) => (
                    <View key={i} className="py-3 border-b border-slate-50 last:border-0">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="font-semibold text-slate-900">{r.type}</Text>
                        <Badge variant={urgenceBadge[r.urgence] || 'secondary'}>{r.urgence}</Badge>
                      </View>
                      <Text className="text-sm text-slate-600">{r.description}</Text>
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}

            {analysis.opportunites?.length > 0 && (
              <Card>
                <CardHeader>
                  <View className="flex-row items-center gap-2">
                    <Target size={16} color="#3b82f6" />
                    <CardTitle>Opportunités</CardTitle>
                  </View>
                </CardHeader>
                <CardContent>
                  {analysis.opportunites.map((o, i) => (
                    <View key={i} className="py-3 border-b border-slate-50 last:border-0">
                      <Text className="font-semibold text-slate-900">{o.titre}</Text>
                      <Text className="text-sm text-slate-600 mt-1">{o.detail}</Text>
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
