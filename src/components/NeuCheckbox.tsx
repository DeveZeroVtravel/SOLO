"use client";

interface NeuCheckboxProps {
  checked: boolean;
  onChange: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export default function NeuCheckbox({ checked, onChange, onMouseDown }: NeuCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onMouseDown={onMouseDown}
      onClick={onChange}
      className="shrink-0 transition-all duration-200"
      style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        background: checked ? "var(--accent)" : "transparent",
        border: checked
          ? "2px solid var(--accent)"
          : "2px solid var(--border-strong)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path
            d="M1 4L4 7.5L10 1"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
