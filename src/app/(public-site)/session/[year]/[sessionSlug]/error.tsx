"use client"; // Error components must be Client Components

import {useEffect} from "react";
import {usePathname} from "next/navigation";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("/session/[year]/[sessionSlug]/error.tsx", error, pathname);
  }, [error]);

  return (
    <section className="rd-band rd-band--b rd-dots rd-pagehead rd-ss-head">
      <div className="rd-wrap">
        <h1 className="rd-h1">Something went wrong!</h1>
        <p style={{ marginTop: 28 }}>
          <button
            type="button"
            className="rd-btn"
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
          >
            Try again
          </button>
        </p>
      </div>
    </section>
  );
}
