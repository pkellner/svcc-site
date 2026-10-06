"use client";

import React, {createContext} from "react";

const ProfileContext = createContext({});

// passed in year comes from the global year in constants (codeCampYearGlobal) and the /pages components

export default function ProfileProvider({ children, value }: { children: any; year: String; value: any }) {
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export const useProfileContext = () => {
  if (!ProfileContext) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  return React.useContext(ProfileContext);
};
