/**
 * map.js — Peta Interaktif Potensi UMKM Kampung Gedongan
 *
 * Arsitektur : IIFE Module Pattern
 * Versi      : 2.0.0 (Final — 7-Day Sprint KKN)
 *
 * Fitur:
 *   ✅ Peta preview dasar (OpenStreetMap / Leaflet.js)
 *   ✅ Fetch & parsing data dari locations.json
 *   ✅ Marker & popup kustom per kategori UMKM
 *   ✅ Mode fullscreen overlay (lazy-initialized)
 *   ✅ Filter interaktif per kategori dengan sinkronisasi dua peta
 *   ✅ Responsif mobile (touch-friendly, 100dvh, safe-area inset)
 */

const MapModule = (() => {
  // ─── State ─────────────────────────────────────────────────────────────────────────
  let previewMap        = null;
  let fullscreenMap     = null;  // Instance peta fullscreen (lazy init)
  let locations         = [];
  let isFullscreenOpen  = false;
  let previewMarkers    = [];    // Daftar marker aktif di preview map
  let fullscreenMarkers = [];    // Daftar marker aktif di fullscreen map
  let currentCategory   = 'all';  // Kategori filter aktif saat ini

  // ─── Konstanta Konfigurasi ───────────────────────────────────────────────────
  const CONFIG = {
    center: [-7.8220, 110.4020],
    previewZoom: 16,
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    dataUrl: 'locations.json',
  };

  /**
   * Palet warna marker berdasarkan kategori UMKM.
   * Kerajinan menggunakan hijau (primary brand color) sebagai default.
   */
  const CATEGORY_COLORS = {
    kerajinan:  '#16a34a',  // green-600  — sesuai brand utama website
    seni:       '#92400e',  // amber-800  — hangat, kesan budaya
    kuliner:    '#ea580c',  // orange-600 — identik dengan makanan
    jasa:       '#2563eb',  // blue-600   — netral/profesional
    lingkungan: '#0d9488',  // teal-600   — identik dengan alam/lingkungan sekitar
    perdagangan: '#7c3aed', // violet-600 — identik dengan toko/perdagangan
  };

  // ─── Basemap ─────────────────────────────────────────────────────────────────

  /**
   * Memasang tile layer OpenStreetMap ke instance peta.
   * Dipisah agar reusable untuk preview map & fullscreen map (Day 4).
   * @param {L.Map} mapInstance
   */
  function attachTileLayer(mapInstance) {
    L.tileLayer(CONFIG.tileUrl, {
      attribution: CONFIG.attribution,
      maxZoom: 19,
    }).addTo(mapInstance);
  }

  /**
   * Menginisialisasi peta preview di #map-preview.
   * scrollWheelZoom: false → mencegah scroll hijacking.
   */
  function initPreviewMap() {
    const mapEl = document.getElementById('map-preview');
    if (!mapEl) return;

    previewMap = L.map('map-preview', {
      center: CONFIG.center,
      zoom: CONFIG.previewZoom,
      scrollWheelZoom: false,  // Mencegah scroll hijacking di halaman
      zoomControl: true,
      // Day 6: nonaktifkan Leaflet's tap handler bawaan (iOS double-tap zoom)
      // karena berbenturan dengan native browser pinch-to-zoom gesture
      tap: false,
    });

    attachTileLayer(previewMap);
  }

  // ─── Data Fetching ───────────────────────────────────────────────────────────

  /**
   * Mengambil data UMKM dari locations.json via Fetch API.
   * @returns {Promise<Array>} Array of location objects, atau [] jika error.
   */
  async function fetchLocations() {
    try {
      const response = await fetch(CONFIG.dataUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Gagal mengambil ${CONFIG.dataUrl}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.locations)) {
        throw new Error('Format tidak valid: "locations" bukan array');
      }

      return data.locations;

    } catch (error) {
      console.error('[MapModule] fetchLocations error:', error.message);
      return [];
    }
  }

  // ─── Markers ─────────────────────────────────────────────────────────────────

  /**
   * Membuat custom icon berbentuk pin lokasi (▼) menggunakan L.divIcon.
   * Warna pin ditentukan berdasarkan kategori UMKM.
   *
   * @param {string} category - Kategori UMKM ('kerajinan' | 'seni' | 'kuliner' | 'jasa')
   * @returns {L.DivIcon}
   */
  function createMarkerIcon(category) {
    const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.kerajinan;

    // SVG teardrop pin — lebih reliable dari CSS transform di dalam divIcon
    // filter drop-shadow bekerja pada shape SVG (box-shadow tidak bisa pada non-rect)
    const svgPin = `
      <svg xmlns="http://www.w3.org/2000/svg"
           width="32" height="44" viewBox="0 0 32 44"
           style="display:block;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3))">
        <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 16 44 16 44S32 24.837 32 16C32 7.163 24.837 0 16 0Z"
              fill="${color}"/>
        <circle cx="16" cy="15" r="7" fill="white" opacity="0.9"/>
      </svg>
    `;

    return L.divIcon({
      className:   'umkm-marker-icon',
      html:        svgPin,
      iconSize:    [32, 44],
      iconAnchor:  [16, 44],   // anchor di ujung bawah pin
      popupAnchor: [0, -46],   // popup muncul di atas pin
    });
  }

  // ─── Popup ───────────────────────────────────────────────────────────────────

  /**
   * Menghasilkan string HTML untuk konten popup Leaflet.
   * Menggunakan class CSS custom (umkm-popup-*) yang didefinisikan di style.css.
   *
   * @param {Object} loc - Satu objek lokasi dari locations.json
   * @returns {string} HTML string
   */
  function createPopupContent(loc) {
    const mapsIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;flex-shrink:0">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>`;

    // Ikon tanda tanya — digunakan pada badge "belum terdaftar"
    const unknownIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;flex-shrink:0">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/>
    </svg>`;

    // Render tombol/badge bagian bawah berdasarkan ketersediaan Google Maps URL
    const hasGoogleMaps = loc.googleMapsUrl && loc.googleMapsUrl !== '-';
    const mapsButton = hasGoogleMaps
      ? `<a
          href="${loc.googleMapsUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="umkm-popup-btn"
        >
          ${mapsIconSvg}&nbsp; Buka di Google Maps
        </a>`
      : `<div class="umkm-popup-btn-unavailable">
          ${unknownIconSvg}&nbsp; Belum terdaftar di Google Maps
        </div>`;

    return `
      <div class="umkm-popup-card">
        <img
          src="${loc.photo}"
          alt="${loc.name}"
          class="umkm-popup-photo"
          onerror="this.src='assets/logo.png'; this.style.objectFit='contain'; this.style.padding='20px'; this.style.background='#f0fdf4';"
        />
        <div class="umkm-popup-body">
          <span class="umkm-popup-badge">${loc.categoryLabel}</span>
          <h3 class="umkm-popup-title">${loc.name}</h3>
          <p class="umkm-popup-desc">${loc.description}</p>
          <p class="umkm-popup-address">${mapsIconSvg}&nbsp;${loc.address}</p>
          ${mapsButton}
        </div>
      </div>
    `;
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  /**
   * Merender seluruh marker UMKM ke atas instance peta yang diberikan.
   * Setiap marker memiliki popup yang terikat dengan data masing-masing UMKM.
   *
   * @param {L.Map} mapInstance - Target peta (preview atau fullscreen)
   * @param {Array} locationList - Array objek lokasi yang disaring
   * @param {Array} markerArray - Array penampung instansi marker (previewMarkers/fullscreenMarkers)
   */
  function renderMarkers(mapInstance, locationList, markerArray) {
    // Bersihkan marker lama dari peta terlebih dahulu
    markerArray.forEach(m => mapInstance.removeLayer(m));
    markerArray.length = 0;

    locationList.forEach(loc => {
      const marker = L.marker(loc.coordinates, {
        icon:  createMarkerIcon(loc.category),
        title: loc.name,
        alt:   loc.name,
      });

      // Day 6: auto-pan padding agar popup tidak tertutup filter bar atau tepi layar.
      // autoPanPaddingTopLeft: [kiri, atas], autoPanPaddingBottomRight: [kanan, bawah]
      marker.bindPopup(createPopupContent(loc), {
        maxWidth:  300,
        className: 'umkm-popup-wrapper',
        autoPanPaddingTopLeft:     L.point(12, 12),
        autoPanPaddingBottomRight: L.point(12, 12),
      });

      marker.addTo(mapInstance);
      markerArray.push(marker);
    });
  }

  // ─── Fullscreen ────────────────────────────────────────────────────────────────────

  /**
   * Inisialisasi peta fullscreen secara lazy — hanya dipanggil saat tombol
   * pertama kali diklik, bukan saat halaman dimuat. Hemat resource.
   * Menggunakan posisi center preview map agar transisi terasa natural.
   */
  function initFullscreenMap() {
    if (fullscreenMap) return;  // Sudah pernah diinisialisasi, skip

    const mapEl = document.getElementById('map-fullscreen');
    if (!mapEl) return;

    fullscreenMap = L.map('map-fullscreen', {
      center: previewMap ? previewMap.getCenter() : CONFIG.center,
      zoom: CONFIG.previewZoom + 1,  // Satu level lebih detail di fullscreen
      scrollWheelZoom: true,          // Diizinkan di fullscreen (tidak ada page scroll)
      zoomControl: true,
    });

    attachTileLayer(fullscreenMap);

    // Ambil data lokasi sesuai dengan filter aktif saat ini
    const filtered = currentCategory === 'all'
      ? locations
      : locations.filter(loc => loc.category === currentCategory);

    renderMarkers(fullscreenMap, filtered, fullscreenMarkers);
  }

  /**
   * Membuka overlay fullscreen.
   * Urutan: tampilkan overlay → lazy init peta → invalidateSize.
   * invalidateSize() wajib dipanggil setelah container visible agar tile tidak blank.
   */
  function openFullscreen() {
    const overlay = document.getElementById('map-fullscreen-overlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    isFullscreenOpen = true;

    // Double rAF: frame pertama overlay di-paint, frame kedua layout dicompute.
    // Ini memastikan #map-fullscreen sudah punya tinggi saat Leaflet mengukurnya.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initFullscreenMap();
        if (fullscreenMap) fullscreenMap.invalidateSize({ animate: false });
      });
    });
  }

  /**
   * Menutup overlay fullscreen dan memulihkan scroll halaman.
   */
  function closeFullscreen() {
    const overlay = document.getElementById('map-fullscreen-overlay');
    if (!overlay) return;

    overlay.style.display = 'none';
    document.body.style.overflow = '';  // Pulihkan scroll
    isFullscreenOpen = false;
  }

  /**
   * Mengikat semua event listener untuk toggle fullscreen:
   * - Tombol "Buka Peta Penuh"
   * - Tombol "Tutup" di dalam overlay
   * - Tombol Escape (aksesibilitas keyboard)
   */
  function bindFullscreenEvents() {
    const openBtn = document.getElementById('btn-open-fullscreen');
    openBtn?.addEventListener('click', openFullscreen);

    // Event delegation untuk close button: lebih robust daripada getElementById
    // karena tidak bergantung pada waktu inisialisasi elemen di DOM.
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-close-fullscreen')) {
        closeFullscreen();
      }
    });

    // Tutup dengan Escape key (aksesibilitas)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isFullscreenOpen) closeFullscreen();
    });
  }

  // ─── Filtering — Day 5 ─────────────────────────────────────────────────────────────

  /**
   * Menyaring marker yang ditampilkan pada peta berdasarkan kategori terpilih.
   * Mensinkronkan filter pada preview map dan fullscreen map sekaligus.
   * @param {string} category - Kategori yang dipilih ('all' | 'kerajinan' | 'seni' | 'kuliner' | 'jasa')
   */
  function applyFilter(category) {
    currentCategory = category;

    const filtered = category === 'all'
      ? locations
      : locations.filter(loc => loc.category === category);

    if (previewMap) {
      renderMarkers(previewMap, filtered, previewMarkers);
    }

    if (fullscreenMap) {
      renderMarkers(fullscreenMap, filtered, fullscreenMarkers);
    }

    updateFilterUI(category);
  }

  /**
   * Memperbarui visual tombol filter (pill) yang aktif.
   * @param {string} category - Kategori yang aktif
   */
  function updateFilterUI(category) {
    const pills = document.querySelectorAll('.map-filter-pill');
    pills.forEach(pill => {
      if (pill.getAttribute('data-category') === category) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  /**
   * Mengikat event listener klik pada tombol filter (menggunakan event delegation).
   */
  function bindFilterEvents() {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.map-filter-pill');
      if (button) {
        const category = button.getAttribute('data-category');
        if (category) {
          applyFilter(category);
        }
      }
    });
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Entry point module.
   * Urutan: init peta → fetch data → render marker
   */
  async function init() {
    initPreviewMap();

    locations = await fetchLocations();

    if (locations.length > 0) {
      renderMarkers(previewMap, locations, previewMarkers);
    }

    bindFullscreenEvents();
    bindFilterEvents();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  MapModule.init();
});
