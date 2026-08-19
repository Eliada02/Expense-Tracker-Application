import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { useTheme } from '../../context/ThemeContext';

// Registered once for the whole app instead of inside each chart component.
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
);

/**
 * Chart.js draws to a canvas and so cannot read CSS custom properties. This
 * returns the palette for the active theme and, because it depends on the
 * theme value, forces the charts to re-render when dark mode is toggled.
 */
export function useChartTheme() {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return {
    theme,
    text: dark ? '#98a2b3' : '#6b7280',
    grid: dark ? 'rgba(255,255,255,0.07)' : 'rgba(17,24,39,0.07)',
    surface: dark ? '#141a28' : '#ffffff',
    border: dark ? '#262f45' : '#e5e7eb',
    primary: dark ? '#818cf8' : '#4f46e5',
    success: dark ? '#34d399' : '#059669',
    danger: dark ? '#f87171' : '#dc2626',
  };
}

/** Shared options so every chart has the same typography and tooltip style. */
export function baseOptions(palette) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: {
          color: palette.text,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: palette.surface,
        titleColor: palette.text,
        bodyColor: palette.text,
        borderColor: palette.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 4,
      },
    },
  };
}
