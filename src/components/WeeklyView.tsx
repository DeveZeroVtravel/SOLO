import { Event } from "@/types";
import { getOccurrencesInRange, getStartOfWeek } from "@/utils/dateHelpers";
import { useSettings } from "@/context/SettingsContext";
import { CalendarRange, Clock, RefreshCw } from "lucide-react";

const DAY_LABELS_VI = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const DAY_LABELS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md"
      style={{ background: color + "22", color }}
    >
      {children}
    </span>
  );
}

export default function WeeklyView({ events }: { events: Event[] }) {
  const { language } = useSettings();
  const labels = language === "en" ? DAY_LABELS_EN : DAY_LABELS_VI;

  const startOfWeek = getStartOfWeek(new Date());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const EVENT_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4"];

  return (
    <main className="space-y-6 pb-36">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
          {startOfWeek.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
        </p>
        <h1 className="text-[28px] font-extrabold" style={{ color: "var(--text-primary)" }}>
          Lịch Tuần
        </h1>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day, idx) => {
          const dayStart = new Date(day); dayStart.setHours(0,0,0,0);
          const dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);

          const dayEvents: Event[] = events.filter((e: Event) =>
            getOccurrencesInRange(e, dayStart, dayEnd).length > 0
          );

          const isToday = +dayStart === +today;

          return (
            <div
              key={idx}
              className="rounded-[18px] p-3 flex flex-col gap-2 min-h-[260px]"
              style={{
                boxShadow: isToday ? "var(--sh-card)" : "var(--sh-raised)",
                background: "var(--bg)",
                borderTop: isToday ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              {/* Day header */}
              <div className="text-center mb-1">
                <p
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: isToday ? "var(--accent)" : "var(--text-muted)" }}
                >
                  {labels[idx]}
                </p>
                <p
                  className="text-xl font-extrabold leading-tight mt-0.5"
                  style={{
                    color: isToday ? "var(--accent)" : "var(--text-primary)",
                  }}
                >
                  {day.getDate()}
                </p>
              </div>

              <div className="flex-1 space-y-1.5">
                {dayEvents.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full" style={{ background: "var(--text-muted)", opacity: 0.4 }} />
                  </div>
                ) : (
                  dayEvents.map((evt: Event, ei) => {
                    const color = EVENT_COLORS[ei % EVENT_COLORS.length];
                    return (
                      <div
                        key={evt.id}
                        className="px-2 py-1.5 rounded-[8px] text-left"
                        style={{
                          boxShadow: "var(--sh-inset-sm)",
                          background: "var(--bg)",
                          borderLeft: `2px solid ${color}`,
                        }}
                      >
                        <p className="text-[10px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {evt.title}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock size={9} style={{ color: "var(--text-muted)" }} />
                          <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                            {new Date(evt.date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {evt.recurrence && evt.recurrence !== "none" && (
                            <RefreshCw size={9} style={{ color }} />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
