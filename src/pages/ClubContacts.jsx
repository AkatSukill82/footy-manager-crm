import React, { useState } from "react";
import { withOrg } from "../lib/org";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Mail, Building2, Trash2, ExternalLink,
  Plus, Users, Globe, Phone, ChevronDown, X, Filter, AlertCircle,
  Sparkles, Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useLanguage } from "../lib/LanguageContext";

const CC = {
  fr: { editContact: "Modifier le contact", newContact: "Nouveau contact", prefillLinkedin: "Préremplir depuis LinkedIn", prefillHint1: "Collez l'URL du profil LinkedIn ", and: "et/ou", prefillHint2: " le contenu du profil copié-collé. L'IA remplit automatiquement nom, poste, club, pays… Ajoutez ensuite le GSM et l'email à la main.", extracting: "Extraction…", prefill: "Préremplir", clear: "Effacer", prefilled: "Champs préremplis — vérifiez puis complétez", fullName: "Nom complet *", club: "Club", poste: "Poste / Titre", pays: "Pays", nat: "Nationalité", email: "Email", tel: "Téléphone", whatsapp: "WhatsApp", externalLink: "Lien externe", agent: "Agent", agence: "Agence", ddn: "Date de naissance", contractEnd: "Fin de contrat", cancel: "Annuler", save: "Enregistrer", add: "Ajouter", phName: "ex: Marco Rossi", phClub: "ex: AC Milan", phPoste: "ex: Directeur sportif…", phPays: "ex: Italie", phNat: "ex: Italienne", phExt: "Transfermarkt, site…", phAgent: "Nom de l'agent", phAgence: "Nom de l'agence", errCreate: "Erreur lors de la création", errUpdate: "Erreur lors de la mise à jour", errDelete: "Erreur lors de la suppression", title: "Contacts clubs", subtitle: "Dirigeants, entraîneurs, directeurs sportifs, agents importés", contacts: "Contacts", clubsCovered: "Clubs couverts", withWhatsapp: "Avec WhatsApp", searchPh: "Rechercher nom, club, poste, email…", filters: "Filtres", allCountries: "Tous les pays", allPostes: "Tous les postes", reset: "Réinitialiser", results: (n, tot) => `${n} résultat${n !== 1 ? "s" : ""} sur ${tot}`, noContact: "Aucun contact trouvé", tryFilters: "Essayez d'autres filtres ou termes de recherche", addManual: "Ajoutez un contact manuellement ou importez un fichier Excel", addContact: "Ajouter un contact" },
  en: { editContact: "Edit contact", newContact: "New contact", prefillLinkedin: "Prefill from LinkedIn", prefillHint1: "Paste the LinkedIn profile URL ", and: "and/or", prefillHint2: " the copied profile content. The AI auto-fills name, role, club, country… Then add the phone and email manually.", extracting: "Extracting…", prefill: "Prefill", clear: "Clear", prefilled: "Fields prefilled — check then complete", fullName: "Full name *", club: "Club", poste: "Role / Title", pays: "Country", nat: "Nationality", email: "Email", tel: "Phone", whatsapp: "WhatsApp", externalLink: "External link", agent: "Agent", agence: "Agency", ddn: "Date of birth", contractEnd: "Contract end", cancel: "Cancel", save: "Save", add: "Add", phName: "e.g. Marco Rossi", phClub: "e.g. AC Milan", phPoste: "e.g. Sporting director…", phPays: "e.g. Italy", phNat: "e.g. Italian", phExt: "Transfermarkt, website…", phAgent: "Agent's name", phAgence: "Agency name", errCreate: "Error creating", errUpdate: "Error updating", errDelete: "Error deleting", title: "Club contacts", subtitle: "Executives, coaches, sporting directors, agents imported", contacts: "Contacts", clubsCovered: "Clubs covered", withWhatsapp: "With WhatsApp", searchPh: "Search name, club, role, email…", filters: "Filters", allCountries: "All countries", allPostes: "All roles", reset: "Reset", results: (n, tot) => `${n} result${n !== 1 ? "s" : ""} of ${tot}`, noContact: "No contact found", tryFilters: "Try other filters or search terms", addManual: "Add a contact manually or import an Excel file", addContact: "Add a contact" },
  es: { editContact: "Editar contacto", newContact: "Nuevo contacto", prefillLinkedin: "Rellenar desde LinkedIn", prefillHint1: "Pega la URL del perfil de LinkedIn ", and: "y/o", prefillHint2: " el contenido del perfil copiado. La IA rellena automáticamente nombre, cargo, club, país… Luego añade el móvil y el email a mano.", extracting: "Extrayendo…", prefill: "Rellenar", clear: "Borrar", prefilled: "Campos rellenados — verifica y completa", fullName: "Nombre completo *", club: "Club", poste: "Cargo / Título", pays: "País", nat: "Nacionalidad", email: "Email", tel: "Teléfono", whatsapp: "WhatsApp", externalLink: "Enlace externo", agent: "Agente", agence: "Agencia", ddn: "Fecha de nacimiento", contractEnd: "Fin de contrato", cancel: "Cancelar", save: "Guardar", add: "Añadir", phName: "ej: Marco Rossi", phClub: "ej: AC Milan", phPoste: "ej: Director deportivo…", phPays: "ej: Italia", phNat: "ej: Italiana", phExt: "Transfermarkt, web…", phAgent: "Nombre del agente", phAgence: "Nombre de la agencia", errCreate: "Error al crear", errUpdate: "Error al actualizar", errDelete: "Error al eliminar", title: "Contactos de clubes", subtitle: "Directivos, entrenadores, directores deportivos, agentes importados", contacts: "Contactos", clubsCovered: "Clubes cubiertos", withWhatsapp: "Con WhatsApp", searchPh: "Buscar nombre, club, cargo, email…", filters: "Filtros", allCountries: "Todos los países", allPostes: "Todos los cargos", reset: "Restablecer", results: (n, tot) => `${n} resultado${n !== 1 ? "s" : ""} de ${tot}`, noContact: "Ningún contacto encontrado", tryFilters: "Prueba otros filtros o términos de búsqueda", addManual: "Añade un contacto manualmente o importa un archivo Excel", addContact: "Añadir un contacto" },
};

