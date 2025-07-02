// src/js/services/galleryService.js
import { supabase, TABLES, BUCKETS } from '../config/supabase.js';

export class GalleryService {
    static async getFolders(limit = 10, offset = 0) {
        try {
            const { data, error } = await supabase
                .from(TABLES.GALLERY_FOLDERS)
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching folders:', error);
            return [];
        }
    }

    static async getFolderById(id) {
        try {
            const { data, error } = await supabase
                .from(TABLES.GALLERY_FOLDERS)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching folder:', error);
            return null;
        }
    }

    static async getImagesInFolder(folderId) {
        try {
            const { data, error } = await supabase
                .from(TABLES.GALLERY_IMAGES)
                .select('*')
                .eq('folder_id', folderId)
                .order('order_index', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching images:', error);
            return [];
        }
    }

    static async createFolder(folderData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.GALLERY_FOLDERS)
                .insert([folderData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating folder:', error);
            return null;
        }
    }

    static async updateFolder(id, updates) {
        try {
            const { data, error } = await supabase
                .from(TABLES.GALLERY_FOLDERS)
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
            console.error('Error updating folder:', error);
            return null;
        }
    }

    static async deleteFolder(id) {
        try {
            // Images will be cascade deleted due to foreign key constraint
            const { error } = await supabase
                .from(TABLES.GALLERY_FOLDERS)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting folder:', error);
            return false;
        }
    }

    static async uploadImage(file, folderId) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `gallery/${folderId}/${fileName}`;

            const { data, error } = await supabase.storage
                .from(BUCKETS.IMAGES)
                .upload(filePath, file);

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKETS.IMAGES)
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    }

                .single();

            if (error) throw error;

            // Update folder image count
            await this.updateFolderImageCount(imageData.folder_id);

            return data;
        } catch (error) {
            console.error('Error adding image to folder:', error);
            return null;
        }
    }

    static async deleteImage(id) {
        try {
            // Get image info first
            const { data: image } = await supabase
                .from(TABLES.GALLERY_IMAGES)
                .select('folder_id, image_url')
                .eq('id', id)
                .single();

            if (!image) return false;

            // Delete from database
            const { error } = await supabase
                .from(TABLES.GALLERY_IMAGES)
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Update folder image count
            await this.updateFolderImageCount(image.folder_id);

            return true;
        } catch (error) {
            console.error('Error deleting image:', error);
            return false;
        }
    }

    static async updateFolderImageCount(folderId) {
        try {
            const { count } = await supabase
                .from(TABLES.GALLERY_IMAGES)
                .select('*', { count: 'exact', head: true })
                .eq('folder_id', folderId);

            await supabase
                .from(TABLES.GALLERY_FOLDERS)
                .update({ image_count: count || 0 })
                .eq('id', folderId);
        } catch (error) {
            console.error('Error updating folder image count:', error);
        }
    }
}