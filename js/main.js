/**
 * main.js — Utilitas Global Kampung Gedongan
 *
 * Tanggung jawab: fitur-fitur UI yang bersifat global/lintas-section:
 *   1. Smooth scrolling untuk semua anchor link (#)
 *   2. Sticky navigation dengan efek shadow saat di-scroll
 *   3. Mobile menu toggle (hamburger)
 *
 * Catatan: product-card hover handler dihapus karena class .product-card
 * tidak digunakan di HTML manapun (dead code — lihat laporan analisis awal).
 */

const MainModule = (() => {
  // ─── Smooth Scroll ────────────────────────────────────────────────────────

  /**
   * Menerapkan smooth scroll ke semua anchor link yang mengarah ke section (#).
   * Mencegah perilaku default browser yang langsung melompat ke target.
   */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ─── Sticky Navigation ────────────────────────────────────────────────────

  /**
   * Menambahkan/menghapus shadow pada navbar berdasarkan posisi scroll.
   * Threshold: 50px dari atas halaman.
   */
  function initStickyNav() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      const isPastThreshold = window.scrollY > 50;
      nav.classList.toggle('shadow-md', isPastThreshold);
      nav.classList.toggle('bg-opacity-90', !isPastThreshold);
    });
  }

  // ─── Mobile Menu ──────────────────────────────────────────────────────────

  /**
   * Mengaktifkan tombol hamburger untuk membuka/menutup menu mobile.
   */
  function initMobileMenu() {
    const btn  = document.getElementById('mobile-menu-button');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    initSmoothScroll();
    initStickyNav();
    initMobileMenu();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  MainModule.init();
});
