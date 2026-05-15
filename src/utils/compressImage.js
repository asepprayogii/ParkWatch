/**
 * Kompresi gambar menggunakan Canvas API
 * - Resize ke maxWidth/maxHeight (menjaga aspect ratio)
 * - Compress ke JPEG dengan quality tertentu
 * - Targetnya file output < maxSizeMB
 * 
 * @param {File} file - File gambar asli
 * @param {Object} options
 * @param {number} options.maxWidth - Lebar maksimal (default: 1920)
 * @param {number} options.maxHeight - Tinggi maksimal (default: 1920)
 * @param {number} options.quality - Kualitas JPEG 0-1 (default: 0.8)
 * @param {number} options.maxSizeMB - Ukuran maksimal output dalam MB (default: 1.5)
 * @returns {Promise<File>} File yang sudah dikompres
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    maxSizeMB = 1.5,
  } = options

  // Jika bukan gambar, return langsung
  if (!file.type.startsWith('image/')) return file

  // Jika sudah kecil, skip kompresi
  if (file.size <= maxSizeMB * 1024 * 1024) return file

  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Hitung dimensi baru (menjaga aspect ratio)
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // Gambar ke canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Coba compress dengan quality yang diberikan
      // Jika masih terlalu besar, turunkan quality secara bertahap
      const tryCompress = (q) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengompres gambar'))
              return
            }

            // Jika masih > target dan quality masih bisa diturunkan
            if (blob.size > maxSizeMB * 1024 * 1024 && q > 0.4) {
              tryCompress(q - 0.1)
              return
            }

            // Buat File baru dari blob
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.jpg'),
              { type: 'image/jpeg', lastModified: Date.now() }
            )

            console.log(
              `📸 Kompresi: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB (q=${q.toFixed(1)}, ${width}x${height})`
            )

            resolve(compressedFile)
          },
          'image/jpeg',
          q
        )
      }

      tryCompress(quality)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gagal memuat gambar untuk kompresi'))
    }

    img.src = url
  })
}

/**
 * Kompresi untuk avatar (lebih agresif karena ukuran kecil)
 */
export async function compressAvatar(file) {
  return compressImage(file, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.75,
    maxSizeMB: 0.5,
  })
}
