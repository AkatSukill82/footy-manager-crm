/**
 * Smart image component for external URLs.
 * Strategy: try direct load first (fast for Wikipedia, official sites, etc.)
 * If the browser blocks it (CORS/referrer), auto-fallback to the server-side proxy.
 * Module-level cache avoids re-fetching the same URL on re-renders.
 */
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";

// Module-level cache: url → { dataUrl } | { direct: true } | { error: true }
const imageCache = new Map();

// Domains known to block direct browser requests — skip the direct attempt
const BLOCKED_DOMAINS = [
  "transfermarkt.technology",
  "tmssl.akamaized.net",
  "transfermarkt.com/images",
  "img.sofascore.com",
  "api.sofascore.com",
  "media.api-sports.io",
  "resources.premierleague.com",
  "content.sportslogos.net",
];

function needsProxy(url) {
  if (!url) return false;
  return BLOCKED_DOMAINS.some(d => url.includes(d));
}

async function fetchViaProxy(url) {
  const res = await base44.functions.invoke("fetchTransfermarktImage", { imageUrl: url });
  const dataUrl = res?.data?.dataUrl;
  if (dataUrl && dataUrl.length > 30) return dataUrl;
  throw new Error("proxy returned empty");
}

export default function TransfermarktImage({
  src,
  alt = "",
  className = "",
  fallback = null,
  style = {},
}) {
  const [state, setState] = useState(() => {
    if (!src) return "error";
    const cached = imageCache.get(src);
    if (cached?.error) return "error";
    if (cached?.direct) return "direct";
    if (cached?.dataUrl) return "proxied";
    return "idle";
  });
  const [dataUrl, setDataUrl] = useState(() => imageCache.get(src)?.dataUrl || null);
  const prevSrc = useRef(null);

  useEffect(() => {
    if (!src) { setState("error"); return; }
    if (prevSrc.current === src) return;
    prevSrc.current = src;

    // Check cache first
    const cached = imageCache.get(src);
    if (cached) {
      if (cached.error) { setState("error"); return; }
      if (cached.direct) { setState("direct"); return; }
      if (cached.dataUrl) { setDataUrl(cached.dataUrl); setState("proxied"); return; }
    }

    // Known-blocked domains: go straight to proxy
    if (needsProxy(src)) {
      setState("loading");
      fetchViaProxy(src)
        .then(url => {
          imageCache.set(src, { dataUrl: url });
          setDataUrl(url);
          setState("proxied");
        })
        .catch(() => {
          imageCache.set(src, { error: true });
          setState("error");
        });
      return;
    }

    // Unknown domain: try direct first, proxy as fallback
    setState("direct");
  }, [src]);

  // Called when direct <img> fails to load
  const handleDirectError = () => {
    if (!src) { setState("error"); return; }
    setState("loading");
    fetchViaProxy(src)
      .then(url => {
        imageCache.set(src, { dataUrl: url });
        setDataUrl(url);
        setState("proxied");
      })
      .catch(() => {
        imageCache.set(src, { error: true });
        setState("error");
      });
  };

  // Direct load succeeded — cache it
  const handleDirectLoad = () => {
    if (src) imageCache.set(src, { direct: true });
  };

  if (!src || state === "error") return fallback || null;

  if (state === "loading" || state === "idle") {
    return <div className={`${className} bg-slate-100 animate-pulse`} style={style} />;
  }

  if (state === "proxied") {
    return (
      <img
        src={dataUrl}
        alt={alt}
        className={className}
        style={style}
        onError={() => setState("error")}
      />
    );
  }

  // state === "direct"
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onLoad={handleDirectLoad}
      onError={handleDirectError}
    />
  );
}
