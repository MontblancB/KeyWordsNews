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
    // 색상 테마 클래스들을 safelist에 추가
    'bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-pink-600', 'bg-indigo-600', 'bg-red-600',
    'dark:bg-blue-700', 'dark:bg-green-700', 'dark:bg-purple-700', 'dark:bg-pink-700', 'dark:bg-indigo-700', 'dark:bg-red-700',
    'hover:bg-blue-700', 'hover:bg-green-700', 'hover:bg-purple-700', 'hover:bg-pink-700', 'hover:bg-indigo-700', 'hover:bg-red-700',
    'dark:hover:bg-blue-800', 'dark:hover:bg-green-800', 'dark:hover:bg-purple-800', 'dark:hover:bg-pink-800', 'dark:hover:bg-indigo-800', 'dark:hover:bg-red-800',
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
