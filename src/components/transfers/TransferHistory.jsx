import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Calendar, Clock, Banknote, Filter, TrendingUp, Building2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const TYPE_CONFIG = {
  "Transfert définitif": { color: "bg-blue-500", light: "bg-blue-50 border-blue-200", badge: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500", line: "border-blue-300" },
  "Prêt":               { color: "bg-purple-500", light: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-800 border-purple-200", dot: "bg-purple-500", line: "border-purple-300" },
  "Libre":              { color: "bg-green-500", light: "bg-green-50 border-green-200", badge: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500", line: "border-green-300" },
  "Fin de prêt":        { color: "bg-slate-400", light: "bg-slate-50 border-slate-200", badge: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400", line: "border-slate-300" },
};

const DEFAULT_CONFIG = { color: "bg-slate-400", light: "bg-slate-50 border-slate-200", badge: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400", line: "border-slate-300" };

function getConfig(type) {
  return TYPE_CONFIG[type] || DEFAULT_CONFIG;
}

function TransferCard({ transfer, index, total, isExpanded, onToggle }) {
  const { lang } = useLanguage();
  const cfg = getConfig(transfer.type_transfert);
  const isLast = index === total - 1;

  return (
    <div className="relative flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0 w-10">
        <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md z-10 mt-1 ${cfg.dot}`} />
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-6 rounded-2xl border ${cfg.light} overflow-hidden transition-shadow hover:shadow-md`}>
        {/* Header */}
        <button
          onClick={onToggle}
          className="w-full text-left p-4 flex items-start justify-between gap-3"
        >
          <div className="flex-1 min-w-0">
            {/* Date */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
              <Calendar className="w-3 h-3" />
              {format(new Date(transfer.date_transfert), "dd MMMM yyyy")}
              {transfer.type_transfert === "Prêt" && transfer.date_fin_pret && (
                <span className="ml-1 text-purple-600">
                  → fin {format(new Date(transfer.date_fin_pret), "MM/yyyy")}
                  {" "}({differenceInMonths(new Date(transfer.date_fin_pret), new Date(transfer.date_transfert))} mois)
                </span>
              )}
            </div>

            {/* Clubs */}
            <div className="flex items-center gap-2 flex-wrap">
              {transfer.club_depart ? (
                <span className="flex items-center gap-1 text-slate-600 font-medium text-sm">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {transfer.club_depart}
                </span>
              ) : (
                <span className="text-slate-400 italic text-sm">{t(lang,'transfers.startCareer')}</span>
              )}
              <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="flex items-center gap-1 font-bold text-slate-900 text-sm">
                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                {transfer.club_arrivee}
              </span>
            </div>

            {/* Fee & type */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={`text-xs border ${cfg.badge}`}>{transfer.type_transfert}</Badge>
              {transfer.montant ? (
                <span className="flex items-center gap-1 text-green-700 font-bold text-sm">
                  <Banknote className="w-3.5 h-3.5" />
                  {transfer.montant} M€
                </span>
              ) : transfer.type_transfert === "Libre" ? (
                <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">{t(lang,'transfers.free')}</span>
              ) : null}
              {transfer.duree_contrat && (
                <span className="flex items-center gap-1 text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                  <Clock className="w-3 h-3" /> {transfer.duree_contrat}
                </span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 text-slate-400 mt-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Expanded details */}
        {isExpanded && (transfer.notes || transfer.montant) && (
          <div className="px-4 pb-4 border-t border-white/60 bg-white/50 space-y-3">
            {transfer.notes && (
              <p className="text-xs text-slate-600 leading-relaxed pt-3 italic">"{transfer.notes}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryBar({ transfers }) {
  const { lang } = useLanguage();
  const total = transfers.reduce((s, tr) => s + (tr.montant || 0), 0);
  const definitifs = transfers.filter(tr => tr.type_transfert === "Transfert définitif").length;
  const prets = transfers.filter(tr => tr.type_transfert === "Prêt").length;
  const libres = transfers.filter(tr => tr.type_transfert === "Libre").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: t(lang,'transfers.totalMoves'), value: transfers.length, icon: ArrowRight, color: "text-slate-700", bg: "bg-slate-50" },
        { label: t(lang,'transfers.totalValue'), value: total > 0 ? `${total.toFixed(1)} M€` : "—", icon: TrendingUp, color: "text-green-700", bg: "bg-green-50" },
        { label: t(lang,'transfers.permanent'), value: definitifs, icon: Building2, color: "text-blue-700", bg: "bg-blue-50" },
        { label: t(lang,'transfers.loanFree'), value: `${prets} / ${libres}`, icon: Clock, color: "text-purple-700", bg: "bg-purple-50" },
      ].map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className={`rounded-xl ${bg} px-3 py-2.5 flex items-center gap-2`}>
          <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
          <div>
            <p className="text-[10px] text-slate-500 leading-none">{label}</p>
            <p className={`text-sm font-bold ${color}`}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TransferHistory({ transfers, player }) {
  const { lang } = useLanguage();
  const [filterYear, setFilterYear] = useState("all");
  const [filterClub, setFilterClub] = useState("all");
  const [expandedIndex, setExpandedIndex] = useState(null);

  const sorted = useMemo(() =>
    [...(transfers || [])].sort((a, b) => new Date(a.date_transfert) - new Date(b.date_transfert)),
    [transfers]
  );

  const years = useMemo(() => {
    const set = new Set(sorted.map(t => new Date(t.date_transfert).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [sorted]);

  const clubs = useMemo(() => {
    const set = new Set(sorted.flatMap(t => [t.club_depart, t.club_arrivee].filter(Boolean)));
    return Array.from(set).sort();
  }, [sorted]);

  const filtered = useMemo(() => sorted.filter(t => {
    const year = new Date(t.date_transfert).getFullYear();
    const matchYear = filterYear === "all" || year === parseInt(filterYear);
    const matchClub = filterClub === "all" || t.club_depart === filterClub || t.club_arrivee === filterClub;
    return matchYear && matchClub;
  }), [sorted, filterYear, filterClub]);

  if (!transfers || transfers.length === 0) {
    const _name = encodeURIComponent(player?.nom || "");
    const _tmId = player?.transfermarkt_id;
    const tmHref = _tmId
      ? `https://www.transfermarkt.com/a/profil/spieler/${_tmId}`
      : `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${_name}&Feld=spieler`;
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">{t(lang,'transfers.historyTitle')}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-8 text-sm text-slate-400">
            <p>{t(lang,'transfers.noTransfers')}</p>
            {player?.nom && (
              <a
                href={tmHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-green-600 hover:underline font-medium text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Voir l'historique sur Transfermarkt
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-blue-600" />
            {t(lang,'transfers.historyTitle')}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t(lang,'transfers.allYears')}</SelectItem>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterClub} onValueChange={setFilterClub}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="Club" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t(lang,'transfers.allClubs')}</SelectItem>
                {clubs.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <SummaryBar transfers={filtered} />

        {filtered.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">{t(lang,'transfers.noFiltered')}</p>
        ) : (
          <div className="relative">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-5">
              {Object.entries(TYPE_CONFIG).map(([label, cfg]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <span className="text-[11px] text-slate-500">{label}</span>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div>
              {filtered.map((transfer, index) => (
                <TransferCard
                  key={index}
                  transfer={transfer}
                  index={index}
                  total={filtered.length}
                  isExpanded={expandedIndex === index}
                  onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}