import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import { BRAND_NAME } from "../lib/brand";
import { Loader2, ArrowRight, ShieldCheck, Users, Sparkles, Smartphone, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

const INPUT = "w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400";
const BTN = "w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition-colors group";

/**
 * Page de connexion de marque avec formulaire e-mail / mot de passe natif
 * (base44.auth.loginViaEmailPassword) — aucune redirection vers le login Base44.
 * Le token est persisté par le SDK ; on recharge pour entrer dans l'app.
 */
export default function Login() {
  const { lang, setLang } = useLanguage();
  const [mode, setMode] = useState("login"); // login | signup | otp
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const srvMsg = (err, fallbackKey) =>
    err?.response?.data?.message || err?.response?.data?.detail || t(lang, fallbackKey);

  const switchMode = (m) => { setMode(m); setError(null); };

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true); setError(null); setNotice(null);
    try {
      await base44.auth.loginViaEmailPassword(email.trim(), password);
      // Token persisté par le SDK → recharge l'app, authentifiée → dashboard.
      window.location.href = '/';
    } catch (err) {
      setError(srvMsg(err, "login.error"));
      setLoading(false);
    }
  };

  // Inscription : crée le compte puis passe à l'étape de vérification par code.
  const signup = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError(t(lang, "login.pwMismatch")); return; }
    if (password.length < 6) { setError(t(lang, "login.pwTooShort")); return; }
    setLoading(true); setError(null); setNotice(null);
    try {
      await base44.auth.register({
        email: email.trim(),
        password,
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      });
      switchMode("otp");
    } catch (err) {
      setError(srvMsg(err, "login.signupError"));
    } finally {
      setLoading(false);
    }
  };

  // Vérifie le code reçu par e-mail puis renvoie vers la connexion.
  const verify = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true); setError(null);
    try {
      await base44.auth.verifyOtp({ email: email.trim(), otpCode: otp.trim() });
      setOtp(""); setPassword(""); setConfirm("");
      setMode("login"); setError(null);
      setNotice(t(lang, "login.verifiedNotice"));
    } catch (err) {
      setError(srvMsg(err, "login.otpError"));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    try { await base44.auth.resendOtp?.(email.trim()); setNotice(t(lang, "login.resent")); }
    catch (err) { setError(srvMsg(err, "login.otpError")); }
  };

  const forgot = async () => {
    if (!email.trim()) { setError(t(lang, "login.forgotErr")); return; }
    setError(null);
    try { await base44.auth.resetPasswordRequest?.(email.trim()); } catch { /* on n'expose pas l'existence du compte */ }
    setNotice(t(lang, "login.forgotSent"));
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
            <img src="/brand/logo.png" alt="Global Sports Agency" className="w-10 h-10 rounded-xl object-contain bg-white/95 p-0.5" />
            <span className="text-white font-semibold tracking-tight">{BRAND_NAME}</span>
          </div>

          <div>
            <h1 className="text-white text-4xl font-bold leading-tight tracking-tight">
              {BRAND_NAME}
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

          <p className="text-slate-600 text-xs">© {new Date().getFullYear()} {BRAND_NAME}</p>
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
              <img src="/brand/logo.png" alt="Global Sports Agency" className="w-10 h-10 rounded-xl object-contain" />
              <span className="text-slate-900 font-semibold">{BRAND_NAME}</span>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {mode === "signup" ? t(lang, "login.signupTitle") : mode === "otp" ? t(lang, "login.otpTitle") : t(lang, "login.welcome")}
            </h2>
            <p className="text-slate-500 mt-2 text-[15px]">
              {mode === "signup" ? t(lang, "login.signupSubtitle")
                : mode === "otp" ? t(lang, "login.otpSubtitle", { email })
                : t(lang, "login.subtitle")}
            </p>

            {/* Bannières partagées */}
            <div className="mt-6 space-y-2">
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}
              {notice && (
                <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /><span>{notice}</span>
                </div>
              )}
            </div>

            {/* ── CONNEXION ── */}
            {mode === "login" && (
              <form onSubmit={submit} className="mt-2 space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-slate-600">{t(lang, "login.email")}</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t(lang, "login.emailPh")} className={INPUT} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600">{t(lang, "login.password")}</label>
                    <button type="button" onClick={forgot} className="text-[11px] text-slate-400 hover:text-slate-700">{t(lang, "login.forgot")}</button>
                  </div>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t(lang, "login.passwordPh")} className={INPUT} />
                  </div>
                </div>
                <button type="submit" disabled={loading || !email.trim() || !password} className={BTN}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t(lang, "login.connecting")}</> : <>{t(lang, "login.cta")} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
                </button>
                <p className="text-center text-xs text-slate-400 pt-1">
                  {t(lang, "login.noAccount")} <button type="button" onClick={() => switchMode("signup")} className="text-slate-900 font-semibold hover:underline">{t(lang, "login.signupLink")}</button>
                </p>
              </form>
            )}

            {/* ── INSCRIPTION ── */}
            {mode === "signup" && (
              <form onSubmit={signup} className="mt-2 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">{t(lang, "login.firstName")}</label>
                    <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t(lang, "login.firstNamePh")} className={`${INPUT} pl-3 mt-1`} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">{t(lang, "login.lastName")}</label>
                    <input required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t(lang, "login.lastNamePh")} className={`${INPUT} pl-3 mt-1`} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">{t(lang, "login.email")}</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t(lang, "login.emailPh")} className={INPUT} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">{t(lang, "login.password")}</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t(lang, "login.passwordPh")} className={INPUT} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">{t(lang, "login.confirm")}</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t(lang, "login.confirmPh")} className={INPUT} />
                  </div>
                </div>
                <button type="submit" disabled={loading || !email.trim() || !password || !confirm || !firstName.trim() || !lastName.trim()} className={BTN}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t(lang, "login.connecting")}</> : <>{t(lang, "login.createAccount")} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
                </button>
                <p className="text-center text-xs text-slate-400 pt-1">
                  {t(lang, "login.haveAccount")} <button type="button" onClick={() => switchMode("login")} className="text-slate-900 font-semibold hover:underline">{t(lang, "login.loginLink")}</button>
                </p>
              </form>
            )}

            {/* ── VÉRIFICATION (code e-mail) ── */}
            {mode === "otp" && (
              <form onSubmit={verify} className="mt-2 space-y-3.5">
                <input inputMode="numeric" required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder={t(lang, "login.otpPh")} maxLength={6}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white text-center tracking-[0.4em] font-mono text-lg text-slate-900 placeholder:tracking-normal placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400" />
                <button type="submit" disabled={loading || otp.trim().length < 4} className={BTN}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t(lang, "login.connecting")}</> : <>{t(lang, "login.verify")} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>}
                </button>
                <div className="flex items-center justify-between text-xs">
                  <button type="button" onClick={() => switchMode("login")} className="text-slate-400 hover:text-slate-700">{t(lang, "login.loginLink")}</button>
                  <button type="button" onClick={resend} className="text-slate-900 font-semibold hover:underline">{t(lang, "login.resend")}</button>
                </div>
              </form>
            )}

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