// public/js/services/trpgService.js
(function() {
    'use strict';

    class TRPGService {
        /**
         * Get all TRPG logs
         * @param {number} limit - Number of logs to fetch
         * @param {number} offset - Offset for pagination
         * @returns {Promise<Array>}
         */
        static async getLogs(limit = 10, offset = 0) {
            try {
                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.TRPG_LOGS)
                    .select('*')
                    .order('date', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error fetching TRPG logs:', error);
                return [];
            }
        }

        /**
         * Get a single TRPG log by ID
         * @param {string} id - Log ID
         * @returns {Promise<Object|null>}
         */
        static async getLogById(id) {
            try {
                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.TRPG_LOGS)
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error fetching TRPG log:', error);
                return null;
            }
        }

        /**
         * Create a new TRPG log
         * @param {Object} logData - Log data
         * @returns {Promise<Object|null>}
         */
        static async createLog(logData) {
            try {
                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.TRPG_LOGS)
                    .insert([{
                        title: logData.title,
                        session_number: logData.sessionNumber,
                        date: logData.date,
                        content: logData.content,
                        players: logData.players
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } catch (error) {
                console.error('Error creating TRPG log:', error);
                return null;
            }
        }

        /**
         * Update a TRPG log
         * @param {string} id - Log ID
         * @param {Object} updates - Updated data
         * @returns {Promise<Object|null>}
         */
        static async updateLog(id, updates) {
            try {
                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.TRPG_LOGS)
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
                console.error('Error updating TRPG log:', error);
                return null;
            }
        }

        /**
         * Delete a TRPG log
         * @param {string} id - Log ID
         * @returns {Promise<boolean>}
         */
        static async deleteLog(id) {
            try {
                const { error } = await window.supabaseClient
                    .from(window.TABLES.TRPG_LOGS)
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                return true;
            } catch (error) {
                console.error('Error deleting TRPG log:', error);
                return false;
            }
        }

        /**
         * Search TRPG logs
         * @param {string} query - Search query
         * @returns {Promise<Array>}
         */
        static async searchLogs(query) {
            try {
                const { data, error } = await window.supabaseClient
                    .from(window.TABLES.TRPG_LOGS)
                    .select('*')
                    .or(`title.ilike.%${query}%, content.ilike.%${query}%`)
                    .order('date', { ascending: false });

                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error searching TRPG logs:', error);
                return [];
            }
        }
    }

    // Export to global scope
    window.TRPGService = TRPGService;
})();