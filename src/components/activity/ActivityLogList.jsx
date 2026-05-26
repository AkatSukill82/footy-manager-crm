import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Edit2, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const actionConfig = {
  create: { icon: Plus,   color: "text-green-600 bg-green-100",  label: "Création" },
  update: { icon: Edit2,  color: "text-blue-600 bg-blue-100",    label: "Modification" },
  delete: { icon: Trash2, color: "text-red-600 bg-red-100",      label: "Suppression" },
};

export default function ActivityLogList({ entityId, entityType }) {
  const { data: logs = [] } = useQuery({
    queryKey: ["activityLogs", entityType, entityId],
    queryFn: () => base44.entities.ActivityLog.filter({ entity_id: entityId, entity_type: entityType }, "-created_date", 20),
    enabled: !!entityId,
  });

  if (logs.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Historique des modifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {logs.map((log) => {
          const cfg = actionConfig[log.action] || actionConfig.update;
          const Icon = cfg.icon;
          let changedFields = [];
          try { changedFields = JSON.parse(log.champs_modifies || "[]"); } catch {}
          return (
            <div key={log.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800">
                  <span className="font-semibold">{log.user_name || log.user_email}</span>
                  {" — "}
                  <span className="text-slate-500">{cfg.label}</span>
                </p>
                {changedFields.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {changedFields.join(", ")}
                  </p>
                )}
                <p className="text-xs text-slate-300 mt-0.5">
                  {formatDistanceToNow(new Date(log.created_date), { addSuffix: true, locale: fr })}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}