import Tesseract from 'tesseract.js'

// Preprocessing: bersihkan gambar agar teks lebih terbaca (tanpa cropping)
function processImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Gunakan ukuran asli gambar (tidak di-crop)
      canvas.width = img.width
      canvas.height = img.height
      
      ctx.drawImage(img, 0, 0)
      
      // Image Pre-processing (Grayscale & Binarization)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        
        // Binarization: Membantu Tesseract membedakan teks dari background
        const threshold = 120
        const value = gray > threshold ? 255 : 0
        
        data[i] = value
        data[i + 1] = value
        data[i + 2] = value
      }
      ctx.putImageData(imageData, 0, 0)
      
      canvas.toBlob(resolve, 'image/jpeg', 0.95)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

// Bersihkan hasil OCR → ambil pola plat Indonesia
function extractPlate(text) {
  console.log('Raw AI Output:', text) // DEBUG: Lihat apa yang dibaca AI
  
  // Bersihkan teks dari karakter aneh, biarkan spasi
  const cleaned = text.replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').toUpperCase().trim()
  
  // Pola yang lebih fleksibel:
  // (1-2 huruf) (1-4 angka) (1-3 huruf)
  const pattern = /([A-Z]{1,2})\s*(\d{1,4})\s*([A-Z]{1,3})/
  const match = cleaned.match(pattern)
  
  if (match) {
    const result = `${match[1]} ${match[2]} ${match[3]}`
    console.log('Detected Plate:', result)
    return result
  }
  
  return null
}

export async function detectPlateNumber(file, onProgress) {
  try {
    const processedBlob = await processImage(file)

    const result = await Tesseract.recognize(processedBlob, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.floor(m.progress * 100))
        }
      },
      tessedit_pageseg_mode: '3',
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
    })

    const plate = extractPlate(result.data.text)
    return plate
  } catch (err) {
    console.error('OCR error:', err)
    return null
  }
}

