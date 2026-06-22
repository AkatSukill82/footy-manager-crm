import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, User, TrendingUp, FileText, ChevronDown, ChevronUp, Phone, MapPin } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const POSTES = [
  "Gardien", "Défenseur central", "Latéral droit", "Latéral gauche",
  "Milieu défensif", "Milieu central", "Milieu offensif",
  "Ailier droit", "Ailier gauche", "Attaquant"
];

// ⚠️ Définis AU NIVEAU MODULE (pas dans le composant) : sinon ils sont recréés
// à chaque rendu → React remonte les champs → perte de focus quand on tape.
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

export default function PlayerForm({ player, onSubmit, onCancel }) {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState({
    nom: "", age: "", date_naissance: "", lieu_naissance: "", poste: "", poste_secondaire: "",
    nationalite: "", nationalite_secondaire: "", club_actuel: "", valeur_marchande: "",
    pied_fort: "", taille: "", poids: "", contrat_fin: "", photo_url: "",
    en_pret: false, club_proprietaire: "", pret_fin: "",
    date_arrivee_club: "", option_contrat: "",
    salaire: "", salaire_semaine: "", agent: "", agence: "", agent_email: "", agent_telephone: "",
    email: "", telephone: "", whatsapp: "", instagram: "", twitter: "", linkedin: "",
    adresse: "", ville_residence: "", pays_residence: "",
    numero_maillot: "", transfermarkt_id: "", sofascore_id: "", fotmob_id: "", besoccer_id: "",
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

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <User className="w-4 h-4 text-green-700" />
          </div>
          <CardTitle className="text-lg">{player ? t(lang,'playerForm.titleEdit') : t(lang,'playerForm.titleAdd')}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" title="Fermer" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Identité ── */}
          <section>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> {t(lang,'playerForm.identity')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F id="nom" label={t(lang,'playerForm.fullName')}>
                <Input id="nom" value={formData.nom} onChange={set("nom")} required placeholder={t(lang,'playerForm.fullNamePlh')} />
              </F>
              <F id="poste" label={t(lang,'playerForm.position')}>
                <Select value={formData.poste} onValueChange={setSelect("poste")}>
                  <SelectTrigger><SelectValue placeholder={t(lang,'playerForm.positionSelect')} /></SelectTrigger>
                  <SelectContent>
                    {POSTES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </F>
              <F id="poste_secondaire" label={t(lang,'playerForm.positionSec')}>
                <Select value={formData.poste_secondaire || ""} onValueChange={setSelect("poste_secondaire")}>
                  <SelectTrigger><SelectValue placeholder={t(lang,'playerForm.positionSecPlh')} /></SelectTrigger>
                  <SelectContent>
                    {POSTES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </F>
              <F id="nationalite" label={t(lang,'playerForm.nationality')}>
                <Input id="nationalite" value={formData.nationalite} onChange={set("nationalite")} placeholder={t(lang,'playerForm.nationalityPlh')} />
              </F>
              <F id="nationalite_secondaire" label={t(lang,'playerForm.nationality2')}>
                <Input id="nationalite_secondaire" value={formData.nationalite_secondaire || ""} onChange={set("nationalite_secondaire")} placeholder={t(lang,'playerForm.nationality2Plh')} />
              </F>
              <F id="date_naissance" label={t(lang,'playerForm.dob')}>
                <Input id="date_naissance" type="date" value={formData.date_naissance} onChange={set("date_naissance")} />
              </F>
              <F id="age" label={t(lang,'playerForm.age')}>
                <Input id="age" type="number" min="14" max="50" value={formData.age} onChange={setNum("age")} placeholder={t(lang,'playerForm.agePlh')} />
              </F>
              <F id="lieu_naissance" label={t(lang,'playerForm.birthplace')}>
                <Input id="lieu_naissance" value={formData.lieu_naissance || ""} onChange={set("lieu_naissance")} placeholder={t(lang,'playerForm.birthplacePlh')} />
              </F>
              <F id="pied_fort" label={t(lang,'playerForm.foot')}>
                <Select value={formData.pied_fort} onValueChange={setSelect("pied_fort")}>
                  <SelectTrigger><SelectValue placeholder={t(lang,'playerForm.positionSelect')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Droit">{t(lang,'playerForm.footRight')}</SelectItem>
                    <SelectItem value="Gauche">{t(lang,'playerForm.footLeft')}</SelectItem>
                    <SelectItem value="Les deux">{t(lang,'playerForm.footBoth')}</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <F id="taille" label={t(lang,'playerForm.height')}>
                <Input id="taille" type="number" min="150" max="220" value={formData.taille} onChange={setNum("taille")} placeholder={t(lang,'playerForm.heightPlh')} />
              </F>
              <F id="poids" label={t(lang,'playerForm.weight')}>
                <Input id="poids" type="number" min="50" max="120" value={formData.poids || ""} onChange={setNum("poids")} placeholder={t(lang,'playerForm.weightPlh')} />
              </F>
            </div>

            {/* Photo */}
            <div className="mt-4">
              <F id="photo_url" label={t(lang,'playerForm.photoUrl')}>
                <Input id="photo_url" value={formData.photo_url} onChange={set("photo_url")} placeholder="https://..." />
              </F>
              {formData.photo_url && (
                <img src={formData.photo_url} alt={t(lang,'playerForm.photoPreview')} className="mt-2 h-20 w-20 rounded-full object-cover border shadow-sm" referrerPolicy="no-referrer" onError={e => e.target.style.display='none'} />
              )}
            </div>
          </section>

          {/* ── Club & Contrat ── */}
          <section>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> {t(lang,'playerForm.clubContract')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F id="club_actuel" label={t(lang,'playerForm.currentClub')}>
                <Input id="club_actuel" value={formData.club_actuel} onChange={set("club_actuel")} placeholder={t(lang,'playerForm.currentClubPlh')} />
              </F>
              <F id="contrat_fin" label={t(lang,'playerForm.contractEnd')}>
                <Input id="contrat_fin" type="date" value={formData.contrat_fin} onChange={set("contrat_fin")} />
              </F>
              <F id="date_arrivee_club" label={t(lang,'playerForm.joined')}>
                <Input id="date_arrivee_club" type="date" value={formData.date_arrivee_club || ""} onChange={set("date_arrivee_club")} />
              </F>
              <F id="option_contrat" label={t(lang,'playerForm.contractOption')}>
                <Input id="option_contrat" value={formData.option_contrat || ""} onChange={set("option_contrat")} placeholder={t(lang,'playerForm.contractOptionPlh')} />
              </F>
              <F id="valeur_marchande" label={t(lang,'playerForm.marketValue')}>
                <Input id="valeur_marchande" type="number" step="0.5" min="0" value={formData.valeur_marchande} onChange={setNum("valeur_marchande")} placeholder={t(lang,'playerForm.marketValuePlh')} />
              </F>
              <F id="salaire" label={t(lang,'playerForm.salary')}>
                <Input id="salaire" type="number" step="0.1" min="0" value={formData.salaire || ""} onChange={setNum("salaire")} placeholder={t(lang,'playerForm.salaryPlh')} />
              </F>
              <F id="salaire_semaine" label={t(lang,'playerForm.salaryWeek')}>
                <Input id="salaire_semaine" type="number" step="1" min="0" value={formData.salaire_semaine || ""} onChange={setNum("salaire_semaine")} placeholder={t(lang,'playerForm.salaryWeekPlh')} />
              </F>
              <F id="numero_maillot" label={t(lang,'playerForm.shirt')}>
                <Input id="numero_maillot" type="number" min="1" max="99" value={formData.numero_maillot || ""} onChange={setNum("numero_maillot")} placeholder={t(lang,'playerForm.shirtPlh')} />
              </F>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <F id="agent" label={t(lang,'playerForm.agent')}>
                <Input id="agent" value={formData.agent || ""} onChange={set("agent")} placeholder={t(lang,'playerForm.agentPlh')} />
              </F>
              <F id="agence" label={t(lang,'playerForm.agency')}>
                <Input id="agence" value={formData.agence || ""} onChange={set("agence")} placeholder={t(lang,'playerForm.agencyPlh')} />
              </F>
              <F id="agent_email" label={t(lang,'playerForm.agentEmail')}>
                <Input id="agent_email" type="email" value={formData.agent_email || ""} onChange={set("agent_email")} placeholder={t(lang,'playerForm.agentEmailPlh')} />
              </F>
              <F id="agent_telephone" label={t(lang,'playerForm.agentPhone')}>
                <Input id="agent_telephone" value={formData.agent_telephone || ""} onChange={set("agent_telephone")} placeholder={t(lang,'playerForm.agentPhonePlh')} />
              </F>
            </div>

            {/* Prêt */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                <input type="checkbox" checked={!!formData.en_pret} onChange={(e) => setFormData({ ...formData, en_pret: e.target.checked })} className="w-4 h-4 rounded border-slate-300" />
                {t(lang,'playerForm.onLoan')}
              </label>
              {formData.en_pret && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <F id="club_proprietaire" label={t(lang,'playerForm.ownerClub')}>
                    <Input id="club_proprietaire" value={formData.club_proprietaire || ""} onChange={set("club_proprietaire")} placeholder={t(lang,'playerForm.ownerClubPlh')} />
                  </F>
                  <F id="pret_fin" label={t(lang,'playerForm.loanEnd')}>
                    <Input id="pret_fin" type="date" value={formData.pret_fin || ""} onChange={set("pret_fin")} />
                  </F>
                </div>
              )}
            </div>
          </section>

          {/* ── Contacts & Réseaux ── */}
          <section>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {t(lang,'playerForm.contacts')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F id="email" label={t(lang,'playerForm.email')}>
                <Input id="email" type="email" value={formData.email || ""} onChange={set("email")} placeholder={t(lang,'playerForm.emailPlh')} />
              </F>
              <F id="telephone" label={t(lang,'playerForm.phone')}>
                <Input id="telephone" value={formData.telephone || ""} onChange={set("telephone")} placeholder={t(lang,'playerForm.agentPhonePlh')} />
              </F>
              <F id="whatsapp" label={t(lang,'playerForm.whatsapp')}>
                <Input id="whatsapp" value={formData.whatsapp || ""} onChange={set("whatsapp")} placeholder={t(lang,'playerForm.agentPhonePlh')} />
              </F>
              <F id="instagram" label={t(lang,'playerForm.instagram')}>
                <Input id="instagram" value={formData.instagram || ""} onChange={set("instagram")} placeholder={t(lang,'playerForm.instagramPlh')} />
              </F>
              <F id="twitter" label={t(lang,'playerForm.twitter')}>
                <Input id="twitter" value={formData.twitter || ""} onChange={set("twitter")} placeholder={t(lang,'playerForm.instagramPlh')} />
              </F>
              <F id="linkedin" label={t(lang,'playerForm.linkedin')}>
                <Input id="linkedin" value={formData.linkedin || ""} onChange={set("linkedin")} placeholder={t(lang,'playerForm.linkedinPlh')} />
              </F>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <F id="adresse" label={t(lang,'playerForm.address')}>
                <Input id="adresse" value={formData.adresse || ""} onChange={set("adresse")} placeholder={t(lang,'playerForm.addressPlh')} />
              </F>
              <F id="ville_residence" label={t(lang,'playerForm.city')}>
                <Input id="ville_residence" value={formData.ville_residence || ""} onChange={set("ville_residence")} placeholder={t(lang,'playerForm.cityPlh')} />
              </F>
              <F id="pays_residence" label={t(lang,'playerForm.country')}>
                <Input id="pays_residence" value={formData.pays_residence || ""} onChange={set("pays_residence")} placeholder={t(lang,'playerForm.countryPlh')} />
              </F>
            </div>
          </section>

          {/* ── Statistiques (section repliable) ── */}
          <section>
            <SectionHeader
              icon={FileText}
              label={t(lang,'playerForm.stats')}
              expanded={showStats}
              onToggle={() => setShowStats(!showStats)}
            />

            {showStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <F id="buts" label={t(lang,'playerForm.goals')}>
                  <Input id="buts" type="number" min="0" value={formData.buts || ""} onChange={setNum("buts")} placeholder={t(lang,'playerForm.goalsPlh')} />
                </F>
                <F id="passes_decisives" label={t(lang,'playerForm.assists')}>
                  <Input id="passes_decisives" type="number" min="0" value={formData.passes_decisives || ""} onChange={setNum("passes_decisives")} placeholder={t(lang,'playerForm.assistsPlh')} />
                </F>
                <F id="matchs_joues" label={t(lang,'playerForm.matches')}>
                  <Input id="matchs_joues" type="number" min="0" value={formData.matchs_joues || ""} onChange={setNum("matchs_joues")} placeholder={t(lang,'playerForm.matchesPlh')} />
                </F>
                <F id="note_moyenne" label={t(lang,'playerForm.rating')}>
                  <Input id="note_moyenne" type="number" step="0.1" min="0" max="10" value={formData.note_moyenne || ""} onChange={setNum("note_moyenne")} placeholder={t(lang,'playerForm.ratingPlh')} />
                </F>
                <F id="transfermarkt_id" label={t(lang,'playerForm.tmId')}>
                  <Input id="transfermarkt_id" value={formData.transfermarkt_id || ""} onChange={set("transfermarkt_id")} placeholder={t(lang,'playerForm.tmIdPlh')} />
                </F>
                <F id="sofascore_id" label={t(lang,'playerForm.sofaId')}>
                  <Input id="sofascore_id" value={formData.sofascore_id || ""} onChange={set("sofascore_id")} placeholder={t(lang,'playerForm.sofaIdPlh')} />
                </F>
                <F id="fotmob_id" label="ID FotMob">
                  <Input id="fotmob_id" value={formData.fotmob_id || ""} onChange={set("fotmob_id")} placeholder="Ex: 1050859 (URL FotMob du joueur)" />
                </F>
                <F id="besoccer_id" label="ID BeSoccer">
                  <Input id="besoccer_id" value={formData.besoccer_id || ""} onChange={set("besoccer_id")} placeholder="ID BeSoccer (optionnel)" />
                </F>
              </div>
            )}
          </section>

          {/* ── Profil scout (section repliable) ── */}
          <section>
            <SectionHeader
              icon={FileText}
              label={t(lang,'playerForm.scoutProfile')}
              expanded={showScout}
              onToggle={() => setShowScout(!showScout)}
            />

            {showScout && (
              <div className="space-y-4">
                <F id="style_jeu" label={t(lang,'playerForm.playStyle')}>
                  <Textarea id="style_jeu" value={formData.style_jeu || ""} onChange={set("style_jeu")} rows={2} placeholder={t(lang,'playerForm.playStylePlh')} />
                </F>
                <F id="forces" label={t(lang,'playerForm.strengths')}>
                  <Textarea id="forces" value={formData.forces || ""} onChange={set("forces")} rows={2} placeholder={t(lang,'playerForm.strengthsPlh')} />
                </F>
                <F id="faiblesses" label={t(lang,'playerForm.weaknesses')}>
                  <Textarea id="faiblesses" value={formData.faiblesses || ""} onChange={set("faiblesses")} rows={2} placeholder="..." />
                </F>
                <F id="stats_resume" label={t(lang,'playerForm.careerSummary')}>
                  <Textarea id="stats_resume" value={formData.stats_resume || ""} onChange={set("stats_resume")} rows={3} placeholder="..." />
                </F>
                <div className="grid grid-cols-2 gap-4">
                  <F id="note_globale_scout" label={t(lang,'playerForm.scoutRating')}>
                    <Input id="note_globale_scout" type="number" min="0" max="100" value={formData.note_globale_scout || ""} onChange={setNum("note_globale_scout")} placeholder={t(lang,'playerForm.scoutRatingPlh')} />
                  </F>
                  <F id="valeur_marchande_peak" label={t(lang,'playerForm.peakValue')}>
                    <Input id="valeur_marchande_peak" type="number" step="0.5" min="0" value={formData.valeur_marchande_peak || ""} onChange={setNum("valeur_marchande_peak")} placeholder={t(lang,'playerForm.peakValuePlh')} />
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <F id="palmares" label={t(lang,'playerForm.trophies')}>
                    <Textarea id="palmares" value={formData.palmares || ""} onChange={set("palmares")} rows={2} placeholder={t(lang,'playerForm.tropheesPlh')} />
                  </F>
                  <F id="distinctions" label={t(lang,'playerForm.awards')}>
                    <Textarea id="distinctions" value={formData.distinctions || ""} onChange={set("distinctions")} rows={2} placeholder={t(lang,'playerForm.awardsPlh')} />
                  </F>
                </div>
              </div>
            )}
          </section>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>{t(lang,'common.cancel')}</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              {player ? t(lang,'playerForm.saveBtn') : t(lang,'playerForm.addBtn')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