// ── helpers ──────────────────────────────────────────────────────────────────
const openWhatsApp = (telephone) => {
  const num = telephone.replace(/[^0-9+]/g, "");
  const webUrl = `https://wa.me/${num}`;
  window.open(webUrl, "_blank");
};

const initials = (nom) =>
  (nom || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const POSTE_COLORS = {
  "CEO": "bg-purple-100 text-purple-700 border-purple-200",
  "Directeur sportif": "bg-blue-100 text-blue-700 border-blue-200",
  "Director of Football": "bg-blue-100 text-blue-700 border-blue-200",
  "Head Coach": "bg-green-100 text-green-700 border-green-200",
  "Entraîneur": "bg-green-100 text-green-700 border-green-200",
  "Agent": "bg-orange-100 text-orange-700 border-orange-200",
  "Scout": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Président": "bg-red-100 text-red-700 border-red-200",
};

const posteColor = (poste) => {
  if (!poste) return "bg-slate-100 text-slate-600 border-slate-200";
  for (const [key, cls] of Object.entries(POSTE_COLORS)) {
    if (poste.toLowerCase().includes(key.toLowerCase())) return cls;
  }
  return "bg-orange-100 text-orange-700 border-orange-200";
};

const avatarColor = (nom) => {
  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
    "bg-pink-500", "bg-teal-500", "bg-red-500", "bg-indigo-500",
  ];
  const idx = (nom?.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
};

// ── Empty form ────────────────────────────────────────────────────────────────
const EMPTY = {
  nom: "", club: "", pays: "", nationalite: "", poste: "",
  email: "", telephone: "", whatsapp: "",
  instagram: "", twitter: "", linkedin: "", lien: "",
  agent: "", agence: "", date_naissance: "", contrat_fin: "",
};

// Champs que l'IA peut extraire d'un profil LinkedIn
const LINKEDIN_SCHEMA = {
  type: "object",
  properties: {
    nom: { type: "string" },
    poste: { type: "string" },
    club: { type: "string" },
    pays: { type: "string" },
    nationalite: { type: "string" },
    linkedin: { type: "string" },
    email: { type: "string" },
    telephone: { type: "string" },
    instagram: { type: "string" },
    twitter: { type: "string" },
  },
};

// ── ContactForm modal ─────────────────────────────────────────────────────────
function ContactFormModal({ open, onClose, initial, onSave }) {
  const { lang } = useLanguage();
  const T = CC[lang] || CC.fr;
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Pré-remplissage IA depuis un profil LinkedIn (URL et/ou texte copié)
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiDone, setAiDone] = useState(false);

  const handlePrefill = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiDone(false);
    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu reçois le profil LinkedIn d'une personne (une URL LinkedIn et/ou le texte du profil copié-collé). Extrais les informations de contact de façon structurée.

RÈGLES :
- "nom" : prénom + nom complet de la personne.
- "poste" : intitulé du poste ACTUEL (ex: Directeur sportif, Head Coach, CEO, Agent, Scout...). Traduis en français si possible.
- "club" : club / entreprise / organisation ACTUELLE de la personne.
- "pays" : pays où la personne ou le club est basé.
- "nationalite" : nationalité de la personne si déductible (sinon null).
- "linkedin" : l'URL complète du profil LinkedIn si présente.
- "email" / "telephone" : uniquement si explicitement présents dans le texte, sinon null.
- "instagram" / "twitter" : uniquement si présents, sinon null.
- Si une donnée est inconnue ou incertaine, mets null. N'invente jamais d'email ou de téléphone.

PROFIL LINKEDIN :
${aiText.trim()}`,
        add_context_from_internet: true,
        model: "gemini_3_1_pro",
        response_json_schema: LINKEDIN_SCHEMA,
      });

      // Récupère l'URL LinkedIn directement depuis le texte collé si l'IA l'a manquée
      const urlMatch = aiText.match(/https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/[^\s"'<>]+/i);

      setForm((f) => {
        const next = { ...f };
        const fill = (k, v) => {
          // ne remplit que les champs encore vides → n'écrase pas la saisie manuelle
          if (v != null && String(v).trim() && !String(next[k] || "").trim()) {
            next[k] = String(v).trim();
          }
        };
        if (data) Object.keys(LINKEDIN_SCHEMA.properties).forEach((k) => fill(k, data[k]));
        if (urlMatch) fill("linkedin", urlMatch[0]);
        return next;
      });
      setAiDone(true);
    } catch (err) {
      setAiError(err.message || "L'extraction a échoué. Réessayez ou remplissez manuellement.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    if (!form.nom.trim()) return;
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? T.editContact : T.newContact}</DialogTitle>
        </DialogHeader>

        {/* ── Pré-remplissage IA depuis LinkedIn ── */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="flex items-center gap-2 w-full text-left text-sm font-medium text-blue-800"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            {T.prefillLinkedin}
            <ChevronDown className={`w-4 h-4 ml-auto text-blue-500 transition-transform ${aiOpen ? "rotate-180" : ""}`} />
          </button>

          {aiOpen && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-blue-700/80 leading-relaxed">
                {T.prefillHint1}<span className="font-medium">{T.and}</span>{T.prefillHint2}
              </p>
              <textarea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                rows={4}
                placeholder={"https://linkedin.com/in/...\n\nMarco Rossi\nDirector of Football chez AC Milan\nMilan, Italie"}
                className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrefill}
                  disabled={aiLoading || !aiText.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  {aiLoading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {T.extracting}</>
                    : <><Sparkles className="w-3.5 h-3.5" /> {T.prefill}</>}
                </Button>
                {aiText && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setAiText(""); setAiDone(false); setAiError(null); }} className="text-slate-500">
                    {T.clear}
                  </Button>
                )}
                {aiDone && !aiError && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {T.prefilled}
                  </span>
                )}
              </div>
              {aiError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2">
            <Label className="text-xs text-slate-500 mb-1 block">{T.fullName}</Label>
            <Input placeholder={T.phName} value={form.nom} onChange={set("nom")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">{T.club}</Label>
            <Input placeholder={T.phClub} value={form.club} onChange={set("club")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">{T.poste}</Label>
            <Input placeholder={T.phPoste} value={form.poste} onChange={set("poste")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">{T.pays}</Label>
            <Input placeholder={T.phPays} value={form.pays} onChange={set("pays")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">{T.nat}</Label>
            <Input placeholder={T.phNat} value={form.nationalite} onChange={set("nationalite")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">{T.email}</Label>
            <Input placeholder="email@club.com" value={form.email} onChange={set("email")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">{T.tel}</Label>
            <Input placeholder="+33 6 00 00 00 00" value={form.telephone} onChange={set("telephone")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">{T.whatsapp}</Label>
            <Input placeholder="+33 6 00 00 00 00" value={form.whatsapp} onChange={set("whatsapp")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Instagram</Label>
            <Input placeholder="@handle" value={form.instagram} onChange={set("instagram")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Twitter / X</Label>
            <Input placeholder="@handle" value={form.twitter} onChange={set("twitter")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">LinkedIn</Label>
            <Input placeholder="linkedin.com/in/…" value={form.linkedin} onChange={set("linkedin")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">{T.externalLink}</Label>
            <Input placeholder={T.phExt} value={form.lien} onChange={set("lien")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">{T.agent}</Label>
            <Input placeholder={T.phAgent} value={form.agent} onChange={set("agent")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">{T.agence}</Label>
            <Input placeholder={T.phAgence} value={form.agence} onChange={set("agence")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">{T.ddn}</Label>
            <Input type="date" value={form.date_naissance} onChange={set("date_naissance")} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">{T.contractEnd}</Label>
            <Input type="date" value={form.contrat_fin} onChange={set("contrat_fin")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{T.cancel}</Button>
          <Button onClick={handleSave} disabled={!form.nom.trim()}>
            {initial?.id ? T.save : T.add}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── ContactCard ───────────────────────────────────────────────────────────────
function ContactCard({ contact, onEdit, onDelete }) {
  return (
    <Card className="hover:shadow-md transition-all border-slate-200 group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${avatarColor(contact.nom)}`}>
            <span className="text-white font-bold text-sm">{initials(contact.nom)}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <button
                  onClick={() => onEdit(contact)}
                  className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left truncate block max-w-full"
                >
                  {contact.nom}
                </button>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {contact.poste && (
                    <Badge className={`text-[10px] border font-medium ${posteColor(contact.poste)}`}>
                      {contact.poste}
                    </Badge>
                  )}
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {contact.club || "—"}
                    {contact.pays && <span className="text-slate-400">· {contact.pays}</span>}
                  </span>
                </div>

                {/* Contact details */}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                  {contact.email && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {contact.email}
                    </span>
                  )}
                  {(contact.telephone || contact.whatsapp) && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {contact.telephone || contact.whatsapp}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors" title={contact.email}>
                    <Mail className="w-4 h-4" />
                  </a>
                )}
                {contact.linkedin && (
                  <a
                    href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`}
                    target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    title="LinkedIn"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A66C2">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
                {(contact.telephone || contact.whatsapp) && (
                  <button onClick={() => openWhatsApp(contact.telephone || contact.whatsapp)} className="p-1.5 rounded-lg hover:bg-green-50 transition-colors" title={`WhatsApp: ${contact.telephone || contact.whatsapp}`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </button>
                )}
                {contact.lien && (
                  <a href={contact.lien.startsWith("http") ? contact.lien : `https://${contact.lien}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title={contact.lien}>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => onDelete(contact.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ClubContactsPage() {
  const { lang } = useLanguage();
  const T = CC[lang] || CC.fr;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterPays, setFilterPays] = useState("");
  const [filterPoste, setFilterPoste] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [mutationError, setMutationError] = useState(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["club-contacts"],
    queryFn: () => base44.entities.ClubContact.list("-created_date", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClubContact.create(withOrg(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["club-contacts"] }),
    onError: (err) => setMutationError(err.message || T.errCreate),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ClubContact.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["club-contacts"] }),
    onError: (err) => setMutationError(err.message || T.errUpdate),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClubContact.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["club-contacts"] }),
    onError: (err) => setMutationError(err.message || T.errDelete),
  });

  const handleSave = (form) => {
    if (editContact?.id) {
      updateMutation.mutate({ id: editContact.id, data: form });
    } else {
      createMutation.mutate(form);
    }
    setModalOpen(false);
    setEditContact(null);
  };

  const handleEdit = (contact) => {
    setEditContact(contact);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditContact(null);
    setModalOpen(true);
  };

  // Unique values for filters
  const allPays = [...new Set(contacts.map((c) => c.pays).filter(Boolean))].sort();
  const allPostes = [...new Set(contacts.map((c) => c.poste).filter(Boolean))].sort();

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.nom?.toLowerCase().includes(q) ||
      c.club?.toLowerCase().includes(q) ||
      c.poste?.toLowerCase().includes(q) ||
      c.pays?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q);
    const matchPays = !filterPays || c.pays === filterPays;
    const matchPoste = !filterPoste || c.poste === filterPoste;
    return matchSearch && matchPays && matchPoste;
  });

  // Stats
  const nbClubs = new Set(contacts.map((c) => c.club).filter(Boolean)).size;
  const nbPays = new Set(contacts.map((c) => c.pays).filter(Boolean)).size;
  const nbAvecLinkedIn = contacts.filter((c) => c.linkedin).length;
  const nbAvecTel = contacts.filter((c) => c.telephone).length;

  const activeFilters = [filterPays, filterPoste].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50">
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {mutationError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{mutationError}</span>
          <button onClick={() => setMutationError(null)} className="hover:text-red-900"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{T.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{T.subtitle}</p>
        </div>
        <Button onClick={handleNew} className="bg-slate-900 hover:bg-slate-800 text-white gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" />
          {T.add}
        </Button>
      </div>

      {/* Stats bar */}
      {contacts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: T.contacts, value: contacts.length, icon: Users },
            { label: T.clubsCovered, value: nbClubs, icon: Building2 },
            { label: T.pays, value: nbPays, icon: Globe },
            { label: T.withWhatsapp, value: nbAvecTel, icon: Phone },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</span>
                <Icon className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search + filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={T.searchPh}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters((v) => !v)}
          className={`gap-2 ${activeFilters ? "border-orange-400 text-orange-600 bg-orange-50" : ""}`}
        >
          <Filter className="w-4 h-4" />
          {T.filters}
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </Button>
      </div>

      {/* Filter dropdowns */}
      {showFilters && (
        <div className="flex gap-3 flex-wrap p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-medium">{T.pays}</label>
            <select
              value={filterPays}
              onChange={(e) => setFilterPays(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="">{T.allCountries}</option>
              {allPays.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500 font-medium">{T.poste}</label>
            <select
              value={filterPoste}
              onChange={(e) => setFilterPoste(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="">{T.allPostes}</option>
              {allPostes.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {activeFilters > 0 && (
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={() => { setFilterPays(""); setFilterPoste(""); }} className="text-slate-500 gap-1">
                <X className="w-3.5 h-3.5" /> {T.reset}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      {(search || activeFilters > 0) && (
        <p className="text-sm text-slate-500">
          {T.results(filtered.length, contacts.length)}
        </p>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-slate-600 font-semibold text-lg">{T.noContact}</p>
          <p className="text-slate-400 text-sm mt-1 mb-5">
            {search || activeFilters ? T.tryFilters : T.addManual}
          </p>
          <Button onClick={handleNew} className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
            <Plus className="w-4 h-4" /> {T.addContact}
          </Button>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {filtered.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Modal — key forces remount so form state resets for each contact */}
      <ContactFormModal
        key={editContact?.id ?? "new"}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditContact(null); }}
        initial={editContact}
        onSave={handleSave}
      />
    </div>
    </div>
  );
}