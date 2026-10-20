window.DELICIOUS_BITES_CONFIG = {
    supabaseUrl: "https://jcwzuwlmyygntpkvmlrr.supabase.co",
    supabaseAnonKey: "sb_publishable_4EDGVyyvLFWkz3HpVbL2qQ_X1ZfMoCP"
};

(function () {
    const config = window.DELICIOUS_BITES_CONFIG;
    const hasUrl = typeof config.supabaseUrl === "string" && config.supabaseUrl.trim();
    const hasKey = typeof config.supabaseAnonKey === "string" && config.supabaseAnonKey.trim();

    if (!hasUrl && !hasKey) {
        window.restaurantBackend = null;
        return;
    }

    if (!hasUrl || !hasKey || !window.supabase) {
        console.error("Supabase setup is incomplete. Check backend-config.js and the Supabase client script.");
        window.restaurantBackend = null;
        return;
    }

    window.restaurantBackend = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
}());
