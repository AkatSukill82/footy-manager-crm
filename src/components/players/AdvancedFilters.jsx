import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";

const POSTES = [
  "Gardien", "Défenseur central", "Latéral droit", "Latéral gauche",
  "Milieu défensif", "Milieu central", "Milieu offensif",
  "Ailier droit", "Ailier gauche", "Attaquant"
];

const EMPTY = {
  search: "", poste: "all", nationalite: "", club: "",
  valeurMin: "", valeurMax: "", ageMin: "", ageMax: "",
  piedFort: "all", contratExpire: "all",
};

export default function AdvancedFilters({ onFiltersChange, players = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState(EMPTY);

  const handle = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    onFiltersChange(next);
  };

  const clear = () => {
    setFilters(EMPTY);
    onFiltersChange(EMPTY);
  };

  // Derive unique values from player data
  const clubs = [...new Set(players.map(p => p.club_actuel).filter(Boolean))].sort();
  const nationalites = [...new Set(players.map(p => p.nationalite).filter(Boolean))].sort();

  const activeCount = Object.entries(filters).filter(([k, v]) => v !== "" && v !== "all").length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top bar — always visible */}
      <div className="flex items-center gap-3 p-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher un joueur ou un club..."
            value={filters.search}
            onChange={e => handle("search", e.target.value)}
            className="pl-9 h-9 bg-slate-50 border-slate-200"
          />
        </div>

        {/* Poste */}
        <Select value={filters.poste} onValueChange={v => handle("poste", v)}>
          <SelectTrigger className="w-44 h-9 bg-slate-50 border-slate-200 text-sm">
            <SelectValue placeholder="Poste" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les postes</SelectItem>
            {POSTES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Valeur marchande max */}
        <div className="flex items-center gap-1">
          <Input
            placeholder="Valeur min (M€)"
            type="number"
            value={filters.valeurMin}
            onChange={e => handle("valeurMin", e.target.value)}
            className="w-28 h-9 bg-slate-50 border-slate-200 text-sm"
          />
          <span className="text-slate-400 text-sm">—</span>
          <Input
            placeholder="max (M€)"
            type="number"
            value={filters.valeurMax}
            onChange={e => handle("valeurMax", e.target.value)}
            className="w-24 h-9 bg-slate-50 border-slate-200 text-sm"
          />
        </div>

        {/* Toggle more + clear */}
        <div className="flex items-center gap-2 ml-auto">
          {activeCount > 0 && (
            <button onClick={clear} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
              <X className="w-3 h-3" /> Effacer
              <Badge className="bg-red-100 text-red-700 border-0 text-[10px] px-1.5 py-0">{activeCount}</Badge>
            </button>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Filter className="w-3 h-3" />
            {expanded ? "Moins" : "Plus de filtres"}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="border-t border-slate-100 p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Nationalité */}
          <Select value={filters.nationalite || "__all__"} onValueChange={v => handle("nationalite", v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-sm">
              <SelectValue placeholder="Nationalité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Toutes nationalités</SelectItem>
              {nationalites.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Club */}
          <Select value={filters.club || "__all__"} onValueChange={v => handle("club", v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-sm">
              <SelectValue placeholder="Club actuel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous les clubs</SelectItem>
              {clubs.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Age */}
          <div className="flex items-center gap-1">
            <Input
              placeholder="Âge min"
              type="number"
              value={filters.ageMin}
              onChange={e => handle("ageMin", e.target.value)}
              className="h-9 bg-slate-50 border-slate-200 text-sm"
            />
            <span className="text-slate-400 text-sm">—</span>
            <Input
              placeholder="max"
              type="number"
              value={filters.ageMax}
              onChange={e => handle("ageMax", e.target.value)}
              className="h-9 bg-slate-50 border-slate-200 text-sm"
            />
          </div>

          {/* Pied fort */}
          <Select value={filters.piedFort} onValueChange={v => handle("piedFort", v)}>
            <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-sm">
              <SelectValue placeholder="Pied fort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Pied fort</SelectItem>
              <SelectItem value="Droit">Droit</SelectItem>
              <SelectItem value="Gauche">Gauche</SelectItem>
              <SelectItem value="Les deux">Les deux</SelectItem>
            </SelectContent>
          </Select>

          {/* Fin de contrat */}
          <Select value={filters.contratExpire} onValueChange={v => handle("contratExpire", v)}>
            <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-sm">
              <SelectValue placeholder="Fin de contrat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous contrats</SelectItem>
              <SelectItem value="6months">Expire dans 6 mois</SelectItem>
              <SelectItem value="1year">Expire dans 1 an</SelectItem>
              <SelectItem value="expired">Expiré</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}