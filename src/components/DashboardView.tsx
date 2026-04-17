import { useState } from "react";
import { Task, Event } from "@/types";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useSettings } from "@/context/SettingsContext";
import { isSameDay, getOccurrencesInRange } from "@/utils/dateHelpers";
import { CheckSquare, Bell, RefreshCw, Clock } from "lucide-react";
import SwipeCard from "@/components/SwipeCard";
import EditModal from "@/components/EditModal";
import NeuCheckbox from "@/components/NeuCheckbox";

type EditTarget =
  | { type: "task";  item: Task  }
  | { type: "event"; item: Event };

function SectionCard({ title, icon: Icon, accentColor = "var(--accent)", children }: any) {
  return (
    <section className="neu-card p-6 flex flex-col gap-4" style={{ minHeight: 240 }}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: accentColor, boxShadow: "0 4px 14px rgba(34,197,94,.3)" }}>
          <Icon size={15} color="#fff" strokeWidth={2.5} />
        </div>
        <h2 className="text-[13px] uppercase tracking-widest" style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="text-xs px-4 py-3 rounded-xl"
      style={{ background: "var(--bg)", boxShadow: "var(--sh-float)", color: "var(--text-primary)" }}>
      <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
}

export default function DashboardView({ tasks, events, onDeleteTask, onToggleTask, onDeleteEvent, onDataUpdated }: any) {
  const { t, theme } = useSettings();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const now = new Date();

  const upcomingEvents: Event[] = events
    .filter((e: Event) => {
      const d = new Date(e.date);
      if (d < now) return false;
      const diff = (d.getTime() - now.getTime()) / 86_400_000;
      return diff <= Math.max(7, e.reminderDays ?? 0);
    })
    .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pendingTasks: Task[] = tasks.filter((t: Task) => !t.isDone);

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return {
      name: d.toLocaleDateString("vi-VN", { weekday: "short" }),
      Tasks: tasks.filter((tk: Task) => isSameDay(new Date(tk.createdAt), d)).length,
      Events: events.filter((e: Event) => getOccurrencesInRange(e, d, end).length > 0).length,
    };
  });

  const axisColor = theme === "dark" ? "#4a5568" : "#9aa5b4";

  const stats = [
    { label: "Chờ xử lý",  value: pendingTasks.length,                    color: "var(--accent)" },
    { label: "Hoàn thành",  value: tasks.filter((t: Task) => t.isDone).length, color: "#3b82f6"   },
    { label: "Sự kiện",     value: events.length,                          color: "#a855f7"        },
  ];

  return (
    <>
      <main className="space-y-6 pb-36">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("vi-VN", { dateStyle: "full" })}
          </p>
          <h1 className="text-[28px] font-extrabold" style={{ color: "var(--text-primary)" }}>{t("dashboard")}</h1>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="neu-card px-5 py-4 flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{s.label}</span>
              <span className="text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <section className="neu-card p-6">
          <p className="text-[13px] uppercase tracking-widest mb-5" style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
            {t("taskDist")}
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTask" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gEvent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={axisColor} strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Tasks"  stroke="#22c55e" strokeWidth={2} fill="url(#gTask)"  />
                <Area type="monotone" dataKey="Events" stroke="#3b82f6" strokeWidth={2} fill="url(#gEvent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Two-col */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Tasks */}
          <SectionCard title={t("tasksToProcess")} icon={CheckSquare}>
            {pendingTasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 rounded-xl"
                style={{ boxShadow: "var(--sh-inset)" }}>
                <span className="text-2xl mb-2">🎉</span>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noTasks")}</p>
              </div>
            ) : (
              <ul className="space-y-2 flex-1">
                {(showAllTasks ? pendingTasks : pendingTasks.slice(0, 5)).map((task: Task) => (
                  <li key={task.id}>
                    <SwipeCard
                      onEdit={() => setEditTarget({ type: "task", item: task })}
                      onDelete={() => task.id && onDeleteTask(task.id)}
                    >
                      <div className="flex items-center gap-3">
                        <NeuCheckbox
                          checked={task.isDone}
                          onChange={() => onToggleTask(task)}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-[13px] font-semibold leading-snug truncate"
                            style={{
                              color: "var(--text-primary)",
                              textDecoration: task.isDone ? "line-through" : "none",
                              opacity: task.isDone ? 0.5 : 1,
                            }}
                          >
                            {task.title}
                          </p>
                          {task.content && task.content !== "Thêm thủ công" && (
                            <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {task.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </SwipeCard>
                  </li>
                ))}
                {pendingTasks.length > 5 && (
                  <button
                    onClick={() => setShowAllTasks(!showAllTasks)}
                    className="w-full text-xs text-center py-2 font-bold hover:bg-black/5 rounded-lg transition-colors"
                    style={{ color: "var(--accent)" }}
                  >
                    {showAllTasks ? "Thu gọn" : `+ ${pendingTasks.length - 5} nhiệm vụ khác`}
                  </button>
                )}
              </ul>
            )}
          </SectionCard>

          {/* Events */}
          <SectionCard title={t("upcoming")} icon={Bell} accentColor="#3b82f6">
            {upcomingEvents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 rounded-xl"
                style={{ boxShadow: "var(--sh-inset)" }}>
                <span className="text-2xl mb-2">📭</span>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("noEvents")}</p>
              </div>
            ) : (
              <ul className="space-y-2 flex-1">
                {upcomingEvents.slice(0, 5).map((evt: Event) => (
                  <li key={evt.id}>
                    <SwipeCard
                      onEdit={() => setEditTarget({ type: "event", item: evt })}
                      onDelete={() => evt.id && onDeleteEvent(evt.id)}
                      style={{ borderLeft: "3px solid #3b82f6" }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold leading-snug truncate" style={{ color: "var(--text-primary)" }}>
                          {evt.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock size={11} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                          <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                            {new Date(evt.date).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                          </p>
                          {evt.recurrence && evt.recurrence !== "none" && (
                            <RefreshCw size={10} style={{ color: "var(--accent)", flexShrink: 0 }} />
                          )}
                        </div>
                      </div>
                    </SwipeCard>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

        </div>
      </main>

      <EditModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={onDataUpdated}
      />
    </>
  );
}
