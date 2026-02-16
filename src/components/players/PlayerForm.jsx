import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

export default function PlayerForm({ player, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(player || {
    nom: "",
    age: "",
    date_naissance: "",
    poste: "",
    nationalite: "",
    club_actuel: "",
    valeur_marchande: "",
    pied_fort: "",
    taille: "",
    contrat_fin: "",
    photo_url: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{player ? "Modifier le joueur" : "Ajouter un joueur"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom">Nom complet *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="poste">Poste *</Label>
              <Select
                value={formData.poste}
                onValueChange={(value) => setFormData({ ...formData, poste: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gardien">Gardien</SelectItem>
                  <SelectItem value="Défenseur central">Défenseur central</SelectItem>
                  <SelectItem value="Latéral droit">Latéral droit</SelectItem>
                  <SelectItem value="Latéral gauche">Latéral gauche</SelectItem>
                  <SelectItem value="Milieu défensif">Milieu défensif</SelectItem>
                  <SelectItem value="Milieu central">Milieu central</SelectItem>
                  <SelectItem value="Milieu offensif">Milieu offensif</SelectItem>
                  <SelectItem value="Ailier droit">Ailier droit</SelectItem>
                  <SelectItem value="Ailier gauche">Ailier gauche</SelectItem>
                  <SelectItem value="Attaquant">Attaquant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="age">Âge</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
              />
            </div>
            
            <div>
              <Label htmlFor="date_naissance">Date de naissance</Label>
              <Input
                id="date_naissance"
                type="date"
                value={formData.date_naissance}
                onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="nationalite">Nationalité</Label>
              <Input
                id="nationalite"
                value={formData.nationalite}
                onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="club_actuel">Club actuel</Label>
              <Input
                id="club_actuel"
                value={formData.club_actuel}
                onChange={(e) => setFormData({ ...formData, club_actuel: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="valeur_marchande">Valeur marchande (M€)</Label>
              <Input
                id="valeur_marchande"
                type="number"
                step="0.1"
                value={formData.valeur_marchande}
                onChange={(e) => setFormData({ ...formData, valeur_marchande: parseFloat(e.target.value) })}
              />
            </div>
            
            <div>
              <Label htmlFor="pied_fort">Pied fort</Label>
              <Select
                value={formData.pied_fort}
                onValueChange={(value) => setFormData({ ...formData, pied_fort: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Droit">Droit</SelectItem>
                  <SelectItem value="Gauche">Gauche</SelectItem>
                  <SelectItem value="Les deux">Les deux</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="taille">Taille (cm)</Label>
              <Input
                id="taille"
                type="number"
                value={formData.taille}
                onChange={(e) => setFormData({ ...formData, taille: parseInt(e.target.value) })}
              />
            </div>
            
            <div>
              <Label htmlFor="contrat_fin">Fin de contrat</Label>
              <Input
                id="contrat_fin"
                type="date"
                value={formData.contrat_fin}
                onChange={(e) => setFormData({ ...formData, contrat_fin: e.target.value })}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="photo_url">URL Photo</Label>
              <Input
                id="photo_url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {player ? "Mettre à jour" : "Ajouter"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}