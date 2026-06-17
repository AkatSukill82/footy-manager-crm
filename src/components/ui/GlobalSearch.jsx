import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Search, Users, Building2, Phone, X, ArrowRight } from "lucide-react";

const POSTE_ABBR = {
  "Gardien": "GK", "Défenseur central": "DC", "Latéral droit": "LD",
  "Latéral gauche": "LG", "Milieu défensif": "MD", "Milieu central": "MC",
  "Milieu offensif": "MO", "Ailier droit": "AD", "Ailier gauche": "AG", "Attaquant": "ATT",
};

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-slate-200 text-slate-900 rounded px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function GlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Lit le cache une seule fois à l'ouverture — pas à chaque frappe
  const { allPlayers, allClubs, allContacts } = useMemo(() => {
    const readFirst = (key) => {
      const cache = qc.getQueriesData({ queryKey: [key] });
      for (const [, data] of cache) {
        if (Array.isArray(data) && data.length > 0) return data;
      }
      return [];
    };
    return {
      allPlayers:  readFirst("players"),
      allClubs:    readFirst("clubs"),
      allContacts: readFirst("contacts"),
    };
  }, [open, qc]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = query.trim().toLowerCase();

  const results = q.length < 2 ? [] : [
    ...allPlayers
      .filter(p => p.nom?.toLowerCase().includes(q) || p.club_actuel?.toLowerCase().includes(q))
      .slice(0, 5)
      .map(p => ({
        type: "player", id: p.id,
        title: p.nom,
        sub: [POSTE_ABBR[p.poste] || p.poste, p.club_actuel].filter(Boolean).join(" · "),
        icon: Users,
        iconColor: "text-slate-600 bg-slate-100",
        url: createPageUrl("PlayerDetail") + "?id=" + p.id,
      })),
    ...allClubs
      .filter(c => c.nom?.toLowerCase().includes(q) || c.pays?.toLowerCase().includes(q))
      .slice(0, 4)
      .map(c => ({
        type: "club", id: c.id,
        title: c.nom,
        sub: [c.pays, c.ligue].filter(Boolean).join(" · "),
        icon: Building2,
        iconColor: "text-slate-600 bg-slate-100",
        url: createPageUrl("ClubDetail") + "?id=" + c.id,
      })),
    ...allContacts
      .filter(c => c.nom?.toLowerCase().includes(q) || c.club?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({
        type: "contact", id: c.id,
        title: c.nom,
        sub: [c.poste, c.club].filter(Boolean).join(" · "),
        icon: Phone,
        iconColor: "text-slate-600 bg-slate-100",
        url: createPageUrl("ClubContacts"),
      })),
  ];

  const go = useCallback((item) => {
    navigate(item.url);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      if (e.key === "Enter" && results[cursor]) { go(results[cursor]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, cursor, go, onClose]);

  useEffect(() => { setCursor(0); }, [query]);

  if (!open) return null;

  const LABELS = { player: "Joueurs", club: "Clubs", contact: "Contacts" };
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un joueur, club, contact…"
            className="flex-1 text-base text-slate-900 placeholder-slate-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-300 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {q.length < 2 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              Tapez au moins 2 caractères pour rechercher
            </div>
          )}

          {q.length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              Aucun résultat pour « {query} »
            </div>
          )}

          {Object.entries(grouped).map(([type, items]) => {
            let globalIdx = results.indexOf(items[0]);
            return (
              <div key={type}>
                <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                  {LABELS[type]}
                </div>
                {items.map((item, i) => {
                  const idx = globalIdx + i;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => go(item)}
                      onMouseEnter={() => setCursor(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        cursor === idx ? "bg-slate-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {highlight(item.title, query)}
                        </div>
                        {item.sub && (
                          <div className="text-xs text-slate-400 truncate">{item.sub}</div>
                        )}
                      </div>
                      {cursor === idx && <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400">
          <span><kbd className="font-mono bg-white border border-slate-200 px-1 rounded">↑↓</kbd> naviguer</span>
          <span><kbd className="font-mono bg-white border border-slate-200 px-1 rounded">↵</kbd> ouvrir</span>
          <span><kbd className="font-mono bg-white border border-slate-200 px-1 rounded">esc</kbd> fermer</span>
        </div>
      </div>
    </div>
  );
}
