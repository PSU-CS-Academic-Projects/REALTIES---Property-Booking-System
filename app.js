// ══════════════════════════════════════════════
//  Realties — App Logic
// ══════════════════════════════════════════════

// ── State ──────────────────────────────────────
let DATA = null;
let currentUser = null;
let selectedDate = null;
let selectedType = 'Viewing';
let currentProperty = null;
let activeFilter = 'all';

// ── Boot ───────────────────────────────────────
async function boot() {
  try {
    const res = await fetch('data.json');
    DATA = await res.json();
  } catch {
    // Fallback inline data if fetch fails (e.g. opened as file://)
    DATA = getFallbackData();
  }
  bindLoginEvents();
}

function bindLoginEvents() {
  document.getElementById('login-btn').addEventListener('click', attemptLogin);
  document.getElementById('login-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') attemptLogin();
  });
}

// ── Auth ───────────────────────────────────────
function attemptLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass  = document.getElementById('login-pass').value;
  const err   = document.getElementById('login-error');

  const user = DATA.users.find(u => u.email === email && u.password === pass);
  if (!user) {
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';
  currentUser = user;
  launchApp();
}

function launchApp() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');

  // Populate user info
  document.getElementById('user-avatar').textContent = currentUser.avatar;
  document.getElementById('user-name').textContent   = currentUser.name;

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dashboard-greeting').textContent =
    `${greet}, ${currentUser.name.split(' ')[0]}`;

  // Nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  document.getElementById('logout-btn').addEventListener('click', logout);

  renderAll();
}

function logout() {
  currentUser = null;
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('login-pass').value = '';
}

// ── Navigation ─────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === `page-${page}`);
  });
  if (page === 'bookings') renderBookings();
  if (page === 'saved')    renderSaved();
  if (page === 'properties') renderProperties();
}

// ── Render All ─────────────────────────────────
function renderAll() {
  renderDashboard();
  renderProperties();
  updateBadges();
}

// ── Dashboard ──────────────────────────────────
function renderDashboard() {
  const myBookings = DATA.bookings.filter(b => b.userId === currentUser.id);
  const mySaved    = currentUser.savedProperties || [];

  document.getElementById('stat-listings').textContent = DATA.properties.length;
  document.getElementById('stat-bookings').textContent = myBookings.length;
  document.getElementById('stat-saved').textContent    = mySaved.length;

  // Featured props (first 4)
  const propList = document.getElementById('dashboard-props-list');
  propList.innerHTML = DATA.properties.slice(0, 4).map(p => `
    <div class="prop-list-item" onclick="openModal(${p.id})">
      <div class="prop-thumb" style="background:${p.images[0]};">
        ${propEmoji(p.type)}
      </div>
      <div class="prop-list-info">
        <div class="prop-list-title">${p.title}</div>
        <div class="prop-list-addr">${p.address.split(',')[0]}</div>
      </div>
      <div class="prop-list-price">${formatPrice(p)}</div>
    </div>
  `).join('');

  // Upcoming bookings
  const bookingsList = document.getElementById('dashboard-bookings-list');
  if (myBookings.length === 0) {
    bookingsList.innerHTML = `
      <div class="empty-state" style="padding:30px 0">
        <div class="empty-state-icon">📅</div>
        <div style="font-size:0.85rem;color:var(--muted)">No upcoming bookings.<br>Browse properties to schedule a viewing.</div>
      </div>`;
  } else {
    bookingsList.innerHTML = myBookings.map(b => {
      const prop = DATA.properties.find(p => p.id === b.propertyId);
      return `
        <div class="booking-item">
          <div class="booking-prop">${prop ? prop.title : '—'}</div>
          <div class="booking-date">${formatDate(b.date)} · ${b.time} · ${b.type}</div>
          <div style="margin-top:6px"><span class="badge badge-${b.status.toLowerCase()}">${b.status}</span></div>
        </div>`;
    }).join('');
  }
}

