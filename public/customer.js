/**
 * MovieHub Customer Portal - Comprehensive Cinema Controller
 */

const $ = (selector) => document.querySelector(selector);

// Master Data
let movies = [];
let cinemas = [];
let showtimes = [];

// Filter State
let activeSearchQuery = '';
let activeCityFilter = 'all';
let activeGenreFilter = 'all';
let activeFormatFilter = 'all';

// PVR Showtime Info Preview State
let previewedPvrShowtime = null;
let previewedPvrCinema = null;

// Navigation & Booking State
let selectedMovie = null;
let selectedDate = null;
let selectedShowtime = null;
let selectedSeats = [];
let selectedSnacks = {}; // { 'popcorn_caramel': { id, name, qty, price } }
let currentShowtimeDetails = null;
let currentPricingTiers = { VIP: 450, Prime: 300, Classic: 200 };

// 10-Minute Seat Timer State
let seatTimerInterval = null;
let seatTimerSecondsRemaining = 600; // 10 minutes

// Auditorium Configuration: Classic at the front (closest to screen), VIP at the back
const AUDITORIUM_CONFIG = [
  { tier: 'Classic', label: 'Classic Standard', rows: ['A', 'B', 'C', 'D'], priceKey: 'Classic' },
  { tier: 'Prime', label: 'Prime Club', rows: ['E', 'F', 'G'], priceKey: 'Prime' },
  { tier: 'VIP', label: 'VIP Club Recliners', rows: ['H'], priceKey: 'VIP' },
];
const SEATS_PER_ROW = 12;
const AISLE_AFTER_SEATS = [3, 9];

// F&B Concessions Catalog (dynamic from /api/snacks, with fallback)
let snacksCatalog = [
  { id: 'popcorn_caramel', name: 'Caramel Popcorn (Jumbo)', icon: '🍿', price: 240, description: 'Large sweet & crunchy tub' },
  { id: 'popcorn_salted', name: 'Classic Salted Butter Popcorn', icon: '🍿', price: 190, description: 'Freshly popped theater butter' },
  { id: 'nachos_cheese', name: 'Loaded Nachos & Jalapeño Cheese', icon: '🧀', price: 220, description: 'Crisp tortilla with warm salsa dip' },
  { id: 'fountain_pepsi', name: 'Chilled Fountain Pepsi (500ml)', icon: '🥤', price: 120, description: 'Refreshing 500ml beverage' },
  { id: 'combo_duo', name: 'Duo Cinema Combo', icon: '🎟️', price: 399, description: '1 Jumbo Popcorn + 2 Fountain Sodas' },
];

let appliedPromo = null;

// Trailers Dictionary
const MOVIE_TRAILERS = {
  'Interstellar': 'https://www.youtube.com/embed/zSWdZVtXT7E',
  'Dune: Part Two': 'https://www.youtube.com/embed/Way9Dexny3w',
  'Oppenheimer': 'https://www.youtube.com/embed/uYPbbksJxIg',
  'Spirited Away': 'https://www.youtube.com/embed/ByXuk9QqQkk',
};

// Date Formatter
function formatDateLabel(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const isToday =
    today.getFullYear() === y &&
    today.getMonth() === m - 1 &&
    today.getDate() === d;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    tomorrow.getFullYear() === y &&
    tomorrow.getMonth() === m - 1 &&
    tomorrow.getDate() === d;

  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });

  if (isToday) return `Today, ${d} ${monthName}`;
  if (isTomorrow) return `Tomorrow, ${d} ${monthName}`;
  return `${dayName}, ${d} ${monthName}`;
}

// Minimal, Self-Contained SVG QR Code Generator
function generateQrSvg(text) {
  // Generate deterministic grid pattern based on text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const size = 21;
  const rects = [];

  // Corner Finder Patterns
  const isCorner = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

  // Build finder patterns
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let filled = false;

      // Outer finder boxes
      if (
        (r === 0 || r === 6 || c === 0 || c === 6) && (r < 7 && c < 7) ||
        (r === 0 || r === 6 || c === size - 7 || c === size - 1) && (r < 7 && c >= size - 7) ||
        (r === size - 7 || r === size - 1 || c === 0 || c === 6) && (r >= size - 7 && c < 7)
      ) {
        filled = true;
      } else if (
        // Inner finder centers
        (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
        (r >= 2 && r <= 4 && c >= size - 5 && c <= size - 3) ||
        (r >= size - 5 && r <= size - 3 && c >= 2 && c <= 4)
      ) {
        filled = true;
      } else if (!isCorner(r, c)) {
        // Data bits derived from hash and positions
        const val = Math.abs(Math.sin((r * size + c + hash) * 12.9898) * 43758.5453);
        filled = val - Math.floor(val) > 0.45;
      }

      if (filled) {
        rects.push(`<rect x="${c * 5}" y="${r * 5}" width="5" height="5" fill="#17151c" />`);
      }
    }
  }

  return `<svg viewBox="0 0 ${size * 5} ${size * 5}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect width="100%" height="100%" fill="#ffffff" />
    ${rects.join('')}
  </svg>`;
}

// Master Data Fetcher
async function loadData() {
  try {
    const [fetchedCinemas, fetchedMovies, fetchedShowtimes, fetchedSnacks] = await Promise.all([
      fetch('/api/cinemas').then((r) => r.json()),
      fetch('/api/movies').then((r) => r.json()),
      fetch('/api/showtimes').then((r) => r.json()),
      fetch('/api/snacks').then((r) => r.json()).catch(() => null),
    ]);

    cinemas = fetchedCinemas;
    movies = fetchedMovies;
    showtimes = fetchedShowtimes;
    if (Array.isArray(fetchedSnacks) && fetchedSnacks.length) {
      snacksCatalog = fetchedSnacks;
    }

    populateCityFilter();
    $('#cinemaCount').textContent = `${cinemas.length} Cinemas Active`;
    renderMovies();
  } catch (error) {
    console.error('Failed to load cinema data:', error);
    $('#cinemaCount').textContent = 'Failed to load cinema schedule';
  }
}

