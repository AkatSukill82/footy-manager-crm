import React, { useState, useRef, useEffect } from "react";
import { invokeFn } from "@/api/base44Client";
import {
  Database, Calculator, Wallet, UserSearch, LayoutGrid, Users, CalendarDays,
  Newspaper, CheckCircle2, ArrowRight, Loader2, ShieldCheck, Sparkles, X,
  TrendingUp, Globe, Zap, ChevronDown, Star, PlayCircle,
} from "lucide-react";
import ParticleHero from "@/components/vitrine/ParticleHero";

const PAINS = [
  "Tu ressaisis chaque fiche joueur à la main",
  "Tu découvres une fin de contrat… trop tard",
  "Tu négocies un transfert sans connaître ta vraie marge",
  "Tes infos sont éparpillées dans 10 fichiers Excel",
  "Un concurrent signe le joueur que tu suivais",
];
const GAINS = [
  "Les fiches se remplissent seules depuis 4 sources",
  "Les alertes te préviennent avant chaque échéance",
  "Le simulateur FIFA chiffre net joueur, coût club et ta commission",
  "Tout est centralisé et partagé avec ton équipe en temps réel",
  "Tu repères les pépites et tu signes avant les autres",
];

const VIDEO_HERO = "https://assets.mixkit.co/videos/17398/17398-720.mp4";   // stade vue aérienne
const VIDEO_CTA  = "https://assets.mixkit.co/videos/9660/9660-720.mp4";     // terrain de foot

