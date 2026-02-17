import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Plus, Calculator, History } from "lucide-react";
import NegociationCard from "../components/transfers/NegociationCard";
import BudgetSimulator from "../components/transfers/BudgetSimulator";
import PlayerTransferHistory from "../components/transfers/PlayerTransferHistory";

export default function TransferManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("negociations");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [formData, setFormData] = useState({
    player_id: "",
    club_vendeur: "",
    club_acheteur: "",
    montant_propose: "",
    montant_demande: "",
    date_debut: new Date().toISOString().split('T')[0],
    date_limite: "",
    notes_negociation: "",
    priorite: "moyenne"
  });

  const { data: negociations = [] } = useQuery({
    queryKey: ['negociations'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.TransferNegociation.filter({ created_by: user.email });
    },
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => base44.entities.Transfer.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Team.filter({ created_by: user.email });
    },
  });

  const { data: teamPlayers = [] } = useQuery({
    queryKey: ['team-players'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.TeamPlayer.filter({ created_by: user.email });
    },
  });

  const createNegociationMutation = useMutation({
    mutationFn: (data) => base44.entities.TransferNegociation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociations'] });
      setShowAddModal(false);
      setFormData({
        player_id: "",
        club_vendeur: "",
        club_acheteur: "",
        montant_propose: "",
        montant_demande: "",
        date_debut: new Date().toISOString().split('T')[0],
        date_limite: "",
        notes_negociation: "",
        priorite: "moyenne"
      });
    },
  });

  const updateNegociationMutation = useMutation({
    mutationFn: ({ id, statut }) => base44.entities.TransferNegociation.update(id, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociations'] });
    },
  });

  const finalizeTransferMutation = useMutation({
    mutationFn: async (negociation) => {
      const player = players.find(p => p.id === negociation.player_id);
      await base44.entities.Transfer.create({
        player_id: negociation.player_id,
        date_transfert: new Date().toISOString().split('T')[0],
        club_depart: negociation.club_vendeur || player?.club_actuel,
        club_arrivee: negociation.club_acheteur,
        montant: negociation.montant_propose,
        type_transfert: "Transfert définitif"
      });
      await base44.entities.TransferNegociation.update(negociation.id, { statut: "transfert_finalise" });
      if (player) {
        await base44.entities.Player.update(player.id, { club_actuel: negociation.club_acheteur });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociations'] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createNegociationMutation.mutate({
      ...formData,
      montant_propose: parseFloat(formData.montant_propose),
      montant_demande: formData.montant_demande ? parseFloat(formData.montant_demande) : null,
      statut: "demande_initiale"
    });
  };

  const activeNegociations = negociations.filter(n => 
    n.statut !== "transfert_finalise" && n.statut !== "annule"
  );

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 truncate">Transferts</h1>
          <p className="text-slate-500 text-sm mt-0.5 hidden md:block">Suivez vos négociations et simulez vos budgets</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-slate-800 shadow-lg flex-shrink-0"
          size="sm"
        >
          <Plus className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Nouvelle négociation</span>
          <span className="md:hidden">Nouveau</span>
        </Button>
      </div>

      {/* Tabs — icon-only on mobile */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("negociations")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium transition-all text-sm ${
              activeTab === "negociations"
                ? "bg-slate-900 text-white shadow-lg"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Négociations</span>
            <span className="sm:hidden">({activeNegociations.length})</span>
            <span className="hidden sm:inline">({activeNegociations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium transition-all text-sm ${
              activeTab === "simulator"
                ? "bg-slate-900 text-white shadow-lg"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calculator className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Simulateur</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium transition-all text-sm ${
              activeTab === "history"
                ? "bg-slate-900 text-white shadow-lg"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Historique</span>
          </button>
        </div>
      </div>

      {activeTab === "negociations" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {negociations.filter(n => n.statut !== "transfert_finalise" && n.statut !== "annule").map(negociation => {
            const player = players.find(p => p.id === negociation.player_id);
            return (
              <NegociationCard
                key={negociation.id}
                negociation={negociation}
                player={player}
                onUpdateStatus={(id, statut) => updateNegociationMutation.mutate({ id, statut })}
                onFinalize={(neg) => finalizeTransferMutation.mutate(neg)}
              />
            );
          })}
        </div>
      )}

      {activeTab === "simulator" && (
        <BudgetSimulator 
          teams={teams}
          players={players}
          teamPlayers={teamPlayers}
        />
      )}

      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <Label>Sélectionner un joueur</Label>
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Choisir un joueur..." />
              </SelectTrigger>
              <SelectContent>
                {players.map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.nom} - {player.poste}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlayer && (
            <PlayerTransferHistory 
              player={selectedPlayer}
              transfers={transfers}
            />
          )}
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle négociation de transfert</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Joueur</Label>
              <Select value={formData.player_id} onValueChange={(value) => setFormData({...formData, player_id: value})}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sélectionner un joueur" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nom} - {p.club_actuel || "Libre"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Club vendeur</Label>
                <Input
                  value={formData.club_vendeur}
                  onChange={(e) => setFormData({...formData, club_vendeur: e.target.value})}
                  placeholder="Ex: PSG"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Club acheteur</Label>
                <Input
                  value={formData.club_acheteur}
                  onChange={(e) => setFormData({...formData, club_acheteur: e.target.value})}
                  placeholder="Ex: Real Madrid"
                  required
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Montant proposé (M€)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.montant_propose}
                  onChange={(e) => setFormData({...formData, montant_propose: e.target.value})}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Montant demandé (M€)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.montant_demande}
                  onChange={(e) => setFormData({...formData, montant_demande: e.target.value})}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Date limite</Label>
                <Input
                  type="date"
                  value={formData.date_limite}
                  onChange={(e) => setFormData({...formData, date_limite: e.target.value})}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Priorité</Label>
                <Select value={formData.priorite} onValueChange={(value) => setFormData({...formData, priorite: value})}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basse">Basse</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notes de négociation</Label>
              <Textarea
                value={formData.notes_negociation}
                onChange={(e) => setFormData({...formData, notes_negociation: e.target.value})}
                rows={3}
                placeholder="Notes importantes..."
                className="mt-1.5"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
                Créer la négociation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}