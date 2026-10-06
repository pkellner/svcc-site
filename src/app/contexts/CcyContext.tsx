"use client";

import React, {createContext, useContext} from "react";

const CcyContext = createContext({});

export default function CcyProvider({ children, year, value }: { children: any; year: String; value: any }) {
  if (!year) {
    year = "2019";
  }

  return <CcyContext.Provider value={value}>{children}</CcyContext.Provider>;
}

export const useCcyContext = () => {
  if (!CcyContext) {
    throw new Error("useCcyContext must be used within a CcyContext");
  }
  return useContext(CcyContext);
};
