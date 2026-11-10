/**
 * MovieHub Admin Portal - Application Controller
 */

import { request, publicRequest, localDate, getAdminToken, setAdminToken } from './api.js';

const $ = (selector) => document.querySelector(selector);

// Local State
let cameraStream = null;
let scanLoop = 0;
let adminMovies = [];
let adminCinemas = [];
let adminShowtimes = [];
let currentResolutionShowtimeId = null;
let currentScreeningBookings = [];
let currentInspectedShowtimeId = null;
let adminSnacks = [];
let adminPromos = [];
let adminScanLogs = [];

// Theme Management
function initAdminTheme() {
  const saved = localStorage.getItem('moviehub-admin-theme');
  const initial = saved || 'dark';
  applyAdminTheme(initial);

  $('#adminThemeToggleBtn')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyAdminTheme(next);
  });
}

function applyAdminTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('moviehub-admin-theme', theme);
  const btn = $('#adminThemeToggleBtn');
  if (btn) {
    btn.innerHTML = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    btn.setAttribute('title', theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme');
  }
}

// UI Utility Helpers
function setStatus(message, connected = false) {
  const node = $('#connectionStatus');
  node.textContent = message;
  node.classList.toggle('connected', connected);
}

function setText(selector, value) {
  const el = $(selector);
  if (el) el.textContent = value ?? '—';
}

function fillOptions(selector, items, labelFn) {
  const select = $(selector);
  if (!select) return;
  select.replaceChildren();
  for (const item of items) {
    const option = document.createElement('option');
    option.value = String(item.id);
    option.textContent = labelFn(item);
    select.append(option);
  }
}

function updateLateNightOption() {
  const selectedCinemaId = $('#cinemaSelect')?.value;
  const selected = adminCinemas.find((c) => String(c.id) === selectedCinemaId);
  const lateOption = Array.from($('#showTime').options).find((opt) => opt.value === '11:30 PM');
  if (lateOption) {
    lateOption.disabled = !selected?.lateNight;
    if (lateOption.disabled && $('#showTime').value === '11:30 PM') {
      $('#showTime').value = '10:00 AM';
    }
  }
}

function updateEditLateNightOption() {
  const selectedCinemaId = $('#editCinema')?.value;
  const selected = adminCinemas.find((c) => String(c.id) === selectedCinemaId);
  const lateOption = Array.from($('#editTime').options).find((opt) => opt.value === '11:30 PM');
  if (lateOption) {
    lateOption.disabled = !selected?.lateNight;
    if (lateOption.disabled && $('#editTime').value === '11:30 PM') {
      $('#editTime').value = '10:00 AM';
    }
  }
}

