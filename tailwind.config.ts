import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // next-themes와 함께 사용하기 위한 설정
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // 색상 테마 클래스들을 safelist에 추가 (16개)
    'bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600', 'bg-red-600',
    'bg-orange-600', 'bg-amber-600', 'bg-teal-600', 'bg-cyan-600', 'bg-lime-600', 'bg-rose-600',
    'bg-emerald-600', 'bg-violet-600', 'bg-fuchsia-600', 'bg-slate-600',
    'dark:bg-blue-700', 'dark:bg-green-700', 'dark:bg-purple-700', 'dark:bg-pink-700', 'dark:bg-indigo-700', 'dark:bg-red-700',
    'dark:bg-orange-700', 'dark:bg-amber-700', 'dark:bg-teal-700', 'dark:bg-cyan-700', 'dark:bg-lime-700', 'dark:bg-rose-700',
    'dark:bg-emerald-700', 'dark:bg-violet-700', 'dark:bg-fuchsia-700', 'dark:bg-slate-700',
    'hover:bg-blue-700', 'hover:bg-green-700', 'hover:bg-purple-700', 'hover:bg-pink-700', 'hover:bg-indigo-700', 'hover:bg-red-700',
    'hover:bg-orange-700', 'hover:bg-amber-700', 'hover:bg-teal-700', 'hover:bg-cyan-700', 'hover:bg-lime-700', 'hover:bg-rose-700',
    'hover:bg-emerald-700', 'hover:bg-violet-700', 'hover:bg-fuchsia-700', 'hover:bg-slate-700',
    'dark:hover:bg-blue-800', 'dark:hover:bg-green-800', 'dark:hover:bg-purple-800', 'dark:hover:bg-pink-800', 'dark:hover:bg-indigo-800', 'dark:hover:bg-red-800',
    'dark:hover:bg-orange-800', 'dark:hover:bg-amber-800', 'dark:hover:bg-teal-800', 'dark:hover:bg-cyan-800', 'dark:hover:bg-lime-800', 'dark:hover:bg-rose-800',
    'dark:hover:bg-emerald-800', 'dark:hover:bg-violet-800', 'dark:hover:bg-fuchsia-800', 'dark:hover:bg-slate-800',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
