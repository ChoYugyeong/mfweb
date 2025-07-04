// public/js/services/pairService.js
(function() {
    'use strict';

    class PairService {
        static async getPairs(limit = 10, offset = 0) {
            try {
                if (!window.supabaseClient) {
                    console.warn('Supabase client not available');
                    return [];
                }

                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.CHARACTER_PAIRS)
                    .select('*')
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error fetching pairs:', error);
                return [];
            }
        }

        static async getPairById(id) {
            try {
                if (!window.supabaseClient) {
                    console.warn('Supabase client not available');
                    return null;
                }

                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.CHARACTER_PAIRS)
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error fetching pair:', error);
                return null;
            }
        }

        static async createPair(pairData) {
            try {
                if (!window.supabaseClient) {
                    console.warn('Supabase client not available');
                    return null;
                }

                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.CHARACTER_PAIRS)
                    .insert([pairData])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error creating pair:', error);
                return null;
            }
        }

        static async updatePair(id, updates) {
            try {
                if (!window.supabaseClient) {
                    console.warn('Supabase client not available');
                    return null;
                }

                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.CHARACTER_PAIRS)
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error updating pair:', error);
                return null;
            }
        }

        static async deletePair(id) {
            try {
                if (!window.supabaseClient) {
                    console.warn('Supabase client not available');
                    return false;
                }

                const { error } = await window.supabaseClient
                    .from(window.TABLES.CHARACTER_PAIRS)
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Error deleting pair:', error);
                return false;
            }
        }
    }

    // Export to global scope
    window.PairService = PairService;
})();