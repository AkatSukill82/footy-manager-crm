import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, UserCheck, Zap, FileText, Eye, Loader2 } from "lucide-react";
import TransfermarktImage from "../ui/TransfermarktImage";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export const STATUTS = [
  {
    value: "Client",
    label: "Client",
    description: "Représentation active",
    Icon: UserCheck,
    bg: "bg-blue-50 border-blue-300",
    text: "text-blue-800",
    badge: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    value: "Prospect",
    label: "Prospect",
    description: "Client potentiel",
    Icon: Zap,
    bg: "bg-amber-50 border-amber-300",
    text: "text-amber-800",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    value: "Mandaté",
    label: "Mandaté",
    description: "Joueur mandaté",
    Icon: FileText,
    bg: "bg-orange-50 border-orange-300",
    text: "text-orange-800",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
  },
  {
    value: "En observation",
    label: "En observation",
    description: "Surveillance continue",
    Icon: Eye,
    bg: "bg-slate-50 border-slate-300",
    text: "text-slate-700",
    badge: "bg-slate-100 text-slate-700 border-slate-300",
  },
];

export function statutConfig(statut) {
  return STATUTS.find(s => s.value === statut) || STATUTS[3];
}

export default function PlayerStatusModal({ player, existingItem, open, onClose, onConfirm }) {
  const { lang } = useLanguage();
  const [selected, setSelected] = useState(existingItem?.statut || "Prospect");
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    try {
      await onConfirm(selected);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const isEdit = !!existingItem;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-base">
            {isEdit ? t(lang,'status.modalTitleEdit') : t(lang,'status.modalTitleAdd')}
          </DialogTitle>
        </DialogHeader>

        {/* Player identity */}
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-md flex items-center justify-center">
            <TransfermarktImage
              src={player?.photo_url}
              alt={player?.nom}
              className="w-full h-full object-cover"
              fallback={<User className="w-9 h-9 text-slate-400" />}
            />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-900 text-lg leading-tight">{player?.nom}</p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              {player?.age && <span className="text-xs text-slate-500">{player.age} ans</span>}
              {player?.poste && (
                <Badge className="text-[10px] py-0 bg-slate-100 text-slate-700">{player.poste}</Badge>
              )}
              {player?.club_actuel && (
                <Badge className="text-[10px] py-0 bg-slate-800 text-white">{player.club_actuel}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Status selection */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {t(lang,'status.subtitle')}
          </p>
          {STATUTS.map(({ value, Icon, bg, text }) => {
            const labelKey = value === "Client" ? 'client' : value === "Prospect" ? 'prospect' : value === "Mandaté" ? 'mandated' : 'watching';
            const label = t(lang, `status.${labelKey}`);
            const description = t(lang, `status.${labelKey}Desc`);
            return (
            <button
              key={value}
              type="button"
              onClick={() => setSelected(value)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                selected === value
                  ? `${bg} ${text} border-opacity-100`
                  : "border-transparent bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selected === value ? bg : "bg-slate-100"
              }`}>
                <Icon className={`w-4 h-4 ${selected === value ? text : "text-slate-500"}`} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${selected === value ? text : "text-slate-800"}`}>
                  {label}
                </p>
                <p className="text-xs text-slate-400">{description}</p>
              </div>
              {selected === value && (
                <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 ${text} border-current flex items-center justify-center`}>
                  <div className={`w-2 h-2 rounded-full ${selected === value ? "bg-current" : ""}`} />
                </div>
              )}
            </button>
          );})}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t(lang, 'common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : isEdit ? t(lang, 'status.save') : t(lang, 'status.modalTitleAdd')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
