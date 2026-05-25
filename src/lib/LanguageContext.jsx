import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext({ lang: "fr", setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("fdm_lang") || "fr");

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem("fdm_lang", l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
