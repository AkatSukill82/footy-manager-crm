import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function ShareContentModal({ isOpen, onClose, onSubmit, players, teams }) {
  const { lang } = useLanguage();
  const [formData, setFormData] = useState({
    type: "player_profile",
    player_id: "",
    team_id: "",
    titre: "",
    description: "",
    insights: "",
    tags: "",
    visibilite: "reseau"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      type: "player_profile",
      player_id: "",
      team_id: "",
      titre: "",
      description: "",
      insights: "",
      tags: "",
      visibilite: "reseau"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t(lang, 'network.shareModalTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t(lang, 'network.contentType')}</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="player_profile">{t(lang, 'network.typePlayerProfile')}</SelectItem>
                <SelectItem value="team_analysis">{t(lang, 'network.typeTeamAnalysis')}</SelectItem>
                <SelectItem value="market_insight">{t(lang, 'network.typeMarketInsight')}</SelectItem>
                <SelectItem value="transfer_opportunity">{t(lang, 'network.typeTransferOpp')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === "player_profile" && (
            <div>
              <Label>{t(lang, 'transfers.player')}</Label>
              <Select value={formData.player_id} onValueChange={(value) => setFormData({...formData, player_id: value})}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={t(lang, 'transfers.selectPlayer')} />
                </SelectTrigger>
                <SelectContent>
                  {players.map(pl => (
                    <SelectItem key={pl.id} value={pl.id}>{pl.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.type === "team_analysis" && (
            <div>
              <Label>{t(lang, 'teams.title')}</Label>
              <Select value={formData.team_id} onValueChange={(value) => setFormData({...formData, team_id: value})}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={t(lang, 'network.selectTeamPlh')} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(tm => (
                    <SelectItem key={tm.id} value={tm.id}>{tm.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>{t(lang, 'network.titleLabel')}</Label>
            <Input
              value={formData.titre}
              onChange={(e) => setFormData({...formData, titre: e.target.value})}
              placeholder={t(lang, 'network.titlePlh')}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>{t(lang, 'network.descLabel')}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder={t(lang, 'network.descPlh')}
              rows={4}
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>{t(lang, 'network.insightsLabel')}</Label>
            <Textarea
              value={formData.insights}
              onChange={(e) => setFormData({...formData, insights: e.target.value})}
              placeholder={t(lang, 'network.insightsPlh')}
              rows={4}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>{t(lang, 'network.tagsLabel')}</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder={t(lang, 'network.tagsPlh')}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label>{t(lang, 'network.visibilityLabel')}</Label>
            <Select value={formData.visibilite} onValueChange={(value) => setFormData({...formData, visibilite: value})}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reseau">{t(lang, 'network.visNetwork')}</SelectItem>
                <SelectItem value="public">{t(lang, 'network.visPublic')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t(lang, 'common.cancel')}
            </Button>
            <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
              {t(lang, 'network.shareSubmit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
