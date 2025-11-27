/**
 * ZANTARA Theme Manager
 * Gestisce il tema day/night per tutte le pagine
 */

/* eslint-env browser, es6 */
/* global localStorage, document, window */
(function() {
  'use strict';

  const THEME_STORAGE_KEY = 'zantara-theme';
  const DEFAULT_THEME = 'night';

  /**
   * Carica tema salvato o usa default
   */
  function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
    applyTheme(savedTheme);
    return savedTheme;
  }

  /**
   * Applica tema a html e body
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }

  /**
   * Salva tema in localStorage
   */
  function saveTheme(theme) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  /**
   * Toggle tema tra day e night
   */
  function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || DEFAULT_THEME;
    const newTheme = currentTheme === 'day' ? 'night' : 'day';
    applyTheme(newTheme);
    saveTheme(newTheme);
    return newTheme;
  }

  /**
   * Inizializza tema al caricamento pagina
   */
  function initTheme() {
    loadTheme();
  }

  /**
   * Setup toggle button se presente
   */
  function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        toggleTheme();
      });
    }
  }

  // Inizializza al caricamento DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTheme();
      setupThemeToggle();
    });
  } else {
    initTheme();
    setupThemeToggle();
  }

  // Export per uso esterno
  window.ZantaraTheme = {
    load: loadTheme,
    toggle: toggleTheme,
    apply: applyTheme,
    save: saveTheme
  };
})();
