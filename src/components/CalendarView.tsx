"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Task, Event } from "@/types";
import { getOccurrencesInRange, getStartOfWeek } from "@/utils/dateHelpers";
import { ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Trash2, Calendar } from "lucide-react";
import EditModal from "@/components/EditModal";
import NeuCheckbox from "@/components/NeuCheckbox";

/* ─── constants ─────────────────────────────────────────── */
const HOUR_H   = 64;   // px per hour
const START_H  = 6;    // 6 AM
const END_H    = 23;   // 11 PM
const HOURS    = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);

/* ─── event colour palette ───────────────────────────────── */
const PALETTES = [
  { bg: "rgba(34,197,94,.13)",  border: "#22c55e", text: "#16a34a" },
  { bg: "rgba(59,130,246,.13)", border: "#3b82f6", text: "#2563eb" },
  { bg: "rgba(168,85,247,.13)", border: "#a855f7", text: "#9333ea" },
  { bg: "rgba(249,115,22,.13)", border: "#f97316", text: "#ea580c" },
  { bg: "rgba(236,72,153,.13)", border: "#ec4899", text: "#db2777" },
];

function palette(id = "") {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return PALETTES[Math.abs(h) % PALETTES.length];
}

/* ─── helpers ────────────────────────────────────────────── */
function dayStart(d: Date) {
  const r = new Date(d); r.setHours(0,0,0,0); return r;
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

/* ─── types ──────────────────────────────────────────────── */
type Mode = "day" | "week";
type EditTarget = { type: "task"; item: Task } | { type: "event"; item: Event };

/* ─── MiniCalendar (date picker popup) ──────────────────── */
const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function MiniCalendar({
  mode, anchor, onChange, onClose,
}: {
  mode: Mode;
  anchor: Date;
  onChange: (d: Date) => void;
  onClose: () => void;
}) {
  const [view, setView] = useState(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", fn), 0);
    return () => document.removeEventListener("mousedown", fn);
  }, [onClose]);

  const year  = view.getFullYear();
  const month = view.getMonth();
  const firstDay  = new Date(year, month, 1).getDay(); // 0=Sun
  const daysCount = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  // grid cells: fill leading blanks then days
  const cells: Array<Date | null> = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => new Date(year, month, i + 1)),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const today = dayStart(new Date());

  // week that anchor sits in (Monday-based)
  const anchorWeekStart = getStartOfWeek(anchor);

  const isInSelectedWeek = (d: Date) => {
    if (mode !== "week") return false;
    const ws = getStartOfWeek(d);
    return ws.getTime() === anchorWeekStart.getTime();
  };

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-2 z-[100] rounded-[18px] p-4 select-none"
      style={{
        background: "var(--bg)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)",
        minWidth: 280,
      }}
    >
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ boxShadow: "var(--sh-raised)", background: "var(--bg)" }}
        >
          <ChevronLeft size={13} style={{ color: "var(--text-secondary)" }} />
        </button>
        <span className="text-[13px] font-extrabold" style={{ color: "var(--text-primary)" }}>
          {view.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ boxShadow: "var(--sh-raised)", background: "var(--bg)" }}
        >
          <ChevronRight size={13} style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] font-semibold py-1" style={{ color: "var(--text-muted)" }}>
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isToday   = sameDay(d, today);
          const isAnchor  = mode === "day" && sameDay(d, anchor);
          const inWeek    = mode === "week" && isInSelectedWeek(d);
          const isSun     = d.getDay() === 0;
          const isSat     = d.getDay() === 6;

          return (
            <button
              key={i}
              onClick={() => {
                // for week mode, navigate to Monday of the clicked day's week
                if (mode === "week") {
                  onChange(getStartOfWeek(d));
                } else {
                  onChange(dayStart(d));
                }
                onClose();
              }}
              className="flex items-center justify-center rounded-full w-8 h-8 mx-auto text-[12px] font-semibold transition-all"
              style={{
                background: isAnchor || isToday
                  ? "var(--accent)"
                  : inWeek
                    ? "rgba(34,197,94,.15)"
                    : "transparent",
                color: isAnchor || isToday
                  ? "#fff"
                  : inWeek
                    ? "var(--accent)"
                    : d.getMonth() !== month
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                fontWeight: isToday && !isAnchor ? 800 : undefined,
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {/* Footer shortcut */}
      <button
        onClick={() => { onChange(today); onClose(); }}
        className="w-full mt-3 py-2 rounded-[10px] text-[12px] font-semibold"
        style={{ boxShadow: "var(--sh-inset)", color: "var(--accent)" }}
      >
        Hôm nay
      </button>
    </div>
  );
}

/* ─── CalendarEvent card ─────────────────────────────────── */
function EventCard({
  evt, top, height, col, cols,
  onEdit, onDelete,
}: {
  evt: Event; top: number; height: number;
  col?: number; cols?: number;
  onEdit: () => void; onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const p = palette(evt.id);
  const colIdx = col ?? 0;
  const colTotal = cols ?? 1;
  const w = `${100 / colTotal}%`;
  const l = `${(colIdx / colTotal) * 100}%`;

  return (
    <div
      className="absolute rounded-[10px] overflow-hidden cursor-pointer select-none group"
      style={{
        top, height: Math.max(height, 26),
        left: l, width: w,
        paddingLeft: 2, paddingRight: 2,
        paddingTop: 1, paddingBottom: 1,
        zIndex: menu ? 30 : 10,
      }}
    >
      <div
        className="w-full h-full rounded-[9px] px-2 py-1 flex flex-col justify-between relative"
        style={{ background: p.bg, borderLeft: `3px solid ${p.border}` }}
      >
        <div className="min-w-0">
          <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: p.text }}>
            {evt.title}
          </p>
          <p className="text-[10px] font-medium leading-tight mt-0.5" style={{ color: p.text, opacity: 0.75 }}>
            {new Date(evt.date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* 3-dot menu */}
        <button
          className="absolute top-1 right-1 w-5 h-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: p.bg }}
          onClick={(e) => { e.stopPropagation(); setMenu(!menu); }}
        >
          <MoreHorizontal size={12} style={{ color: p.text }} />
        </button>

        {menu && (
          <div
            className="absolute right-0 top-6 z-50 rounded-[12px] overflow-hidden py-1 min-w-[110px]"
            style={{
              background: "var(--bg)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium hover:bg-blue-500/10 transition-colors"
              style={{ color: "#3b82f6" }}
              onClick={() => { setMenu(false); onEdit(); }}
            >
              <Pencil size={12} /> Chỉnh sửa
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium hover:bg-red-500/10 transition-colors"
              style={{ color: "var(--danger)" }}
              onClick={() => { setMenu(false); onDelete(); }}
            >
              <Trash2 size={12} /> Xoá
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── TaskCard (formerly TaskChip) ───────────────────────── */
function TaskChip({
  task, onToggle, onDelete,
}: {
  task: Task; onToggle: () => void; onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <div
      className="flex items-start gap-2 p-2 w-full rounded-[12px] group relative transition-all"
      style={{
        background: "var(--bg)",
        boxShadow: task.isDone ? "var(--sh-inset)" : "var(--sh-raised)",
        opacity: task.isDone ? 0.5 : 1,
      }}
    >
      <div className="shrink-0 mt-[1px]">
        <NeuCheckbox checked={task.isDone} onChange={onToggle} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span
          className="truncate leading-tight font-bold text-[12px]"
          style={{
            color: "var(--text-primary)",
            textDecoration: task.isDone ? "line-through" : "none"
          }}
        >
          {task.title}
        </span>
        {task.content && task.content !== "Thêm thủ công" && (
          <span className="truncate leading-tight text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {task.content}
          </span>
        )}
      </div>
      <button
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1"
        onClick={(e) => { e.stopPropagation(); setMenu(!menu); }}
      >
        <MoreHorizontal size={14} style={{ color: "var(--text-muted)" }} />
      </button>
      {menu && (
        <div
          className="absolute top-full right-0 mt-1 z-[100] rounded-[12px] overflow-hidden py-1 min-w-[120px]"
          style={{ background: "var(--bg)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium hover:bg-red-500/10"
            style={{ color: "var(--danger)" }}
            onClick={() => { setMenu(false); onDelete(); }}
          >
            <Trash2 size={12} /> Xoá
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── TimeColumn ─────────────────────────────────────────── */
function TimeColumn() {
  return (
    <div className="shrink-0 w-14 relative" style={{ height: HOURS.length * HOUR_H }}>
      {HOURS.map((h) => (
        <div
          key={h}
          className="absolute w-full text-right pr-2"
          style={{ top: (h - START_H) * HOUR_H - 8, height: HOUR_H }}
        >
          <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
            {h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── GridLines ──────────────────────────────────────────── */
function GridLines() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {HOURS.map((h) => (
        <div
          key={h}
          className="absolute w-full"
          style={{
            top: (h - START_H) * HOUR_H,
            height: 1,
            background: "var(--text-muted)",
            opacity: 0.12,
          }}
        />
      ))}
    </div>
  );
}

/* ─── CurrentTimeLine ────────────────────────────────────── */
function CurrentTimeLine() {
  const [top, setTop] = useState<number | null>(null);
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const mins = (now.getHours() - START_H) * 60 + now.getMinutes();
      setTop((mins / 60) * HOUR_H);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, []);
  if (top === null || top < 0 || top > HOURS.length * HOUR_H) return null;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top }}>
      <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)", marginLeft: -4 }} />
      <div className="flex-1 h-[1.5px]" style={{ background: "var(--accent)" }} />
    </div>
  );
}

/* ─── DayColumn ──────────────────────────────────────────── */
function DayColumn({
  date, events, isToday,
  onEditEvent, onDeleteEvent,
}: {
  date: Date; events: Event[]; isToday: boolean;
  onEditEvent: (e: Event) => void; onDeleteEvent: (id: string) => void;
}) {
  // position events, detect overlaps
  const positioned = events.map((evt) => {
    const d = new Date(evt.date);
    const mins = (d.getHours() - START_H) * 60 + d.getMinutes();
    return { evt, top: (mins / 60) * HOUR_H, h: HOUR_H }; // 1hr default
  });

  // simple overlap grouping
  const groups: typeof positioned[] = [];
  const used = new Set<number>();
  positioned.forEach((p, i) => {
    if (used.has(i)) return;
    const grp = [p];
    used.add(i);
    for (let j = i + 1; j < positioned.length; j++) {
      if (!used.has(j)) {
        const q = positioned[j];
        if (q.top < p.top + p.h && q.top + q.h > p.top) {
          grp.push(q); used.add(j);
        }
      }
    }
    groups.push(grp);
  });

  return (
    <div
      className="relative flex-1"
      style={{
        height: HOURS.length * HOUR_H,
        background: isToday ? "rgba(34,197,94,.03)" : "transparent",
        borderRight: "1px solid rgba(128, 128, 128, 0.1)",
      }}
    >
      <GridLines />
      {isToday && <CurrentTimeLine />}
      {groups.map((grp, gi) =>
        grp.map((item, ci) => (
          <EventCard
            key={item.evt.id}
            evt={item.evt}
            top={item.top}
            height={item.h}
            col={ci}
            cols={grp.length}
            onEdit={() => onEditEvent(item.evt)}
            onDelete={() => item.evt.id && onDeleteEvent(item.evt.id)}
          />
        ))
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main CalendarView
═══════════════════════════════════════════════════════════ */
export default function CalendarView({
  initialMode = "day",
  tasks, events,
  onToggleTask, onDeleteTask, onDeleteEvent, onDataUpdated,
}: {
  initialMode?: Mode;
  tasks: Task[]; events: Event[];
  onToggleTask: (t: Task) => void;
  onDeleteTask: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onDataUpdated: () => void;
}) {
  const [mode, setMode]       = useState<Mode>(initialMode);
  const [anchor, setAnchor]   = useState(() => dayStart(new Date()));
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const gridRef = useRef<HTMLDivElement>(null);
  const pickerAnchorRef = useRef<HTMLDivElement>(null);

  const toggleExpandDay = (idx: number) => {
    setExpandedDays(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handlePickerChange = useCallback((d: Date) => {
    setAnchor(d);
  }, []);

  const handlePickerClose = useCallback(() => setShowPicker(false), []);

  // scroll to current time on mount
  useEffect(() => {
    const now = new Date();
    const top = ((now.getHours() - START_H - 1) / HOUR_H) * HOUR_H * HOUR_H;
    gridRef.current?.scrollTo({ top: Math.max(0, (now.getHours() - START_H - 1) * HOUR_H), behavior: "smooth" });
  }, []);

  /* navigation */
  const prev = () => setAnchor((d) => addDays(d, mode === "day" ? -1 : -7));
  const next = () => setAnchor((d) => addDays(d, mode === "day" ?  1 :  7));
  const toToday = () => setAnchor(dayStart(new Date()));

  /* days to render */
  const days = mode === "day"
    ? [anchor]
    : Array.from({ length: 7 }, (_, i) => addDays(getStartOfWeek(anchor), i));

  /* events for a day */
  const eventsForDay = (d: Date) => {
    const end = new Date(d); end.setHours(23, 59, 59, 999);
    return events.filter((e) => getOccurrencesInRange(e, d, end).length > 0);
  };

  /* tasks for a day (by t.date or createdAt) */
  const tasksForDay = (d: Date) =>
    tasks.filter((t) => {
      if (t.date && t.date.trim() !== "") return sameDay(new Date(t.date), d);
      return (!t.isDone && sameDay(today, d)) || sameDay(new Date(t.createdAt), d);
    });

  /* header date label */
  const headerLabel = mode === "day"
    ? anchor.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : `${days[0].toLocaleDateString("vi-VN", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" })}`;

  const today = dayStart(new Date());

  return (
    <>
      <div className="flex flex-col h-full pb-28 min-w-0">

        {/* ── Top bar ── */}
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          {/* Nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={prev}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ boxShadow: "var(--sh-raised)", background: "var(--bg)" }}
            >
              <ChevronLeft size={15} style={{ color: "var(--text-secondary)" }} />
            </button>
            <button
              onClick={next}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ boxShadow: "var(--sh-raised)", background: "var(--bg)" }}
            >
              <ChevronRight size={15} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

          {/* Date label + picker trigger */}
          <div className="flex items-center gap-3 flex-1 min-w-0 relative" ref={pickerAnchorRef}>
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="flex items-center gap-2 group min-w-0"
            >
              <h1 className="text-[17px] md:text-xl font-extrabold truncate text-left" style={{ color: "var(--text-primary)" }}>
                {headerLabel}
              </h1>
              <Calendar
                size={15}
                className="shrink-0 transition-colors"
                style={{ color: showPicker ? "var(--accent)" : "var(--text-muted)" }}
              />
            </button>

            {showPicker && (
              <MiniCalendar
                mode={mode}
                anchor={anchor}
                onChange={handlePickerChange}
                onClose={handlePickerClose}
              />
            )}

            {!sameDay(anchor, today) && (
              <button
                onClick={toToday}
                className="hidden md:block text-[11px] font-semibold px-3 py-1 rounded-lg shrink-0"
                style={{ boxShadow: "var(--sh-raised)", color: "var(--accent)", background: "var(--bg)" }}
              >
                Hôm nay
              </button>
            )}
          </div>

          {/* Day / Week toggle */}
          <div
            className="flex p-1 rounded-[12px] shrink-0"
            style={{ boxShadow: "var(--sh-inset)" }}
          >
            {(["day", "week"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="px-3 md:px-4 py-1.5 rounded-[9px] text-[11px] md:text-xs font-semibold transition-all duration-200"
                style={{
                  background: mode === m ? "var(--bg)" : "transparent",
                  boxShadow: mode === m ? "var(--sh-raised)" : "none",
                  color: mode === m ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {m === "day" ? "Ngày" : "Tuần"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable Horizontal Wrapper (Mobile) ── */}
        <div className="flex-1 w-full overflow-x-auto overflow-y-hidden min-w-0" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <div className="flex flex-col h-full" style={{ minWidth: mode === "week" ? "900px" : "100%" }}>

            {/* ── Column headers ── */}
            <div className="flex shrink-0 mb-1 relative">
              <div className="sticky left-0 z-20 w-14 shrink-0" style={{ background: "var(--bg)" }} />
              {days.map((d, i) => {
                const isToday = sameDay(d, today);
                return (
                  <div key={i} className="flex-1 text-center pb-2" style={{ borderRight: "1px solid transparent" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      {d.toLocaleDateString("vi-VN", { weekday: "short" })}
                    </p>
                    <div
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full mt-0.5 text-sm font-extrabold"
                      style={{
                        background: isToday ? "var(--accent)" : "transparent",
                        color: isToday ? "#fff" : "var(--text-primary)",
                        boxShadow: isToday ? "0 4px 12px rgba(34,197,94,.35)" : "none",
                      }}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Task chips row (multi-column) ── */}
            <div className="flex shrink-0 mb-3 relative">
              <div className="sticky left-0 z-20 w-14 shrink-0" style={{ background: "var(--bg)" }} />
              {days.map((d, i) => {
                const dayTasks = tasksForDay(d);
                const isExpanded = !!expandedDays[i];
                const visibleTasks = isExpanded ? dayTasks : dayTasks.slice(0, 5);

                return (
                  <div key={i} className="flex-1 px-2 flex flex-col gap-2 relative z-10" style={{ borderRight: "1px solid rgba(128, 128, 128, 0.05)", minHeight: dayTasks.length ? 30 : 0 }}>
                    {visibleTasks.map((t) => (
                      <TaskChip
                        key={t.id}
                        task={t}
                        onToggle={() => onToggleTask(t)}
                        onDelete={() => t.id && onDeleteTask(t.id)}
                      />
                    ))}
                    {dayTasks.length > 5 && (
                      <button
                        onClick={() => toggleExpandDay(i)}
                        className="text-[10px] text-center font-bold mt-1 py-1 px-2 rounded-lg hover:bg-black/5"
                        style={{ color: "var(--accent)" }}
                      >
                        {isExpanded ? "Thu gọn" : `+ ${dayTasks.length - 5} mục khác`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Scrollable grid ── */}
            <div
              ref={gridRef}
              className="flex-1 overflow-y-auto relative"
              style={{ scrollbarWidth: "none" }}
            >
              <div className="flex" style={{ minHeight: HOURS.length * HOUR_H + 40 }}>
                <div className="sticky left-0 z-20 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]" style={{ background: "var(--bg)" }}>
                  <TimeColumn />
                </div>
                <div style={{ width: 1, background: "var(--text-muted)", opacity: 0.15, flexShrink: 0 }} />
            {/* Day columns */}
                {days.map((d, i) => (
                  <DayColumn
                    key={i}
                    date={d}
                    isToday={sameDay(d, today)}
                    events={eventsForDay(d)}
                    onEditEvent={(e) => setEditTarget({ type: "event", item: e })}
                    onDeleteEvent={onDeleteEvent}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={onDataUpdated}
      />
    </>
  );
}
