import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, User, Briefcase } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

// La valeur stockée (v) reste stable ; seul le libellé est traduit.
const ROLES = [
  { v: "CEO", fr: "CEO", en: "CEO", es: "CEO" },
  { v: "Directeur sportif", fr: "Directeur sportif", en: "Sporting director", es: "Director deportivo" },
  { v: "Scout", fr: "Scout", en: "Scout", es: "Scout" },
  { v: "Agent", fr: "Agent", en: "Agent", es: "Agente" },
  { v: "Analyste", fr: "Analyste", en: "Analyst", es: "Analista" },
  { v: "Recruteur", fr: "Recruteur", en: "Recruiter", es: "Reclutador" },
  { v: "Autre", fr: "Autre", en: "Other", es: "Otro" },
];

const REG = {
  fr: { pwMismatch: "Les mots de passe ne correspondent pas", regFail: "Échec de l'inscription", otpInvalid: "Code de vérification invalide", codeSent: "Code envoyé", codeSentD: "Vérifie ta boîte mail pour le nouveau code.", resendFail: "Échec de l'envoi du code", verifyTitle: "Vérifie ton e-mail", verifySub: "Nous avons envoyé un code à", verifying: "Vérification...", verify: "Vérifier", noCode: "Code non reçu ?", resend: "Renvoyer", createTitle: "Crée ton compte", createSub: "Inscris-toi pour commencer", haveAccount: "Tu as déjà un compte ?", login: "Se connecter", google: "Continuer avec Google", or: "ou", prenom: "Prénom", nom: "Nom", role: "Rôle", rolePick: "Choisir ton rôle…", email: "E-mail", password: "Mot de passe", confirm: "Confirmer le mot de passe", creating: "Création du compte...", create: "Créer le compte" },
  en: { pwMismatch: "Passwords do not match", regFail: "Registration failed", otpInvalid: "Invalid verification code", codeSent: "Code sent", codeSentD: "Check your email for the new code.", resendFail: "Failed to resend code", verifyTitle: "Verify your email", verifySub: "We sent a code to", verifying: "Verifying...", verify: "Verify", noCode: "Didn't receive the code?", resend: "Resend", createTitle: "Create your account", createSub: "Sign up to get started", haveAccount: "Already have an account?", login: "Log in", google: "Continue with Google", or: "or", prenom: "First name", nom: "Last name", role: "Role", rolePick: "Choose your role…", email: "Email", password: "Password", confirm: "Confirm password", creating: "Creating account...", create: "Create account" },
  es: { pwMismatch: "Las contraseñas no coinciden", regFail: "Error en el registro", otpInvalid: "Código de verificación inválido", codeSent: "Código enviado", codeSentD: "Revisa tu correo para ver el nuevo código.", resendFail: "Error al reenviar el código", verifyTitle: "Verifica tu correo", verifySub: "Hemos enviado un código a", verifying: "Verificando...", verify: "Verificar", noCode: "¿No recibiste el código?", resend: "Reenviar", createTitle: "Crea tu cuenta", createSub: "Regístrate para empezar", haveAccount: "¿Ya tienes una cuenta?", login: "Iniciar sesión", google: "Continuar con Google", or: "o", prenom: "Nombre", nom: "Apellido", role: "Rol", rolePick: "Elige tu rol…", email: "Correo", password: "Contraseña", confirm: "Confirmar contraseña", creating: "Creando cuenta...", create: "Crear cuenta" },
};

export default function Register() {
  const { lang } = useLanguage();
  const T = REG[lang] || REG.fr;
  const [searchParams] = useSearchParams();
  const [firstName, setFirstName] = useState(searchParams.get("prenom") || "");
  const [lastName, setLastName] = useState(searchParams.get("nom") || "");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError(T.pwMismatch); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password, full_name: `${firstName.trim()} ${lastName.trim()}`.trim() });
      setShowOtp(true);
    } catch (err) { setError(err.message || T.regFail); }
    finally { setLoading(false); }
  };

  const handleVerify = async () => {
    setError(""); setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      try {
        await base44.auth.updateMe({
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim() || undefined,
          role_metier: role || undefined,
          plan: searchParams.get("plan") || undefined,
        });
      } catch { /* non bloquant */ }
      window.location.href = "/";
    } catch (err) { setError(err.message || T.otpInvalid); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: T.codeSent, description: T.codeSentD });
    } catch (err) { setError(err.message || T.resendFail); }
  };

  const handleGoogle = () => base44.auth.loginWithProvider("google", "/");

  if (showOtp) {
    return (
      <AuthLayout icon={Mail} title={T.verifyTitle} subtitle={`${T.verifySub} ${email}`}>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{T.verifying}</> : T.verify}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {T.noCode}{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">{T.resend}</button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={UserPlus} title={T.createTitle} subtitle={T.createSub}
      footer={<>{T.haveAccount}{" "}<Link to="/login" className="text-primary font-medium hover:underline">{T.login}</Link></>}>
      <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle}>
        <GoogleIcon className="w-5 h-5 mr-2" />{T.google}
      </Button>
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground">{T.or}</span></div>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">{T.prenom}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input id="firstName" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{T.nom}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input id="lastName" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">{T.role}</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required
              className="w-full h-12 pl-10 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="" disabled>{T.rolePick}</option>
              {ROLES.map((r) => <option key={r.v} value={r.v}>{r[lang] || r.fr}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{T.email}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{T.password}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{T.confirm}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{T.creating}</> : T.create}
        </Button>
      </form>
    </AuthLayout>
  );
}