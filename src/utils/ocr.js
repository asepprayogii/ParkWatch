import Tesseract from 'tesseract.js'

// Preprocessing: crop bagian bawah foto (area plat biasanya di bawah)
function cropPlateArea(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      // Ambil 40% bagian bawah gambar (area plat kendaraan)
      const cropHeight = img.height * 0.4
      const cropY = img.height * 0.6
      canvas.width = img.width
      canvas.height = cropHeight
      ctx.drawImage(img, 0, cropY, img.width, cropHeight, 0, 0, img.width, cropHeight)
      canvas.toBlob(resolve, 'image/jpeg', 0.95)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

// Bersihkan hasil OCR → ambil pola plat Indonesia
function extractPlate(text) {
  // Pola plat Indonesia: 1-2 huruf, 1-4 angka, 1-3 huruf (contoh: B 1234 ABC)
  const cleaned = text.replace(/\s+/g, ' ').toUpperCase()
  const pattern = /([A-Z]{1,2})\s*(\d{1,4})\s*([A-Z]{1,3})/
  const match = cleaned.match(pattern)
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]}`
  }
  return null
}

export async function detectPlateNumber(file, onProgress) {
  try {
    // Crop area plat dulu
    const croppedBlob = await cropPlateArea(file)

    const result = await Tesseract.recognize(croppedBlob, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.floor(m.progress * 100))
        }
      },
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
    })

    const plate = extractPlate(result.data.text)
    return plate // null kalau tidak terdeteksi
  } catch (err) {
    console.error('OCR error:', err)
    return null
  }
}