/**
 * ContentPilot - API Interactions
 */

const API_BASE_URL = 'https://contentpilot1-production.up.railway.app'; // From prompt

async function checkQuota() {
    try {
        // Get supabase client from global scope (set by auth.js)
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            return null;
        }
        
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return null;

        const response = await fetch(`${API_BASE_URL}/api/user/check-quota`, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`
            }
        });

        return await response.json();
    } catch (error) {
        console.error('Error checking quota:', error);
        return null;
    }
}

async function generateArticle(params) {
    // Implementation for article generation
    console.log('Generating article with params:', params);
}

window.api = {
    checkQuota,
    generateArticle
};
