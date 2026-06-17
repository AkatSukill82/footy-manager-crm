import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const slugify = (name) =>
  (name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function buildLinks(player) {
  const name = encodeURIComponent(player.nom || "");
  const tmId = player.transfermarkt_id;
  const ssId = player.sofascore_id;
  const ssSlug = slugify(player.nom);
  return [
    {
      label: "Transfermarkt",
      description: "Valeur marchande, contrat, historique clubs",
      href: tmId
        ? `https://www.transfermarkt.com/a/profil/spieler/${tmId}`
        : `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${name}&Feld=spieler`,
      badge: tmId ? "Profil direct" : "Recherche",
      style: "bg-green-50 border-green-200 hover:bg-green-100 text-green-900",
    },
    {
      label: "SofaScore",
      description: "Notes de match, performances, forme récente",
      href: ssId
        ? `https://www.sofascore.com/football/player/${ssSlug}/${ssId}`
        : `https://www.google.com/search?q=sofascore+${name}+football`,
      badge: ssId ? "Profil direct" : "Via Google",
      style: "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-900",
    },
    {
      label: "FotMob",
      description: "Stats saison, titularisations, note par match",
      href: `https://www.fotmob.com/search?q=${name}`,
      badge: "Recherche",
      style: "bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-900",
    },
  ];
}

export default function PlayerExternalLinks({ player }) {
  if (!player?.nom) return null;
  const links = buildLinks(player);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-slate-500" />
          Liens externes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-slate-400 mb-3">
          Données manquantes ou à vérifier ? Consultez ces sources directement.
        </p>
        {links.map(({ label, description, href, badge, style }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between p-2.5 rounded-xl border text-sm transition-all ${style}`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[13px]">{label}</span>
                <span className="text-[10px] opacity-60 border border-current rounded-full px-1.5 py-0.5">{badge}</span>
              </div>
              <p className="text-[11px] opacity-65 mt-0.5 leading-snug">{description}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 ml-2 opacity-50" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
}

export { buildLinks };
