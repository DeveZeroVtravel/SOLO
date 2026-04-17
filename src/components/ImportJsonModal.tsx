"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useFirebase } from "@/context/FirebaseContext";
import { useSettings } from "@/context/SettingsContext";
import {
  X,
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Loader,
  CalendarDays,
  ListChecks,
  Trash2,
} from "lucide-react";

interface ImportTask {
  title: string;
  content?: string;
  subtasks?: string[];
  isDone?: boolean;
  date?: string;
}

interface ImportEvent {
  title: string;
  content?: string;
  date: string;
  recurrence?: "none" | "daily" | "weekly" | "monthly" | "yearly";
  reminderDays?: number;
}

interface ImportPayload {
  tasks?: ImportTask[];
  events?: ImportEvent[];
}

type ImportStatus = "idle" | "previewing" | "importing" | "done" | "error";

export default function ImportJsonModal({
  onDataUpdated,
}: {
  onDataUpdated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [payload, setPayload] = useState<ImportPayload | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [importedCounts, setImportedCounts] = useState({ tasks: 0, events: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addTask, addEvent, user } = useFirebase();
  const { language } = useSettings();

  const txt = {
    vi: {
      title: "Nhập từ file JSON",
      dropText: "Kéo thả file JSON vào đây",
      orText: "hoặc",
      browse: "Chọn file",
      formatHint: "Định dạng hỗ trợ: { tasks: [...], events: [...] }",
      preview: "Xem trước dữ liệu",
      tasks: "Nhiệm vụ",
      events: "Sự kiện",
      import: "Nhập dữ liệu",
      importing: "Đang nhập...",
      cancel: "Huỷ",
      done: "Hoàn tất!",
      importedMsg: "Đã nhập thành công",
      close: "Đóng",
      noData: "File JSON không chứa tasks hoặc events hợp lệ.",
      invalidJson: "File JSON không hợp lệ.",
      missingTitle: "thiếu tiêu đề",
      missingDate: "thiếu ngày",
      clear: "Xoá",
      errorsFound: "Một số lỗi được phát hiện:",
      taskCount: "nhiệm vụ",
      eventCount: "sự kiện",
    },
    en: {
      title: "Import from JSON",
      dropText: "Drag & drop a JSON file here",
      orText: "or",
      browse: "Browse file",
      formatHint: "Format: { tasks: [...], events: [...] }",
      preview: "Data preview",
      tasks: "Tasks",
      events: "Events",
      import: "Import data",
      importing: "Importing...",
      cancel: "Cancel",
      done: "Done!",
      importedMsg: "Successfully imported",
      close: "Close",
      noData: "JSON file has no valid tasks or events.",
      invalidJson: "Invalid JSON file.",
      missingTitle: "missing title",
      missingDate: "missing date",
      clear: "Clear",
      errorsFound: "Some errors found:",
      taskCount: "tasks",
      eventCount: "events",
    },
  };

  const t = txt[language] || txt.vi;

  useEffect(() => {
    const fn = () => setIsOpen(true);
    window.addEventListener("open-import-json-modal", fn);
    return () => window.removeEventListener("open-import-json-modal", fn);
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setPayload(null);
    setErrors([]);
    setProgress(0);
    setTotalItems(0);
    setIsDragging(false);
    setImportedCounts({ tasks: 0, events: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    reset();
  };

  const validateAndParse = (raw: string) => {
    try {
      const data = JSON.parse(raw) as ImportPayload;
      const validationErrors: string[] = [];
      let validTasks: ImportTask[] = [];
      let validEvents: ImportEvent[] = [];

      if (data.tasks && Array.isArray(data.tasks)) {
        data.tasks.forEach((task, i) => {
          if (!task.title || typeof task.title !== "string" || !task.title.trim()) {
            validationErrors.push(`Task #${i + 1}: ${t.missingTitle}`);
          } else {
            validTasks.push({
              title: task.title.trim(),
              content: task.content || "",
              subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
              isDone: !!task.isDone,
              date: task.date || "",
            });
          }
        });
      }

      if (data.events && Array.isArray(data.events)) {
        data.events.forEach((evt, i) => {
          if (!evt.title || typeof evt.title !== "string" || !evt.title.trim()) {
            validationErrors.push(`Event #${i + 1}: ${t.missingTitle}`);
          } else if (!evt.date) {
            validationErrors.push(`Event #${i + 1} "${evt.title}": ${t.missingDate}`);
          } else {
            // Ensure date is a valid ISO string
            const parsedDate = new Date(evt.date);
            const isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

            validEvents.push({
              title: evt.title.trim(),
              content: evt.content || "",
              date: isoDate,
              recurrence: (["none","daily","weekly","monthly","yearly"] as const).includes(evt.recurrence as any) ? evt.recurrence : "none",
              reminderDays: typeof evt.reminderDays === "number" ? evt.reminderDays : 0,
            });
          }
        });
      }

      if (validTasks.length === 0 && validEvents.length === 0) {
        setErrors([t.noData]);
        setStatus("error");
        return;
      }

      setPayload({ tasks: validTasks, events: validEvents });
      setErrors(validationErrors);
      setStatus("previewing");
    } catch {
      setErrors([t.invalidJson]);
      setStatus("error");
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".json")) {
      setErrors([t.invalidJson]);
      setStatus("error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      validateAndParse(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (!payload || !user) return;
    setStatus("importing");

    const tasksToImport = payload.tasks || [];
    const eventsToImport = payload.events || [];
    const total = tasksToImport.length + eventsToImport.length;
    setTotalItems(total);

    let imported = 0;
    let importedTaskCount = 0;
    let importedEventCount = 0;

    try {
      for (const task of tasksToImport) {
        await addTask({
          title: task.title,
          content: task.content || "Nhập từ JSON",
          subtasks: task.subtasks || [],
          isDone: task.isDone ?? false,
          date: task.date,
        });
        imported++;
        importedTaskCount++;
        setProgress(Math.round((imported / total) * 100));
      }

      for (const evt of eventsToImport) {
        await addEvent({
          title: evt.title,
          content: evt.content || "Nhập từ JSON",
          date: evt.date,
          recurrence: evt.recurrence || "none",
          reminderDays: evt.reminderDays || 0,
        });
        imported++;
        importedEventCount++;
        setProgress(Math.round((imported / total) * 100));
      }

      setImportedCounts({ tasks: importedTaskCount, events: importedEventCount });
      setStatus("done");
      onDataUpdated();
    } catch (err) {
      console.error("Import error:", err);
      setErrors([String(err)]);
      setStatus("error");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-lg relative rounded-[24px] overflow-hidden"
        style={{
          background: "var(--bg)",
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[14px] flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 4px 16px rgba(99,102,241,0.35)",
              }}
            >
              <FileJson size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <h2
              className="text-xl font-extrabold"
              style={{ color: "var(--text-primary)" }}
            >
              {t.title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center neu-raised"
          >
            <X size={15} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="px-7 pb-7 pt-4 space-y-5">
          {/* ── IDLE: Drop zone ── */}
          {(status === "idle" || status === "error") && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 py-10 rounded-[18px] cursor-pointer transition-all duration-300"
                style={{
                  boxShadow: isDragging ? "var(--sh-inset)" : "var(--sh-raised)",
                  background: isDragging
                    ? "var(--bg-surface)"
                    : "var(--bg)",
                  border: isDragging
                    ? "2px dashed var(--accent)"
                    : "2px dashed transparent",
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                  style={{
                    boxShadow: isDragging ? "none" : "var(--sh-raised)",
                    background: isDragging ? "var(--accent)" : "var(--bg)",
                    transform: isDragging ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <Upload
                    size={24}
                    strokeWidth={2}
                    style={{
                      color: isDragging ? "#fff" : "var(--text-muted)",
                    }}
                  />
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t.dropText}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t.orText}{" "}
                  <span
                    className="font-bold"
                    style={{ color: "var(--accent)" }}
                  >
                    {t.browse}
                  </span>
                </p>
                <p
                  className="text-[10px] mt-1 px-4 py-1.5 rounded-lg"
                  style={{
                    color: "var(--text-muted)",
                    boxShadow: "var(--sh-inset)",
                    fontFamily: "monospace",
                  }}
                >
                  {t.formatHint}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Errors */}
              {status === "error" && errors.length > 0 && (
                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <AlertTriangle
                    size={18}
                    className="shrink-0 mt-0.5"
                    style={{ color: "#ef4444" }}
                  />
                  <div className="space-y-1 flex-1 min-w-0">
                    {errors.map((err, i) => (
                      <p
                        key={i}
                        className="text-xs font-medium"
                        style={{ color: "#ef4444" }}
                      >
                        {err}
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={reset}
                    className="shrink-0 p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                  >
                    <Trash2 size={14} style={{ color: "#ef4444" }} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── PREVIEW ── */}
          {status === "previewing" && payload && (
            <>
              <p
                className="text-[13px] uppercase tracking-widest font-bold"
                style={{ color: "var(--text-secondary)" }}
              >
                {t.preview}
              </p>

              {/* Stat pills */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="flex items-center gap-3 p-4 rounded-[14px]"
                  style={{ boxShadow: "var(--sh-raised)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: "#22c55e",
                      boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
                    }}
                  >
                    <ListChecks size={16} color="#fff" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p
                      className="text-xl font-extrabold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {payload.tasks?.length || 0}
                    </p>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {t.tasks}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 p-4 rounded-[14px]"
                  style={{ boxShadow: "var(--sh-raised)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: "#3b82f6",
                      boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
                    }}
                  >
                    <CalendarDays size={16} color="#fff" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p
                      className="text-xl font-extrabold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {payload.events?.length || 0}
                    </p>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {t.events}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scroll list preview */}
              <div
                className="max-h-52 overflow-y-auto rounded-[14px] p-3 space-y-1.5"
                style={{ boxShadow: "var(--sh-inset)" }}
              >
                {(payload.tasks || []).map((task, i) => (
                  <div
                    key={`t-${i}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ boxShadow: "var(--sh-raised)", background: "var(--bg)" }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: "#22c55e" }}
                    />
                    <span
                      className="font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {task.title}
                    </span>
                    <span
                      className="ml-auto shrink-0 text-[10px] px-2 py-0.5 rounded-md font-bold"
                      style={{
                        background: "rgba(34,197,94,0.12)",
                        color: "#22c55e",
                      }}
                    >
                      {t.tasks}
                    </span>
                  </div>
                ))}
                {(payload.events || []).map((evt, i) => (
                  <div
                    key={`e-${i}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{ boxShadow: "var(--sh-raised)", background: "var(--bg)" }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: "#3b82f6" }}
                    />
                    <span
                      className="font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {evt.title}
                    </span>
                    <span
                      className="ml-auto shrink-0 text-[10px] px-2 py-0.5 rounded-md font-bold"
                      style={{
                        background: "rgba(59,130,246,0.12)",
                        color: "#3b82f6",
                      }}
                    >
                      {t.events}
                    </span>
                  </div>
                ))}
              </div>

              {/* Validation warnings */}
              {errors.length > 0 && (
                <div
                  className="flex items-start gap-2.5 p-3 rounded-xl"
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  <AlertTriangle
                    size={14}
                    className="shrink-0 mt-0.5"
                    style={{ color: "#f59e0b" }}
                  />
                  <div className="flex-1 space-y-0.5">
                    <p
                      className="text-[11px] font-bold"
                      style={{ color: "#f59e0b" }}
                    >
                      {t.errorsFound}
                    </p>
                    {errors.map((err, i) => (
                      <p
                        key={i}
                        className="text-[10px]"
                        style={{ color: "#d97706" }}
                      >
                        • {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={reset}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all neu-raised"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold neu-btn-accent"
                >
                  {t.import}
                </button>
              </div>
            </>
          )}

          {/* ── IMPORTING ── */}
          {status === "importing" && (
            <div className="flex flex-col items-center gap-5 py-8">
              <Loader
                size={36}
                className="animate-spin"
                style={{ color: "var(--accent)" }}
              />
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {t.importing}
              </p>
              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ boxShadow: "var(--sh-inset)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #22c55e, #3b82f6)",
                    boxShadow: "0 0 12px rgba(34,197,94,0.4)",
                  }}
                />
              </div>
              <p
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {progress}% — {Math.round((progress / 100) * totalItems)}/{totalItems}
              </p>
            </div>
          )}

          {/* ── DONE ── */}
          {status === "done" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
                }}
              >
                <CheckCircle2 size={32} color="#fff" strokeWidth={2} />
              </div>
              <p
                className="text-lg font-extrabold"
                style={{ color: "var(--text-primary)" }}
              >
                {t.done}
              </p>
              <p
                className="text-sm text-center"
                style={{ color: "var(--text-secondary)" }}
              >
                {t.importedMsg}:{" "}
                <strong style={{ color: "#22c55e" }}>
                  {importedCounts.tasks} {t.taskCount}
                </strong>
                ,{" "}
                <strong style={{ color: "#3b82f6" }}>
                  {importedCounts.events} {t.eventCount}
                </strong>
              </p>
              <button
                onClick={handleClose}
                className="mt-2 px-8 py-3 rounded-xl text-sm font-semibold neu-btn-accent"
              >
                {t.close}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
