import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Clock, Search, ShieldCheck } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Journal d'activité GLOBAL des simulations (vue admin / chef de groupe).
 * Lit tout l'ActivityLog où entity_type === "TransferSimulation" → qui a
 * créé / modifié / supprimé quelle simulation, et quand.
 */
const actionConfig = {
  create: { icon: Plus,   color: "text-green-600 bg-green-100", label: "Création" },
  update: { icon: Edit2,  color: "text-blue-600 bg-blue-100",   label: "Modification" },
  delete: { icon: Trash2, color: "text-red-600 bg-red-100",     label: "Suppression" },
};

export default function SimulationAuditLog() {
  const [q, setQ] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activityLogs", "TransferSimulation", "all"],
    queryFn: () => base44.entities.ActivityLog.filter({ entity_type: "TransferSimulation" }, "-created_date", 300),
    staleTime: 30 * 1000,
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return logs;
    return logs.filter((l) =>
      `${l.entity_name || ""} ${l.user_name || ""} ${l.user_email || ""}`.toLowerCase().includes(needle)
    );
  }, [logs, q]);

  // Regroupe par jour pour une lecture claire.
  const groups = useMemo(() => {
    const map = new Map();
    filtered.forEach((l) => {
      const day = l.created_date ? format(new Date(l.created_date), "EEEE d MMMM yyyy", { locale: fr }) : "—";
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(l);
    });
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2">
        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
        <span>Vue réservée à l'administrateur du groupe : historique de toutes les simulations enregistrées (création, modification, suppression) par les membres.</span>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par simulation ou utilisateur…" className="pl-9" />
      </div>

      {isLoading && <p className="text-sm text-slate-400 text-center py-6">Chargement…</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-400 justify-center py-8">
          <Clock className="w-4 h-4" /> Aucune activité de simulation pour le moment.
        </div>
      )}

      {groups.map(([day, items]) => (
        <div key={day}>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 capitalize">{day}</div>
          <div className="space-y-1.5">
            {items.map((log) => {
              const cfg = actionConfig[log.action] || actionConfig.update;
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 truncate">
                      <span className="font-semibold">{log.user_name || log.user_email}</span>
                      {" — "}
                      <span className="text-slate-500">{cfg.label}</span>
                      {log.entity_name && <> · <span className="text-slate-700">« {log.entity_name} »</span></>}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {log.created_date ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true, locale: fr }) : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