function showtimeIsFuture(showtime) {
  if (!showtime?.date || !showtime?.time) return false;
  const [clock, period] = showtime.time.split(' ');
  const [rawHour, minute] = clock.split(':').map(Number);
  const hour = (rawHour % 12) + (period === 'PM' ? 12 : 0);
  const localStart = new Date(
    `${showtime.date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
  );
  return localStart.getTime() > Date.now();
}

/**
 * Main Connect & Data Synchronization
 */
async function connect() {
  const token = getAdminToken();
  if (!token) {
    setStatus('Enter the admin token configured on the server.');
    return;
  }

  setStatus('Connecting…');
  try {
    const selectedDate = $('#scheduleDate').value || localDate();
    const [summary, bookings, cinemas, movies, managedCinemas, showtimes, health] =
      await Promise.all([
        request('/api/admin/summary'),
        request('/api/admin/bookings'),
        publicRequest('/api/cinemas'),
        request('/api/admin/movies'),
        request('/api/admin/cinemas'),
        request(`/api/admin/showtimes?date=${encodeURIComponent(selectedDate)}`),
        publicRequest('/api/health'),
      ]);

    adminMovies = movies;
    adminCinemas = managedCinemas;
    adminShowtimes = showtimes;

    setText('#statCinemas', summary.cinemas);
    setText('#statMovies', summary.movies);
    setText('#statShowtimes', summary.upcomingShowtimes);
    setText('#statTickets', summary.confirmedTickets);

    fillOptions('#cinemaSelect', cinemas, (item) => `${item.city} · ${item.name}`);
    updateLateNightOption();

    fillOptions(
      '#movieSelect',
      movies.filter((item) => item.active),
      (item) => item.title
    );

    const filterCinema = $('#scheduleCinemaFilter').value || 'all';
    fillOptions(
      '#scheduleCinemaFilter',
      [{ id: 'all', city: '', name: 'All cinemas' }, ...adminCinemas],
      (item) => (item.id === 'all' ? 'All cinemas' : `${item.city} · ${item.name}`)
    );
    $('#scheduleCinemaFilter').value = filterCinema;

    fillOptions('#editCinema', cinemas, (item) => `${item.city} · ${item.name}`);
    fillOptions(
      '#editMovie',
      movies.filter((item) => item.active),
      (item) => item.title
    );

    renderBookings(bookings);
    renderAdminMovies();
    renderAdminCinemas();
    renderAdminShowtimes();

    await Promise.all([
      fetchAnalytics(),
      loadAdminSnacks(),
      loadAdminPromos(),
      loadAdminScanLogs(),
    ]);

    const storage = health.mode === 'supabase-postgres' ? 'Supabase PostgreSQL' : 'local SQLite';
    setStatus(`Connected to MovieHub. Data is stored in ${storage}.`, true);
  } catch (error) {
    setStatus(error.message);
  }
}

/**
 * Render Bookings Activity Table
 */
function renderBookings(bookings) {
  const body = $('#bookingRows');
  body.replaceChildren();

  if (!bookings || !bookings.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'No bookings have been made yet.';
    row.append(cell);
    body.append(row);
    return;
  }

  for (const item of bookings) {
    const row = document.createElement('tr');
    const values = [
      item.ticketCode || 'Pending',
      item.customerName,
      item.movie,
      `${item.date} · ${item.time} · ${item.cinema}`,
      item.seats.join(', '),
      `₹${item.total.toLocaleString('en-IN')}`,
      item.status.replaceAll('_', ' '),
    ];
    for (const value of values) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    body.append(row);
  }
}

/**
 * Render Screenings Schedule Table
 */
function renderAdminShowtimes() {
  const body = $('#showtimeRows');
  body.replaceChildren();

  const cinemaFilter = $('#scheduleCinemaFilter').value || 'all';
  const statusFilter = $('#scheduleStatusFilter').value;
  const showtimes = adminShowtimes.filter((item) => {
    const matchesCinema = cinemaFilter === 'all' || String(item.cinemaId) === cinemaFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesCinema && matchesStatus;
  });

  if (!showtimes.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
    cell.textContent = 'No screenings match this date and filter.';
    row.append(cell);
    body.append(row);
    return;
  }

  for (const showtime of showtimes) {
    const row = document.createElement('tr');

    // Title and Category
    const screening = document.createElement('td');
    screening.className = 'screening-name';
    const title = document.createElement('strong');
    title.textContent = showtime.movie;
    const category = document.createElement('small');
    category.textContent = showtime.category;
    screening.append(title, category);
    row.append(screening);

    // Cinema
    const cinema = document.createElement('td');
    cinema.textContent = `${showtime.cinema} · ${showtime.city}${
      !showtime.cinemaActive ? ' (inactive)' : ''
    }`;
    row.append(cinema);

    // Date & Time
    const dateTime = document.createElement('td');
    dateTime.textContent = `${showtime.date} · ${showtime.time}`;
    row.append(dateTime);

    // Screen
    const screen = document.createElement('td');
    screen.textContent = showtime.screen;
    row.append(screen);

    // Bookings
    const bookings = document.createElement('td');
    bookings.textContent = `${showtime.bookingCount} ${
      showtime.bookingCount === 1 ? 'booking' : 'bookings'
    }`;
    row.append(bookings);

    // Starting Price
    const price = document.createElement('td');
    price.textContent = `₹${Number(showtime.startingPrice).toLocaleString('en-IN')}`;
    row.append(price);

    // Status Badge
    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `movie-status ${
      showtime.status === 'cancelled' ? 'is-cancelled' : 'is-active'
    }`;
    badge.textContent = showtime.status === 'cancelled' ? 'Cancelled' : 'Scheduled';
    statusCell.append(badge);
    row.append(statusCell);

    // Action Buttons
    const actions = document.createElement('td');
    actions.className = 'screening-actions';

    if (showtime.status === 'scheduled') {
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'button light';
      edit.dataset.action = 'edit-showtime';
      edit.dataset.id = showtime.id;
      edit.textContent = 'Edit';
      edit.disabled =
        showtime.bookingCount > 0 || !showtime.cinemaActive || !showtime.movieActive;

      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'button archive-button';
      cancel.dataset.action = 'cancel-showtime';
      cancel.dataset.id = showtime.id;
      cancel.textContent = 'Cancel';
      cancel.disabled = !showtimeIsFuture(showtime);

      actions.append(edit, cancel);
    }

    const details = document.createElement('button');
    details.type = 'button';
    details.className = 'button light';
    details.dataset.action = 'showtime-bookings';
    details.dataset.id = showtime.id;
    details.textContent = showtime.status === 'cancelled' ? 'Customers' : 'Bookings';

    const inspect = document.createElement('button');
    inspect.type = 'button';
    inspect.className = 'button light';
    inspect.dataset.action = 'inspect-hall';
    inspect.dataset.id = showtime.id;
    inspect.textContent = 'Inspect Hall';

    actions.append(details, inspect);

    row.append(actions);
    body.append(row);
  }
}

/**
 * Render Cinemas Catalog Table
 */
function renderAdminCinemas() {
  const body = $('#cinemaRows');
  body.replaceChildren();

  const query = $('#cinemaSearch').value.trim().toLowerCase();
  const status = $('#cinemaStatusFilter').value;
  const cinemas = adminCinemas.filter((cinema) => {
    const matchesStatus =
      status === 'all' || (status === 'active' ? cinema.active : !cinema.active);
    const text = `${cinema.name} ${cinema.city} ${cinema.address} ${(cinema.amenities || []).join(
      ' '
    )}`.toLowerCase();
    return matchesStatus && text.includes(query);
  });

  if (!cinemas.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = adminCinemas.length
      ? 'No cinemas match these filters.'
      : 'Connect to load cinemas.';
    row.append(cell);
    body.append(row);
    return;
  }

  for (const cinema of cinemas) {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    nameCell.className = 'cinema-name-cell';
    const name = document.createElement('strong');
    name.textContent = cinema.name;
    const map = document.createElement('small');
    if (cinema.mapUrl) {
      const link = document.createElement('a');
      link.href = cinema.mapUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open map ↗';
      map.append(link);
    } else {
      map.textContent = 'No map link';
    }
    nameCell.append(name, map);
    row.append(nameCell);

    for (const value of [
      cinema.city,
      cinema.address,
      (cinema.amenities || []).join(', ') || '—',
      cinema.lateNight ? 'Available' : 'No',
    ]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }

    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `movie-status ${cinema.active ? 'is-active' : 'is-archived'}`;
    badge.textContent = cinema.active ? 'Active' : 'Inactive';
    statusCell.append(badge);
    row.append(statusCell);

    const actions = document.createElement('td');
    actions.className = 'movie-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'button light';
    edit.dataset.action = 'edit-cinema';
    edit.dataset.id = cinema.id;
    edit.textContent = 'Edit';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = `button ${cinema.active ? 'archive-button' : 'restore-button'}`;
    toggle.dataset.action = cinema.active ? 'deactivate-cinema' : 'activate-cinema';
    toggle.dataset.id = cinema.id;
    toggle.textContent = cinema.active ? 'Deactivate' : 'Activate';

    actions.append(edit, toggle);
    row.append(actions);
    body.append(row);
  }
}

/**
 * Cinema Modal Management
 */
function openCinemaForm(cinema = null) {
  $('#cinemaForm').reset();
  $('#cinemaId').value = cinema ? String(cinema.id) : '';
  $('#cinemaDialogTitle').textContent = cinema ? 'Edit cinema' : 'Add a cinema';
  $('#cinemaName').value = cinema?.name || '';
  $('#cinemaCity').value = cinema?.city || '';
  $('#cinemaAddress').value = cinema?.address || '';
  $('#cinemaMapUrl').value = cinema?.mapUrl || '';
  $('#cinemaAmenities').value = (cinema?.amenities || []).join(', ');
  $('#cinemaLateNight').checked = cinema ? cinema.lateNight : false;
  $('#cinemaActive').checked = cinema ? cinema.active : true;
  $('#cinemaDialog').showModal();
}

function cinemaFormPayload() {
  return {
    name: $('#cinemaName').value.trim(),
    city: $('#cinemaCity').value.trim(),
    address: $('#cinemaAddress').value.trim(),
    mapUrl: $('#cinemaMapUrl').value.trim() || null,
    amenities: $('#cinemaAmenities')
      .value.split(',')
      .map((i) => i.trim())
      .filter(Boolean),
    lateNight: $('#cinemaLateNight').checked,
    active: $('#cinemaActive').checked,
  };
}

/**
 * Render Movies Catalog Table
 */
function renderAdminMovies() {
  const body = $('#movieRows');
  body.replaceChildren();

  const query = $('#movieSearch').value.trim().toLowerCase();
  const status = $('#movieStatusFilter').value;
  const movies = adminMovies.filter((movie) => {
    const matchesStatus =
      status === 'all' || (status === 'active' ? movie.active : !movie.active);
    const text = `${movie.title} ${movie.genre} ${(movie.languages || []).join(' ')}`.toLowerCase();
    return matchesStatus && text.includes(query);
  });

  if (!movies.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
    cell.textContent = adminMovies.length
      ? 'No movies match these filters.'
      : 'Connect to load movies.';
    row.append(cell);
    body.append(row);
    return;
  }

  for (const movie of movies) {
    const row = document.createElement('tr');

    // Poster Cell
    const posterCell = document.createElement('td');
    if (movie.posterUrl) {
      const image = document.createElement('img');
      image.className = 'movie-thumb';
      image.src = movie.posterUrl;
      image.alt = movie.title;
      image.loading = 'lazy';
      image.onerror = () => {
        image.remove();
        posterCell.textContent = 'No poster';
      };
      posterCell.append(image);
    } else {
      const placeholder = document.createElement('span');
      placeholder.className = `movie-thumb-placeholder ${movie.art}`;
      placeholder.textContent = movie.posterTitle || movie.title?.slice(0, 3) || 'MOV';
      posterCell.append(placeholder);
    }
    row.append(posterCell);

    // Title & Year
    const titleCell = document.createElement('td');
    titleCell.className = 'movie-title-cell';
    const title = document.createElement('strong');
    title.textContent = movie.title;
    const year = document.createElement('small');
    year.textContent = String(movie.releaseYear || '');
    titleCell.append(title, year);
    row.append(titleCell);

    const values = [
      movie.genre,
      `${movie.durationMinutes} min`,
      `${movie.ratingValue ? movie.ratingValue.toFixed(1) : movie.rating}/10`,
      (movie.languages || []).join(', ') || '—',
    ];
    for (const val of values) {
      const cell = document.createElement('td');
      cell.textContent = val;
      row.append(cell);
    }

    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `movie-status ${movie.active ? 'is-active' : 'is-archived'}`;
    badge.textContent = movie.active ? 'Active' : 'Archived';
    statusCell.append(badge);
    row.append(statusCell);

    const actions = document.createElement('td');
    actions.className = 'movie-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'button light';
    edit.dataset.action = 'edit';
    edit.dataset.id = movie.id;
    edit.textContent = 'Edit';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = `button ${movie.active ? 'archive-button' : 'restore-button'}`;
    toggle.dataset.action = movie.active ? 'archive' : 'restore';
    toggle.dataset.id = movie.id;
    toggle.textContent = movie.active ? 'Archive' : 'Restore';

    actions.append(edit, toggle);
    row.append(actions);
    body.append(row);
  }
}

/**
 * Movie Modal Management
 */
function openMovieForm(movie = null) {
  const form = $('#movieForm');
  form.reset();
  $('#movieId').value = movie ? String(movie.id) : '';
  $('#movieDialogTitle').textContent = movie ? 'Edit movie' : 'Add a movie';
  $('#movieName').value = movie?.name || movie?.title || '';
  $('#movieYear').value = movie?.releaseYear || new Date().getFullYear();
  $('#movieGenre').value = movie?.genre || '';
  $('#movieDuration').value = movie?.durationMinutes || '';
  $('#movieRating').value = movie?.ratingValue ?? movie?.rating ?? '';
  $('#movieLanguages').value = (movie?.languages || []).join(', ');
  $('#movieCertificate').value = movie?.certificate || 'U/A';
  $('#moviePosterUrl').value = movie?.posterUrl || '';
  $('#movieArt').value = movie?.art || 'art-ember';
  $('#movieDescription').value = movie?.description || '';
  $('#movieActive').checked = movie ? movie.active : true;
  $('#movieDialog').showModal();
}

function movieFormPayload() {
  return {
    name: $('#movieName').value.trim(),
    releaseYear: Number($('#movieYear').value),
    genre: $('#movieGenre').value.trim(),
    durationMinutes: Number($('#movieDuration').value),
    rating: Number($('#movieRating').value),
    languages: $('#movieLanguages')
      .value.split(',')
      .map((i) => i.trim())
      .filter(Boolean),
    certificate: $('#movieCertificate').value.trim() || 'U/A',
    posterUrl: $('#moviePosterUrl').value.trim() || null,
    art: $('#movieArt').value,
    description: $('#movieDescription').value.trim(),
    active: $('#movieActive').checked,
  };
}

/**
 * Showtime Editing & Cancellations
 */
function openEditShowtime(showtime) {
  $('#editShowtimeId').value = String(showtime.id);
  $('#editShowtimeTitle').textContent = `Edit ${showtime.movie}`;
  $('#editCinema').value = String(showtime.cinemaId);
  $('#editMovie').value = String(showtime.movieId);
  $('#editDate').value = showtime.date;
  $('#editTime').value = showtime.time;
  $('#editCategory').value = showtime.category;
  $('#editScreen').value = showtime.screen;
  $('#editPrice').value = showtime.startingPrice;
  updateEditLateNightOption();
  $('#editShowtimeDialog').showModal();
}

async function loadScheduleDate() {
  const date = $('#scheduleDate').value;
  if (!date) return;
  try {
    adminShowtimes = await request(`/api/admin/showtimes?date=${encodeURIComponent(date)}`);
    renderAdminShowtimes();
  } catch (error) {
    setStatus(error.message);
  }
}

/**
 * Screening Bookings & Customer Resolution
 */
async function openScreeningBookings(showtimeId) {
  currentResolutionShowtimeId = showtimeId;
  const showtime = adminShowtimes.find((item) => String(item.id) === String(showtimeId));
  $('#screeningBookingsTitle').textContent = showtime
    ? `${showtime.movie} · ${showtime.date} · ${showtime.time}`
    : 'Screening bookings';
  $('#screeningBookingsNote').textContent =
    showtime?.status === 'cancelled'
      ? `Cancellation reason: ${
          showtime.cancelReason || 'No reason supplied'
        }. Review each cancelled booking below and record a resolution.`
      : 'Bookings linked to this screening.';

  $('#screeningBookingRows').replaceChildren();
  const loading = document.createElement('tr');
  const loadingCell = document.createElement('td');
  loadingCell.colSpan = 7;
  loadingCell.textContent = 'Loading bookings…';
  loading.append(loadingCell);
  $('#screeningBookingRows').append(loading);
  $('#screeningBookingsDialog').showModal();

  try {
    const bookings = await request(
      `/api/admin/bookings?showtime_id=${encodeURIComponent(showtimeId)}`
    );
    renderScreeningBookings(bookings, showtime);
  } catch (error) {
    setStatus(error.message);
  }
}

function renderScreeningBookings(bookings, showtime) {
  currentScreeningBookings = bookings;
  const body = $('#screeningBookingRows');
  body.replaceChildren();

  if (!bookings || !bookings.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'No customer bookings are linked to this screening.';
    row.append(cell);
    body.append(row);
    return;
  }

  for (const booking of bookings) {
    const row = document.createElement('tr');

    const customer = document.createElement('td');
    const name = document.createElement('strong');
    name.textContent = booking.customerName;
    const email = document.createElement('small');
    email.className = 'resolution-subtext';
    email.textContent = booking.email;
    customer.append(name, email);
    row.append(customer);

    const seats = document.createElement('td');
    seats.textContent = booking.seats.join(', ');
    row.append(seats);

    const payment = document.createElement('td');
    payment.textContent =
      booking.paymentStatus === 'comped'
        ? 'Free replacement'
        : `${booking.paymentStatus.replaceAll('_', ' ')} · ${booking.paymentMethod}`;
    row.append(payment);

    const total = document.createElement('td');
    total.textContent = `₹${Number(booking.total).toLocaleString('en-IN')}`;
    row.append(total);

    const ticket = document.createElement('td');
    if (booking.ticketCode) {
      const code = document.createElement('code');
      code.className = 'resolution-ticket';
      code.textContent = booking.ticketCode;
      ticket.append(code);
    } else {
      ticket.textContent = 'No ticket issued';
    }
    row.append(ticket);

    const resolution = document.createElement('td');
    resolution.textContent =
      booking.resolutionStatus === 'pending'
        ? 'Needs action'
        : booking.resolutionStatus === 'no_payment'
        ? 'No payment required'
        : booking.resolutionStatus === 'demo_refund_recorded'
        ? `Demo refund logged · ₹${Number(booking.refundAmount).toLocaleString('en-IN')} · ${
            booking.refundReference
          }`
        : booking.resolutionStatus === 'refund_recorded'
        ? `Refund recorded · ₹${Number(booking.refundAmount).toLocaleString('en-IN')} · ${
            booking.refundReference
          }`
        : booking.resolutionStatus === 'replacement_issued'
        ? `Free ticket issued · ${booking.replacementTicketCode || 'see booking'}`
        : booking.resolutionStatus.replaceAll('_', ' ');
    row.append(resolution);

    const actions = document.createElement('td');
    actions.className = 'resolution-actions';

    if (showtime?.status === 'cancelled' && booking.resolutionStatus === 'pending') {
      if (['demo_paid', 'paid'].includes(booking.paymentStatus) && booking.total > 0) {
        const refund = document.createElement('button');
        refund.type = 'button';
        refund.className = 'button light';
        refund.dataset.action = 'record-refund';
        refund.dataset.id = booking.id;
        refund.textContent = 'Record refund';
        actions.append(refund);
      }

      const replacement = document.createElement('button');
      replacement.type = 'button';
      replacement.className = 'button primary';
      replacement.dataset.action = 'issue-replacement';
      replacement.dataset.id = booking.id;
      replacement.textContent = 'Free ticket';
      actions.append(replacement);
    }

    if (!actions.childElementCount) actions.textContent = '—';
    row.append(actions);
    body.append(row);
  }
}

function openRefundForm(booking) {
  $('#refundBookingId').value = booking.id;
  $('#refundReference').value = '';
  $('#refundAmountText').textContent = `Full booking amount to record: ₹${Number(
    booking.total
  ).toLocaleString('en-IN')}. This form keeps a reference and does not move funds.`;
  $('#refundDialog').showModal();
}

async function loadReplacementOptions() {
  const select = $('#replacementShowtime');
  select.replaceChildren();
  const date = $('#replacementDate').value;
  if (!date) {
    const opt = document.createElement('option');
    opt.textContent = 'Choose a date first';
    opt.value = '';
    select.append(opt);
    return;
  }

  try {
    const showtimes = await request(`/api/admin/showtimes?date=${encodeURIComponent(date)}`);
    const options = showtimes.filter(
      (item) =>
        item.status === 'scheduled' &&
        item.cinemaActive &&
        item.movieActive &&
        showtimeIsFuture(item) &&
        String(item.id) !== String(currentResolutionShowtimeId)
    );

    if (!options.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No future screenings available on this date';
      select.append(opt);
      return;
    }

    for (const item of options) {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.time} · ${item.movie} · ${item.cinema}, ${item.city} · ${item.screen}`;
      select.append(opt);
    }
  } catch (error) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = error.message;
    select.append(opt);
  }
}

