import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";

export default function ReminderForm({ playerId, onSubmit }) {
  const [reminder, setReminder] = useState({
    player_id: playerId,
    titre: "",
    description: "",
    date_rappel: "",
    priorite: "Moyenne",
    statut: "À faire",
    type: "Appeler"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(reminder);
    setReminder({
      player_id: playerId,
      titre: "",
      description: "",
      date_rappel: "",
      priorite: "Moyenne",
      statut: "À faire",
      type: "Appeler"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Créer un rappel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Titre</Label>
            <Input
              value={reminder.titre}
              onChange={(e) => setReminder({ ...reminder, titre: e.target.value })}
              placeholder="Ex: Appeler l'agent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date du rappel</Label>
              <Input
                type="date"
                value={reminder.date_rappel}
                onChange={(e) => setReminder({ ...reminder, date_rappel: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Type d'action</Label>
              <Select value={reminder.type} onValueChange={(value) => setReminder({ ...reminder, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Appeler">Appeler</SelectItem>
                  <SelectItem value="Rencontrer">Rencontrer</SelectItem>
                  <SelectItem value="Envoyer email">Envoyer email</SelectItem>
                  <SelectItem value="Suivre dossier">Suivre dossier</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={reminder.description}
              onChange={(e) => setReminder({ ...reminder, description: e.target.value })}
              placeholder="Détails du rappel..."
              rows={3}
            />
          </div>

          <div>
            <Label>Priorité</Label>
            <Select value={reminder.priorite} onValueChange={(value) => setReminder({ ...reminder, priorite: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Haute">Haute</SelectItem>
                <SelectItem value="Moyenne">Moyenne</SelectItem>
                <SelectItem value="Basse">Basse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            Créer le rappel
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}