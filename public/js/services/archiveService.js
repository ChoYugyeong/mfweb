// public/js/services/archiveService.js
(function() {
    'use strict';

    class ArchiveService {
        static async getArchiveStats() {
            try {
                if (!window.supabaseClient) {
                    console.warn('Supabase client not available');
                    return { text: 0, artwork: 0, photo: 0, mixed: 0 };
                }

                const types = ['text', 'artwork', 'photo', 'mixed'];
                const stats = {};

                for (const type of types) {
                    const { count, error } = await window.supabaseClient
                        .from(window.TABLES.ARCHIVE_ITEMS)
                        .select('*', { count: 'exact', head: true })
                        .eq('type', type);

                    if (!error) {
                        stats[type] = count || 0;
                    }
                }

                return stats;
            } catch (error) {
                console.error('Error fetching archive stats:', error);
                return { text: 0, artwork: 0, photo: 0, mixed: 0 };
            }
        }

        static async getItemsByType(type, limit = 20) {
            try {
                if (!window.supabaseClient) {
                    console.warn('Supabase client not available');
                    return [];
                }

                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.ARCHIVE_ITEMS)
                    .select('*')
                    .eq('type', type)
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error fetching archive items:', error);
                return [];
            }
        }

        static async getItemById(id) {
            try {
                if (!window.supabaseClient) {
                    console.warn('Supabase client not available');
                    return null;
                }

                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.ARCHIVE_ITEMS)
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error fetching archive item:', error);
                return null;
            }
        }

        static async createItem(itemData) {
            try {
                if (!window.supabaseClient) {
                    console.warn('Supabase client not available');
                    return null;
                }

                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.ARCHIVE_ITEMS)
                    .insert([itemData])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error creating archive item:', error);
                return null;
            }
        }

        static async uploadFile(file, type) {
            try {
                if (!window.supabaseClient) {
                    console.warn('Supabase client not available');
                    return null;
                }

                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${type}/${fileName}`;

                const { data, error } = await window.supabaseClient.storage
                    .from(window.BUCKETS.ARCHIVE)
                    .upload(filePath, file);

                if (error) throw error;

                // Get public URL
                const { data: { publicUrl } } = window.supabaseClient.storage
                    .from(window.BUCKETS.ARCHIVE)
                    .getPublicUrl(filePath);

                return publicUrl;
            } catch (error) {
                console.error('Error uploading file:', error);
                return null;
            }
        }

        static async deleteItem(id) {
            try {
                if (!window.supabaseClient) {
                    console.warn('Supabase client not available');
                    return false;
                }

                // First get the item to find the file URL
                const item = await this.getItemById(id);
                if (!item) return false;

                // Delete from database
                const { error } = await window.supabaseClient
                    .from(window.TABLES.ARCHIVE_ITEMS)
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                // TODO: Delete file from storage if needed

                return true;
            } catch (error) {
                console.error('Error deleting archive item:', error);
                return false;
            }
        }
    }

    // Export to global scope
    window.ArchiveService = ArchiveService;
})();