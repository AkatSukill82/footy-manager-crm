import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Calendar, PlusCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

const interetColors = {
  "Très élevé": "bg-red-100 text-red-800 border-red-300",
  "Élevé": "bg-orange-100 text-orange-800 border-orange-300",
  "Moyen": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Faible": "bg-slate-100 text-slate-800 border-slate-300"
};

const empty = {
  note: "",
  evaluation: "",
  interet: "Moyen",
  date_observation: new Date().toISOString().split('T')[0]
};

export default function PlayerNoteCard({ note, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(note || empty);

  // Sync formData when note arrives from server (after save / first load)
  useEffect(() => {
    if (note) {
      setFormData(note);
      setIsEditing(false);
    }
  }, [note?.id, note?.note, note?.evaluation, note?.interet]);

  async function handleSubmit() {
    setSaving(true);
    try {
      await onUpdate(formData);
      // isEditing will be set to false by the useEffect above
      // once the parent re-queries and passes the new note prop
    } finally {
      setSaving(false);
    }
  }

  // ── Edit mode ─────────────────────────────────────────────
  if (isEditing) {
    return (
      <Card className="border-2 border-blue-400">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Mes notes et évaluation</span>
            <Button variant="ghost" size="icon" onClick={() => {
              setIsEditing(false);
              if (note) setFormData(note); // restore on cancel
            }}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Notes et observations</Label>
            <Textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Vos observations sur le joueur…"
              rows={5}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Évaluation (/10)</Label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={formData.evaluation}
                onChange={(e) => setFormData({ ...formData, evaluation: parseFloat(e.target.value) || "" })}
                placeholder="7.5"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Niveau d'intérêt</Label>
              <Select value={formData.interet} onValueChange={(v) => setFormData({ ...formData, interet: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Label className="text-xs text-slate-500 mb-1 block">Date d'observation</Label>
            <Input
              type="date"
              value={formData.date_observation}
              onChange={(e) => setFormData({ ...formData, date_observation: e.target.value })}
            />
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
            {saving
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement…</>
              : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── View mode (note exists) ───────────────────────────────
  if (note) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Mes notes et évaluation</span>
            <Button variant="ghost" size="icon" onClick={() => { setFormData(note); setIsEditing(true); }}>
              <Edit2 className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {note.note && (
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-3">
              {note.note}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {note.evaluation != null && note.evaluation !== "" && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">Évaluation</span>
                <span className="text-xl font-bold text-blue-600">{note.evaluation}<span className="text-sm font-normal text-slate-400">/10</span></span>
              </div>
            )}
            {note.interet && (
              <Badge className={interetColors[note.interet] || "bg-slate-100 text-slate-800"}>
                {note.interet}
              </Badge>
            )}
          </div>

          {note.date_observation && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>Observé le {format(new Date(note.date_observation), "dd/MM/yyyy")}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Empty state — no note yet ─────────────────────────────
  return (
    <Card className="border-dashed border-slate-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-slate-600">Mes notes et évaluation</CardTitle>
      </CardHeader>
      <CardContent>
        <button
          onClick={() => { setFormData(empty); setIsEditing(true); }}
          className="w-full flex items-center justify-center gap-2 py-6 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-dashed border-slate-200 hover:border-blue-300"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Ajouter une note</span>
        </button>
      </CardContent>
    </Card>
  );
}
