import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function TransferForm({ playerId, onSubmit }) {
  const [formData, setFormData] = useState({
    player_id: playerId,
    date_transfert: "",
    club_depart: "",
    club_arrivee: "",
    montant: "",
    type_transfert: "Transfert définitif"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      player_id: playerId,
      date_transfert: "",
      club_depart: "",
      club_arrivee: "",
      montant: "",
      type_transfert: "Transfert définitif"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Ajouter un transfert
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_transfert">Date *</Label>
              <Input
                id="date_transfert"
                type="date"
                value={formData.date_transfert}
                onChange={(e) => setFormData({ ...formData, date_transfert: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type_transfert">Type *</Label>
              <Select
                value={formData.type_transfert}
                onValueChange={(value) => setFormData({ ...formData, type_transfert: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transfert définitif">Transfert définitif</SelectItem>
                  <SelectItem value="Prêt">Prêt</SelectItem>
                  <SelectItem value="Libre">Libre</SelectItem>
                  <SelectItem value="Fin de prêt">Fin de prêt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="club_depart">Club de départ</Label>
              <Input
                id="club_depart"
                value={formData.club_depart}
                onChange={(e) => setFormData({ ...formData, club_depart: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="club_arrivee">Club d'arrivée *</Label>
              <Input
                id="club_arrivee"
                value={formData.club_arrivee}
                onChange={(e) => setFormData({ ...formData, club_arrivee: e.target.value })}
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="montant">Montant (M€)</Label>
              <Input
                id="montant"
                type="number"
                step="0.1"
                value={formData.montant}
                onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
            Ajouter le transfert
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}