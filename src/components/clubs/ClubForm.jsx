import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Phone, Mail, Globe, User, Instagram, Twitter, ChevronDown, ChevronUp } from "lucide-react";

export default function ClubForm({ club, onSubmit, onCancel }) {
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
        <CardTitle>{club ? "Modifier le club" : "Nouveau club"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Identité */}
          <Section title="Identité" icon={Building2}>
            <div className="grid grid-cols-2 gap-4">
              <F label="Nom du club *">
                <Input value={formData.nom} onChange={set("nom")} required />
              </F>
              <F label="Catégorie">
                <Select value={formData.categorie} onValueChange={(v) => setFormData({ ...formData, categorie: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elite">Elite</SelectItem>
                    <SelectItem value="Premier plan">Premier plan</SelectItem>
                    <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                    <SelectItem value="En développement">En développement</SelectItem>
                  </SelectContent>
                </Select>
              </F>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <F label="Pays *">
                <Input value={formData.pays} onChange={set("pays")} required />
              </F>
              <F label="Ville">
                <Input value={formData.ville} onChange={set("ville")} />
              </F>
              <F label="Ligue / Championnat">
                <Input value={formData.ligue} onChange={set("ligue")} placeholder="ex: Ligue 1" />
              </F>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <F label="Stade">
                <Input value={formData.stade} onChange={set("stade")} />
              </F>
              <F label="Capacité">
                <Input type="number" value={formData.capacite_stade} onChange={set("capacite_stade")} />
              </F>
              <F label="Année de fondation">
                <Input type="number" value={formData.annee_fondation} onChange={set("annee_fondation")} />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Couleurs du club">
                <Input value={formData.couleurs} onChange={set("couleurs")} placeholder="ex: Rouge et Blanc" />
              </F>
              <F label="URL du logo">
                <Input value={formData.logo_url} onChange={set("logo_url")} placeholder="https://..." />
              </F>
            </div>
            {formData.logo_url && (
              <div className="flex items-center gap-3">
                <img src={formData.logo_url} alt="Logo" className="h-16 w-16 object-contain rounded border bg-slate-50 p-1" referrerPolicy="no-referrer" onError={e => e.target.style.display='none'} />
                <span className="text-xs text-slate-400">Aperçu du logo</span>
              </div>
            )}
            <F label="Adresse du siège">
              <Input value={formData.adresse} onChange={set("adresse")} placeholder="ex: 24 Rue du Comandant Guilbaud, Paris" />
            </F>
          </Section>

          {/* Direction */}
          <Section title="Direction" icon={User}>
            <div className="grid grid-cols-3 gap-4">
              <F label="Président">
                <Input value={formData.president} onChange={set("president")} />
              </F>
              <F label="Email président">
                <Input type="email" value={formData.president_email} onChange={set("president_email")} placeholder="president@club.com" />
              </F>
              <F label="Tél. président">
                <Input value={formData.president_telephone} onChange={set("president_telephone")} placeholder="+33 6..." />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Entraîneur">
                <Input value={formData.entraineur} onChange={set("entraineur")} />
              </F>
              <F label="Email entraîneur">
                <Input type="email" value={formData.entraineur_email} onChange={set("entraineur_email")} placeholder="coach@club.com" />
              </F>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <F label="Directeur sportif">
                <Input value={formData.directeur_sportif} onChange={set("directeur_sportif")} />
              </F>
              <F label="Email DS">
                <Input type="email" value={formData.directeur_sportif_email} onChange={set("directeur_sportif_email")} placeholder="ds@club.com" />
              </F>
              <F label="Tél. DS">
                <Input value={formData.directeur_sportif_telephone} onChange={set("directeur_sportif_telephone")} placeholder="+33 6..." />
              </F>
            </div>
          </Section>

          {/* Contact club */}
          <Section title="Contact du club" icon={Phone}>
            <div className="grid grid-cols-3 gap-4">
              <F label="Téléphone général">
                <Input value={formData.telephone} onChange={set("telephone")} placeholder="+33 1 23 45 67 89" />
              </F>
              <F label="Email général">
                <Input type="email" value={formData.email} onChange={set("email")} placeholder="contact@club.com" />
              </F>
              <F label="Site web">
                <Input value={formData.site_web} onChange={set("site_web")} placeholder="https://www.club.com" />
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Instagram (@handle)">
                <Input value={formData.instagram} onChange={set("instagram")} placeholder="@clubfc" />
              </F>
              <F label="Twitter/X (@handle)">
                <Input value={formData.twitter} onChange={set("twitter")} placeholder="@clubfc" />
              </F>
            </div>
          </Section>

          {/* Contact personne */}
          <Section title="Personne de contact" icon={Mail}>
            <div className="grid grid-cols-2 gap-4">
              <F label="Nom">
                <Input value={formData.contact_nom} onChange={set("contact_nom")} placeholder="Jean Dupont" />
              </F>
              <F label="Poste">
                <Input value={formData.contact_poste} onChange={set("contact_poste")} placeholder="Responsable transferts" />
              </F>
              <F label="Email direct">
                <Input type="email" value={formData.contact_email} onChange={set("contact_email")} placeholder="jean.dupont@club.com" />
              </F>
              <F label="Téléphone direct">
                <Input value={formData.contact_telephone} onChange={set("contact_telephone")} placeholder="+33 6 12 34 56 78" />
              </F>
            </div>
          </Section>

          {/* Finances */}
          <Section title="Finances" icon={Globe}>
            <div className="grid grid-cols-4 gap-4">
              <F label="Budget annuel (M€)">
                <Input type="number" step="0.1" value={formData.budget_annuel} onChange={set("budget_annuel")} />
              </F>
              <F label="Budget transfert (M€)">
                <Input type="number" step="0.1" value={formData.budget_transfert} onChange={set("budget_transfert")} />
              </F>
              <F label="Dette (M€)">
                <Input type="number" step="0.1" value={formData.dette} onChange={set("dette")} />
              </F>
              <F label="Valeur effectif (M€)">
                <Input type="number" step="0.1" value={formData.valeur_effectif} onChange={set("valeur_effectif")} />
              </F>
            </div>
          </Section>

          {/* Autres */}
          <div className="space-y-3">
            <F label="Palmarès (séparés par virgules)">
              <Textarea value={formData.palmares} onChange={set("palmares")} rows={2} placeholder="Ligue 1 (2020, 2021), Coupe de France (2019)..." />
            </F>
            <F label="Historique">
              <Textarea value={formData.historique} onChange={set("historique")} rows={4} placeholder="Histoire et description du club..." />
            </F>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Annuler</Button>
            <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
              {club ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
