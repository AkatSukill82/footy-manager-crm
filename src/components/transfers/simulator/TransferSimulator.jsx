import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Wallet, Briefcase, ArrowRightLeft, PiggyBank } from "lucide-react";
import SalarySimulator from "./SalarySimulator";
import AgentCommissionSimulator from "./AgentCommissionSimulator";
import TransferFeeSimulator from "./TransferFeeSimulator";
import BudgetSimulator from "../BudgetSimulator";

const MODULES = [
  { key: "salaire",     label: "Salaire (brut↔net)", icon: Wallet },
  { key: "commission",  label: "Commission agent",   icon: Briefcase },
  { key: "transfert",   label: "Transfert",          icon: ArrowRightLeft },
  { key: "budget",      label: "Faisabilité budget", icon: PiggyBank },
];

export default function TransferSimulator({ teams, players, teamPlayers }) {
  const [module, setModule] = useState("salaire");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Simulateur de transfert
        </CardTitle>
        <p className="text-xs text-slate-500">
          Estimez les flux d'une opération : net joueur, coût club, net vendeur et commissions.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sous-onglets des modules */}
        <div className="bg-slate-100 rounded-xl p-1 flex gap-1 overflow-x-auto">
          {MODULES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setModule(key)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                module === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {module === "salaire" && <SalarySimulator />}
        {module === "commission" && <AgentCommissionSimulator />}
        {module === "transfert" && <TransferFeeSimulator />}
        {module === "budget" && (
          <BudgetSimulator teams={teams} players={players} teamPlayers={teamPlayers} />
        )}
      </CardContent>
    </Card>
  );
}
