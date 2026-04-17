"use client";

import { useState } from "react";
import { parseNaturalLanguage } from "@/services/ollamaService";
import { useFirebase } from "@/context/FirebaseContext";
import { useSettings } from "@/context/SettingsContext";
import { Sparkles, ArrowUp, Loader, Plus } from "lucide-react";

export default function FloatingAIInput({ onDataUpdated }: { onDataUpdated: () => void }) {
  const [inputNote, setInputNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { addTask, addEvent, user } = useFirebase();
  const { t } = useSettings();

  const handleParseNote = async () => {
    if (!inputNote.trim() || !user || isProcessing) return;
    setIsProcessing(true);
    try {
      const parsedData = await parseNaturalLanguage(inputNote);
      const finalTitle = (parsedData.content || inputNote || "Không có tiêu đề").trim();
      
      if (parsedData.type === "task") {
        await addTask({ 
          title: finalTitle, 
          subtasks: parsedData.subtasks || [], 
          isDone: false, 
          content: inputNote, 
          date: parsedData.timestamp || "" 
        });
      } else {
        await addEvent({
          title: finalTitle,
          date: parsedData.timestamp || new Date().toISOString(),
          recurrence: parsedData.recurrence || "none",
          reminderDays: parsedData.reminderDays || 0,
          content: inputNote,
        });
      }
      onDataUpdated();
      setInputNote("");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Có lỗi xảy ra.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 md:left-[calc(116px+(100vw-116px)/2)] -translate-x-1/2 z-50 w-full max-w-2xl px-4 flex items-center justify-between gap-2 md:gap-4">
      {/* ── AI Input Bar ── */}
      <div className="neu-float-bar flex-1 flex items-center gap-3 px-4 py-3">
        <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center neu-btn-accent">
          <Sparkles size={16} strokeWidth={2} />
        </div>

        <div className="flex-1 rounded-xl px-4 py-2.5" style={{ boxShadow: "var(--sh-inset)" }}>
          <input
            type="text"
            value={inputNote}
            onChange={(e) => setInputNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleParseNote()}
            placeholder={t("typeNote")}
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        <button
          onClick={handleParseNote}
          disabled={isProcessing || !inputNote.trim()}
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all neu-btn-accent"
        >
          {isProcessing ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <ArrowUp size={16} strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* ── Manual Add Floating Button ── */}
      <button
        onClick={() => window.dispatchEvent(new Event("open-manual-modal"))}
        className="w-[52px] h-[52px] shrink-0 neu-float-bar flex items-center justify-center group cursor-pointer"
      >
        <Plus
          size={24}
          strokeWidth={2.5}
          className="group-hover:rotate-90 transition-transform duration-300"
          style={{ color: "var(--accent)" }}
        />
      </button>
    </div>
  );
}
