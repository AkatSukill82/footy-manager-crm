import React, { useState, useEffect } from "react";
import { base44, invokeFn } from "@/api/base44Client";
import { Camera, Loader2 } from "lucide-react";

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
  return COLORS[name.charCodeAt(0) % COLORS.length];
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PlayerAvatar({
  src,
  name,
  type = "player",
  club,
  entityId,
  entityType,
  className = "w-12 h-12",
  textClassName = "text-sm",
  showFetchButton = true,
  onPhotoFetched,
}) {
  const [localSrc, setLocalSrc]   = useState(src || null);
  const [imgFailed, setImgFailed] = useState(false);
  const [fetching, setFetching]   = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Sync when parent passes a new src
  useEffect(() => { setLocalSrc(src || null); setImgFailed(false); }, [src]);

  // Bouton fetch MANUEL uniquement — pas d'auto-fetch au chargement
  // (l'auto-fetch sur tous les joueurs d'une page serait trop lourd)
  const handleFetch = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (fetching) return;
    setFetching(true);
    setFetchError(false);
    try {
      const res = await invokeFn("fetchEntityPhoto", { type, name, club });
      const url = res?.photo_url;
      if (url) {
        setLocalSrc(url);
        setImgFailed(false);
        if (entityId && entityType) {
          const field = entityType === "Club" ? "logo_url" : "photo_url";
          await base44.entities[entityType].update(entityId, { [field]: url });
        }
        if (onPhotoFetched) onPhotoFetched(url);
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setFetching(false);
    }
  };

  const color    = getColor(name);
  const initials = type === "club"
    ? (name?.substring(0, 3).toUpperCase() || "?")
    : getInitials(name);
  const hasPhoto = localSrc && localSrc !== "null" && localSrc !== "" && !imgFailed;

  return (
    <div className={`relative ${className} flex-shrink-0 group/avatar`}>
      {hasPhoto ? (
        <div className={`${className} rounded-full overflow-hidden border-2 border-white shadow-sm`}>
          <img
            src={localSrc}
            alt={name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : (
        <div className={`${className} rounded-full bg-gradient-to-br ${color} flex items-center justify-center border-2 border-white shadow-sm`}>
          {fetching
            ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            : <span className={`text-white font-bold ${textClassName}`}>{initials}</span>}
        </div>
      )}

      {/* Bouton fetch manuel : visible au hover quand pas de photo */}
      {showFetchButton && !hasPhoto && !fetching && (
        <button
          onClick={handleFetch}
          title="Chercher photo automatiquement"
          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all
            ${fetchError ? "bg-red-500" : "bg-white border border-slate-200 hover:bg-slate-800 hover:border-slate-800"}
            opacity-0 group-hover/avatar:opacity-100`}
        >
          <Camera className={`w-2.5 h-2.5 ${fetchError ? "text-white" : "text-slate-500 group-hover/avatar:text-white"}`} />
        </button>
      )}
    </div>
  );
}

export default React.memo(PlayerAvatar);
