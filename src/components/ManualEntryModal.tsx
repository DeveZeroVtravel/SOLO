"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/context/FirebaseContext";
import { useSettings } from "@/context/SettingsContext";
import { X, AlignLeft, Calendar, RepeatIcon, Bell } from "lucide-react";

type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";

const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: "none", label: "Không lặp" },
  { value: "daily", label: "Hằng ngày" },
  { value: "weekly", label: "Hằng tuần" },
  { value: "monthly", label: "Hằng tháng" },
  { value: "yearly", label: "Hằng năm" },
];

export default function ManualEntryModal({ onDataUpdated }: { onDataUpdated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { addTask, addEvent, user } = useFirebase();
  const { t } = useSettings();

  const [type, setType] = useState<"task" | "event">("task");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [reminderDays, setReminderDays] = useState(0);

  useEffect(() => {
    const fn = () => setIsOpen(true);
    window.addEventListener("open-manual-modal", fn);
    return () => window.removeEventListener("open-manual-modal", fn);
  }, []);

  const reset = () => {
    setTitle(""); setDate(""); setTime(""); setRecurrence("none"); setReminderDays(0); setType("task");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    try {
      if (type === "task") {
        await addTask({ title, isDone: false, content: "Thêm thủ công" });
      } else {
        const iso = new Date(`${date}T${time || "00:00"}:00`).toISOString();
        await addEvent({ title, date: iso, recurrence: recurrence !== "none" ? recurrence : undefined, reminderDays, content: "Thêm thủ công" });
      }
      onDataUpdated();
      setIsOpen(false);
      reset();
    } catch (err) { console.error(err); alert("Có lỗi khi lưu!"); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
      <div
        className="w-full max-w-md p-7 relative rounded-[24px]"
        style={{
          background: "var(--bg)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)",
        }}
      >
        {/* Close */}
        <button
          onClick={() => { setIsOpen(false); reset(); }}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl flex items-center justify-center neu-raised"
        >
          <X size={15} style={{ color: "var(--text-muted)" }} />
        </button>

        <h2 className="text-xl font-extrabold mb-6" style={{ color: "var(--text-primary)" }}>
          Thêm mới thủ công
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-3 p-1 rounded-xl" style={{ boxShadow: "var(--sh-inset)" }}>
            {(["task", "event"] as const).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setType(tp)}
                className="py-2.5 rounded-[10px] text-sm font-semibold transition-all"
                style={{
                  boxShadow: type === tp ? "var(--sh-raised)" : "none",
                  background: type === tp ? "var(--bg)" : "transparent",
                  color: type === tp ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {tp === "task" ? "Nhiệm vụ" : "Sự kiện"}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              <AlignLeft size={12} /> Tiêu đề
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{ boxShadow: "var(--sh-inset)", background: "var(--bg)", color: "var(--text-primary)" }}
            />
          </div>

          {type === "event" && (
            <>
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    <Calendar size={12} /> Ngày
                  </label>
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ boxShadow: "var(--sh-inset)", background: "var(--bg)", color: "var(--text-primary)" }}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                    Giờ
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ boxShadow: "var(--sh-inset)", background: "var(--bg)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              {/* Recurrence */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                  <RepeatIcon size={12} /> Lặp lại
                </label>
                <div className="flex flex-wrap gap-2">
                  {RECURRENCES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRecurrence(r.value)}
                      className="px-3 py-1.5 rounded-[8px] text-xs font-medium transition-all"
                      style={{
                        boxShadow: recurrence === r.value ? "var(--sh-inset)" : "var(--sh-raised)",
                        color: recurrence === r.value ? "var(--accent)" : "var(--text-secondary)",
                        background: "var(--bg)",
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminder */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                  <Bell size={12} /> Nhắc trước (ngày)
                </label>
                <input
                  type="number"
                  min="0"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ boxShadow: "var(--sh-inset)", background: "var(--bg)", color: "var(--text-primary)" }}
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setIsOpen(false); reset(); }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all neu-raised"
              style={{ color: "var(--text-secondary)" }}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl text-sm font-semibold neu-btn-accent"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
