// public/js/config/supabase.js

// Supabase는 이미 전역으로 로드되어 있음 (index.html의 CDN)
// import 문 제거하고 전역 객체 사용
const { createClient } = window.supabase;

// Supabase configuration
const supabaseUrl = window.SUPABASE_URL;
const supabaseAnonKey = window.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration. Please check your environment variables.');
    console.log('Current URL:', supabaseUrl);
    console.log('Current Key:', supabaseAnonKey ? 'Present' : 'Missing');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});

// 연결 테스트
supabase.from('trpg_logs').select('count', { count: 'exact' }).then(({ data, error }) => {
    if (error) {
        console.error('Supabase connection test failed:', error);
    } else {
        console.log('✅ Supabase connected successfully');
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