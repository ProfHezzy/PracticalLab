"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

export function AccountLinks() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    apiGet("auth/me")
      .then(({ ok }) => setSignedIn(ok))
      .finally(() => setReady(true));
  }, []);

  async function signOut() {
    await apiPost("auth/logout", {});
    setSignedIn(false);
    router.refresh();
  }

  if (!hydrated || !ready || !signedIn)
    return (
      <nav className="account-links" aria-label="Account">
        <Link className="button button-secondary" href="/auth/login">
          Log in
        </Link>
        <Link className="button button-primary" href="/auth/register">
          Create account
        </Link>
      </nav>
    );
  return (
    <nav className="account-links account-links-signed-in" aria-label="Account">
      <Link className="button button-secondary" href="/student">
        My workspace <span aria-hidden="true">↗</span>
      </Link>
      <button
        className="button button-quiet account-sign-out"
        onClick={signOut}
      >
        Sign out
      </button>
    </nav>
  );
}
