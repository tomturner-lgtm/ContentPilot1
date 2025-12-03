/**
 * ContentPilot - Authentication Logic
 */

// Configuration (Replace with actual env vars in production or load from config)
const SUPABASE_URL = 'https://ybfbfmbnlsvgyhtzctpl.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-placeholder'; // User needs to provide this or we read from .env.local if possible via build process, but for vanilla JS we might need a config.js

let supabase;

function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Export to global scope so api.js can access it
        window.supabaseClient = supabase;
        console.log('Supabase initialized');
        checkUserSession();
    } else {
        console.error('Supabase SDK not loaded');
    }
}

async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    updateUIForSession(session);

    supabase.auth.onAuthStateChange((_event, session) => {
        updateUIForSession(session);
    });
}

function updateUIForSession(session) {
    const authButtons = document.querySelectorAll('.auth-btn');
    const userProfile = document.querySelector('.user-profile');

    if (session) {
        document.body.classList.add('logged-in');
        if (authButtons) authButtons.forEach(btn => btn.classList.add('hidden'));
        if (userProfile) userProfile.classList.remove('hidden');
    } else {
        document.body.classList.remove('logged-in');
        if (authButtons) authButtons.forEach(btn => btn.classList.remove('hidden'));
        if (userProfile) userProfile.classList.add('hidden');
    }
}

// Export functions to global scope for use in HTML
window.initSupabase = initSupabase;
