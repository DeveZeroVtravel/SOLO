"use client";

import { useState } from "react";
import { useFirebase } from "@/context/FirebaseContext";
import {
  Mail, Lock, Eye, EyeOff,
  ArrowRight, Loader, Zap,
} from "lucide-react";

type Tab = "login" | "register";

function fmtError(code: string): string {
  const m: Record<string, string> = {
    "auth/invalid-email":        "Email không hợp lệ.",
    "auth/user-not-found":       "Không tìm thấy tài khoản.",
    "auth/wrong-password":       "Mật khẩu không đúng.",
    "auth/invalid-credential":   "Email hoặc mật khẩu không đúng.",
    "auth/email-already-in-use": "Email này đã được đăng ký.",
    "auth/weak-password":        "Mật khẩu phải có ít nhất 6 ký tự.",
    "auth/too-many-requests":    "Quá nhiều yêu cầu, hãy thử lại sau.",
  };
  return m[code] ?? "Có lỗi xảy ra, vui lòng thử lại.";
}

function Input({
  label, icon: Icon, type = "text", value, onChange, placeholder, right, autoComplete,
}: {
  label: string;
  icon: React.ElementType;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  right?: React.ReactNode;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-[14px]"
        style={{ boxShadow: "var(--sh-inset)", background: "var(--bg)" }}
      >
        <Icon size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm focus:outline-none"
          style={{ color: "var(--text-primary)" }}
        />
        {right}
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: "var(--text-muted)", opacity: 0.2 }} />
      <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--text-muted)", opacity: 0.2 }} />
    </div>
  );
}

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useFirebase();

  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail]         = useState("");
  const [password, setPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [info, setInfo]           = useState("");

  const run = async (fn: () => Promise<void>) => {
    setLoading(true); setError(""); setInfo("");
    try { await fn(); }
    catch (e: any) { setError(fmtError(e.code ?? "")); }
    finally { setLoading(false); }
  };

  const handleGoogle   = () => run(() => signInWithGoogle());
  const handleLogin    = () => run(() => signInWithEmail(email, password));
  const handleRegister = () => run(async () => {
    if (!email || !password) { setError("Vui lòng điền đầy đủ thông tin."); return; }
    if (password !== confirmPw) { setError("Mật khẩu xác nhận không khớp."); return; }
    await signUpWithEmail(email, password);
  });
  const handleReset = () => run(async () => {
    if (!email) { setError("Vui lòng nhập email."); return; }
    await resetPassword(email);
    setResetSent(true);
    setInfo("Đã gửi! Kiểm tra hộp thư của bạn.");
  });

  const switchTab = (t: Tab) => {
    setTab(t); setError(""); setInfo("");
    setShowReset(false); setResetSent(false);
  };

  const EyeBtn = () => (
    <button type="button" onClick={() => setShowPw(!showPw)} className="shrink-0">
      {showPw
        ? <EyeOff size={14} style={{ color: "var(--text-muted)" }} />
        : <Eye    size={14} style={{ color: "var(--text-muted)" }} />}
    </button>
  );

  const SubmitBtn = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-sm font-semibold neu-btn-accent"
    >
      {loading ? <Loader size={16} className="animate-spin" /> : <><ArrowRight size={16} />{label}</>}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-[400px] space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl neu-btn-accent mx-auto mb-3">
            <Zap size={22} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text-primary)" }}>
            Smart<span style={{ color: "var(--accent)" }}>Cal</span>
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>AI-powered calendar</p>
        </div>

        {/* Card */}
        <div className="neu-card p-7 space-y-5">

          {/* Tab switcher */}
          <div className="flex p-1 rounded-[14px]" style={{ boxShadow: "var(--sh-inset)" }}>
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className="flex-1 py-2 rounded-[10px] text-sm font-semibold transition-all duration-200"
                style={{
                  boxShadow: tab === t ? "var(--sh-raised)" : "none",
                  background: "var(--bg)",
                  color: tab === t ? "var(--accent)" : "var(--text-muted)",
                  opacity: tab === t ? 1 : 0.7,
                }}
              >
                {t === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
            ))}
          </div>

          {/* ══ LOGIN ══ */}
          {tab === "login" && !showReset && (
            <div className="space-y-4">
              <Input label="Email" icon={Mail} type="email" value={email}
                onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
              <Input label="Mật khẩu" icon={Lock} type={showPw ? "text" : "password"}
                value={password} onChange={setPw} placeholder="••••••••"
                autoComplete="current-password" right={<EyeBtn />} />

              {error && <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>{error}</p>}

              <SubmitBtn label="Đăng nhập" onClick={handleLogin} />

              <div className="text-right -mt-1">
                <button
                  onClick={() => { setShowReset(true); setError(""); setInfo(""); }}
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Quên mật khẩu?
                </button>
              </div>

              <Divider label="hoặc" />

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-[14px] text-sm font-semibold neu-raised"
                style={{ color: "var(--text-primary)" }}
              >
                <GoogleIcon /> Tiếp tục với Google
              </button>
            </div>
          )}

          {/* ══ FORGOT PASSWORD ══ */}
          {tab === "login" && showReset && (
            <div className="space-y-4">
              <button
                onClick={() => { setShowReset(false); setError(""); setInfo(""); setResetSent(false); }}
                className="text-xs font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                ← Quay lại đăng nhập
              </button>
              <div>
                <h3 className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>Đặt lại mật khẩu</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Nhập email để nhận link đặt lại mật khẩu.
                </p>
              </div>
              <Input label="Email" icon={Mail} type="email" value={email}
                onChange={setEmail} placeholder="you@example.com" />
              {error && <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>{error}</p>}
              {info  && <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>{info}</p>}
              {!resetSent
                ? <SubmitBtn label="Gửi email đặt lại" onClick={handleReset} />
                : (
                  <div className="text-center py-3 rounded-[14px] text-sm font-semibold"
                    style={{ boxShadow: "var(--sh-inset)", color: "var(--accent)" }}>
                    ✓ Đã gửi! Kiểm tra hộp thư.
                  </div>
                )
              }
            </div>
          )}

          {/* ══ REGISTER ══ */}
          {tab === "register" && (
            <div className="space-y-4">
              <Input label="Email" icon={Mail} type="email" value={email}
                onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
              <Input label="Mật khẩu" icon={Lock} type={showPw ? "text" : "password"}
                value={password} onChange={setPw} placeholder="Tối thiểu 6 ký tự"
                autoComplete="new-password" right={<EyeBtn />} />
              <Input label="Xác nhận mật khẩu" icon={Lock} type={showPw ? "text" : "password"}
                value={confirmPw} onChange={setConfirmPw} placeholder="Nhập lại mật khẩu"
                autoComplete="new-password" />

              {error && <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>{error}</p>}

              <SubmitBtn label="Tạo tài khoản" onClick={handleRegister} />

              <Divider label="hoặc" />

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-[14px] text-sm font-semibold neu-raised"
                style={{ color: "var(--text-primary)" }}
              >
                <GoogleIcon /> Đăng ký với Google
              </button>
            </div>
          )}

        </div>

        <p className="text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
          Bằng cách tiếp tục, bạn đồng ý với điều khoản sử dụng của SmartCal.
        </p>
      </div>
    </div>
  );
}
