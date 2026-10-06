"use client";

import React, {createContext, useContext} from "react";

const ConfigDataContext = createContext({});

export default function ConfigDataProvider({ children, year, value }: { children: any; year: String; value: any }) {
  if (!year) {
    year = "2019";
  }

  return <ConfigDataContext.Provider value={value}>{children}</ConfigDataContext.Provider>;
}

export const useConfigDataContext = () => {
  if (!ConfigDataContext) {
    throw new Error("useConfigDataContext must be used within a ConfigDataContext");
  }
  return useContext(ConfigDataContext);
};
