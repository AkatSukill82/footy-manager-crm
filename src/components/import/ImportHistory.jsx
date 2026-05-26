import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr, es, enUS } from "date-fns/locale";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const DATE_LOCALES = { fr, es, en: enUS };

export default function ImportHistory() {
  const { lang } = useLanguage();
  const { data: logs = [] } = useQuery({
    queryKey: ["import_logs"],
    queryFn: () => base44.entities.ImportLog.list("-created_date", 10)
  });

  if (logs.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          {t(lang, 'import.historyTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              {log.statut === "succès"
                ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                : <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{log.nom_fichier}</p>
                <p className="text-xs text-slate-400">
                  {log.created_date ? format(new Date(log.created_date), "dd MMM yyyy HH:mm", { locale: DATE_LOCALES[lang] || fr }) : "—"}
                </p>
              </div>
              <div className="flex gap-2 text-xs shrink-0">
                {log.joueurs_crees > 0 && (
                  <Badge variant="secondary">{log.joueurs_crees} {t(lang, 'import.previewPlayers').toLowerCase()}</Badge>
                )}
                {log.clubs_crees > 0 && (
                  <Badge variant="secondary">{log.clubs_crees} {t(lang, 'import.previewClubs').toLowerCase()}</Badge>
                )}
                {log.erreurs > 0 && (
                  <Badge variant="destructive">{t(lang, 'import.errorsTitle', { count: log.erreurs, s: log.erreurs > 1 ? "s" : "" })}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
