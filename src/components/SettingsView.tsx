"use client";

import { useSettings } from "@/context/SettingsContext";
import { Sun, Moon, Globe, Check, FileJson } from "lucide-react";

function OptionCard({
  icon: Icon,
  label,
  selected,
  onClick,
  accentColor = "var(--accent)",
}: {
  icon: React.ElementType;
  label: string;
  selected: boolean;
  onClick: () => void;
  accentColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-2.5 py-7 rounded-[18px] font-semibold text-sm transition-all duration-200 cursor-pointer w-full"
      style={{
        boxShadow: selected ? "var(--sh-inset)" : "var(--sh-raised)",
        background: "var(--bg)",
        color: selected ? accentColor : "var(--text-secondary)",
      }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
        style={{
          background: selected ? accentColor : "var(--bg)",
          boxShadow: selected
            ? `0 4px 16px ${accentColor}55`
            : "var(--sh-raised)",
        }}
      >
        <Icon size={20} color={selected ? "#fff" : "var(--text-muted)"} strokeWidth={2} />
      </div>
      <span>{label}</span>
      {selected && (
        <div
          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: accentColor }}
        >
          <Check size={11} color="#fff" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

export default function SettingsView() {
  const { theme, setTheme, language, setLanguage, t } = useSettings();

  return (
    <main className="space-y-6 pb-36">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
          Cá nhân hoá
        </p>
        <h1 className="text-[28px] font-extrabold" style={{ color: "var(--text-primary)" }}>
          {t("settingsTitle")}
        </h1>
      </div>

      {/* Theme */}
      <section className="neu-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sun size={16} style={{ color: "var(--accent)" }} />
          <h2
            className="text-[13px] font-700 uppercase tracking-widest"
            style={{ color: "var(--text-secondary)", fontWeight: 700 }}
          >
            Giao diện
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <OptionCard
            icon={Sun}
            label={t("themeLight")}
            selected={theme === "light"}
            onClick={() => setTheme("light")}
            accentColor="#f59e0b"
          />
          <OptionCard
            icon={Moon}
            label={t("themeDark")}
            selected={theme === "dark"}
            onClick={() => setTheme("dark")}
            accentColor="#6366f1"
          />
        </div>
      </section>

      {/* Language */}
      <section className="neu-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={16} style={{ color: "var(--accent)" }} />
          <h2
            className="text-[13px] font-700 uppercase tracking-widest"
            style={{ color: "var(--text-secondary)", fontWeight: 700 }}
          >
            Ngôn ngữ
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <OptionCard
            icon={Globe}
            label={t("langVi")}
            selected={language === "vi"}
            onClick={() => setLanguage("vi")}
          />
          <OptionCard
            icon={Globe}
            label={t("langEn")}
            selected={language === "en"}
            onClick={() => setLanguage("en")}
          />
        </div>
      </section>

      {/* Import JSON */}
      <section className="neu-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileJson size={16} style={{ color: "#6366f1" }} />
          <h2
            className="text-[13px] font-700 uppercase tracking-widest"
            style={{ color: "var(--text-secondary)", fontWeight: 700 }}
          >
            {language === "en" ? "Import data" : "Nhập dữ liệu"}
          </h2>
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {language === "en"
            ? "Import a set of events & tasks from a custom JSON file."
            : "Nhập hàng loạt sự kiện & nhiệm vụ từ file JSON tuỳ chỉnh."}
        </p>
        <button
          onClick={() => window.dispatchEvent(new Event("open-import-json-modal"))}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-[14px] text-sm font-semibold transition-all cursor-pointer"
          style={{
            boxShadow: "var(--sh-raised)",
            background: "var(--bg)",
            color: "#6366f1",
          }}
        >
          <FileJson size={18} strokeWidth={2} />
          {language === "en" ? "Import from JSON file" : "Nhập từ file JSON"}
        </button>
      </section>
    </main>
  );
}
