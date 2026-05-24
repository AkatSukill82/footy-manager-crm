import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, User, TrendingUp, FileText, ChevronDown, ChevronUp } from "lucide-react";

const POSTES = [
  "Gardien", "Défenseur central", "Latéral droit", "Latéral gauche",
  "Milieu défensif", "Milieu central", "Milieu offensif",
  "Ailier droit", "Ailier gauche", "Attaquant"
];

export default function PlayerForm({ player, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    nom: "", age: "", date_naissance: "", poste: "",
    nationalite: "", club_actuel: "", valeur_marchande: "",
    pied_fort: "", taille: "", contrat_fin: "", photo_url: "",
    ...player
  });
  const [showExtra, setShowExtra] = useState(false);

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });
  const setNum = (field) => (e) => setFormData({ ...formData, [field]: e.target.value ? Number(e.target.value) : "" });
  const setSelect = (field) => (value) => setFormData({ ...formData, [field]: value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const Field = ({ id, label, children }) => (
    <div>
      <Label htmlFor={id} className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
      {children}
    </div>
  );

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <User className="w-4 h-4 text-green-700" />
          </div>
          <CardTitle className="text-lg">{player ? "Modifier le joueur" : "Ajouter un joueur"}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Identité ── */}
          <section>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Identité
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field id="nom" label="Nom complet *">
                <Input id="nom" value={formData.nom} onChange={set("nom")} required placeholder="ex: Kylian Mbappé" />
              </Field>
              <Field id="poste" label="Poste *">
                <Select value={formData.poste} onValueChange={setSelect("poste")}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {POSTES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="nationalite" label="Nationalité">
                <Input id="nationalite" value={formData.nationalite} onChange={set("nationalite")} placeholder="ex: Français" />
              </Field>
              <Field id="date_naissance" label="Date de naissance">
                <Input id="date_naissance" type="date" value={formData.date_naissance} onChange={set("date_naissance")} />
              </Field>
              <Field id="age" label="Âge">
                <Input id="age" type="number" min="14" max="50" value={formData.age} onChange={setNum("age")} placeholder="ex: 25" />
              </Field>
              <Field id="pied_fort" label="Pied fort">
                <Select value={formData.pied_fort} onValueChange={setSelect("pied_fort")}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Droit">Droit</SelectItem>
                    <SelectItem value="Gauche">Gauche</SelectItem>
                    <SelectItem value="Les deux">Les deux</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field id="taille" label="Taille (cm)">
                <Input id="taille" type="number" min="150" max="220" value={formData.taille} onChange={setNum("taille")} placeholder="ex: 180" />
              </Field>
              <Field id="poids" label="Poids (kg)">
                <Input id="poids" type="number" min="50" max="120" value={formData.poids || ""} onChange={setNum("poids")} placeholder="ex: 75" />
              </Field>
            </div>
          </section>

          {/* ── Club & Contrat ── */}
          <section>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Club & Contrat
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field id="club_actuel" label="Club actuel">
                <Input id="club_actuel" value={formData.club_actuel} onChange={set("club_actuel")} placeholder="ex: Real Madrid" />
              </Field>
              <Field id="contrat_fin" label="Fin de contrat">
                <Input id="contrat_fin" type="date" value={formData.contrat_fin} onChange={set("contrat_fin")} />
              </Field>
              <Field id="valeur_marchande" label="Valeur marchande (M€)">
                <Input id="valeur_marchande" type="number" step="0.5" min="0" value={formData.valeur_marchande} onChange={setNum("valeur_marchande")} placeholder="ex: 80" />
              </Field>
              <Field id="salaire" label="Salaire annuel (M€)">
                <Input id="salaire" type="number" step="0.1" min="0" value={formData.salaire || ""} onChange={setNum("salaire")} placeholder="ex: 12" />
              </Field>
              <Field id="agent" label="Agent / représentant">
                <Input id="agent" value={formData.agent || ""} onChange={set("agent")} placeholder="ex: Jorge Mendes" />
              </Field>
              <Field id="numero_maillot" label="Numéro de maillot">
                <Input id="numero_maillot" type="number" min="1" max="99" value={formData.numero_maillot || ""} onChange={setNum("numero_maillot")} placeholder="ex: 9" />
              </Field>
            </div>
          </section>

          {/* ── Statistiques (section repliable) ── */}
          <section>
            <button
              type="button"
              onClick={() => setShowExtra(!showExtra)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 hover:text-slate-600 transition-colors w-full text-left"
            >
              <FileText className="w-3.5 h-3.5" />
              Statistiques & notes
              {showExtra ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
            </button>

            {showExtra && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field id="buts" label="Buts (saison)">
                  <Input id="buts" type="number" min="0" value={formData.buts || ""} onChange={setNum("buts")} placeholder="ex: 15" />
                </Field>
                <Field id="passes_decisives" label="Passes décisives (saison)">
                  <Input id="passes_decisives" type="number" min="0" value={formData.passes_decisives || ""} onChange={setNum("passes_decisives")} placeholder="ex: 8" />
                </Field>
                <Field id="matchs_joues" label="Matchs joués (saison)">
                  <Input id="matchs_joues" type="number" min="0" value={formData.matchs_joues || ""} onChange={setNum("matchs_joues")} placeholder="ex: 30" />
                </Field>
                <Field id="note_moyenne" label="Note moyenne (SofaScore)">
                  <Input id="note_moyenne" type="number" step="0.1" min="0" max="10" value={formData.note_moyenne || ""} onChange={setNum("note_moyenne")} placeholder="ex: 7.5" />
                </Field>
                <Field id="poste_secondaire" label="Poste secondaire">
                  <Select value={formData.poste_secondaire || ""} onValueChange={setSelect("poste_secondaire")}>
                    <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Aucun</SelectItem>
                      {POSTES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="transfermarkt_id" label="ID Transfermarkt">
                  <Input id="transfermarkt_id" value={formData.transfermarkt_id || ""} onChange={set("transfermarkt_id")} placeholder="ex: 342229" />
                </Field>
                <div className="md:col-span-2">
                  <Field id="photo_url" label="URL Photo">
                    <Input id="photo_url" value={formData.photo_url} onChange={set("photo_url")} placeholder="https://..." />
                  </Field>
                  {formData.photo_url && (
                    <img src={formData.photo_url} alt="Aperçu" className="mt-2 h-16 w-16 rounded-full object-cover border" referrerPolicy="no-referrer" />
                  )}
                </div>
              </div>
            )}
          </section>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {player ? "Enregistrer les modifications" : "Ajouter le joueur"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}