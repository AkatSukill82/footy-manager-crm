import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Calendar, Clock, Banknote, Filter } from "lucide-react";
import { format } from "date-fns";

const transferTypeColors = {
  "Transfert définitif": "bg-blue-100 text-blue-800 border-blue-200",
  "Prêt": "bg-purple-100 text-purple-800 border-purple-200",
  "Libre": "bg-green-100 text-green-800 border-green-200",
  "Fin de prêt": "bg-slate-100 text-slate-700 border-slate-200"
};

const transferTypeBorder = {
  "Transfert définitif": "border-blue-500",
  "Prêt": "border-purple-500",
  "Libre": "border-green-500",
  "Fin de prêt": "border-slate-400"
};

export default function TransferHistory({ transfers }) {
  const [filterYear, setFilterYear] = useState("all");
  const [filterClub, setFilterClub] = useState("all");

  const sortedTransfers = useMemo(() =>
    [...(transfers || [])].sort((a, b) => new Date(b.date_transfert) - new Date(a.date_transfert)),
    [transfers]
  );

  const years = useMemo(() => {
    const set = new Set(sortedTransfers.map(t => new Date(t.date_transfert).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [sortedTransfers]);

  const clubs = useMemo(() => {
    const set = new Set(sortedTransfers.flatMap(t => [t.club_depart, t.club_arrivee].filter(Boolean)));
    return Array.from(set).sort();
  }, [sortedTransfers]);

  const filtered = useMemo(() => sortedTransfers.filter(t => {
    const year = new Date(t.date_transfert).getFullYear();
    const matchYear = filterYear === "all" || year === parseInt(filterYear);
    const matchClub = filterClub === "all" || t.club_depart === filterClub || t.club_arrivee === filterClub;
    return matchYear && matchClub;
  }), [sortedTransfers, filterYear, filterClub]);

  const hasFilters = years.length > 0 || clubs.length > 1;

  if (!transfers || transfers.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Historique des transferts</CardTitle></CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-8">Aucun transfert enregistré</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">Historique des transferts</CardTitle>
          {hasFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes années</SelectItem>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterClub} onValueChange={setFilterClub}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Club" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clubs</SelectItem>
                  {clubs.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">Aucun transfert pour ces filtres</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((transfer, index) => (
              <div
                key={index}
                className={`border-l-4 ${transferTypeBorder[transfer.type_transfert] || "border-gray-400"} pl-4 py-2 hover:bg-slate-50 rounded-r-lg transition-colors`}
              >
                {/* Header row: date + type badge */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(transfer.date_transfert), "dd/MM/yyyy")}</span>
                  </div>
                  <Badge className={`text-xs border ${transferTypeColors[transfer.type_transfert] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                    {transfer.type_transfert}
                  </Badge>
                  {transfer.type_transfert === "Prêt" && transfer.date_fin_pret && (
                    <div className="flex items-center gap-1 text-xs text-purple-600">
                      <Clock className="w-3 h-3" />
                      <span>fin {format(new Date(transfer.date_fin_pret), "MM/yyyy")}</span>
                    </div>
                  )}
                </div>

                {/* Clubs row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-700 text-sm">{transfer.club_depart || <span className="text-slate-400 italic">Inconnu</span>}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="font-bold text-slate-900 text-sm">{transfer.club_arrivee}</span>
                </div>

                {/* Details row: fee + contract duration */}
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  {transfer.montant ? (
                    <div className="flex items-center gap-1">
                      <Banknote className="w-4 h-4 text-green-600" />
                      <span className="text-base font-bold text-green-600">{transfer.montant} M€</span>
                    </div>
                  ) : (
                    transfer.type_transfert === "Libre" ? (
                      <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded px-2 py-0.5">Gratuit</span>
                    ) : transfer.type_transfert !== "Fin de prêt" && (
                      <span className="text-xs text-slate-400 italic">Montant non communiqué</span>
                    )
                  )}

                  {transfer.duree_contrat && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 rounded px-2 py-0.5">
                      <Clock className="w-3 h-3" />
                      <span>Contrat : {transfer.duree_contrat}</span>
                    </div>
                  )}
                </div>

                {transfer.notes && (
                  <p className="mt-2 text-xs text-slate-500 italic">{transfer.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}