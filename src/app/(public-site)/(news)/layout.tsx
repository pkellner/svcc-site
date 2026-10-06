import React from "react";

// The news header band is rendered by each page (list pages: NewsHeader; detail
// page: its own band with the article title), so there is one h1 per page.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
