import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X, Filter } from "lucide-react";

export default function AdvancedFilters({ onFiltersChange }) {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    poste: "all",
    ageMin: "",
    ageMax: "",
    club: "",
    budgetMax: "",
    contratExpire: "all",
    nationalite: "",
    piedFort: "all"
  });

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      poste: "all",
      ageMin: "",
      ageMax: "",
      club: "",
      budgetMax: "",
      contratExpire: "all",
      nationalite: "",
      piedFort: "all"
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    value !== "" && value !== "all"
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Recherche avancée
          </CardTitle>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Réduire" : "Plus de filtres"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher un joueur..."
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={filters.poste} onValueChange={(value) => handleChange("poste", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les positions</SelectItem>
              <SelectItem value="Gardien">Gardien</SelectItem>
              <SelectItem value="Défenseur central">Défenseur central</SelectItem>
              <SelectItem value="Latéral droit">Latéral droit</SelectItem>
              <SelectItem value="Latéral gauche">Latéral gauche</SelectItem>
              <SelectItem value="Milieu défensif">Milieu défensif</SelectItem>
              <SelectItem value="Milieu central">Milieu central</SelectItem>
              <SelectItem value="Milieu offensif">Milieu offensif</SelectItem>
              <SelectItem value="Ailier droit">Ailier droit</SelectItem>
              <SelectItem value="Ailier gauche">Ailier gauche</SelectItem>
              <SelectItem value="Attaquant">Attaquant</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Budget max (M€)"
            type="number"
            value={filters.budgetMax}
            onChange={(e) => handleChange("budgetMax", e.target.value)}
          />

          <Select value={filters.contratExpire} onValueChange={(value) => handleChange("contratExpire", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Fin de contrat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="6months">Dans 6 mois</SelectItem>
              <SelectItem value="1year">Dans 1 an</SelectItem>
              <SelectItem value="expired">Expiré</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {expanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Âge min"
                type="number"
                value={filters.ageMin}
                onChange={(e) => handleChange("ageMin", e.target.value)}
              />
              <Input
                placeholder="Âge max"
                type="number"
                value={filters.ageMax}
                onChange={(e) => handleChange("ageMax", e.target.value)}
              />
            </div>

            <Input
              placeholder="Nationalité"
              value={filters.nationalite}
              onChange={(e) => handleChange("nationalite", e.target.value)}
            />

            <Select value={filters.piedFort} onValueChange={(value) => handleChange("piedFort", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pied fort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Droit">Droit</SelectItem>
                <SelectItem value="Gauche">Gauche</SelectItem>
                <SelectItem value="Les deux">Les deux</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Club actuel"
              value={filters.club}
              onChange={(e) => handleChange("club", e.target.value)}
              className="md:col-span-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}