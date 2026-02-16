import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AgentInsightGenerator({ onInsightGenerated }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInsights = async () => {
    setIsGenerating(true);
    try {
      // Récupérer les données pour l'analyse
      const [players, transfers, teams] = await Promise.all([
        base44.entities.Player.list('-created_date', 50),
        base44.entities.Transfer.list('-date_transfert', 30),
        base44.entities.Team.list()
      ]);

      // Préparer le contexte pour l'IA
      const context = {
        total_players: players.length,
        recent_transfers: transfers.length,
        avg_player_value: players.reduce((sum, p) => sum + (p.valeur_marchande || 0), 0) / players.length,
        total_teams: teams.length,
        recent_transfer_value: transfers.slice(0, 10).reduce((sum, t) => sum + (t.montant || 0), 0)
      };

      // Générer un insight sur les tendances du marché
      const marketInsight = await base44.integrations.Core.InvokeLLM({
        prompt: `En tant qu'agent IA expert en football, analyse ces données et génère un insight professionnel sur les tendances du marché:
        
        - Nombre total de joueurs: ${context.total_players}
        - Transferts récents: ${context.recent_transfers}
        - Valeur moyenne des joueurs: ${context.avg_player_value.toFixed(1)}M€
        - Nombre d'équipes: ${context.total_teams}
        - Valeur des 10 derniers transferts: ${context.recent_transfer_value}M€
        
        Génère un insight concret et actionnable (max 200 mots) sur les tendances actuelles du marché des transferts.`,
        add_context_from_internet: true
      });

      await base44.entities.AgentInsight.create({
        categorie: "tendance_marche",
        titre: "Analyse des tendances du marché",
        contenu: marketInsight,
        donnees_source: `${context.total_players} joueurs, ${context.recent_transfers} transferts récents`,
        confiance: 85,
        priority: "haute"
      });

      // Générer un insight sur les opportunités de transfert
      const topPlayers = players
        .filter(p => p.valeur_marchande && p.age < 28)
        .sort((a, b) => b.valeur_marchande - a.valeur_marchande)
        .slice(0, 5);

      if (topPlayers.length > 0) {
        const opportunityInsight = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyse ces 5 joueurs prometteurs et identifie les meilleures opportunités de transfert:
          
          ${topPlayers.map(p => `- ${p.nom}, ${p.age} ans, ${p.poste}, ${p.valeur_marchande}M€, ${p.club_actuel || 'libre'}`).join('\n')}
          
          Génère une recommandation stratégique sur les opportunités de transfert (max 200 mots).`,
          add_context_from_internet: true
        });

        await base44.entities.AgentInsight.create({
          categorie: "opportunite_transfert",
          titre: "Opportunités de transfert identifiées",
          contenu: opportunityInsight,
          donnees_source: `Analyse de ${topPlayers.length} joueurs prometteurs`,
          player_ids: topPlayers.map(p => p.id).join(','),
          confiance: 78,
          priority: "moyenne"
        });
      }

      onInsightGenerated();
    } catch (error) {
      console.error('Erreur génération insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-slate-300">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Agents IA</h3>
        <p className="text-slate-600 mb-4">
          Générez des insights automatiques basés sur l'analyse de vos données par nos agents IA
        </p>
        <Button
          onClick={generateInsights}
          disabled={isGenerating}
          className="bg-slate-900 hover:bg-slate-800"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Générer des insights
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}