// ── Reveal au scroll ──────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{
      opacity: shown ? 1 : 0,
      transform: shown ? "none" : "translateY(28px)",
      transition: `opacity .7s ease ${delay}ms, transform .7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>{children}</div>
  );
}

const FEATURES = [
  { icon: Database, title: "Fiches joueurs enrichies — automatiquement", desc: "On agrège Transfermarkt, FotMob, SofaScore et BeSoccer. Tu tapes un nom : stats, valeur marchande, contrat, historique se remplissent seuls.", tag: "Données live" },
  { icon: Calculator, title: "Simulateur de transfert FIFA", desc: "Net joueur, coût club, net vendeur, profit agent. Fiscalité par pays, solidarité, sell-on, conformité FIFA, scénarios comparés.", tag: "Unique" },
  { icon: Wallet, title: "Finance & rentabilité", desc: "Entrées/sorties, commissions, projection vs réel, rentabilité par joueur / deal / agent. Exports comptable et fiche joueur (FIFA).", tag: "Business" },
  { icon: UserSearch, title: "Recrutement & scoring", desc: "Repère, qualifie, score /20 (configurable), vérifie la conformité et suis tes prospects dans un vrai CRM.", tag: "CRM" },
  { icon: LayoutGrid, title: "Projection d'effectif", desc: "Place ta liste sur une formation (4-3-3, 4-2-3-1…) et vois instantanément les postes qui te manquent.", tag: "Tactique" },
  { icon: TrendingUp, title: "IA & comparateur par 90 min", desc: "Compare des profils sur des stats normalisées, repère les sous-cotés et anticipe la valeur future.", tag: "Avancé" },
  { icon: Users, title: "Travail en équipe en temps réel", desc: "Partage tout avec ton groupe d'agents. Chacun ajoute, tout le monde voit, instantanément.", tag: "Collaboratif" },
  { icon: CalendarDays, title: "Agenda, alertes & journal", desc: "Rendez-vous, échéances de contrat, paiements en retard, fil d'actu mercato sur mesure — tout sur ton dashboard.", tag: "Pilotage" },
];

const SOURCES = ["Transfermarkt", "FotMob", "SofaScore", "BeSoccer"];

const PLANS = [
  { id: "standard", price: "50", title: "Standard", tagline: "Pour démarrer pro.", best: false,
    feats: ["Fiches joueurs enrichies (4 sources)", "Recrutement, scoring & CRM", "Agenda, alertes & journal", "Travail en équipe", "Comparateur de joueurs"] },
  { id: "pro", price: "100", title: "Pro", tagline: "L'arsenal complet.", best: true,
    feats: ["Tout le Standard", "Simulateur de transfert FIFA complet", "Finance & rentabilité + exports PDF/Excel", "Projection d'effectif par formation", "Stats avancées par 90 min"] },
  { id: "surmesure", price: "150", title: "Sur-mesure", tagline: "Ton outil, tes règles.", best: false,
    feats: ["Tout le Pro", "Application modifiable de A à Z", "Fonctionnalités développées sur demande", "Accompagnement & support dédiés", "Devis personnalisé"] },
];

const FAQ = [
  { q: "D'où viennent les données des joueurs ?", a: "On agrège en direct Transfermarkt, FotMob, SofaScore et BeSoccer. Tu tapes un nom, la fiche se construit toute seule (stats, valeur, contrat). À vérifier et compléter selon les sources." },
  { q: "Comment se passe l'accès ?", a: "L'accès est sur invitation : tu fais une demande via ce site, on valide et on t'envoie ton invitation par e-mail pour créer ton compte." },
  { q: "Puis-je travailler à plusieurs ?", a: "Oui. Le mode groupe partage tout l'effectif et les dossiers entre les membres, en temps réel." },
  { q: "Le sur-mesure, ça veut dire quoi ?", a: "On adapte l'application à ton activité : nouvelles fonctionnalités, intégrations, champs spécifiques. On part sur un devis selon le besoin." },
];

export default function Vitrine() {
  const formRef = useRef(null);
  const [f, setF] = useState({ prenom: "", nom: "", email: "", telephone: "", societe: "", formule: "standard", message: "" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const [state, setState] = useState("idle");
  const [err, setErr] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

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
    <div className="min-h-screen bg-[#0a0e1a] text-white selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl bg-[#0a0e1a]/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="font-bold flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">⚽</span>
            <span className="tracking-tight">Football Data <span className="text-emerald-400">Management</span></span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#features" className="hidden md:block text-sm text-slate-300 hover:text-white transition">Fonctionnalités</a>
            <a href="#pricing" className="hidden md:block text-sm text-slate-300 hover:text-white transition">Tarifs</a>
            <a href="/login" className="text-sm text-slate-300 hover:text-white transition">Se connecter</a>
            <button onClick={() => scrollToForm()} className="text-sm bg-emerald-500 hover:bg-emerald-400 text-[#06210f] rounded-lg px-4 py-2 font-semibold transition shadow-lg shadow-emerald-500/20">Demander un accès</button>
          </div>
        </div>
      </header>

      {/* HERO — animation particules + copy de vente */}
      <section className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0a1410] to-[#0a0e1a]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[50rem] h-[50rem] bg-emerald-500/15 blur-[140px] rounded-full" />
        <ParticleHero />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/85 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-5 text-center pb-16 md:pb-24">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 mb-6 backdrop-blur">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Conçu pour les agents qui veulent prendre l'avantage
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.04] tracking-tight">
              Repère, chiffre et signe<br />
              <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">avant tout le monde.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Pendant que les autres ressaisissent leurs données à la main et ratent des fins de contrat, toi tu <span className="text-white font-medium">pilotes tes joueurs, simules tes transferts et suis ta rentabilité</span> — dans un seul outil.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
              <button onClick={() => scrollToForm()} className="group bg-emerald-500 hover:bg-emerald-400 text-[#06210f] rounded-xl px-7 py-3.5 font-bold inline-flex items-center gap-2 transition shadow-xl shadow-emerald-500/30">
                Prendre l'avantage maintenant <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a href="#pricing" className="border border-white/20 hover:bg-white/10 rounded-xl px-7 py-3.5 font-semibold inline-flex items-center gap-2 transition backdrop-blur">
                Voir les tarifs
              </a>
            </div>
          </Reveal>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-500 animate-bounce"><ChevronDown className="w-5 h-5" /></div>
      </section>

      {/* SOURCES strip */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-5 py-7 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10">
          <span className="text-xs uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Données agrégées depuis</span>
          <div className="flex items-center gap-6 sm:gap-10 flex-wrap justify-center">
            {SOURCES.map((s) => <span key={s} className="text-slate-300 font-semibold tracking-tight">{s}</span>)}
          </div>
        </div>
      </section>

      {/* PAIN → SOLUTION */}
      <section className="max-w-6xl mx-auto px-5 py-24 md:py-28">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">Le constat</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 tracking-tight leading-tight">Le métier a changé.<br />Tes outils, non ?</h2>
            <p className="mt-4 text-slate-400 text-lg">Chaque jour sans le bon outil, c'est une info qui te manque — et un deal qui part chez un autre.</p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-5">
          <Reveal>
            <div className="h-full rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-7">
              <h3 className="font-bold text-red-300 mb-5 flex items-center gap-2"><X className="w-5 h-5" /> Sans outil dédié</h3>
              <ul className="space-y-3.5">
                {PAINS.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-slate-400"><X className="w-4 h-4 text-red-400/70 flex-shrink-0 mt-0.5" /> {p}</li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="h-full rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.05] p-7 shadow-2xl shadow-emerald-500/5">
              <h3 className="font-bold text-emerald-300 mb-5 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Avec Football Data Management</h3>
              <ul className="space-y-3.5">
                {GAINS.map((g) => (
                  <li key={g} className="flex items-start gap-3 text-slate-200"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> {g}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-24 md:py-32">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">Fonctionnalités</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 tracking-tight">Ce que les autres n'ont pas</h2>
            <p className="mt-4 text-slate-400 text-lg">La plupart des CRM te font tout ressaisir à la main. Nous, on va chercher la donnée pour toi — et on ajoute les outils qui font gagner des deals.</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((ft, i) => (
            <Reveal key={i} delay={(i % 4) * 70}>
              <div className="group h-full rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-6 hover:border-emerald-500/40 hover:from-emerald-500/[0.06] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform"><ft.icon className="w-5 h-5" /></div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 border border-white/10 rounded-full px-2 py-0.5">{ft.tag}</span>
                </div>
                <h3 className="font-bold text-[15px] leading-snug">{ft.title}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{ft.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SHOWCASE bandeau vidéo */}
      <section className="relative overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-25">
          <source src={VIDEO_CTA} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e1a] via-[#0a0e1a]/80 to-[#0a0e1a]/40" />
        <div className="relative max-w-6xl mx-auto px-5 py-24 md:py-32">
          <Reveal>
            <div className="max-w-xl">
              <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">Le déclic</span>
              <h2 className="text-4xl md:text-5xl font-black mt-3 leading-tight tracking-tight">Du repérage au transfert,<br />sans jamais quitter l'outil.</h2>
              <p className="mt-5 text-slate-300 text-lg leading-relaxed">Tu repères un joueur, sa fiche se remplit. Tu simules le deal (fiscalité, commissions, conformité). Tu suis la rentabilité et tu exportes pour le comptable ou le joueur. Tout est connecté.</p>
              <ul className="mt-7 space-y-3">
                {["Fiche enrichie en quelques secondes", "Simulation FIFA chiffrée et conforme", "Rentabilité et exports en un clic"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-slate-200"><span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0"><Zap className="w-3.5 h-3.5" /></span> {t}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 py-24 md:py-32">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">Tarifs</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 tracking-tight">Un prix clair, sans surprise</h2>
            <p className="mt-4 text-slate-400 text-lg">Accès sur invitation après validation. Choisis ta formule, on s'occupe du reste.</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((p, i) => (
            <Reveal key={p.id} delay={i * 90} className="h-full">
              <div className={`relative h-full rounded-3xl p-7 flex flex-col transition-all ${p.best ? "bg-gradient-to-b from-emerald-500/15 to-white/[0.03] border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/10 md:-translate-y-3" : "bg-white/[0.03] border border-white/10 hover:border-white/20"}`}>
                {p.best && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-bold bg-emerald-500 text-[#06210f] rounded-full px-4 py-1 shadow-lg flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> POPULAIRE</span>}
                <h3 className="font-bold text-xl">{p.title}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{p.tagline}</p>
                <div className="mt-5 mb-6 flex items-end gap-1">
                  <span className="text-5xl font-black tracking-tight">{p.price}</span>
                  <span className="text-slate-400 mb-1.5">€ / mois</span>
                </div>
                <ul className="space-y-3 flex-1">
                  {p.feats.map((feat, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> {feat}</li>
                  ))}
                </ul>
                <button onClick={() => scrollToForm(p.id)} className={`mt-7 rounded-xl px-5 py-3 font-bold transition ${p.best ? "bg-emerald-500 hover:bg-emerald-400 text-[#06210f] shadow-lg shadow-emerald-500/20" : "border border-white/15 hover:bg-white/10"}`}>
                  {p.id === "surmesure" ? "Demander un devis" : "Choisir cette formule"}
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 py-20">
        <Reveal>
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12 tracking-tight">Questions fréquentes</h2>
        </Reveal>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <Reveal key={i} delay={i * 60}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </div>
                {openFaq === i && <p className="text-sm text-slate-400 mt-3 leading-relaxed">{item.a}</p>}
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FORM */}
      <section ref={formRef} className="relative max-w-2xl mx-auto px-5 py-24">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-emerald-500/15 blur-[120px] rounded-full -z-0" />
        <Reveal className="relative">
          <div className="text-center mb-9">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Demander un accès</h2>
            <p className="mt-4 text-slate-400 text-lg">Laisse tes coordonnées : on crée ton compte et on t'envoie ton invitation.</p>
          </div>

          {state === "done" ? (
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="font-bold text-emerald-100 text-xl">Demande envoyée 🎉</h3>
              <p className="text-sm text-emerald-200/80 mt-2">On revient vers toi très vite par e-mail avec ton invitation.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 bg-white/[0.04] backdrop-blur rounded-3xl border border-white/10 p-7">
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
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Formule souhaitée</label>
                <select value={f.formule} onChange={set("formule")} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50">
                  <option className="bg-[#0a0e1a]" value="standard">Standard — 50 €/mois</option>
                  <option className="bg-[#0a0e1a]" value="pro">Pro — 100 €/mois</option>
                  <option className="bg-[#0a0e1a]" value="surmesure">Sur-mesure — devis</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Message (optionnel)</label>
                <textarea value={f.message} onChange={set("message")} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50" placeholder="Ton activité, ton besoin…" />
              </div>
              {err && <p className="text-sm text-red-400">{err}</p>}
              <button type="submit" disabled={state === "sending" || !f.email.trim()} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#06210f] rounded-xl px-4 py-3.5 font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60 transition shadow-lg shadow-emerald-500/20">
                {state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Envoyer ma demande
              </button>
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Accès sur invitation après validation.</p>
            </form>
          )}
        </Reveal>
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-sm text-slate-500">
        <div className="font-bold text-slate-300 mb-2">Football Data <span className="text-emerald-400">Management</span></div>
        © {new Date().getFullYear()} · L'outil des agents de football · <a href="/login" className="hover:text-slate-200">Se connecter</a>
      </footer>
    </div>
  );
}

const Field = ({ label, value, onChange, type = "text", required }) => (
  <div>
    <label className="text-xs font-medium text-slate-400 mb-1.5 block">{label}</label>
    <input type={type} value={value} onChange={onChange} required={required}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition" />
  </div>
);
