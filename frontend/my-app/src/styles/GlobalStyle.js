import { createGlobalStyle } from 'styled-components';

/**
 * The whole design system lives in these custom properties. Components never
 * hardcode a colour or a radius, which is what makes dark mode a single
 * `data-theme` attribute swap rather than a theme engine.
 */
export const GlobalStyle = createGlobalStyle`
  :root {
    /* Spacing scale (4px base) */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-5: 1.5rem;
    --space-6: 2rem;
    --space-7: 3rem;

    /* Radii */
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
    --radius-full: 999px;

    /* Type scale */
    --text-xs: 0.75rem;
    --text-sm: 0.875rem;
    --text-base: 1rem;
    --text-lg: 1.125rem;
    --text-xl: 1.375rem;
    --text-2xl: 1.75rem;
    --text-3xl: 2.25rem;

    --sidebar-width: 260px;
    --topbar-height: 64px;

    /* Brand colours are theme independent */
    --brand-500: #4f46e5;
    --brand-600: #4338ca;
    --brand-400: #818cf8;
  }

  :root, [data-theme='light'] {
    --bg: #f5f6fa;
    --surface: #ffffff;
    --surface-2: #f9fafb;
    --surface-hover: #f3f4f6;
    --border: #e5e7eb;
    --border-strong: #d1d5db;

    --text: #111827;
    --text-muted: #6b7280;
    --text-subtle: #9ca3af;

    --primary: var(--brand-500);
    --primary-hover: var(--brand-600);
    --primary-contrast: #ffffff;
    --primary-soft: #eef2ff;

    --success: #059669;
    --success-soft: #ecfdf5;
    --warning: #d97706;
    --warning-soft: #fffbeb;
    --danger: #dc2626;
    --danger-soft: #fef2f2;

    --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06);
    --shadow-md: 0 4px 12px rgba(16, 24, 40, 0.08);
    --shadow-lg: 0 12px 32px rgba(16, 24, 40, 0.14);

    --skeleton: #e9ecf2;
    --skeleton-shine: #f4f6fa;
    color-scheme: light;
  }

  [data-theme='dark'] {
    --bg: #0b0f19;
    --surface: #141a28;
    --surface-2: #1a2132;
    --surface-hover: #212a3d;
    --border: #262f45;
    --border-strong: #364157;

    --text: #e8eaf0;
    --text-muted: #98a2b3;
    --text-subtle: #6b7688;

    --primary: var(--brand-400);
    --primary-hover: #a5b4fc;
    --primary-contrast: #0b0f19;
    --primary-soft: #1e2340;

    --success: #34d399;
    --success-soft: #0d2a22;
    --warning: #fbbf24;
    --warning-soft: #2c2211;
    --danger: #f87171;
    --danger-soft: #33161a;

    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.45);
    --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.55);

    --skeleton: #202940;
    --skeleton-shine: #2a3452;
    color-scheme: dark;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
  }

  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: var(--text-base);
    line-height: 1.5;
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    /* Only the theme tokens transition, so switching modes is smooth without
       animating layout. */
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  h1, h2, h3, h4 {
    margin: 0;
    color: var(--text);
    font-weight: 600;
    line-height: 1.25;
  }

  p { margin: 0; }
  ul { margin: 0; padding: 0; list-style: none; }

  button, input, select, textarea {
    font: inherit;
    color: inherit;
  }

  a {
    color: var(--primary);
    text-decoration: none;
  }

  /* Available to screen readers, hidden visually. */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Visible focus for keyboard users only. */
  :focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb {
    background: var(--border-strong);
    border-radius: var(--radius-full);
    border: 3px solid transparent;
    background-clip: content-box;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
