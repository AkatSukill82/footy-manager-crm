import React from "react";
import { ExternalLink } from "lucide-react";

export default function ClubExternalLinks({ club }) {
  if (!club?.nom) return null;

  const name = encodeURIComponent(club.nom);

  const links = [
    {
      label: "Transfermarkt",
      description: "Effectif, valeur marchande, transferts, contrats",
      href: `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${name}&Feld=verein`,
      style: "border-green-200 bg-green-50 hover:bg-green-100 text-green-900",
      dot: "bg-green-500",
    },
    {
      label: "SofaScore",
      description: "Résultats, stats d'équipe, forme récente",
      href: `https://www.google.com/search?q=${name}+sofascore+football`,
      style: "border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-900",
      dot: "bg-yellow-500",
      note: "via Google",
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {links.map(({ label, description, href, style, dot, note }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all ${style}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{label}</span>
                {note && (
                  <span className="text-[10px] opacity-60 border border-current rounded-full px-1.5 py-0.5 leading-none">
                    {note}
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-65 mt-0.5 truncate">{description}</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-50" />
        </a>
      ))}
    </div>
  );
}
