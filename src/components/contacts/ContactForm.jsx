import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function ContactForm({ playerId, onSubmit }) {
  const { lang } = useLanguage();
  const [contact, setContact] = useState({
    player_id: playerId,
    date_contact: new Date().toISOString().split('T')[0],
    type_contact: "Appel téléphonique",
    contact_avec: "",
    role_contact: "Agent",
    notes: "",
    resultat: "Neutre"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(contact);
    setContact({
      player_id: playerId,
      date_contact: new Date().toISOString().split('T')[0],
      type_contact: "Appel téléphonique",
      contact_avec: "",
      role_contact: "Agent",
      notes: "",
      resultat: "Neutre"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(lang,'contactForm.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t(lang,'contactForm.date')}</Label>
              <Input
                type="date"
                value={contact.date_contact}
                onChange={(e) => setContact({ ...contact, date_contact: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{t(lang,'contactForm.type')}</Label>
              <Select value={contact.type_contact} onValueChange={(value) => setContact({ ...contact, type_contact: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Appel téléphonique">{t(lang,'contactForm.typePhone')}</SelectItem>
                  <SelectItem value="Réunion">{t(lang,'contactForm.typeMeeting')}</SelectItem>
                  <SelectItem value="Email">{t(lang,'contactForm.typeEmail')}</SelectItem>
                  <SelectItem value="Visite">{t(lang,'contactForm.typeVisit')}</SelectItem>
                  <SelectItem value="Autre">{t(lang,'contactForm.typeOther')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t(lang,'contactForm.contactWith')}</Label>
              <Input
                value={contact.contact_avec}
                onChange={(e) => setContact({ ...contact, contact_avec: e.target.value })}
                placeholder={t(lang,'contactForm.contactWithPlh')}
                required
              />
            </div>
            <div>
              <Label>{t(lang,'contactForm.role')}</Label>
              <Select value={contact.role_contact} onValueChange={(value) => setContact({ ...contact, role_contact: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agent">{t(lang,'contactForm.roleAgent')}</SelectItem>
                  <SelectItem value="Directeur sportif">{t(lang,'contactForm.roleSportingDirector')}</SelectItem>
                  <SelectItem value="Entraîneur">{t(lang,'contactForm.roleCoach')}</SelectItem>
                  <SelectItem value="Joueur">{t(lang,'contactForm.rolePlayer')}</SelectItem>
                  <SelectItem value="Autre">{t(lang,'contactForm.roleOther')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t(lang,'contactForm.notes')}</Label>
            <Textarea
              value={contact.notes}
              onChange={(e) => setContact({ ...contact, notes: e.target.value })}
              placeholder={t(lang,'contactForm.notesPlh')}
              rows={4}
            />
          </div>

          <div>
            <Label>{t(lang,'contactForm.result')}</Label>
            <Select value={contact.resultat} onValueChange={(value) => setContact({ ...contact, resultat: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Positif">{t(lang,'contactForm.resultPositive')}</SelectItem>
                <SelectItem value="Neutre">{t(lang,'contactForm.resultNeutral')}</SelectItem>
                <SelectItem value="Négatif">{t(lang,'contactForm.resultNegative')}</SelectItem>
                <SelectItem value="À suivre">{t(lang,'contactForm.resultFollowUp')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            {t(lang,'contactForm.addBtn')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}