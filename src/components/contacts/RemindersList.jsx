import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const priorityColors = {
  "Haute": "bg-red-100 text-red-800 border-red-200",
  "Moyenne": "bg-orange-100 text-orange-800 border-orange-200",
  "Basse": "bg-blue-100 text-blue-800 border-blue-200"
};

const statusColors = {
  "À faire": "bg-slate-100 text-slate-800",
  "En cours": "bg-blue-100 text-blue-800",
  "Terminé": "bg-green-100 text-green-800"
};

export default function RemindersList({ reminders, onUpdateStatus }) {
  const { lang } = useLanguage();
  if (!reminders || reminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t(lang,'contacts.remindersTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-4">{t(lang,'contacts.noRemindersAll')}</p>
        </CardContent>
      </Card>
    );
  }

  const activeReminders = reminders.filter(r => r.statut !== "Terminé");
  const completedReminders = reminders.filter(r => r.statut === "Terminé");

  const sortedActive = [...activeReminders].sort((a, b) => 
    new Date(a.date_rappel) - new Date(b.date_rappel)
  );

  const isOverdue = (date) => new Date(date) < new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t(lang,'contacts.remindersCount', { count: activeReminders.length })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedActive.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-700">{t(lang,'contacts.todo')}</h4>
            {sortedActive.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-4 rounded-lg border-2 ${
                  isOverdue(reminder.date_rappel) ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">{reminder.titre}</div>
                    <div className="text-sm text-slate-600 mt-1">{reminder.type}</div>
                  </div>
                  <Badge className={priorityColors[reminder.priorite]}>
                    {reminder.priorite}
                  </Badge>
                </div>

                {reminder.description && (
                  <p className="text-sm text-slate-700 mb-2">{reminder.description}</p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span className={isOverdue(reminder.date_rappel) ? "text-red-600 font-semibold" : "text-slate-600"}>
                      {format(new Date(reminder.date_rappel), "dd/MM/yyyy")}
                      {isOverdue(reminder.date_rappel) && ` - ${t(lang,'alerts.overdue')}`}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateStatus(reminder.id, "Terminé")}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {t(lang,'contacts.markDone')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {completedReminders.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-semibold text-sm text-slate-700">{t(lang,'contacts.done')}</h4>
            {completedReminders.slice(0, 3).map((reminder) => (
              <div key={reminder.id} className="p-3 rounded-lg bg-slate-50 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm line-through text-slate-600">{reminder.titre}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {format(new Date(reminder.date_rappel), "dd/MM/yyyy")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}