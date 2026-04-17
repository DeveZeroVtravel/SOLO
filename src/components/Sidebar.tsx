"use client";

import { useFirebase } from "@/context/FirebaseContext";
import { useSettings } from "@/context/SettingsContext";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Settings,
  Plus,
  LogOut,
  Zap,
} from "lucide-react";

type Tab = "dashboard" | "daily" | "weekly" | "settings";

type NavItem = {
  id: Tab;
  icon: React.ElementType;
  labelKey: "dashboard" | "daily" | "weekly" | "settings";
};

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, labelKey: "dashboard" },
  { id: "daily",     icon: CalendarDays,    labelKey: "daily"     },
  { id: "weekly",    icon: CalendarRange,   labelKey: "weekly"    },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}) {
  const { user, logOut } = useFirebase();
  const { t } = useSettings();

  if (!user) return null;

  const initials = (user.displayName || user.email || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex fixed left-5 top-5 bottom-[104px] z-40 flex-col p-4 neu-float-bar transition-all duration-300 group overflow-hidden"
        style={{
          width: 80,
        }}
      >
      <style dangerouslySetInnerHTML={{__html: `
        aside:hover { width: 240px !important; }
        .sidebar-text { opacity: 0; width: 0; white-space: nowrap; overflow: hidden; transition: opacity 0.2s 0.1s, width 0.3s; }
        aside:hover .sidebar-text { opacity: 1; width: auto; margin-left: 12px; }
      `}} />

      {/* ── Logo ── */}
      <div className="flex items-center mb-8 mt-2 h-12 w-full shrink-0">
        <div className="w-12 h-12 shrink-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-[14px] flex items-center justify-center neu-btn-accent">
            <Zap size={20} strokeWidth={2.5} />
          </div>
        </div>
        <span
          className="text-lg font-extrabold tracking-tight sidebar-text"
          style={{ color: "var(--text-primary)" }}
        >
          Smart<span style={{ color: "var(--accent)" }}>Cal</span>
        </span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 space-y-3">
        {NAV_ITEMS.map(({ id, icon: Icon, labelKey }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="w-full flex items-center h-12 rounded-[14px] text-sm font-semibold transition-all duration-200 cursor-pointer overflow-hidden"
              style={{
                boxShadow: active ? "var(--sh-inset)" : "var(--sh-raised)",
                color: active ? "var(--accent)" : "var(--text-secondary)",
                background: active ? "var(--bg-surface)" : "var(--bg)",
              }}
            >
              <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                <Icon
                  size={19}
                  strokeWidth={active ? 2.5 : 2}
                  style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
                />
              </div>
              <span className="sidebar-text">{t(labelKey)}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Settings & User ── */}
      <div className="mt-auto flex flex-col gap-3">
        {/* Settings Tab */}
        <button
          onClick={() => setActiveTab("settings")}
          className="w-full flex items-center h-12 rounded-[14px] text-sm font-semibold transition-all duration-200 cursor-pointer overflow-hidden"
          style={{
            boxShadow: activeTab === "settings" ? "var(--sh-inset)" : "transparent",
            color: activeTab === "settings" ? "var(--accent)" : "var(--text-secondary)",
            background: activeTab === "settings" ? "var(--bg-surface)" : "transparent",
          }}
        >
          <div className="w-12 h-12 shrink-0 flex items-center justify-center">
            <Settings
              size={19}
              strokeWidth={activeTab === "settings" ? 2.5 : 2}
              style={{ color: activeTab === "settings" ? "var(--accent)" : "var(--text-muted)" }}
            />
          </div>
          <span className="sidebar-text">{t("settings")}</span>
        </button>

        <hr className="neu-divider w-full" />

        {/* User Card */}
        <div
          className="flex items-center h-12 rounded-[14px] overflow-hidden w-full flex-shrink-0"
          style={{ boxShadow: "var(--sh-raised)", background: "var(--bg)" }}
        >
          <div className="w-12 h-12 shrink-0 flex items-center justify-center">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-xs font-bold neu-btn-accent tooltip-trigger z-50">
              {initials}
            </div>
          </div>
          <div className="sidebar-text flex-1 min-w-0 pr-2 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate leading-tight" style={{ color: "var(--text-primary)" }}>
                {user.displayName || user.email?.split("@")[0]}
              </p>
              <p className="text-[10px] truncate leading-tight mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.8 }}>
                {user.email}
              </p>
            </div>
            <button
              onClick={logOut}
              className="p-1.5 rounded-lg hover:opacity-70 transition-opacity shrink-0 ml-1"
              title={t("logout")}
            >
              <LogOut size={14} style={{ color: "var(--danger)" }} />
            </button>
          </div>
        </div>
      </div>
    </aside>
      {/* ── Mobile Bottom Nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-3 rounded-t-3xl rounded-b-none"
        style={{
          background: "var(--bg-surface)",
          boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
          borderTop: "1px solid var(--text-muted)",
          borderColor: "rgba(150,160,180,0.15)",
        }}
      >
        {NAV_ITEMS.map(({ id, icon: Icon, labelKey }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all"
              style={{
                background: active ? "var(--bg)" : "transparent",
                boxShadow: active ? "var(--sh-inset-sm)" : "none",
              }}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
              />
            </button>
          );
        })}
        <button
          onClick={() => setActiveTab("settings")}
          className="flex flex-col items-center justify-center w-14 h-12 rounded-2xl transition-all"
          style={{
            background: activeTab === "settings" ? "var(--bg)" : "transparent",
            boxShadow: activeTab === "settings" ? "var(--sh-inset-sm)" : "none",
          }}
        >
          <Settings
            size={22}
            strokeWidth={activeTab === "settings" ? 2.5 : 2}
            style={{ color: activeTab === "settings" ? "var(--accent)" : "var(--text-muted)" }}
          />
        </button>
      </nav>
    </>
  );
}
