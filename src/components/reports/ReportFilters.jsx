import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

export default function ReportFilters({ filters, onFiltersChange }) {
  const { lang } = useLanguage();

  const handleChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-slate-700 font-medium">{t(lang, 'reports.dateFrom')}</Label>
          <Input
            type="date"
            value={filters.dateDebut}
            onChange={(e) => handleChange("dateDebut", e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label className="text-slate-700 font-medium">{t(lang, 'reports.dateTo')}</Label>
          <Input
            type="date"
            value={filters.dateFin}
            onChange={(e) => handleChange("dateFin", e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label className="text-slate-700 font-medium">{t(lang, 'reports.period')}</Label>
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
              <SelectValue placeholder={t(lang, 'reports.periodChoose')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mois">{t(lang, 'reports.periodMonth')}</SelectItem>
              <SelectItem value="trimestre">{t(lang, 'reports.periodQuarter')}</SelectItem>
              <SelectItem value="annee">{t(lang, 'reports.periodYear')}</SelectItem>
              <SelectItem value="tout">{t(lang, 'reports.periodAll')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
