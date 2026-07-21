/**
 * slider.js — Hero Slideshow Kampung Gedongan
 *
 * Tanggung jawab: mengelola transisi antar slide di section hero (#home).
 * Auto-slide setiap 4 detik, dapat dikontrol manual via tombol prev/next.
 */

const SliderModule = (() => {
  // ─── State ────────────────────────────────────────────────────────────────
  let currentSlide = 0;
  let slideInterval = null;

  // ─── Konstanta ────────────────────────────────────────────────────────────
  const SLIDE_DURATION_MS = 4000;

  // ─── DOM Elements ─────────────────────────────────────────────────────────
  const slides = document.querySelectorAll('#hero-slides .slide');
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');

  // ─── Logic ────────────────────────────────────────────────────────────────

  /**
   * Menampilkan slide pada index tertentu dan menyembunyikan yang lain.
   * @param {number} index - Index slide yang akan ditampilkan
   */
  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('opacity-100', i === index);
      slide.classList.toggle('opacity-0', i !== index);
    });
  }

  function goToNext() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }

  function goToPrev() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
  }

  function startAutoSlide() {
    slideInterval = setInterval(goToNext, SLIDE_DURATION_MS);
  }

  /**
   * Reset timer auto-slide. Dipanggil setelah interaksi manual
   * agar hitungan mundur dimulai ulang dari 0.
   */
  function restartAutoSlide() {
    clearInterval(slideInterval);
    startAutoSlide();
  }

  // ─── Event Listeners ──────────────────────────────────────────────────────
  function bindEvents() {
    nextBtn.addEventListener('click', () => {
      goToNext();
      restartAutoSlide();
    });

    prevBtn.addEventListener('click', () => {
      goToPrev();
      restartAutoSlide();
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    if (!slides.length || !nextBtn || !prevBtn) return;
    bindEvents();
    startAutoSlide();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  SliderModule.init();
});