async function openReplacementForm(booking) {
  $('#replacementBookingId').value = booking.id;
  $('#replacementCustomerText').textContent = `For ${booking.customerName} · ${booking.email} · ${
    booking.seats.length
  } seat${booking.seats.length === 1 ? '' : 's'}.`;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  $('#replacementDate').value = localDate(tomorrow);

  $('#replacementResult').hidden = true;
  $('#replacementResult').replaceChildren();
  $('#replacementForm button[type="submit"]').disabled = false;
  $('#replacementDialog').showModal();
  await loadReplacementOptions();
}

// ================= FINANCIAL & REVENUE ANALYTICS =================
async function fetchAnalytics(range) {
  const selectedRange = range || $('#analyticsRangeSelect')?.value || 'all';
  try {
    const data = await request(`/api/admin/analytics?range=${encodeURIComponent(selectedRange)}`);
    setText('#analyticsGrossRev', `₹${Number(data.grossRevenue || 0).toLocaleString('en-IN')}`);
    setText('#analyticsTicketRev', `₹${Number(data.ticketRevenue || 0).toLocaleString('en-IN')}`);
    setText('#analyticsSnackRev', `₹${Number(data.snackRevenue || 0).toLocaleString('en-IN')}`);
    setText('#analyticsSeatsSold', `${data.totalSeatsSold || 0} seats admitted`);
    setText('#analyticsOccupancyRate', `${data.occupancyRate || 0}%`);
    if ($('#analyticsOccupancyFill')) {
      $('#analyticsOccupancyFill').style.width = `${Math.min(100, Math.max(0, data.occupancyRate || 0))}%`;
    }
    setText('#analyticsTopMovie', data.topMovie || '—');
    setText('#analyticsTopCinema', data.topCinema || '—');
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
}

// ================= ONE-CLICK CSV EXPORTS =================
function downloadCsv(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

async function exportBookingsCsv() {
  setStatus('Generating bookings CSV…');
  try {
    const bookings = await request('/api/admin/bookings');
    const headers = [
      'Booking ID',
      'Ticket Code',
      'Customer Name',
      'Customer Email',
      'Movie',
      'Cinema',
      'Date',
      'Time',
      'Seats',
      'Snacks',
      'Total Amount (INR)',
      'Booking Status',
      'Payment Status',
      'Payment Method',
      'Resolution Status',
      'Created At',
    ];

    const rows = [headers.join(',')];
    for (const b of bookings) {
      const snacksStr = (b.snacks || []).map((s) => `${s.qty}x ${s.name}`).join('; ');
      rows.push([
        escapeCsv(b.id),
        escapeCsv(b.ticketCode || 'N/A'),
        escapeCsv(b.customerName),
        escapeCsv(b.email),
        escapeCsv(b.movie),
        escapeCsv(b.cinema),
        escapeCsv(b.date),
        escapeCsv(b.time),
        escapeCsv(b.seats.join(', ')),
        escapeCsv(snacksStr),
        escapeCsv(b.total),
        escapeCsv(b.status),
        escapeCsv(b.paymentStatus),
        escapeCsv(b.paymentMethod),
        escapeCsv(b.resolutionStatus),
        escapeCsv(b.createdAt),
      ].join(','));
    }

    const csvContent = rows.join('\r\n');
    downloadCsv(`moviehub-bookings-${localDate()}.csv`, csvContent);
    setStatus('Bookings CSV exported successfully.');
  } catch (err) {
    setStatus('Export failed: ' + err.message);
  }
}

async function exportHallManifestCsv() {
  if (!currentInspectedShowtimeId) return;
  try {
    const data = await request(`/api/admin/showtimes/${currentInspectedShowtimeId}/occupancy`);
    const st = data.showtime;
    const headers = ['Screening ID', 'Movie', 'Cinema', 'Date', 'Time', 'Seat ID', 'Status', 'Attendee Name', 'Ticket Code'];
    const rows = [headers.join(',')];

    for (const [seatId, info] of Object.entries(data.seatDetails || {})) {
      rows.push([
        escapeCsv(st.id),
        escapeCsv(st.movie),
        escapeCsv(st.cinema),
        escapeCsv(st.date),
        escapeCsv(st.time),
        escapeCsv(seatId),
        escapeCsv(info.status === 'checked_in' ? 'Checked-In' : 'Confirmed'),
        escapeCsv(info.customerName),
        escapeCsv(info.ticketCode),
      ].join(','));
    }

    for (const seatId of data.blockedSeats || []) {
      rows.push([
        escapeCsv(st.id),
        escapeCsv(st.movie),
        escapeCsv(st.cinema),
        escapeCsv(st.date),
        escapeCsv(st.time),
        escapeCsv(seatId),
        escapeCsv('Staff Blocked'),
        escapeCsv('N/A (Held by Cinema Staff)'),
        escapeCsv('N/A'),
      ].join(','));
    }

    const csvContent = rows.join('\r\n');
    downloadCsv(`hall-manifest-screening-${currentInspectedShowtimeId}.csv`, csvContent);
    setStatus('Hall manifest CSV exported successfully.');
  } catch (err) {
    setStatus('Export failed: ' + err.message);
  }
}

// ================= F&B CONCESSIONS / SNACKS MANAGER =================
async function loadAdminSnacks() {
  const body = $('#snackRows');
  if (!body) return;
  body.replaceChildren();

  try {
    adminSnacks = await request('/api/admin/snacks');
    if (!adminSnacks.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 7;
      cell.textContent = 'No snack items in the concessions catalog.';
      row.append(cell);
      body.append(row);
      return;
    }

    for (const item of adminSnacks) {
      const row = document.createElement('tr');

      const iconCell = document.createElement('td');
      iconCell.style.fontSize = '20px';
      iconCell.textContent = item.icon || '🍿';
      row.append(iconCell);

      const nameCell = document.createElement('td');
      const nameStrong = document.createElement('strong');
      nameStrong.textContent = item.name;
      nameCell.append(nameStrong);
      row.append(nameCell);

      const catCell = document.createElement('td');
      catCell.textContent = item.category || 'Snacks';
      row.append(catCell);

      const priceCell = document.createElement('td');
      priceCell.textContent = `₹${Number(item.price).toLocaleString('en-IN')}`;
      row.append(priceCell);

      const descCell = document.createElement('td');
      descCell.textContent = item.description || '—';
      row.append(descCell);

      const stockCell = document.createElement('td');
      const stockBtn = document.createElement('button');
      stockBtn.type = 'button';
      stockBtn.className = `stock-toggle-badge ${item.inStock ? 'in-stock' : 'out-of-stock'}`;
      stockBtn.textContent = item.inStock ? 'In Stock ✓' : 'Out of Stock ✗';
      stockBtn.title = 'Click to toggle availability';
      stockBtn.addEventListener('click', async () => {
        try {
          await request(`/api/admin/snacks/${item.id}/stock`, { method: 'PATCH' });
          await loadAdminSnacks();
        } catch (e) {
          setStatus(e.message);
        }
      });
      stockCell.append(stockBtn);
      row.append(stockCell);

      const actionsCell = document.createElement('td');
      actionsCell.className = 'screening-actions';
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'button light';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => openSnackForm(item));

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'button archive-button';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', async () => {
        if (!confirm(`Delete snack item "${item.name}"?`)) return;
        try {
          await request(`/api/admin/snacks/${item.id}`, { method: 'DELETE' });
          await loadAdminSnacks();
          setStatus('Snack item deleted.');
        } catch (e) {
          setStatus(e.message);
        }
      });

      actionsCell.append(editBtn, delBtn);
      row.append(actionsCell);
      body.append(row);
    }
  } catch (err) {
    console.error('Failed to load snacks:', err);
  }
}

