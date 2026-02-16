import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export default function ContactForm({ playerId, onSubmit }) {
  const [contact, setContact] = useState({
    player_id: playerId,
    date_contact: new Date().toISOString().split('T')[0],
    type_contact: "Appel téléphonique",
    contact_avec: "",
    role_contact: "Agent",
    notes: "",
    resultat: "Neutre"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(contact);
    setContact({
      player_id: playerId,
      date_contact: new Date().toISOString().split('T')[0],
      type_contact: "Appel téléphonique",
      contact_avec: "",
      role_contact: "Agent",
      notes: "",
      resultat: "Neutre"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un contact</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={contact.date_contact}
                onChange={(e) => setContact({ ...contact, date_contact: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Type de contact</Label>
              <Select value={contact.type_contact} onValueChange={(value) => setContact({ ...contact, type_contact: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Appel téléphonique">Appel téléphonique</SelectItem>
                  <SelectItem value="Réunion">Réunion</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Visite">Visite</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contact avec</Label>
              <Input
                value={contact.contact_avec}
                onChange={(e) => setContact({ ...contact, contact_avec: e.target.value })}
                placeholder="Nom de la personne"
                required
              />
            </div>
            <div>
              <Label>Rôle</Label>
              <Select value={contact.role_contact} onValueChange={(value) => setContact({ ...contact, role_contact: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agent">Agent</SelectItem>
                  <SelectItem value="Directeur sportif">Directeur sportif</SelectItem>
                  <SelectItem value="Entraîneur">Entraîneur</SelectItem>
                  <SelectItem value="Joueur">Joueur</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={contact.notes}
              onChange={(e) => setContact({ ...contact, notes: e.target.value })}
              placeholder="Résumé du contact..."
              rows={4}
            />
          </div>

          <div>
            <Label>Résultat</Label>
            <Select value={contact.resultat} onValueChange={(value) => setContact({ ...contact, resultat: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Positif">Positif</SelectItem>
                <SelectItem value="Neutre">Neutre</SelectItem>
                <SelectItem value="Négatif">Négatif</SelectItem>
                <SelectItem value="À suivre">À suivre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter le contact
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}