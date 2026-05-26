import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Mail, Phone, Building2, Plus, Trash2, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ClubContactsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["club-contacts"],
    queryFn: () => base44.entities.ClubContact.list("-created_date", 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClubContact.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["club-contacts"] }),
  });

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nom?.toLowerCase().includes(q) ||
      c.club?.toLowerCase().includes(q) ||
      c.poste?.toLowerCase().includes(q) ||
      c.pays?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-orange-500" />
            Contacts clubs & agents
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {contacts.length} contact{contacts.length > 1 ? "s" : ""} importé{contacts.length > 1 ? "s" : ""} (staff, dirigeants, agents…)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Rechercher par nom, club, poste, pays…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-400">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Aucun contact trouvé</p>
          <p className="text-slate-400 text-sm mt-1">
            {search ? "Essayez un autre terme de recherche" : "Importez un fichier Excel pour voir les contacts apparaître ici"}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar initials */}
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-700 font-bold text-sm">
                        {contact.nom?.slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Name + role */}
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{contact.nom}</div>
                      {contact.poste && (
                        <Badge variant="outline" className="text-[10px] mt-0.5 border-orange-200 text-orange-700 bg-orange-50">
                          {contact.poste}
                        </Badge>
                      )}
                    </div>

                    {/* Club + pays */}
                    <div className="hidden sm:flex items-center gap-1.5 text-slate-600 text-sm min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-medium">{contact.club || "—"}</span>
                      {contact.pays && <span className="text-slate-400 text-xs">({contact.pays})</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                        title={contact.email}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {contact.telephone && (
                      <a
                        href={`tel:${contact.telephone}`}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 transition-colors"
                        title={contact.telephone}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {contact.lien && (
                      <a
                        href={contact.lien.startsWith("http") ? contact.lien : `https://${contact.lien}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-500 transition-colors"
                        title="Ouvrir le profil"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(contact.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mobile club row */}
                <div className="sm:hidden mt-1.5 flex items-center gap-1.5 text-slate-500 text-xs">
                  <Building2 className="w-3 h-3" />
                  {contact.club || "—"}
                  {contact.pays && <span className="text-slate-400">· {contact.pays}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}