// ── Properties ─────────────────────────────────
function renderProperties(propsToShow) {
  const grid = document.getElementById('properties-grid');
  const props = propsToShow || getFilteredProps();
  grid.innerHTML = props.length
    ? props.map(p => propCard(p)).join('')
    : `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--muted)">No properties found.</div>`;
}

function getFilteredProps() {
  const search = (document.getElementById('prop-search')?.value || '').toLowerCase();
  return DATA.properties.filter(p => {
    const matchFilter = activeFilter === 'all'
      || p.status === activeFilter
      || p.type === activeFilter
      || (activeFilter === 'Loft' && (p.type === 'Loft' || p.type === 'Studio'));
    const matchSearch = !search
      || p.title.toLowerCase().includes(search)
      || p.address.toLowerCase().includes(search)
      || p.type.toLowerCase().includes(search);
    return matchFilter && matchSearch;
  });
}

function filterProperties() { renderProperties(); }

function setFilter(el, filter) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  activeFilter = filter;
  renderProperties();
}

function propCard(p) {
  const saved = (currentUser.savedProperties || []).includes(p.id);
  return `
    <div class="property-card">
      <div class="property-image" style="background:linear-gradient(135deg,${p.images[0]},${p.images[1]});">
        <div class="property-image-inner">${propEmoji(p.type)}</div>
        <div class="property-badges">
          <span class="badge ${p.status === 'For Sale' ? 'badge-sale' : 'badge-rent'}">${p.status}</span>
          <span class="badge" style="background:rgba(0,0,0,0.35);color:#fff;">${p.type}</span>
        </div>
        <button class="property-save ${saved ? 'saved' : ''}" onclick="toggleSave(event,${p.id})" title="${saved ? 'Unsave' : 'Save'}">
          ${saved ? '♥' : '♡'}
        </button>
      </div>
      <div class="property-info">
        <div class="property-name">${p.title}</div>
        <div class="property-address">📍 ${p.address}</div>
        <div class="property-specs">
          <div class="spec-item">🛏 ${p.beds} Beds</div>
          <div class="spec-item">🚿 ${p.baths} Baths</div>
          <div class="spec-item">📐 ${p.sqft} sqm</div>
        </div>
        <div class="property-footer">
          <div>
            <div class="property-price">${formatPrice(p)}<span class="price-unit">${p.status === 'For Rent' ? '/mo' : ''}</span></div>
          </div>
          <button class="btn-view" onclick="openModal(${p.id})">View →</button>
        </div>
      </div>
    </div>`;
}

// ── Saved ──────────────────────────────────────
function renderSaved() {
  const grid = document.getElementById('saved-grid');
  const saved = currentUser.savedProperties || [];
  const props = DATA.properties.filter(p => saved.includes(p.id));
  grid.innerHTML = props.length
    ? props.map(p => propCard(p)).join('')
    : `<div style="grid-column:1/-1">
        <div class="empty-state">
          <div class="empty-state-icon">♡</div>
          <div class="empty-state-title">No saved properties yet</div>
          <div class="empty-state-text">Heart a property to add it to your wishlist.</div>
        </div>
      </div>`;
}

function toggleSave(e, propId) {
  e.stopPropagation();
  const saved = currentUser.savedProperties || [];
  const idx = saved.indexOf(propId);
  if (idx === -1) {
    currentUser.savedProperties.push(propId);
    showToast('♥ Property saved to wishlist');
  } else {
    currentUser.savedProperties.splice(idx, 1);
    showToast('Removed from wishlist');
  }
  updateBadges();
  renderProperties();
  renderSaved();
  renderDashboard();
}

