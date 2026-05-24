import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Phone, Mail, Globe, User } from "lucide-react";

export default function ClubForm({ club, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(club || {
    nom: "",
    pays: "",
    ville: "",
    ligue: "",
    stade: "",
    capacite_stade: "",
    annee_fondation: "",
    president: "",
    entraineur: "",
    directeur_sportif: "",
    budget_annuel: "",
    budget_transfert: "",
    dette: "",
    valeur_effectif: "",
    palmares: "",
    historique: "",
    logo_url: "",
    categorie: "Intermédiaire",
    // Contact
    email: "",
    telephone: "",
    site_web: "",
    contact_nom: "",
    contact_poste: "",
    contact_email: "",
    contact_telephone: "",
  });

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
              <div>
                <Label>Nom du club *</Label>
                <Input value={formData.nom} onChange={set("nom")} required className="mt-1.5" />
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select value={formData.categorie} onValueChange={(v) => setFormData({ ...formData, categorie: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elite">Elite</SelectItem>
                    <SelectItem value="Premier plan">Premier plan</SelectItem>
                    <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                    <SelectItem value="En développement">En développement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Pays *</Label>
                <Input value={formData.pays} onChange={set("pays")} required className="mt-1.5" />
              </div>
              <div>
                <Label>Ville</Label>
                <Input value={formData.ville} onChange={set("ville")} className="mt-1.5" />
              </div>
              <div>
                <Label>Ligue</Label>
                <Input value={formData.ligue} onChange={set("ligue")} className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stade</Label>
                <Input value={formData.stade} onChange={set("stade")} className="mt-1.5" />
              </div>
              <div>
                <Label>Capacité</Label>
                <Input type="number" value={formData.capacite_stade} onChange={set("capacite_stade")} className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Année de fondation</Label>
                <Input type="number" value={formData.annee_fondation} onChange={set("annee_fondation")} className="mt-1.5" />
              </div>
              <div>
                <Label>URL du logo</Label>
                <Input value={formData.logo_url} onChange={set("logo_url")} placeholder="https://..." className="mt-1.5" />
              </div>
            </div>
          </Section>

          {/* Direction */}
          <Section title="Direction" icon={User}>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Président</Label>
                <Input value={formData.president} onChange={set("president")} className="mt-1.5" />
              </div>
              <div>
                <Label>Entraîneur</Label>
                <Input value={formData.entraineur} onChange={set("entraineur")} className="mt-1.5" />
              </div>
              <div>
                <Label>Directeur sportif</Label>
                <Input value={formData.directeur_sportif} onChange={set("directeur_sportif")} className="mt-1.5" />
              </div>
            </div>
          </Section>

          {/* Contact club */}
          <Section title="Contact du club" icon={Phone}>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Téléphone</Label>
                <Input value={formData.telephone} onChange={set("telephone")} placeholder="+33 1 23 45 67 89" className="mt-1.5" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={set("email")} placeholder="contact@club.com" className="mt-1.5" />
              </div>
              <div>
                <Label>Site web</Label>
                <Input value={formData.site_web} onChange={set("site_web")} placeholder="https://www.club.com" className="mt-1.5" />
              </div>
            </div>
          </Section>

          {/* Contact personne */}
          <Section title="Personne de contact" icon={Mail}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom</Label>
                <Input value={formData.contact_nom} onChange={set("contact_nom")} placeholder="Jean Dupont" className="mt-1.5" />
              </div>
              <div>
                <Label>Poste</Label>
                <Input value={formData.contact_poste} onChange={set("contact_poste")} placeholder="Responsable transferts" className="mt-1.5" />
              </div>
              <div>
                <Label>Email direct</Label>
                <Input type="email" value={formData.contact_email} onChange={set("contact_email")} placeholder="jean.dupont@club.com" className="mt-1.5" />
              </div>
              <div>
                <Label>Téléphone direct</Label>
                <Input value={formData.contact_telephone} onChange={set("contact_telephone")} placeholder="+33 6 12 34 56 78" className="mt-1.5" />
              </div>
            </div>
          </Section>

          {/* Finances */}
          <Section title="Finances" icon={Globe}>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Budget annuel (M€)</Label>
                <Input type="number" step="0.1" value={formData.budget_annuel} onChange={set("budget_annuel")} className="mt-1.5" />
              </div>
              <div>
                <Label>Budget transfert (M€)</Label>
                <Input type="number" step="0.1" value={formData.budget_transfert} onChange={set("budget_transfert")} className="mt-1.5" />
              </div>
              <div>
                <Label>Dette (M€)</Label>
                <Input type="number" step="0.1" value={formData.dette} onChange={set("dette")} className="mt-1.5" />
              </div>
              <div>
                <Label>Valeur effectif (M€)</Label>
                <Input type="number" step="0.1" value={formData.valeur_effectif} onChange={set("valeur_effectif")} className="mt-1.5" />
              </div>
            </div>
          </Section>

          {/* Autres */}
          <div className="space-y-3">
            <div>
              <Label>Palmarès (séparés par virgules)</Label>
              <Textarea value={formData.palmares} onChange={set("palmares")} rows={2} placeholder="Ligue 1 (2020, 2021), Coupe de France (2019)..." className="mt-1.5" />
            </div>
            <div>
              <Label>Historique</Label>
              <Textarea value={formData.historique} onChange={set("historique")} rows={4} placeholder="Histoire et description du club..." className="mt-1.5" />
            </div>
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
