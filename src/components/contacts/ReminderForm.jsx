import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function ReminderForm({ playerId, onSubmit }) {
  const { lang } = useLanguage();
  const [reminder, setReminder] = useState({
    player_id: playerId,
    titre: "",
    description: "",
    date_rappel: "",
    priorite: "Moyenne",
    statut: "À faire",
    type: "Appeler"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(reminder);
    setReminder({
      player_id: playerId,
      titre: "",
      description: "",
      date_rappel: "",
      priorite: "Moyenne",
      statut: "À faire",
      type: "Appeler"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t(lang,'reminderForm.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t(lang,'reminderForm.titleField')}</Label>
            <Input
              value={reminder.titre}
              onChange={(e) => setReminder({ ...reminder, titre: e.target.value })}
              placeholder={t(lang,'reminderForm.titlePlh')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t(lang,'reminderForm.date')}</Label>
              <Input
                type="date"
                value={reminder.date_rappel}
                onChange={(e) => setReminder({ ...reminder, date_rappel: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{t(lang,'reminderForm.typeAction')}</Label>
              <Select value={reminder.type} onValueChange={(value) => setReminder({ ...reminder, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Appeler">{t(lang,'reminderForm.typeCall')}</SelectItem>
                  <SelectItem value="Rencontrer">{t(lang,'reminderForm.typeMeet')}</SelectItem>
                  <SelectItem value="Envoyer email">{t(lang,'reminderForm.typeEmail')}</SelectItem>
                  <SelectItem value="Suivre dossier">{t(lang,'reminderForm.typeFollow')}</SelectItem>
                  <SelectItem value="Autre">{t(lang,'reminderForm.typeOther')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t(lang,'reminderForm.description')}</Label>
            <Textarea
              value={reminder.description}
              onChange={(e) => setReminder({ ...reminder, description: e.target.value })}
              placeholder={t(lang,'reminderForm.descriptionPlh')}
              rows={3}
            />
          </div>

          <div>
            <Label>{t(lang,'reminderForm.priority')}</Label>
            <Select value={reminder.priorite} onValueChange={(value) => setReminder({ ...reminder, priorite: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Haute">{t(lang,'reminderForm.priorityHigh')}</SelectItem>
                <SelectItem value="Moyenne">{t(lang,'reminderForm.priorityMedium')}</SelectItem>
                <SelectItem value="Basse">{t(lang,'reminderForm.priorityLow')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            {t(lang,'reminderForm.createBtn')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}