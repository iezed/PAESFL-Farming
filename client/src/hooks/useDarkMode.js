import { useState, useEffect } from 'react';

/**
 * Hook to detect and track dark mode state
 * Listens to changes on document.documentElement class list
 */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark-mode');
  });

  useEffect(() => {
    // Create observer to watch for class changes on document element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const hasDarkMode = document.documentElement.classList.contains('dark-mode');
          setIsDark(hasDarkMode);
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Cleanup
    return () => observer.disconnect();
  }, []);

  return isDark;
}

/**
 * Get chart color scheme based on dark mode
 */
export function useChartColors() {
  const isDark = useDarkMode();

  return {
    primary: isDark ? '#60a5fa' : '#3b82f6',
    secondary: isDark ? '#34d399' : '#10b981',
    tertiary: isDark ? '#fbbf24' : '#f59e0b',
    quaternary: isDark ? '#f472b6' : '#ec4899',
    quinary: isDark ? '#a78bfa' : '#8b5cf6',
    senary: isDark ? '#fb923c' : '#f97316',
    text: isDark ? '#e5e7eb' : '#1f2937',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    grid: isDark ? '#374151' : '#e5e7eb',
    tooltip: {
      bg: isDark ? '#1f2937' : '#ffffff',
      border: isDark ? '#374151' : '#e5e7eb',
      text: isDark ? '#e5e7eb' : '#1f2937'
    },
    axis: {
      line: isDark ? '#4b5563' : '#d1d5db',
      tick: isDark ? '#9ca3af' : '#6b7280'
    }
  };
}
