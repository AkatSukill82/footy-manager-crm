import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  Users, Star, LogOut, BarChart3, Bell, Phone, Shield,
  FileText, Network, ArrowRightLeft, Menu, X, Building2, SearchCheck, Sparkles, Newspaper
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { name: "Dashboard",          label: "Tableau de bord",   icon: BarChart3 },
  { name: "Players",            label: "Joueurs",            icon: Users },
  { name: "Clubs",              label: "Clubs",              icon: Building2 },
  { name: "MyWatchList",        label: "Ma liste",           icon: Star },
  { name: "Alerts",             label: "Alertes",            icon: Bell },
  { name: "Contacts",           label: "Contacts",           icon: Phone },
  { name: "Teams",              label: "Équipes",            icon: Shield },
  { name: "TransferManagement", label: "Transferts",         icon: ArrowRightLeft },
  { name: "Reports",            label: "Rapports",           icon: FileText },
  { name: "AgentNetwork",       label: "Réseau Agents",      icon: Network },
  { name: "PlayerSearch",       label: "Recherche Joueurs",   icon: SearchCheck },
  { name: "PredictiveDashboard", label: "Prédictif IA",        icon: Sparkles },
  { name: "News",               label: "Journal du jour",    icon: Newspaper },
  { name: "ScoutingIA",         label: "Scouting IA",        icon: Sparkles },
];

// Bottom nav shows 5 key items; rest accessible via drawer
const bottomPrimary = ["Dashboard", "Players", "Teams", "TransferManagement", "Clubs"];

export default function Layout({ children, currentPageName }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0">
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

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

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

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-auto min-w-0 pb-20 md:pb-0">
        {children}
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-xl">
        <div className="flex items-center h-16">
          {bottomPrimary.map((pageName) => {
            const item = navItems.find(n => n.name === pageName);
            if (!item) return null;
            const Icon = item.icon;
            const isActive = currentPageName === item.name;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all ${
                  isActive ? "text-green-600" : "text-slate-400"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className="text-[10px] font-medium leading-none truncate max-w-[56px]">
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 h-0.5 w-8 bg-green-500 rounded-full" />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-all ${
              drawerOpen ? "text-green-600" : "text-slate-400"
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">Plus</span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE DRAWER (more pages) ── */}
      {drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-slate-900">Football CRM</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-4">
              {navItems.filter(i => !bottomPrimary.includes(i.name)).map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.name;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="px-4 pb-6">
              <button
                onClick={() => { base44.auth.logout(); setDrawerOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-3 text-red-500 bg-red-50 rounded-xl font-medium"
              >
                <LogOut className="w-5 h-5" />
                Déconnexion
              </button>
            </div>
          </div>
        </>
      )}

      <Toaster position="top-right" richColors />
    </div>
  );
}