function openSnackForm(snack = null) {
  $('#snackDialogTitle').textContent = snack ? 'Edit Snack Item' : 'Add Snack Item';
  $('#snackId').value = snack ? snack.id : '';
  $('#snackName').value = snack ? snack.name : '';
  $('#snackIcon').value = snack ? snack.icon : '🍿';
  $('#snackCategory').value = snack ? snack.category : 'Popcorn';
  $('#snackPrice').value = snack ? snack.price : 200;
  $('#snackDescription').value = snack ? snack.description : '';
  $('#snackInStock').checked = snack ? snack.inStock : true;
  $('#snackDialog').showModal();
}

// ================= PROMO CODES MANAGER =================
async function loadAdminPromos() {
  const body = $('#promoRows');
  if (!body) return;
  body.replaceChildren();

  try {
    adminPromos = await request('/api/admin/promos');
    if (!adminPromos.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.textContent = 'No promo codes configured.';
      row.append(cell);
      body.append(row);
      return;
    }

    for (const promo of adminPromos) {
      const row = document.createElement('tr');

      const codeCell = document.createElement('td');
      const codeStrong = document.createElement('strong');
      codeStrong.style.fontFamily = 'monospace';
      codeStrong.style.letterSpacing = '0.05em';
      codeStrong.textContent = promo.code;
      codeCell.append(codeStrong);
      row.append(codeCell);

      const typeCell = document.createElement('td');
      typeCell.textContent = promo.discountType === 'percentage' ? 'Percentage (%)' : 'Flat Amount (₹)';
      row.append(typeCell);

      const valCell = document.createElement('td');
      valCell.textContent = promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`;
      row.append(valCell);

      const usesCell = document.createElement('td');
      usesCell.textContent = `${promo.usedCount} / ${promo.maxUses}`;
      row.append(usesCell);

      const statusCell = document.createElement('td');
      const statusBtn = document.createElement('button');
      statusBtn.type = 'button';
      statusBtn.className = `stock-toggle-badge ${promo.active ? 'in-stock' : 'out-of-stock'}`;
      statusBtn.textContent = promo.active ? 'Active ✓' : 'Inactive ✗';
      statusBtn.addEventListener('click', async () => {
        try {
          await request(`/api/admin/promos/${promo.id}`, {
            method: 'PUT',
            body: JSON.stringify({ active: !promo.active }),
          });
          await loadAdminPromos();
        } catch (e) {
          setStatus(e.message);
        }
      });
      statusCell.append(statusBtn);
      row.append(statusCell);

      const actionsCell = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'button archive-button';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', async () => {
        if (!confirm(`Delete coupon code ${promo.code}?`)) return;
        try {
          await request(`/api/admin/promos/${promo.id}`, { method: 'DELETE' });
          await loadAdminPromos();
          setStatus('Promo code deleted.');
        } catch (e) {
          setStatus(e.message);
        }
      });
      actionsCell.append(delBtn);
      row.append(actionsCell);
      body.append(row);
    }
  } catch (err) {
    console.error('Failed to load promos:', err);
  }
}

function openPromoForm() {
  $('#promoDialogTitle').textContent = 'Create Promo Code';
  $('#promoId').value = '';
  $('#promoCode').value = '';
  $('#promoDiscountType').value = 'percentage';
  $('#promoDiscountValue').value = 20;
  $('#promoMaxUses').value = 100;
  $('#promoActive').checked = true;
  $('#promoDialog').showModal();
}

// ================= LIVE SCAN AUDIT FEED =================
async function loadAdminScanLogs() {
  const body = $('#scanAuditRows');
  if (!body) return;
  body.replaceChildren();

  try {
    adminScanLogs = await request('/api/admin/scan-logs?limit=25');
    if (!adminScanLogs.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.textContent = 'No scans recorded yet.';
      row.append(cell);
      body.append(row);
      return;
    }

    for (const log of adminScanLogs) {
      const row = document.createElement('tr');

      const timeCell = document.createElement('td');
      const d = new Date(log.timestamp);
      timeCell.textContent = isNaN(d.getTime()) ? log.timestamp : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      row.append(timeCell);

      const codeCell = document.createElement('td');
      codeCell.style.fontFamily = 'monospace';
      codeCell.textContent = log.ticketCode;
      row.append(codeCell);

      const custCell = document.createElement('td');
      custCell.textContent = log.customerName || '—';
      row.append(custCell);

      const movieCell = document.createElement('td');
      movieCell.textContent = log.movie || '—';
      row.append(movieCell);

      const seatsCell = document.createElement('td');
      seatsCell.textContent = log.seats || '—';
      row.append(seatsCell);

      const statusCell = document.createElement('td');
      const pill = document.createElement('span');
      pill.className = `scan-status-pill ${log.status}`;
      pill.textContent = log.status === 'valid' ? 'Valid Check-In' : log.status === 'duplicate' ? 'Duplicate / Re-entry' : 'Invalid / Rejected';
      statusCell.append(pill);
      row.append(statusCell);

      body.append(row);
    }
  } catch (err) {
    console.error('Failed to load scan logs:', err);
  }
}

// ================= LIVE HALL OCCUPANCY INSPECTOR =================
async function inspectHall(showtimeId) {
  currentInspectedShowtimeId = showtimeId;
  const dialog = $('#hallInspectorDialog');
  if (!dialog) return;

  const container = $('#inspectorSeatGrid');
  container.innerHTML = '<p style="color:var(--muted); padding:30px; text-align:center;">Loading auditorium layout…</p>';
  dialog.showModal();

  try {
    const data = await request(`/api/admin/showtimes/${showtimeId}/occupancy`);
    const st = data.showtime;
    const seatDetails = data.seatDetails || {};
    const blockedSeats = new Set((data.blockedSeats || []).map((s) => String(s).toUpperCase()));

    $('#inspectorTitle').textContent = `Auditorium Map: ${st.movie}`;
    $('#inspectorMetaBar').innerHTML = `
      <span>Cinema: <strong>${st.cinema}</strong></span>
      <span>Screen: <strong>${st.screen}</strong></span>
      <span>Category: <strong>${st.category}</strong></span>
      <span>Schedule: <strong>${st.date} @ ${st.time}</strong></span>
      <span>Starting Price: <strong>₹${Number(st.startingPrice).toLocaleString('en-IN')}</strong></span>
    `;

    container.replaceChildren();

    const AUDITORIUM_ROWS = [
      { tier: 'Classic', label: 'Classic Standard (Front Rows)', rows: ['A', 'B', 'C', 'D'] },
      { tier: 'Prime', label: 'Prime Club (Middle Rows)', rows: ['E', 'F', 'G'] },
      { tier: 'VIP', label: 'VIP Club Recliners (Back Row)', rows: ['H'] },
    ];
    const SEATS_PER_ROW = 12;
    const AISLE_AFTER = [3, 9];

    let checkedInCount = 0;
    let bookedCount = 0;
    let blockedCount = 0;
    let totalSeats = 0;

    for (const tierConfig of AUDITORIUM_ROWS) {
      const divider = document.createElement('div');
      divider.className = 'inspector-tier-label';
      divider.innerHTML = `<span>${tierConfig.label}</span><hr>`;
      container.append(divider);

      for (const rowLetter of tierConfig.rows) {
        const rowEl = document.createElement('div');
        rowEl.className = 'inspector-seat-row';

        const labelLeft = document.createElement('span');
        labelLeft.className = 'inspector-row-label';
        labelLeft.textContent = rowLetter;
        rowEl.append(labelLeft);

        for (let num = 1; num <= SEATS_PER_ROW; num++) {
          totalSeats++;
          const seatId = `${rowLetter}${num}`;
          const isBlocked = blockedSeats.has(seatId);
          const detail = seatDetails[seatId];

          const seatBtn = document.createElement('button');
          seatBtn.type = 'button';
          seatBtn.className = 'inspector-seat';
          seatBtn.dataset.seat = seatId;
          seatBtn.textContent = String(num);

          if (AISLE_AFTER.includes(num) && num !== SEATS_PER_ROW) {
            seatBtn.style.marginRight = '14px';
          }

          if (detail) {
            if (detail.status === 'checked_in') {
              checkedInCount++;
              seatBtn.classList.add('checked-in');
              seatBtn.title = `${seatId} · Checked-In\nAttendee: ${detail.customerName}\nTicket: ${detail.ticketCode}`;
            } else {
              bookedCount++;
              seatBtn.classList.add('booked');
              seatBtn.title = `${seatId} · Booked\nCustomer: ${detail.customerName}\nTicket: ${detail.ticketCode}`;
            }
            seatBtn.addEventListener('click', () => {
              alert(`Seat ${seatId}\nStatus: ${detail.status === 'checked_in' ? 'Checked-In' : 'Confirmed Booking'}\nAttendee: ${detail.customerName}\nTicket: ${detail.ticketCode}`);
            });
          } else if (isBlocked) {
            blockedCount++;
            seatBtn.classList.add('blocked');
            seatBtn.title = `${seatId} · Staff Blocked\nClick to unblock`;
            seatBtn.addEventListener('click', () => toggleSeatBlock(showtimeId, seatId));
          } else {
            seatBtn.classList.add('available');
            seatBtn.title = `${seatId} · Available\nClick to block for VIP/maintenance`;
            seatBtn.addEventListener('click', () => toggleSeatBlock(showtimeId, seatId));
          }

          rowEl.append(seatBtn);
        }

        const labelRight = document.createElement('span');
        labelRight.className = 'inspector-row-label';
        labelRight.textContent = rowLetter;
        rowEl.append(labelRight);

        container.append(rowEl);
      }
    }

    const availCount = totalSeats - (checkedInCount + bookedCount + blockedCount);
    $('#legCheckedInCount').textContent = String(checkedInCount);
    $('#legBookedCount').textContent = String(bookedCount);
    $('#legBlockedCount').textContent = String(blockedCount);
    $('#legAvailCount').textContent = String(availCount);
  } catch (err) {
    container.innerHTML = `<p style="color:#ef4444; padding:20px; text-align:center;">${err.message}</p>`;
  }
}

async function toggleSeatBlock(showtimeId, seatId) {
  try {
    const res = await request(`/api/admin/showtimes/${showtimeId}/seats/block`, {
      method: 'POST',
      body: JSON.stringify({ seatId }),
    });
    setStatus(`Seat ${seatId} was ${res.action}.`);
    await inspectHall(showtimeId);
  } catch (err) {
    alert(err.message);
  }
}

/**
 * QR Code / Ticket Validation & Camera
 */
async function scanTicket(code) {
  const result = $('#scanResult');
  result.className = 'scan-result';
  result.textContent = 'Checking ticket…';
  try {
    const response = await request('/api/staff/scan', {
      method: 'POST',
      body: JSON.stringify({ ticketCode: code.trim() }),
    });
    result.className = 'scan-result ok';
    result.textContent = `Valid ticket · ${response.ticketCode} · checked in for ${response.customerName}.`;
    await connect();
  } catch (error) {
    result.className = 'scan-result error';
    result.textContent = error.message;
    await loadAdminScanLogs();
  }
}

async function stopCamera() {
  scanLoop++;
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  $('#cameraPreview').hidden = true;
  $('#startCamera').hidden = false;
  $('#stopCamera').hidden = true;
}

// Event Bindings
function initEventHandlers() {
  // Authentication
  $('#authForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const token = $('#adminToken').value.trim();
    setAdminToken(token);
    connect();
  });

  // Date Defaults
  $('#showDate').value = localDate();
  $('#scheduleDate').value = localDate();

  // Screenings Form
  $('#cinemaSelect').addEventListener('change', updateLateNightOption);
  $('#showtimeForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.submitter;
    button.disabled = true;
    const payload = {
      cinemaId: Number($('#cinemaSelect').value),
      movieId: Number($('#movieSelect').value),
      date: $('#showDate').value,
      time: $('#showTime').value,
      category: $('#showCategory').value.trim(),
      screen: $('#showScreen').value.trim(),
      startingPrice: Number($('#showPrice').value),
    };

    try {
      await request('/api/admin/showtimes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      $('#scheduleDate').value = payload.date;
      setStatus('Screening saved.');
      await connect();
    } catch (error) {
      setStatus(error.message);
    } finally {
      button.disabled = false;
    }
  });

  $('#scheduleDate').addEventListener('change', loadScheduleDate);
  $('#scheduleCinemaFilter').addEventListener('change', renderAdminShowtimes);
  $('#scheduleStatusFilter').addEventListener('change', renderAdminShowtimes);
  $('#refreshShowtimes').addEventListener('click', loadScheduleDate);

  // Showtime Actions (Edit / Cancel / Bookings)
  $('#showtimeRows').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const showtime = adminShowtimes.find((item) => String(item.id) === button.dataset.id);
    if (!showtime) return;

    if (button.dataset.action === 'edit-showtime') {
      openEditShowtime(showtime);
      return;
    }
    if (button.dataset.action === 'cancel-showtime') {
      $('#cancelShowtimeId').value = String(showtime.id);
      $('#cancelShowtimeTitle').textContent = `Cancel ${showtime.movie}?`;
      $('#cancelReason').value = '';
      $('#cancelShowtimeDialog').showModal();
      return;
    }
    if (button.dataset.action === 'showtime-bookings') {
      openScreeningBookings(showtime.id);
      return;
    }
    if (button.dataset.action === 'inspect-hall') {
      inspectHall(Number(showtime.id));
      return;
    }
  });

  // Edit Showtime Dialog
  $('#editCinema').addEventListener('change', updateEditLateNightOption);
  $('#closeEditShowtime').addEventListener('click', () => $('#editShowtimeDialog').close());
  $('#cancelEditShowtime').addEventListener('click', () => $('#editShowtimeDialog').close());
  $('#editShowtimeForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.submitter || event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    const id = $('#editShowtimeId').value;
    const payload = {
      cinemaId: Number($('#editCinema').value),
      movieId: Number($('#editMovie').value),
      date: $('#editDate').value,
      time: $('#editTime').value,
      category: $('#editCategory').value.trim(),
      screen: $('#editScreen').value.trim(),
      startingPrice: Number($('#editPrice').value),
    };

    try {
      await request(`/api/admin/showtimes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      $('#editShowtimeDialog').close();
      $('#scheduleDate').value = payload.date;
      setStatus('Screening updated.');
      await connect();
    } catch (error) {
      setStatus(error.message);
    } finally {
      button.disabled = false;
    }
  });

  // Cancel Showtime Dialog
  $('#closeCancelShowtime').addEventListener('click', () => $('#cancelShowtimeDialog').close());
  $('#cancelCancelShowtime').addEventListener('click', () => $('#cancelShowtimeDialog').close());
  $('#cancelShowtimeForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.submitter || event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    const id = $('#cancelShowtimeId').value;

    try {
      const result = await request(`/api/admin/showtimes/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: $('#cancelReason').value.trim() }),
      });
      $('#cancelShowtimeDialog').close();
      setStatus(`Screening cancelled. ${result.affectedBookings} affected booking(s).`);
      await connect();
      if (result.affectedBookings) {
        await openScreeningBookings(id);
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      button.disabled = false;
    }
  });

  // Screening Bookings Dialog Actions
  $('#closeScreeningBookings').addEventListener('click', () =>
    $('#screeningBookingsDialog').close()
  );
  $('#screeningBookingRows').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const booking = currentScreeningBookings.find((item) => item.id === button.dataset.id);
    if (!booking) return;

    if (button.dataset.action === 'record-refund') openRefundForm(booking);
    if (button.dataset.action === 'issue-replacement') openReplacementForm(booking);
  });

  // Refund Form
  $('#closeRefundDialog').addEventListener('click', () => $('#refundDialog').close());
  $('#cancelRefund').addEventListener('click', () => $('#refundDialog').close());
  $('#refundForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.submitter || event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    const id = $('#refundBookingId').value;

    try {
      const result = await request(`/api/admin/bookings/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ refundReference: $('#refundReference').value.trim() }),
      });
      $('#refundDialog').close();
      setStatus(
        result.actualMoneyMoved
          ? 'Refund processed.'
          : 'Refund record saved; MovieHub did not transfer money.'
      );
      const rows = await request(
        `/api/admin/bookings?showtime_id=${encodeURIComponent(currentResolutionShowtimeId)}`
      );
      renderScreeningBookings(
        rows,
        adminShowtimes.find((item) => String(item.id) === String(currentResolutionShowtimeId))
      );
    } catch (error) {
      setStatus(error.message);
    } finally {
      button.disabled = false;
    }
  });

  // Replacement Form
  $('#closeReplacementDialog').addEventListener('click', () => $('#replacementDialog').close());
  $('#cancelReplacement').addEventListener('click', () => $('#replacementDialog').close());
  $('#replacementDate').addEventListener('change', loadReplacementOptions);
  $('#replacementForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.submitter || event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    const id = $('#replacementBookingId').value;

    try {
      const result = await request(`/api/admin/bookings/${id}/replacement`, {
        method: 'POST',
        body: JSON.stringify({ showtimeId: Number($('#replacementShowtime').value) }),
      });
      const message = document.createElement('span');
      message.textContent = `Free ticket created for ${result.title} at ${result.cinema}, ${result.city} · ${result.date} · ${result.time}. Share this code with the customer:`;
      const code = document.createElement('strong');
      code.textContent = result.ticketCode;
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'button light';
      copy.textContent = 'Copy ticket code';
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(result.ticketCode);
          copy.textContent = 'Copied';
        } catch {
          setStatus('Copy failed. Select the ticket code and copy it manually.');
        }
      });
      $('#replacementResult').replaceChildren(message, code, copy);
      $('#replacementResult').hidden = false;
      setStatus('Free replacement ticket issued. Share its code with the customer.');
      await connect();
      const rows = await request(
        `/api/admin/bookings?showtime_id=${encodeURIComponent(currentResolutionShowtimeId)}`
      );
      renderScreeningBookings(
        rows,
        adminShowtimes.find((item) => String(item.id) === String(currentResolutionShowtimeId))
      );
    } catch (error) {
      setStatus(error.message);
      button.disabled = false;
    }
  });

  // Movie Catalog Actions
  $('#addMovie').addEventListener('click', () => openMovieForm());
  $('#closeMovieDialog').addEventListener('click', () => $('#movieDialog').close());
  $('#cancelMovie').addEventListener('click', () => $('#movieDialog').close());
  $('#movieSearch').addEventListener('input', renderAdminMovies);
  $('#movieStatusFilter').addEventListener('change', renderAdminMovies);

  $('#movieRows').addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const movie = adminMovies.find((item) => String(item.id) === button.dataset.id);
    if (!movie) return;

    if (button.dataset.action === 'edit') {
      openMovieForm(movie);
      return;
    }

    button.disabled = true;
    try {
      await request(`/api/admin/movies/${movie.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !movie.active }),
      });
      setStatus(
        movie.active
          ? 'Movie archived. Existing bookings are retained.'
          : 'Movie restored to the customer catalog.'
      );
      await connect();
    } catch (error) {
      setStatus(error.message);
      button.disabled = false;
    }
  });

  $('#movieForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.submitter || event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    const id = $('#movieId').value;
    const path = id ? `/api/admin/movies/${id}` : '/api/admin/movies';

    try {
      await request(path, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(movieFormPayload()),
      });
      $('#movieDialog').close();
      setStatus(id ? 'Movie updated.' : 'Movie added.');
      await connect();
    } catch (error) {
      setStatus(error.message);
    } finally {
      button.disabled = false;
    }
  });

  // Cinema Catalog Actions
  $('#addCinema').addEventListener('click', () => openCinemaForm());
  $('#closeCinemaDialog').addEventListener('click', () => $('#cinemaDialog').close());
  $('#cancelCinema').addEventListener('click', () => $('#cinemaDialog').close());
  $('#cinemaSearch').addEventListener('input', renderAdminCinemas);
  $('#cinemaStatusFilter').addEventListener('change', renderAdminCinemas);

  $('#cinemaRows').addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const cinema = adminCinemas.find((item) => String(item.id) === button.dataset.id);
    if (!cinema) return;

    if (button.dataset.action === 'edit-cinema') {
      openCinemaForm(cinema);
      return;
    }

    button.disabled = true;
    try {
      await request(`/api/admin/cinemas/${cinema.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !cinema.active }),
      });
      setStatus(
        cinema.active
          ? 'Cinema deactivated. Existing bookings are retained.'
          : 'Cinema activated for customer bookings.'
      );
      await connect();
    } catch (error) {
      setStatus(error.message);
      button.disabled = false;
    }
  });

  $('#cinemaForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.submitter || event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    const id = $('#cinemaId').value;
    const path = id ? `/api/admin/cinemas/${id}` : '/api/admin/cinemas';

    try {
      await request(path, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(cinemaFormPayload()),
      });
      $('#cinemaDialog').close();
      setStatus(id ? 'Cinema updated.' : 'Cinema added.');
      await connect();
    } catch (error) {
      setStatus(error.message);
    } finally {
      button.disabled = false;
    }
  });

  // Theme Management
  initAdminTheme();

  // Analytics & Exports
  $('#analyticsRangeSelect')?.addEventListener('change', (e) => fetchAnalytics(e.target.value));
  $('#exportBookingsCsvBtn')?.addEventListener('click', exportBookingsCsv);
  $('#exportHallManifestBtn')?.addEventListener('click', exportHallManifestCsv);
  $('#closeHallInspector')?.addEventListener('click', () => $('#hallInspectorDialog').close());

  // Concessions Dialog & Form
  $('#addSnackBtn')?.addEventListener('click', () => openSnackForm());
  $('#closeSnackDialog')?.addEventListener('click', () => $('#snackDialog').close());
  $('#cancelSnack')?.addEventListener('click', () => $('#snackDialog').close());
  $('#snackForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#snackId').value;
    const payload = {
      name: $('#snackName').value.trim(),
      icon: $('#snackIcon').value.trim() || '🍿',
      category: $('#snackCategory').value,
      price: Number($('#snackPrice').value),
      description: $('#snackDescription').value.trim(),
      inStock: $('#snackInStock').checked,
    };
    try {
      await request(id ? `/api/admin/snacks/${id}` : '/api/admin/snacks', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      $('#snackDialog').close();
      setStatus(id ? 'Snack updated.' : 'Snack item added.');
      await loadAdminSnacks();
    } catch (err) {
      setStatus(err.message);
    }
  });

  // Promo Codes Dialog & Form
  $('#addPromoBtn')?.addEventListener('click', openPromoForm);
  $('#closePromoDialog')?.addEventListener('click', () => $('#promoDialog').close());
  $('#cancelPromo')?.addEventListener('click', () => $('#promoDialog').close());
  $('#promoForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      code: $('#promoCode').value.trim().toUpperCase(),
      discountType: $('#promoDiscountType').value,
      discountValue: Number($('#promoDiscountValue').value),
      maxUses: Number($('#promoMaxUses').value),
      active: $('#promoActive').checked,
    };
    try {
      await request('/api/admin/promos', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      $('#promoDialog').close();
      setStatus('Promo code created.');
      await loadAdminPromos();
    } catch (err) {
      setStatus(err.message);
    }
  });

  // Refresh Bookings
  $('#refreshBookings').addEventListener('click', connect);

  // Ticket Manual Scan Form
  $('#scanForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const code = $('#ticketCodeInput').value;
    if (code) scanTicket(code);
  });

  // Camera QR Scanner
  $('#startCamera').addEventListener('click', async () => {
    try {
      if (!('BarcodeDetector' in window)) {
        throw new Error(
          'QR camera scanning is not supported on this browser engine. Enter the ticket code manually instead.'
        );
      }
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      const video = $('#cameraPreview');
      video.srcObject = cameraStream;
      video.hidden = false;
      await video.play();
      $('#startCamera').hidden = true;
      $('#stopCamera').hidden = false;

      const thisLoop = ++scanLoop;
      const detect = async () => {
        if (thisLoop !== scanLoop) return;
        try {
          const codes = await detector.detect(video);
          if (codes.length) {
            $('#ticketCodeInput').value = codes[0].rawValue;
            await stopCamera();
            scanTicket(codes[0].rawValue);
            return;
          }
        } catch {
          // Camera frame error ignored during stream
        }
        setTimeout(detect, 350);
      };
      detect();
    } catch (error) {
      $('#scanResult').className = 'scan-result error';
      $('#scanResult').textContent = error.message;
      await stopCamera();
    }
  });

  $('#stopCamera').addEventListener('click', stopCamera);
  window.addEventListener('pagehide', stopCamera);

  // Restore saved token & auto-connect
  const token = getAdminToken();
  if (token) {
    $('#adminToken').value = token;
    connect();
  }
}

document.addEventListener('DOMContentLoaded', initEventHandlers);