// ── Bookings ───────────────────────────────────
function renderBookings() {
  const list = document.getElementById('bookings-list');
  const myBookings = DATA.bookings.filter(b => b.userId === currentUser.id);
  if (myBookings.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-title">No bookings yet</div>
        <div class="empty-state-text">Browse our listings and schedule your first viewing.</div>
      </div>`;
    return;
  }
  list.innerHTML = myBookings.map(b => {
    const prop = DATA.properties.find(p => p.id === b.propertyId);
    if (!prop) return '';
    return `
      <div class="booking-card">
        <div class="booking-thumb" style="background:linear-gradient(135deg,${prop.images[0]},${prop.images[1]});">
          ${propEmoji(prop.type)}
        </div>
        <div class="booking-card-info">
          <div class="booking-card-title">${prop.title}</div>
          <div class="booking-card-addr">📍 ${prop.address}</div>
          <div class="booking-card-meta">
            <div class="booking-meta-item">📅 <strong>${formatDate(b.date)}</strong></div>
            <div class="booking-meta-item">🕐 <strong>${b.time}</strong></div>
            <div class="booking-meta-item">📋 <strong>${b.type}</strong></div>
          </div>
          ${b.notes ? `<div style="margin-top:8px;font-size:0.78rem;color:var(--muted);font-style:italic;">"${b.notes}"</div>` : ''}
        </div>
        <div class="booking-card-right">
          <span class="badge badge-${b.status.toLowerCase()}">${b.status}</span>
          <br>
          <button class="btn-cancel" onclick="cancelBooking(${b.id})">Cancel</button>
        </div>
      </div>`;
  }).join('');
}

function cancelBooking(bookingId) {
  const idx = DATA.bookings.findIndex(b => b.id === bookingId);
  if (idx !== -1) {
    DATA.bookings.splice(idx, 1);
    renderBookings();
    renderDashboard();
    updateBadges();
    showToast('Booking cancelled');
  }
}

// ── Modal ──────────────────────────────────────
function openModal(propId) {
  const prop = DATA.properties.find(p => p.id === propId);
  if (!prop) return;
  currentProperty = prop;
  selectedDate = null;
  selectedType = 'Viewing';

  // Header
  document.getElementById('modal-header').style.background =
    `linear-gradient(135deg, ${prop.images[0]}, ${prop.images[1]})`;
  document.getElementById('modal-type').textContent    = prop.type;
  document.getElementById('modal-title').textContent   = prop.title;
  document.getElementById('modal-address').textContent = prop.address;

  // Price & status
  document.getElementById('modal-price').textContent = formatPrice(prop) +
    (prop.status === 'For Rent' ? ' / month' : '');
  document.getElementById('modal-status-badge').innerHTML =
    `<span class="badge ${prop.status === 'For Sale' ? 'badge-sale' : 'badge-rent'}">${prop.status}</span>`;

  // Specs
  document.getElementById('modal-beds').textContent  = prop.beds;
  document.getElementById('modal-baths').textContent = prop.baths;
  document.getElementById('modal-sqft').textContent  = prop.sqft + ' m²';
  document.getElementById('modal-floor').textContent = prop.floor;
  document.getElementById('modal-year').textContent  = prop.yearBuilt;

  // Desc
  document.getElementById('modal-desc').textContent = prop.description;

  // Features
  document.getElementById('modal-features').innerHTML =
    prop.features.map(f => `<span class="feature-tag">✓ ${f}</span>`).join('');

  // Agent
  const initials = prop.agent.split(' ').map(w => w[0]).join('');
  document.getElementById('modal-agent-row').innerHTML = `
    <div class="agent-avatar">${initials}</div>
    <div>
      <div class="agent-name">${prop.agent}</div>
      <div class="agent-label">Listing Agent</div>
    </div>
    <div class="agent-phone">${prop.agentPhone}</div>`;

  // Date slots
  document.getElementById('modal-dates').innerHTML =
    prop.available.map(d => `
      <button class="date-slot" onclick="selectDate(this,'${d}')">${formatDate(d)}</button>
    `).join('');

  // Reset booking type btns
  document.querySelectorAll('.booking-type-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('.booking-type-btn').classList.add('selected');

  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function selectDate(el, date) {
  document.querySelectorAll('.date-slot').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  selectedDate = date;
}

function selectType(el, type) {
  document.querySelectorAll('.booking-type-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  selectedType = type;
}

function confirmBooking() {
  if (!selectedDate) { showToast('⚠ Please select a date first', false); return; }
  if (!currentProperty) return;

  // Check duplicate
  const dup = DATA.bookings.find(b =>
    b.userId === currentUser.id && b.propertyId === currentProperty.id && b.date === selectedDate);
  if (dup) { showToast('⚠ You already have a booking on this date', false); return; }

  const newBooking = {
    id: Date.now(),
    userId: currentUser.id,
    propertyId: currentProperty.id,
    date: selectedDate,
    time: '10:00 AM',
    type: selectedType,
    status: 'Confirmed',
    notes: ''
  };
  DATA.bookings.push(newBooking);
  currentUser.bookings = currentUser.bookings || [];
  currentUser.bookings.push(newBooking.id);

  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';

  renderDashboard();
  renderBookings();
  updateBadges();
  showToast(`✓ Viewing booked for ${formatDate(selectedDate)}`, true);
}

// ── Badges ─────────────────────────────────────
function updateBadges() {
  const bCount = DATA.bookings.filter(b => b.userId === currentUser.id).length;
  const sCount = (currentUser.savedProperties || []).length;
  const bBadge = document.getElementById('booking-count-badge');
  const sBadge = document.getElementById('saved-count-badge');
  bBadge.textContent = bCount > 0 ? bCount : '';
  sBadge.textContent = sCount > 0 ? sCount : '';
  document.getElementById('stat-bookings').textContent = bCount;
  document.getElementById('stat-saved').textContent    = sCount;
}

// ── Helpers ────────────────────────────────────
function formatPrice(p) {
  if (p.status === 'For Rent') return '₱' + p.price.toLocaleString();
  if (p.price >= 1000000) return '₱' + (p.price / 1000000).toFixed(1) + 'M';
  return '₱' + p.price.toLocaleString();
}

function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function propEmoji(type) {
  const map = {
    'Penthouse': '🏙️',
    'House & Lot': '🏡',
    'Studio': '🏢',
    'Loft': '🏗️',
    'Villa': '🏖️',
    'Condo': '🏬'
  };
  return map[type] || '🏠';
}

function showToast(msg, isGold = true) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (isGold ? ' gold' : '');
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── Fallback Data (if fetch fails) ─────────────
function getFallbackData() {
  return {
    users: [
      { id:1, name:"Alexandra Rivera", email:"alex@demo.com", password:"demo123",
        avatar:"AR", role:"buyer", savedProperties:[2,5], bookings:[1,3] },
      { id:2, name:"Marcus Chen", email:"marcus@demo.com", password:"demo123",
        avatar:"MC", role:"buyer", savedProperties:[1,4], bookings:[2] }
    ],
    properties: [
      { id:1, title:"The Meridian Penthouse", address:"88 Skyline Drive, Makati City",
        price:28500000, type:"Penthouse", status:"For Sale", beds:4, baths:3, sqft:320,
        floor:42, description:"Perched atop one of Makati's most iconic towers, this penthouse redefines luxury living. Panoramic city views, a private rooftop terrace, and bespoke Italian finishes throughout.",
        features:["Rooftop Terrace","Smart Home","Private Elevator","2 Parking Slots","Concierge 24/7","Wine Cellar"],
        images:["#1a1a2e","#16213e"], agent:"Sofia Delacroix", agentPhone:"+63 917 100 2345",
        yearBuilt:2022, available:["2025-05-10","2025-05-12","2025-05-15","2025-05-17","2025-05-20"] },
      { id:2, title:"Casa Verde Estate", address:"14 Forest Lane, Antipolo, Rizal",
        price:18900000, type:"House & Lot", status:"For Sale", beds:5, baths:4, sqft:580,
        floor:2, description:"A sprawling private estate surrounded by lush tropical gardens. Cascading pools, covered lanais, and a private garden sanctuary.",
        features:["Infinity Pool","Garden","Guest House","3-Car Garage","Solar Panels","Home Theater"],
        images:["#1b4332","#2d6a4f"], agent:"Rafael Montoya", agentPhone:"+63 917 200 3456",
        yearBuilt:2020, available:["2025-05-11","2025-05-13","2025-05-16","2025-05-18","2025-05-21"] },
      { id:3, title:"The Harbor Studio", address:"33 Bayside Boulevard, BGC, Taguig",
        price:35000, type:"Studio", status:"For Rent", beds:1, baths:1, sqft:42,
        floor:18, description:"A sleek, fully-furnished studio in the heart of BGC. Minimalist design with premium appliances and a private balcony.",
        features:["Furnished","Gym Access","Pool","1 Parking Slot","Pet Friendly","High-Speed WiFi"],
        images:["#0d1b2a","#1b263b"], agent:"Jamie Santos", agentPhone:"+63 917 300 4567",
        yearBuilt:2023, available:["2025-05-09","2025-05-10","2025-05-14","2025-05-19","2025-05-22"] },
      { id:4, title:"Alabang Hills Residence", address:"7 Acacia Street, Alabang, Muntinlupa",
        price:12500000, type:"House & Lot", status:"For Sale", beds:4, baths:3, sqft:380,
        floor:2, description:"Nestled in a gated village in Alabang. Open-plan living, chef's kitchen, and a beautiful garden with lap pool.",
        features:["Lap Pool","Garden","2-Car Garage","CCTV","Backup Generator","Service Quarters"],
        images:["#3d0c02","#6b1c00"], agent:"Cynthia Lim", agentPhone:"+63 917 400 5678",
        yearBuilt:2019, available:["2025-05-12","2025-05-14","2025-05-16","2025-05-20","2025-05-23"] },
      { id:5, title:"The Observatory Loft", address:"55 Arts District, Poblacion, Makati",
        price:65000, type:"Loft", status:"For Rent", beds:2, baths:2, sqft:110,
        floor:8, description:"An industrial-chic loft in Makati's vibrant arts district. Exposed concrete, soaring ceilings, designer aesthetic.",
        features:["Double Height Ceilings","Exposed Concrete","Designer Furniture","Rooftop Bar Access","Co-working Space","Bike Parking"],
        images:["#2c2c54","#40407a"], agent:"Dom Reyes", agentPhone:"+63 917 500 6789",
        yearBuilt:2021, available:["2025-05-10","2025-05-13","2025-05-15","2025-05-17","2025-05-24"] },
      { id:6, title:"Beachfront Villa Siargao", address:"Km 12 Pacifico Road, General Luna, Siargao",
        price:45000000, type:"Villa", status:"For Sale", beds:6, baths:5, sqft:750,
        floor:1, description:"A rare beachfront villa on the shores of Siargao. Direct beach access, an overwater deck, 6 en-suite bedrooms, and sweeping Pacific Ocean views.",
        features:["Direct Beach Access","Overwater Deck","Surfboard Storage","Outdoor Kitchen","Staff Quarters","Generator"],
        images:["#006994","#0099cc"], agent:"Bianca Soriano", agentPhone:"+63 917 600 7890",
        yearBuilt:2018, available:["2025-05-11","2025-05-15","2025-05-18","2025-05-22","2025-05-25"] }
    ],
    bookings: [
      { id:1, userId:1, propertyId:3, date:"2025-05-14", time:"10:00 AM", type:"Viewing", status:"Confirmed", notes:"Please prepare the building access card." },
      { id:2, userId:2, propertyId:1, date:"2025-05-15", time:"2:00 PM", type:"Viewing", status:"Confirmed", notes:"" },
      { id:3, userId:1, propertyId:6, date:"2025-05-18", time:"11:00 AM", type:"Virtual Tour", status:"Pending", notes:"" }
    ]
  };
}

// ── Init ───────────────────────────────────────
boot();
