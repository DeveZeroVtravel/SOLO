import { useState } from "react";
import { Task, Event } from "@/types";
import { getOccurrencesInRange, isSameDay } from "@/utils/dateHelpers";
import { useSettings } from "@/context/SettingsContext";
import { CalendarDays, CheckSquare, Clock, RefreshCw } from "lucide-react";
import SwipeCard from "@/components/SwipeCard";
import EditModal from "@/components/EditModal";
import NeuCheckbox from "@/components/NeuCheckbox";

type EditTarget =
  | { type: "task";  item: Task  }
  | { type: "event"; item: Event };

export default function DailyView({ tasks, events, onToggleTask, onDeleteTask, onDeleteEvent, onDataUpdated }: any) {
  const { t } = useSettings();
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const todaysEvents: Event[] = events
    .filter((e: Event) => getOccurrencesInRange(e, today, endOfDay).length > 0)
    .sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const todaysTasks: Task[] = tasks.filter((task: Task) =>
    isSameDay(new Date(task.createdAt), today) || !task.isDone
  );

  return (
    <>
      <main className="space-y-6 pb-36">
        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
            {t("daily")}
          </p>
          <h1 className="text-[28px] font-extrabold" style={{ color: "var(--text-primary)" }}>
            {today.toLocaleDateString("vi-VN", { dateStyle: "full" })}
          </h1>
        </div>

        {/* Events timeline */}
        <section className="neu-card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#3b82f6", boxShadow: "0 4px 14px rgba(59,130,246,.3)" }}>
              <CalendarDays size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <h2 className="text-[13px] uppercase tracking-widest" style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
              {t("eventsToday")}
            </h2>
          </div>

          {todaysEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 rounded-xl"
              style={{ boxShadow: "var(--sh-inset)" }}>
              <CalendarDays size={28} style={{ color: "var(--text-muted)", marginBottom: 8 }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Không có sự kiện hôm nay</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {todaysEvents.map((evt: Event) => (
                <li key={evt.id} className="flex items-stretch gap-3">
                  {/* Time badge */}
                  <div className="shrink-0 w-16 flex items-center justify-end">
                    <div
                      className="text-[11px] font-bold px-2 py-1 rounded-lg text-center leading-tight"
                      style={{ boxShadow: "var(--sh-inset-sm)", background: "var(--bg)", color: "var(--accent)" }}
                    >
                      {new Date(evt.date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="flex-1">
                    <SwipeCard
                      onEdit={() => setEditTarget({ type: "event", item: evt })}
                      onDelete={() => evt.id && onDeleteEvent(evt.id)}
                      style={{ borderLeft: "3px solid var(--accent)" }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                          {evt.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {evt.recurrence && evt.recurrence !== "none" && (
                            <>
                              <RefreshCw size={10} style={{ color: "var(--accent)" }} />
                              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Lặp lại</p>
                            </>
                          )}
                        </div>
                      </div>
                    </SwipeCard>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Tasks */}
        <section className="neu-card p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--accent)", boxShadow: "0 4px 14px rgba(34,197,94,.3)" }}>
              <CheckSquare size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <h2 className="text-[13px] uppercase tracking-widest" style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
              {t("tasksToProcess")}
            </h2>
          </div>

          {todaysTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 rounded-xl"
              style={{ boxShadow: "var(--sh-inset)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>🎉 {t("noTasks")}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {todaysTasks.map((task: Task) => (
                <li key={task.id} style={{ opacity: task.isDone ? 0.45 : 1, transition: "opacity .2s" }}>
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
                          }}
                        >
                          {task.title}
                        </p>
                        {task.subtasks && task.subtasks.length > 0 && (
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {task.subtasks.length} công việc con
                          </p>
                        )}
                      </div>
                    </div>
                  </SwipeCard>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <EditModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={onDataUpdated}
      />
    </>
  );
}
