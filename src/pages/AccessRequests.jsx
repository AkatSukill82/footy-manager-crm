import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44, invokeFn } from "@/api/base44Client";
import { Inbox, Loader2, CheckCircle2, X, Mail, Phone, Building2, RefreshCw } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

const STATUT_BADGE = {
  en_attente: "bg-amber-100 text-amber-700",
  valide: "bg-green-100 text-green-700",
  refuse: "bg-slate-100 text-slate-400",
};

const AR = {
  fr: { formules: { standard: "Standard (50€)", pro: "Pro (100€)", surmesure: "Sur-mesure (devis)" }, statuts: { en_attente: "en attente", valide: "validée", refuse: "refusée" }, title: "Demandes d'accès", subtitle: "Valide une demande → un e-mail d'invitation (lien de création de compte) est envoyé.", adminOnly: "cette page est réservée à l'administrateur.", fEnAttente: "En attente", fValidees: "Validées", fRefusees: "Refusées", fToutes: "Toutes", emptyP: "Aucune demande.", refuse: "Refuser", approve: "Valider & inviter", invited: (e) => `Invitation envoyée à ${e} ✓ — Base44 lui envoie l'e-mail pour créer son compte.`, error: (m) => `Erreur : ${m}` },
  en: { formules: { standard: "Standard (€50)", pro: "Pro (€100)", surmesure: "Custom (quote)" }, statuts: { en_attente: "pending", valide: "approved", refuse: "rejected" }, title: "Access requests", subtitle: "Approve a request → an invitation email (account-creation link) is sent.", adminOnly: "this page is reserved for the administrator.", fEnAttente: "Pending", fValidees: "Approved", fRefusees: "Rejected", fToutes: "All", emptyP: "No request.", refuse: "Reject", approve: "Approve & invite", invited: (e) => `Invitation sent to ${e} ✓ — Base44 emails them to create their account.`, error: (m) => `Error: ${m}` },
  es: { formules: { standard: "Standard (50€)", pro: "Pro (100€)", surmesure: "A medida (presupuesto)" }, statuts: { en_attente: "pendiente", valide: "aprobada", refuse: "rechazada" }, title: "Solicitudes de acceso", subtitle: "Valida una solicitud → se envía un email de invitación (enlace de creación de cuenta).", adminOnly: "esta página está reservada al administrador.", fEnAttente: "Pendientes", fValidees: "Aprobadas", fRefusees: "Rechazadas", fToutes: "Todas", emptyP: "Ninguna solicitud.", refuse: "Rechazar", approve: "Aprobar e invitar", invited: (e) => `Invitación enviada a ${e} ✓ — Base44 le envía el email para crear su cuenta.`, error: (m) => `Error: ${m}` },
};

export default function AccessRequestsPage() {
  const { lang } = useLanguage();
  const T = AR[lang] || AR.fr;
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);
  const [filter, setFilter] = useState("en_attente");

  const { data, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ["accessRequests"],
    queryFn: () => invokeFn("accessRequest", { action: "list" }),
    refetchInterval: false,
  });
  const requests = data?.requests || [];
  const accessError = data && data.ok === false ? data.error : (error?.message || null);

  const filtered = filter === "tous" ? requests : requests.filter((r) => (r.statut || "en_attente") === filter);

  const approve = async (r) => {
    setBusy(r.id); setNotice(null);
    try {
      await invokeFn("accessRequest", { action: "setStatut", id: r.id, statut: "valide" });
      await base44.users.inviteUser(r.email, "user");
      setNotice(T.invited(r.email));
      refetch();
    } catch (e) {
      setNotice(T.error(e?.message || ""));
      refetch();
    } finally { setBusy(null); }
  };

  const reject = async (r) => {
    setBusy(r.id);
    try { await invokeFn("accessRequest", { action: "setStatut", id: r.id, statut: "refuse" }); refetch(); }
    finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2"><Inbox className="w-7 h-7 text-green-600" /> {T.title}</h1>
            <p className="text-xs text-slate-500 mt-1">{T.subtitle}</p>
          </div>
          <button onClick={() => refetch()} disabled={isFetching} className="text-slate-400 hover:text-slate-600 disabled:opacity-50 p-2"><RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /></button>
        </div>

        {notice && <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-2.5 text-sm">{notice}</div>}
        {accessError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm">{accessError} — {T.adminOnly}</div>}

        <div className="flex items-center gap-1.5">
          {[["en_attente", T.fEnAttente], ["valide", T.fValidees], ["refuse", T.fRefusees], ["tous", T.fToutes]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${filter === k ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>{l}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-400">
            <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" /> {T.emptyP}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{[r.prenom, r.nom].filter(Boolean).join(" ") || "—"}</span>
                    <span className={`text-[11px] rounded-full px-2 py-0.5 ${STATUT_BADGE[r.statut || "en_attente"]}`}>{T.statuts[r.statut || "en_attente"] || r.statut}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">{T.formules[r.formule] || r.formule}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {r.email}</span>
                    {r.telephone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {r.telephone}</span>}
                    {r.societe && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {r.societe}</span>}
                  </div>
                  {r.message && <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-lg px-3 py-2">{r.message}</p>}
                </div>
                {(r.statut || "en_attente") === "en_attente" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => reject(r)} disabled={busy === r.id} className="text-xs border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> {T.refuse}</button>
                    <button onClick={() => approve(r)} disabled={busy === r.id} className="text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 flex items-center gap-1.5">{busy === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} {T.approve}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
