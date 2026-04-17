"use client";

import { useRef, useState, useCallback } from "react";
import { MoreHorizontal, Pencil, Trash2, X } from "lucide-react";

interface SwipeCardProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const REVEAL_WIDTH = 112;
const THRESHOLD    = 52;

export default function SwipeCard({ children, onEdit, onDelete, className = "", style }: SwipeCardProps) {
  const [offset, setOffset]     = useState(0);
  const [open, setOpen]         = useState(false);
  const [dragging, setDragging] = useState(false);

  const startX   = useRef(0);
  const startOff = useRef(0);

  const getX = (e: React.MouseEvent | React.TouchEvent) =>
    "touches" in e ? e.touches[0].clientX : e.clientX;

  const onStart = (e: React.MouseEvent | React.TouchEvent) => {
    startX.current   = getX(e);
    startOff.current = offset;
    setDragging(true);
  };

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const dx   = getX(e) - startX.current;
    const next = Math.min(0, Math.max(-REVEAL_WIDTH, startOff.current + dx));
    setOffset(next);
  }, [dragging]);

  const onEnd = () => {
    if (!dragging) return;
    setDragging(false);
    if (offset < -THRESHOLD) {
      setOffset(-REVEAL_WIDTH); setOpen(true);
    } else {
      setOffset(0); setOpen(false);
    }
  };

  const toggleMenu = () => {
    if (open) { setOffset(0); setOpen(false); }
    else      { setOffset(-REVEAL_WIDTH); setOpen(true); }
  };

  const close = () => { setOffset(0); setOpen(false); };

  return (
    /*
     * Outer shell — pure positioning context, no visual styling.
     * Shadow lives on the card face div below so there's only one shadow layer.
     */
    <div
      className={`relative ${className}`}
      style={{ borderRadius: 14, ...style }}
    >
      {/*
       * Inner clip — overflow:hidden ONLY when card is open/dragging to
       * reveal the action panel. At rest, overflow:visible lets the
       * Neumorphic shadow breathe freely.
       */}
      <div
        style={{
          borderRadius: 14,
          overflow: (offset < 0 || open || dragging) ? "hidden" : "visible",
          position: "relative",
        }}
      >
        {/* Action panel (sits behind, right-anchored) */}
        <div
          className="absolute right-0 top-0 h-full flex items-stretch"
          style={{
            width: REVEAL_WIDTH,
            zIndex: 0,
            visibility: offset < 0 ? "visible" : "hidden",
            opacity: offset < 0 ? 1 : 0,
            transition: "opacity 0.15s ease, visibility 0.15s ease",
          }}
        >
          {onEdit && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); close(); onEdit(); }}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-white text-[11px] font-semibold"
              style={{ background: "#3b82f6" }}
            >
              <Pencil size={15} strokeWidth={2.5} />
              Sửa
            </button>
          )}
          {onDelete && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); close(); onDelete(); }}
              className="flex-1 flex flex-col items-center justify-center gap-1 text-white text-[11px] font-semibold"
              style={{ background: "var(--danger)" }}
            >
              <Trash2 size={15} strokeWidth={2.5} />
              Xoá
            </button>
          )}
        </div>

        {/* Card face — slides left over the action panel */}
        <div
          className="relative flex items-center gap-3 px-4 py-3"
          style={{
            background: "var(--bg)",
            boxShadow: "var(--sh-raised)",
            borderRadius: 14,
            transform: `translateX(${offset}px)`,
            transition: dragging ? "none" : "transform 0.25s cubic-bezier(.4,0,.2,1)",
            cursor: dragging ? "grabbing" : "default",
            touchAction: "pan-y",
            zIndex: 1,
          }}
          onMouseDown={onStart}
          onMouseMove={onMove}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={onStart}
          onTouchMove={onMove}
          onTouchEnd={onEnd}
        >
          <div className="flex-1 min-w-0">{children}</div>

          {/* 3-dot button */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); toggleMenu(); }}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{
              boxShadow: open ? "var(--sh-inset)" : "none",
              background: "transparent",
              color: open ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            {open
              ? <X size={13} strokeWidth={2.5} />
              : <MoreHorizontal size={14} strokeWidth={2} />}
          </button>
        </div>
      </div>
    </div>
  );
}