function populateCityFilter() {
  const citySelect = $('#cityFilter');
  const distinctCities = Array.from(new Set(cinemas.map((c) => c.city))).sort();
  citySelect.replaceChildren();

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'All Cities';
  citySelect.append(allOpt);

  for (const city of distinctCities) {
    const opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    citySelect.append(opt);
  }
}

// Movie Catalog Filtering & Rendering
function getFilteredMovies() {
  return movies.filter((m) => {
    // Text search query
    const textMatches =
      !activeSearchQuery ||
      `${m.title} ${m.genre} ${(m.languages || []).join(' ')}`.toLowerCase().includes(activeSearchQuery);

    // Genre filter
    const genreMatches =
      activeGenreFilter === 'all' ||
      m.genre.toLowerCase().includes(activeGenreFilter.toLowerCase());

    // City filter
    let cityMatches = true;
    if (activeCityFilter !== 'all') {
      const movieShowtimes = showtimes.filter((s) => s.movieId === m.id);
      cityMatches = movieShowtimes.some((s) => s.city === activeCityFilter);
    }

    return textMatches && genreMatches && cityMatches;
  });
}

function renderMovies() {
  const grid = $('#moviesGrid');
  grid.replaceChildren();

  const filtered = getFilteredMovies();

  if (!filtered.length) {
    grid.innerHTML = '<p style="color: var(--text-dim); padding: 40px; grid-column: 1 / -1; text-align: center;">No movies found matching these filters.</p>';
    return;
  }

  for (const movie of filtered) {
    const card = document.createElement('article');
    card.className = 'movie-card';

    // Poster with Trailer Badge Overlay
    const posterWrap = document.createElement('div');
    posterWrap.className = 'poster-wrap';

    if (MOVIE_TRAILERS[movie.title]) {
      const trailerOverlay = document.createElement('button');
      trailerOverlay.type = 'button';
      trailerOverlay.className = 'trailer-badge-overlay';
      trailerOverlay.innerHTML = '▶ Watch Trailer';
      trailerOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        openTrailerModal(movie);
      });
      posterWrap.append(trailerOverlay);
    }

    if (movie.posterUrl) {
      const img = document.createElement('img');
      img.className = 'poster-img';
      img.src = movie.posterUrl;
      img.alt = movie.title;
      img.loading = 'lazy';
      posterWrap.append(img);
    }
    card.append(posterWrap);

    // Content
    const content = document.createElement('div');
    content.className = 'movie-content';

    const header = document.createElement('div');
    header.className = 'movie-header';
    const title = document.createElement('h3');
    title.className = 'movie-title';
    title.textContent = movie.title;
    const rating = document.createElement('span');
    rating.className = 'movie-rating';
    rating.textContent = `★ ${movie.ratingValue ? movie.ratingValue.toFixed(1) : movie.rating}`;
    header.append(title, rating);

    const meta = document.createElement('div');
    meta.className = 'movie-meta';
    meta.textContent = `${movie.releaseYear} · ${movie.genre} · ${movie.durationMinutes}m`;

    // Experience badges
    const techBadges = document.createElement('div');
    techBadges.className = 'tech-badges-row';
    techBadges.innerHTML = `
      <span class="tech-badge" title="High dynamic range projection">IMAX 4K</span>
      <span class="tech-badge" title="Spatial audio system">Dolby Atmos</span>
      <span class="tech-badge">${movie.certificate || 'U/A'}</span>
    `;

    const desc = document.createElement('p');
    desc.className = 'movie-desc';
    desc.textContent = movie.description;

    const actionsRow = document.createElement('div');
    actionsRow.className = 'card-actions-row';

    if (MOVIE_TRAILERS[movie.title]) {
      const trailerBtn = document.createElement('button');
      trailerBtn.type = 'button';
      trailerBtn.className = 'trailer-btn';
      trailerBtn.innerHTML = '▶ Trailer';
      trailerBtn.addEventListener('click', () => openTrailerModal(movie));
      actionsRow.append(trailerBtn);
    }

    const bookBtn = document.createElement('button');
    bookBtn.className = 'book-btn';
    bookBtn.textContent = 'Select Showtimes 🎟️';
    bookBtn.addEventListener('click', () => openCinemaShowtimesModal(movie));
    actionsRow.append(bookBtn);

    content.append(header, meta, techBadges, desc, actionsRow);
    card.append(content);
    grid.append(card);
  }
}

// ================= TRAILER MODAL =================
function openTrailerModal(movie) {
  const url = MOVIE_TRAILERS[movie.title];
  if (!url) return;

  $('#trailerMovieTitle').textContent = `Official Trailer: ${movie.title}`;
  $('#trailerIframe').src = `${url}?autoplay=1`;
  $('#trailerModal').showModal();
}

function closeTrailerModal() {
  $('#trailerIframe').src = '';
  $('#trailerModal').close();
}

