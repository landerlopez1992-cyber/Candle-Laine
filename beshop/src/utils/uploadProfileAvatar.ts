import {supabase} from '../supabaseClient';

const BUCKET = 'user-avatars';

function extFromFile(file: File): 'jpg' | 'png' | 'webp' {
  const t = file.type.toLowerCase();
  if (t === 'image/png') {
    return 'png';
  }
  if (t === 'image/webp') {
    return 'webp';
  }
  return 'jpg';
}

/**
 * Uploads an image to Storage under `user-avatars/<userId>/...` and saves `profiles.avatar_url`.
 */
export async function uploadAndSaveProfileAvatar(
  file: File,
  userId: string,
): Promise<{ok: true; publicUrl: string} | {ok: false; message: string}> {
  if (!supabase) {
    return {ok: false, message: 'Unavailable.'};
  }
  if (!file.type.startsWith('image/')) {
    return {ok: false, message: 'Please choose an image file.'};
  }

  const path = `${userId}/${Date.now()}.${extFromFile(file)}`;
  const {error: upErr} = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (upErr) {
    return {ok: false, message: upErr.message || 'Upload failed.'};
  }

  const {data} = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const {error: dbErr} = await supabase
    .from('profiles')
    .update({avatar_url: publicUrl})
    .eq('id', userId);

  if (dbErr) {
    return {ok: false, message: dbErr.message || 'Could not save profile photo.'};
  }

  return {ok: true, publicUrl};
}
