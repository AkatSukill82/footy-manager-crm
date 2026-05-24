/**
 * Composant image intelligent pour les URLs Transfermarkt.
 * - URLs TM (tmssl.akamaized.net, img.a.transfermarkt.technology) → proxy backend
 * - Autres URLs → img standard
 * - Fallback → enfant (icône ou initiales)
 */
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

function isTMUrl(url) {
  if (!url) return false;
  return (
    url.includes("transfermarkt.technology") ||
    url.includes("tmssl.akamaized.net") ||
    url.includes("transfermarkt.com/images")
  );
}

export default function TransfermarktImage({
  src,
  alt = "",
  className = "",
  fallback = null,
  style = {},
}) {
  const [imgSrc, setImgSrc] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const prevSrc = useRef(null);

  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }

    if (prevSrc.current === src) return;
    prevSrc.current = src;

    setError(false);
    setLoading(false);
    setImgSrc(null);

    if (isTMUrl(src)) {
      setLoading(true);
      base44.functions
        .invoke("fetchTransfermarktImage", { imageUrl: src })
        .then((res) => {
          const dataUrl = res?.data?.dataUrl;
          if (dataUrl && dataUrl.length > 30) {
            setImgSrc(dataUrl);
          } else {
            setError(true);
          }
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    } else {
      setImgSrc(src);
    }
  }, [src]);

  if (!src || error) {
    return fallback || null;
  }

  if (loading) {
    return (
      <div className={`${className} bg-slate-100 animate-pulse`} style={style} />
    );
  }

  if (!imgSrc) return null;

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
    />
  );
}