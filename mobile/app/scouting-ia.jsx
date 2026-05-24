import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sparkles, Search, ChevronRight } from 'lucide-react-native';
import { base44 } from '../src/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import Select from '../src/components/ui/Select';
import { formatCurrency } from '../src/utils';

const POSTES = [
  { value: 'Gardien', label: 'Gardien' },
  { value: 'Défenseur', label: 'Défenseur' },
  { value: 'Milieu', label: 'Milieu' },
  { value: 'Attaquant', label: 'Attaquant' },
];

export default function ScoutingIAPage() {
  const router = useRouter();
  const [criteria, setCriteria] = useState({ poste: '', ageMax: '', budgetMax: '', description: '' });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const analyzeWithAI = async () => {
    setLoading(true);
    try {
      const filteredPlayers = players.filter(p => {
        if (criteria.poste && p.poste !== criteria.poste) return false;
        if (criteria.ageMax && p.age > parseInt(criteria.ageMax)) return false;
        if (criteria.budgetMax && p.valeur_marchande > parseFloat(criteria.budgetMax)) return false;
        return true;
      });

      const playerSummary = filteredPlayers.slice(0, 50).map(p =>
        `${p.prenom} ${p.nom} (${p.poste}, ${p.age || '?'}ans, ${p.club_actuel || '?'}, valeur: ${p.valeur_marchande || '?'}M€, buts: ${p.buts_saison || 0}, note: ${p.note_moyenne || '?'})`
      ).join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un expert scout de football. Voici les critères de recherche:
- Poste: ${criteria.poste || 'tous'}
- Âge max: ${criteria.ageMax || 'pas de limite'}
- Budget max: ${criteria.budgetMax || 'pas de limite'}M€
- Description: ${criteria.description || 'aucune'}

Voici les joueurs disponibles dans la base:
${playerSummary}

Analyse ces joueurs et recommande les 5 meilleurs correspondant aux critères. Pour chaque joueur, explique pourquoi il est recommandé.
Réponds en JSON: {"recommendations": [{"nom": "...", "prenom": "...", "score": 85, "raison": "..."}], "analyse": "résumé global en 2 phrases"}`,
        response_json_schema: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nom: { type: 'string' },
                  prenom: { type: 'string' },
                  score: { type: 'number' },
                  raison: { type: 'string' },
                },
              },
            },
            analyse: { type: 'string' },
          },
        },
      });

      if (result?.recommendations) {
        const enriched = result.recommendations.map(r => {
          const p = players.find(pl => pl.nom === r.nom && pl.prenom === r.prenom);
          return { ...r, player: p };
        });
        setRecommendations(enriched);
        setAnalysis(result.analyse || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <Sparkles size={20} color="#8b5cf6" />
        <Text className="text-xl font-bold text-slate-900 flex-1">Scouting IA</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Critères */}
        <Card>
          <CardHeader><CardTitle>Critères de recherche</CardTitle></CardHeader>
          <CardContent>
            <View className="gap-4">
              <Select label="Poste" value={criteria.poste} onChange={v => setCriteria(c => ({ ...c, poste: v }))} options={POSTES} placeholder="Tous les postes" />
              <View className="flex-row gap-3">
                <Input label="Âge max" value={criteria.ageMax} onChangeText={v => setCriteria(c => ({ ...c, ageMax: v }))} keyboardType="numeric" placeholder="30" className="flex-1" />
                <Input label="Budget max (M€)" value={criteria.budgetMax} onChangeText={v => setCriteria(c => ({ ...c, budgetMax: v }))} keyboardType="numeric" placeholder="50" className="flex-1" />
              </View>
              <Input label="Description du profil recherché" value={criteria.description} onChangeText={v => setCriteria(c => ({ ...c, description: v }))} multiline numberOfLines={3} placeholder="Ex: attaquant rapide, bon dribbleur, expérimenté..." />
              <Button onPress={analyzeWithAI} loading={loading} icon={<Sparkles size={16} color="white" />}>
                Analyser avec l'IA
              </Button>
            </View>
          </CardContent>
        </Card>

        {loading && (
          <View className="items-center py-8 gap-3">
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text className="text-slate-500">L'IA analyse votre base de joueurs...</Text>
          </View>
        )}

        {analysis ? (
          <Card>
            <CardContent className="pt-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Sparkles size={16} color="#8b5cf6" />
                <Text className="font-semibold text-slate-900">Analyse IA</Text>
              </View>
              <Text className="text-sm text-slate-600 leading-relaxed">{analysis}</Text>
            </CardContent>
          </Card>
        ) : null}

        {recommendations.length > 0 && (
          <View className="gap-3">
            <Text className="font-bold text-slate-900">Recommandations ({recommendations.length})</Text>
            {recommendations.map((rec, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <View className="flex-row items-center gap-3 mb-2">
                    <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center">
                      <Text className="text-sm font-bold text-purple-600">#{i + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-slate-900">{rec.prenom} {rec.nom}</Text>
                      {rec.player && <Text className="text-xs text-slate-400">{rec.player.club_actuel} · {rec.player.poste}</Text>}
                    </View>
                    <View className="items-end gap-1">
                      <Badge variant="purple">Score: {rec.score}</Badge>
                      {rec.player?.valeur_marchande && <Badge variant="default">{formatCurrency(rec.player.valeur_marchande)}</Badge>}
                    </View>
                  </View>
                  <Text className="text-sm text-slate-600 leading-relaxed">{rec.raison}</Text>
                  {rec.player && (
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/player-detail', params: { id: rec.player.id } })}
                      className="flex-row items-center gap-1 mt-2"
                    >
                      <Text className="text-xs text-green-600 font-semibold">Voir la fiche</Text>
                      <ChevronRight size={12} color="#16a34a" />
                    </TouchableOpacity>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
