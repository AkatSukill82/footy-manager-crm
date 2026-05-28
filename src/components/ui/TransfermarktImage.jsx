import React from "react";
export default function TransfermarktImage({ src, className, style }) {
  if (!src) return null;
  return <img src={src} className={className} style={style} alt="" />;
}
