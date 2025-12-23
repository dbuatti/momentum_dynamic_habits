import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          background: "hsl(var(--success-background))",
          border: "hsl(var(--success-border))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          background: "hsl(var(--info-background))",
          border: "hsl(var(--info-border))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          background: "hsl(var(--warning-background))",
          border: "hsl(var(--warning-border))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        'habit-green': {
          DEFAULT: "hsl(var(--habit-green))",
          foreground: "hsl(var(--habit-green-foreground))",
          border: "hsl(var(--habit-green-border))",
        },
        'habit-purple': {
          DEFAULT: "hsl(var(--habit-purple))",
          foreground: "hsl(var(--habit-purple-foreground))",
          border: "hsl(var(--habit-purple-border))",
        },
        'habit-orange': {
          DEFAULT: "hsl(var(--habit-orange))",
          foreground: "hsl(var(--habit-orange-foreground))",
          border: "hsl(var(--habit-orange-border))",
        },
        'habit-blue': {
          DEFAULT: "hsl(var(--habit-blue))",
          foreground: "hsl(var(--habit-blue-foreground))",
          border: "hsl(var(--habit-blue-border))",
        },
        'habit-red': {
          DEFAULT: "hsl(var(--habit-red))",
          foreground: "hsl(var(--habit-red-foreground))",
          border: "hsl(var(--habit-red-border))",
        },
        'habit-indigo': {
          DEFAULT: "hsl(var(--habit-indigo))",
          foreground: "hsl(var(--habit-indigo-foreground))",
          border: "hsl(var(--habit-indigo-border))",
        },
        // Landing page specific colors
        'landing-background': "hsl(var(--landing-background))",
        'landing-foreground': "hsl(var(--landing-foreground))",
        'landing-muted-foreground': "hsl(var(--landing-muted-foreground))",
        'landing-primary': "hsl(var(--landing-primary))",
        'landing-primary-foreground': "hsl(var(--landing-primary-foreground))",
        'landing-accent': "hsl(var(--landing-accent))",
        'landing-accent-foreground': "hsl(var(--landing-accent-foreground))",
        'landing-border': "hsl(var(--landing-border))",
        'landing-indigo': "hsl(var(--landing-indigo))",
        'landing-purple': "hsl(var(--landing-purple))",
        'landing-green': "hsl(var(--landing-green))",
        'landing-orange': "hsl(var(--landing-orange))",
        'landing-yellow': "hsl(var(--landing-yellow))",
        'landing-red': "hsl(var(--landing-red))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;