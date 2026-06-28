import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

const FP = {
  fr: { title: "Mot de passe oublié", subtitle: "Nous t'enverrons un lien pour le réinitialiser", back: "Retour à la connexion", sent: "Si un compte existe avec cet e-mail, tu recevras un lien de réinitialisation sous peu.", emailLabel: "Adresse e-mail", sending: "Envoi...", send: "Envoyer le lien" },
  en: { title: "Reset password", subtitle: "We'll send you a link to reset it", back: "Back to log in", sent: "If an account exists with that email, you'll receive a password reset link shortly.", emailLabel: "Email address", sending: "Sending...", send: "Send reset link" },
  es: { title: "Restablecer contraseña", subtitle: "Te enviaremos un enlace para restablecerla", back: "Volver a iniciar sesión", sent: "Si existe una cuenta con ese correo, recibirás un enlace de restablecimiento en breve.", emailLabel: "Dirección de correo", sending: "Enviando...", send: "Enviar enlace" },
};

export default function ForgotPassword() {
  const { lang } = useLanguage();
  const T = FP[lang] || FP.fr;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await base44.auth.resetPasswordRequest(email); } catch { /* succès affiché quoi qu'il arrive */ }
    finally { setLoading(false); setSent(true); }
  };

  return (
    <AuthLayout icon={Mail} title={T.title} subtitle={T.subtitle}
      footer={<Link to="/login" className="text-primary font-medium hover:underline"><ArrowLeft className="w-3 h-3 inline mr-1" />{T.back}</Link>}>
      {sent ? (
        <p className="text-sm text-foreground text-center">{T.sent}</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{T.emailLabel}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{T.sending}</> : T.send}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
