// public/js/config/supabase.js
(function() {
    'use strict';
    
    // Check if Supabase is loaded
    if (!window.supabase) {
        console.error('Supabase SDK not loaded. Please check the CDN link.');
        return;
    }
    
    // Supabase configuration
    const supabaseUrl = window.SUPABASE_URL;
    const supabaseAnonKey = window.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('%VITE_')) {
        console.error('Missing Supabase configuration. Please check your environment variables.');
        console.log('Current URL:', supabaseUrl);
        console.log('Current Key:', supabaseAnonKey ? 'Present' : 'Missing');
        
        // Create dummy client to prevent errors
        window.supabaseClient = {
            from: () => ({
                select: () => Promise.resolve({ data: [], error: null }),
                insert: () => Promise.resolve({ data: null, error: null }),
                update: () => Promise.resolve({ data: null, error: null }),
                delete: () => Promise.resolve({ error: null })
            }),
            storage: {
                from: () => ({
                    upload: () => Promise.resolve({ data: null, error: null }),
                    getPublicUrl: () => ({ data: { publicUrl: '' } })
                })
            }
        };
        
        console.warn('Using dummy Supabase client due to missing configuration');
    } else {
        // Create Supabase client
        try {
            window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                }
            });
            
            // Connection test
            window.supabaseClient.from('trpg_logs').select('count', { count: 'exact' }).then(({ data, error }) => {
                if (error) {
                    console.error('Supabase connection test failed:', error);
                } else {
                    console.log('✅ Supabase connected successfully');
                }
            });
        } catch (error) {
            console.error('Failed to create Supabase client:', error);
        }
    }

    // Database table names
    window.TABLES = {
        TRPG_LOGS: 'trpg_logs',
        STORIES: 'stories',
        CHARACTER_PAIRS: 'character_pairs',
        ARCHIVE_ITEMS: 'archive_items',
        GALLERY_FOLDERS: 'gallery_folders',
        GALLERY_IMAGES: 'gallery_images'
    };

    // Storage bucket names
    window.BUCKETS = {
        IMAGES: 'images',
        DOCUMENTS: 'documents',
        ARCHIVE: 'archive'
    };

    console.log('✅ Supabase configuration loaded');
})();