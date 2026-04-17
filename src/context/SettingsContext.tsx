"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
type Language = "vi" | "en";

interface SettingsContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: keyof typeof dictionaries["vi"]) => string;
}

const dictionaries = {
  vi: {
    dashboard: "Thống kê",
    daily: "Lịch Ngày",
    weekly: "Lịch Tuần",
    settings: "Cài đặt",
    logout: "Đăng xuất",
    addManual: "Thêm mới",
    welcome: "Xin chào",
    tasksToProcess: "Nhiệm vụ",
    eventsToday: "Sự kiện hôm nay",
    upcoming: "Sắp diễn ra",
    noTasks: "Bạn đã hoàn thành mọi việc!",
    noEvents: "Không có sự kiện sắp tới.",
    themeLight: "Chế độ Sáng",
    themeDark: "Chế độ Tối",
    langVi: "Tiếng Việt",
    langEn: "Tiếng Anh",
    settingsTitle: "Cài đặt & Giao diện",
    processing: "Đang xử lý...",
    send: "Gửi",
    delete: "Xoá",
    typeNote: "Nhập công việc hoặc sự kiện bằng ngôn ngữ tự nhiên...",
    taskDist: "Mật độ 7 ngày qua",
    task: "Nhiệm vụ",
    event: "Sự kiện"
  },
  en: {
    dashboard: "Dashboard",
    daily: "Daily View",
    weekly: "Weekly View",
    settings: "Settings",
    logout: "Logout",
    addManual: "Add New",
    welcome: "Hello",
    tasksToProcess: "Tasks",
    eventsToday: "Today's Events",
    upcoming: "Upcoming",
    noTasks: "All tasks caught up!",
    noEvents: "No upcoming events.",
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    langVi: "Vietnamese",
    langEn: "English",
    settingsTitle: "Settings & Appearance",
    processing: "Processing...",
    send: "Send",
    delete: "Delete",
    typeNote: "Type a task or event in natural language...",
    taskDist: "Workload (7 days)",
    task: "Task",
    event: "Event"
  }
};

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("light");
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    const savedLang = localStorage.getItem("language") as Language;
    
    if (savedTheme) {
      setThemeState(savedTheme);
      if (savedTheme === "dark") document.documentElement.classList.add("dark");
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeState("dark");
      document.documentElement.classList.add("dark");
    }

    if (savedLang) {
      setLanguageState(savedLang);
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    localStorage.setItem("language", l);
  };

  const t = (key: keyof typeof dictionaries["vi"]) => {
    return dictionaries[language][key] || dictionaries["vi"][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
};
