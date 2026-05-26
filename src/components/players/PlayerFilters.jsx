import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function PlayerFilters({ filters, onFiltersChange }) {
  const { lang } = useLanguage();
  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-500" />
        <h3 className="font-semibold">{t(lang,'filters.title')}</h3>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder={t(lang,'filters.searchPlayer')}
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select
          value={filters.poste}
          onValueChange={(value) => onFiltersChange({ ...filters, poste: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t(lang,'filters.allPositions')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t(lang,'filters.allPositions')}</SelectItem>
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

        <Select
          value={filters.ageRange}
          onValueChange={(value) => onFiltersChange({ ...filters, ageRange: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t(lang,'filters.allAges')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t(lang,'filters.allAges')}</SelectItem>
            <SelectItem value="18-21">{t(lang,'filters.age18')}</SelectItem>
            <SelectItem value="22-25">{t(lang,'filters.age22')}</SelectItem>
            <SelectItem value="26-30">{t(lang,'filters.age26')}</SelectItem>
            <SelectItem value="31+">{t(lang,'filters.age31')}</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder={t(lang,'filters.clubPlh')}
          value={filters.club}
          onChange={(e) => onFiltersChange({ ...filters, club: e.target.value })}
        />
      </div>
    </div>
  );
}