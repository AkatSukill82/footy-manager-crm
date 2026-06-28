import React, { useState, useRef, useEffect } from "react";
import { invokeFn } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import {
  Database, Calculator, Wallet, UserSearch, LayoutGrid, Users, CalendarDays,
  CheckCircle2, ArrowRight, Loader2, ShieldCheck, Sparkles, X,
  TrendingUp, Globe, Zap, ChevronDown, Star,
} from "lucide-react";
import ParticleHero from "@/components/vitrine/ParticleHero";

const FEATURE_ICONS = [Database, Calculator, Wallet, UserSearch, LayoutGrid, TrendingUp, Users, CalendarDays];
const SOURCES = ["Transfermarkt", "FotMob", "SofaScore", "BeSoccer"];

// ── Tout le contenu traduit (fr / en / es) ───────────────────────────────────
const VIT = {
  fr: {
    nav: { features: "Fonctionnalités", pricing: "Tarifs", login: "Se connecter", cta: "Demander un accès" },
    hero: { badge: "Conçu pour les agents qui veulent prendre l'avantage", h1a: "Repère, chiffre et signe", h1b: "avant tout le monde.", sub1: "Pendant que les autres ressaisissent leurs données à la main et ratent des fins de contrat, toi tu ", sub2: "pilotes tes joueurs, simules tes transferts et suis ta rentabilité", sub3: " — dans un seul outil.", cta: "Prendre l'avantage maintenant", cta2: "Voir les tarifs" },
    sources: "Données agrégées depuis",
    pain: { tag: "Le constat", title1: "Le métier a changé.", title2: "Tes outils, non ?", sub: "Chaque jour sans le bon outil, c'est une info qui te manque — et un deal qui part chez un autre.", without: "Sans outil dédié", with: "Avec Football Data Management",
      pains: ["Tu ressaisis chaque fiche joueur à la main", "Tu découvres une fin de contrat… trop tard", "Tu négocies un transfert sans connaître ta vraie marge", "Tes infos sont éparpillées dans 10 fichiers Excel", "Un concurrent signe le joueur que tu suivais"],
      gains: ["Les fiches se remplissent seules depuis 4 sources", "Les alertes te préviennent avant chaque échéance", "Le simulateur FIFA chiffre net joueur, coût club et ta commission", "Tout est centralisé et partagé avec ton équipe en temps réel", "Tu repères les pépites et tu signes avant les autres"] },
    feat: { tag: "Fonctionnalités", title: "Ce que les autres n'ont pas", sub: "La plupart des CRM te font tout ressaisir à la main. Nous, on va chercher la donnée pour toi — et on ajoute les outils qui font gagner des deals.",
      items: [
        { t: "Fiches joueurs enrichies — automatiquement", d: "On agrège Transfermarkt, FotMob, SofaScore et BeSoccer. Tu tapes un nom : stats, valeur marchande, contrat, historique se remplissent seuls.", g: "Données live" },
        { t: "Simulateur de transfert FIFA", d: "Net joueur, coût club, net vendeur, profit agent. Fiscalité par pays, solidarité, sell-on, conformité FIFA, scénarios comparés.", g: "Unique" },
        { t: "Finance & rentabilité", d: "Entrées/sorties, commissions, projection vs réel, rentabilité par joueur / deal / agent. Exports comptable et fiche joueur (FIFA).", g: "Business" },
        { t: "Recrutement & scoring", d: "Repère, qualifie, score (configurable), vérifie la conformité et suis tes prospects dans un vrai CRM.", g: "CRM" },
        { t: "Projection d'effectif", d: "Place ta liste sur une formation (4-3-3, 4-2-3-1…) et vois instantanément les postes qui te manquent.", g: "Tactique" },
        { t: "IA & comparateur par 90 min", d: "Compare des profils sur des stats normalisées, repère les sous-cotés et anticipe la valeur future.", g: "Avancé" },
        { t: "Travail en équipe en temps réel", d: "Partage tout avec ton groupe d'agents. Chacun ajoute, tout le monde voit, instantanément.", g: "Collaboratif" },
        { t: "Agenda, alertes & journal", d: "Rendez-vous, échéances de contrat, paiements en retard, fil d'actu mercato sur mesure — tout sur ton dashboard.", g: "Pilotage" },
      ] },
    show: { tag: "Le déclic", title1: "Du repérage au transfert,", title2: "sans jamais quitter l'outil.", desc: "Tu repères un joueur, sa fiche se remplit. Tu simules le deal (fiscalité, commissions, conformité). Tu suis la rentabilité et tu exportes pour le comptable ou le joueur. Tout est connecté.",
      points: ["Fiche enrichie en quelques secondes", "Simulation FIFA chiffrée et conforme", "Rentabilité et exports en un clic"] },
    price: { tag: "Tarifs", title: "Un prix clair, sans surprise", sub: "Accès sur invitation après validation. Choisis ta formule, on s'occupe du reste.", popular: "POPULAIRE", quote: "Sur devis", perMonth: "€ / mois", choose: "Choisir cette formule", chooseCustom: "Choisir le sur-mesure", selected: "✓ Formule sélectionnée",
      plans: [
        { id: "standard", price: "50", title: "Standard", tagline: "Pour démarrer pro.", feats: ["Fiches joueurs enrichies (4 sources)", "Recrutement, scoring & CRM", "Agenda, alertes & journal", "Travail en équipe", "Comparateur de joueurs"] },
        { id: "pro", price: "100", title: "Pro", tagline: "L'arsenal complet.", feats: ["Tout le Standard", "Simulateur de transfert FIFA complet", "Finance & rentabilité + exports PDF/Excel", "Projection d'effectif par formation", "Stats avancées par 90 min"] },
        { id: "surmesure", price: null, title: "Sur-mesure", tagline: "Ton outil, tes règles.", feats: ["Tout le Pro", "Application modifiable de A à Z", "Fonctionnalités développées sur demande", "Accompagnement & support dédiés", "Devis personnalisé"] },
      ] },
    faqTitle: "Questions fréquentes",
    faq: [
      { q: "D'où viennent les données des joueurs ?", a: "On agrège en direct Transfermarkt, FotMob, SofaScore et BeSoccer. Tu tapes un nom, la fiche se construit toute seule (stats, valeur, contrat). À vérifier et compléter selon les sources." },
      { q: "Comment se passe l'accès ?", a: "L'accès est sur invitation : tu fais une demande via ce site, on valide et on t'envoie ton invitation par e-mail pour créer ton compte." },
      { q: "Puis-je travailler à plusieurs ?", a: "Oui. Le mode groupe partage tout l'effectif et les dossiers entre les membres, en temps réel." },
      { q: "Le sur-mesure, ça veut dire quoi ?", a: "On adapte l'application à ton activité : nouvelles fonctionnalités, intégrations, champs spécifiques. On part sur un devis selon le besoin." },
    ],
    form: { title: "Demander un accès", sub: "Laisse tes coordonnées : on crée ton compte et on t'envoie ton invitation.", doneT: "Demande envoyée 🎉", doneD: "On revient vers toi très vite par e-mail avec ton invitation.", prenom: "Prénom", nom: "Nom", email: "E-mail *", tel: "Téléphone", societe: "Agence / club", formule: "Formule souhaitée", optStandard: "Standard — 50 €/mois", optPro: "Pro — 100 €/mois", optCustom: "Sur-mesure — sur devis", msg: "Message", msgReq: "* (obligatoire pour le sur-mesure)", msgOpt: "(optionnel)", msgPhCustom: "Décris ton besoin : fonctionnalités souhaitées, volume, intégrations…", msgPh: "Ton activité, ton besoin…", send: "Envoyer ma demande", note: "Accès sur invitation après validation.", errMsg: "Pour une offre sur-mesure, décris ton besoin dans le message (obligatoire pour établir un devis).", errSend: "Échec de l'envoi. Réessaie." },
    footer: { tagline: "L'outil des agents de football", privacy: "Confidentialité", terms: "CGU", legal: "Mentions légales", login: "Se connecter" },
  },
  en: {
    nav: { features: "Features", pricing: "Pricing", login: "Log in", cta: "Request access" },
    hero: { badge: "Built for agents who want the edge", h1a: "Spot, price and sign", h1b: "before everyone else.", sub1: "While others retype their data by hand and miss contract deadlines, you ", sub2: "manage your players, simulate transfers and track your profitability", sub3: " — all in one tool.", cta: "Get the edge now", cta2: "See pricing" },
    sources: "Data aggregated from",
    pain: { tag: "The reality", title1: "The job changed.", title2: "Your tools didn't?", sub: "Every day without the right tool is a missing insight — and a deal that goes to someone else.", without: "Without a dedicated tool", with: "With Football Data Management",
      pains: ["You retype every player profile by hand", "You find out about a contract expiry… too late", "You negotiate a transfer without knowing your real margin", "Your info is scattered across 10 Excel files", "A competitor signs the player you were tracking"],
      gains: ["Profiles fill themselves from 4 sources", "Alerts warn you before every deadline", "The FIFA simulator computes player net, club cost and your fee", "Everything is centralized and shared with your team in real time", "You spot gems and sign before others"] },
    feat: { tag: "Features", title: "What others don't have", sub: "Most CRMs make you retype everything by hand. We fetch the data for you — and add the tools that win deals.",
      items: [
        { t: "Enriched player profiles — automatically", d: "We aggregate Transfermarkt, FotMob, SofaScore and BeSoccer. Type a name: stats, market value, contract and history fill themselves.", g: "Live data" },
        { t: "FIFA transfer simulator", d: "Player net, club cost, seller net, agent profit. Country tax, solidarity, sell-on, FIFA compliance, compared scenarios.", g: "Unique" },
        { t: "Finance & profitability", d: "Income/expenses, commissions, projected vs actual, profitability per player / deal / agent. Accounting and player (FIFA) exports.", g: "Business" },
        { t: "Recruitment & scoring", d: "Spot, qualify, score (configurable), check compliance and track prospects in a real CRM.", g: "CRM" },
        { t: "Squad projection", d: "Place your list on a formation (4-3-3, 4-2-3-1…) and instantly see the positions you're missing.", g: "Tactics" },
        { t: "AI & per-90 comparator", d: "Compare profiles on normalized stats, spot undervalued players and anticipate future value.", g: "Advanced" },
        { t: "Real-time team work", d: "Share everything with your agency group. Everyone adds, everyone sees, instantly.", g: "Collaborative" },
        { t: "Calendar, alerts & news", d: "Meetings, contract deadlines, late payments, a tailored transfer news feed — all on your dashboard.", g: "Control" },
      ] },
    show: { tag: "The click", title1: "From scouting to transfer,", title2: "without ever leaving the tool.", desc: "You spot a player, the profile fills in. You simulate the deal (tax, commissions, compliance). You track profitability and export for the accountant or the player. Everything is connected.",
      points: ["Profile enriched in seconds", "Costed, compliant FIFA simulation", "Profitability and exports in one click"] },
    price: { tag: "Pricing", title: "Clear pricing, no surprises", sub: "Access by invitation after approval. Choose your plan, we handle the rest.", popular: "POPULAR", quote: "On quote", perMonth: "€ / month", choose: "Choose this plan", chooseCustom: "Choose custom", selected: "✓ Plan selected",
      plans: [
        { id: "standard", price: "50", title: "Standard", tagline: "To start like a pro.", feats: ["Enriched player profiles (4 sources)", "Recruitment, scoring & CRM", "Calendar, alerts & news", "Team work", "Player comparator"] },
        { id: "pro", price: "100", title: "Pro", tagline: "The full arsenal.", feats: ["Everything in Standard", "Full FIFA transfer simulator", "Finance & profitability + PDF/Excel exports", "Squad projection by formation", "Advanced per-90 stats"] },
        { id: "surmesure", price: null, title: "Custom", tagline: "Your tool, your rules.", feats: ["Everything in Pro", "App customizable from A to Z", "Features built on request", "Dedicated guidance & support", "Tailored quote"] },
      ] },
    faqTitle: "Frequently asked questions",
    faq: [
      { q: "Where does the player data come from?", a: "We aggregate Transfermarkt, FotMob, SofaScore and BeSoccer live. Type a name and the profile builds itself (stats, value, contract). Verify and complete depending on sources." },
      { q: "How does access work?", a: "Access is by invitation: you submit a request via this site, we approve it and email you an invitation to create your account." },
      { q: "Can I work with several people?", a: "Yes. Group mode shares the whole squad and cases between members, in real time." },
      { q: "What does custom mean?", a: "We adapt the app to your business: new features, integrations, specific fields. We quote based on the need." },
    ],
    form: { title: "Request access", sub: "Leave your details: we create your account and email your invitation.", doneT: "Request sent 🎉", doneD: "We'll get back to you very soon by email with your invitation.", prenom: "First name", nom: "Last name", email: "E-mail *", tel: "Phone", societe: "Agency / club", formule: "Desired plan", optStandard: "Standard — €50/month", optPro: "Pro — €100/month", optCustom: "Custom — on quote", msg: "Message", msgReq: "* (required for custom)", msgOpt: "(optional)", msgPhCustom: "Describe your need: desired features, volume, integrations…", msgPh: "Your activity, your need…", send: "Send my request", note: "Access by invitation after approval.", errMsg: "For a custom offer, describe your need in the message (required to prepare a quote).", errSend: "Sending failed. Try again." },
    footer: { tagline: "The tool for football agents", privacy: "Privacy", terms: "Terms", legal: "Legal notice", login: "Log in" },
  },
  es: {
    nav: { features: "Funcionalidades", pricing: "Precios", login: "Iniciar sesión", cta: "Solicitar acceso" },
    hero: { badge: "Diseñado para agentes que quieren ventaja", h1a: "Detecta, valora y ficha", h1b: "antes que nadie.", sub1: "Mientras otros reescriben sus datos a mano y se les pasan los finales de contrato, tú ", sub2: "gestionas tus jugadores, simulas traspasos y controlas tu rentabilidad", sub3: " — en una sola herramienta.", cta: "Toma la ventaja ahora", cta2: "Ver precios" },
    sources: "Datos agregados de",
    pain: { tag: "La realidad", title1: "El oficio cambió.", title2: "¿Tus herramientas no?", sub: "Cada día sin la herramienta adecuada es información que te falta — y un acuerdo que se va a otro.", without: "Sin herramienta dedicada", with: "Con Football Data Management",
      pains: ["Reescribes cada ficha de jugador a mano", "Te enteras de un fin de contrato… demasiado tarde", "Negocias un traspaso sin conocer tu margen real", "Tu información está dispersa en 10 archivos Excel", "Un competidor ficha al jugador que seguías"],
      gains: ["Las fichas se rellenan solas desde 4 fuentes", "Las alertas te avisan antes de cada vencimiento", "El simulador FIFA calcula neto jugador, coste club y tu comisión", "Todo centralizado y compartido con tu equipo en tiempo real", "Detectas joyas y fichas antes que los demás"] },
    feat: { tag: "Funcionalidades", title: "Lo que otros no tienen", sub: "La mayoría de los CRM te hacen reescribir todo a mano. Nosotros buscamos el dato por ti — y añadimos las herramientas que cierran acuerdos.",
      items: [
        { t: "Fichas de jugador enriquecidas — automáticamente", d: "Agregamos Transfermarkt, FotMob, SofaScore y BeSoccer. Escribe un nombre: estadísticas, valor de mercado, contrato e historial se rellenan solos.", g: "Datos en vivo" },
        { t: "Simulador de traspaso FIFA", d: "Neto jugador, coste club, neto vendedor, beneficio agente. Fiscalidad por país, solidaridad, sell-on, conformidad FIFA, escenarios comparados.", g: "Único" },
        { t: "Finanzas y rentabilidad", d: "Entradas/salidas, comisiones, proyección vs real, rentabilidad por jugador / acuerdo / agente. Exportes contables y de jugador (FIFA).", g: "Negocio" },
        { t: "Reclutamiento y puntuación", d: "Detecta, califica, puntúa (configurable), verifica la conformidad y sigue tus prospectos en un CRM real.", g: "CRM" },
        { t: "Proyección de plantilla", d: "Coloca tu lista en una formación (4-3-3, 4-2-3-1…) y ve al instante las posiciones que te faltan.", g: "Táctica" },
        { t: "IA y comparador por 90 min", d: "Compara perfiles con estadísticas normalizadas, detecta infravalorados y anticipa el valor futuro.", g: "Avanzado" },
        { t: "Trabajo en equipo en tiempo real", d: "Comparte todo con tu grupo de agentes. Cada uno añade, todos ven, al instante.", g: "Colaborativo" },
        { t: "Agenda, alertas y noticias", d: "Citas, vencimientos de contrato, pagos atrasados, un feed de fichajes a medida — todo en tu panel.", g: "Control" },
      ] },
    show: { tag: "El clic", title1: "Del scouting al traspaso,", title2: "sin salir nunca de la herramienta.", desc: "Detectas un jugador, su ficha se rellena. Simulas el acuerdo (fiscalidad, comisiones, conformidad). Sigues la rentabilidad y exportas para el contable o el jugador. Todo conectado.",
      points: ["Ficha enriquecida en segundos", "Simulación FIFA calculada y conforme", "Rentabilidad y exportes en un clic"] },
    price: { tag: "Precios", title: "Precio claro, sin sorpresas", sub: "Acceso por invitación tras validación. Elige tu plan, nosotros nos encargamos del resto.", popular: "POPULAR", quote: "Presupuesto", perMonth: "€ / mes", choose: "Elegir este plan", chooseCustom: "Elegir a medida", selected: "✓ Plan seleccionado",
      plans: [
        { id: "standard", price: "50", title: "Standard", tagline: "Para empezar profesional.", feats: ["Fichas de jugador enriquecidas (4 fuentes)", "Reclutamiento, puntuación y CRM", "Agenda, alertas y noticias", "Trabajo en equipo", "Comparador de jugadores"] },
        { id: "pro", price: "100", title: "Pro", tagline: "El arsenal completo.", feats: ["Todo el Standard", "Simulador de traspaso FIFA completo", "Finanzas y rentabilidad + exportes PDF/Excel", "Proyección de plantilla por formación", "Estadísticas avanzadas por 90 min"] },
        { id: "surmesure", price: null, title: "A medida", tagline: "Tu herramienta, tus reglas.", feats: ["Todo el Pro", "App personalizable de la A a la Z", "Funciones desarrolladas bajo pedido", "Acompañamiento y soporte dedicados", "Presupuesto personalizado"] },
      ] },
    faqTitle: "Preguntas frecuentes",
    faq: [
      { q: "¿De dónde vienen los datos de los jugadores?", a: "Agregamos Transfermarkt, FotMob, SofaScore y BeSoccer en directo. Escribe un nombre y la ficha se construye sola (estadísticas, valor, contrato). Verifica y completa según las fuentes." },
      { q: "¿Cómo funciona el acceso?", a: "El acceso es por invitación: haces una solicitud en este sitio, la validamos y te enviamos tu invitación por e-mail para crear tu cuenta." },
      { q: "¿Puedo trabajar en equipo?", a: "Sí. El modo grupo comparte toda la plantilla y los casos entre los miembros, en tiempo real." },
      { q: "¿Qué significa a medida?", a: "Adaptamos la app a tu actividad: nuevas funciones, integraciones, campos específicos. Hacemos un presupuesto según la necesidad." },
    ],
    form: { title: "Solicitar acceso", sub: "Deja tus datos: creamos tu cuenta y te enviamos tu invitación.", doneT: "Solicitud enviada 🎉", doneD: "Te responderemos muy pronto por e-mail con tu invitación.", prenom: "Nombre", nom: "Apellido", email: "E-mail *", tel: "Teléfono", societe: "Agencia / club", formule: "Plan deseado", optStandard: "Standard — 50 €/mes", optPro: "Pro — 100 €/mes", optCustom: "A medida — presupuesto", msg: "Mensaje", msgReq: "* (obligatorio para a medida)", msgOpt: "(opcional)", msgPhCustom: "Describe tu necesidad: funciones deseadas, volumen, integraciones…", msgPh: "Tu actividad, tu necesidad…", send: "Enviar mi solicitud", note: "Acceso por invitación tras validación.", errMsg: "Para una oferta a medida, describe tu necesidad en el mensaje (obligatorio para preparar un presupuesto).", errSend: "Error al enviar. Inténtalo de nuevo." },
    footer: { tagline: "La herramienta para agentes de fútbol", privacy: "Privacidad", terms: "Términos", legal: "Aviso legal", login: "Iniciar sesión" },
  },
};

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
      opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(28px)",
      transition: `opacity .7s ease ${delay}ms, transform .7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
    }}>{children}</div>
  );
}

export default function Vitrine() {
  const { lang, setLang } = useLanguage();
  const T = VIT[lang] || VIT.fr;
  const formRef = useRef(null);
  const [f, setF] = useState({ prenom: "", nom: "", email: "", telephone: "", societe: "", formule: "standard", message: "" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const [state, setState] = useState("idle");
  const [err, setErr] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const scrollToForm = (formule) => { if (formule) setF((s) => ({ ...s, formule })); formRef.current?.scrollIntoView({ behavior: "smooth" }); };
  const selectPlan = (id) => setF((s) => ({ ...s, formule: id }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.email.trim()) return;
    if (f.formule === "surmesure" && !f.message.trim()) { setErr(T.form.errMsg); setState("error"); return; }
    setState("sending"); setErr(null);
    try {
      const res = await invokeFn("accessRequest", { action: "submit", data: f });
      if (!res?.ok) throw new Error(res?.error || T.form.errSend);
      setState("done");
    } catch (e2) { setErr(e2?.message || T.form.errSend); setState("error"); }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white selection:bg-emerald-500/30 overflow-x-hidden">
      <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-xl bg-[#0a0e1a]/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="font-bold flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">⚽</span>
            <span className="tracking-tight">Football Data <span className="text-emerald-400">Management</span></span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#features" className="hidden md:block text-sm text-slate-300 hover:text-white transition">{T.nav.features}</a>
            <a href="#pricing" className="hidden md:block text-sm text-slate-300 hover:text-white transition">{T.nav.pricing}</a>
            <div className="flex items-center gap-1 text-xs">
              {["fr", "en", "es"].map((lc) => (
                <button key={lc} onClick={() => setLang(lc)} className={`uppercase px-1.5 py-0.5 rounded ${lang === lc ? "text-emerald-400 font-bold" : "text-slate-500 hover:text-slate-300"}`}>{lc}</button>
              ))}
            </div>
            <a href="/login" className="text-sm text-slate-300 hover:text-white transition">{T.nav.login}</a>
            <button onClick={() => scrollToForm()} className="text-sm bg-emerald-500 hover:bg-emerald-400 text-[#06210f] rounded-lg px-4 py-2 font-semibold transition shadow-lg shadow-emerald-500/20">{T.nav.cta}</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0a1410] to-[#0a0e1a]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[50rem] h-[50rem] bg-emerald-500/15 blur-[140px] rounded-full" />
        <ParticleHero />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/85 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-5 text-center pb-16 md:pb-24">
          <Reveal><span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 mb-6 backdrop-blur"><Sparkles className="w-3.5 h-3.5 text-emerald-400" /> {T.hero.badge}</span></Reveal>
          <Reveal delay={80}>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.04] tracking-tight">{T.hero.h1a}<br /><span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">{T.hero.h1b}</span></h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">{T.hero.sub1}<span className="text-white font-medium">{T.hero.sub2}</span>{T.hero.sub3}</p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
              <button onClick={() => scrollToForm()} className="group bg-emerald-500 hover:bg-emerald-400 text-[#06210f] rounded-xl px-7 py-3.5 font-bold inline-flex items-center gap-2 transition shadow-xl shadow-emerald-500/30">{T.hero.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></button>
              <a href="#pricing" className="border border-white/20 hover:bg-white/10 rounded-xl px-7 py-3.5 font-semibold inline-flex items-center gap-2 transition backdrop-blur">{T.hero.cta2}</a>
            </div>
          </Reveal>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-500 animate-bounce"><ChevronDown className="w-5 h-5" /></div>
      </section>

      {/* SOURCES */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-5 py-7 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10">
          <span className="text-xs uppercase tracking-widest text-slate-500 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {T.sources}</span>
          <div className="flex items-center gap-6 sm:gap-10 flex-wrap justify-center">{SOURCES.map((s) => <span key={s} className="text-slate-300 font-semibold tracking-tight">{s}</span>)}</div>
        </div>
      </section>

      {/* PAIN → SOLUTION */}
      <section className="max-w-6xl mx-auto px-5 py-24 md:py-28">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">{T.pain.tag}</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 tracking-tight leading-tight">{T.pain.title1}<br />{T.pain.title2}</h2>
            <p className="mt-4 text-slate-400 text-lg">{T.pain.sub}</p>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-5">
          <Reveal>
            <div className="h-full rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-7">
              <h3 className="font-bold text-red-300 mb-5 flex items-center gap-2"><X className="w-5 h-5" /> {T.pain.without}</h3>
              <ul className="space-y-3.5">{T.pain.pains.map((p) => <li key={p} className="flex items-start gap-3 text-slate-400"><X className="w-4 h-4 text-red-400/70 flex-shrink-0 mt-0.5" /> {p}</li>)}</ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="h-full rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.05] p-7 shadow-2xl shadow-emerald-500/5">
              <h3 className="font-bold text-emerald-300 mb-5 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {T.pain.with}</h3>
              <ul className="space-y-3.5">{T.pain.gains.map((g) => <li key={g} className="flex items-start gap-3 text-slate-200"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> {g}</li>)}</ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-24 md:py-32">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">{T.feat.tag}</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 tracking-tight">{T.feat.title}</h2>
            <p className="mt-4 text-slate-400 text-lg">{T.feat.sub}</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {T.feat.items.map((ft, i) => {
            const Icon = FEATURE_ICONS[i] || Database;
            return (
              <Reveal key={i} delay={(i % 4) * 70}>
                <div className="group h-full rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-6 hover:border-emerald-500/40 hover:from-emerald-500/[0.06] transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Icon className="w-5 h-5" /></div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 border border-white/10 rounded-full px-2 py-0.5">{ft.g}</span>
                  </div>
                  <h3 className="font-bold text-[15px] leading-snug">{ft.t}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{ft.d}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* SHOWCASE */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e1a] via-[#0a0e1a]/90 to-emerald-950/40" />
        <div className="relative max-w-6xl mx-auto px-5 py-24 md:py-32">
          <Reveal>
            <div className="max-w-xl">
              <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">{T.show.tag}</span>
              <h2 className="text-4xl md:text-5xl font-black mt-3 leading-tight tracking-tight">{T.show.title1}<br />{T.show.title2}</h2>
              <p className="mt-5 text-slate-300 text-lg leading-relaxed">{T.show.desc}</p>
              <ul className="mt-7 space-y-3">{T.show.points.map((t) => <li key={t} className="flex items-center gap-3 text-slate-200"><span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0"><Zap className="w-3.5 h-3.5" /></span> {t}</li>)}</ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 py-24 md:py-32">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest">{T.price.tag}</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 tracking-tight">{T.price.title}</h2>
            <p className="mt-4 text-slate-400 text-lg">{T.price.sub}</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {T.price.plans.map((p, i) => {
            const selected = f.formule === p.id;
            const best = p.id === "pro";
            return (
              <Reveal key={p.id} delay={i * 90} className="h-full">
                <div onClick={() => selectPlan(p.id)} role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectPlan(p.id); } }}
                  className={`relative h-full rounded-3xl p-7 flex flex-col transition-all cursor-pointer ${selected ? "bg-emerald-500/15 border-2 border-emerald-400 ring-2 ring-emerald-400/40 shadow-2xl shadow-emerald-500/20 md:-translate-y-3" : best ? "bg-gradient-to-b from-emerald-500/15 to-white/[0.03] border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/10 md:-translate-y-3 hover:border-emerald-400" : "bg-white/[0.03] border border-white/10 hover:border-white/30"}`}>
                  {selected
                    ? <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-bold bg-emerald-400 text-[#06210f] rounded-full px-4 py-1 shadow-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {T.price.selected.replace("✓ ", "")}</span>
                    : best && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-bold bg-emerald-500 text-[#06210f] rounded-full px-4 py-1 shadow-lg flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> {T.price.popular}</span>}
                  <h3 className="font-bold text-xl">{p.title}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{p.tagline}</p>
                  <div className="mt-5 mb-6 flex items-end gap-1">
                    {p.price ? (<><span className="text-5xl font-black tracking-tight">{p.price}</span><span className="text-slate-400 mb-1.5">{T.price.perMonth}</span></>) : (<span className="text-4xl font-black tracking-tight">{T.price.quote}</span>)}
                  </div>
                  <ul className="space-y-3 flex-1">{p.feats.map((feat, j) => <li key={j} className="flex items-start gap-2.5 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> {feat}</li>)}</ul>
                  <div className={`mt-7 rounded-xl px-5 py-3 font-bold text-center transition ${selected ? "bg-emerald-400 text-[#06210f]" : best ? "bg-emerald-500 text-[#06210f]" : "border border-white/15"}`}>
                    {selected ? T.price.selected : p.id === "surmesure" ? T.price.chooseCustom : T.price.choose}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 py-20">
        <Reveal><h2 className="text-3xl md:text-4xl font-black text-center mb-12 tracking-tight">{T.faqTitle}</h2></Reveal>
        <div className="space-y-3">
          {T.faq.map((item, i) => (
            <Reveal key={i} delay={i * 60}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition p-5">
                <div className="flex items-center justify-between gap-4"><span className="font-semibold">{item.q}</span><ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} /></div>
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
          <div className="text-center mb-9"><h2 className="text-4xl md:text-5xl font-black tracking-tight">{T.form.title}</h2><p className="mt-4 text-slate-400 text-lg">{T.form.sub}</p></div>
          {state === "done" ? (
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="font-bold text-emerald-100 text-xl">{T.form.doneT}</h3>
              <p className="text-sm text-emerald-200/80 mt-2">{T.form.doneD}</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 bg-white/[0.04] backdrop-blur rounded-3xl border border-white/10 p-7">
              <div className="grid grid-cols-2 gap-3"><Field label={T.form.prenom} value={f.prenom} onChange={set("prenom")} /><Field label={T.form.nom} value={f.nom} onChange={set("nom")} /></div>
              <Field label={T.form.email} type="email" value={f.email} onChange={set("email")} required />
              <div className="grid grid-cols-2 gap-3"><Field label={T.form.tel} value={f.telephone} onChange={set("telephone")} /><Field label={T.form.societe} value={f.societe} onChange={set("societe")} /></div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">{T.form.formule}</label>
                <select value={f.formule} onChange={set("formule")} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50">
                  <option className="bg-[#0a0e1a]" value="standard">{T.form.optStandard}</option>
                  <option className="bg-[#0a0e1a]" value="pro">{T.form.optPro}</option>
                  <option className="bg-[#0a0e1a]" value="surmesure">{T.form.optCustom}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">{T.form.msg} {f.formule === "surmesure" ? <span className="text-emerald-400">{T.form.msgReq}</span> : T.form.msgOpt}</label>
                <textarea value={f.message} onChange={set("message")} rows={3} required={f.formule === "surmesure"} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50" placeholder={f.formule === "surmesure" ? T.form.msgPhCustom : T.form.msgPh} />
              </div>
              {err && <p className="text-sm text-red-400">{err}</p>}
              <button type="submit" disabled={state === "sending" || !f.email.trim() || (f.formule === "surmesure" && !f.message.trim())} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#06210f] rounded-xl px-4 py-3.5 font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60 transition shadow-lg shadow-emerald-500/20">
                {state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} {T.form.send}
              </button>
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> {T.form.note}</p>
            </form>
          )}
        </Reveal>
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-sm text-slate-500">
        <div className="font-bold text-slate-300 mb-2">Football Data <span className="text-emerald-400">Management</span></div>
        <div className="flex items-center justify-center gap-4 flex-wrap mb-2 text-slate-400">
          <a href="/confidentialite" className="hover:text-slate-200">{T.footer.privacy}</a>
          <a href="/cgu" className="hover:text-slate-200">{T.footer.terms}</a>
          <a href="/mentions-legales" className="hover:text-slate-200">{T.footer.legal}</a>
          <a href="/login" className="hover:text-slate-200">{T.footer.login}</a>
        </div>
        © {new Date().getFullYear()} · {T.footer.tagline}
      </footer>
    </div>
  );
}

const Field = ({ label, value, onChange, type = "text", required }) => (
  <div>
    <label className="text-xs font-medium text-slate-400 mb-1.5 block">{label}</label>
    <input type={type} value={value} onChange={onChange} required={required} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 transition" />
  </div>
);
