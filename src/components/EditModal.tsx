"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/context/FirebaseContext";
import { Task, Event } from "@/types";
import { X, AlignLeft, Calendar, Clock, RepeatIcon, Bell, Trash2 } from "lucide-react";

type EditTarget =
  | { type: "task";  item: Task  }
  | { type: "event"; item: Event };

interface EditModalProps {
  target: EditTarget | null;
  onClose: () => void;
  onSaved: () => void;
}

type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";

const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: "none",    label: "Không lặp"  },
  { value: "daily",   label: "Hằng ngày"  },
  { value: "weekly",  label: "Hằng tuần"  },
  { value: "monthly", label: "Hằng tháng" },
  { value: "yearly",  label: "Hằng năm"   },
];

function FieldLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
      <Icon size={11} /> {children}
    </label>
  );
}

export default function EditModal({ target, onClose, onSaved }: EditModalProps) {
  const { updateTask, updateEvent, deleteTask, deleteEvent } = useFirebase();

  const [title, setTitle]           = useState("");
  const [date,  setDate]            = useState("");
  const [time,  setTime]            = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [reminderDays, setReminder] = useState(0);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (!target) return;
    setTitle(target.item.title ?? "");
    if (target.type === "event") {
      const d = new Date(target.item.date);
      setDate(d.toISOString().slice(0, 10));
      setTime(d.toTimeString().slice(0, 5));
      setRecurrence((target.item.recurrence as Recurrence) ?? "none");
      setReminder(target.item.reminderDays ?? 0);
    }
  }, [target]);

  if (!target) return null;

  const handleDelete = async () => {
    if (!target.item.id) return;
    if (!confirm("Bạn có chắc muốn xoá?")) return;
    setSaving(true);
    try {
      if (target.type === "task") {
        await deleteTask(target.item.id);
      } else {
        await deleteEvent(target.item.id);
      }
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !target.item.id) return;
    setSaving(true);
    try {
      if (target.type === "task") {
        await updateTask(target.item.id, { title });
      } else {
        const iso = new Date(`${date}T${time || "00:00"}:00`).toISOString();
        await updateEvent(target.item.id, {
          title,
          date: iso,
          recurrence: recurrence || "none",
          reminderDays: reminderDays ?? 0,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-7 space-y-5 rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
            Chỉnh sửa {target.type === "task" ? "nhiệm vụ" : "sự kiện"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center neu-raised"
          >
            <X size={14} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Title */}
        <div>
          <FieldLabel icon={AlignLeft}>Tiêu đề</FieldLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-[12px] text-sm focus:outline-none"
            style={{ boxShadow: "var(--sh-inset)", background: "var(--bg)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Event-only fields */}
        {target.type === "event" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel icon={Calendar}>Ngày</FieldLabel>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-3 rounded-[12px] text-sm focus:outline-none"
                  style={{ boxShadow: "var(--sh-inset)", background: "var(--bg)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <FieldLabel icon={Clock}>Giờ</FieldLabel>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-3 rounded-[12px] text-sm focus:outline-none"
                  style={{ boxShadow: "var(--sh-inset)", background: "var(--bg)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <div>
              <FieldLabel icon={RepeatIcon}>Lặp lại</FieldLabel>
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

            <div>
              <FieldLabel icon={Bell}>Nhắc trước (ngày)</FieldLabel>
              <input
                type="number"
                min={0}
                value={reminderDays}
                onChange={(e) => setReminder(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-[12px] text-sm focus:outline-none"
                style={{ boxShadow: "var(--sh-inset)", background: "var(--bg)", color: "var(--text-primary)" }}
              />
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="w-12 py-3 rounded-[12px] flex items-center justify-center transition-all bg-red-500/10 hover:bg-red-500/20"
            style={{ color: "var(--danger)" }}
            title="Xoá"
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-[12px] text-sm font-semibold neu-raised"
            style={{ color: "var(--text-secondary)" }}
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 py-3 rounded-[12px] text-sm font-semibold neu-btn-accent"
          >
            {saving ? "Đang xử lý…" : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
