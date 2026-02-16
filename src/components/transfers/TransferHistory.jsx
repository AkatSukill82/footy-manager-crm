import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar } from "lucide-react";
import { format } from "date-fns";

const transferTypeColors = {
  "Transfert définitif": "bg-blue-100 text-blue-800",
  "Prêt": "bg-purple-100 text-purple-800",
  "Libre": "bg-green-100 text-green-800",
  "Fin de prêt": "bg-slate-100 text-slate-800"
};

export default function TransferHistory({ transfers }) {
  if (!transfers || transfers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des transferts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-8">Aucun transfert enregistré</p>
        </CardContent>
      </Card>
    );
  }

  const sortedTransfers = [...transfers].sort((a, b) => 
    new Date(b.date_transfert) - new Date(a.date_transfert)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des transferts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTransfers.map((transfer, index) => (
            <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(transfer.date_transfert), "dd/MM/yyyy")}</span>
                <Badge className={transferTypeColors[transfer.type_transfert] || "bg-gray-100 text-gray-800"}>
                  {transfer.type_transfert}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="font-medium">{transfer.club_depart || "?"}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-green-600">{transfer.club_arrivee}</span>
              </div>
              
              {transfer.montant && (
                <div className="mt-2 text-lg font-bold text-green-600">
                  {transfer.montant} M€
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}