import React, { useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import { Loader2, ArrowRight, ShieldCheck, Users, Sparkles, Smartphone } from "lucide-react";

/**
 * Page de connexion de marque. L'authentification (mot de passe) est gérée par
 * Base44 : le bouton déclenche onConnect() → redirection vers l'auth Base44.
 */
export default function Login({ onConnect }) {
  const { lang, setLang } = useLanguage();
  const [loading, setLoading] = useState(false);

  const connect = () => {
    setLoading(true);
    try { onConnect?.(); } catch { setLoading(false); }
  };

  const features = [
    { icon: Users, label: t(lang, "login.f1") },
    { icon: Sparkles, label: t(lang, "login.f2") },
    { icon: Smartphone, label: t(lang, "login.f3") },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── Panneau de marque (gauche) ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        {/* halos décoratifs subtils */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
              <span className="text-white font-black text-lg leading-none">⚽</span>
            </div>
            <span className="text-white font-semibold tracking-tight">{t(lang, "login.brand")}</span>
          </div>

          <div>
            <h1 className="text-white text-4xl font-bold leading-tight tracking-tight">
              {t(lang, "login.brand")}
            </h1>
            <p className="text-slate-400 text-lg mt-3">{t(lang, "login.tagline")}</p>
            <div className="w-16 h-1 bg-green-500 rounded-full mt-6 mb-8" />
            <div className="space-y-3.5">
              {features.map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-[15px]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-xs">© {new Date().getFullYear()} {t(lang, "login.brand")}</p>
        </div>
      </div>

      {/* ── Connexion (droite) ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {/* sélecteur de langue */}
        <div className="flex justify-end p-5">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-0.5">
            {["fr", "en", "es"].map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                  lang === l ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700"
                }`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            {/* logo mobile (panneau gauche masqué) */}
            <div className="lg:hidden flex items-center gap-2.5 mb-10">
              <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
                <span className="text-white font-black text-lg leading-none">⚽</span>
              </div>
              <span className="text-slate-900 font-semibold">{t(lang, "login.brand")}</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t(lang, "login.welcome")}</h2>
            <p className="text-slate-500 mt-2 text-[15px]">{t(lang, "login.subtitle")}</p>

            <button
              onClick={connect}
              disabled={loading}
              className="mt-8 w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-semibold flex items-center justify-center gap-2 transition-colors group"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t(lang, "login.connecting")}</>
              ) : (
                <>{t(lang, "login.cta")} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-xs">{t(lang, "login.secured")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
