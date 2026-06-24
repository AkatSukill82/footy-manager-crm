import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Clock, User, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { CRM_STATUS, CRM_ORDER } from "@/lib/recruitmentScoring";

const compIcon = { red: ShieldAlert, amber: AlertTriangle, green: ShieldCheck };
const compColor = { red: "text-red-500", amber: "text-amber-500", green: "text-green-600" };

const isOverdue = (d) => d && new Date(d) < new Date(new Date().toDateString());

export default function RecruitmentPipeline({ cases = [], onDelete }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return cases;
    return cases.filter((c) => `${c.name || ""} ${c.club || ""} ${c.owner || ""}`.toLowerCase().includes(n));
  }, [cases, q]);

  const groups = useMemo(() => {
    const map = new Map(CRM_ORDER.map((s) => [s, []]));
    filtered.forEach((c) => { const s = c.status || "long_list"; if (!map.has(s)) map.set(s, []); map.get(s).push(c); });
    return [...map.entries()].filter(([, items]) => items.length);
  }, [filtered]);

  const overdue = filtered.filter((c) => isOverdue(c.next_action_date)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par joueur, club, responsable…" className="pl-9" />
        </div>
        {overdue > 0 && <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {overdue} relance(s) en retard</span>}
      </div>

      {filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-10">Aucun dossier de recrutement. Créez-en un via « Nouveau ».</p>}

      {groups.map(([status, items]) => {
        const cfg = CRM_STATUS[status] || CRM_STATUS.long_list;
        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
              <span className="text-xs text-slate-400">{items.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {items.map((c) => {
                const CI = compIcon[c.compliance_status] || ShieldCheck;
                return (
                  <div key={c.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <CI className={`w-4 h-4 flex-shrink-0 mt-0.5 ${compColor[c.compliance_status] || "text-slate-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {c.name}{c.is_minor ? <span className="ml-1 text-[10px] text-red-600">mineur</span> : ""}
                        {typeof c.score === "number" && <span className="ml-1.5 text-[11px] text-slate-400">· {c.score}/18</span>}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {[c.club, c.division, c.positions].filter(Boolean).join(" · ") || "—"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                        {c.next_action && <span>→ {c.next_action}</span>}
                        {c.next_action_date && <span className={isOverdue(c.next_action_date) ? "text-red-500 font-medium" : ""}>· {c.next_action_date}</span>}
                        {c.owner && <span>· <User className="inline w-3 h-3 -mt-0.5" /> {c.owner}</span>}
                      </p>
                    </div>
                    <button onClick={() => { if (window.confirm(`Supprimer le dossier « ${c.name} » ?`)) onDelete?.(c); }} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
