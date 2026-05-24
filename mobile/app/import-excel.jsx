import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, FileSpreadsheet, Upload, CheckCircle,
  AlertCircle, RotateCcw, Play, Info, ChevronDown, ChevronUp,
  Users, Building2,
} from 'lucide-react-native';

const UsersRound = Users; // alias
import * as DocumentPicker from 'expo-document-picker';
import { base44, uploadFileRN } from '../src/api/base44Client';
import { getToken } from '../src/lib/app-params';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/Card';
import Badge from '../src/components/ui/Badge';
import Button from '../src/components/ui/Button';
import LoadingSpinner from '../src/components/ui/LoadingSpinner';

// ─── Mots-clés qui indiquent un joueur de football ────────────────────────────
const FOOTBALL_POSITIONS = [
  'gardien', 'défenseur', 'lateral', 'milieu', 'ailier', 'attaquant',
  'goalkeeper', 'defender', 'midfielder', 'forward', 'winger', 'striker',
  'centre-back', 'full-back', 'droit', 'gauche', 'buteur', 'libero',
];

// ─── Schéma d'extraction identique à la version web ─────────────────────────
const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    contacts: {
      type: 'array',
      description:
        'Extraire TOUTES les lignes de données. Les colonnes peuvent s\'appeler PAYS/COUNTRY, CLUB/TEAM, NOM/NAME, POSITION/POSTE (avec ou sans espaces), EMAIL/EMAIL_CLUB, TEL/TELEPHONE/téléphone_club. IMPORTANT: si PAYS ou CLUB est vide sur certaines lignes, propager la dernière valeur non-vide (les cellules fusionnées Excel sont souvent vides après la première ligne du groupe). Ignorer uniquement les lignes où NOM est vide.',
      items: {
        type: 'object',
        properties: {
          nom: { type: 'string' },
          club: { type: 'string' },
          pays: { type: 'string' },
          poste: { type: 'string' },
          email: { type: 'string' },
          telephone: { type: 'string' },
        },
      },
    },
  },
};

