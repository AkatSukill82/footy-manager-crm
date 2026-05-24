import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Save, X } from "lucide-react";

const CATEGORIES = [
  { key: "note_technique",     label: "Technique",                color: "from-blue-400 to-blue-600" },
  { key: "note_physique",      label: "Physique",                 color: "from-green-400 to-green-600" },
  { key: "note_intelligence",  label: "Intelligence de jeu",      color: "from-purple-400 to-purple-600" },
  { key: "note_mental",        label: "Mental / Caractère",       color: "from-orange-400 to-orange-600" },
  { key: "note_attitude",      label: "Attitude & Esprit d'équipe", color: "from-pink-400 to-pink-600" },
];

function RatingBar({ value, onChange, color }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`
            h-6 flex-1 rounded transition-all duration-150 focus:outline-none
            ${n <= (value || 0)
              ? `bg-gradient-to-r ${color} opacity-90`
              : "bg-slate-100 hover:bg-slate-200"
            }
          `}
          title={`${n}/10`}
        />
      ))}
      <span className="w-8 text-right text-sm font-bold text-slate-700">
        {value ? `${value}/10` : "—"}
      </span>
    </div>
  );
}

function average(player) {
  const vals = CATEGORIES.map((c) => player[c.key]).filter((v) => v != null && v > 0);
  if (!vals.length) return null;
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

export default function PlayerScoutingRatings({ player, onSave }) {
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(CATEGORIES.map((c) => [c.key, player[c.key] ?? null]))
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleChange(key, val) {
    setDraft((d) => ({ ...d, [key]: val }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setDraft(Object.fromEntries(CATEGORIES.map((c) => [c.key, player[c.key] ?? null])));
    setDirty(false);
  }

  const avg = average({ ...player, ...draft });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-500" />
            Notes Scout
          </CardTitle>
          {avg && (
            <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
              Moy. {avg}/10
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <div className="flex justify-between mb-1">
              <span className="text-sm text-slate-600">{cat.label}</span>
            </div>
            <RatingBar
              value={draft[cat.key]}
              onChange={(v) => handleChange(cat.key, v)}
              color={cat.color}
            />
          </div>
        ))}

        {dirty && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              <Save className="w-3 h-3 mr-1.5" />
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset} disabled={saving}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
