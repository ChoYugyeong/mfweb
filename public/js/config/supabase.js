import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || window.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration. Please check your environment variables.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});

// Database table names
export const TABLES = {
    TRPG_LOGS: 'trpg_logs',
    STORIES: 'stories',
    CHARACTER_PAIRS: 'character_pairs',
    ARCHIVE_ITEMS: 'archive_items',
    GALLERY_FOLDERS: 'gallery_folders',
    GALLERY_IMAGES: 'gallery_images'
};

// Storage bucket names
export const BUCKETS = {
    IMAGES: 'images',
    DOCUMENTS: 'documents',
    ARCHIVE: 'archive'
};