import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, User, TrendingUp, FileText, ChevronDown, ChevronUp, Phone, MapPin } from "lucide-react";

const POSTES = [
  "Gardien", "Défenseur central", "Latéral droit", "Latéral gauche",
  "Milieu défensif", "Milieu central", "Milieu offensif",
  "Ailier droit", "Ailier gauche", "Attaquant"
];

export default function PlayerForm({ player, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    nom: "", age: "", date_naissance: "", lieu_naissance: "", poste: "", poste_secondaire: "",
    nationalite: "", nationalite_secondaire: "", club_actuel: "", valeur_marchande: "",
    pied_fort: "", taille: "", poids: "", contrat_fin: "", photo_url: "",
    salaire: "", salaire_semaine: "", agent: "", agence: "", agent_email: "", agent_telephone: "",
    email: "", telephone: "", whatsapp: "", instagram: "", twitter: "", linkedin: "",
    adresse: "", ville_residence: "", pays_residence: "",
    numero_maillot: "", transfermarkt_id: "", sofascore_id: "",
    ...player
  });
  const [showStats, setShowStats] = useState(false);
  const [showScout, setShowScout] = useState(false);

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });
  const setNum = (field) => (e) => setFormData({ ...formData, [field]: e.target.value ? Number(e.target.value) : "" });
  const setSelect = (field) => (value) => setFormData({ ...formData, [field]: value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const F = ({ id, label, children }) => (
    <div>
      <Label htmlFor={id} className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
      {children}
    </div>
  );

  const SectionHeader = ({ icon: Icon, label, expanded, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 hover:text-slate-600 transition-colors w-full text-left"
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {expanded ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
    </button>
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
              <F id="nom" label="Nom complet *">
                <Input id="nom" value={formData.nom} onChange={set("nom")} required placeholder="ex: Kylian Mbappé" />
              </F>
              <F id="poste" label="Poste *">
                <Select value={formData.poste} onValueChange={setSelect("poste")}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {POSTES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </F>
              <F id="poste_secondaire" label="Poste secondaire">
                <Select value={formData.poste_secondaire || ""} onValueChange={setSelect("poste_secondaire")}>
                  <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                  <SelectContent>
                    {POSTES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </F>
              <F id="nationalite" label="Nationalité">
                <Input id="nationalite" value={formData.nationalite} onChange={set("nationalite")} placeholder="ex: Français" />
              </F>
              <F id="nationalite_secondaire" label="2ème nationalité">
                <Input id="nationalite_secondaire" value={formData.nationalite_secondaire || ""} onChange={set("nationalite_secondaire")} placeholder="ex: Marocain" />
              </F>
              <F id="date_naissance" label="Date de naissance">
                <Input id="date_naissance" type="date" value={formData.date_naissance} onChange={set("date_naissance")} />
              </F>
              <F id="age" label="Âge">
                <Input id="age" type="number" min="14" max="50" value={formData.age} onChange={setNum("age")} placeholder="ex: 25" />
              </F>
              <F id="lieu_naissance" label="Lieu de naissance">
                <Input id="lieu_naissance" value={formData.lieu_naissance || ""} onChange={set("lieu_naissance")} placeholder="ex: Paris, France" />
              </F>
              <F id="pied_fort" label="Pied fort">
                <Select value={formData.pied_fort} onValueChange={setSelect("pied_fort")}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Droit">Droit</SelectItem>
                    <SelectItem value="Gauche">Gauche</SelectItem>
                    <SelectItem value="Les deux">Les deux</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F id="taille" label="Taille (cm)">
                <Input id="taille" type="number" min="150" max="220" value={formData.taille} onChange={setNum("taille")} placeholder="ex: 180" />
              </F>
              <F id="poids" label="Poids (kg)">
                <Input id="poids" type="number" min="50" max="120" value={formData.poids || ""} onChange={setNum("poids")} placeholder="ex: 75" />
              </F>
            </div>

            {/* Photo */}
            <div className="mt-4">
              <F id="photo_url" label="URL Photo du joueur">
                <Input id="photo_url" value={formData.photo_url} onChange={set("photo_url")} placeholder="https://..." />
              </F>
              {formData.photo_url && (
                <img src={formData.photo_url} alt="Aperçu" className="mt-2 h-20 w-20 rounded-full object-cover border shadow-sm" referrerPolicy="no-referrer" onError={e => e.target.style.display='none'} />
              )}
            </div>
          </section>

          {/* ── Club & Contrat ── */}
          <section>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Club & Contrat
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F id="club_actuel" label="Club actuel">
                <Input id="club_actuel" value={formData.club_actuel} onChange={set("club_actuel")} placeholder="ex: Real Madrid" />
              </F>
              <F id="contrat_fin" label="Fin de contrat">
                <Input id="contrat_fin" type="date" value={formData.contrat_fin} onChange={set("contrat_fin")} />
              </F>
              <F id="valeur_marchande" label="Valeur marchande (M€)">
                <Input id="valeur_marchande" type="number" step="0.5" min="0" value={formData.valeur_marchande} onChange={setNum("valeur_marchande")} placeholder="ex: 80" />
              </F>
              <F id="salaire" label="Salaire annuel (M€)">
                <Input id="salaire" type="number" step="0.1" min="0" value={formData.salaire || ""} onChange={setNum("salaire")} placeholder="ex: 12" />
              </F>
              <F id="salaire_semaine" label="Salaire / semaine (k€)">
                <Input id="salaire_semaine" type="number" step="1" min="0" value={formData.salaire_semaine || ""} onChange={setNum("salaire_semaine")} placeholder="ex: 230" />
              </F>
              <F id="numero_maillot" label="Numéro de maillot">
                <Input id="numero_maillot" type="number" min="1" max="99" value={formData.numero_maillot || ""} onChange={setNum("numero_maillot")} placeholder="ex: 9" />
              </F>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <F id="agent" label="Agent / représentant">
                <Input id="agent" value={formData.agent || ""} onChange={set("agent")} placeholder="ex: Jorge Mendes" />
              </F>
              <F id="agence" label="Agence">
                <Input id="agence" value={formData.agence || ""} onChange={set("agence")} placeholder="ex: Gestifute" />
              </F>
              <F id="agent_email" label="Email de l'agent">
                <Input id="agent_email" type="email" value={formData.agent_email || ""} onChange={set("agent_email")} placeholder="agent@agence.com" />
              </F>
              <F id="agent_telephone" label="Téléphone de l'agent">
                <Input id="agent_telephone" value={formData.agent_telephone || ""} onChange={set("agent_telephone")} placeholder="+33 6..." />
              </F>
            </div>
          </section>

          {/* ── Contacts & Réseaux ── */}
          <section>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Contacts & Réseaux
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F id="email" label="Email du joueur">
                <Input id="email" type="email" value={formData.email || ""} onChange={set("email")} placeholder="joueur@email.com" />
              </F>
              <F id="telephone" label="Téléphone">
                <Input id="telephone" value={formData.telephone || ""} onChange={set("telephone")} placeholder="+33 6..." />
              </F>
              <F id="whatsapp" label="WhatsApp">
                <Input id="whatsapp" value={formData.whatsapp || ""} onChange={set("whatsapp")} placeholder="+33 6..." />
              </F>
              <F id="instagram" label="Instagram (@handle)">
                <Input id="instagram" value={formData.instagram || ""} onChange={set("instagram")} placeholder="@joueur" />
              </F>
              <F id="twitter" label="Twitter/X (@handle)">
                <Input id="twitter" value={formData.twitter || ""} onChange={set("twitter")} placeholder="@joueur" />
              </F>
              <F id="linkedin" label="LinkedIn">
                <Input id="linkedin" value={formData.linkedin || ""} onChange={set("linkedin")} placeholder="https://linkedin.com/in/..." />
              </F>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <F id="adresse" label="Adresse">
                <Input id="adresse" value={formData.adresse || ""} onChange={set("adresse")} placeholder="123 rue..." />
              </F>
              <F id="ville_residence" label="Ville de résidence">
                <Input id="ville_residence" value={formData.ville_residence || ""} onChange={set("ville_residence")} placeholder="ex: Madrid" />
              </F>
              <F id="pays_residence" label="Pays de résidence">
                <Input id="pays_residence" value={formData.pays_residence || ""} onChange={set("pays_residence")} placeholder="ex: Espagne" />
              </F>
            </div>
          </section>

          {/* ── Statistiques (section repliable) ── */}
          <section>
            <SectionHeader
              icon={FileText}
              label="Statistiques & IDs"
              expanded={showStats}
              onToggle={() => setShowStats(!showStats)}
            />

            {showStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F id="buts" label="Buts (saison)">
                  <Input id="buts" type="number" min="0" value={formData.buts || ""} onChange={setNum("buts")} placeholder="ex: 15" />
                </F>
                <F id="passes_decisives" label="Passes décisives (saison)">
                  <Input id="passes_decisives" type="number" min="0" value={formData.passes_decisives || ""} onChange={setNum("passes_decisives")} placeholder="ex: 8" />
                </F>
                <F id="matchs_joues" label="Matchs joués (saison)">
                  <Input id="matchs_joues" type="number" min="0" value={formData.matchs_joues || ""} onChange={setNum("matchs_joues")} placeholder="ex: 30" />
                </F>
                <F id="note_moyenne" label="Note moyenne (SofaScore)">
                  <Input id="note_moyenne" type="number" step="0.1" min="0" max="10" value={formData.note_moyenne || ""} onChange={setNum("note_moyenne")} placeholder="ex: 7.5" />
                </F>
                <F id="transfermarkt_id" label="ID Transfermarkt">
                  <Input id="transfermarkt_id" value={formData.transfermarkt_id || ""} onChange={set("transfermarkt_id")} placeholder="ex: 342229" />
                </F>
                <F id="sofascore_id" label="ID SofaScore">
                  <Input id="sofascore_id" value={formData.sofascore_id || ""} onChange={set("sofascore_id")} placeholder="ex: 977978" />
                </F>
              </div>
            )}
          </section>

          {/* ── Profil scout (section repliable) ── */}
          <section>
            <SectionHeader
              icon={FileText}
              label="Profil scout"
              expanded={showScout}
              onToggle={() => setShowScout(!showScout)}
            />

            {showScout && (
              <div className="space-y-4">
                <F id="style_jeu" label="Style de jeu">
                  <Textarea id="style_jeu" value={formData.style_jeu || ""} onChange={set("style_jeu")} rows={2} placeholder="Description du style de jeu..." />
                </F>
                <F id="forces" label="Points forts">
                  <Textarea id="forces" value={formData.forces || ""} onChange={set("forces")} rows={2} placeholder="Vitesse, technique, vision du jeu..." />
                </F>
                <F id="faiblesses" label="Points faibles">
                  <Textarea id="faiblesses" value={formData.faiblesses || ""} onChange={set("faiblesses")} rows={2} placeholder="..." />
                </F>
                <F id="stats_resume" label="Résumé carrière">
                  <Textarea id="stats_resume" value={formData.stats_resume || ""} onChange={set("stats_resume")} rows={3} placeholder="..." />
                </F>
                <div className="grid grid-cols-2 gap-4">
                  <F id="note_globale_scout" label="Note globale scout (0-100)">
                    <Input id="note_globale_scout" type="number" min="0" max="100" value={formData.note_globale_scout || ""} onChange={setNum("note_globale_scout")} placeholder="ex: 78" />
                  </F>
                  <F id="valeur_marchande_peak" label="Valeur peak carrière (M€)">
                    <Input id="valeur_marchande_peak" type="number" step="0.5" min="0" value={formData.valeur_marchande_peak || ""} onChange={setNum("valeur_marchande_peak")} placeholder="ex: 120" />
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <F id="palmares" label="Palmarès (séparés par virgules)">
                    <Textarea id="palmares" value={formData.palmares || ""} onChange={set("palmares")} rows={2} placeholder="Ligue 1 (2020), Champions League (2022)..." />
                  </F>
                  <F id="distinctions" label="Distinctions individuelles">
                    <Textarea id="distinctions" value={formData.distinctions || ""} onChange={set("distinctions")} rows={2} placeholder="Ballon d'or 2022, TOTY 2023..." />
                  </F>
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