// ================= STEP 1: CINEMA HALLS & SHOWTIMES SCHEDULE =================
function openCinemaShowtimesModal(movie) {
  selectedMovie = movie;
  selectedSeats = [];
  selectedSnacks = {};
  stopSeatTimer();

  $('#scheduleMovieTitle').textContent = movie.title;
  $('#scheduleMovieMeta').textContent = `${movie.releaseYear} · ${movie.genre} · ${movie.durationMinutes}m · Rated ${movie.certificate || 'U/A'}`;

  const posterImg = $('#briefPoster');
  if (movie.posterUrl) {
    posterImg.src = movie.posterUrl;
    posterImg.hidden = false;
  } else {
    posterImg.hidden = true;
  }

  const movieShowtimes = showtimes.filter((s) => s.movieId === movie.id);
  const distinctDates = Array.from(new Set(movieShowtimes.map((s) => s.date))).sort();

  const today = new Date().toISOString().split('T')[0];
  if (!distinctDates.length) {
    distinctDates.push(today);
  }

  // Prioritize today or closest upcoming date instead of defaulting to earliest past date
  const upcomingDate = distinctDates.find((d) => d >= today);
  selectedDate = upcomingDate || distinctDates[0];
  renderDateTabs(distinctDates);
  renderCinemasForDate(selectedDate);

  $('#scheduleStep').hidden = false;
  $('#seatingStep').hidden = true;
  $('#ticketSuccess').hidden = true;

  $('#bookingModal').showModal();
}

function renderDateTabs(dates) {
  const container = $('#dateTabs');
  container.replaceChildren();

  for (const dateStr of dates) {
    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = `date-tab ${dateStr === selectedDate ? 'active' : ''}`;
    tabBtn.textContent = formatDateLabel(dateStr);
    tabBtn.addEventListener('click', () => {
      selectedDate = dateStr;
      container.querySelectorAll('.date-tab').forEach((b) => b.classList.remove('active'));
      tabBtn.classList.add('active');
      renderCinemasForDate(selectedDate);
    });
    container.append(tabBtn);
  }
}

