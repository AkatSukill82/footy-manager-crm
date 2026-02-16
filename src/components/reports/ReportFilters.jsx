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
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Date de début</Label>
            <Input
              type="date"
              value={filters.dateDebut}
              onChange={(e) => handleChange("dateDebut", e.target.value)}
            />
          </div>
          <div>
            <Label>Date de fin</Label>
            <Input
              type="date"
              value={filters.dateFin}
              onChange={(e) => handleChange("dateFin", e.target.value)}
            />
          </div>
          <div>
            <Label>Période prédéfinie</Label>
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
              <SelectTrigger>
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
      </CardContent>
    </Card>
  );
}