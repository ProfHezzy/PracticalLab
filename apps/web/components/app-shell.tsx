"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { Icon } from "@/components/icon";

type Me = {
  username: string;
  active_mode: "student" | "teacher";
  student_profile?: {
    avatar_preset?: string | null;
    level_stage?: string | null;
  } | null;
  teacher_profile?: { verification_status?: string } | null;
};

const learnerLinks = [
  { href: "/student", label: "Overview", icon: "home" },
  { href: "/content", label: "Explore labs", icon: "book" },
  {
    href: "/student/lab?experiment=filtration",
    label: "My lab",
    icon: "flask",
  },
  { href: "/student/profile", label: "Profile", icon: "user" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setHydrated(true);
    apiGet<Me>("auth/me")
      .then((result) => {
        if (result.ok) setMe(result.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!me) return;
    apiGet<{ reduced_motion: boolean; high_contrast: boolean }>(
      "users/me/preferences",
    ).then(({ ok, data }) => {
      if (!ok) return;
      document.documentElement.dataset.reducedMotion = String(
        data.reduced_motion,
      );
      document.documentElement.dataset.highContrast = String(
        data.high_contrast,
      );
    });
  }, [me]);

  async function signOut() {
    setSigningOut(true);
    try {
      await apiPost("auth/logout", {});
    } finally {
      router.push("/auth/login");
      router.refresh();
    }
  }

  const currentUser = hydrated ? me : null;
  const avatar = (currentUser?.username || "P").slice(0, 1).toUpperCase();
  const displayName = currentUser?.username || "Curious learner";
  const isTeacherArea = pathname.startsWith("/teacher");
  const links = isTeacherArea
    ? [
        { href: "/teacher", label: "Overview", icon: "home" },
        {
          href: "/teacher/library",
          label: "Library",
          icon: "library",
        },
        {
          href: "/teacher/verification",
          label: "Verification",
          icon: "shield",
        },
        { href: "/content", label: "Explore lessons", icon: "book" },
        { href: "/student/profile", label: "Profile", icon: "user" },
      ]
    : learnerLinks;

  return (
    <div className="app-frame">
      <aside className="app-rail" aria-label="Main navigation">
        <Link
          className="brand app-brand"
          href="/student"
          aria-label="PracticalLab Africa home"
        >
          <span className="brand-mark">P</span>
          <span>
            PracticalLab <strong>Africa</strong>
          </span>
        </Link>
        <div className="rail-caption">
          {isTeacherArea ? "EDUCATOR SPACE" : "YOUR WORKSPACE"}
        </div>
        <nav className="rail-links">
          {links.map((item) => {
            const active =
              item.href === "/student"
                ? pathname === item.href
                : pathname.startsWith(item.href.split("?")[0]);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "rail-link is-active" : "rail-link"}
                aria-current={active ? "page" : undefined}
              >
                <span className="rail-icon">
                  <Icon
                    name={
                      item.icon as "home" | "book" | "flask" | "user" | "shield" | "library"
                    }
                  />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="rail-spacer" />
        <Link
          className="rail-help"
          href={isTeacherArea ? "/student" : "/teacher"}
        >
          <span>{isTeacherArea ? "Student workspace" : "For educators"}</span>
          <span aria-hidden="true">↗</span>
        </Link>
        <div className="rail-user">
          <span className="avatar-token" aria-hidden="true">
            {avatar}
          </span>
          {currentUser ? (
            <>
              <span className="rail-user-copy">
                <strong>{displayName}</strong>
                <small>
                  {currentUser.student_profile?.level_stage ||
                    "Learner account"}
                </small>
              </span>
              <button
                className="icon-button"
                onClick={signOut}
                disabled={signingOut}
                aria-label="Sign out"
                title="Sign out"
              >
                ↗
              </button>
            </>
          ) : (
            <span className="rail-user-copy">
              <strong>Welcome, learner</strong>
              <small>Your own learning space</small>
            </span>
          )}
        </div>
      </aside>
      <div className="app-main-column">
        <header className="app-topbar">
          <Link className="brand app-mobile-brand" href="/student">
            <span className="brand-mark">P</span>
            <span>
              PracticalLab <strong>Africa</strong>
            </span>
          </Link>
          <p className="topbar-context">A little progress, every day.</p>
          <ThemeToggle />
          <Link
            className="topbar-profile"
            href={currentUser ? "/student/profile" : "/auth/login"}
            aria-label={
              currentUser
                ? `Open ${displayName}'s profile`
                : "Sign in to your account"
            }
          >
            <span className="avatar-token">{avatar}</span>
            <span>{currentUser ? displayName : "Sign in"}</span>
          </Link>
        </header>
        <div className="app-content">{children}</div>
        <nav className="mobile-tabs" aria-label="Main navigation">
          {links.map((item) => {
            const active =
              item.href === "/student"
                ? pathname === item.href
                : pathname.startsWith(item.href.split("?")[0]);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "mobile-tab is-active" : "mobile-tab"}
                aria-current={active ? "page" : undefined}
              >
                <span>
                  <Icon
                    name={
                      item.icon as "home" | "book" | "flask" | "user" | "shield" | "library"
                    }
                  />
                </span>
                <small>
                  {item.label === "Explore labs"
                    ? "Explore"
                    : item.label === "Overview"
                      ? "Home"
                      : item.label === "Library"
                        ? "Library"
                      : item.label === "My lab"
                        ? "Lab"
                        : "Profile"}
                </small>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
