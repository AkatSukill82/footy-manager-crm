import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText, Download, Users, ArrowRightLeft, Shield } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { base44 } from '../src/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import Button from '../src/components/ui/Button';
import LoadingSpinner from '../src/components/ui/LoadingSpinner';
import { formatCurrency } from '../src/utils';

const REPORT_TYPES = [
  { key: 'players', label: 'Rapport Joueurs', icon: Users, color: 'bg-blue-50', iconColor: '#3b82f6', desc: 'Statistiques et valeurs de tous les joueurs' },
  { key: 'transfers', label: 'Rapport Transferts', icon: ArrowRightLeft, color: 'bg-green-50', iconColor: '#16a34a', desc: 'Historique et analyses des transferts' },
  { key: 'teams', label: 'Rapport Équipes', icon: Shield, color: 'bg-purple-50', iconColor: '#8b5cf6', desc: 'Performances et compositions des équipes' },
];

export default function ReportsPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState(null);

  const { data: players = [] } = useQuery({ queryKey: ['players'], queryFn: () => base44.entities.Player.list() });
  const { data: transfers = [] } = useQuery({ queryKey: ['transfers'], queryFn: () => base44.entities.Transfer.list() });
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: async () => { const u = await base44.auth.me(); return base44.entities.Team.filter({ created_by: u.email }); } });

  const generateReport = async (type) => {
    setGenerating(type);
    try {
      const result = await base44.functions.invoke('generateReport', { reportType: type, page: 1 });
      if (result?.pdf) {
        const fileUri = FileSystem.documentDirectory + `rapport_${type}_${Date.now()}.pdf`;
        await FileSystem.writeAsStringAsync(fileUri, result.pdf, { encoding: FileSystem.EncodingType.Base64 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf' });
        } else {
          Alert.alert('PDF généré', 'Le fichier a été sauvegardé dans votre appareil.');
        }
      }
    } catch (e) {
      Alert.alert('Erreur', "Impossible de générer le rapport. Vérifiez votre connexion.");
    } finally {
      setGenerating(null);
    }
  };

  const totalValue = players.reduce((s, p) => s + (p.valeur_marchande || 0), 0);
  const totalTransferValue = transfers.reduce((s, t) => s + (t.montant || 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <FileText size={20} color="#8b5cf6" />
        <Text className="text-xl font-bold text-slate-900 flex-1">Rapports</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* KPIs rapides */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-blue-50 rounded-2xl p-4">
            <Text className="text-2xl font-bold text-blue-700">{players.length}</Text>
            <Text className="text-xs text-blue-500">Joueurs</Text>
          </View>
          <View className="flex-1 bg-green-50 rounded-2xl p-4">
            <Text className="text-lg font-bold text-green-700">{formatCurrency(totalValue)}</Text>
            <Text className="text-xs text-green-500">Valeur totale</Text>
          </View>
          <View className="flex-1 bg-purple-50 rounded-2xl p-4">
            <Text className="text-2xl font-bold text-purple-700">{transfers.length}</Text>
            <Text className="text-xs text-purple-500">Transferts</Text>
          </View>
        </View>

        {/* Générer des rapports */}
        <Text className="text-base font-bold text-slate-900">Générer un rapport PDF</Text>

        {REPORT_TYPES.map(rt => {
          const Icon = rt.icon;
          return (
            <Card key={rt.key}>
              <CardContent className="pt-4">
                <View className="flex-row items-center gap-4">
                  <View className={`w-12 h-12 ${rt.color} rounded-2xl items-center justify-center`}>
                    <Icon size={22} color={rt.iconColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-900">{rt.label}</Text>
                    <Text className="text-xs text-slate-400 mt-0.5">{rt.desc}</Text>
                  </View>
                  <Button
                    size="sm"
                    onPress={() => generateReport(rt.key)}
                    loading={generating === rt.key}
                    icon={<Download size={14} color="white" />}
                  >
                    PDF
                  </Button>
                </View>
              </CardContent>
            </Card>
          );
        })}

        {/* Aperçu joueurs */}
        <Card>
          <CardHeader>
            <View className="flex-row items-center justify-between">
              <CardTitle>Top joueurs — Valeur</CardTitle>
              <Badge variant="secondary">{players.length} total</Badge>
            </View>
          </CardHeader>
          <CardContent>
            {[...players].filter(p => p.valeur_marchande).sort((a, b) => (b.valeur_marchande || 0) - (a.valeur_marchande || 0)).slice(0, 5).map((p, i) => (
              <View key={p.id} className="flex-row items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <View className="w-6 h-6 bg-slate-100 rounded-full items-center justify-center">
                  <Text className="text-xs font-bold text-slate-500">{i + 1}</Text>
                </View>
                <Text className="flex-1 text-sm font-medium text-slate-900">{p.prenom} {p.nom}</Text>
                <Text className="text-sm font-semibold text-green-700">{formatCurrency(p.valeur_marchande)}</Text>
              </View>
            ))}
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
