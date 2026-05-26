import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, Building2, Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const openWhatsApp = (telephone) => {
  const num = telephone.replace(/[^0-9]/g, "");
  // Try native app first, fallback to web
  const appUrl = `whatsapp://send?phone=${num}`;
  const webUrl = `https://wa.me/${num}`;
  const a = document.createElement("a");
  a.href = appUrl;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // After short delay, if page is still visible, open web fallback
  setTimeout(() => {
    if (!document.hidden) window.open(webUrl, "_blank");
  }, 1200);
};

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
                  <div className="flex items-center gap-1.5 flex-shrink-0">
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
                      <button
                        onClick={() => openWhatsApp(contact.telephone)}
                        className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
                        title={`WhatsApp: ${contact.telephone}`}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#25D366">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>
                    )}
                    {contact.lien && (
                      <a
                        href={contact.lien.startsWith("http") ? contact.lien : `https://${contact.lien}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title={contact.lien}
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