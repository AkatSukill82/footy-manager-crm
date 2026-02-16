import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReportFilters({ filters, onFiltersChange }) {
  const handleChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-slate-700 font-medium">Date de début</Label>
          <Input
            type="date"
            value={filters.dateDebut}
            onChange={(e) => handleChange("dateDebut", e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label className="text-slate-700 font-medium">Date de fin</Label>
          <Input
            type="date"
            value={filters.dateFin}
            onChange={(e) => handleChange("dateFin", e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label className="text-slate-700 font-medium">Période</Label>
          <Select 
            value={filters.periode} 
            onValueChange={(value) => {
              const now = new Date();
              let dateDebut = "";
              
              if (value === "mois") {
                dateDebut = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
              } else if (value === "trimestre") {
                const quarter = Math.floor(now.getMonth() / 3);
                dateDebut = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
              } else if (value === "annee") {
                dateDebut = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
              } else if (value === "tout") {
                dateDebut = "";
              }
              
              handleChange("periode", value);
              handleChange("dateDebut", dateDebut);
              handleChange("dateFin", now.toISOString().split('T')[0]);
            }}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Choisir..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mois">Ce mois</SelectItem>
              <SelectItem value="trimestre">Ce trimestre</SelectItem>
              <SelectItem value="annee">Cette année</SelectItem>
              <SelectItem value="tout">Toute la période</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}