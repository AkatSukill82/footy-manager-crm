import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Wallet, CheckCircle2, Clock, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const DF = {
  fr: { finance: "Finance", empty: "Aucune commission. Ouvre Finance pour en ajouter.", encaisse: "Encaissé", aFacturer: "À facturer", retard: "En retard" },
  en: { finance: "Finance", empty: "No commission. Open Finance to add one.", encaisse: "Collected", aFacturer: "To invoice", retard: "Overdue" },
  es: { finance: "Finanzas", empty: "Sin comisiones. Abre Finanzas para añadir una.", encaisse: "Cobrado", aFacturer: "Por facturar", retard: "Atrasado" },
};
const DF_LOC = { fr: "fr-FR", en: "en-GB", es: "es-ES" };

/**
 * Widget « Finance courte » (cahier §3) : résumé des commissions —
 * encaissé (réel), à facturer (projection à venir), en retard (échéance passée).
 * Pointe vers le module Finance sans dupliquer les données.
 */
const todayISO = () => new Date().toISOString().split("T")[0];

function Item({ icon: Icon, color, label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <div className="text-sm font-bold text-slate-800 truncate">{value}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  );
}

export default function DashboardFinance() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const T = DF[lang] || DF.fr;
  const fmt = (n) => `${Math.round(n).toLocaleString(DF_LOC[lang] || DF_LOC.fr)} €`;
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["dashboard-commissions"],
    queryFn: () => base44.entities.Commission.filter({}),
  });

  const s = useMemo(() => {
    const today = todayISO();
    let encaisse = 0, aFacturer = 0, retard = 0;
    for (const c of commissions) {
      if ((c.sens || "entree") === "sortie") continue; // entrées (revenus) uniquement
      const m = Number(c.montant) || 0;
      if (c.nature === "reel") encaisse += m;
      else if (c.date_echeance && c.date_echeance < today) retard += m;
      else aFacturer += m;
    }
    return { encaisse, aFacturer, retard };
  }, [commissions]);

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div onClick={() => navigate(createPageUrl("Finance"))} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50">
        <span className="font-semibold text-slate-800 text-sm flex items-center gap-2"><Wallet className="w-4 h-4 text-green-600" /> {T.finance}</span>
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /></div>
      ) : commissions.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-5">{T.empty}</p>
      ) : (
        <div className="p-3 grid grid-cols-3 gap-2">
          <Item icon={CheckCircle2} color="text-green-600" label={T.encaisse} value={fmt(s.encaisse)} />
          <Item icon={Clock} color="text-blue-600" label={T.aFacturer} value={fmt(s.aFacturer)} />
          <Item icon={AlertTriangle} color="text-red-500" label={T.retard} value={fmt(s.retard)} />
        </div>
      )}
    </div>
  );
}
