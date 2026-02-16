import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ShareContentModal({ isOpen, onClose, onSubmit, players, teams }) {
  const [formData, setFormData] = useState({
    type: "player_profile",
    player_id: "",
    team_id: "",
    titre: "",
    description: "",
    insights: "",
    tags: "",
    visibilite: "reseau"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      type: "player_profile",
      player_id: "",
      team_id: "",
      titre: "",
      description: "",
      insights: "",
      tags: "",
      visibilite: "reseau"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Partager du contenu</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type de contenu</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="player_profile">Profil joueur</SelectItem>
                <SelectItem value="team_analysis">Analyse d'équipe</SelectItem>
                <SelectItem value="market_insight">Insight marché</SelectItem>
                <SelectItem value="transfer_opportunity">Opportunité de transfert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === "player_profile" && (
            <div>
              <Label>Joueur</Label>
              <Select value={formData.player_id} onValueChange={(value) => setFormData({...formData, player_id: value})}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sélectionner un joueur" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.type === "team_analysis" && (
            <div>
              <Label>Équipe</Label>
              <Select value={formData.team_id} onValueChange={(value) => setFormData({...formData, team_id: value})}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Sélectionner une équipe" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Titre</Label>
            <Input
              value={formData.titre}
              onChange={(e) => setFormData({...formData, titre: e.target.value})}
              placeholder="Titre accrocheur..."
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Décrivez votre analyse..."
              rows={4}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Insights et analyses</Label>
            <Textarea
              value={formData.insights}
              onChange={(e) => setFormData({...formData, insights: e.target.value})}
              placeholder="Partagez vos insights professionnels..."
              rows={4}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Tags (séparés par virgules)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder="talent, jeune, attaquant..."
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Visibilité</Label>
            <Select value={formData.visibilite} onValueChange={(value) => setFormData({...formData, visibilite: value})}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reseau">Réseau (agents uniquement)</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
              Partager
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}