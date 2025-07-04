// public/js/config/supabase.js

// Supabase는 이미 전역으로 로드되어 있음 (index.html의 CDN)
// 전역 객체로 직접 접근
(function() {
    // window 객체에 직접 할당하여 다른 스크립트에서 사용 가능하게 함
    window.SUPABASE_CONFIG = window.SUPABASE_CONFIG || {};
    
    // Supabase configuration
    const supabaseUrl = window.SUPABASE_URL;
    const supabaseAnonKey = window.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase configuration. Please check your environment variables.');
        console.log('Current URL:', supabaseUrl);
        console.log('Current Key:', supabaseAnonKey ? 'Present' : 'Missing');
        return;
    }

    // Create Supabase client - window 객체에 할당
    window.supabase = window.supabase || {};
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        }
    });

    // 연결 테스트
    window.supabaseClient.from('trpg_logs').select('count', { count: 'exact' }).then(({ data, error }) => {
        if (error) {
            console.error('Supabase connection test failed:', error);
        } else {
            console.log('✅ Supabase connected successfully');
        }
    });

    // Database table names - window 객체에 할당
    window.TABLES = {
        TRPG_LOGS: 'trpg_logs',
        STORIES: 'stories',
        CHARACTER_PAIRS: 'character_pairs',
        ARCHIVE_ITEMS: 'archive_items',
        GALLERY_FOLDERS: 'gallery_folders',
        GALLERY_IMAGES: 'gallery_images'
    };

    // Storage bucket names - window 객체에 할당
    window.BUCKETS = {
        IMAGES: 'images',
        DOCUMENTS: 'documents',
        ARCHIVE: 'archive'
    };

    // 다른 스크립트에서 쉽게 접근할 수 있도록 설정
    window.SUPABASE_CONFIG = {
        client: window.supabaseClient,
        tables: window.TABLES,
        buckets: window.BUCKETS
    };

    console.log('✅ Supabase configuration loaded');
})();</document_content>
</invoke>