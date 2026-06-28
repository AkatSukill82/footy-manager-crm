import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

const RP = {
  fr: { pwMismatch: "Les mots de passe ne correspondent pas", failed: "Échec de la réinitialisation", invalidTitle: "Lien invalide", invalidSub: "Ce lien de réinitialisation est manquant ou invalide", newLink: "Demander un nouveau lien", invalidBody: "Le lien utilisé semble incomplet. Demande un nouvel e-mail de réinitialisation.", title: "Nouveau mot de passe", subtitle: "Saisis ton nouveau mot de passe ci-dessous", newPw: "Nouveau mot de passe", confirm: "Confirmer le mot de passe", resetting: "Réinitialisation...", reset: "Réinitialiser le mot de passe" },
  en: { pwMismatch: "Passwords do not match", failed: "Failed to reset password", invalidTitle: "Invalid reset link", invalidSub: "This password reset link is missing or invalid", newLink: "Request a new link", invalidBody: "The link you used appears to be incomplete. Please request a new password reset email.", title: "New password", subtitle: "Enter your new password below", newPw: "New password", confirm: "Confirm password", resetting: "Resetting...", reset: "Reset password" },
  es: { pwMismatch: "Las contraseñas no coinciden", failed: "Error al restablecer la contraseña", invalidTitle: "Enlace inválido", invalidSub: "Este enlace de restablecimiento falta o no es válido", newLink: "Solicitar un nuevo enlace", invalidBody: "El enlace que usaste parece incompleto. Solicita un nuevo correo de restablecimiento.", title: "Nueva contraseña", subtitle: "Introduce tu nueva contraseña a continuación", newPw: "Nueva contraseña", confirm: "Confirmar contraseña", resetting: "Restableciendo...", reset: "Restablecer contraseña" },
};

export default function ResetPassword() {
  const { lang } = useLanguage();
  const T = RP[lang] || RP.fr;
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError(T.pwMismatch); return; }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) { setError(err.message || T.failed); }
    finally { setLoading(false); }
  };

  if (!resetToken) {
    return (
      <AuthLayout icon={AlertTriangle} title={T.invalidTitle} subtitle={T.invalidSub}
        footer={<Link to="/forgot-password" className="text-primary font-medium hover:underline">{T.newLink}</Link>}>
        <p className="text-sm text-foreground text-center">{T.invalidBody}</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={Lock} title={T.title} subtitle={T.subtitle}>
      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{T.newPw}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="password" type="password" autoComplete="new-password" autoFocus placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 h-12" required />
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
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{T.resetting}</> : T.reset}
        </Button>
      </form>
    </AuthLayout>
  );
}
