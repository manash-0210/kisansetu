// KisanSetu Main Application Script with Dynamic Account Profile Switching & Supabase Integration

let state = JSON.parse(JSON.stringify(INITIAL_DATA));
let currentLang = 'en';
let currentView = 'landing';
let currentAuthTab = 'login';
let currentUser = null;

// Default initial initials
state.farmer.initials = 'RK';

// Booking Wizard State
let bookingWizard = {
  step: 1,
  selectedCrop: 'paddy',
  quantity: 32,
  selectedCentre: 'C01',
  selectedDate: '2026-09-10',
  selectedSlot: '10:30 AM – 11:30 AM'
};

// Queue Live Simulation Interval
let queueInterval = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  initSupabase();
});

function initApp() {
  renderNavbar();
  renderView(currentView);
  startQueueSimulation();
  renderMobileNav();

  // Prompt portal role login modal on load if not logged in
  if (!currentUser) {
    setTimeout(() => {
      openAuthModal('login');
    }, 500);
  }
}

// Change View Function
function setView(viewName, params = {}) {
  const isLoggedIn = !!currentUser;
  const role = isLoggedIn ? (state.userRole || 'farmer') : 'guest';

  // Strict Role Access Control Checks
  if (viewName === 'book-slot' && (!isLoggedIn || role !== 'farmer')) {
    if (!isLoggedIn) {
      showToast('Please log in as a Farmer to book a procurement slot.', 'warning');
      openAuthModal('login');
    } else {
      showToast('Access Denied: Only Farmers can book procurement slots.', 'error');
    }
  }

  if (viewName === 'staff-dashboard' && (!isLoggedIn || role !== 'staff')) {
    if (!isLoggedIn) {
      showToast('Please log in as Procurement Staff to access officer workspace.', 'warning');
      openAuthModal('login');
    } else {
      showToast('Access Denied: Mandi Staff Workspace is restricted to Procurement Officers.', 'error');
    }
  }

  if (viewName === 'admin-dashboard' && (!isLoggedIn || role !== 'admin')) {
    if (!isLoggedIn) {
      showToast('Please log in as Govt Admin to access command center.', 'warning');
      openAuthModal('login');
    } else {
      showToast('Access Denied: Government Command Center is restricted to Admins.', 'error');
    }
  }

  currentView = viewName;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderNavbar();
  renderView(viewName, params);
  renderMobileNav();
}

// Change Language
function setLanguage(lang) {
  currentLang = lang;
  document.getElementById('lang-select-desktop').value = lang;
  document.getElementById('lang-select-mobile').value = lang;
  renderNavbar();
  renderView(currentView);
  renderMobileNav();
  showToast(`Language changed to ${lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'অসমীয়া'}`);
}

// Get Translation Helper
function t(key) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
  return dict[key] || TRANSLATIONS['en'][key] || key;
}

// Global Toast System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${
    type === 'error' ? 'bg-red-600' : type === 'warning' ? 'bg-amber-600' : 'bg-emerald-600'
  }`;
  
  toast.innerHTML = `
    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
        type === 'error' ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      }"></path>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Live Queue Simulation
function startQueueSimulation() {
  if (queueInterval) clearInterval(queueInterval);
  queueInterval = setInterval(() => {
    const queueTimeEl = document.getElementById('queue-last-updated');
    if (queueTimeEl) {
      const now = new Date();
      queueTimeEl.innerText = now.toLocaleTimeString();
    }
  }, 10000);
}

