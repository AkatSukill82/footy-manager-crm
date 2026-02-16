import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Calendar } from "lucide-react";
import { format } from "date-fns";

const interetColors = {
  "Très élevé": "bg-red-100 text-red-800 border-red-300",
  "Élevé": "bg-orange-100 text-orange-800 border-orange-300",
  "Moyen": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Faible": "bg-slate-100 text-slate-800 border-slate-300"
};

export default function PlayerNoteCard({ note, onUpdate }) {
  const [isEditing, setIsEditing] = useState(!note);
  const [formData, setFormData] = useState(note || {
    note: "",
    evaluation: "",
    interet: "Moyen",
    date_observation: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mes notes et évaluation</span>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Notes et observations</Label>
            <Textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Vos observations sur le joueur..."
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Évaluation (/10)</Label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={formData.evaluation}
                onChange={(e) => setFormData({ ...formData, evaluation: parseFloat(e.target.value) })}
              />
            </div>
            
            <div>
              <Label>Niveau d'intérêt</Label>
              <Select
                value={formData.interet}
                onValueChange={(value) => setFormData({ ...formData, interet: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Très élevé">Très élevé</SelectItem>
                  <SelectItem value="Élevé">Élevé</SelectItem>
                  <SelectItem value="Moyen">Moyen</SelectItem>
                  <SelectItem value="Faible">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Date d'observation</Label>
            <Input
              type="date"
              value={formData.date_observation}
              onChange={(e) => setFormData({ ...formData, date_observation: e.target.value })}
            />
          </div>
          
          <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!note) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mes notes et évaluation</span>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {note.note && (
          <div>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{note.note}</p>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          {note.evaluation && (
            <div>
              <span className="text-sm text-slate-600">Évaluation: </span>
              <span className="text-2xl font-bold text-blue-600">{note.evaluation}/10</span>
            </div>
          )}
          
          {note.interet && (
            <Badge className={interetColors[note.interet]}>
              {note.interet}
            </Badge>
          )}
        </div>
        
        {note.date_observation && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(note.date_observation), "dd/MM/yyyy")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}