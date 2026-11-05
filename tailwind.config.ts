import type { Config } from "tailwindcss";

const v = (name: string) => `var(--${name})`;

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"), surface: v("surface"), surface2: v("surface2"), ink: v("ink"), ink2: v("ink2"),
        muted: v("muted"), line: v("line"), blue: v("blue"), green: v("green"), warn: v("warn"), amber: v("amber")
      },
      fontFamily: { serif: v("serif").split(","), sans: v("sans").split(",") },
      maxWidth: { wrap: "1200px" }
    }
  },
  plugins: []
} satisfies Config;
