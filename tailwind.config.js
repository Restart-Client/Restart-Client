/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Unbounded"', '"Zen Kaku Gothic New"', "sans-serif"],
        body: ['"Zen Kaku Gothic New"', '"Inter"', "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        // 深い夜空〜炭のような黒ベース
        ink: {
          50: "#f5f6f8",
          100: "#e7eaf0",
          200: "#c7cfdd",
          300: "#94a0b8",
          400: "#5e6b85",
          500: "#3b4660",
          600: "#283049",
          700: "#1a2036",
          800: "#111629",
          900: "#0a0e1d",
          950: "#05070f",
        },
        // メインアクセント: 琥珀〜金色(レア感)
        ember: {
          400: "#ffb961",
          500: "#f59b2e",
          600: "#dc7a0f",
          700: "#b45c0a",
        },
        // サブアクセント: 冷たい水色(装備中の表示など)
        frost: {
          400: "#7dd3fc",
          500: "#38bdf8",
          600: "#0ea5e9",
        },
        // 成功・危険
        life: "#4ade80",
        danger: "#f43f5e",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(245, 155, 46, 0.35)",
        "glow-frost": "0 0 40px -10px rgba(56, 189, 248, 0.35)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -20px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        grain:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      animation: {
        "fade-up": "fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 0.4s ease-out both",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
