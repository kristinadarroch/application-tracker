/**
 * Transit primitive colors. Only `semantic.ts` and `elevation.ts` read these.
 * "Platform" is the light theme, "Night service" the dark one.
 */
export const palette = {
  ink: {
    900: '#121417',
    800: '#22272E',
    700: '#2A2F36',
    600: '#4B5058',
    500: '#5C626B',
    /** Unreached stations: ≥ 3:1 on both light surfaces (non-text contrast). */
    400: '#80868F',
  },
  night: { 950: '#0D0F12', 900: '#171A1F', 850: '#1E2228', 800: '#22272E', 700: '#2A2F36' },
  platform: { 0: '#FFFFFF', 50: '#F2F2EE', 100: '#EDEDE7', 200: '#E9E9E3', 300: '#D6D6CF' },
  fog: { 100: '#F2F2EE', 200: '#C9CCD1', 300: '#A7ADB6', 400: '#8D949E' },
  /** Signal yellow: urgency only. Always carries ink text. */
  signal: { 500: '#FFD100' },
  /** Line colors, assigned per application. Light uses white text on them; dark uses ink text. */
  line: {
    blue: { light: '#0061B0', dark: '#4DA3FF' },
    orange: { light: '#C2410C', dark: '#FB8B4B' },
    green: { light: '#047857', dark: '#34D399' },
    purple: { light: '#6D28D9', dark: '#A78BFA' },
  },
  feedback: {
    success: { lightFg: '#047857', lightBg: '#E3F4EC', darkFg: '#34D399', darkBg: '#0E2A21' },
    danger: { lightFg: '#B42318', lightBg: '#FDECEA', darkFg: '#FF8A80', darkBg: '#3A1714' },
    info: { lightFg: '#0061B0', lightBg: '#E5F0FA', darkFg: '#4DA3FF', darkBg: '#0C2440' },
    warning: { lightFg: '#7A4A00', lightBg: '#FFF4CC', darkFg: '#FFD166', darkBg: '#3A2C05' },
  },
} as const;
