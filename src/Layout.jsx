import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { Users, Star, LogOut, BarChart3, Bell, Phone, Shield, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: "Dashboard", icon: BarChart3 },
    { name: "Players", icon: Users },
    { name: "MyWatchList", icon: Star },
    { name: "Teams", icon: Shield },
    { name: "Contacts", icon: Phone },
    { name: "Alerts", icon: Bell },
    { name: "Reports", icon: FileText }
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-20 bg-slate-950 flex flex-col items-center py-6 border-r border-slate-900">
        <Link to={createPageUrl("Dashboard")} className="mb-8">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
            <Users className="w-7 h-7 text-slate-950" />
          </div>
        </Link>

        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.name;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`relative w-14 h-14 flex items-center justify-center rounded-2xl transition-all group ${
                  isActive
                    ? "bg-white shadow-xl"
                    : "hover:bg-slate-900"
                }`}
              >
                <Icon className={`w-6 h-6 transition-colors ${
                  isActive ? "text-slate-950" : "text-slate-500 group-hover:text-white"
                }`} />
                {isActive && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => base44.auth.logout()}
          className="w-14 h-14 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-900 hover:text-red-400 transition-all"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50">{children}</main>
    </div>
  );
}