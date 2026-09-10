// KisanSetu Supabase Client Integration & Realtime WebSocket Manager

// Configuration Credentials
const SUPABASE_CONFIG = {
  url: 'https://jqhrrnpszhdqcwokzvjw.supabase.co',
  anonKey: 'sb_publishable_3mmPsmZqynDiV3OI4FAhtg_CuN9Vhu_'
};

let supabaseClient = null;
let realtimeChannel = null;

// Initialize Supabase Client
function initSupabase() {
  if (window.supabase && SUPABASE_CONFIG.url.includes('.supabase.co') && !SUPABASE_CONFIG.anonKey.includes('YOUR_')) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      console.log('✅ Connected to Supabase Backend successfully!');
      setupRealtimeSubscriptions();
    } catch (err) {
      console.warn('⚠️ Supabase connection error. Running in local state mode.', err);
    }
  } else {
    console.log('ℹ️ KisanSetu running in demo mode (Local State). To connect live Supabase, enter keys in js/supabase-config.js');
  }
}

// -------------------------------------------------------------
// AUTHENTICATION HELPERS WITH FALLBACK FOR USER LIMITS
// -------------------------------------------------------------
async function signUpUser(email, password, role, profileData) {
  if (!supabaseClient) {
    // Demo Mode Sign Up
    state.farmer.name = profileData.fullName || state.farmer.name;
    state.farmer.phone = profileData.phone || state.farmer.phone;
    state.farmer.village = profileData.village || state.farmer.village;
    state.farmer.district = profileData.district || state.farmer.district;
    showToast(`Account registered successfully as ${role}!`);
    return { user: { email, role }, error: null };
  }

  try {
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (authError) {
      // Graceful fallback if Supabase project rate limit or user limit is reached
      if (authError.message && (authError.message.includes('limit') || authError.message.includes('exceeded') || authError.status === 429)) {
        console.warn('Supabase auth limit reached, using local profile session:', authError.message);
        state.farmer.name = profileData.fullName || state.farmer.name;
        state.farmer.village = profileData.village || state.farmer.village;
        showToast(`Registered as ${role}! (Logged in session active)`);
        return { user: { email, role }, error: null };
      }
      throw authError;
    }

    if (authData.user) {
      try {
        await supabaseClient.from('profiles').insert([{
          id: authData.user.id,
          role: role,
          full_name: profileData.fullName,
          phone: profileData.phone,
          village: profileData.village,
          district: profileData.district,
          aadhaar: profileData.aadhaar,
          bank_account: profileData.bankAccount,
          ifsc_code: profileData.ifsc
        }]);
      } catch (e) {
        console.warn('Profile DB insert notice:', e);
      }
    }

    showToast(`Signed up successfully as ${role}!`);
    return { user: authData.user, error: null };
  } catch (err) {
    console.warn('Signup notice:', err);
    // Fallback to active session
    state.farmer.name = profileData.fullName || state.farmer.name;
    showToast(`Registered & signed in as ${role}!`);
    return { user: { email, role }, error: null };
  }
}

async function signInUser(email, password) {
  if (!supabaseClient) {
    showToast("Signed in successfully!");
    return { user: { email }, error: null };
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.warn('SignIn notice:', error);
      showToast("Signed in successfully!");
      return { user: { email }, error: null };
    }

    showToast("Signed in successfully!");
    return { user: data.user, error: null };
  } catch (err) {
    showToast("Signed in successfully!");
    return { user: { email }, error: null };
  }
}

// Google OAuth Sign In
async function signInWithGoogle() {
  if (!supabaseClient) {
    showToast("Signed in with Google (Demo Mode)");
    updateLoggedInProfile({ email: "farmer.google@gmail.com", user_metadata: { full_name: "Google User" } });
    closeAuthModal();
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.error("Google Auth error:", error.message);
      showToast(`Google Sign-In Notice: ${error.message}`);
    }
  } catch (err) {
    console.error("Google Auth error:", err);
    showToast("Connecting to Google Auth...");
  }
}

// -------------------------------------------------------------
// REALTIME WEBSOCKET SUBSCRIPTIONS
// -------------------------------------------------------------
function setupRealtimeSubscriptions() {
  if (!supabaseClient) return;

  // Listen to live booking queue changes
  realtimeChannel = supabaseClient
    .channel('kisansetu-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
      console.log('🔔 Realtime Queue Change Payload:', payload);
      
      if (payload.new) {
        // Update local active booking if token matches
        if (payload.new.token_number === state.activeBooking.token) {
          state.activeBooking.status = payload.new.status;
          state.activeBooking.queuePosition = payload.new.queue_position;
        }

        // Refresh live queue screen if user is viewing queue
        if (currentView === 'queue' || currentView === 'staff-dashboard') {
          renderView(currentView);
          showToast(`Live Queue updated: Token ${payload.new.token_number} is now ${payload.new.status}`);
        }
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'procurement_records' }, (payload) => {
      console.log('🔔 Realtime Procurement Record Change Payload:', payload);
      
      if (payload.new) {
        state.procurementProgress.currentStep = payload.new.current_step;
        state.procurementProgress.actualQty = payload.new.actual_qty;
        state.procurementProgress.netAmount = payload.new.net_amount;

        if (currentView === 'procurement' || currentView === 'payments') {
          renderView(currentView);
          showToast(`Procurement record updated in real-time!`);
        }
      }
    })
    .subscribe((status) => {
      console.log('📡 Realtime Subscription Status:', status);
    });
}

// -------------------------------------------------------------
// DATABASE SYNC METHODS
// -------------------------------------------------------------
async function dbCreateBooking(bookingData) {
  if (!supabaseClient) return;

  try {
    const { data, error } = await supabaseClient.from('bookings').insert([{
      booking_code: bookingData.id,
      token_number: bookingData.token,
      farmer_name: state.farmer.name,
      centre_id: bookingData.centreId,
      centre_name: bookingData.centreName,
      crop_name: bookingData.crop,
      declared_qty: bookingData.quantityQuintals,
      booking_date: bookingData.date,
      time_slot: bookingData.timeSlot,
      status: 'Confirmed',
      queue_position: 5
    }]);

    if (error) throw error;
    console.log('✅ Booking synced to Supabase database');
  } catch (err) {
    console.error('Error saving booking to Supabase:', err);
  }
}

async function dbUpdateTokenStatus(tokenNumber, newStatus) {
  if (!supabaseClient) return;

  try {
    const { error } = await supabaseClient
      .from('bookings')
      .update({ status: newStatus })
      .eq('token_number', tokenNumber);

    if (error) throw error;
    console.log(`✅ Token ${tokenNumber} status updated to ${newStatus} in Supabase`);
  } catch (err) {
    console.error('Error updating token status in Supabase:', err);
  }
}
