"use client";

import { useEffect, useState, useCallback } from "react";
import { useFirebase } from "@/context/FirebaseContext";
import { useSettings } from "@/context/SettingsContext";
import { Task, Event } from "@/types";

import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import CalendarView from "@/components/CalendarView";
import SettingsView from "@/components/SettingsView";
import FloatingAIInput from "@/components/FloatingAIInput";
import ManualEntryModal from "@/components/ManualEntryModal";
import ImportJsonModal from "@/components/ImportJsonModal";
import LoginPage from "@/components/LoginPage";

type TabType = "dashboard" | "daily" | "weekly" | "settings";

export default function Home() {
  const { 
    user, 
    loading, 
    getTasks,
    getEvents, 
    updateTask,
    deleteTask,
    deleteEvent
  } = useFirebase();

  const { t } = useSettings();

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
      
      const fetchedEvents = await getEvents();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Failed to load data", error);
    }
  }, [user, getTasks, getEvents]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const handleToggleTask = async (task: Task) => {
    if (!task.id) return;
    try {
      const newIsDone = !task.isDone;
      setTasks(tasks.map(t => t.id === task.id ? { ...t, isDone: newIsDone } : t));
      await updateTask(task.id, { isDone: newIsDone });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái:", error);
      await loadData();
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá sự kiện này?")) return;
    try {
      await deleteEvent(id);
      await loadData();
    } catch (error: any) {
      console.error("Lỗi khi xoá sự kiện:", error);
      alert("Lỗi khi xoá sự kiện: " + error.message);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xoá công việc này?")) return;
    try {
      await deleteTask(id);
      await loadData();
    } catch (error: any) {
      console.error("Lỗi khi xoá công việc:", error);
      alert("Lỗi khi xoá công việc: " + error.message);
    }
  };


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-12 h-12 rounded-2xl neu-raised flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row" style={{ background: "var(--bg)" }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 w-full md:w-auto md:ml-[116px] p-4 md:p-6 md:pr-8 pb-32 md:pb-8 min-h-screen overflow-y-auto">
        {activeTab === "dashboard" && (
          <DashboardView tasks={tasks} events={events} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} onDeleteEvent={handleDeleteEvent} onDataUpdated={loadData} />
        )}
        {activeTab === "daily" && (
          <CalendarView initialMode="day" tasks={tasks} events={events} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} onDeleteEvent={handleDeleteEvent} onDataUpdated={loadData} />
        )}
        {activeTab === "weekly" && (
          <CalendarView initialMode="week" tasks={tasks} events={events} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} onDeleteEvent={handleDeleteEvent} onDataUpdated={loadData} />
        )}
        {activeTab === "settings" && <SettingsView />}
      </div>
      <FloatingAIInput onDataUpdated={loadData} />
      <ManualEntryModal onDataUpdated={loadData} />
      <ImportJsonModal onDataUpdated={loadData} />
    </div>
  );
}