// -------------------------------------------------------------
// AUTH MODAL HANDLERS & PROFILE DYNAMIC UPDATER
// -------------------------------------------------------------
function openAuthModal(tab = 'login') {
  currentAuthTab = tab;
  switchAuthTab(tab);
  document.getElementById('auth-modal').classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

function switchAuthTab(tab) {
  currentAuthTab = tab;
  const loginTab = document.getElementById('tab-login');
  const signupTab = document.getElementById('tab-signup');
  const title = document.getElementById('auth-modal-title');
  const submitBtn = document.getElementById('auth-submit-btn');
  const extraFields = document.getElementById('signup-extra-fields');

  if (tab === 'login') {
    loginTab.className = "flex-1 py-2 rounded-lg bg-white shadow-sm text-emerald-700 font-bold";
    signupTab.className = "flex-1 py-2 rounded-lg text-slate-600 font-bold";
    title.innerText = "Sign In to KisanSetu";
    submitBtn.innerText = "Log In →";
    extraFields.classList.add('hidden');
  } else {
    signupTab.className = "flex-1 py-2 rounded-lg bg-white shadow-sm text-emerald-700 font-bold";
    loginTab.className = "flex-1 py-2 rounded-lg text-slate-600 font-bold";
    title.innerText = "Create New KisanSetu Account";
    submitBtn.innerText = "Create Account ✓";
    extraFields.classList.remove('hidden');
  }
}

function togglePasswordVisibility() {
  const pwdInput = document.getElementById('auth-password');
  const eyeIcon = document.getElementById('pwd-eye-icon');
  if (!pwdInput) return;

  const currentType = pwdInput.getAttribute('type');

  if (currentType === 'password') {
    pwdInput.setAttribute('type', 'text');
    pwdInput.type = 'text';
    if (eyeIcon) {
      eyeIcon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.959 8.959 0 013.682-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18"/>
      `;
    }
  } else {
    pwdInput.setAttribute('type', 'password');
    pwdInput.type = 'password';
    if (eyeIcon) {
      eyeIcon.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      `;
    }
  }
}

async function handleAuthSubmit() {
  const role = document.getElementById('auth-role').value;
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  if (currentAuthTab === 'login') {
    const res = await signInUser(email, password);
    currentUser = res.user || { email };
    currentUser.role = role;
    state.userRole = role;
    updateLoggedInProfile(currentUser, role);
    closeAuthModal();
    if (role === 'staff') setView('staff-dashboard');
    else if (role === 'admin') setView('admin-dashboard');
    else setView('dashboard');
  } else {
    const fullNameInput = document.getElementById('auth-fullname').value;
    const locationInput = document.getElementById('auth-location').value;
    const res = await signUpUser(email, password, role, { fullName: fullNameInput, village: locationInput, district: locationInput });
    currentUser = res.user || { email };
    currentUser.role = role;
    state.userRole = role;
    updateLoggedInProfile(currentUser, role, { fullName: fullNameInput, location: locationInput });
    closeAuthModal();
    if (role === 'staff') setView('staff-dashboard');
    else if (role === 'admin') setView('admin-dashboard');
    else setView('dashboard');
  }
}

// Update Active Farmer Profile Details Dynamically
function updateLoggedInProfile(user, role, extra = {}) {
  const targetRole = role || (user && user.role) || 'farmer';
  state.userRole = targetRole;
  if (user) user.role = targetRole;

  let name = extra.fullName;
  if (!name && user && user.email) {
    const prefix = user.email.split('@')[0].replace(/[0-9_.]/g, ' ');
    name = prefix.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  if (!name || name.trim().length < 2) {
    name = targetRole === 'staff' ? 'Biraj Kalita (Officer)' : targetRole === 'admin' ? 'Govt Administrator' : 'Manash Hazarika';
  }

  // Generate Unique ID for the User Account
  const hash = user && user.id ? user.id.slice(0, 5).toUpperCase() : Math.floor(10000 + Math.random() * 90000);
  const farmerId = targetRole === 'staff' ? `OFFICER-${hash}` : targetRole === 'admin' ? `ADMIN-${hash}` : `KS-F${hash}`;

  const loc = extra.location || "Jalukbari, Guwahati";
  const locParts = loc.split(',');
  const village = locParts[0]?.trim() || "Jalukbari";
  const district = locParts[1]?.trim() || "Kamrup";

  // Compute initials
  const nameTokens = name.trim().split(/\s+/);
  const initials = nameTokens.length >= 2 
    ? (nameTokens[0][0] + nameTokens[1][0]).toUpperCase() 
    : name.slice(0, 2).toUpperCase();

  state.farmer.name = name;
  state.farmer.id = farmerId;
  state.farmer.village = village;
  state.farmer.district = district;
  state.farmer.initials = initials;

  // Dynamically update multilingual strings for current session
  TRANSLATIONS.en.greeting = `Good Day, ${name} 👋`;
  TRANSLATIONS.hi.greeting = `नमस्ते, ${name} 👋`;
  TRANSLATIONS.as.greeting = `নমস্কাৰ, ${name} 👋`;
  
  TRANSLATIONS.en.farmerId = `ID: ${farmerId}`;
  TRANSLATIONS.hi.farmerId = `आईडी: ${farmerId}`;
  TRANSLATIONS.as.farmerId = `আইডি: ${farmerId}`;

  TRANSLATIONS.en.village = `Village: ${village}`;
  TRANSLATIONS.hi.village = `गांव: ${village}`;
  TRANSLATIONS.as.village = `গাঁও: ${village}`;

  TRANSLATIONS.en.district = `District: ${district}`;
  TRANSLATIONS.hi.district = `जिला: ${district}`;
  TRANSLATIONS.as.district = `জিলা: ${district}`;

  renderNavbar();
  renderView(currentView);
  showToast(`Logged in as ${name} (${role.toUpperCase()})`);
}

function handleSignOut() {
  currentUser = null;
  state.farmer = JSON.parse(JSON.stringify(INITIAL_DATA.farmer));
  state.farmer.initials = 'RK';
  
  TRANSLATIONS.en.greeting = "Good Morning, Ramesh 👋";
  TRANSLATIONS.hi.greeting = "शुभ प्रभात, रमेश 👋";
  TRANSLATIONS.as.greeting = "সুপ্ৰভাত, ৰমেশ 👋";

  renderNavbar();
  setView('landing');
  showToast("Logged out successfully.");
}

// -------------------------------------------------------------
// NAVBAR & TOP HEADER
// -------------------------------------------------------------
function handleBookSlotClick() {
  if (!currentUser) {
    showToast('Please log in as a Farmer to book a procurement slot.', 'warning');
    openAuthModal('login');
    return;
  }
  if (state.userRole !== 'farmer') {
    showToast('Access Denied: Only logged-in Farmers can book procurement slots.', 'error');
    return;
  }
  setView('book-slot');
}

// -------------------------------------------------------------
// NAVBAR & TOP HEADER
// -------------------------------------------------------------
function renderNavbar() {
  const headerEl = document.getElementById('app-header');
  if (!headerEl) return;

  const isLoggedIn = !!currentUser;
  const userRole = isLoggedIn ? (state.userRole || 'farmer') : 'guest';

  // Role-based Nav Tabs
  let navTabsHtml = `
    <button onclick="setView('landing')" class="px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${currentView === 'landing' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 hover:bg-slate-100'}">
      ${t('navLanding')}
    </button>
  `;

  // Hide Centre Staff & Govt Admin tabs from Farmers & Guests!
  if (userRole === 'guest' || userRole === 'farmer') {
    navTabsHtml += `
      <div class="relative group">
        <button onclick="setView('dashboard')" class="px-3 py-2 text-sm font-semibold rounded-lg flex items-center gap-1 transition-colors ${['dashboard','book-slot','confirmation','queue','procurement','payments','history','notifications'].includes(currentView) ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 hover:bg-slate-100'}">
          👨‍🌾 ${t('navFarmer')}
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        
        <!-- Dropdown Menu -->
        <div class="absolute left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 hidden group-hover:block z-50 animate-fadeIn">
          <a href="#" onclick="setView('dashboard')" class="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Dashboard Overview
          </a>
          <a href="#" onclick="handleBookSlotClick()" class="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2">
            📅 Book Procurement Slot
          </a>
          <a href="#" onclick="setView('queue')" class="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2">
            🔢 Live Queue (Token A107)
          </a>
          <a href="#" onclick="setView('procurement')" class="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2">
            📦 Procurement Status
          </a>
          <a href="#" onclick="setView('payments')" class="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2">
            💰 Payment & DBT Status
          </a>
          <a href="#" onclick="setView('history')" class="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2">
            📋 Past Records & Receipts
          </a>
          <a href="#" onclick="setView('notifications')" class="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between">
            <span>🔔 Notifications</span>
            <span class="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">2</span>
          </a>
        </div>
      </div>
    `;
  } else if (userRole === 'staff') {
    navTabsHtml += `
      <button onclick="setView('staff-dashboard')" class="px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${currentView === 'staff-dashboard' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 hover:bg-slate-100'}">
        🏬 Staff Workspace
      </button>
    `;
  } else if (userRole === 'admin') {
    navTabsHtml += `
      <button onclick="setView('admin-dashboard')" class="px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${currentView === 'admin-dashboard' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 hover:bg-slate-100'}">
        🏛️ Admin Command Center
      </button>
    `;
  }

  navTabsHtml += `
    <button onclick="setView('map')" class="px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${currentView === 'map' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 hover:bg-slate-100'}">
      🗺️ ${t('navMap')}
    </button>
  `;

  // Profile Badge HTML: ONLY show name and badge when logged in!
  let profileBadgeHtml = '';
  if (isLoggedIn) {
    profileBadgeHtml = `
      <div class="flex items-center gap-2 border-l border-slate-200 pl-3">
        <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs border border-emerald-300 shadow-sm">
          ${state.farmer.initials || 'RK'}
        </div>
        <div class="hidden lg:block text-left">
          <p class="text-xs font-bold text-slate-800 leading-tight">${state.farmer.name}</p>
          <p class="text-[10px] text-slate-500 font-medium">${state.farmer.id} (${userRole.toUpperCase()})</p>
        </div>
        <button onclick="handleSignOut()" class="text-xs font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded ml-1 transition-colors cursor-pointer">Log Out</button>
      </div>
    `;
  } else {
    profileBadgeHtml = `
      <div class="flex items-center gap-2 border-l border-slate-200 pl-3">
        <button onclick="openAuthModal('login')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5">
          <span>🔐 Log In / Sign Up</span>
        </button>
      </div>
    `;
  }

  // Right Action Button (Book Slot or Staff Workspace)
  let actionButtonHtml = '';
  if (userRole === 'staff') {
    actionButtonHtml = `
      <button onclick="setView('staff-dashboard')" class="hidden sm:inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer">
        <span>Mandi Workspace</span>
      </button>
    `;
  } else {
    actionButtonHtml = `
      <button onclick="handleBookSlotClick()" class="hidden sm:inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer">
        <span>Book Slot</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
      </button>
    `;
  }

  headerEl.innerHTML = `
    <!-- Top Official Govt Ticker & Portal Bar -->
    <div class="bg-slate-900 text-slate-300 text-xs py-1.5 px-4">
      <div class="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
        <div class="flex items-center space-x-3">
          <span class="flex items-center gap-1 font-semibold text-emerald-400">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/></svg>
            ${t('govtBanner')}
          </span>
          <span class="hidden sm:inline text-slate-600">|</span>
          <span class="hidden sm:inline text-slate-400">National MSP Procurement Portal</span>
        </div>
        <div class="flex items-center space-x-4 text-xs">
          <a href="tel:18001801551" class="hover:text-emerald-300 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            Toll-Free Helpline: 1800-180-1551
          </a>
          <span class="text-slate-600">|</span>
          <div class="flex items-center gap-1">
            <span class="text-slate-400">Lang:</span>
            <select id="lang-select-desktop" onchange="setLanguage(this.value)" class="bg-slate-800 text-white rounded text-xs px-1.5 py-0.5 border border-slate-700 focus:outline-none">
              <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
              <option value="hi" ${currentLang === 'hi' ? 'selected' : ''}>हिंदी</option>
              <option value="as" ${currentLang === 'as' ? 'selected' : ''}>অসমীয়া</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Navigation Bar -->
    <div class="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          
          <!-- Logo & Brand -->
          <div class="flex items-center space-x-3 cursor-pointer" onclick="setView('landing')">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-xl font-extrabold tracking-tight text-slate-900">Kisan<span class="text-emerald-600">Setu</span></span>
                <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">Govt Verified</span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium tracking-wide hidden sm:block">${t('tagline')}</p>
            </div>
          </div>

          <!-- Nav Tabs (Desktop) -->
          <nav class="hidden md:flex items-center space-x-1 lg:space-x-2">
            ${navTabsHtml}
          </nav>

          <!-- Right Action & Profile Badge -->
          <div class="flex items-center space-x-3">
            ${actionButtonHtml}
            ${profileBadgeHtml}
          </div>

        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// MOBILE BOTTOM NAVIGATION BAR
// -------------------------------------------------------------
function renderMobileNav() {
  const container = document.getElementById('mobile-bottom-nav');
  if (!container) return;

  container.innerHTML = `
    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-50 px-2 py-1.5">
      <div class="grid grid-cols-5 gap-1 text-center">
        
        <button onclick="setView('dashboard')" class="flex flex-col items-center py-1 rounded-lg ${currentView === 'dashboard' ? 'text-emerald-700 font-bold' : 'text-slate-500'}">
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span class="text-[10px]">Home</span>
        </button>

        <button onclick="handleBookSlotClick()" class="flex flex-col items-center py-1 rounded-lg ${currentView === 'book-slot' ? 'text-emerald-700 font-bold' : 'text-slate-500'}">
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <span class="text-[10px]">Book</span>
        </button>

        <button onclick="setView('queue')" class="flex flex-col items-center py-1 rounded-lg relative ${currentView === 'queue' ? 'text-emerald-700 font-bold' : 'text-slate-500'}">
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <span class="text-[10px]">Queue</span>
          <span class="absolute top-0 right-3 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        </button>

        <button onclick="setView('procurement')" class="flex flex-col items-center py-1 rounded-lg ${currentView === 'procurement' ? 'text-emerald-700 font-bold' : 'text-slate-500'}">
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          <span class="text-[10px]">Procure</span>
        </button>

        <button onclick="setView('payments')" class="flex flex-col items-center py-1 rounded-lg ${currentView === 'payments' ? 'text-emerald-700 font-bold' : 'text-slate-500'}">
          <svg class="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span class="text-[10px]">Payments</span>
        </button>

      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// VIEW ROUTER
// -------------------------------------------------------------
// -------------------------------------------------------------
// ACCESS BLOCKED SCREEN FOR UNAUTHENTICATED OR RESTRICTED ROLES
// -------------------------------------------------------------
function renderAccessBlockedScreen(reason) {
  let title = "Authentication Required";
  let message = "Please log in to your account to access this section.";
  let btnText = "🔐 Log In / Sign Up";
  let btnAction = "openAuthModal('login')";
  let icon = "🔒";

  if (reason === 'farmer-login-required') {
    title = "Farmer Authentication Required";
    message = "You must log in as a registered Farmer before you can book procurement slots or view farmer portal services.";
  } else if (reason === 'farmer-only') {
    icon = "⛔";
    title = "Farmer Access Only";
    message = "Procurement slot booking is strictly reserved for registered Farmer accounts.";
    btnText = "Return to Home Page";
    btnAction = "setView('landing')";
  } else if (reason === 'staff-login-required') {
    title = "Procurement Staff Login Required";
    message = "Access to the Mandi Staff Workspace and token caller portal requires official officer credentials.";
  } else if (reason === 'staff-only') {
    icon = "⛔";
    title = "Mandi Staff Only";
    message = "Calling queue tokens and operating weighbridge records is strictly restricted to Procurement Officers.";
    btnText = "Return to My Portal";
    btnAction = "setView('dashboard')";
  } else if (reason === 'admin-login-required') {
    title = "Government Admin Login Required";
    message = "Access to the State-wide Procurement Command Center requires administrator credentials.";
  } else if (reason === 'admin-only') {
    icon = "⛔";
    title = "Administrator Only";
    message = "This section is restricted to Government Admin accounts.";
    btnText = "Return to Home Page";
    btnAction = "setView('landing')";
  }

  return `
    <div class="max-w-lg mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl shadow-2xl text-center space-y-5">
      <div class="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold shadow-inner">
        ${icon}
      </div>
      <div class="space-y-1">
        <h2 class="text-xl font-extrabold text-slate-900">${title}</h2>
        <p class="text-xs text-slate-600 leading-relaxed">${message}</p>
      </div>
      <button onclick="${btnAction}" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 text-sm cursor-pointer">
        ${btnText}
      </button>
    </div>
  `;
}

// -------------------------------------------------------------
// VIEW ROUTER WITH HARD ACCESS GATES
// -------------------------------------------------------------
function renderView(viewName, params = {}) {
  const main = document.getElementById('app-content');
  if (!main) return;

  const isLoggedIn = !!currentUser;
  const userRole = isLoggedIn ? (state.userRole || 'farmer') : 'guest';

  switch (viewName) {
    case 'landing':
      main.innerHTML = renderLandingPage();
      break;
    case 'dashboard':
      if (!isLoggedIn) {
        main.innerHTML = renderAccessBlockedScreen('farmer-login-required');
      } else {
        main.innerHTML = renderFarmerDashboard();
      }
      break;
    case 'book-slot':
      if (!isLoggedIn || userRole !== 'farmer') {
        main.innerHTML = renderAccessBlockedScreen(!isLoggedIn ? 'farmer-login-required' : 'farmer-only');
      } else {
        main.innerHTML = renderSlotBookingWizard();
      }
      break;
    case 'confirmation':
      if (!isLoggedIn) {
        main.innerHTML = renderAccessBlockedScreen('farmer-login-required');
      } else {
        main.innerHTML = renderBookingConfirmation(params);
      }
      break;
    case 'queue':
      main.innerHTML = renderLiveQueuePage();
      break;
    case 'procurement':
      main.innerHTML = renderProcurementTrackingPage();
      break;
    case 'payments':
      main.innerHTML = renderPaymentPage();
      break;
    case 'history':
      if (!isLoggedIn) {
        main.innerHTML = renderAccessBlockedScreen('farmer-login-required');
      } else {
        main.innerHTML = renderProcurementHistoryPage();
      }
      break;
    case 'notifications':
      main.innerHTML = renderNotificationsPage();
      break;
    case 'staff-dashboard':
      if (!isLoggedIn || userRole !== 'staff') {
        main.innerHTML = renderAccessBlockedScreen(!isLoggedIn ? 'staff-login-required' : 'staff-only');
      } else {
        main.innerHTML = renderStaffDashboard();
      }
      break;
    case 'admin-dashboard':
      if (!isLoggedIn || userRole !== 'admin') {
        main.innerHTML = renderAccessBlockedScreen(!isLoggedIn ? 'admin-login-required' : 'admin-only');
      } else {
        main.innerHTML = renderAdminDashboard();
        initAdminCharts();
      }
      break;
    case 'map':
      main.innerHTML = renderProcurementMapPage();
      break;
    default:
      main.innerHTML = renderLandingPage();
  }
}

// -------------------------------------------------------------
// 1. LANDING PAGE
// -------------------------------------------------------------
function renderLandingPage() {
  return `
    <div class="bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 pb-16">
      
      <!-- HERO SECTION -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div class="lg:col-span-7 space-y-6 text-left">
            <div class="inline-flex items-center gap-2 bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
              <span class="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Official MSP Procurement System
            </div>
            
            <h1 class="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              ${t('heroHeadline')}
            </h1>
            
            <p class="text-lg text-slate-600 font-normal leading-relaxed">
              ${t('heroSubheadline')}
            </p>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button onclick="setView('book-slot')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 text-base">
                <span>${t('btnBookSlot')}</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>

              <button onclick="setView('queue')" class="bg-white hover:bg-slate-50 text-slate-800 font-bold px-6 py-3.5 rounded-xl border border-slate-300 shadow-sm flex items-center justify-center gap-2 text-base transition-colors">
                <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                <span>${t('btnTrackProcurement')}</span>
              </button>
            </div>

            <!-- Trust statement -->
            <div class="pt-4 flex items-center gap-3 text-xs text-slate-500 font-medium">
              <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">✓</div>
              <span>${t('trustStatement')}</span>
            </div>

          </div>

          <!-- Hero Visual Mockup -->
          <div class="lg:col-span-5 relative">
            <div class="relative mx-auto max-w-sm bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl border-4 border-slate-800">
              <div class="bg-white rounded-[2rem] overflow-hidden p-5 space-y-4">
                
                <!-- Phone Header -->
                <div class="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div class="flex items-center gap-1.5">
                    <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span class="text-xs font-bold text-slate-800">KisanSetu Live</span>
                  </div>
                  <span class="text-[10px] bg-slate-100 font-semibold px-2 py-0.5 rounded text-slate-600">Token: A107</span>
                </div>

                <!-- Token Display Card -->
                <div class="bg-emerald-900 text-white rounded-xl p-4 text-center relative overflow-hidden">
                  <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-800 rounded-full opacity-50"></div>
                  <p class="text-xs text-emerald-200 font-semibold uppercase tracking-wider">Your Digital Token</p>
                  <h2 class="text-4xl font-extrabold tracking-widest text-emerald-300 my-1">A107</h2>
                  <p class="text-xs text-emerald-100">XYZ Procurement Centre</p>
                  <div class="mt-3 pt-3 border-t border-emerald-800/80 flex justify-between text-xs text-emerald-200">
                    <span>Est. Wait: <strong>24 min</strong></span>
                    <span>Ahead: <strong>5 Farmers</strong></span>
                  </div>
                </div>

                <!-- Live Status list preview -->
                <div class="space-y-2 text-xs">
                  <div class="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                    <span class="font-bold text-slate-700">A102 (Counter 1)</span>
                    <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Serving Now</span>
                  </div>
                  <div class="flex justify-between items-center p-2 rounded bg-emerald-50 border border-emerald-200 font-bold text-emerald-900">
                    <span>A107 (YOU)</span>
                    <span class="text-emerald-700 text-[10px]">Your Turn Soon</span>
                  </div>
                </div>

                <!-- Quick info pill -->
                <div class="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-[11px] text-amber-800 flex items-center gap-2">
                  <span>💡 Bring produce to Mandi Gate #2 by 10:15 AM</span>
                </div>

              </div>
            </div>
            
            <!-- Background glow -->
            <div class="absolute -top-10 -left-10 w-48 h-48 bg-emerald-300/30 rounded-full blur-3xl -z-10"></div>
          </div>

        </div>
      </section>

      <!-- 4 KEY BENEFITS -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="text-center max-w-3xl mx-auto mb-12">
          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900">${t('benefitsTitle')}</h2>
          <p class="text-slate-600 text-sm mt-2">Designed specifically for Indian farmers to eliminate uncertainty and waiting time.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
              📅
            </div>
            <h3 class="text-lg font-bold text-slate-900">${t('benefit1Title')}</h3>
            <p class="text-sm text-slate-600 leading-relaxed">${t('benefit1Desc')}</p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
              🔢
            </div>
            <h3 class="text-lg font-bold text-slate-900">${t('benefit2Title')}</h3>
            <p class="text-sm text-slate-600 leading-relaxed">${t('benefit2Desc')}</p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
              ⚖️
            </div>
            <h3 class="text-lg font-bold text-slate-900">${t('benefit3Title')}</h3>
            <p class="text-sm text-slate-600 leading-relaxed">${t('benefit3Desc')}</p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
              💳
            </div>
            <h3 class="text-lg font-bold text-slate-900">${t('benefit4Title')}</h3>
            <p class="text-sm text-slate-600 leading-relaxed">${t('benefit4Desc')}</p>
          </div>

        </div>
      </section>

      <!-- HOW IT WORKS SECTION (6 STEPS) -->
      <section class="bg-slate-900 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-12">
            <span class="text-emerald-400 text-xs font-bold uppercase tracking-widest">Simple Process</span>
            <h2 class="text-3xl font-extrabold mt-1">${t('howItWorksTitle')}</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div class="bg-slate-800/80 p-6 rounded-xl border border-slate-700 relative">
              <span class="absolute top-4 right-4 text-emerald-400 font-extrabold text-lg">01</span>
              <h4 class="text-lg font-bold text-emerald-300 mb-2">${t('step1Title')}</h4>
              <p class="text-sm text-slate-300 leading-relaxed">${t('step1Desc')}</p>
            </div>

            <div class="bg-slate-800/80 p-6 rounded-xl border border-slate-700 relative">
              <span class="absolute top-4 right-4 text-emerald-400 font-extrabold text-lg">02</span>
              <h4 class="text-lg font-bold text-emerald-300 mb-2">${t('step2Title')}</h4>
              <p class="text-sm text-slate-300 leading-relaxed">${t('step2Desc')}</p>
            </div>

            <div class="bg-slate-800/80 p-6 rounded-xl border border-slate-700 relative">
              <span class="absolute top-4 right-4 text-emerald-400 font-extrabold text-lg">03</span>
              <h4 class="text-lg font-bold text-emerald-300 mb-2">${t('step3Title')}</h4>
              <p class="text-sm text-slate-300 leading-relaxed">${t('step3Desc')}</p>
            </div>

            <div class="bg-slate-800/80 p-6 rounded-xl border border-slate-700 relative">
              <span class="absolute top-4 right-4 text-emerald-400 font-extrabold text-lg">04</span>
              <h4 class="text-lg font-bold text-emerald-300 mb-2">${t('step4Title')}</h4>
              <p class="text-sm text-slate-300 leading-relaxed">${t('step4Desc')}</p>
            </div>

            <div class="bg-slate-800/80 p-6 rounded-xl border border-slate-700 relative">
              <span class="absolute top-4 right-4 text-emerald-400 font-extrabold text-lg">05</span>
              <h4 class="text-lg font-bold text-emerald-300 mb-2">${t('step5Title')}</h4>
              <p class="text-sm text-slate-300 leading-relaxed">${t('step5Desc')}</p>
            </div>

            <div class="bg-slate-800/80 p-6 rounded-xl border border-slate-700 relative">
              <span class="absolute top-4 right-4 text-emerald-400 font-extrabold text-lg">06</span>
              <h4 class="text-lg font-bold text-emerald-300 mb-2">${t('step6Title')}</h4>
              <p class="text-sm text-slate-300 leading-relaxed">${t('step6Desc')}</p>
            </div>

          </div>
        </div>
      </section>

      <!-- STATISTICS SECTION -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="bg-emerald-900 text-white rounded-3xl p-8 lg:p-12 shadow-xl relative overflow-hidden">
          <div class="relative z-10 text-center space-y-8">
            <h2 class="text-2xl sm:text-3xl font-extrabold">Built for Farmers. Designed for Efficiency.</h2>
            
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
              <div class="p-4 bg-emerald-800/50 rounded-2xl border border-emerald-700">
                <p class="text-3xl sm:text-4xl font-extrabold text-emerald-300">${t('stat1')}</p>
                <p class="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">${t('stat1Label')}</p>
              </div>
              
              <div class="p-4 bg-emerald-800/50 rounded-2xl border border-emerald-700">
                <p class="text-3xl sm:text-4xl font-extrabold text-emerald-300">${t('stat2')}</p>
                <p class="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">${t('stat2Label')}</p>
              </div>

              <div class="p-4 bg-emerald-800/50 rounded-2xl border border-emerald-700">
                <p class="text-3xl sm:text-4xl font-extrabold text-emerald-300">${t('stat3')}</p>
                <p class="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">${t('stat3Label')}</p>
              </div>

              <div class="p-4 bg-emerald-800/50 rounded-2xl border border-emerald-700">
                <p class="text-3xl sm:text-4xl font-extrabold text-emerald-300">${t('stat4')}</p>
                <p class="text-xs sm:text-sm text-emerald-100 mt-1 font-medium">${t('stat4Label')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FINAL CTA -->
      <section class="max-w-4xl mx-auto text-center px-4 py-8">
        <h2 class="text-2xl font-extrabold text-slate-900 mb-3">${t('readyCTA')}</h2>
        <button onclick="setView('book-slot')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-600/30 text-lg transition-transform active:scale-95">
          ${t('btnBookNow')}
        </button>
      </section>

      <!-- FOOTER -->
      <footer class="bg-white border-t border-slate-200 mt-16 pt-12 pb-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div class="space-y-3">
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">KS</div>
                <span class="text-lg font-bold text-slate-900">KisanSetu</span>
              </div>
              <p class="text-xs text-slate-500 leading-relaxed">${t('trustStatement')}</p>
            </div>

            <div>
              <h5 class="text-xs font-bold uppercase text-slate-900 tracking-wider mb-3">Quick Navigation</h5>
              <ul class="space-y-2 text-xs text-slate-600">
                <li><a href="#" onclick="setView('dashboard')" class="hover:text-emerald-700">Farmer Dashboard</a></li>
                <li><a href="#" onclick="setView('book-slot')" class="hover:text-emerald-700">Book Procurement Slot</a></li>
                <li><a href="#" onclick="setView('queue')" class="hover:text-emerald-700">Live Queue Monitor</a></li>
                <li><a href="#" onclick="setView('map')" class="hover:text-emerald-700">Mandi Location Map</a></li>
              </ul>
            </div>

            <div>
              <h5 class="text-xs font-bold uppercase text-slate-900 tracking-wider mb-3">Help & Support</h5>
              <ul class="space-y-2 text-xs text-slate-600">
                <li>Toll Free: 1800-180-1551</li>
                <li>Email: support@kisansetu.gov.in</li>
                <li>MSP Guidelines 2026-27</li>
                <li>FAQ & Video Guides</li>
              </ul>
            </div>

            <div>
              <h5 class="text-xs font-bold uppercase text-slate-900 tracking-wider mb-3">Government Links</h5>
              <ul class="space-y-2 text-xs text-slate-600">
                <li>Ministry of Agriculture</li>
                <li>PM-KISAN Portal</li>
                <li>e-NAM National Agriculture Market</li>
                <li>PFMS Direct Benefit Transfer</li>
              </ul>
            </div>
          </div>

          <div class="border-t border-slate-100 mt-8 pt-6 text-center text-xs text-slate-400">
            © 2026 KisanSetu Platform. Designed for National Agricultural Innovation. (Supabase Connected)
          </div>
        </div>
      </footer>

    </div>
  `;
}

// -------------------------------------------------------------
// 2. FARMER DASHBOARD
// -------------------------------------------------------------
function renderFarmerDashboard() {
  const bkg = state.activeBooking;
  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      <!-- Greeting & Profile Banner -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="space-y-1">
          <h1 class="text-2xl font-extrabold text-slate-900">${t('greeting')}</h1>
          <div class="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium pt-1">
            <span class="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md font-bold border border-emerald-200">${t('farmerId')}</span>
            <span>📍 ${t('village')}, ${t('district')}</span>
            <span>🌾 Land: ${state.farmer.landArea}</span>
            <span>💳 SBI A/C ****8912</span>
          </div>
        </div>

        <button onclick="setView('book-slot')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all">
          <span>+ ${t('actBook')}</span>
        </button>
      </div>

      <!-- MAIN UPCOMING BOOKING CARD -->
      <div class="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div class="relative z-10 space-y-6">
          
          <div class="flex justify-between items-center pb-4 border-b border-emerald-700/60">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-300">${t('upcomingProcurement')}</span>
            </div>
            <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold px-3 py-1 rounded-full">
              Token: ${bkg.token}
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p class="text-xs text-emerald-200">${t('cropLabel')}</p>
              <p class="text-lg font-bold text-white mt-0.5">${bkg.crop}</p>
            </div>
            <div>
              <p class="text-xs text-emerald-200">${t('quantityLabel')}</p>
              <p class="text-lg font-bold text-white mt-0.5">${bkg.quantityQuintals} Quintals</p>
            </div>
            <div>
              <p class="text-xs text-emerald-200">${t('centreLabel')}</p>
              <p class="text-lg font-bold text-white mt-0.5 line-clamp-1">${bkg.centreName}</p>
            </div>
            <div>
              <p class="text-xs text-emerald-200">${t('dateLabel')} & ${t('timeLabel')}</p>
              <p class="text-lg font-bold text-white mt-0.5">${bkg.date} (${bkg.timeSlot.split('–')[0]})</p>
            </div>
          </div>

          <!-- Queue Status Pill inside Card -->
          <div class="bg-emerald-950/70 border border-emerald-600/40 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
            <div class="flex items-center gap-3 text-left">
              <div class="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-lg">
                👥
              </div>
              <div>
                <p class="text-sm font-bold text-white">${bkg.queuePosition} farmers ahead of you</p>
                <p class="text-xs text-emerald-300">Estimated waiting time: <strong>${bkg.estimatedWaitMin} minutes</strong></p>
              </div>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
              <button onclick="setView('queue')" class="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-lg transition-colors">
                ${t('btnViewQueue')} →
              </button>
            </div>
          </div>

          <!-- Card Action Buttons -->
          <div class="flex flex-wrap items-center gap-3 pt-2">
            <button onclick="openBookingModal()" class="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-lg border border-white/20">
              📋 ${t('btnViewBooking')}
            </button>
            <button onclick="openRescheduleModal()" class="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-lg border border-white/20">
              📅 ${t('btnReschedule')}
            </button>
            <button onclick="openCancelModal()" class="bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold px-4 py-2 rounded-lg border border-red-400/30">
              ❌ ${t('btnCancel')}
            </button>
          </div>

        </div>
      </div>

      <!-- QUICK ACTION CARDS -->
      <div class="space-y-4">
        <h3 class="text-lg font-bold text-slate-900">${t('quickActions')}</h3>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <button onclick="setView('book-slot')" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all text-left group">
            <div class="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold mb-3 group-hover:scale-110 transition-transform">
              ➕
            </div>
            <p class="text-sm font-bold text-slate-900 group-hover:text-emerald-700">${t('actBook')}</p>
            <p class="text-xs text-slate-500 mt-0.5">Select mandi, date & time</p>
          </button>

          <button onclick="setView('map')" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all text-left group">
            <div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold mb-3 group-hover:scale-110 transition-transform">
              📍
            </div>
            <p class="text-sm font-bold text-slate-900 group-hover:text-blue-700">${t('actFind')}</p>
            <p class="text-xs text-slate-500 mt-0.5">Check distance & live wait</p>
          </button>

          <button onclick="setView('procurement')" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all text-left group">
            <div class="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold mb-3 group-hover:scale-110 transition-transform">
              📦
            </div>
            <p class="text-sm font-bold text-slate-900 group-hover:text-purple-700">${t('actTrackProc')}</p>
            <p class="text-xs text-slate-500 mt-0.5">Weighing & quality grade</p>
          </button>

          <button onclick="setView('payments')" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all text-left group">
            <div class="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold mb-3 group-hover:scale-110 transition-transform">
              💰
            </div>
            <p class="text-sm font-bold text-slate-900 group-hover:text-amber-700">${t('actTrackPay')}</p>
            <p class="text-xs text-slate-500 mt-0.5">DBT credit to SBI account</p>
          </button>

        </div>
      </div>

      <!-- RECENT NOTIFICATIONS PANEL SNIPPET -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-bold text-slate-900">Recent Alerts & Updates</h3>
          <button onclick="setView('notifications')" class="text-xs font-bold text-emerald-700 hover:underline">View All Notifications →</button>
        </div>

        <div class="divide-y divide-slate-100">
          ${state.notifications.slice(0, 4).map(n => `
            <div class="py-3 flex items-start gap-3">
              <div class="w-2.5 h-2.5 rounded-full mt-1.5 ${n.read ? 'bg-slate-300' : 'bg-emerald-500'}"></div>
              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <p class="text-xs font-bold text-slate-800">${n.title}</p>
                  <span class="text-[10px] text-slate-400">${n.time}</span>
                </div>
                <p class="text-xs text-slate-600 mt-0.5">${n.message}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// 3. SLOT BOOKING WIZARD PAGE
// -------------------------------------------------------------
function renderSlotBookingWizard() {
  const step = bookingWizard.step;

  return `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      <!-- Wizard Progress Header -->
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-extrabold text-slate-900">Book Procurement Time Slot</h1>
        <p class="text-xs text-slate-500">Select crop, choose low-queue mandi, pick convenient time, and get instant digital token.</p>
      </div>

      <!-- Step Indicator Bar -->
      <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <div class="grid grid-cols-5 gap-2 text-center text-xs font-bold">
          <div class="py-2 rounded-lg ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}">
            1. Crop & Qty
          </div>
          <div class="py-2 rounded-lg ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}">
            2. Mandi
          </div>
          <div class="py-2 rounded-lg ${step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}">
            3. Date
          </div>
          <div class="py-2 rounded-lg ${step >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}">
            4. Time Slot
          </div>
          <div class="py-2 rounded-lg ${step >= 5 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}">
            5. Confirm
          </div>
        </div>
      </div>

      <!-- STEP CONTENT CONTAINER -->
      <div class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        
        ${step === 1 ? renderBookingStep1() : ''}
        ${step === 2 ? renderBookingStep2() : ''}
        ${step === 3 ? renderBookingStep3() : ''}
        ${step === 4 ? renderBookingStep4() : ''}
        ${step === 5 ? renderBookingStep5() : ''}

        <!-- Wizard Navigation Controls -->
        <div class="flex justify-between items-center pt-6 border-t border-slate-100">
          ${step > 1 ? `
            <button onclick="setBookingStep(${step - 1})" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition-colors">
              ← Back
            </button>
          ` : '<div></div>'}

          ${step < 5 ? `
            <button onclick="setBookingStep(${step + 1})" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-colors">
              Next Step →
            </button>
          ` : `
            <button onclick="confirmNewBooking()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-8 py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition-transform active:scale-95">
              Confirm Booking & Generate Token ✓
            </button>
          `}
        </div>

      </div>

    </div>
  `;
}

function setBookingStep(s) {
  bookingWizard.step = s;
  renderView('book-slot');
}

// STEP 1: Select Crop & Quantity
function renderBookingStep1() {
  return `
    <div class="space-y-6">
      <h2 class="text-lg font-bold text-slate-900">Step 1: Select Crop & Declare Estimated Quantity</h2>
      
      <!-- Crop Options Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        ${state.crops.map(c => `
          <div onclick="selectCrop('${c.id}')" class="p-4 rounded-xl border-2 cursor-pointer transition-all ${
            bookingWizard.selectedCrop === c.id 
              ? 'border-emerald-600 bg-emerald-50/80 shadow-sm' 
              : 'border-slate-200 hover:border-emerald-300 bg-white'
          }">
            <div class="flex items-center gap-3">
              <span class="text-3xl">${c.icon}</span>
              <div>
                <p class="font-bold text-slate-900 text-sm">${c.name}</p>
                <p class="text-xs text-emerald-700 font-semibold mt-0.5">MSP: ₹${c.msp.toLocaleString('en-IN')} / ${c.unit}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Quantity Input -->
      <div class="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
        <label class="block text-xs font-bold text-slate-800 uppercase tracking-wider">Estimated Quantity to Sell</label>
        <div class="flex items-center gap-3 max-w-xs">
          <input type="number" id="input-qty" value="${bookingWizard.quantity}" min="1" max="500" 
            onchange="bookingWizard.quantity = parseFloat(this.value) || 1" 
            class="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600" />
          <span class="text-sm font-bold text-slate-600">Quintals</span>
        </div>
        <p class="text-xs text-slate-500">Estimated MSP Value: <strong class="text-emerald-700">₹${(bookingWizard.quantity * 2300).toLocaleString('en-IN')}</strong></p>
      </div>
    </div>
  `;
}

function selectCrop(cropId) {
  bookingWizard.selectedCrop = cropId;
  renderView('book-slot');
}

// STEP 2: Select Procurement Centre & Smart Recommendation
function renderBookingStep2() {
  return `
    <div class="space-y-6">
      <h2 class="text-lg font-bold text-slate-900">Step 2: Select Procurement Centre</h2>

      <!-- SMART RECOMMENDATION BANNER -->
      <div class="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-5 rounded-xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div class="space-y-1">
          <span class="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase">Smart Recommendation</span>
          <h3 class="font-bold text-base text-white">XYZ Procurement Centre is Recommended</h3>
          <p class="text-xs text-emerald-200">Based on lowest waiting time (28m), close proximity (4.2 km), and high slot availability.</p>
        </div>
        <button onclick="bookingWizard.selectedCentre='C01'; setBookingStep(3);" class="bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
          Choose Recommended Centre →
        </button>
      </div>

      <!-- Mandi Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${state.centres.map(c => `
          <div onclick="bookingWizard.selectedCentre='${c.id}'" class="p-5 rounded-xl border-2 cursor-pointer transition-all relative ${
            bookingWizard.selectedCentre === c.id 
              ? 'border-emerald-600 bg-emerald-50/50 shadow-md' 
              : 'border-slate-200 hover:border-emerald-300 bg-white'
          }">
            ${c.recommended ? '<span class="absolute top-3 right-3 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-300">Recommended</span>' : ''}
            
            <h4 class="font-bold text-slate-900 text-sm pr-16">${c.name}</h4>
            <p class="text-xs text-slate-500 mt-0.5">📍 ${c.address} (${c.distanceKm} km)</p>
            
            <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span class="text-slate-400">Current Queue:</span>
                <p class="font-bold text-slate-800">${c.queueCount} Farmers</p>
              </div>
              <div>
                <span class="text-slate-400">Est. Waiting:</span>
                <p class="font-bold ${c.estimatedWaitMin > 60 ? 'text-amber-600' : 'text-emerald-700'}">${c.estimatedWaitMin} mins</p>
              </div>
            </div>

            <div class="mt-3 flex justify-between items-center text-[11px]">
              <span class="text-slate-500">Active Counters: <strong>${c.activeCounters}</strong></span>
              <span class="font-bold px-2 py-0.5 rounded ${c.statusBadge === 'High' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}">${c.status}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// STEP 3: Select Date
function renderBookingStep3() {
  const dates = [
    { dateStr: '2026-09-10', display: 'Thu, 10 Sep 2026', label: 'Tomorrow', status: 'Optimal Capacity' },
    { dateStr: '2026-09-11', display: 'Fri, 11 Sep 2026', label: 'Available', status: 'Good Capacity' },
    { dateStr: '2026-09-12', display: 'Sat, 12 Sep 2026', label: 'Weekend', status: 'High Demand' },
    { dateStr: '2026-09-14', display: 'Mon, 14 Sep 2026', label: 'Next Week', status: 'Optimal Capacity' }
  ];

  return `
    <div class="space-y-6">
      <h2 class="text-lg font-bold text-slate-900">Step 3: Select Procurement Date</h2>
      <p class="text-xs text-slate-500">Pick an available date for bringing your produce to the procurement centre.</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${dates.map(d => `
          <div onclick="bookingWizard.selectedDate='${d.dateStr}'; renderView('book-slot');" class="p-5 rounded-xl border-2 cursor-pointer transition-all ${
            bookingWizard.selectedDate === d.dateStr 
              ? 'border-emerald-600 bg-emerald-50 shadow-sm' 
              : 'border-slate-200 hover:border-emerald-300 bg-white'
          }">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">${d.label}</span>
              <span class="text-[11px] text-slate-500 font-medium">${d.status}</span>
            </div>
            <h3 class="text-base font-extrabold text-slate-900 mt-2">${d.display}</h3>
            <p class="text-xs text-slate-500 mt-1">Operating Hours: 08:30 AM – 05:00 PM</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// STEP 4: Select Slot
function renderBookingStep4() {
  const slots = [
    { time: '09:00 AM – 10:00 AM', status: 'FULL', slotsLeft: 0, available: false },
    { time: '10:00 AM – 11:00 AM', status: 'AVAILABLE', slotsLeft: 6, available: true, recommended: true },
    { time: '11:00 AM – 12:00 PM', status: 'AVAILABLE', slotsLeft: 12, available: true },
    { time: '12:00 PM – 01:00 PM', status: 'AVAILABLE', slotsLeft: 8, available: true },
    { time: '02:00 PM – 03:00 PM', status: 'AVAILABLE', slotsLeft: 15, available: true }
  ];

  return `
    <div class="space-y-6">
      <h2 class="text-lg font-bold text-slate-900">Step 4: Select Arrival Time Slot</h2>
      <p class="text-xs text-slate-500">Slots are capped to prevent overcrowding and ensure zero waiting lag.</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${slots.map(s => `
          <div ${s.available ? `onclick="bookingWizard.selectedSlot='${s.time}'; renderView('book-slot');"` : ''} class="p-4 rounded-xl border-2 transition-all ${
            !s.available ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed' :
            bookingWizard.selectedSlot === s.time ? 'border-emerald-600 bg-emerald-50 shadow-sm cursor-pointer' : 'border-slate-200 bg-white hover:border-emerald-300 cursor-pointer'
          }">
            <div class="flex justify-between items-center">
              <span class="font-bold text-slate-900 text-sm">${s.time}</span>
              ${s.recommended ? '<span class="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">Fastest</span>' : ''}
            </div>
            <div class="mt-2 flex justify-between items-center text-xs">
              <span class="${s.available ? 'text-emerald-700 font-bold' : 'text-slate-500 font-bold'}">${s.available ? `${s.slotsLeft} slots available` : 'FULL'}</span>
              <span class="text-slate-400">${s.available ? 'Select Slot →' : 'No Slots'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// STEP 5: Booking Confirmation Summary
function renderBookingStep5() {
  const selectedCropObj = state.crops.find(c => c.id === bookingWizard.selectedCrop) || state.crops[0];
  const selectedCentreObj = state.centres.find(c => c.id === bookingWizard.selectedCentre) || state.centres[0];

  return `
    <div class="space-y-6">
      <h2 class="text-lg font-bold text-slate-900">Step 5: Review & Confirm Booking</h2>

      <div class="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-slate-400">Selected Crop:</span>
            <p class="font-extrabold text-slate-900 text-base mt-0.5">${selectedCropObj.name}</p>
          </div>
          <div>
            <span class="text-slate-400">Declared Quantity:</span>
            <p class="font-extrabold text-slate-900 text-base mt-0.5">${bookingWizard.quantity} Quintals</p>
          </div>
          <div>
            <span class="text-slate-400">Procurement Centre:</span>
            <p class="font-bold text-slate-900 mt-0.5">${selectedCentreObj.name}</p>
          </div>
          <div>
            <span class="text-slate-400">Date & Slot:</span>
            <p class="font-bold text-slate-900 mt-0.5">10 Sep 2026 (${bookingWizard.selectedSlot})</p>
          </div>
        </div>

        <div class="border-t border-slate-200 pt-4 flex justify-between items-center text-xs">
          <span class="text-slate-600 font-medium">Estimated Government MSP Payout:</span>
          <span class="text-lg font-extrabold text-emerald-700">₹${(bookingWizard.quantity * selectedCropObj.msp).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
        <span>⚠️</span>
        <span>Please ensure your produce moisture content is under 14% to avoid processing delays at the mandi quality counter.</span>
      </div>
    </div>
  `;
}

async function confirmNewBooking() {
  const selectedCropObj = state.crops.find(c => c.id === bookingWizard.selectedCrop) || state.crops[0];
  const selectedCentreObj = state.centres.find(c => c.id === bookingWizard.selectedCentre) || state.centres[0];

  const bookingId = "BKG-2026-" + Math.floor(1000 + Math.random() * 9000);
  const tokenNum = "A107";

  state.activeBooking = {
    id: bookingId,
    token: tokenNum,
    crop: selectedCropObj.name,
    cropId: selectedCropObj.id,
    quantityQuintals: bookingWizard.quantity,
    centreId: selectedCentreObj.id,
    centreName: selectedCentreObj.name,
    date: "10 September 2026",
    timeSlot: bookingWizard.selectedSlot,
    arrivalWindow: "10:15 AM – 10:45 AM",
    status: "Confirmed",
    queuePosition: 5,
    estimatedWaitMin: 24,
    createdDate: "09 Sep 2026"
  };

  // Sync token A107 in live queue with exact details given by the farmer
  const queueA107 = state.liveQueueList.find(q => q.token === 'A107');
  if (queueA107) {
    queueA107.farmerName = state.farmer.name;
    queueA107.farmerId = state.farmer.id;
    queueA107.village = state.farmer.village;
    queueA107.district = state.farmer.district;
    queueA107.crop = selectedCropObj.name;
    queueA107.quantityQuintals = bookingWizard.quantity;
    queueA107.date = "10 September 2026";
    queueA107.timeSlot = bookingWizard.selectedSlot;
    queueA107.centreName = selectedCentreObj.name;
  }

  // Sync to Supabase Database
  await dbCreateBooking(state.activeBooking);

  showToast(`Procurement slot booked successfully for ${state.farmer.name}! Token A107 generated.`);
  setView('confirmation');
}

// -------------------------------------------------------------
// 4. BOOKING CONFIRMATION SCREEN
// -------------------------------------------------------------
function renderBookingConfirmation() {
  const bkg = state.activeBooking;
  return `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-20">
      
      <!-- Success Badge Banner -->
      <div class="bg-emerald-600 text-white rounded-3xl p-8 shadow-xl text-center space-y-4 relative overflow-hidden">
        <div class="w-16 h-16 rounded-full bg-white/20 text-white mx-auto flex items-center justify-center text-3xl font-bold animate-bounce">
          ✓
        </div>
        <h1 class="text-3xl font-extrabold">Booking Confirmed!</h1>
        <p class="text-emerald-100 text-sm">Your digital token has been registered in the mandi procurement queue.</p>
        
        <!-- TOKEN BADGE -->
        <div class="bg-white text-slate-900 rounded-2xl p-6 max-w-xs mx-auto shadow-md space-y-1">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Digital Token</p>
          <h2 class="text-5xl font-black text-emerald-700 tracking-wider my-1">${bkg.token}</h2>
          <p class="text-xs text-slate-500 font-semibold">Center: ${bkg.centreName.split('(')[0]}</p>
        </div>
      </div>

      <!-- SUMMARY & QR CODE CARD -->
      <div class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        <div class="space-y-3 text-xs">
          <h3 class="text-base font-extrabold text-slate-900 pb-2 border-b border-slate-100">Booking Summary</h3>
          <div>
            <span class="text-slate-400">Crop & Quantity:</span>
            <p class="font-bold text-slate-800 text-sm">${bkg.crop} (${bkg.quantityQuintals} Quintals)</p>
          </div>
          <div>
            <span class="text-slate-400">Procurement Centre:</span>
            <p class="font-bold text-slate-800">${bkg.centreName}</p>
          </div>
          <div>
            <span class="text-slate-400">Scheduled Date:</span>
            <p class="font-bold text-slate-800">${bkg.date}</p>
          </div>
          <div>
            <span class="text-slate-400">Estimated Arrival Window:</span>
            <p class="font-bold text-emerald-700 text-sm">${bkg.arrivalWindow}</p>
          </div>
        </div>

        <!-- Dynamic QR Code Container -->
        <div class="text-center space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div class="w-40 h-40 bg-white border border-slate-300 mx-auto p-2 rounded-lg flex items-center justify-center shadow-inner">
            <svg class="w-36 h-36" viewBox="0 0 100 100" fill="currentColor">
              <rect x="10" y="10" width="25" height="25" fill="#047857"/>
              <rect x="65" y="10" width="25" height="25" fill="#047857"/>
              <rect x="10" y="65" width="25" height="25" fill="#047857"/>
              <rect x="15" y="15" width="15" height="15" fill="#fff"/>
              <rect x="70" y="15" width="15" height="15" fill="#fff"/>
              <rect x="15" y="70" width="15" height="15" fill="#fff"/>
              <rect x="40" y="20" width="15" height="15" fill="#047857"/>
              <rect x="40" y="45" width="20" height="20" fill="#047857"/>
              <rect x="20" y="45" width="15" height="10" fill="#047857"/>
              <rect x="65" y="45" width="25" height="25" fill="#047857"/>
              <rect x="45" y="70" width="15" height="20" fill="#047857"/>
              <text x="50" y="58" font-size="6" font-weight="bold" fill="#fff" text-anchor="middle">KS-A107</text>
            </svg>
          </div>
          <p class="text-[11px] text-slate-500 font-semibold">Scan QR at Mandi Gate Scanner</p>
        </div>

      </div>

      <!-- BUTTONS -->
      <div class="flex flex-wrap justify-center gap-4">
        <button onclick="setView('queue')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition-transform active:scale-95">
          View Live Queue Status →
        </button>
        <button onclick="showToast('Booking added to your mobile calendar!')" class="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-5 py-3 rounded-xl border border-slate-300">
          📅 Add to Calendar
        </button>
        <button onclick="openBookingModal()" class="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-5 py-3 rounded-xl border border-slate-300">
          📥 Download Receipt
        </button>
        <button onclick="setView('dashboard')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl">
          Go to Dashboard
        </button>
      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// 5. LIVE QUEUE PAGE
// -------------------------------------------------------------
function renderLiveQueuePage() {
  const bkg = state.activeBooking;
  const queueList = state.liveQueueList;
  const currentlyServingToken = queueList.find(q => q.status === 'Serving')?.token || 'A104';

  return `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      <!-- Live Queue Header Bar -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <h1 class="text-2xl font-extrabold text-slate-900">Live Queue Monitor</h1>
          </div>
          <p class="text-xs text-slate-500 mt-1">📍 ${bkg.centreName} (Live Auto-Sync)</p>
        </div>

        <div class="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 font-medium flex items-center gap-2">
          <span>Last Updated: <strong id="queue-last-updated" class="text-slate-800">${new Date().toLocaleTimeString()}</strong></span>
          <button onclick="renderView('queue'); showToast('Queue refreshed');" class="text-emerald-700 font-bold hover:underline">↻ Refresh</button>
        </div>
      </div>

      <!-- HIGHLIGHT METRICS GRID -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p class="text-xs text-slate-400 font-bold uppercase">Currently Serving</p>
          <p class="text-3xl font-black text-emerald-600 mt-1">${currentlyServingToken}</p>
          <span class="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Counter 1</span>
        </div>

        <div class="bg-emerald-900 text-white p-5 rounded-2xl shadow-md text-center">
          <p class="text-xs text-emerald-200 font-bold uppercase">Your Token</p>
          <p class="text-3xl font-black text-emerald-300 mt-1">${bkg.token}</p>
          <span class="inline-block mt-1 text-[10px] bg-emerald-800 text-emerald-100 font-bold px-2 py-0.5 rounded">${state.farmer.name}</span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p class="text-xs text-slate-400 font-bold uppercase">Farmers Ahead</p>
          <p class="text-3xl font-black text-slate-900 mt-1">${bkg.queuePosition}</p>
          <span class="inline-block mt-1 text-[10px] text-slate-500 font-medium">Position #6 in line</span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p class="text-xs text-slate-400 font-bold uppercase">Est. Waiting Time</p>
          <p class="text-3xl font-black text-amber-600 mt-1">${bkg.estimatedWaitMin} m</p>
          <span class="inline-block mt-1 text-[10px] text-slate-500 font-medium">Avg ~7.4 min/farmer</span>
        </div>

      </div>

      <!-- VERTICAL QUEUE VISUALIZATION -->
      <div class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 class="text-lg font-bold text-slate-900 flex justify-between items-center">
          <span>Live Queue Order</span>
          <span class="text-xs font-normal text-slate-500">Active Counters: 3 | Gate #2</span>
        </h3>

        <div class="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-1 before:bg-slate-200">
          
          ${queueList.map((q) => {
            const isUser = q.isUser;
            const isServing = q.status === 'Serving';
            const isDone = q.status === 'Completed';
            const displayName = isUser ? `${state.farmer.name} (YOU)` : q.farmerName;

            return `
              <div class="relative flex items-center justify-between p-4 rounded-xl transition-all ${
                isUser ? 'bg-emerald-900 text-white shadow-lg ring-2 ring-emerald-500 scale-[1.02]' :
                isServing ? 'bg-emerald-50 border-2 border-emerald-500 text-slate-900' :
                isDone ? 'bg-slate-50 border border-slate-200 opacity-60' :
                'bg-white border border-slate-200 text-slate-900'
              }">
                <!-- Node Icon -->
                <span class="absolute -left-6 sm:-left-8 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isUser ? 'bg-emerald-500 text-white ring-4 ring-emerald-200' :
                  isServing ? 'bg-emerald-600 text-white animate-pulse' :
                  isDone ? 'bg-slate-400 text-white' :
                  'bg-slate-200 text-slate-600'
                }">
                  ${isDone ? '✓' : isServing ? '▶' : '•'}
                </span>

                <div class="flex items-center gap-4">
                  <span class="text-xl font-black ${isUser ? 'text-emerald-300' : 'text-slate-900'}">${q.token}</span>
                  <div>
                    <p class="font-bold text-sm ${isUser ? 'text-white' : 'text-slate-800'}">${displayName}</p>
                    <p class="text-xs ${isUser ? 'text-emerald-200' : 'text-slate-500'}">${q.counter !== '-' ? `Counter: ${q.counter}` : 'Waiting Line'}</p>
                  </div>
                </div>

                <div class="text-right">
                  <span class="text-xs font-bold px-2.5 py-1 rounded-full ${
                    isUser ? 'bg-emerald-400 text-slate-950 font-black' :
                    isServing ? 'bg-emerald-600 text-white' :
                    isDone ? 'bg-slate-200 text-slate-700' :
                    'bg-slate-100 text-slate-600'
                  }">
                    ${isServing ? 'Serving Now 🟢' : isDone ? 'Completed' : isUser ? 'YOU (5 ahead)' : q.estWait}
                  </span>
                </div>
              </div>
            `;
          }).join('')}

        </div>
      </div>

      <!-- CENTRE METRICS CARD -->
      <div class="bg-slate-900 text-white rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <span class="text-slate-400">Centre Address:</span>
          <p class="font-bold text-white mt-0.5">NH-37, Near APMC Market, Sonapur, Kamrup</p>
        </div>
        <div>
          <span class="text-slate-400">Processing Speed:</span>
          <p class="font-bold text-emerald-400 mt-0.5">7.4 min average per farmer</p>
        </div>
        <div>
          <span class="text-slate-400">Centre Operational Status:</span>
          <p class="font-bold text-white mt-0.5">🟢 Open & Fully Operational (3 Counters)</p>
        </div>
      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// 6. PROCUREMENT TRACKING PAGE
// -------------------------------------------------------------
function renderProcurementTrackingPage() {
  const p = state.procurementProgress;

  return `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">Procurement Progress Tracker</h1>
          <p class="text-xs text-slate-500 mt-0.5">Procurement ID: <strong>${p.procurementId}</strong> | Token: <strong>${p.token}</strong></p>
        </div>
        <button onclick="openBookingModal()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm">
          📥 Download Receipt
        </button>
      </div>

      <!-- TIMELINE STAGES -->
      <div class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Procurement Stages Timeline</h3>

        <div class="space-y-4">
          ${p.steps.map((st) => `
            <div class="flex items-start gap-4 p-3.5 rounded-xl border ${
              st.done ? 'bg-emerald-50/50 border-emerald-200' :
              st.active ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/40' :
              'bg-white border-slate-100 text-slate-400'
            }">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                st.done ? 'bg-emerald-600 text-white' :
                st.active ? 'bg-amber-500 text-white animate-pulse' :
                'bg-slate-200 text-slate-500'
              }">
                ${st.done ? '✓' : st.id + 1}
              </div>

              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <h4 class="font-bold text-sm ${st.done ? 'text-emerald-900' : st.active ? 'text-amber-900' : 'text-slate-500'}">${st.title}</h4>
                  <span class="text-xs font-semibold ${st.done ? 'text-emerald-700' : st.active ? 'text-amber-700' : 'text-slate-400'}">${st.time}</span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  ${st.id === 3 ? `Weighed on Digital Weighbridge: ${p.actualQty} Quintals` :
                    st.id === 4 ? `Grade A Quality Verification (Moisture: ${p.moistureContent})` :
                    st.done ? 'Completed and verified by officer' : 'Pending step'}
                </p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- PRODUCE SUMMARY CARD -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 class="text-base font-bold text-slate-900">Verified Produce Breakdown</h3>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div class="p-3 bg-slate-50 rounded-lg">
            <span class="text-slate-400">Crop Type:</span>
            <p class="font-bold text-slate-800 text-sm mt-0.5">Paddy (Grade A)</p>
          </div>

          <div class="p-3 bg-slate-50 rounded-lg">
            <span class="text-slate-400">Declared vs Actual:</span>
            <p class="font-bold text-slate-800 text-sm mt-0.5">32 Q → <strong class="text-emerald-700">${p.actualQty} Q</strong></p>
          </div>

          <div class="p-3 bg-slate-50 rounded-lg">
            <span class="text-slate-400">Government MSP Rate:</span>
            <p class="font-bold text-slate-800 text-sm mt-0.5">₹${p.mspRate.toLocaleString('en-IN')} / Q</p>
          </div>

          <div class="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <span class="text-emerald-800 font-medium">Total Payout Amount:</span>
            <p class="font-black text-emerald-700 text-lg mt-0.5">₹${p.netAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// 7. PAYMENT PAGE
// -------------------------------------------------------------
function renderPaymentPage() {
  const pay = state.paymentDetails;

  return `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      <div class="space-y-1">
        <h1 class="text-2xl font-extrabold text-slate-900">Payment & Direct Benefit Transfer (DBT)</h1>
        <p class="text-xs text-slate-500">Track real-time payout credit directly into your linked bank account.</p>
      </div>

      <!-- MAIN PAYMENT AMOUNT CARD -->
      <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div class="flex justify-between items-center border-b border-slate-700 pb-4">
          <div>
            <p class="text-xs text-slate-400 font-bold uppercase">Total Procurement Amount</p>
            <h2 class="text-4xl sm:text-5xl font-black text-emerald-400 my-1">₹${pay.amount.toLocaleString('en-IN')}</h2>
          </div>
          <span class="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Status: ${pay.status}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span class="text-slate-400">Procurement ID:</span>
            <p class="font-bold text-white mt-0.5">${pay.procurementId}</p>
          </div>
          <div>
            <span class="text-slate-400">DBT Transaction Ref:</span>
            <p class="font-bold text-emerald-300 mt-0.5">${pay.txnId}</p>
          </div>
          <div>
            <span class="text-slate-400">Linked Bank Account:</span>
            <p class="font-bold text-white mt-0.5">${pay.bankName} (${pay.accountNo})</p>
          </div>
        </div>
      </div>

      <!-- PAYMENT TIMELINE -->
      <div class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <h3 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">DBT Payout Process Timeline</h3>

        <div class="space-y-4">
          ${pay.timeline.map(t => `
            <div class="flex items-center gap-4 p-3 rounded-xl ${t.done ? 'bg-emerald-50 border border-emerald-200' : t.active ? 'bg-amber-50 border border-amber-300 ring-2 ring-amber-400/40' : 'bg-slate-50 border border-slate-100 text-slate-400'}">
              <div class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${t.done ? 'bg-emerald-600 text-white' : t.active ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}">
                ${t.done ? '✓' : '•'}
              </div>
              <div class="flex-1 flex justify-between items-center">
                <span class="text-xs font-bold ${t.done ? 'text-emerald-900' : t.active ? 'text-amber-900' : 'text-slate-500'}">${t.title}</span>
                <span class="text-xs text-slate-500">${t.time}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-center gap-2">
          <span>ℹ️</span>
          <span>Payment status is updated automatically by the PFMS / Government DBT Mandate Gateway.</span>
        </div>
      </div>

      <!-- PREVIOUS PAYMENT HISTORY -->
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 class="text-base font-bold text-slate-900">Completed Payout History</h3>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th class="p-3">Date</th>
                <th class="p-3">Crop</th>
                <th class="p-3">Centre</th>
                <th class="p-3">Quantity</th>
                <th class="p-3">Amount</th>
                <th class="p-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
              ${state.history.slice(1).map(h => `
                <tr>
                  <td class="p-3">${h.date}</td>
                  <td class="p-3 font-bold text-slate-900">${h.crop}</td>
                  <td class="p-3">${h.centre}</td>
                  <td class="p-3">${h.qty}</td>
                  <td class="p-3 font-bold text-emerald-700">₹${h.amount.toLocaleString('en-IN')}</td>
                  <td class="p-3"><span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Paid ✓</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

// -------------------------------------------------------------
// 8. PROCUREMENT HISTORY PAGE
// -------------------------------------------------------------
function renderProcurementHistoryPage() {
  return `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20">
      
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">Procurement History & Records</h1>
          <p class="text-xs text-slate-500">Access all historical mandi sales records, receipts, and payment logs.</p>
        </div>
      </div>

      <!-- FILTERS & SEARCH BAR -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div class="flex-1 relative">
          <input type="text" id="history-search" placeholder="Search by crop, token, or centre..." onkeyup="filterHistoryTable()"
            class="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-600"/>
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>

        <select id="history-crop-filter" onchange="filterHistoryTable()" class="bg-slate-50 border border-slate-300 rounded-lg text-xs px-3 py-2 font-semibold">
          <option value="ALL">All Crops</option>
          <option value="Paddy">Paddy</option>
          <option value="Wheat">Wheat</option>
          <option value="Maize">Maize</option>
          <option value="Mustard">Mustard</option>
        </select>

        <select id="history-status-filter" onchange="filterHistoryTable()" class="bg-slate-50 border border-slate-300 rounded-lg text-xs px-3 py-2 font-semibold">
          <option value="ALL">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Processing">Processing</option>
        </select>
      </div>

      <!-- TABLE / CARDS CONTAINER -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs" id="history-table">
            <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th class="p-4">Receipt No</th>
                <th class="p-4">Date</th>
                <th class="p-4">Crop</th>
                <th class="p-4">Procurement Centre</th>
                <th class="p-4">Quantity</th>
                <th class="p-4">Total Amount</th>
                <th class="p-4">Status</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-700" id="history-tbody">
              ${renderHistoryRows(state.history)}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

function renderHistoryRows(list) {
  return list.map(h => `
    <tr class="hover:bg-slate-50">
      <td class="p-4 font-bold text-emerald-700">${h.receiptNo}</td>
      <td class="p-4 text-slate-600">${h.date}</td>
      <td class="p-4 font-bold text-slate-900">${h.crop}</td>
      <td class="p-4">${h.centre}</td>
      <td class="p-4 font-semibold">${h.qty}</td>
      <td class="p-4 font-extrabold text-slate-900">₹${h.amount.toLocaleString('en-IN')}</td>
      <td class="p-4">
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${h.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${h.status}
        </span>
      </td>
      <td class="p-4 text-right">
        <button onclick="openBookingModal()" class="text-xs font-bold text-emerald-700 hover:underline">View Receipt</button>
      </td>
    </tr>
  `).join('');
}

function filterHistoryTable() {
  const query = document.getElementById('history-search').value.toLowerCase();
  const crop = document.getElementById('history-crop-filter').value;
  const status = document.getElementById('history-status-filter').value;

  const filtered = state.history.filter(h => {
    const matchQuery = h.crop.toLowerCase().includes(query) || h.centre.toLowerCase().includes(query) || h.receiptNo.toLowerCase().includes(query);
    const matchCrop = crop === 'ALL' || h.crop.includes(crop);
    const matchStatus = status === 'ALL' || h.status === status;
    return matchQuery && matchCrop && matchStatus;
  });

  document.getElementById('history-tbody').innerHTML = renderHistoryRows(filtered);
}

// -------------------------------------------------------------
// 9. NOTIFICATIONS PAGE
// -------------------------------------------------------------
function renderNotificationsPage() {
  return `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20">
      
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">Notifications & Alerts</h1>
          <p class="text-xs text-slate-500">Real-time alerts regarding slot booking, live queue, and payment credits.</p>
        </div>
        <button onclick="markAllNotificationsRead()" class="text-xs font-bold text-emerald-700 hover:underline">
          Mark All as Read
        </button>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div class="divide-y divide-slate-100" id="notifications-list">
          ${state.notifications.map(n => `
            <div class="py-4 flex items-start gap-4 ${n.read ? 'opacity-70' : ''}">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                n.category === 'booking' ? 'bg-blue-100 text-blue-700' :
                n.category === 'queue' ? 'bg-amber-100 text-amber-700' :
                n.category === 'procurement' ? 'bg-purple-100 text-purple-700' :
                'bg-emerald-100 text-emerald-700'
              }">
                ${n.category === 'booking' ? '📅' : n.category === 'queue' ? '🔢' : n.category === 'procurement' ? '📦' : '💰'}
              </div>

              <div class="flex-1">
                <div class="flex justify-between items-center">
                  <h4 class="font-bold text-sm text-slate-900">${n.title}</h4>
                  <span class="text-[10px] text-slate-400">${n.time}</span>
                </div>
                <p class="text-xs text-slate-600 mt-1">${n.message}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}

function markAllNotificationsRead() {
  state.notifications.forEach(n => n.read = true);
  renderView('notifications');
  showToast("All notifications marked as read.");
}

// -------------------------------------------------------------
// 10. PROCUREMENT CENTRE STAFF DASHBOARD
// -------------------------------------------------------------
// -------------------------------------------------------------
// 10. PROCUREMENT CENTRE STAFF DASHBOARD
// -------------------------------------------------------------
function renderStaffDashboard() {
  let servingItem = state.liveQueueList.find(q => q.status === 'Serving');
  if (!servingItem) {
    servingItem = state.liveQueueList.find(q => q.token === 'A107') || state.liveQueueList[0];
    servingItem.status = 'Serving';
  }

  // Hydrate serving item with active farmer profile details if it's token A107 / user
  if (servingItem.token === 'A107' || servingItem.isUser) {
    servingItem.farmerName = state.farmer.name;
    servingItem.farmerId = state.farmer.id;
    servingItem.village = state.farmer.village;
    servingItem.district = state.farmer.district;
    servingItem.crop = state.activeBooking.crop || 'Paddy (Dhan - Grade A)';
    servingItem.quantityQuintals = state.activeBooking.quantityQuintals || 32;
    servingItem.date = state.activeBooking.date || '10 September 2026';
    servingItem.timeSlot = state.activeBooking.timeSlot || '10:30 AM – 11:30 AM';
    servingItem.centreName = state.activeBooking.centreName || 'XYZ Procurement Centre (Kamrup Hub)';
  } else {
    servingItem.crop = servingItem.crop || 'Paddy (Dhan - Grade A)';
    servingItem.quantityQuintals = servingItem.quantityQuintals || 25;
    servingItem.village = servingItem.village || 'Sonapur';
    servingItem.district = servingItem.district || 'Kamrup';
    servingItem.farmerId = servingItem.farmerId || ('KS-F' + Math.floor(10000 + Math.random() * 90000));
    servingItem.date = servingItem.date || '10 September 2026';
    servingItem.timeSlot = servingItem.timeSlot || '10:30 AM – 11:30 AM';
    servingItem.centreName = servingItem.centreName || 'XYZ Procurement Centre (Kamrup Hub)';
  }

  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      <!-- Staff Header Bar -->
      <div class="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span class="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase">Procurement Officer Workspace</span>
          <h1 class="text-2xl font-extrabold mt-1">${servingItem.centreName}</h1>
          <p class="text-xs text-slate-300">Officer In-Charge: <strong>Biraj Kalita</strong> | Gate #2 Active</p>
        </div>

        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
          <span class="text-xs font-bold text-emerald-300">Queue Active (3 Counters)</span>
        </div>
      </div>

      <!-- STAFF QUICK METRICS -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs text-slate-400 font-bold uppercase">Currently Waiting</p>
          <p class="text-3xl font-black text-slate-900 mt-1">17 Farmers</p>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs text-slate-400 font-bold uppercase">Today's Appointments</p>
          <p class="text-3xl font-black text-blue-600 mt-1">120</p>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs text-slate-400 font-bold uppercase">Completed Today</p>
          <p class="text-3xl font-black text-emerald-600 mt-1">82</p>
        </div>
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p class="text-xs text-slate-400 font-bold uppercase">Avg Processing Time</p>
          <p class="text-3xl font-black text-amber-600 mt-1">7.4 min</p>
        </div>
      </div>

      <!-- MAIN QUEUE & CALL NEXT FARMER CONTROL -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Left Column: Serving & Call Next -->
        <div class="lg:col-span-5 space-y-6">
          
          <div class="bg-emerald-900 text-white p-8 rounded-2xl shadow-xl text-center space-y-4">
            <p class="text-xs text-emerald-300 font-bold uppercase tracking-widest">${t('currentlyServing')}</p>
            <h2 class="text-6xl font-black text-emerald-300 tracking-wider" id="staff-serving-token">${servingItem.token}</h2>
            <p class="text-sm font-bold text-white">Farmer: ${servingItem.farmerName} (${servingItem.crop} - ${servingItem.quantityQuintals} Q)</p>
            
            <button onclick="callNextFarmer()" class="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-base py-4 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer">
              📢 ${t('btnCallNext')}
            </button>
          </div>

          <!-- Upcoming Queue List -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 class="font-bold text-sm text-slate-900">Live Mandi Tokens in Line</h3>
            <div class="space-y-2 text-xs">
              ${state.liveQueueList.map(q => {
                const isCurrent = q.token === servingItem.token;
                const displayName = q.token === 'A107' || q.isUser ? state.farmer.name : q.farmerName;
                return `
                  <div class="p-2.5 rounded-lg font-bold flex justify-between items-center ${
                    isCurrent 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : q.token === 'A107' || q.isUser
                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-900' 
                        : 'bg-slate-50 text-slate-700'
                  }">
                    <span>${q.token} - ${displayName}</span>
                    <span class="text-[11px] ${isCurrent ? 'bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded' : 'text-slate-500'}">
                      ${isCurrent ? '● SERVING' : q.status === 'Completed' ? 'Done ✓' : 'In Line'}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

        </div>

        <!-- Right Column: Active Farmer Processing Panel -->
        <div class="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 class="text-lg font-extrabold text-slate-900">Active Farmer Processing Panel</h3>
              <p class="text-xs text-slate-500">Live inspection & weighbridge entry</p>
            </div>
            <span class="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1.5 rounded-lg border border-emerald-300">
              Token ${servingItem.token} (${servingItem.farmerName})
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span class="text-slate-400 font-medium">Farmer Name:</span>
              <p class="font-bold text-slate-900 text-sm">${servingItem.farmerName}</p>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Farmer ID:</span>
              <p class="font-bold text-slate-900 text-sm">${servingItem.farmerId || state.farmer.id}</p>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Village / District:</span>
              <p class="font-bold text-slate-900">${servingItem.village || state.farmer.village}, ${servingItem.district || state.farmer.district}</p>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Aadhaar Status:</span>
              <p class="font-bold text-emerald-700">PM-KISAN Verified ✓</p>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Crop Selected:</span>
              <p class="font-bold text-slate-900">${servingItem.crop}</p>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Declared Quantity:</span>
              <p class="font-bold text-emerald-700 text-sm">${servingItem.quantityQuintals} Quintals</p>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Scheduled Date & Slot:</span>
              <p class="font-bold text-slate-900">${servingItem.date} (${servingItem.timeSlot})</p>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Mandi Hub:</span>
              <p class="font-bold text-slate-900">${servingItem.centreName}</p>
            </div>
          </div>

          <!-- Staff Action Buttons Timeline simulation -->
          <div class="space-y-3 pt-2">
            <p class="text-xs font-bold text-slate-800 uppercase tracking-wider">Execute Operations for ${servingItem.farmerName}:</p>
            
            <button onclick="staffAction('verify')" class="w-full p-3 rounded-xl border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 text-left flex justify-between items-center transition-colors">
              <span class="text-xs font-bold text-slate-900">1. Verify Identity & Land Registry (${servingItem.farmerName})</span>
              <span class="text-xs font-bold text-emerald-700">Completed ✓</span>
            </button>

            <button onclick="staffAction('weigh')" class="w-full p-3 rounded-xl border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 text-left flex justify-between items-center transition-colors">
              <span class="text-xs font-bold text-slate-900">2. Record Weighbridge Mass (${servingItem.quantityQuintals} Quintals)</span>
              <span class="text-xs font-bold text-emerald-700">Recorded ✓</span>
            </button>

            <button onclick="staffAction('quality')" class="w-full p-3 rounded-xl border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 text-left flex justify-between items-center transition-colors">
              <span class="text-xs font-bold text-slate-900">3. Quality Check (${servingItem.crop} - Grade A, 13.2% Moisture)</span>
              <span class="text-xs font-bold text-emerald-700">Verified ✓</span>
            </button>

            <button onclick="staffAction('complete')" class="w-full p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md flex justify-between items-center transition-transform active:scale-98">
              <span>4. Complete Procurement & Generate DBT Order for ${servingItem.farmerName}</span>
              <span>Submit Order →</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  `;
}

async function callNextFarmer() {
  const currentServingIndex = state.liveQueueList.findIndex(q => q.status === 'Serving');
  if (currentServingIndex !== -1 && currentServingIndex < state.liveQueueList.length - 1) {
    const prevServingToken = state.liveQueueList[currentServingIndex].token;
    state.liveQueueList[currentServingIndex].status = 'Completed';
    
    const nextItem = state.liveQueueList[currentServingIndex + 1];
    nextItem.status = 'Serving';
    
    const nextToken = nextItem.token;
    const nextFarmerName = (nextToken === 'A107' || nextItem.isUser) ? state.farmer.name : nextItem.farmerName;

    // Update active booking queue position if farmer's token is A107
    if (state.activeBooking.queuePosition > 0) {
      state.activeBooking.queuePosition -= 1;
      state.activeBooking.estimatedWaitMin = Math.max(0, state.activeBooking.estimatedWaitMin - 7);
    }

    // Sync status change to Supabase database
    await dbUpdateTokenStatus(prevServingToken, 'Completed');
    await dbUpdateTokenStatus(nextToken, 'Serving');

    showToast(`📢 Token ${nextToken} (${nextFarmerName}) called to Counter 1!`);
  } else {
    // Loop back to A107
    state.liveQueueList.forEach(q => q.status = 'Waiting');
    const targetToken = state.liveQueueList.find(q => q.token === 'A107') || state.liveQueueList[0];
    targetToken.status = 'Serving';
    showToast(`📢 Token A107 (${state.farmer.name}) called to Counter 1!`);
  }
  renderView('staff-dashboard');
}

async function staffAction(act) {
  const servingItem = state.liveQueueList.find(q => q.status === 'Serving') || state.liveQueueList[0];
  const farmerName = (servingItem.token === 'A107' || servingItem.isUser) ? state.farmer.name : servingItem.farmerName;

  if (act === 'complete') {
    state.procurementProgress.currentStep = 5;
    state.procurementProgress.steps[4].done = true;
    state.procurementProgress.steps[5].done = true;
    state.procurementProgress.steps[5].time = "Just now";
    
    await dbUpdateTokenStatus(servingItem.token, 'Completed');
    showToast(`Procurement completed for Token ${servingItem.token} (${farmerName})! DBT payment order created & synced to Supabase.`);
  } else {
    showToast(`Staff operation '${act}' recorded for ${farmerName}.`);
  }
}

// -------------------------------------------------------------
// 11. GOVERNMENT ADMIN DASHBOARD
// -------------------------------------------------------------
function renderAdminDashboard() {
  const s = state.adminStats;

  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      <!-- Admin Banner -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">${t('adminTitle')}</h1>
          <p class="text-xs text-slate-500 mt-0.5">Real-time state-wide agricultural procurement overview & mandi metrics.</p>
        </div>
        
        <div class="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
          State: <strong>Assam (Kamrup & Nagaon)</strong> | KMS 2026-27
        </div>
      </div>

      <!-- ADMIN STATS CARDS GRID -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p class="text-xs text-slate-400 font-bold uppercase">${t('regFarmers')}</p>
          <p class="text-3xl font-black text-slate-900 mt-1">${s.registeredFarmers.toLocaleString()}</p>
          <p class="text-[10px] text-emerald-600 font-bold mt-1">↑ +412 this week</p>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p class="text-xs text-slate-400 font-bold uppercase">${t('activeCentres')}</p>
          <p class="text-3xl font-black text-emerald-700 mt-1">${s.activeCentres}</p>
          <p class="text-[10px] text-slate-500 mt-1">100% Operational</p>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p class="text-xs text-slate-400 font-bold uppercase">${t('todayBookings')}</p>
          <p class="text-3xl font-black text-blue-600 mt-1">${s.todayBookings.toLocaleString()}</p>
          <p class="text-[10px] text-blue-600 font-bold mt-1">842 Completed</p>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p class="text-xs text-slate-400 font-bold uppercase">${t('avgWaitTime')}</p>
          <p class="text-3xl font-black text-amber-600 mt-1">${s.avgWaitMin} min</p>
          <p class="text-[10px] text-emerald-600 font-bold mt-1">↓ 68% wait reduction</p>
        </div>
      </div>

      <!-- CHARTS SECTION -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 class="font-bold text-slate-900 text-sm">Daily Procurement Volume Trend (Quintals)</h3>
          <div class="h-56 relative flex items-end justify-between gap-2 pt-8 px-4 border-b border-slate-200" id="chart-volume">
            <!-- Simulated CSS Bar Chart -->
            <div class="flex-1 bg-emerald-200 hover:bg-emerald-500 rounded-t h-[40%] relative group">
              <span class="absolute -top-6 left-0 right-0 text-[10px] text-center font-bold">1.2k</span>
            </div>
            <div class="flex-1 bg-emerald-300 hover:bg-emerald-500 rounded-t h-[55%] relative group">
              <span class="absolute -top-6 left-0 right-0 text-[10px] text-center font-bold">1.8k</span>
            </div>
            <div class="flex-1 bg-emerald-400 hover:bg-emerald-500 rounded-t h-[70%] relative group">
              <span class="absolute -top-6 left-0 right-0 text-[10px] text-center font-bold">2.4k</span>
            </div>
            <div class="flex-1 bg-emerald-500 hover:bg-emerald-600 rounded-t h-[85%] relative group">
              <span class="absolute -top-6 left-0 right-0 text-[10px] text-center font-bold">3.1k</span>
            </div>
            <div class="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-t h-[95%] relative group">
              <span class="absolute -top-6 left-0 right-0 text-[10px] text-center font-bold">3.8k</span>
            </div>
          </div>
          <div class="flex justify-between text-[10px] text-slate-400 font-bold px-2">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Today</span>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 class="font-bold text-slate-900 text-sm">Waiting Time Comparison by Centre</h3>
          <div class="space-y-3 text-xs">
            <div>
              <div class="flex justify-between font-bold mb-1">
                <span>XYZ Procurement Centre</span>
                <span class="text-emerald-700">28 min</span>
              </div>
              <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" style="width: 35%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between font-bold mb-1">
                <span>ABC Procurement Mandi</span>
                <span class="text-amber-600">85 min</span>
              </div>
              <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div class="bg-amber-500 h-full rounded-full" style="width: 85%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between font-bold mb-1">
                <span>Green Valley Mandi</span>
                <span class="text-emerald-700">18 min</span>
              </div>
              <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" style="width: 22%"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- MANDI OVERVIEW MONITORING TABLE -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 p-6">
        <h3 class="font-bold text-slate-900 text-base">Procurement Centre Monitoring Table</h3>
        
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th class="p-3">Centre Name</th>
                <th class="p-3">Waiting Count</th>
                <th class="p-3">Estimated Wait</th>
                <th class="p-3">Yard Capacity</th>
                <th class="p-3">Status</th>
                <th class="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
              ${state.centres.map(c => `
                <tr>
                  <td class="p-3 font-bold text-slate-900">${c.name}</td>
                  <td class="p-3">${c.queueCount} Farmers</td>
                  <td class="p-3 font-semibold ${c.estimatedWaitMin > 60 ? 'text-amber-600' : 'text-emerald-700'}">${c.estimatedWaitMin} min</td>
                  <td class="p-3">${c.capacityPercent}% Full</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.statusBadge === 'High' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}">
                      ${c.status}
                    </span>
                  </td>
                  <td class="p-3 text-right">
                    <button onclick="showToast('Rerouting alert dispatched to farmers in ${c.name.split('(')[0]} zone.')" class="text-xs font-bold text-blue-700 hover:underline">Re-route Traffic</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

function initAdminCharts() {
  // Chart render placeholder if needed
}

// -------------------------------------------------------------
// 12. PROCUREMENT CENTRE MAP PAGE
// -------------------------------------------------------------
function renderProcurementMapPage() {
  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">Procurement Centre Map</h1>
          <p class="text-xs text-slate-500">Live visual map showing Mandi congestion, active queue size, and capacity indicators.</p>
        </div>

        <div class="flex items-center gap-4 text-xs font-bold">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500"></span> Low Queue (&lt; 30m)</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-amber-500"></span> Moderate</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-red-500"></span> High Congestion</span>
        </div>
      </div>

      <!-- MAP CONTAINER GRID -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Interactive Visual Map Canvas -->
        <div class="lg:col-span-8 bg-slate-900 rounded-3xl p-6 relative overflow-hidden min-h-[420px] shadow-2xl flex flex-col justify-between">
          
          <!-- Map Background Graphic Simulation -->
          <div class="absolute inset-0 opacity-20 pointer-events-none">
            <svg class="w-full h-full" viewBox="0 0 800 500" fill="none" stroke="#10b981" stroke-width="1">
              <path d="M 50 100 Q 200 150 400 100 T 750 200" stroke-dasharray="4 4"/>
              <path d="M 100 350 Q 300 250 500 400 T 700 300" stroke-dasharray="4 4"/>
              <circle cx="250" cy="180" r="120" stroke="#047857"/>
              <circle cx="550" cy="300" r="90" stroke="#047857"/>
            </svg>
          </div>

          <!-- MAP MARKERS OVERLAY -->
          <div class="relative z-10 grid grid-cols-2 gap-6 my-auto">
            ${state.centres.map(c => `
              <div onclick="selectMapCentre('${c.id}')" class="bg-white/95 backdrop-blur border-2 ${
                c.statusBadge === 'High' ? 'border-red-500' : c.statusBadge === 'Moderate' ? 'border-amber-500' : 'border-emerald-500'
              } p-4 rounded-2xl shadow-xl cursor-pointer hover:scale-105 transition-transform space-y-2">
                <div class="flex justify-between items-center">
                  <span class="w-3 h-3 rounded-full ${c.statusBadge === 'High' ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}"></span>
                  <span class="text-[10px] font-extrabold px-2 py-0.5 rounded ${c.statusBadge === 'High' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}">
                    ${c.estimatedWaitMin}m Wait
                  </span>
                </div>
                <h4 class="font-extrabold text-slate-900 text-xs">${c.name.split('(')[0]}</h4>
                <p class="text-[11px] text-slate-500">Queue: <strong>${c.queueCount} Farmers</strong> (${c.distanceKm} km)</p>
              </div>
            `).join('')}
          </div>

          <div class="relative z-10 text-[10px] text-slate-400 bg-slate-950/80 p-2.5 rounded-xl flex justify-between items-center">
            <span>🗺️ Kamrup Metropolitan Agricultural Zone</span>
            <span>Click any marker to inspect center capabilities</span>
          </div>

        </div>

        <!-- RIGHT DETAIL PANEL -->
        <div class="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6" id="map-detail-panel">
          <h3 class="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Selected Centre Details</h3>
          
          <div class="space-y-4 text-xs">
            <div>
              <span class="text-slate-400">Centre Name:</span>
              <p class="font-extrabold text-slate-900 text-sm mt-0.5">${state.centres[0].name}</p>
            </div>
            <div>
              <span class="text-slate-400">Address:</span>
              <p class="font-bold text-slate-700 mt-0.5">${state.centres[0].address}</p>
            </div>
            <div>
              <span class="text-slate-400">Active Counters:</span>
              <p class="font-bold text-slate-800 mt-0.5">${state.centres[0].activeCounters} Operational Counters</p>
            </div>
            <div>
              <span class="text-slate-400">Today's Bookings:</span>
              <p class="font-bold text-slate-800 mt-0.5">${state.centres[0].todayBookings} Bookings</p>
            </div>

            <div class="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
              <span class="text-emerald-800 font-bold">Queue Recommendation</span>
              <p class="text-slate-600">Current average wait time is under 30 minutes. Recommended for booking.</p>
            </div>

            <button onclick="bookingWizard.selectedCentre='C01'; bookingWizard.step=3; setView('book-slot');" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl shadow-md transition-colors">
              Book at this Centre →
            </button>
          </div>
        </div>

      </div>

    </div>
  `;
}

function selectMapCentre(centreId) {
  const c = state.centres.find(item => item.id === centreId);
  if (!c) return;

  const panel = document.getElementById('map-detail-panel');
  if (panel) {
    panel.innerHTML = `
      <h3 class="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-3">Selected Centre Details</h3>
      <div class="space-y-4 text-xs">
        <div>
          <span class="text-slate-400">Centre Name:</span>
          <p class="font-extrabold text-slate-900 text-sm mt-0.5">${c.name}</p>
        </div>
        <div>
          <span class="text-slate-400">Address:</span>
          <p class="font-bold text-slate-700 mt-0.5">${c.address}</p>
        </div>
        <div>
          <span class="text-slate-400">Distance & Queue:</span>
          <p class="font-bold text-slate-800 mt-0.5">${c.distanceKm} km | ${c.queueCount} Farmers Waiting</p>
        </div>
        <div>
          <span class="text-slate-400">Estimated Waiting Time:</span>
          <p class="font-bold text-emerald-700 text-sm mt-0.5">${c.estimatedWaitMin} minutes</p>
        </div>

        <button onclick="bookingWizard.selectedCentre='${c.id}'; bookingWizard.step=3; setView('book-slot');" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl shadow-md transition-colors">
          Book at this Centre →
        </button>
      </div>
    `;
  }
}

// -------------------------------------------------------------
// MODALS (RESCHEDULE, CANCEL, RECEIPT)
// -------------------------------------------------------------
function openBookingModal() {
  const modal = document.getElementById('global-modal');
  const bkg = state.activeBooking;

  document.getElementById('modal-content').innerHTML = `
    <div class="p-6 space-y-6" id="printable-receipt-area">
      <div class="flex justify-between items-center border-b border-slate-200 pb-4">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded bg-emerald-600 text-white font-bold flex items-center justify-center">KS</div>
          <div>
            <h3 class="font-extrabold text-slate-900 text-base">KisanSetu Official Digital Receipt</h3>
            <p class="text-[10px] text-slate-500">Ministry of Agriculture & Farmers Welfare, Govt of India</p>
          </div>
        </div>
        <span class="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">Verified</span>
      </div>

      <div class="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span class="text-slate-400">Farmer Name:</span>
          <p class="font-bold text-slate-900">${state.farmer.name}</p>
        </div>
        <div>
          <span class="text-slate-400">Farmer ID:</span>
          <p class="font-bold text-slate-900">${state.farmer.id}</p>
        </div>
        <div>
          <span class="text-slate-400">Token Number:</span>
          <p class="font-black text-emerald-700 text-lg">${bkg.token}</p>
        </div>
        <div>
          <span class="text-slate-400">Booking ID:</span>
          <p class="font-bold text-slate-900">${bkg.id}</p>
        </div>
        <div>
          <span class="text-slate-400">Crop & Quantity:</span>
          <p class="font-bold text-slate-900">${bkg.crop} (${bkg.quantityQuintals} Quintals)</p>
        </div>
        <div>
          <span class="text-slate-400">Centre Name:</span>
          <p class="font-bold text-slate-900">${bkg.centreName}</p>
        </div>
      </div>

      <div class="pt-4 border-t border-slate-200 flex justify-between items-center">
        <button onclick="window.print()" class="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg">Print / Save PDF</button>
        <button onclick="closeModal()" class="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg">Close</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

function openRescheduleModal() {
  const modal = document.getElementById('global-modal');
  document.getElementById('modal-content').innerHTML = `
    <div class="p-6 space-y-4">
      <h3 class="font-extrabold text-slate-900 text-lg">Reschedule Procurement Slot</h3>
      <p class="text-xs text-slate-500">Select a new date for your paddy procurement at XYZ Centre.</p>
      
      <input type="date" value="2026-09-12" class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-bold"/>

      <div class="flex justify-end gap-3 pt-2">
        <button onclick="closeModal()" class="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg">Cancel</button>
        <button onclick="showToast('Slot rescheduled to 12 Sep 2026'); closeModal(); renderView('dashboard');" class="bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-lg">Confirm Reschedule</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

function openCancelModal() {
  const modal = document.getElementById('global-modal');
  document.getElementById('modal-content').innerHTML = `
    <div class="p-6 space-y-4">
      <h3 class="font-extrabold text-slate-900 text-lg">Cancel Procurement Slot</h3>
      <p class="text-xs text-slate-500">Are you sure you want to cancel Token A107? This will release your position in the mandi queue.</p>

      <div class="flex justify-end gap-3 pt-2">
        <button onclick="closeModal()" class="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2 rounded-lg">Keep Slot</button>
        <button onclick="showToast('Booking cancelled.', 'error'); closeModal();" class="bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg">Yes, Cancel</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('global-modal');
  if (modal) modal.classList.add('hidden');
}
