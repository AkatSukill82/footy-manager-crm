import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Calendar, PlusCircle, Loader2, Trash2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const interetColors = {
  "Très élevé": "bg-red-100 text-red-800 border-red-300",
  "Élevé": "bg-orange-100 text-orange-800 border-orange-300",
  "Moyen": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Faible": "bg-slate-100 text-slate-800 border-slate-300"
};

const emptyForm = () => ({
  note: "",
  evaluation: "",
  interet: "Moyen",
  date_observation: new Date().toISOString().split('T')[0]
});

// ── Single note item in history ────────────────────────────────────────────────
function NoteHistoryItem({ note, onUpdate, onDelete }) {
  const { lang } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    note: note.note || "",
    evaluation: note.evaluation ?? "",
    interet: note.interet || "Moyen",
    date_observation: note.date_observation || new Date().toISOString().split('T')[0]
  });

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(note.id, formData);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (isEditing) {
    return (
      <div className="border border-blue-300 rounded-xl p-4 bg-blue-50 space-y-3">
        <Textarea
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          placeholder="Vos observations..."
          rows={4}
          className="resize-none bg-white"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Évaluation /10</Label>
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
            <Label className="text-xs text-slate-500 mb-1 block">Intérêt</Label>
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
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm" className="bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
            Enregistrer
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            <X className="w-3 h-3 mr-1" /> Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white hover:bg-slate-50 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {note.note && (
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mb-2">{note.note}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {note.evaluation != null && note.evaluation !== "" && (
              <span className="text-sm font-bold text-blue-600">
                {note.evaluation}<span className="text-xs font-normal text-slate-400">/10</span>
              </span>
            )}
            {note.interet && (
              <Badge className={`text-xs ${interetColors[note.interet] || "bg-slate-100 text-slate-800"}`}>
                {note.interet}
              </Badge>
            )}
            {note.date_observation && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(note.date_observation), "dd/MM/yyyy")}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-3 h-3 text-slate-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(note.id)}>
            <Trash2 className="w-3 h-3 text-red-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PlayerNoteCard({ notes = [], onCreate, onUpdate, onDelete }) {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  async function handleSubmit() {
    if (!formData.note.trim()) return;
    setSaving(true);
    try {
      await onCreate(formData);
      setFormData(emptyForm());
    } finally {
      setSaving(false);
    }
  }

  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.date_observation || b.created_date) - new Date(a.date_observation || a.created_date)
  );

  return (
    <div className="space-y-4">
      {/* ── Form: nouvelle note ── */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-blue-600" />
            Mes notes et évaluation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Observations</Label>
            <Textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Écrivez vos observations sur ce joueur..."
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Évaluation /10</Label>
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
              <Label className="text-xs text-slate-500 mb-1 block">Intérêt</Label>
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
          <Button
            onClick={handleSubmit}
            disabled={saving || !formData.note.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</>
              : <><Save className="w-4 h-4 mr-2" />Enregistrer la note</>}
          </Button>
        </CardContent>
      </Card>

      {/* ── Historique des notes ── */}
      {sortedNotes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setShowHistory(!showHistory)}
            >
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                Historique des notes et évaluations
                <Badge variant="outline" className="text-xs">{sortedNotes.length}</Badge>
              </CardTitle>
              {showHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
          </CardHeader>
          {showHistory && (
            <CardContent className="space-y-3">
              {sortedNotes.map((note) => (
                <NoteHistoryItem
                  key={note.id}
                  note={note}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}