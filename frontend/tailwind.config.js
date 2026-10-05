/** @type {import('tailwindcss').Config} */
import defaultColors from 'tailwindcss/colors';

// Theme colours are CSS variables (see index.css) so the whole UI switches between dark and light together.
const themed = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep navy fintech palette
        bg: {
          base: themed('--bg-base'),
          surface: themed('--bg-surface'),
          card: themed('--bg-card'),
          hover: themed('--bg-hover'),
          border: themed('--bg-border'),
        },
        // Light foreground shades used for text on the dark theme; they flip to dark shades in light mode.
        slate: {
          ...defaultColors.slate,
          100: themed('--fg-100'),
          200: themed('--fg-200'),
          300: themed('--fg-300'),
          400: themed('--fg-400'),
        },
        light: {
          base: '#f8fafc',
          surface: '#ffffff',
          card: '#ffffff',
          hover: '#f1f5f9',
          border: '#e2e8f0',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        up: '#22c55e',
        down: '#ef4444',
        muted: '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'flash-up': 'flash-up 0.5s ease-out',
        'flash-down': 'flash-down 0.5s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite linear',
        'slide-in': 'slide-in 0.3s ease-out',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        'flash-up': {
          '0%': { 'background-color': 'rgba(34, 197, 94, 0.25)' },
          '100%': { 'background-color': 'transparent' },
        },
        'flash-down': {
          '0%': { 'background-color': 'rgba(239, 68, 68, 0.25)' },
          '100%': { 'background-color': 'transparent' },
        },
        shimmer: {
          '0%': { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-10%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-12deg)' },
          '75%': { transform: 'rotate(12deg)' },
        },
      },
    },
  },
  plugins: [],
};