// ─── Composant aperçu d'un tableau de données ────────────────────────────────
function DataTable({ items, title, color, icon: Icon }) {
  const [expanded, setExpanded] = useState(true);
  if (!items || items.length === 0) return null;

  const keys = Object.keys(items[0] || {}).filter(k => k !== 'club_actuel');

  return (
    <Card className="mb-3">
      <TouchableOpacity
        onPress={() => setExpanded(v => !v)}
        className="flex-row items-center justify-between px-4 pt-4 pb-3"
      >
        <View className="flex-row items-center gap-2">
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} color="white" />
          </View>
          <Text className="font-bold text-slate-900">{title}</Text>
          <Badge variant="secondary">{items.length}</Badge>
        </View>
        {expanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
      </TouchableOpacity>

      {expanded && (
        <CardContent>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View>
              {/* Header */}
              <View className="flex-row border-b border-slate-200 pb-1 mb-1">
                {keys.map(k => (
                  <Text key={k} style={{ width: 110 }} className="text-xs font-semibold text-slate-500 mr-2 capitalize">
                    {k}
                  </Text>
                ))}
              </View>
              {/* Rows */}
              {items.slice(0, 20).map((item, i) => (
                <View key={i} className={`flex-row py-1.5 ${i % 2 === 0 ? 'bg-slate-50' : ''}`}>
                  {keys.map(k => (
                    <Text key={k} style={{ width: 110 }} className="text-xs text-slate-700 mr-2" numberOfLines={1}>
                      {item[k] != null && item[k] !== '' ? String(item[k]) : '—'}
                    </Text>
                  ))}
                </View>
              ))}
              {items.length > 20 && (
                <Text className="text-xs text-slate-400 mt-1">… et {items.length - 20} autres</Text>
              )}
            </View>
          </ScrollView>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Étapes ──────────────────────────────────────────────────────────────────
const STEPS = ['Fichier', 'Aperçu', 'Import', 'Résultats'];

function StepBar({ current }) {
  const idx = STEPS.indexOf(current);
  return (
    <View className="flex-row items-center px-4 py-3">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <View className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${
            i === idx ? 'bg-green-500' : i < idx ? 'bg-green-100' : 'bg-slate-100'
          }`}>
            {i < idx
              ? <CheckCircle size={12} color="#16a34a" />
              : <Text className={`text-xs font-bold ${i === idx ? 'text-white' : 'text-slate-400'}`}>{i + 1}</Text>
            }
            <Text className={`text-xs font-semibold ${i === idx ? 'text-white' : i < idx ? 'text-green-700' : 'text-slate-400'}`}>{s}</Text>
          </View>
          {i < STEPS.length - 1 && <View className="flex-1 h-px bg-slate-200 mx-1" />}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────
export default function ImportExcelPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState('Fichier');
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [results, setResults] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [extractError, setExtractError] = useState(null);

  const { data: importHistory = [] } = useQuery({
    queryKey: ['import-history'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ImportLog.filter({ created_by: user.email });
    },
  });

  // ── 1. Sélectionner et analyser le fichier ───────────────────────────────
  const pickAndAnalyze = async () => {
    setExtractError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          'text/comma-separated-values',
          '*/*',  // fallback pour iOS qui peut restreindre les types
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      setSelectedFile(file);
      setUploading(true);

      // Étape 1 : upload vers Base44 Storage
      const token = await getToken();
      let file_url;
      try {
        const uploadResult = await uploadFileRN(file, token);
        file_url = uploadResult?.file_url;
      } catch (uploadErr) {
        console.error('Upload error:', uploadErr?.response?.data || uploadErr.message);
        throw new Error(`Erreur upload: ${uploadErr?.response?.data?.message || uploadErr.message}`);
      }

      if (!file_url) throw new Error("L'upload a réussi mais aucune URL de fichier n'a été retournée.");

      // Étape 2 : extraction IA (même schéma que la version web)
      let rawResult;
      try {
        rawResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: EXTRACT_SCHEMA,
        });
      } catch (extractErr) {
        console.error('Extract error:', extractErr?.response?.data || extractErr.message);
        throw new Error(`Erreur extraction IA: ${extractErr?.response?.data?.message || extractErr.message}`);
      }

      setUploading(false);

      if (rawResult?.status === 'error') {
        throw new Error(rawResult.details || "Erreur lors de l'extraction du fichier.");
      }

      // Étape 3 : normaliser le résultat (peut être un array de sheets ou un objet)
      let contacts = [];
      const output = rawResult?.output ?? rawResult;
      if (Array.isArray(output)) {
        for (const sheet of output) {
          if (Array.isArray(sheet?.contacts)) contacts = contacts.concat(sheet.contacts);
          else if (Array.isArray(sheet)) contacts = contacts.concat(sheet);
        }
      } else {
        contacts = output?.contacts || [];
      }

      // Filtrer les lignes vides
      contacts = contacts.filter(r => r.nom && String(r.nom).trim() !== '');

      if (contacts.length === 0) {
        throw new Error(
          "Aucune donnée reconnue dans ce fichier.\n\nAssurez-vous que le fichier contient des colonnes NOM/NAME et CLUB."
        );
      }

      // Étape 4 : séparer joueurs vs contacts staff
      const joueurs = [];
      const staffContacts = [];
      for (const row of contacts) {
        const posteLower = (row.poste || '').toLowerCase();
        const isPlayer = FOOTBALL_POSITIONS.some(k => posteLower.includes(k));
        if (isPlayer) {
          joueurs.push({ ...row, club_actuel: row.club });
        } else {
          staffContacts.push(row);
        }
      }

      setExtractedData({
        joueurs,
        contacts: staffContacts,
        clubs: [],
        nom_fichier: file.name,
      });
      setStep('Aperçu');
    } catch (err) {
      setUploading(false);
      const msg = err.message || 'Erreur inconnue';
      setExtractError(msg);
      Alert.alert('Erreur', msg);
    }
  };

  // ── 2. Lancer l'import ───────────────────────────────────────────────────
  const runImport = async () => {
    if (!extractedData) return;
    setStep('Import');
    setImporting(true);
    try {
      const res = await base44.functions.invoke('importExcelData', {
        data: extractedData,
      });
      // La fonction retourne res.data ou directement res selon la version SDK
      setResults(res?.data ?? res);
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['import-history'] });
      setStep('Résultats');
    } catch (err) {
      setImporting(false);
      Alert.alert('Erreur d\'import', err.message || 'Une erreur s\'est produite.');
      setStep('Aperçu');
    } finally {
      setImporting(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep('Fichier');
    setSelectedFile(null);
    setExtractedData(null);
    setResults(null);
    setExtractError(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  const totalExtracted = (extractedData?.joueurs?.length || 0)
    + (extractedData?.contacts?.length || 0)
    + (extractedData?.clubs?.length || 0);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <View className="w-9 h-9 bg-green-600 rounded-xl items-center justify-center">
          <FileSpreadsheet size={18} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-xl font-bold text-slate-900">Import Excel / CSV</Text>
          <Text className="text-xs text-slate-400">Toute structure acceptée — l'IA détecte les colonnes</Text>
        </View>
      </View>

      <StepBar current={step} />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">

        {/* ── ÉTAPE 1 : SÉLECTION FICHIER ── */}
        {step === 'Fichier' && (
          <>
            {/* Info box */}
            <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex-row gap-3">
              <Info size={18} color="#3b82f6" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-blue-800 mb-1">Colonnes reconnues automatiquement</Text>
                <Text className="text-xs text-blue-700 leading-relaxed">
                  <Text className="font-semibold">Joueurs :</Text> nom, prénom, poste, club, nationalité, âge, email, téléphone, agent, valeur, contrat, buts, passes…{'\n'}
                  <Text className="font-semibold">Staff / Contacts :</Text> nom, club, pays, poste, email, téléphone{'\n'}
                  <Text className="italic">L'IA détecte les colonnes même si les noms sont différents ou en anglais.</Text>
                </Text>
              </View>
            </View>

            {/* Zone de sélection */}
            <TouchableOpacity
              onPress={!uploading ? pickAndAnalyze : undefined}
              activeOpacity={0.8}
              className="border-2 border-dashed border-slate-300 rounded-2xl py-10 items-center gap-4 bg-white"
            >
              {uploading ? (
                <>
                  <ActivityIndicator size="large" color="#16a34a" />
                  <Text className="text-base font-semibold text-slate-700">Analyse du fichier en cours…</Text>
                  <Text className="text-sm text-slate-400">L'IA extrait toutes les données disponibles</Text>
                </>
              ) : (
                <>
                  <View className="w-16 h-16 bg-green-50 rounded-2xl items-center justify-center">
                    <FileSpreadsheet size={30} color="#16a34a" />
                  </View>
                  <Text className="text-base font-semibold text-slate-700">Appuyez pour choisir un fichier</Text>
                  <Text className="text-sm text-slate-400">Excel (.xlsx, .xls) ou CSV</Text>
                  <View className="flex-row items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl mt-1">
                    <Upload size={14} color="#64748b" />
                    <Text className="text-sm font-medium text-slate-600">Choisir un fichier</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            {extractError && (
              <View className="bg-red-50 border border-red-200 rounded-2xl p-4 flex-row gap-3">
                <AlertCircle size={18} color="#ef4444" />
                <Text className="text-sm text-red-700 flex-1">{extractError}</Text>
              </View>
            )}

            {/* Historique */}
            {importHistory.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Historique des imports</CardTitle></CardHeader>
                <CardContent>
                  {importHistory.slice(0, 6).map(log => (
                    <View key={log.id} className="flex-row items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <View className="flex-1 mr-3">
                        <Text className="text-sm font-medium text-slate-900" numberOfLines={1}>{log.nom_fichier || 'Import'}</Text>
                        <Text className="text-xs text-slate-400">{new Date(log.created_date).toLocaleDateString('fr-FR')}</Text>
                      </View>
                      <View className="flex-row gap-2">
                        {log.joueurs_crees > 0 && <Badge variant="blue">+{log.joueurs_crees} joueurs</Badge>}
                        {log.clubs_crees > 0 && <Badge variant="purple">+{log.clubs_crees} clubs</Badge>}
                        <Badge variant={log.statut === 'succès' ? 'default' : 'warning'}>{log.statut}</Badge>
                      </View>
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ── ÉTAPE 2 : APERÇU ── */}
        {step === 'Aperçu' && extractedData && (
          <>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-bold text-slate-900">Aperçu des données</Text>
                <Text className="text-sm text-slate-400">
                  {totalExtracted} enregistrement{totalExtracted > 1 ? 's' : ''} détecté{totalExtracted > 1 ? 's' : ''} dans <Text className="font-medium">{extractedData.nom_fichier}</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={reset} className="p-2">
                <RotateCcw size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {totalExtracted === 0 ? (
              <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <Text className="text-sm text-amber-700">Aucune donnée reconnue. Vérifiez que le fichier contient des colonnes NOM et CLUB.</Text>
              </View>
            ) : (
              <>
                {extractedData.joueurs?.length > 0 && (
                  <DataTable items={extractedData.joueurs} title={`Joueurs (${extractedData.joueurs.length})`} color="#3b82f6" icon={Users} />
                )}
                {extractedData.contacts?.length > 0 && (
                  <DataTable items={extractedData.contacts} title={`Contacts / Staff (${extractedData.contacts.length})`} color="#f97316" icon={UsersRound} />
                )}
                {extractedData.clubs?.length > 0 && (
                  <DataTable items={extractedData.clubs} title={`Clubs (${extractedData.clubs.length})`} color="#8b5cf6" icon={Building2} />
                )}
              </>
            )}

            <View className="flex-row gap-3 mt-2">
              <Button variant="outline" onPress={reset} className="flex-1" icon={<RotateCcw size={14} color="#64748b" />}>
                Retour
              </Button>
              <Button onPress={runImport} disabled={totalExtracted === 0} className="flex-1" icon={<Play size={14} color="white" />}>
                Lancer l'import
              </Button>
            </View>
          </>
        )}

        {/* ── ÉTAPE 3 : TRAITEMENT ── */}
        {step === 'Import' && (
          <View className="items-center py-16 gap-4">
            <ActivityIndicator size="large" color="#16a34a" />
            <Text className="text-lg font-bold text-slate-800">Import en cours…</Text>
            <Text className="text-sm text-slate-500 text-center">Vérification, création et mise à jour des données</Text>
          </View>
        )}

        {/* ── ÉTAPE 4 : RÉSULTATS ── */}
        {step === 'Résultats' && results && (
          <>
            <View className="bg-green-50 border border-green-200 rounded-2xl p-4 flex-row items-center gap-3">
              <CheckCircle size={22} color="#16a34a" />
              <View>
                <Text className="font-bold text-green-800">Import terminé !</Text>
                <Text className="text-xs text-green-600">{extractedData?.nom_fichier}</Text>
              </View>
            </View>

            {/* KPIs résultats */}
            <View className="flex-row flex-wrap gap-3">
              {[
                { label: 'Joueurs créés', value: results.joueurs_crees, color: 'bg-blue-50', text: 'text-blue-700' },
                { label: 'Joueurs màj', value: results.joueurs_mis_a_jour, color: 'bg-green-50', text: 'text-green-700' },
                { label: 'Clubs créés', value: results.clubs_crees, color: 'bg-purple-50', text: 'text-purple-700' },
                { label: 'Contacts créés', value: results.contacts_crees, color: 'bg-orange-50', text: 'text-orange-700' },
              ].map(k => (
                <View key={k.label} className={`flex-1 min-w-[44%] ${k.color} rounded-2xl p-4`}>
                  <Text className={`text-2xl font-bold ${k.text}`}>{k.value || 0}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">{k.label}</Text>
                </View>
              ))}
            </View>

            {/* Erreurs */}
            {results.erreurs?.length > 0 && (
              <View className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <AlertCircle size={16} color="#ef4444" />
                  <Text className="font-semibold text-red-700">{results.erreurs.length} erreur{results.erreurs.length > 1 ? 's' : ''}</Text>
                </View>
                {results.erreurs.slice(0, 5).map((e, i) => (
                  <Text key={i} className="text-xs text-red-600">• {e}</Text>
                ))}
              </View>
            )}

            {/* Détails */}
            {results.details?.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Détails ({results.details.length} opérations)</CardTitle></CardHeader>
                <CardContent>
                  {results.details.slice(0, 30).map((d, i) => (
                    <View key={i} className="flex-row items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <Text className="text-sm text-slate-700 flex-1 mr-2" numberOfLines={1}>{d.nom}</Text>
                      <View className="flex-row gap-2">
                        <Badge variant="secondary">{d.type}</Badge>
                        <Badge variant={d.action === 'créé' ? 'default' : 'blue'}>{d.action}</Badge>
                      </View>
                    </View>
                  ))}
                  {results.details.length > 30 && (
                    <Text className="text-xs text-slate-400 mt-2">… et {results.details.length - 30} autres opérations</Text>
                  )}
                </CardContent>
              </Card>
            )}

            <Button onPress={reset} icon={<RotateCcw size={14} color="white" />}>
              Nouvel import
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
