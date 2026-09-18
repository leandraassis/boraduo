import { supabase } from './supabase'

export const AVATAR_BUCKET = 'avatars'
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
export const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp'

export type AvatarMime = 'image/png' | 'image/jpeg' | 'image/webp'

export interface StagedAvatar {
  file: File
  mime: AvatarMime
  previewUrl: string
}

// Detecta o formato pelo conteúdo (não pela extensão/`file.type`), para que um SVG
// renomeado nunca passe como imagem raster.
async function sniffMime(file: File): Promise<AvatarMime | null> {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  const isRiff = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
  const isWebp = b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  if (isRiff && isWebp) return 'image/webp'
  return null
}

export async function validateAvatarFile(file: File): Promise<{ mime: AvatarMime } | { error: string }> {
  if (file.size > AVATAR_MAX_BYTES) {
    return { error: 'A imagem deve ter no máximo 5 MB.' }
  }
  const mime = await sniffMime(file)
  if (!mime) {
    return { error: 'Formato não suportado. Use PNG, JPEG ou WebP.' }
  }
  return { mime }
}

export async function uploadAvatar(userId: string, file: File, mime: AvatarMime): Promise<string> {
  const path = `${userId}/avatar`
  const body = new File([file], 'avatar', { type: mime })
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, body, {
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw error
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

export async function deleteAvatar(userId: string): Promise<void> {
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([`${userId}/avatar`])
  if (error) throw error
}