function renderCinemasForDate(dateStr) {
  const container = $('#cinemasScheduleList');
  container.replaceChildren();

  let matchingShowtimes = showtimes.filter(
    (s) => s.movieId === selectedMovie.id && s.date === dateStr
  );

  if (activeFormatFilter !== 'all') {
    const f = activeFormatFilter.toLowerCase();
    matchingShowtimes = matchingShowtimes.filter((s) => {
      const combined = `${s.category || ''} ${s.screen || ''}`.toLowerCase();
      if (f === 'luxe') {
        return combined.includes('luxe') || combined.includes('gold') || combined.includes('vip');
      }
      return combined.includes(f);
    });
  }

  if (!matchingShowtimes.length) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-dim); background: var(--surface); border-radius: 14px; border: 1px dashed var(--line);">
        <p style="font-size: 15px; margin: 0; font-weight: 600;">No screenings match the selected experience format on this date.</p>
        <p style="font-size: 12px; color: var(--muted); margin: 6px 0 0;">Try selecting "All Formats" or another date above.</p>
      </div>
    `;
    return;
  }

  const cinemaMap = new Map();
  for (const s of matchingShowtimes) {
    if (!cinemaMap.has(s.cinemaId)) {
      const cinemaObj = cinemas.find((c) => c.id === s.cinemaId) || {
        name: s.cinema || 'Cinema Hall',
        city: s.city || '',
        address: '',
        amenities: [],
      };
      cinemaMap.set(s.cinemaId, { cinema: cinemaObj, showtimes: [] });
    }
    cinemaMap.get(s.cinemaId).showtimes.push(s);
  }

  const DEFAULT_PVR_AMENITIES = [
    '🎟️ M-Ticket',
    '🍿 F&B Service',
    '🔊 Dolby Atmos 7.1',
    '💺 Recliner Available',
    '♿ Wheelchair Access',
    '🔄 Cancellation Available',
  ];

  for (const [, { cinema, showtimes: hallShowtimes }] of cinemaMap) {
    const card = document.createElement('div');
    card.className = 'cinema-schedule-card';

    const header = document.createElement('div');
    header.className = 'cinema-card-header';

    const info = document.createElement('div');
    const name = document.createElement('h3');
    name.className = 'cinema-card-name';
    name.textContent = `${cinema.name} — ${cinema.city}`;
    const sub = document.createElement('p');
    sub.className = 'cinema-card-sub';
    sub.textContent = cinema.address || 'Auditorium Complex';
    info.append(name, sub);

    const facilitiesWrap = document.createElement('div');
    facilitiesWrap.className = 'cinema-facilities';
    const badges = (cinema.amenities && cinema.amenities.length > 0)
      ? cinema.amenities.slice(0, 4)
      : DEFAULT_PVR_AMENITIES.slice(0, 4);

    for (const am of badges) {
      const tag = document.createElement('span');
      tag.className = 'facility-badge';
      tag.textContent = am;
      facilitiesWrap.append(tag);
    }

    header.append(info, facilitiesWrap);
    card.append(header);

    const pillsGrid = document.createElement('div');
    pillsGrid.className = 'showtime-pills-grid';

    for (const show of hallShowtimes) {
      const pill = document.createElement('div');
      pill.className = 'showtime-pill';
      pill.setAttribute('role', 'button');
      pill.setAttribute('tabindex', '0');

      // Top row: time + PVR status badge
      const topRow = document.createElement('div');
      topRow.className = 'pill-header-row';

      const timeEl = document.createElement('span');
      timeEl.className = 'pill-time';
      timeEl.textContent = show.time;

      const bookingCount = show.bookingCount || 0;
      const occRatio = bookingCount / 96;
      let statusLabel = 'AVAILABLE';
      let statusClass = 'status-avail';
      if (occRatio >= 0.8) {
        statusLabel = 'ALMOST FULL';
        statusClass = 'status-full';
      } else if (occRatio >= 0.45) {
        statusLabel = 'FILLING FAST';
        statusClass = 'status-filling';
      }

      const statusBadge = document.createElement('span');
      statusBadge.className = `pill-status-tag ${statusClass}`;
      statusBadge.textContent = statusLabel;

      topRow.append(timeEl, statusBadge);

      // Category & Screen tag
      const catEl = document.createElement('div');
      catEl.className = 'pill-category';
      catEl.textContent = `${show.category} · ${show.screen}`;

      // Price & Details Info Button Row
      const priceRow = document.createElement('div');
      priceRow.className = 'pill-price-row';

      const classicPrice = Number(show.startingPrice);
      const primePrice = Math.round(classicPrice * 1.2);
      const vipPrice = Math.round(classicPrice * 1.5);

      const priceEl = document.createElement('span');
      priceEl.className = 'pill-price';
      priceEl.textContent = `From ₹${classicPrice.toLocaleString('en-IN')}`;

      const infoBtn = document.createElement('button');
      infoBtn.type = 'button';
      infoBtn.className = 'pill-info-btn';
      infoBtn.textContent = 'ℹ';
      infoBtn.title = 'View auditorium specs & seat pricing';
      infoBtn.setAttribute('aria-label', `Showtime details for ${show.time}`);
      infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPvrShowtimeInfo(show, cinema);
      });

      priceRow.append(priceEl, infoBtn);

      // Tier prices subtitle
      const tiersSub = document.createElement('div');
      tiersSub.className = 'pill-tiers-sub';
      tiersSub.textContent = `Classic: ₹${classicPrice} · Prime: ₹${primePrice} · VIP: ₹${vipPrice}`;

      // Call to action button hint
      const ctaEl = document.createElement('div');
      ctaEl.className = 'pill-cta-label';
      ctaEl.textContent = 'Select Seats →';

      pill.append(topRow, catEl, priceRow, tiersSub, ctaEl);

      pill.addEventListener('click', () => proceedToSeatingWindow(show));
      pill.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          proceedToSeatingWindow(show);
        }
      });

      pillsGrid.append(pill);
    }

    card.append(pillsGrid);
    container.append(card);
  }
}

// ================= PVR SHOWTIME SPECIFICATION MODAL =================
function openPvrShowtimeInfo(showtime, cinema) {
  previewedPvrShowtime = showtime;
  previewedPvrCinema = cinema;

  $('#pvrDialogBadge').textContent = `${showtime.screen} · ${showtime.category.toUpperCase()}`;
  $('#pvrDialogCinemaName').textContent = `${cinema.name} — ${cinema.city}`;
  $('#pvrDialogMovieMeta').textContent = `${selectedMovie ? selectedMovie.title : 'Movie'} · ${formatDateLabel(showtime.date)} @ ${showtime.time}`;

  const cat = (showtime.category || '').toLowerCase();
  const screen = (showtime.screen || '').toLowerCase();

  // Specs customization based on screen and format
  if (cat.includes('imax') || screen.includes('imax')) {
    $('#pvrSpecProjectionTitle').textContent = 'IMAX with Laser (Dual 4K Commercial)';
    $('#pvrSpecProjectionDesc').textContent = 'Pristine 4K laser projection with unparalleled brightness and 1.90:1 expanded aspect ratio.';
    $('#pvrSpecSoundTitle').textContent = 'IMAX 12-Channel Immersive Next-Gen Sound';
    $('#pvrSpecSoundDesc').textContent = 'Patented custom loudspeaker array delivers visceral sub-bass and pin-point directional acoustics.';
  } else if (cat.includes('4dx') || screen.includes('4dx')) {
    $('#pvrSpecProjectionTitle').textContent = 'High Definition RealD 3D Projection';
    $('#pvrSpecProjectionDesc').textContent = 'Ultra-crisp high lumen output synchronized with multi-sensory environmental atmospheric cues.';
    $('#pvrSpecSoundTitle').textContent = 'Dolby Digital 7.1 with Haptic Motion Sync';
    $('#pvrSpecSoundDesc').textContent = 'Precision subwoofers and in-seat vibrational feedback aligned to onscreen action.';
  } else if (cat.includes('dolby') || screen.includes('dolby')) {
    $('#pvrSpecProjectionTitle').textContent = 'Barco 4K RGB Pure Laser';
    $('#pvrSpecProjectionDesc').textContent = 'Razor-sharp laser contrast with true cinematic blacks, wide color gamut, and 60fps clarity.';
    $('#pvrSpecSoundTitle').textContent = 'Dolby Atmos 64-Channel Sound';
    $('#pvrSpecSoundDesc').textContent = 'Object-based 3D audio landscape with overhead ceiling arrays enveloping the auditorium.';
  } else {
    $('#pvrSpecProjectionTitle').textContent = 'Barco 4K High Precision Laser';
    $('#pvrSpecProjectionDesc').textContent = 'Crystal clear digital projection calibrated for optimal theater brightness and contrast.';
    $('#pvrSpecSoundTitle').textContent = 'Dolby Surround 7.1 Channel Audio';
    $('#pvrSpecSoundDesc').textContent = 'Balanced multi-channel cinema audio delivering rich dialogue and immersive surround effects.';
  }

  // Price Matrix
  const classic = Number(showtime.startingPrice);
  const prime = Math.round(classic * 1.2);
  const vip = Math.round(classic * 1.5);
  const bookingCount = showtime.bookingCount || 0;
  const occupancyRatio = bookingCount / 96;

  const matrixEl = $('#pvrPriceMatrix');
  matrixEl.replaceChildren();

  const tiers = [
    {
      name: 'Classic Standard',
      rows: 'Rows A – D · 48 Seats',
      price: classic,
      status: occupancyRatio > 0.85 ? 'Almost Full' : 'Available',
      statusClass: occupancyRatio > 0.85 ? 'status-full' : 'status-avail',
    },
    {
      name: 'Prime Club',
      rows: 'Rows E – G · 36 Seats',
      price: prime,
      status: occupancyRatio > 0.6 ? 'Filling Fast' : 'Available',
      statusClass: occupancyRatio > 0.6 ? 'status-filling' : 'status-avail',
    },
    {
      name: 'VIP Club Recliners',
      rows: 'Row H · 12 Seats (Motorized Recliners)',
      price: vip,
      status: occupancyRatio > 0.4 ? 'Few Seats Left' : 'Available',
      statusClass: occupancyRatio > 0.4 ? 'status-filling' : 'status-avail',
    },
  ];

  for (const t of tiers) {
    const row = document.createElement('div');
    row.className = 'pvr-matrix-card';

    const info = document.createElement('div');
    info.className = 'pvr-matrix-info';
    const tName = document.createElement('div');
    tName.className = 'pvr-matrix-name';
    tName.textContent = t.name;
    const tSub = document.createElement('div');
    tSub.className = 'pvr-matrix-sub';
    tSub.textContent = t.rows;
    info.append(tName, tSub);

    const right = document.createElement('div');
    right.className = 'pvr-matrix-right';
    const tag = document.createElement('span');
    tag.className = `pill-status-tag ${t.statusClass}`;
    tag.textContent = t.status;
    const price = document.createElement('span');
    price.className = 'pvr-matrix-price';
    price.textContent = `₹${t.price.toLocaleString('en-IN')}`;
    right.append(tag, price);

    row.append(info, right);
    matrixEl.append(row);
  }

  $('#pvrShowtimeInfoDialog').showModal();
}

// ================= STEP 2: THEATER SEATING & SNACKS =================
async function proceedToSeatingWindow(showtime) {
  selectedShowtime = showtime;
  selectedSeats = [];
  selectedSnacks = {};
  appliedPromo = null;
  if ($('#promoCodeInput')) $('#promoCodeInput').value = '';
  if ($('#promoFeedback')) {
    $('#promoFeedback').hidden = true;
    $('#promoFeedback').textContent = '';
  }
  if ($('#promoDiscountLine')) $('#promoDiscountLine').hidden = true;
  stopSeatTimer();

  $('#seatingMovieTitle').textContent = selectedMovie.title;
  $('#seatingAuditoriumBadge').textContent = `${showtime.screen} · ${showtime.category.toUpperCase()}`;
  $('#seatingShowtimeMeta').textContent = `${showtime.cinema}, ${showtime.city} · ${formatDateLabel(showtime.date)} @ ${showtime.time}`;
  $('#selectedShowtimeId').value = showtime.id;

  renderSnacksGrid();

  $('#scheduleStep').hidden = true;
  $('#seatingStep').hidden = false;
  $('#ticketSuccess').hidden = true;

  await loadShowtimeSeats(showtime.id);
}

// 10-Minute Seat Timer Management
function startSeatTimer() {
  if (seatTimerInterval) return;
  seatTimerSecondsRemaining = 600;
  $('#seatTimerBanner').hidden = false;
  updateTimerDisplay();

  seatTimerInterval = setInterval(() => {
    seatTimerSecondsRemaining--;
    if (seatTimerSecondsRemaining <= 0) {
      stopSeatTimer();
      alert('Your 10-minute seat reservation window has expired. The seat map will now refresh.');
      selectedSeats = [];
      loadShowtimeSeats(selectedShowtime.id);
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function stopSeatTimer() {
  if (seatTimerInterval) {
    clearInterval(seatTimerInterval);
    seatTimerInterval = null;
  }
  $('#seatTimerBanner').hidden = true;
}

function updateTimerDisplay() {
  const m = Math.floor(seatTimerSecondsRemaining / 60);
  const s = seatTimerSecondsRemaining % 60;
  $('#timerCountdown').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function loadShowtimeSeats(showtimeId) {
  if (!showtimeId) return;

  $('#theaterGrid').innerHTML = '<p style="color: var(--muted); padding: 30px;">Loading auditorium layout…</p>';

  try {
    const res = await fetch(`/api/showtimes/${showtimeId}/seats`);
    if (!res.ok) throw new Error('Failed to load seating map');
    const data = await res.json();

    currentShowtimeDetails = data;
    currentPricingTiers = data.pricingTiers || {
      VIP: Math.round(data.startingPrice * 1.5),
      Prime: Math.round(data.startingPrice * 1.2),
      Classic: data.startingPrice,
    };

    renderTheaterGrid(data.bookedSeats || []);
    updateSelectionSummary();
  } catch (err) {
    console.error(err);
    $('#theaterGrid').innerHTML = `<p style="color: #ef4444; padding: 20px;">${err.message}</p>`;
  }
}

function renderTheaterGrid(bookedSeats) {
  const container = $('#theaterGrid');
  container.replaceChildren();

  const bookedUpper = new Set((bookedSeats || []).map((s) => String(s).toUpperCase()));

  for (const tierConfig of AUDITORIUM_CONFIG) {
    const divider = document.createElement('div');
    divider.className = `tier-divider ${tierConfig.tier.toLowerCase()}`;
    const price = currentPricingTiers[tierConfig.priceKey] || 250;
    divider.innerHTML = `<span>${tierConfig.label} (₹${price})</span><hr>`;
    container.append(divider);

    for (const rowLetter of tierConfig.rows) {
      const rowEl = document.createElement('div');
      rowEl.className = 'seat-row';

      const labelLeft = document.createElement('span');
      labelLeft.className = 'row-label';
      labelLeft.textContent = rowLetter;
      rowEl.append(labelLeft);

      for (let seatNum = 1; seatNum <= SEATS_PER_ROW; seatNum++) {
        const seatId = `${rowLetter}${seatNum}`;
        const isBooked = bookedUpper.has(seatId);
        const isSelected = selectedSeats.includes(seatId);

        const seatBtn = document.createElement('button');
        seatBtn.type = 'button';
        seatBtn.className = 'seat';
        seatBtn.dataset.seat = seatId;
        seatBtn.dataset.tier = tierConfig.priceKey;
        seatBtn.textContent = String(seatNum);
        seatBtn.setAttribute('aria-label', `Seat ${seatId}, ${tierConfig.label}`);

        if (tierConfig.tier === 'VIP') {
          seatBtn.classList.add('vip-tier');
        }

        if (AISLE_AFTER_SEATS.includes(seatNum) && seatNum !== SEATS_PER_ROW) {
          seatBtn.classList.add('aisle-gap');
        }

        if (isBooked) {
          seatBtn.classList.add('occupied');
          seatBtn.disabled = true;
          seatBtn.title = `${seatId} (Sold Out)`;
        } else {
          if (isSelected) {
            seatBtn.classList.add('selected');
          }
          seatBtn.addEventListener('click', () => toggleSeatSelection(seatId, seatBtn));
        }

        rowEl.append(seatBtn);
      }

      const labelRight = document.createElement('span');
      labelRight.className = 'row-label';
      labelRight.textContent = rowLetter;
      rowEl.append(labelRight);

      container.append(rowEl);
    }
  }
}

function toggleSeatSelection(seatId, seatBtn) {
  const index = selectedSeats.indexOf(seatId);

  if (index > -1) {
    selectedSeats.splice(index, 1);
    seatBtn.classList.remove('selected');
    if (!selectedSeats.length) stopSeatTimer();
  } else {
    if (selectedSeats.length >= 8) {
      alert('You can select a maximum of 8 seats per transaction.');
      return;
    }
    selectedSeats.push(seatId);
    seatBtn.classList.add('selected');
    startSeatTimer();
  }

  updateSelectionSummary();
}

function getSeatPrice(seatId) {
  const rowLetter = seatId.charAt(0);
  if (rowLetter === 'H') return currentPricingTiers.VIP;
  if (['G', 'F', 'E'].includes(rowLetter)) return currentPricingTiers.Prime;
  return currentPricingTiers.Classic;
}

// F&B Concessions Grid
function renderSnacksGrid() {
  const container = $('#snacksGrid');
  container.replaceChildren();

  for (const item of snacksCatalog) {
    const card = document.createElement('div');
    card.className = 'snack-card';

    const currentQty = selectedSnacks[item.id]?.qty || 0;

    card.innerHTML = `
      <div class="snack-icon">${item.icon || '🍿'}</div>
      <div class="snack-info">
        <strong>${item.name}</strong>
        <span>₹${item.price}</span>
        <small style="color: var(--muted); font-size: 11px;">${item.description || item.desc || ''}</small>
      </div>
      <div class="snack-counter">
        <button type="button" class="snack-counter-btn minus" data-id="${item.id}">−</button>
        <span class="snack-qty" id="qty-${item.id}">${currentQty}</span>
        <button type="button" class="snack-counter-btn plus" data-id="${item.id}">+</button>
      </div>
    `;

    card.querySelector('.minus').addEventListener('click', () => updateSnackQty(item, -1));
    card.querySelector('.plus').addEventListener('click', () => updateSnackQty(item, 1));

    container.append(card);
  }
}

function updateSnackQty(item, delta) {
  const existing = selectedSnacks[item.id] || { id: item.id, name: item.name, price: item.price, qty: 0 };
  const newQty = Math.max(0, existing.qty + delta);

  if (newQty === 0) {
    delete selectedSnacks[item.id];
  } else {
    existing.qty = newQty;
    selectedSnacks[item.id] = existing;
  }

  const qtyEl = $(`#qty-${item.id}`);
  if (qtyEl) qtyEl.textContent = String(newQty);

  updateSelectionSummary();
}

