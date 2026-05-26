import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function TransferForm({ playerId, onSubmit }) {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState({
    player_id: playerId,
    date_transfert: "",
    club_depart: "",
    club_arrivee: "",
    montant: "",
    type_transfert: "Transfert définitif",
    duree_contrat: "",
    date_fin_pret: "",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      player_id: playerId,
      date_transfert: "",
      club_depart: "",
      club_arrivee: "",
      montant: "",
      type_transfert: "Transfert définitif",
      duree_contrat: "",
      date_fin_pret: "",
      notes: ""
    });
  };

  const isPret = formData.type_transfert === "Prêt";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {t(lang,'transfers.addTransfer')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_transfert">{t(lang,'transfers.date')}</Label>
              <Input
                id="date_transfert"
                type="date"
                value={formData.date_transfert}
                onChange={(e) => setFormData({ ...formData, date_transfert: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type_transfert">{t(lang,'transfers.type')}</Label>
              <Select
                value={formData.type_transfert}
                onValueChange={(value) => setFormData({ ...formData, type_transfert: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transfert définitif">{t(lang,'transfers.permanent2')}</SelectItem>
                  <SelectItem value="Prêt">{t(lang,'transfers.loan')}</SelectItem>
                  <SelectItem value="Libre">{t(lang,'transfers.freeTransfer')}</SelectItem>
                  <SelectItem value="Fin de prêt">{t(lang,'transfers.loanEnd')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="club_depart">{t(lang,'transfers.fromClub')}</Label>
              <Input
                id="club_depart"
                value={formData.club_depart}
                onChange={(e) => setFormData({ ...formData, club_depart: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="club_arrivee">{t(lang,'transfers.toClub')}</Label>
              <Input
                id="club_arrivee"
                value={formData.club_arrivee}
                onChange={(e) => setFormData({ ...formData, club_arrivee: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="montant">{t(lang,'transfers.amount')}</Label>
              <Input
                id="montant"
                type="number"
                step="0.1"
                value={formData.montant}
                onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
                placeholder={formData.type_transfert === "Libre" ? t(lang,'transfers.freePlh') : t(lang,'transfers.amountPlh')}
                disabled={formData.type_transfert === "Libre" || formData.type_transfert === "Fin de prêt"}
              />
            </div>

            {!isPret ? (
              <div>
                <Label htmlFor="duree_contrat">{t(lang,'transfers.duration')}</Label>
                <Input
                  id="duree_contrat"
                  value={formData.duree_contrat}
                  onChange={(e) => setFormData({ ...formData, duree_contrat: e.target.value })}
                  placeholder={t(lang,'transfers.durationPlh')}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="date_fin_pret">{t(lang,'transfers.loanEndDate')}</Label>
                <Input
                  id="date_fin_pret"
                  type="date"
                  value={formData.date_fin_pret}
                  onChange={(e) => setFormData({ ...formData, date_fin_pret: e.target.value })}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <Label htmlFor="notes">{t(lang,'transfers.transferNotes')}</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t(lang,'transfers.extraInfo')}
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
            {t(lang,'transfers.addTransferBtn')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}