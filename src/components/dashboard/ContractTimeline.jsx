import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, User, AlertTriangle, Clock } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

const POSTES_COLORS = {
  "Gardien": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Défenseur central": "bg-blue-100 text-blue-800 border-blue-200",
  "Latéral droit": "bg-blue-100 text-blue-800 border-blue-200",
  "Latéral gauche": "bg-blue-100 text-blue-800 border-blue-200",
  "Milieu défensif": "bg-green-100 text-green-800 border-green-200",
  "Milieu central": "bg-green-100 text-green-800 border-green-200",
  "Milieu offensif": "bg-purple-100 text-purple-800 border-purple-200",
  "Ailier droit": "bg-orange-100 text-orange-800 border-orange-200",
  "Ailier gauche": "bg-orange-100 text-orange-800 border-orange-200",
  "Attaquant": "bg-red-100 text-red-800 border-red-200",
};

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

function urgencyConfig(monthsLeft) {
  if (monthsLeft <= 3) return { label: "Critique", color: "bg-red-500", text: "text-red-600", bg: "bg-red-50 border-red-200" };
  if (monthsLeft <= 6) return { label: "Urgent", color: "bg-orange-500", text: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
  if (monthsLeft <= 12) return { label: "À surveiller", color: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" };
  return { label: "OK", color: "bg-green-500", text: "text-green-700", bg: "bg-green-50 border-green-200" };
}

export default function ContractTimeline({ players }) {
  const today = new Date();
  const [startMonth, setStartMonth] = useState(today.getMonth());
  const [startYear, setStartYear] = useState(today.getFullYear());
  const [filterPoste, setFilterPoste] = useState("Tous");
  const [filterUrgency, setFilterUrgency] = useState("Tous");

  // Build 24-month grid starting from startMonth/startYear
  const months = [];
  for (let i = 0; i < 24; i++) {
    const m = (startMonth + i) % 12;
    const y = startYear + Math.floor((startMonth + i) / 12);
    months.push({ month: m, year: y, label: MONTHS_FR[m], key: `${y}-${m}` });
  }

  // Filter players with a contract end date in the next 24 months
  const endLimit = new Date(startYear, startMonth + 24, 1);

  const relevantPlayers = players
    .filter(p => {
      if (!p.contrat_fin) return false;
      const end = new Date(p.contrat_fin);
      if (end < today || end > endLimit) return false;
      if (filterPoste !== "Tous" && p.poste !== filterPoste) return false;
      const ml = (end - today) / (1000 * 60 * 60 * 24 * 30);
      if (filterUrgency === "Critique" && ml > 3) return false;
      if (filterUrgency === "Urgent" && (ml <= 3 || ml > 6)) return false;
      if (filterUrgency === "À surveiller" && (ml <= 6 || ml > 12)) return false;
      return true;
    })
    .sort((a, b) => new Date(a.contrat_fin) - new Date(b.contrat_fin));

  // Group by expiry month
  const byMonth = {};
  relevantPlayers.forEach(p => {
    const d = new Date(p.contrat_fin);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(p);
  });

  const postes = ["Tous", ...Array.from(new Set(players.map(p => p.poste).filter(Boolean)))];

  const prevPeriod = () => {
    let m = startMonth - 6;
    let y = startYear;
    if (m < 0) { m += 12; y -= 1; }
    setStartMonth(m); setStartYear(y);
  };
  const nextPeriod = () => {
    let m = startMonth + 6;
    let y = startYear;
    if (m > 11) { m -= 12; y += 1; }
    setStartMonth(m); setStartYear(y);
  };

  const totalExpiring = relevantPlayers.length;
  const critical = relevantPlayers.filter(p => {
    const ml = (new Date(p.contrat_fin) - today) / (1000 * 60 * 60 * 24 * 30);
    return ml <= 3;
  }).length;
  const urgent = relevantPlayers.filter(p => {
    const ml = (new Date(p.contrat_fin) - today) / (1000 * 60 * 60 * 24 * 30);
    return ml > 3 && ml <= 6;
  }).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Timeline des contrats
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={prevPeriod} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="font-medium text-slate-700 min-w-[160px] text-center">
              {MONTHS_FR[startMonth]} {startYear} — {MONTHS_FR[(startMonth + 23) % 12]} {startYear + Math.floor((startMonth + 23) / 12)}
            </span>
            <button onClick={nextPeriod} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="flex gap-3 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600"><strong>{totalExpiring}</strong> expirations sur 24 mois</span>
          </div>
          {critical > 0 && (
            <div className="flex items-center gap-1.5 text-xs bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-700"><strong>{critical}</strong> critiques (&lt;3 mois)</span>
            </div>
          )}
          {urgent > 0 && (
            <div className="flex items-center gap-1.5 text-xs bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-orange-700"><strong>{urgent}</strong> urgents (3–6 mois)</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <select
            value={filterPoste}
            onChange={e => setFilterPoste(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {postes.map(p => <option key={p}>{p}</option>)}
          </select>
          <select
            value={filterUrgency}
            onChange={e => setFilterUrgency(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {["Tous", "Critique", "Urgent", "À surveiller"].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {relevantPlayers.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun contrat expirant sur cette période</p>
          </div>
        ) : (
          <div className="space-y-2">
            {months.map(({ month, year, label, key }) => {
              const group = byMonth[`${year}-${month}`];
              if (!group || group.length === 0) return null;
              return (
                <div key={key} className="flex gap-3">
                  {/* Month label */}
                  <div className="w-24 shrink-0 pt-1 text-right">
                    <span className="text-xs font-semibold text-slate-500">{label}</span>
                    <span className="block text-[10px] text-slate-400">{year}</span>
                  </div>
                  {/* Divider */}
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                    <div className="w-px flex-1 bg-slate-200 mt-1" />
                  </div>
                  {/* Cards */}
                  <div className="flex-1 flex flex-wrap gap-2 pb-3">
                    {group.map(p => {
                      const ml = (new Date(p.contrat_fin) - today) / (1000 * 60 * 60 * 24 * 30);
                      const urg = urgencyConfig(ml);
                      return (
                        <Link
                          key={p.id}
                          to={createPageUrl(`PlayerDetail?id=${p.id}`)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all hover:shadow-md ${urg.bg}`}
                        >
                          <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                            {p.photo_url
                              ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              : <User className="w-3.5 h-3.5 text-slate-400" />
                            }
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 leading-tight">{p.nom}</p>
                            <p className="text-[10px] text-slate-500 leading-tight">{p.club_actuel || "—"}</p>
                          </div>
                          <div className="ml-1 flex flex-col items-end gap-1">
                            <Badge className={`text-[9px] px-1.5 py-0.5 border ${POSTES_COLORS[p.poste] || "bg-slate-100 text-slate-600"}`}>
                              {p.poste?.split(" ")[0]}
                            </Badge>
                            <span className={`text-[10px] font-bold ${urg.text}`}>{urg.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100 flex-wrap">
          {[
            { label: "Critique <3 mois", color: "bg-red-500" },
            { label: "Urgent 3–6 mois", color: "bg-orange-500" },
            { label: "À surveiller 6–12 mois", color: "bg-yellow-500" },
            { label: "OK >12 mois", color: "bg-green-500" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}