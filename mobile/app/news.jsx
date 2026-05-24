import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Newspaper, RefreshCw, Sparkles } from 'lucide-react-native';
import { base44 } from '../src/api/base44Client';
import { Card, CardContent } from '../src/components/ui/Card';
import Button from '../src/components/ui/Button';
import Badge from '../src/components/ui/Badge';

export default function NewsPage() {
  const router = useRouter();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateNews = async () => {
    setLoading(true);
    try {
      const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un journaliste sportif spécialisé dans le football. Génère un journal du jour complet pour le ${today} avec: 5 actualités de transferts (avec des noms de joueurs et clubs réalistes), 3 résultats de matchs importants, 2 informations sur des blessures ou retours de blessure, 1 information sur un entraîneur. Format JSON: {"articles": [{"titre": "...", "contenu": "...", "categorie": "transfert|resultat|blessure|staff", "club": "..."}]}`,
        response_json_schema: {
          type: 'object',
          properties: {
            articles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  titre: { type: 'string' },
                  contenu: { type: 'string' },
                  categorie: { type: 'string' },
                  club: { type: 'string' },
                },
              },
            },
          },
        },
      });
      if (result?.articles) {
        setNews(result.articles);
        setGenerated(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const catBadge = { transfert: 'blue', resultat: 'default', blessure: 'destructive', staff: 'purple' };
  const catLabel = { transfert: '🔄 Transfert', resultat: '⚽ Résultat', blessure: '🏥 Blessure', staff: '👔 Staff' };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <Newspaper size={20} color="#f59e0b" />
        <Text className="text-xl font-bold text-slate-900 flex-1">Journal du jour</Text>
        <Button size="sm" onPress={generateNews} loading={loading} icon={<Sparkles size={14} color="white" />}>
          {generated ? 'Rafraîchir' : 'Générer'}
        </Button>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {!generated && !loading && (
          <View className="items-center py-16 gap-4">
            <View className="w-16 h-16 bg-amber-50 rounded-3xl items-center justify-center">
              <Newspaper size={30} color="#f59e0b" />
            </View>
            <Text className="text-base font-semibold text-slate-700">Journal du jour</Text>
            <Text className="text-sm text-slate-400 text-center">
              Générez un résumé IA des actualités football du jour : transferts, résultats, blessures.
            </Text>
            <Button onPress={generateNews} icon={<Sparkles size={16} color="white" />}>Générer le journal</Button>
          </View>
        )}

        {loading && (
          <View className="items-center py-16 gap-4">
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text className="text-slate-500">Génération en cours...</Text>
          </View>
        )}

        {news.map((article, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <View className="flex-row items-start gap-3 mb-2">
                <View className="flex-1">
                  <Text className="font-bold text-slate-900 text-base leading-tight">{article.titre}</Text>
                  {article.club && <Text className="text-xs text-slate-400 mt-0.5">{article.club}</Text>}
                </View>
                <Badge variant={catBadge[article.categorie] || 'secondary'}>{catLabel[article.categorie] || article.categorie}</Badge>
              </View>
              <Text className="text-sm text-slate-600 leading-relaxed">{article.contenu}</Text>
            </CardContent>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
