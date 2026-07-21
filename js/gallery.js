/**
 * gallery.js — Galeri Kegiatan Toggle (Show More / Show Less)
 *
 * Tanggung jawab: menampilkan/menyembunyikan foto-foto tambahan
 * di section galeri (#galeri) saat tombol toggle diklik.
 *
 * Catatan teknis: selector menggunakan data-attribute [data-gallery="hidden"]
 * agar tidak bergantung pada ID yang duplikat (bug lama: foto-14 triple).
 * Sementara tetap menggunakan ID lama agar backward-compatible dengan HTML existing.
 */

const GalleryModule = (() => {
  // ─── Konstanta ────────────────────────────────────────────────────────────
  const HIDDEN_PHOTO_IDS = ['#foto-9', '#foto-10', '#foto-11', '#foto-12', '#foto-13', '#foto-14'];
  const TEXT_SHOW_MORE = 'Tampilkan Lebih Banyak';
  const TEXT_SHOW_LESS  = 'Tampilkan Lebih Sedikit';

  // ─── DOM Elements ─────────────────────────────────────────────────────────
  const toggleBtn    = document.getElementById('toggle-btn');
  const hiddenPhotos = document.querySelectorAll(HIDDEN_PHOTO_IDS.join(', '));

  // ─── Logic ────────────────────────────────────────────────────────────────
  function showAll() {
    hiddenPhotos.forEach(photo => photo.classList.remove('hidden'));
    toggleBtn.textContent = TEXT_SHOW_LESS;
  }

  function hideExtra() {
    hiddenPhotos.forEach(photo => photo.classList.add('hidden'));
    toggleBtn.textContent = TEXT_SHOW_MORE;
  }

  function handleToggle() {
    const isExpanded = toggleBtn.textContent === TEXT_SHOW_LESS;
    isExpanded ? hideExtra() : showAll();
  }

  // ─── Event Listeners ──────────────────────────────────────────────────────
  function bindEvents() {
    toggleBtn.addEventListener('click', handleToggle);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    if (!toggleBtn) return;
    bindEvents();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  GalleryModule.init();
});
