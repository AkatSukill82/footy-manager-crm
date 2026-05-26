import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function TeamForm({ team, onSubmit, onCancel }) {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState(team || {
    nom: "",
    formation: "4-3-3",
    description: "",
    budget: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          {team ? t(lang, 'teams.editTeam') : t(lang, 'teams.newTeam')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t(lang, 'teams.nameLabel')}</Label>
            <Input
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder={t(lang, 'teams.namePlh')}
              required
            />
          </div>

          <div>
            <Label>{t(lang, 'teams.formationLabel')}</Label>
            <Select value={formData.formation} onValueChange={(value) => setFormData({ ...formData, formation: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4-4-2">4-4-2</SelectItem>
                <SelectItem value="4-3-3">4-3-3</SelectItem>
                <SelectItem value="3-5-2">3-5-2</SelectItem>
                <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                <SelectItem value="3-4-3">3-4-3</SelectItem>
                <SelectItem value="5-3-2">5-3-2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t(lang, 'teams.budgetLabel')}</Label>
            <Input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
              placeholder={t(lang, 'teams.budgetPlh')}
            />
          </div>

          <div>
            <Label>{t(lang, 'teams.descriptionLabel')}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t(lang, 'teams.descPlh')}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {team ? t(lang, 'teams.updateBtn') : t(lang, 'teams.createBtn')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t(lang, 'common.cancel')}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
