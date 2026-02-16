import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClubForm({ club, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(club || {
    nom: "",
    pays: "",
    ville: "",
    stade: "",
    capacite_stade: "",
    annee_fondation: "",
    president: "",
    entraineur: "",
    directeur_sportif: "",
    budget_annuel: "",
    budget_transfert: "",
    dette: "",
    valeur_effectif: "",
    palmares: "",
    historique: "",
    logo_url: "",
    categorie: "Intermédiaire"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      capacite_stade: formData.capacite_stade ? parseInt(formData.capacite_stade) : null,
      annee_fondation: formData.annee_fondation ? parseInt(formData.annee_fondation) : null,
      budget_annuel: formData.budget_annuel ? parseFloat(formData.budget_annuel) : null,
      budget_transfert: formData.budget_transfert ? parseFloat(formData.budget_transfert) : null,
      dette: formData.dette ? parseFloat(formData.dette) : null,
      valeur_effectif: formData.valeur_effectif ? parseFloat(formData.valeur_effectif) : null
    };
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{club ? "Modifier le club" : "Nouveau club"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nom du club *</Label>
              <Input
                value={formData.nom}
                onChange={(e) => setFormData({...formData, nom: e.target.value})}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select value={formData.categorie} onValueChange={(value) => setFormData({...formData, categorie: value})}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Elite">Elite</SelectItem>
                  <SelectItem value="Premier plan">Premier plan</SelectItem>
                  <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                  <SelectItem value="En développement">En développement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Pays *</Label>
              <Input
                value={formData.pays}
                onChange={(e) => setFormData({...formData, pays: e.target.value})}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Ville</Label>
              <Input
                value={formData.ville}
                onChange={(e) => setFormData({...formData, ville: e.target.value})}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stade</Label>
              <Input
                value={formData.stade}
                onChange={(e) => setFormData({...formData, stade: e.target.value})}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Capacité du stade</Label>
              <Input
                type="number"
                value={formData.capacite_stade}
                onChange={(e) => setFormData({...formData, capacite_stade: e.target.value})}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Président</Label>
              <Input
                value={formData.president}
                onChange={(e) => setFormData({...formData, president: e.target.value})}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Entraîneur</Label>
              <Input
                value={formData.entraineur}
                onChange={(e) => setFormData({...formData, entraineur: e.target.value})}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Directeur sportif</Label>
              <Input
                value={formData.directeur_sportif}
                onChange={(e) => setFormData({...formData, directeur_sportif: e.target.value})}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Budget annuel (M€)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.budget_annuel}
                onChange={(e) => setFormData({...formData, budget_annuel: e.target.value})}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Budget transfert (M€)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.budget_transfert}
                onChange={(e) => setFormData({...formData, budget_transfert: e.target.value})}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Dette (M€)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.dette}
                onChange={(e) => setFormData({...formData, dette: e.target.value})}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Valeur effectif (M€)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.valeur_effectif}
                onChange={(e) => setFormData({...formData, valeur_effectif: e.target.value})}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label>Palmarès (séparés par virgules)</Label>
            <Textarea
              value={formData.palmares}
              onChange={(e) => setFormData({...formData, palmares: e.target.value})}
              rows={2}
              placeholder="Ligue 1 (2020, 2021), Coupe de France (2019)..."
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>Historique</Label>
            <Textarea
              value={formData.historique}
              onChange={(e) => setFormData({...formData, historique: e.target.value})}
              rows={4}
              placeholder="Histoire et description du club..."
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>URL du logo</Label>
            <Input
              value={formData.logo_url}
              onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
              placeholder="https://..."
              className="mt-1.5"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
              {club ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}