import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Phone, Mail, Globe, User, Instagram, Twitter, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";
import ImageSearchPicker from "../ui/ImageSearchPicker";

export default function ClubForm({ club, onSubmit, onCancel }) {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState(club || {
    nom: "", pays: "", ville: "", ligue: "", stade: "", capacite_stade: "",
    annee_fondation: "", couleurs: "", president: "", president_email: "",
    president_telephone: "", entraineur: "", entraineur_email: "",
    directeur_sportif: "", directeur_sportif_email: "", directeur_sportif_telephone: "",
    email: "", telephone: "", site_web: "", instagram: "", twitter: "", adresse: "",
    contact_nom: "", contact_poste: "", contact_email: "", contact_telephone: "",
    budget_annuel: "", budget_transfert: "", dette: "", valeur_effectif: "",
    palmares: "", historique: "", logo_url: "", categorie: "Intermédiaire",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      capacite_stade: formData.capacite_stade ? parseInt(formData.capacite_stade) : null,
      annee_fondation: formData.annee_fondation ? parseInt(formData.annee_fondation) : null,
      budget_annuel: formData.budget_annuel ? parseFloat(formData.budget_annuel) : null,
      budget_transfert: formData.budget_transfert ? parseFloat(formData.budget_transfert) : null,
      dette: formData.dette ? parseFloat(formData.dette) : null,
      valeur_effectif: formData.valeur_effectif ? parseFloat(formData.valeur_effectif) : null,
    };
    onSubmit(data);
  };

  const F = ({ label, children }) => (
    <div>
      <Label className="text-xs font-medium text-slate-500 mb-1 block">{label}</Label>
      {children}
    </div>
  );

  const Section = ({ title, icon: Icon, children }) => (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-500 uppercase flex items-center gap-2 border-b pb-2">
        <Icon className="w-4 h-4" />{title}
      </h3>
      {children}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{club ? t(lang,'clubForm.titleEdit') : t(lang,'clubForm.titleNew')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Identité */}
          <Section title={t(lang,'clubForm.identity')} icon={Building2}>
            <div className="grid grid-cols-2 gap-4">
              <F label={t(lang,'clubForm.name')}>
                <Input value={formData.nom} onChange={set("nom")} required />
              </F>
              <F label={t(lang,'clubForm.category')}>
                <Select value={formData.categorie} onValueChange={(v) => setFormData({ ...formData, categorie: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elite">Elite</SelectItem>
                    <SelectItem value="Premier plan">{t(lang,'clubs.topLevel')}</SelectItem>
                    <SelectItem value="Intermédiaire">{t(lang,'clubs.intermediate')}</SelectItem>
                    <SelectItem value="En développement">{t(lang,'clubs.developing')}</SelectItem>
                  </SelectContent>
                </Select>
              </F>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <F label={t(lang,'clubForm.country')}>
                <Input value={formData.pays} onChange={set("pays")} required />
              </F>
              <F label={t(lang,'clubForm.city')}>
                <Input value={formData.ville} onChange={set("ville")} />
              </F>
              <F label={t(lang,'clubForm.league')}>
                <Input value={formData.ligue} onChange={set("ligue")} placeholder={t(lang,'clubForm.leaguePlh')} />
              </F>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <F label={t(lang,'clubForm.stadium')}>
                <Input value={formData.stade} onChange={set("stade")} />
              </F>
              <F label={t(lang,'clubForm.capacity')}>
                <Input type="number" value={formData.capacite_stade} onChange={set("capacite_stade")} />
              </F>
              <F label={t(lang,'clubForm.founded')}>
                <Input type="number" value={formData.annee_fondation} onChange={set("annee_fondation")} />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label={t(lang,'clubForm.colors')}>
                <Input value={formData.couleurs} onChange={set("couleurs")} placeholder={t(lang,'clubForm.colorsPlh')} />
              </F>
              <F label={t(lang,'clubForm.logoUrl')}>
                <div className="flex gap-2">
                  <Input value={formData.logo_url} onChange={set("logo_url")} placeholder="https://..." className="flex-1" />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setLogoPickerOpen(true)}
                    title="Rechercher sur Google Images"
                    className="flex-shrink-0 border-slate-200"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </F>
            </div>
            {formData.logo_url && (
              <div className="flex items-center gap-3">
                <img src={formData.logo_url} alt="Logo" className="h-16 w-16 object-contain rounded border bg-slate-50 p-1" referrerPolicy="no-referrer" onError={e => e.target.style.display='none'} />
                <span className="text-xs text-slate-400">{t(lang,'clubForm.logoPreview')}</span>
              </div>
            )}
            <ImageSearchPicker
              open={logoPickerOpen}
              onClose={() => setLogoPickerOpen(false)}
              onSelect={url => setFormData(f => ({ ...f, logo_url: url }))}
              initialQuery={formData.nom ? `${formData.nom} football club` : ""}
              type="club"
            />
            <F label={t(lang,'clubForm.headquarters')}>
              <Input value={formData.adresse} onChange={set("adresse")} placeholder={t(lang,'clubForm.headquartersPlh')} />
            </F>
          </Section>

          {/* Direction */}
          <Section title={t(lang,'clubForm.management')} icon={User}>
            <div className="grid grid-cols-3 gap-4">
              <F label={t(lang,'clubForm.president')}>
                <Input value={formData.president} onChange={set("president")} />
              </F>
              <F label={t(lang,'clubForm.presidentEmail')}>
                <Input type="email" value={formData.president_email} onChange={set("president_email")} placeholder={t(lang,'clubForm.presidentEmailPlh')} />
              </F>
              <F label={t(lang,'clubForm.presidentPhone')}>
                <Input value={formData.president_telephone} onChange={set("president_telephone")} placeholder={t(lang,'clubForm.presidentPhonePlh')} />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label={t(lang,'clubForm.coach')}>
                <Input value={formData.entraineur} onChange={set("entraineur")} />
              </F>
              <F label={t(lang,'clubForm.coachEmail')}>
                <Input type="email" value={formData.entraineur_email} onChange={set("entraineur_email")} placeholder={t(lang,'clubForm.coachEmailPlh')} />
              </F>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <F label={t(lang,'clubForm.sportingDirector')}>
                <Input value={formData.directeur_sportif} onChange={set("directeur_sportif")} />
              </F>
              <F label={t(lang,'clubForm.dsEmail')}>
                <Input type="email" value={formData.directeur_sportif_email} onChange={set("directeur_sportif_email")} placeholder={t(lang,'clubForm.dsEmailPlh')} />
              </F>
              <F label={t(lang,'clubForm.dsPhone')}>
                <Input value={formData.directeur_sportif_telephone} onChange={set("directeur_sportif_telephone")} placeholder={t(lang,'clubForm.presidentPhonePlh')} />
              </F>
            </div>
          </Section>

          {/* Contact club */}
          <Section title={t(lang,'clubForm.contact')} icon={Phone}>
            <div className="grid grid-cols-3 gap-4">
              <F label={t(lang,'clubForm.generalPhone')}>
                <Input value={formData.telephone} onChange={set("telephone")} placeholder={t(lang,'clubForm.generalPhonePlh')} />
              </F>
              <F label={t(lang,'clubForm.generalEmail')}>
                <Input type="email" value={formData.email} onChange={set("email")} placeholder={t(lang,'clubForm.generalEmailPlh')} />
              </F>
              <F label={t(lang,'clubForm.website')}>
                <Input value={formData.site_web} onChange={set("site_web")} placeholder={t(lang,'clubForm.websitePlh')} />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label={t(lang,'clubForm.instagram')}>
                <Input value={formData.instagram} onChange={set("instagram")} placeholder={t(lang,'clubForm.instagramPlh')} />
              </F>
              <F label={t(lang,'clubForm.twitter')}>
                <Input value={formData.twitter} onChange={set("twitter")} placeholder={t(lang,'clubForm.instagramPlh')} />
              </F>
            </div>
          </Section>

          {/* Contact personne */}
          <Section title={t(lang,'clubForm.contactPerson')} icon={Mail}>
            <div className="grid grid-cols-2 gap-4">
              <F label={t(lang,'clubForm.contactName')}>
                <Input value={formData.contact_nom} onChange={set("contact_nom")} placeholder={t(lang,'clubForm.contactNamePlh')} />
              </F>
              <F label={t(lang,'clubForm.contactRole')}>
                <Input value={formData.contact_poste} onChange={set("contact_poste")} placeholder={t(lang,'clubForm.contactRolePlh')} />
              </F>
              <F label={t(lang,'clubForm.contactEmail')}>
                <Input type="email" value={formData.contact_email} onChange={set("contact_email")} placeholder={t(lang,'clubForm.contactEmailPlh')} />
              </F>
              <F label={t(lang,'clubForm.contactPhone')}>
                <Input value={formData.contact_telephone} onChange={set("contact_telephone")} placeholder={t(lang,'clubForm.contactPhonePlh')} />
              </F>
            </div>
          </Section>

          {/* Finances */}
          <Section title={t(lang,'clubForm.finances')} icon={Globe}>
            <div className="grid grid-cols-4 gap-4">
              <F label={t(lang,'clubForm.annualBudget')}>
                <Input type="number" step="0.1" value={formData.budget_annuel} onChange={set("budget_annuel")} />
              </F>
              <F label={t(lang,'clubForm.transferBudget')}>
                <Input type="number" step="0.1" value={formData.budget_transfert} onChange={set("budget_transfert")} />
              </F>
              <F label={t(lang,'clubForm.debt')}>
                <Input type="number" step="0.1" value={formData.dette} onChange={set("dette")} />
              </F>
              <F label={t(lang,'clubForm.squadValue')}>
                <Input type="number" step="0.1" value={formData.valeur_effectif} onChange={set("valeur_effectif")} />
              </F>
            </div>
          </Section>

          {/* Autres */}
          <div className="space-y-3">
            <F label={t(lang,'clubForm.trophies')}>
              <Textarea value={formData.palmares} onChange={set("palmares")} rows={2} placeholder={t(lang,'clubForm.tropheesPlh')} />
            </F>
            <F label={t(lang,'clubForm.history')}>
              <Textarea value={formData.historique} onChange={set("historique")} rows={4} placeholder={t(lang,'clubForm.historyPlh')} />
            </F>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">{t(lang,'common.cancel')}</Button>
            <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
              {club ? t(lang,'clubForm.updateBtn') : t(lang,'clubForm.createBtn')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
