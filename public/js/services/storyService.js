(function() {
    'use strict';

    export class StoryService {
    /**
     * Get all stories
     * @param {number} limit - Number of stories to fetch
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Array>}
     */
    static async getStories(limit = 10, offset = 0) {
        try {
            const { data, error } = await window.supabaseClient
                .from(window.TABLES.STORIES)
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching stories:', error);
            return [];
        }
    }

    /**
     * Get a single story by ID
     * @param {string} id - Story ID
     * @returns {Promise<Object|null>}
     */
    static async getStoryById(id) {
        try {
            const { data, error } = await window.supabaseClient
                .from(window.TABLES.STORIES)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching story:', error);
            return null;
        }
    }

    /**
     * Create a new story
     * @param {Object} storyData - Story data
     * @returns {Promise<Object|null>}
     */
    static async createStory(storyData) {
        try {
            // Calculate word count if not provided
            if (!storyData.word_count && storyData.content) {
                storyData.word_count = storyData.content.trim().split(/\s+/).length;
            }

            // Generate preview if not provided
            if (!storyData.preview && storyData.content) {
                storyData.preview = storyData.content.substring(0, 150) + '...';
            }

            const { data, error } = await window.supabaseClient
                .from(window.TABLES.STORIES)
                .insert([storyData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating story:', error);
            return null;
        }
    }

    /**
     * Update a story
     * @param {string} id - Story ID
     * @param {Object} updates - Updated data
     * @returns {Promise<Object|null>}
     */
    static async updateStory(id, updates) {
        try {
            // Recalculate word count if content is updated
            if (updates.content) {
                updates.word_count = updates.content.trim().split(/\s+/).length;
                updates.preview = updates.content.substring(0, 150) + '...';
            }

            const { data, error } = await window.supabaseClient
                .from(window.TABLES.STORIES)
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
            console.error('Error updating story:', error);
            return null;
        }
    }

    /**
     * Delete a story
     * @param {string} id - Story ID
     * @returns {Promise<boolean>}
     */
    static async deleteStory(id) {
        try {
            const { error } = await window.supabaseClient
                .from(window.TABLES.STORIES)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting story:', error);
            return false;
        }
    }

    /**
     * Search stories
     * @param {string} query - Search query
     * @returns {Promise<Array>}
     */
    static async searchStories(query) {
        try {
            const { data, error } = await window.supabaseClient
                .from(window.TABLES.STORIES)
                .select('*')
                .or(`title.ilike.%${query}%, content.ilike.%${query}%, author.ilike.%${query}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error searching stories:', error);
            return [];
        }
    }

    /**
     * Get stories by author
     * @param {string} author - Author name
     * @returns {Promise<Array>}
     */
    static async getStoriesByAuthor(author) {
        try {
            const { data, error } = await window.supabaseClient
                .from(window.TABLES.STORIES)
                .select('*')
                .eq('author', author)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching stories by author:', error);
            return [];
        }
    }

    /**
     * Get stories by tag
     * @param {string} tag - Tag to search for
     * @returns {Promise<Array>}
     */
    static async getStoriesByTag(tag) {
        try {
            const { data, error } = await window.supabaseClient
                .from(window.TABLES.STORIES)
                .select('*')
                .contains('tags', [tag])
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching stories by tag:', error);
            return [];
        }
    }
}

    window.StoryService = StoryService;
})();