function calculateSubtotal() {
  let subtotal = 0;
  for (const seatId of selectedSeats) {
    subtotal += getSeatPrice(seatId);
  }
  for (const snack of Object.values(selectedSnacks)) {
    subtotal += snack.price * snack.qty;
  }
  return subtotal;
}

function updateSelectionSummary() {
  const chipsContainer = $('#selectedSeatsChips');
  chipsContainer.replaceChildren();

  const snackItems = Object.values(selectedSnacks);

  if (!selectedSeats.length && !snackItems.length) {
    chipsContainer.innerHTML = '<span class="no-seats-prompt">Click seats on the map above to select</span>';
    $('#totalPriceDisplay').textContent = '₹0';
    if ($('#promoDiscountLine')) $('#promoDiscountLine').hidden = true;
    $('#submitBookingBtn').disabled = true;
    $('#submitBookingBtn').textContent = 'Select Seats to Continue';
    return;
  }

  // Seat chips
  for (const seatId of selectedSeats) {
    const chip = document.createElement('span');
    chip.className = 'seat-chip';
    chip.innerHTML = `${seatId} <button type="button" aria-label="Remove ${seatId}">✕</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      const btn = $(`button.seat[data-seat="${seatId}"]`);
      if (btn) btn.classList.remove('selected');
      const idx = selectedSeats.indexOf(seatId);
      if (idx > -1) selectedSeats.splice(idx, 1);
      if (!selectedSeats.length) stopSeatTimer();
      updateSelectionSummary();
    });
    chipsContainer.append(chip);
  }

  // Snack chips
  for (const snack of snackItems) {
    const chip = document.createElement('span');
    chip.className = 'snack-chip';
    chip.innerHTML = `${snack.qty}x ${snack.name} <button type="button" aria-label="Remove ${snack.name}">✕</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      delete selectedSnacks[snack.id];
      const qtyEl = $(`#qty-${snack.id}`);
      if (qtyEl) qtyEl.textContent = '0';
      updateSelectionSummary();
    });
    chipsContainer.append(chip);
  }

  const subtotal = calculateSubtotal();
  let discountAmount = 0;

  if (appliedPromo) {
    if (appliedPromo.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * appliedPromo.discountValue) / 100);
    } else {
      discountAmount = Math.min(subtotal, appliedPromo.discountValue);
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  if (discountAmount > 0) {
    if ($('#promoDiscountLine')) $('#promoDiscountLine').hidden = false;
    if ($('#promoDiscountDisplay')) $('#promoDiscountDisplay').textContent = `-₹${discountAmount.toLocaleString('en-IN')}`;
  } else {
    if ($('#promoDiscountLine')) $('#promoDiscountLine').hidden = true;
  }

  $('#totalPriceDisplay').textContent = `₹${finalTotal.toLocaleString('en-IN')}`;

  const hasSeats = selectedSeats.length > 0;
  $('#submitBookingBtn').disabled = !hasSeats;
  $('#submitBookingBtn').textContent = hasSeats
    ? `Pay & Confirm (₹${finalTotal.toLocaleString('en-IN')})`
    : 'Select Seats to Continue';
}

