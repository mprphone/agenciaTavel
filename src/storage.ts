import { supabase } from './supabaseClient';

export const STORAGE_BUCKETS = {
  photos: 'photos',
  proposals: 'propostas',
  documents: 'documentos',
} as const;

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

export const uploadFileToBucket = async (params: {
  bucket: string;
  file: File;
  pathPrefix: string;
}) => {
  const { bucket, file, pathPrefix } = params;
  const safeName = sanitizeFileName(file.name);
  const filePath = `${pathPrefix}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return {
    path: filePath,
    publicUrl: data.publicUrl,
  };
};
