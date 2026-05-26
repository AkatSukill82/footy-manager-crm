import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, UserPlus, Trash2, Crown, Check, Copy } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export default function OrganizationPage() {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [newOrgName, setNewOrgName] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  // Find current user's org
  const myUserRecord = allUsers.find(u => u.email === currentUser?.email);
  const myOrgId = myUserRecord?.organization_id;

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => base44.entities.Organization.list(),
  });

  const myOrg = organizations.find(o => o.id === myOrgId);

  // Members = users with same org_id
  const members = myOrgId
    ? allUsers.filter(u => u.organization_id === myOrgId)
    : [];

  const isAdmin = currentUser?.role === "admin";

  // Create org mutation
  const createOrgMutation = useMutation({
    mutationFn: async (nom) => {
      const org = await base44.entities.Organization.create({ nom });
      // Update current user's organization_id
      await base44.auth.updateMe({ organization_id: org.id });
      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setNewOrgName("");
    },
  });

  // Invite (add) member by email
  const inviteMutation = useMutation({
    mutationFn: async (email) => {
      const target = allUsers.find(u => u.email === email);
      if (!target) throw new Error("Utilisateur introuvable. Il doit d'abord avoir un compte.");
      await base44.entities.User.update(target.id, { organization_id: myOrgId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      setInviteEmail("");
    },
  });

  // Remove member
  const removeMemberMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.update(userId, { organization_id: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });

  // Leave / dissolve org
  const leaveOrgMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({ organization_id: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate(inviteEmail.trim());
  };

  const handleCreate = () => {
    if (!newOrgName.trim()) return;
    createOrgMutation.mutate(newOrgName.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Organisation</h1>
            <p className="text-slate-500 text-sm">Gérez votre groupe et partagez vos données</p>
          </div>
        </div>

        {!myOrg ? (
          /* No org yet */
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Créer une organisation</CardTitle>
              <p className="text-xs text-slate-400 mt-1">
                Créez un groupe pour partager votre base de données avec vos collègues.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Nom de l'organisation (ex: Elite Scout Agency)"
                value={newOrgName}
                onChange={e => setNewOrgName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
              />
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleCreate}
                disabled={!newOrgName.trim() || createOrgMutation.isPending}
              >
                <Building2 className="w-4 h-4 mr-2" />
                {createOrgMutation.isPending ? "Création..." : "Créer l'organisation"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Org info */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500" />
                    {myOrg.nom}
                  </CardTitle>
                  <Badge className="bg-blue-100 text-blue-700">
                    {members.length} membre{members.length > 1 ? "s" : ""}
                  </Badge>
                </div>
                {myOrg.description && (
                  <p className="text-xs text-slate-400 mt-1">{myOrg.description}</p>
                )}
              </CardHeader>
            </Card>

            {/* Members list */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  Membres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-700 text-xs font-bold">
                          {member.email?.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{member.full_name || member.email}</p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                        {member.poste && (
                          <p className="text-xs text-blue-500">{member.poste}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.email === currentUser?.email && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Crown className="w-3 h-3" /> Vous
                        </Badge>
                      )}
                      {isAdmin && member.email !== currentUser?.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600"
                          onClick={() => removeMemberMutation.mutate(member.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Invite member (admin only) */}
            {isAdmin && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-green-500" />
                    Inviter un membre
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-1">
                    L'utilisateur doit déjà avoir un compte sur FDM.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {inviteMutation.isError && (
                    <p className="text-sm text-red-500">{inviteMutation.error?.message}</p>
                  )}
                  {inviteMutation.isSuccess && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Membre ajouté avec succès !
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@exemple.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleInvite()}
                    />
                    <Button
                      onClick={handleInvite}
                      disabled={!inviteEmail.trim() || inviteMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data sharing info */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <p className="text-sm text-blue-700 flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Les membres de <strong>{myOrg.nom}</strong> partagent leur base de données (joueurs, clubs, transferts) en lecture et écriture.
                </p>
              </CardContent>
            </Card>

            {/* Leave org */}
            <div className="text-right">
              <Button
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 text-sm"
                onClick={() => {
                  if (confirm("Quitter l'organisation ? Vous n'aurez plus accès aux données partagées.")) {
                    leaveOrgMutation.mutate();
                  }
                }}
              >
                Quitter l'organisation
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}