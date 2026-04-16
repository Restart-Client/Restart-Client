// 認証フロー (方式A: コピペ) を実装したログイン画面。
// 1. OS ブラウザで /public/auth/discord/login を開く
// 2. Discord 認可 → サーバーが JSON (access_token 等) を表示
// 3. ユーザーが JSON 全体 or access_token 単体を貼り付け
// 4. /public/me/exp を叩いて検証、成功したらキーチェーンへ保存

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { API_BASE_URL, ApiClient, ApiError } from "@/api/client";
import { RestartApi } from "@/api/endpoints";
import { useAuthStore } from "@/stores/auth";
import { openExternal } from "@/lib/open-external";
import type { TokenResponse } from "@/api/types";

const LOGIN_URL = `${API_BASE_URL}/public/auth/discord/login`;

type Step = "intro" | "paste" | "validating" | "success";

function extractToken(
  input: string,
): { access_token: string; user_id: number; expires_in: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // JSON として解釈できるか試す
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Partial<TokenResponse>;
      if (
        typeof parsed.access_token === "string" &&
        typeof parsed.user_id === "number" &&
        typeof parsed.expires_in === "number"
      ) {
        return {
          access_token: parsed.access_token,
          user_id: parsed.user_id,
          expires_in: parsed.expires_in,
        };
      }
    } catch {
      // JSON ではない、そのまま下へ
    }
  }

  // 生のトークン文字列とみなす (検証後に user_id は /me/exp から取得する)
  // トークンは英数字中心の長い文字列。ここではざっくり 20 文字以上を許容。
  if (/^[A-Za-z0-9_\-.]{20,}$/.test(trimmed)) {
    return {
      access_token: trimmed,
      user_id: 0, // 後で上書き
      expires_in: 86400,
    };
  }

  return null;
}

