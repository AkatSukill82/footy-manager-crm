import React, { useState } from "react";
import { Building2, ChevronDown, ChevronUp, ArrowLeft, Play, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const CLUB_LABELS = {
  nom: "Nom du club", pays: "Pays", ville: "Ville", stade: "Stade",
  president: "Président", president_email: "Email Président",
  entraineur: "Entraîneur", entraineur_email: "Email Entraîneur",
  directeur_sportif: "Dir. Sportif", directeur_sportif_email: "Email DS",
  directeur_sportif_telephone: "Tél DS",
  email_general: "Email général", telephone_general: "Tél général",
  site_web: "Site web", budget_transfert: "Budget transfert (€)",
  budget_annuel: "Budget annuel (€)", capacite_stade: "Capacité stade",
  dette: "Dette (€)", valeur_effectif: "Valeur effectif (€)",
};

const CONTACT_LABELS = {
  nom: "Nom", prenom: "Prénom", poste: "Poste / Fonction",
  club: "Club", pays: "Pays",
  email: "Email", telephone: "Téléphone", whatsapp: "WhatsApp",
  date_naissance: "Date naissance", nationalite: "Nationalité",
  instagram: "Instagram", twitter: "Twitter",
  valeur_marchande: "Valeur marchande",
  salaire: "Salaire", contrat_fin: "Fin contrat",
  agent: "Agent", agence: "Agence",
  photo_url: "Photo",
};

function DataTable({ items, labels, title, icon: Icon, color }) {
  const { lang } = useLanguage();
  const [expanded, setExpanded] = useState(true);
  if (!items || items.length === 0) return null;

  const usedKeys = Object.keys(labels).filter(
    (k) => items.some((item) => item[k] != null && String(item[k]).trim() !== "")
  );

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge variant="secondary">
              {t(lang, "import.entries", { count: items.length, s: items.length > 1 ? "s" : "" })}
            </Badge>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  {usedKeys.map((k) => (
                    <th key={k} className="text-left py-2 px-2 text-slate-500 font-medium whitespace-nowrap">
                      {labels[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-slate-50" : ""}>
                    {usedKeys.map((k) => (
                      <td key={k} className="py-2 px-2 text-slate-700 whitespace-nowrap max-w-[180px] truncate">
                        {item[k] != null && String(item[k]).trim() !== ""
                          ? String(item[k])
                          : <span className="text-slate-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function ImportPreview({ data, onConfirm, onBack }) {
  const { lang } = useLanguage();
  const clubs    = data?.clubs    || [];
  const contacts = data?.contacts || [];
  const total    = clubs.length + contacts.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{t(lang, "import.previewTitle")}</h2>
          <p className="text-slate-500 text-sm">
            {t(lang, "import.previewRecords", { count: total, s: total > 1 ? "s" : "", file: data.nom_fichier })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> {t(lang, "import.backBtn")}
          </Button>
          <Button
            onClick={onConfirm}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            disabled={total === 0}
          >
            <Play className="w-4 h-4" /> {t(lang, "import.launchImport")}
          </Button>
        </div>
      </div>

      <DataTable
        items={clubs}
        labels={CLUB_LABELS}
        title={t(lang, "import.previewClubs")}
        icon={Building2}
        color="bg-blue-500"
      />
      <DataTable
        items={contacts}
        labels={CONTACT_LABELS}
        title={t(lang, "import.previewContacts")}
        icon={UserCheck}
        color="bg-orange-500"
      />

      {total === 0 && (
        <div className="text-center py-12 text-slate-400">
          {t(lang, "import.noData")}
        </div>
      )}
    </div>
  );
}
