/**
 * Theme management — dark/light mode with OS detection and localStorage persistence.
 */

const STORAGE_KEY = 'algedisc-theme';
const listeners = [];

let dark = false;

export function isDark() { return dark; }

export function toggle() {
  setDark(!dark);
}

export function onChange(fn) {
  listeners.push(fn);
}

function setDark(value) {
  dark = value;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  for (const fn of listeners) fn(dark);
}

export function initTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    setDark(stored === 'dark');
  } else {
    // Auto-detect from OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(prefersDark);
  }

  // Listen for OS preference changes (only applies when no manual override)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setDark(e.matches);
    }
  });
}
