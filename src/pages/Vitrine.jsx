import React, { useState, useRef } from "react";
import { invokeFn } from "@/api/base44Client";
import {
  Database, Calculator, Wallet, UserSearch, LayoutGrid, Users, CalendarDays,
  Newspaper, CheckCircle2, ArrowRight, Loader2, ShieldCheck, Sparkles,
} from "lucide-react";

const FEATURES = [
  { icon: Database, title: "Fiches joueurs enrichies — automatiquement", desc: "On agrège Transfermarkt, FotMob, SofaScore et BeSoccer : stats, valeur marchande, contrat, historique. Tu tapes un nom, la fiche se remplit." },
  { icon: Calculator, title: "Simulateur de transfert FIFA", desc: "Net joueur, coût club, net vendeur, profit agent. Fiscalité par pays, solidarité, sell-on, conformité FIFA, scénarios comparés." },
  { icon: Wallet, title: "Finance & rentabilité", desc: "Entrées/sorties, commissions, projection vs réel, rentabilité par joueur, par deal et par agent. Export comptable et fiche joueur (FIFA)." },
  { icon: UserSearch, title: "Recrutement & scoring", desc: "Repère, qualifie, score (/20 configurable), vérifie la conformité et suis tes prospects dans un CRM dédié." },
  { icon: LayoutGrid, title: "Projection d'effectif", desc: "Place ta liste de joueurs sur une formation (4-3-3, 4-2-3-1…) et vois instantanément les postes qui te manquent." },
  { icon: Users, title: "Travail en équipe", desc: "Partage tout avec ton groupe d'agents en temps réel. Chacun ajoute, tout le monde voit." },
  { icon: CalendarDays, title: "Agenda & alertes", desc: "Rendez-vous, échéances de contrat, paiements en retard : tout remonte sur ton tableau de bord." },
  { icon: Newspaper, title: "Journal d'actualités", desc: "Tes médias et mots-clés, un fil d'actu mercato sur mesure — directement sur le dashboard." },
];

const PLANS = [
  { id: "standard", price: "50 €", suffix: "/mois", title: "Standard", best: false,
    feats: ["Fiches joueurs enrichies (4 sources)", "Recrutement & scoring", "Agenda, alertes, journal", "Travail en équipe"] },
  { id: "pro", price: "100 €", suffix: "/mois", title: "Pro", best: true,
    feats: ["Tout le Standard", "Simulateur de transfert FIFA complet", "Finance & rentabilité + exports", "Projection d'effectif par formation"] },
  { id: "surmesure", price: "150 €", suffix: "/mois", title: "Sur-mesure", best: false,
    feats: ["Tout le Pro", "Application modifiable de A à Z", "Fonctionnalités sur demande", "Accompagnement dédié → devis"] },
];

