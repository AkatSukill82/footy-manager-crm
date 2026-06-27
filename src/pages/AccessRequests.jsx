import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44, invokeFn } from "@/api/base44Client";
import { Inbox, Loader2, CheckCircle2, X, Mail, Phone, Building2, RefreshCw } from "lucide-react";

const FORMULE_LABEL = { standard: "Standard (50€)", pro: "Pro (100€)", surmesure: "Sur-mesure (devis)" };
const STATUT_BADGE = {
  en_attente: "bg-amber-100 text-amber-700",
  valide: "bg-green-100 text-green-700",
  refuse: "bg-slate-100 text-slate-400",
};

export default function AccessRequestsPage() {
  const [busy, setBusy] = useState(null);   // id en cours
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
      const res = await invokeFn("accessRequest", { action: "setStatut", id: r.id, statut: "valide" });
      if (!res?.ok) throw new Error(res?.error || "Échec.");
      // SÉCURITÉ : autorise (allowlist) cet e-mail à créer un compte dans Base44.
      // Couplé à l'app en mode "sur invitation", seul un e-mail autorisé peut s'inscrire.
      let allowError = "";
      try { await base44.users.inviteUser(r.email, "user"); }
      catch (e) { allowError = e?.message || String(e); }
      // Envoie l'invitation : lien vers la création de compte, e-mail/nom pré-remplis.
      const origin = window.location.origin;
      const params = new URLSearchParams({ email: r.email || "", prenom: r.prenom || "", nom: r.nom || "" });
      const link = `${origin}/register?${params.toString()}`;
      await base44.integrations.Core.SendEmail({
        to: r.email,
        subject: "Votre accès à Football Data Management",
        body: `Bonjour ${r.prenom || ""},\n\nVotre demande d'accès a été acceptée 🎉\n\nCréez votre compte en cliquant ici :\n${link}\n\nVotre e-mail (${r.email}) est déjà pré-rempli ; il vous suffit de choisir un mot de passe.\n\nÀ bientôt,\nL'équipe Football Data Management`,
      });
      setNotice(allowError
        ? `Invitation e-mail envoyée à ${r.email}, mais l'autorisation Base44 a échoué : ${allowError}`
        : `Invitation envoyée à ${r.email} ✓ (accès autorisé)`);
      refetch();
    } catch (e) {
      setNotice(`Validé, mais erreur : ${e?.message || ""}`);
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
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2"><Inbox className="w-7 h-7 text-green-600" /> Demandes d'accès</h1>
            <p className="text-xs text-slate-500 mt-1">Valide une demande → un e-mail d'invitation (lien de création de compte) est envoyé.</p>
          </div>
          <button onClick={() => refetch()} disabled={isFetching} className="text-slate-400 hover:text-slate-600 disabled:opacity-50 p-2"><RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /></button>
        </div>

        {notice && <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-2.5 text-sm">{notice}</div>}
        {accessError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm">{accessError} — cette page est réservée à l'administrateur.</div>}

        <div className="flex items-center gap-1.5">
          {[["en_attente", "En attente"], ["valide", "Validées"], ["refuse", "Refusées"], ["tous", "Toutes"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${filter === k ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500"}`}>{l}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-green-500 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-400">
            <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" /> Aucune demande {filter !== "tous" ? `« ${filter.replace("_", " ")} »` : ""}.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{[r.prenom, r.nom].filter(Boolean).join(" ") || "—"}</span>
                    <span className={`text-[11px] rounded-full px-2 py-0.5 ${STATUT_BADGE[r.statut || "en_attente"]}`}>{(r.statut || "en_attente").replace("_", " ")}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">{FORMULE_LABEL[r.formule] || r.formule}</span>
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
                    <button onClick={() => reject(r)} disabled={busy === r.id} className="text-xs border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> Refuser</button>
                    <button onClick={() => approve(r)} disabled={busy === r.id} className="text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 flex items-center gap-1.5">{busy === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Valider & inviter</button>
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
