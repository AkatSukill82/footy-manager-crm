import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44, invokeFn } from "@/api/base44Client";
import { useCurrentUser } from "../lib/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Crown, Copy, Check, LogOut, Plus, KeyRound, RefreshCw, Loader2, AlertCircle, UserPlus, Mail, Send, Share2 } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import { sendEmail } from "../lib/sendEmail";

const minutesLeft = (iso) => {
  if (!iso) return null;
  return Math.floor((new Date(iso).getTime() - Date.now()) / 60000);
};

export default function OrganizationPage() {
  const { lang } = useLanguage();
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const orgId = currentUser?.organization_id || null;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(null);   // create | join | generate | leave
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [shareAsk, setShareAsk] = useState(false);   // popup post-inscription
  const [sharing, setSharing] = useState(false);

  // Le groupe lui-même : requête DIRECTE (la RLS autorise un membre à lire son
  // propre groupe). Source robuste, indépendante de la fonction serveur.
  const { data: org = null } = useQuery({
    queryKey: ["myGroup", orgId],
    queryFn: async () => (await base44.entities.Organization.filter({ id: orgId }))[0] || null,
    enabled: !!orgId,
  });
  // La LISTE des membres via la fonction serveur (rôle service) : visible par
  // tous (User.list est admin-only). Best-effort — n'empêche pas l'affichage.
  const { data: groupData } = useQuery({
    queryKey: ["groupData", orgId],
    queryFn: () => invokeFn("groupManager", { action: "getMembers" }),
    enabled: !!orgId,
  });
  const isChef = org && currentUser && org.created_by_id === currentUser.id;
  const isCEO = currentUser?.role_metier === "CEO";
  // Repli : si la fonction serveur n'a pas (encore) renvoyé la liste, on affiche
  // au moins l'utilisateur courant pour ne jamais montrer une liste vide.
  const members = (groupData?.members && groupData.members.length)
    ? groupData.members
    : (currentUser ? [{ id: currentUser.id, full_name: currentUser.full_name, email: currentUser.email, isChef: !!isChef }] : []);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["currentUser"] });
    qc.invalidateQueries({ queryKey: ["groupData"] });
    qc.invalidateQueries({ queryKey: ["players"] });
    qc.invalidateQueries({ queryKey: ["clubs"] });
  };

  const run = async (action, payload, key) => {
    setBusy(key); setError(null);
    try {
      const res = await invokeFn("groupManager", { action, ...payload });
      if (!res?.ok) throw new Error(res?.error || "Erreur");
      refresh();
      setName(""); setCode("");
      return res;
    } catch (err) {
      setError(err?.message || "Erreur");
    } finally {
      setBusy(null);
    }
  };

  // Rejoindre : si ça réussit, on propose (popup) de partager ses données.
  const handleJoin = async () => {
    const res = await run("joinGroup", { code }, "join");
    if (res?.ok) setShareAsk(true);
  };

  // L'utilisateur ACCEPTE de partager ses données existantes avec le groupe.
  const acceptShare = async () => {
    setSharing(true);
    await invokeFn("groupManager", { action: "shareMyData" });
    setSharing(false); setShareAsk(false);
    refresh();
  };

  const copyCode = () => {
    if (!org?.invite_code) return;
    try { navigator.clipboard.writeText(org.invite_code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  const mins = minutesLeft(org?.invite_code_expires);
  const codeActive = org?.invite_code && mins != null && mins > 0;

  // Envoie un e-mail d'invitation custom (au nom de la marque) avec le code.
  const inviteByEmail = async () => {
    if (!inviteEmail.trim() || !org?.invite_code) return;
    setInviting(true); setError(null); setInviteSent(false);
    const inviter = currentUser?.full_name || currentUser?.email || "";
    const subject = t(lang, "session.group.mailSubject", { group: org.nom });
    const body = t(lang, "session.group.mailBody", { inviter, group: org.nom, code: org.invite_code, mins });
    const res = await sendEmail({ to: inviteEmail.trim(), subject, body });
    if (res.ok) { setInviteSent(true); setInviteEmail(""); setTimeout(() => setInviteSent(false), 3000); }
    else setError(res.error);
    setInviting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-5">

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" /> {t(lang, "session.group.title")}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{t(lang, "session.group.subtitle")}</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ── Pas encore dans un groupe ── */}
        {/* CEO : Créer + Rejoindre. Non-CEO : uniquement la case code. */}
        {!orgId && (
          <div className={isCEO ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "max-w-md mx-auto"}>
            {/* Créer un groupe : CEO uniquement */}
            {isCEO && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-600" /> {t(lang, "session.group.createTitle")}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t(lang, "session.group.createPh")} />
                  <Button onClick={() => run("createGroup", { nom: name }, "create")} disabled={!name.trim() || busy} className="w-full bg-slate-900 hover:bg-slate-700">
                    {busy === "create" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}{t(lang, "session.group.create")}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><KeyRound className="w-4 h-4 text-indigo-600" /> {t(lang, "session.group.joinTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t(lang, "session.group.joinPh")} maxLength={6} className="tracking-[0.3em] font-mono text-center uppercase" />
                <Button onClick={handleJoin} disabled={code.trim().length < 4 || busy} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {busy === "join" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}{t(lang, "session.group.join")}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Dans un groupe ── */}
        {orgId && org && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{org.nom}</CardTitle>
                  <Button onClick={() => { if (confirm(t(lang, "session.group.leaveConfirm"))) run("leaveGroup", {}, "leave"); }} disabled={busy} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                    {busy === "leave" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4 mr-1.5" /> {t(lang, "session.group.leave")}</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{t(lang, "session.group.members")} ({members.length})</p>
                <div className="space-y-1.5">
                  {members.map((m) => {
                    const chef = m.isChef;
                    const me = m.id === currentUser?.id;
                    return (
                      <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600">
                          {(m.full_name || m.email || "?").slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate">{m.full_name || m.email}{me && <span className="text-slate-400 font-normal"> ({t(lang, "session.group.you")})</span>}</p>
                          <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
                        </div>
                        {chef && <Badge className="bg-amber-100 text-amber-700 border-0 text-[11px] gap-1"><Crown className="w-3 h-3" /> {t(lang, "session.group.chef")}</Badge>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ── Code d'invitation (chef uniquement) ── */}
            {isChef && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><KeyRound className="w-4 h-4 text-indigo-600" /> {t(lang, "session.group.codeTitle")}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-500">{t(lang, "session.group.codeDesc")}</p>
                  {codeActive ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-2xl font-mono font-bold tracking-[0.3em] text-slate-900 bg-slate-100 rounded-xl px-4 py-2">{org.invite_code}</div>
                      <Button onClick={copyCode} variant="outline" size="sm">{copied ? <><Check className="w-4 h-4 mr-1.5 text-green-600" /> {t(lang, "session.group.copied")}</> : <><Copy className="w-4 h-4 mr-1.5" /> {t(lang, "session.group.copy")}</>}</Button>
                      <span className="text-xs text-slate-400">{t(lang, "session.group.expiresIn", { m: mins })}</span>
                      <Button onClick={() => run("generateCode", {}, "generate")} disabled={busy} variant="ghost" size="sm" className="text-indigo-600">
                        {busy === "generate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4 mr-1.5" /> {t(lang, "session.group.regenerate")}</>}
                      </Button>
                    </div>
                  ) : null}

                  {/* Inviter par e-mail (envoie le code par mail au nom de la marque) */}
                  {codeActive && (
                    <div className="pt-3 mt-1 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">{t(lang, "session.group.inviteByEmail")}</p>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder={t(lang, "session.group.inviteEmailPh")} className="pl-9" />
                        </div>
                        <Button onClick={inviteByEmail} disabled={inviting || !inviteEmail.trim()} className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0">
                          {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : inviteSent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                      {inviteSent && <p className="text-xs text-green-600 mt-1.5">{t(lang, "session.group.inviteSent")}</p>}
                    </div>
                  )}
                  {!codeActive && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-slate-400">{org.invite_code ? t(lang, "session.group.expired") : t(lang, "session.group.noCode")}</span>
                      <Button onClick={() => run("generateCode", {}, "generate")} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700" size="sm">
                        {busy === "generate" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}{t(lang, "session.group.generate")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Popup post-inscription : partager ses données existantes ? */}
      <Dialog open={shareAsk} onOpenChange={(o) => { if (!o && !sharing) setShareAsk(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="w-5 h-5 text-indigo-600" /> {t(lang, "session.group.shareTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">{t(lang, "session.group.shareDesc")}</p>
          <p className="text-xs text-slate-400 mt-1">{t(lang, "session.group.shareNote")}</p>
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShareAsk(false)} disabled={sharing}>{t(lang, "session.group.shareNo")}</Button>
            <Button onClick={acceptShare} disabled={sharing} className="bg-indigo-600 hover:bg-indigo-700">
              {sharing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}{t(lang, "session.group.shareYes")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