async function handleApplyPromo() {
  const input = $('#promoCodeInput');
  const feedbackEl = $('#promoFeedback');
  if (!input || !feedbackEl) return;

  const code = input.value.trim().toUpperCase();
  feedbackEl.hidden = false;

  if (!code) {
    appliedPromo = null;
    feedbackEl.className = 'promo-feedback error';
    feedbackEl.textContent = 'Please enter a promo code.';
    updateSelectionSummary();
    return;
  }

  const subtotal = calculateSubtotal();
  if (subtotal <= 0) {
    appliedPromo = null;
    feedbackEl.className = 'promo-feedback error';
    feedbackEl.textContent = 'Select seats before applying a coupon.';
    return;
  }

  try {
    const res = await fetch('/api/promos/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    });
    const data = await res.json();
    if (!res.ok || !data.valid) {
      appliedPromo = null;
      feedbackEl.className = 'promo-feedback error';
      feedbackEl.textContent = data.message || 'Invalid coupon code';
    } else {
      appliedPromo = data;
      feedbackEl.className = 'promo-feedback success';
      feedbackEl.textContent = data.message;
    }
  } catch (err) {
    appliedPromo = null;
    feedbackEl.className = 'promo-feedback error';
    feedbackEl.textContent = 'Network error validating coupon.';
  }

  updateSelectionSummary();
}

// ================= TICKET LOOKUP MODAL =================
function openLookupModal() {
  $('#lookupQuery').value = '';
  $('#lookupResults').replaceChildren();
  $('#lookupModal').showModal();
}

async function performTicketLookup(query) {
  const container = $('#lookupResults');
  container.innerHTML = '<p style="color: var(--muted); padding: 20px; text-align: center;">Searching tickets…</p>';

  try {
    const res = await fetch(`/api/bookings/lookup?query=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Search failed');

    container.replaceChildren();

    if (!data.length) {
      container.innerHTML = '<p style="color: var(--text-dim); text-align: center; padding: 20px;">No matching tickets found for this query.</p>';
      return;
    }

    for (const b of data) {
      const card = document.createElement('div');
      card.className = 'lookup-card';

      const info = document.createElement('div');
      info.className = 'lookup-card-info';
      info.innerHTML = `
        <strong>${b.movie || 'Movie'} — ${b.cinema || 'Cinema'}</strong>
        <span>Screening: ${b.date} @ ${b.time}</span>
        <span>Seats: <strong>${b.seats.join(', ')}</strong> · Total: ₹${b.total}</span>
        <span style="font-family: monospace; color: #4ade80; margin-top: 4px;">Ticket: ${b.ticketCode || 'Pending'}</span>
      `;

      const statusBadge = document.createElement('span');
      statusBadge.className = `ticket-status-pill ${b.status}`;
      statusBadge.textContent = b.status.replaceAll('_', ' ');

      card.append(info, statusBadge);
      container.append(card);
    }
  } catch (err) {
    container.innerHTML = `<p style="color: #ef4444; text-align: center; padding: 20px;">${err.message}</p>`;
  }
}

// Theme Management
function initTheme() {
  const saved = localStorage.getItem('moviehub-theme');
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = saved || (prefersLight ? 'light' : 'dark');
  applyTheme(initial);

  $('#themeToggleBtn')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('moviehub-theme', theme);
  const btn = $('#themeToggleBtn');
  if (btn) {
    btn.innerHTML = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    btn.setAttribute('title', theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme');
  }
}

// ================= INITIALIZATION & EVENT LISTENERS =================
function initCustomerApp() {
  initTheme();

  // Navigation & Lookups
  $('#openLookupBtn').addEventListener('click', openLookupModal);
  $('#closeLookupBtn').addEventListener('click', () => $('#lookupModal').close());
  $('#lookupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('#lookupQuery').value.trim();
    if (q) performTicketLookup(q);
  });

  // Trailer Modal
  $('#closeTrailerBtn').addEventListener('click', closeTrailerModal);
  $('#trailerModal').addEventListener('close', closeTrailerModal);

  // Filters
  $('#movieSearchInput').addEventListener('input', (e) => {
    activeSearchQuery = e.target.value.trim().toLowerCase();
    renderMovies();
  });

  $('#cityFilter').addEventListener('change', (e) => {
    activeCityFilter = e.target.value;
    renderMovies();
  });

  $('#genrePills').addEventListener('click', (e) => {
    const btn = e.target.closest('.genre-pill');
    if (!btn) return;
    $('#genrePills').querySelectorAll('.genre-pill').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeGenreFilter = btn.dataset.genre || 'all';
    renderMovies();
  });

  // Promo Code Listeners
  $('#applyPromoBtn')?.addEventListener('click', handleApplyPromo);
  $('#promoCodeInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyPromo();
    }
  });

  // Booking Modal Close & Navigation
  $('#closeScheduleBtn').addEventListener('click', () => $('#bookingModal').close());
  $('#closeSeatingBtn').addEventListener('click', () => {
    stopSeatTimer();
    $('#bookingModal').close();
  });
  $('#cancelBookingBtn').addEventListener('click', () => {
    stopSeatTimer();
    $('#bookingModal').close();
  });
  $('#finishBtn').addEventListener('click', () => {
    stopSeatTimer();
    $('#bookingModal').close();
    loadData();
  });

  $('#backToScheduleBtn').addEventListener('click', () => {
    stopSeatTimer();
    $('#seatingStep').hidden = true;
    $('#scheduleStep').hidden = false;
  });

  // PVR Showtime Info Dialog Listeners
  $('#closePvrInfoBtn')?.addEventListener('click', () => $('#pvrShowtimeInfoDialog').close());
  $('#pvrDialogCloseFooterBtn')?.addEventListener('click', () => $('#pvrShowtimeInfoDialog').close());
  $('#pvrDialogProceedBtn')?.addEventListener('click', () => {
    $('#pvrShowtimeInfoDialog').close();
    if (previewedPvrShowtime) {
      proceedToSeatingWindow(previewedPvrShowtime);
    }
  });

  // PVR Experience Format Filter Tabs
  $('#formatFilterTabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.format-filter-tab');
    if (!btn) return;
    $('#formatFilterTabs').querySelectorAll('.format-filter-tab').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeFormatFilter = btn.dataset.format || 'all';
    if (selectedDate) {
      renderCinemasForDate(selectedDate);
    }
  });

  // Print Ticket Action
  $('#printTicketBtn').addEventListener('click', () => {
    window.print();
  });

  // Booking Form Submission
  $('#bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedShowtime) {
      alert('Screening session expired. Please select a showtime.');
      return;
    }

    if (!selectedSeats.length) {
      alert('Please choose at least one seat from the theater preview.');
      return;
    }

    const subtotal = calculateSubtotal();
    let discountAmount = 0;
    if (appliedPromo) {
      if (appliedPromo.discountType === 'percentage') {
        discountAmount = Math.round((subtotal * appliedPromo.discountValue) / 100);
      } else {
        discountAmount = Math.min(subtotal, appliedPromo.discountValue);
      }
    }
    const finalTotal = Math.max(0, subtotal - discountAmount);

    const snackItems = Object.values(selectedSnacks);

    const payload = {
      showtimeId: selectedShowtime.id,
      customerName: $('#custName').value.trim(),
      email: $('#custEmail').value.trim(),
      seats: selectedSeats,
      snacks: snackItems,
      total: finalTotal,
      paymentMethod: 'Simulated UPI',
    };

    const submitBtn = $('#submitBookingBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Securing Seats…';

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete reservation.');
      }

      stopSeatTimer();

      // Display Boarding Pass Digital Ticket
      $('#seatingStep').hidden = true;
      $('#ticketSuccess').hidden = false;

      $('#passMovieTitle').textContent = selectedMovie.title;
      $('#passCinema').textContent = `${selectedShowtime.cinema}, ${selectedShowtime.city}`;
      $('#passScreen').textContent = `${selectedShowtime.screen} (${selectedShowtime.category})`;
      $('#passDateTime').textContent = `${formatDateLabel(selectedShowtime.date)} @ ${selectedShowtime.time}`;
      $('#passSeats').textContent = data.seats.join(', ');
      $('#passCustomer').textContent = data.customerName;
      $('#passTotal').textContent = `₹${Number(data.total).toLocaleString('en-IN')}`;
      $('#passTicketCode').textContent = data.ticketCode;

      // Render Snacks in Pass
      if (data.snacks && data.snacks.length) {
        $('#passSnacksRow').hidden = false;
        $('#passSnacksText').textContent = data.snacks.map((s) => `${s.qty}x ${s.name}`).join(', ');
      } else {
        $('#passSnacksRow').hidden = true;
      }

      // Render Scannable QR Code SVG
      $('#passQrCode').innerHTML = generateQrSvg(data.ticketCode);

      // Background Refresh
      await loadData();
    } catch (err) {
      alert(err.message);
      await loadShowtimeSeats(selectedShowtime.id);
    } finally {
      submitBtn.disabled = false;
      updateSelectionSummary();
    }
  });

  loadData();
}

document.addEventListener('DOMContentLoaded', initCustomerApp);
