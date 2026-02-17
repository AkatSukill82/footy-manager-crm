import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Users, Star, LogOut, BarChart3, Bell, Phone, Shield, FileText, Network, ArrowRightLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Toaster } from "@/components/ui/sonner";

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: "Dashboard", label: "Tableau de bord", icon: BarChart3 },
    { name: "Players", label: "Base de joueurs", icon: Users },
    { name: "Clubs", label: "Clubs", icon: Shield },
    { name: "MyWatchList", label: "Ma liste", icon: Star },
    { name: "Alerts", label: "Alertes", icon: Bell },
    { name: "Contacts", label: "Contacts", icon: Phone },
    { name: "Teams", label: "Équipes virtuelles", icon: Users },
    { name: "TransferManagement", label: "Transferts", icon: ArrowRightLeft },
    { name: "Reports", label: "Rapports", icon: FileText },
    { name: "AgentNetwork", label: "Réseau Agents", icon: Network }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg text-slate-900">Football CRM</div>
              <div className="text-xs text-slate-500">Gestion de joueurs</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.name;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : ""}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => base44.auth.logout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
      
      {/* Notifications Toast */}
      <Toaster position="top-right" richColors />
    </div>
  );
}