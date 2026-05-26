/**
 * Avatar intelligent pour joueurs et clubs.
 * - Affiche la photo si disponible (via TransfermarktImage)
 * - Sinon affiche des initiales colorées avec bouton "Fetch photo auto"
 * - Le bouton appelle fetchEntityPhoto et met à jour l'entité
 */
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Loader2 } from "lucide-react";
import TransfermarktImage from "./TransfermarktImage";

const COLORS = [
  "from-green-400 to-green-600",
  "from-blue-400 to-blue-600",
  "from-purple-400 to-purple-600",
  "from-orange-400 to-orange-600",
  "from-red-400 to-red-600",
  "from-teal-400 to-teal-600",
  "from-indigo-400 to-indigo-600",
  "from-pink-400 to-pink-600",
];

function getColor(name) {
  if (!name) return COLORS[0];
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PlayerAvatar({
  src,
  name,
  type = "player",   // "player" | "club"
  club,              // optional, helps search for players
  entityId,          // entity id to update after fetching
  entityType,        // "Player" | "Club"
  className = "w-12 h-12",
  textClassName = "text-sm",
  showFetchButton = true,
  onPhotoFetched,    // callback(photo_url) — parent handles the save
}) {
  const [fetching, setFetching] = useState(false);
  const [localSrc, setLocalSrc] = useState(src);
  const [fetchError, setFetchError] = useState(false);

  const color = getColor(name);
  const initials = type === "club" ? (name?.substring(0, 3).toUpperCase() || "?") : getInitials(name);

  const handleFetch = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    setFetching(true);
    setFetchError(false);
    try {
      const res = await base44.functions.invoke("fetchEntityPhoto", { type, name, club });
      const photoUrl = res?.data?.photo_url;
      if (photoUrl) {
        setLocalSrc(photoUrl);
        if (entityId && entityType) {
          await base44.entities[entityType].update(entityId, { 
            [entityType === "Club" ? "logo_url" : "photo_url"]: photoUrl 
          });
        }
        if (onPhotoFetched) onPhotoFetched(photoUrl);
      } else {
        setFetchError(true);
      }
    } catch (err) {
      setFetchError(true);
    } finally {
      setFetching(false);
    }
  };

  const hasPhoto = localSrc && localSrc !== "null" && localSrc !== "";

  return (
    <div className={`relative ${className} flex-shrink-0 group/avatar`}>
      {hasPhoto ? (
        <div className={`${className} rounded-full overflow-hidden border-2 border-white shadow-sm`}>
          <TransfermarktImage
            src={localSrc}
            alt={name}
            className="w-full h-full object-cover"
            fallback={
              <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center`}>
                <span className={`text-white font-bold ${textClassName}`}>{initials}</span>
              </div>
            }
          />
        </div>
      ) : (
        <div className={`${className} rounded-full bg-gradient-to-br ${color} flex items-center justify-center border-2 border-white shadow-sm`}>
          <span className={`text-white font-bold ${textClassName}`}>{initials}</span>
        </div>
      )}

      {/* Fetch button overlay */}
      {showFetchButton && !hasPhoto && (
        <button
          onClick={handleFetch}
          disabled={fetching}
          title="Chercher photo automatiquement"
          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all
            ${fetchError ? "bg-red-500" : "bg-white border border-slate-200 hover:bg-green-500 hover:border-green-500"}
            opacity-0 group-hover/avatar:opacity-100`}
        >
          {fetching
            ? <Loader2 className="w-2.5 h-2.5 text-slate-500 animate-spin" />
            : <Camera className={`w-2.5 h-2.5 ${fetchError ? "text-white" : "text-slate-500 group-hover/avatar:text-white"}`} />
          }
        </button>
      )}
    </div>
  );
}