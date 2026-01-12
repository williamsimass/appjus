import tailwindAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0f172a', // Navy Blue
                    light: '#334155',
                    dark: '#020617',
                },
                accent: {
                    DEFAULT: '#b45309', // Bronze/Gold
                    hover: '#92400e',
                },
                background: '#f8fafc',
                surface: '#ffffff',
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar-background))',
                    foreground: 'hsl(var(--sidebar-foreground))',
                    primary: 'hsl(var(--sidebar-primary))',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
                    accent: 'hsl(var(--sidebar-accent))',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
                    border: 'hsl(var(--sidebar-border))',
                    ring: 'hsl(var(--sidebar-ring))'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                lg: `var(--radius)`,
                md: `calc(var(--radius) - 2px)`,
                sm: "calc(var(--radius) - 4px)",
            },
            // Adicionando keyframes personalizados para garantir que o "Sem notificações" seja suave
            keyframes: {
                "fade-in": {
                    "0%": { opacity: "0", transform: "scale(0.95)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                }
            },
            animation: {
                "fade-in": "fade-in 0.5s ease-out forwards",
            }
        }
    },
    // O plugin 'tailwindcss-animate' é o que faz o animate-in funcionar
    plugins: [tailwindAnimate],
}