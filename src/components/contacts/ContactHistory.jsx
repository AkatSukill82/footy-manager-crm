import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Users, Eye, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const typeIcons = {
  "Appel téléphonique": Phone,
  "Réunion": Users,
  "Email": Mail,
  "Visite": Eye,
  "Autre": Calendar
};

const resultatColors = {
  "Positif": "bg-green-100 text-green-800",
  "Neutre": "bg-blue-100 text-blue-800",
  "Négatif": "bg-red-100 text-red-800",
  "À suivre": "bg-orange-100 text-orange-800"
};

export default function ContactHistory({ contacts }) {
  const { lang } = useLanguage();
  if (!contacts || contacts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t(lang,'contacts.historyTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-4">{t(lang,'contacts.noHistory')}</p>
        </CardContent>
      </Card>
    );
  }

  const sortedContacts = [...contacts].sort((a, b) => 
    new Date(b.date_contact) - new Date(a.date_contact)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(lang,'contacts.historyCount', { count: contacts.length })}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedContacts.map((contact) => {
            const Icon = typeIcons[contact.type_contact] || Calendar;
            return (
              <div
                key={contact.id}
                className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{contact.contact_avec}</div>
                      <div className="text-sm text-slate-600">{contact.role_contact}</div>
                    </div>
                  </div>
                  <Badge className={resultatColors[contact.resultat]}>
                    {contact.resultat}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                  <span>{format(new Date(contact.date_contact), "dd/MM/yyyy")}</span>
                  <span>•</span>
                  <span>{contact.type_contact}</span>
                </div>
                
                {contact.notes && (
                  <p className="text-sm text-slate-700 mt-2 p-2 bg-slate-50 rounded">
                    {contact.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}