export function LoginScreen() {
  const [step, setStep] = useState<Step>("intro");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const setToken = useAuthStore((s) => s.setToken);
  const authError = useAuthStore((s) => s.lastError);
  const clearError = useAuthStore((s) => s.clearError);

  const parsed = useMemo(() => extractToken(input), [input]);

  useEffect(() => {
    if (step === "paste") textareaRef.current?.focus();
  }, [step]);

  useEffect(() => {
    // 期限切れ等のメッセージがストアにあれば一度だけ表示
    if (authError) {
      setError(authError);
      clearError();
    }
  }, [authError, clearError]);

  const handleOpenLogin = useCallback(async () => {
    await openExternal(LOGIN_URL);
    setStep("paste");
  }, []);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInput(text);
        toast.success("クリップボードから読み込みました");
      }
    } catch {
      toast.error(
        "クリップボードを読めませんでした。手動で貼り付けてください。",
      );
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!parsed) {
      setError(
        "トークンの形式を認識できません。JSON全体か access_token の値を貼り付けてください。",
      );
      return;
    }
    setStep("validating");
    try {
      // 一時クライアントで検証
      const client = new ApiClient({ getToken: () => parsed.access_token });
      const api = new RestartApi(client);
      const exp = await api.exp();

      await setToken({
        access_token: parsed.access_token,
        user_id: exp.user_id, // サーバー側の値を信頼
        expires_in: parsed.expires_in,
      });
      setStep("success");
      // 少し余韻を持たせる
      setTimeout(() => {
        toast.success("ログインしました", {
          description: `User ID: ${exp.user_id}`,
        });
      }, 300);
    } catch (e) {
      setStep("paste");
      if (e instanceof ApiError) {
        if (e.isAuthError) {
          setError("トークンが無効、または期限切れです。再取得してください。");
        } else if (e.isForbidden) {
          setError(
            "ブースターではないため利用できません。Discord でブースターになってから再試行してください。",
          );
        } else if (e.isRateLimited) {
          const s = e.retryAfterSeconds ?? 60;
          setError(`リクエストが多すぎます。${s} 秒後に再試行してください。`);
        } else {
          console.error("[login] ApiError:", e.status, e.body, e.message);
          setError(`エラー (HTTP ${e.status}): ${e.body.error ?? e.message}`);
        }
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[login] unexpected error:", e);
        setError(`エラー: ${msg}`);
      }
    }
  }, [parsed, setToken]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950">
      {/* 背景: 淡い遠景の光と grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(245,155,46,0.18), transparent 50%), radial-gradient(ellipse 60% 50% at 85% 90%, rgba(56,189,248,0.12), transparent 50%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.25] mix-blend-overlay" />

      {/* 微細な縦線グリッド */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #ffffff 0, #ffffff 1px, transparent 1px, transparent 72px)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-12">
        {/* ロゴ/ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-center gap-3"
        >
          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-ember-400 to-ember-600 shadow-glow">
            <div className="absolute inset-[2px] rounded-[10px] bg-ink-950" />
            <div className="absolute inset-0 flex items-center justify-center font-display text-xl font-black text-ember-400">
              R
            </div>
          </div>
          <div>
            <div className="font-display text-sm font-medium tracking-[0.2em] text-ink-300">
              RE&apos;START
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
              Desktop Client
            </div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-3 max-w-2xl text-center font-display text-[44px] font-light leading-[1.1] tracking-tight text-ink-50 md:text-[56px]"
        >
          ようこそ。
          <br />
          <span className="bg-gradient-to-r from-ember-400 via-ember-500 to-ember-600 bg-clip-text font-black text-transparent">
            Re&apos;start
          </span>{" "}
          をもっと快適に。
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-12 max-w-xl text-center font-body text-[15px] text-ink-300"
        >
          Discord でログインして、武器・スキル・ペットを一画面で管理しましょう。
          トークンはこの端末の OS
          セキュアストレージにのみ保存され、第三者に送信されることはありません。
        </motion.p>

        {/* メインカード */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="w-full max-w-xl"
        >
          <Card className="overflow-hidden">
            <div className="border-b border-ink-700/60 px-6 py-4">
              <Stepper step={step} />
            </div>

            <div className="relative min-h-[320px] px-6 py-7">
              <AnimatePresence mode="wait">
                {step === "intro" && (
                  <StepIntro key="intro" onStart={handleOpenLogin} />
                )}
                {step === "paste" && (
                  <StepPaste
                    key="paste"
                    input={input}
                    onChange={setInput}
                    parsed={parsed}
                    error={error}
                    onPasteClipboard={handlePasteFromClipboard}
                    onReopenLogin={handleOpenLogin}
                    onSubmit={handleSubmit}
                    textareaRef={textareaRef}
                  />
                )}
                {step === "validating" && <StepValidating key="validating" />}
                {step === "success" && <StepSuccess key="success" />}
              </AnimatePresence>
            </div>
          </Card>

          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-widest text-ink-500">
            Booster Only · Secure Local Storage
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────

function Stepper({ step }: { step: Step }) {
  const stepIndex = { intro: 0, paste: 1, validating: 2, success: 2 }[step];
  const labels = ["Discord で認可", "トークンを貼り付け", "ログイン完了"];
  return (
    <div className="flex items-center gap-3">
      {labels.map((label, i) => {
        const active = i === stepIndex;
        const done = i < stepIndex;
        return (
          <div key={label} className="flex flex-1 items-center gap-3">
            <div
              className={
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold transition-colors " +
                (done
                  ? "bg-ember-500 text-ink-950"
                  : active
                    ? "bg-ember-500/20 text-ember-400 ring-2 ring-ember-500/40"
                    : "bg-ink-700/60 text-ink-400")
              }
            >
              {done ? "✓" : i + 1}
            </div>
            <div
              className={
                "text-xs font-medium transition-colors " +
                (active
                  ? "text-ink-50"
                  : done
                    ? "text-ink-300"
                    : "text-ink-500")
              }
            >
              {label}
            </div>
            {i < labels.length - 1 && (
              <div
                className={
                  "h-px flex-1 transition-colors " +
                  (done ? "bg-ember-500/40" : "bg-ink-700/60")
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────

const motionFade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.25 },
};

function StepIntro({ onStart }: { onStart: () => void }) {
  return (
    <motion.div {...motionFade} className="flex h-full flex-col">
      <h2 className="font-display text-xl font-medium text-ink-50">
        Discord でログインします
      </h2>
      <p className="mt-2 font-body text-sm leading-relaxed text-ink-300">
        ブラウザが開きます。Discord
        で認可すると、アクセストークンを含む JSON
        がブラウザに表示されます。そのページを一度閉じずに、
        次の画面へ進んでコピー&ペーストしてください。
      </p>

      <ul className="mt-5 space-y-2.5 font-body text-sm text-ink-300">
        <li className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-life" />
          <span>トークンは OS のセキュアストレージにのみ保存されます</span>
        </li>
        <li className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-life" />
          <span>外部サーバーにトークンは送信されません</span>
        </li>
        <li className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-life" />
          <span>ログアウトボタンで即座に無効化できます</span>
        </li>
      </ul>

      <div className="mt-auto pt-6">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onStart}
          rightIcon={<ExternalLink className="h-4 w-4" />}
        >
          ブラウザで Discord 認可を開く
        </Button>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────

function StepPaste({
  input,
  onChange,
  parsed,
  error,
  onPasteClipboard,
  onReopenLogin,
  onSubmit,
  textareaRef,
}: {
  input: string;
  onChange: (v: string) => void;
  parsed: ReturnType<typeof extractToken>;
  error: string | null;
  onPasteClipboard: () => void;
  onReopenLogin: () => void;
  onSubmit: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  return (
    <motion.div {...motionFade} className="flex h-full flex-col">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium text-ink-50">
            トークンを貼り付け
          </h2>
          <p className="mt-1 font-body text-sm text-ink-300">
            ブラウザに表示された JSON をそのまま貼り付けてください。
          </p>
        </div>
        <Badge tone={parsed ? "life" : "neutral"}>
          {parsed ? "形式OK" : "未入力"}
        </Badge>
      </div>

      <Textarea
        ref={textareaRef}
        rows={6}
        spellCheck={false}
        value={input}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`{
  "token_type": "Bearer",
  "access_token": "xxxxxxxxxxxxxxxxxxx",
  "expires_in": 86400,
  "user_id": 123456789012345678
}`}
        className="flex-1"
      />

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPasteClipboard}
          leftIcon={<ClipboardPaste className="h-3.5 w-3.5" />}
        >
          クリップボードから
        </Button>
        <Button variant="ghost" size="sm" onClick={onReopenLogin}>
          認可画面を開き直す
        </Button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm leading-relaxed text-danger">{error}</p>
        </motion.div>
      )}

      <div className="mt-4 pt-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!parsed}
          onClick={onSubmit}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          ログインして開始
        </Button>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────

function StepValidating() {
  return (
    <motion.div
      {...motionFade}
      className="flex h-full flex-col items-center justify-center py-10"
    >
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-2 border-ink-700" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-ember-500" />
        <div className="absolute inset-3 rounded-full bg-ember-500/10" />
      </div>
      <p className="mt-6 font-display text-base text-ink-100">
        トークンを検証しています…
      </p>
      <p className="mt-1 font-mono text-xs text-ink-500">
        GET /public/me/exp
      </p>
    </motion.div>
  );
}

function StepSuccess() {
  return (
    <motion.div
      {...motionFade}
      className="flex h-full flex-col items-center justify-center py-10"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-life/15"
      >
        <CheckCircle2 className="h-8 w-8 text-life" />
      </motion.div>
      <p className="mt-6 font-display text-base text-ink-100">
        ログインしました
      </p>
    </motion.div>
  );
}
