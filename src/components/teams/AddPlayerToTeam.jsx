import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function AddPlayerToTeam({ players, teamId, existingPlayerIds, onAdd }) {
  const { lang } = useLanguage();
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [position, setPosition] = useState("Défenseur");
  const [numero, setNumero] = useState("");

  const availablePlayers = players.filter(p => !existingPlayerIds.includes(p.id));

  const handleAdd = () => {
    if (!selectedPlayerId) return;
    onAdd({
      team_id: teamId,
      player_id: selectedPlayerId,
      position_equipe: position,
      numero_maillot: numero ? parseInt(numero) : null,
      titulaire: true
    });
    setSelectedPlayerId("");
    setNumero("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {t(lang, 'teams.addPlayerTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{t(lang, 'transfers.player')}</Label>
          <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
            <SelectTrigger>
              <SelectValue placeholder={t(lang, 'teams.selectPlayerPlh')} />
            </SelectTrigger>
            <SelectContent>
              {availablePlayers.map(player => (
                <SelectItem key={player.id} value={player.id}>
                  {player.nom} - {player.poste}
                  {player.valeur_marchande && ` (${player.valeur_marchande}M€)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t(lang, 'teams.positionLabel')}</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gardien">{t(lang, 'teams.posGardien')}</SelectItem>
                <SelectItem value="Défenseur">{t(lang, 'teams.posDef')}</SelectItem>
                <SelectItem value="Milieu">{t(lang, 'teams.posMil')}</SelectItem>
                <SelectItem value="Attaquant">{t(lang, 'teams.posAtt')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t(lang, 'teams.jerseyNum')}</Label>
            <Input
              type="number"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ex: 10"
              min="1"
              max="99"
            />
          </div>
        </div>

        <Button onClick={handleAdd} className="w-full" disabled={!selectedPlayerId}>
          {t(lang, 'teams.addToTeam')}
        </Button>
      </CardContent>
    </Card>
  );
}