export default function Vitrine() {
  const formRef = useRef(null);
  const [f, setF] = useState({ prenom: "", nom: "", email: "", telephone: "", societe: "", formule: "standard", message: "" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [err, setErr] = useState(null);

  const scrollToForm = (formule) => {
    if (formule) setF((s) => ({ ...s, formule }));
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!f.email.trim()) return;
    setState("sending"); setErr(null);
    try {
      const res = await invokeFn("accessRequest", { action: "submit", data: f });
      if (!res?.ok) throw new Error(res?.error || "Échec de l'envoi.");
      setState("done");
    } catch (e2) { setErr(e2?.message || "Échec de l'envoi. Réessaie."); setState("error"); }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-bold text-lg flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-green-600 text-white flex items-center justify-center">⚽</span> Football Data Management</div>
          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm text-slate-500 hover:text-slate-900">Se connecter</a>
            <button onClick={() => scrollToForm()} className="text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg px-3.5 py-2 font-medium">Demander un accès</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 border border-white/15 rounded-full px-3 py-1 mb-5"><Sparkles className="w-3.5 h-3.5 text-green-400" /> L'outil des agents de football modernes</span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">Toute ta gestion d'agent,<br /><span className="text-green-400">dans un seul outil.</span></h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto">Données joueurs en direct, simulateur de transfert FIFA, finance, recrutement et collaboration d'équipe. Ce que les autres CRM n'ont pas.</p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => scrollToForm()} className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 py-3 font-semibold inline-flex items-center gap-2">Demander un accès <ArrowRight className="w-4 h-4" /></button>
            <a href="#pricing" className="border border-white/20 hover:bg-white/10 rounded-xl px-6 py-3 font-semibold">Voir les tarifs</a>
          </div>
        </div>
      </section>

      {/* Pourquoi nous */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Ce que les autres n'ont pas</h2>
          <p className="mt-3 text-slate-500">La plupart des CRM te font ressaisir les données à la main. Nous, on va les chercher pour toi — et on ajoute les outils métier qui font la différence.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((ft, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-3"><ft.icon className="w-5 h-5" /></div>
              <h3 className="font-semibold text-slate-900 leading-snug">{ft.title}</h3>
              <p className="text-sm text-slate-500 mt-1.5">{ft.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Des tarifs simples</h2>
            <p className="mt-3 text-slate-500">Choisis ta formule. Sans engagement de longue durée, accès sur invitation après validation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {PLANS.map((p) => (
              <div key={p.id} className={`rounded-2xl border p-6 flex flex-col bg-white ${p.best ? "border-green-500 shadow-lg ring-1 ring-green-500/20 relative" : "border-slate-200"}`}>
                {p.best && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold bg-green-600 text-white rounded-full px-3 py-1">Le plus populaire</span>}
                <h3 className="font-bold text-lg">{p.title}</h3>
                <div className="mt-2 mb-4"><span className="text-4xl font-extrabold">{p.price}</span><span className="text-slate-400">{p.suffix}</span></div>
                <ul className="space-y-2 flex-1">
                  {p.feats.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> {feat}</li>
                  ))}
                </ul>
                <button onClick={() => scrollToForm(p.id)} className={`mt-6 rounded-xl px-4 py-2.5 font-semibold ${p.best ? "bg-green-600 hover:bg-green-700 text-white" : "border border-slate-300 hover:bg-slate-50"}`}>
                  {p.id === "surmesure" ? "Demander un devis" : "Choisir cette formule"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulaire de demande */}
      <section ref={formRef} className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold">Demander un accès</h2>
          <p className="mt-3 text-slate-500">Laisse tes coordonnées : on crée ton compte et on t'envoie ton invitation.</p>
        </div>

        {state === "done" ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-green-900 text-lg">Demande envoyée 🎉</h3>
            <p className="text-sm text-green-800 mt-1">On revient vers toi très vite par e-mail avec ton invitation.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom" value={f.prenom} onChange={set("prenom")} />
              <Field label="Nom" value={f.nom} onChange={set("nom")} />
            </div>
            <Field label="E-mail *" type="email" value={f.email} onChange={set("email")} required />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Téléphone" value={f.telephone} onChange={set("telephone")} />
              <Field label="Agence / club" value={f.societe} onChange={set("societe")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Formule souhaitée</label>
              <select value={f.formule} onChange={set("formule")} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <option value="standard">Standard — 50 €/mois</option>
                <option value="pro">Pro — 100 €/mois</option>
                <option value="surmesure">Sur-mesure — devis</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Message (optionnel)</label>
              <textarea value={f.message} onChange={set("message")} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Ton besoin, ton activité…" />
            </div>
            {err && <p className="text-sm text-red-500">{err}</p>}
            <button type="submit" disabled={state === "sending" || !f.email.trim()} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-3 font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Envoyer ma demande
            </button>
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Accès sur invitation après validation.</p>
          </form>
        )}
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Football Data Management · <a href="/login" className="hover:text-slate-700">Se connecter</a>
      </footer>
    </div>
  );
}

const Field = ({ label, value, onChange, type = "text", required }) => (
  <div>
    <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
    <input type={type} value={value} onChange={onChange} required={required} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
  </div>
);
