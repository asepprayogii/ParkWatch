import Tesseract from 'tesseract.js'

/**
 * IMPROVED OCR ENGINE UNTUK PLAT NOMOR INDONESIA
 * Return: String formatted "BK 7272 JT" (dengan spasi)
 */

// ==================== PREPROCESSING CANGGIH ====================

async function detectAndCropPlateArea(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        data[i] = data[i + 1] = data[i + 2] = gray
      }

      let minY = canvas.height, maxY = 0
      let minX = canvas.width, maxX = 0
      const threshold = 50

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4
          const gray = data[idx]
          if (gray < 50 || gray > 200) {
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
          }
        }
      }

      const margin = 20
      minX = Math.max(0, minX - margin)
      minY = Math.max(0, minY - margin)
      maxX = Math.min(canvas.width, maxX + margin)
      maxY = Math.min(canvas.height, maxY + margin)

      const croppedWidth = maxX - minX
      const croppedHeight = maxY - minY

      if (croppedWidth < 50 || croppedHeight < 20) {
        resolve(file)
        return
      }

      const cropped = document.createElement('canvas')
      cropped.width = croppedWidth
      cropped.height = croppedHeight
      const cropCtx = cropped.getContext('2d')
      cropCtx.drawImage(canvas, minX, minY, croppedWidth, croppedHeight, 0, 0, croppedWidth, croppedHeight)

      cropped.toBlob(resolve, 'image/png')
    }
    img.src = url
  })
}

async function preprocessImageAdvanced(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.max(2, Math.ceil(600 / img.width))
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let data = imageData.data
      
      const grayArray = []
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        grayArray.push(gray)
        data[i] = data[i + 1] = data[i + 2] = gray
      }

      const claheData = applyCLAHE(grayArray, canvas.width, canvas.height)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i + 1] = data[i + 2] = claheData[i / 4]
      }

      let processed = morphClose(claheData, canvas.width, canvas.height, 2)
      const threshold = computeOtsuThreshold(processed)
      
      for (let i = 0; i < processed.length; i++) {
        processed[i] = processed[i] > threshold ? 255 : 0
      }

      let whiteCount = 0
      for (let i = 0; i < processed.length; i++) {
        if (processed[i] > 128) whiteCount++
      }

      if (whiteCount < processed.length * 0.3) {
        for (let i = 0; i < processed.length; i++) {
          processed[i] = 255 - processed[i]
        }
      }

      processed = morphDilate(processed, canvas.width, canvas.height, 1)

      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i + 1] = data[i + 2] = processed[i / 4]
        data[i + 3] = 255
      }

      ctx.putImageData(imageData, 0, 0)

      const padded = document.createElement('canvas')
      const pad = 15
      padded.width = canvas.width + pad * 2
      padded.height = canvas.height + pad * 2
      const pctx = padded.getContext('2d')
      pctx.fillStyle = 'white'
      pctx.fillRect(0, 0, padded.width, padded.height)
      pctx.drawImage(canvas, pad, pad)

      padded.toBlob((blob) => {
        URL.revokeObjectURL(url)
        resolve(blob)
      }, 'image/png')
    }
    img.src = url
  })
}

function applyCLAHE(grayArray, width, height, clipLimit = 40, tileSize = 32) {
  const result = new Uint8ClampedArray(grayArray.length)
  const tileWidth = Math.ceil(width / tileSize)
  const tileHeight = Math.ceil(height / tileSize)

  for (let ty = 0; ty < tileHeight; ty++) {
    for (let tx = 0; tx < tileWidth; tx++) {
      const x1 = tx * tileSize
      const y1 = ty * tileSize
      const x2 = Math.min(x1 + tileSize, width)
      const y2 = Math.min(y1 + tileSize, height)

      const hist = new Array(256).fill(0)
      for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
          hist[grayArray[y * width + x]]++
        }
      }

      const pixelsInTile = (x2 - x1) * (y2 - y1)
      const clipped = new Array(256)
      let excess = 0
      
      for (let i = 0; i < 256; i++) {
        if (hist[i] > clipLimit) {
          excess += hist[i] - clipLimit
          clipped[i] = clipLimit
        } else {
          clipped[i] = hist[i]
        }
      }

      const step = excess / 256
      for (let i = 0; i < 256; i++) {
        clipped[i] += step
      }

      const cdf = new Array(256)
      cdf[0] = clipped[0]
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + clipped[i]
      }

      for (let i = 0; i < 256; i++) {
        cdf[i] = Math.round((cdf[i] / pixelsInTile) * 255)
      }

      for (let y = y1; y < y2; y++) {
        for (let x = x1; x < x2; x++) {
          const idx = y * width + x
          result[idx] = cdf[grayArray[idx]]
        }
      }
    }
  }
  return result
}

function computeOtsuThreshold(data) {
  const hist = new Array(256).fill(0)
  for (let i = 0; i < data.length; i++) {
    hist[data[i]]++
  }

  let sum = 0
  for (let i = 0; i < 256; i++) {
    sum += i * hist[i]
  }

  let sumB = 0, wB = 0, maxVar = 0, threshold = 0

  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = data.length - wB
    if (wF === 0) break

    sumB += t * hist[t]
    const meanB = sumB / wB
    const meanF = (sum - sumB) / wF
    const varBetween = wB * wF * (meanB - meanF) ** 2

    if (varBetween > maxVar) {
      maxVar = varBetween
      threshold = t
    }
  }
  return threshold
}

function morphClose(data, width, height, iterations = 1) {
  let result = new Uint8ClampedArray(data)
  for (let iter = 0; iter < iterations; iter++) {
    result = morphErode(result, width, height)
    result = morphDilate(result, width, height)
  }
  return result
}

function morphErode(data, width, height) {
  const result = new Uint8ClampedArray(data)
  const kernel = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      if (data[idx] > 128) {
        let allWhite = true
        for (const [dy, dx] of kernel) {
          if (data[(y + dy) * width + (x + dx)] <= 128) {
            allWhite = false
            break
          }
        }
        if (!allWhite) result[idx] = 0
      }
    }
  }
  return result
}

function morphDilate(data, width, height, iterations = 1) {
  let result = new Uint8ClampedArray(data)
  for (let iter = 0; iter < iterations; iter++) {
    const temp = new Uint8ClampedArray(result)
    const kernel = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x
        if (result[idx] <= 128) {
          for (const [dy, dx] of kernel) {
            if (result[(y + dy) * width + (x + dx)] > 128) {
              temp[idx] = 255
              break
            }
          }
        }
      }
    }
    result = temp
  }
  return result
}

async function generatePlateVariants(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const variants = []
      
      generateVariant(img, 0, 0, img.width, img.height, 1.8, 130, (blob) => { variants[0] = blob; check() })
      generateVariant(img, 0, 0, img.width, img.height, 2.5, 120, (blob) => { variants[1] = blob; check() })
      generateVariant(img, 0, 0, img.width, img.height, 3.0, 110, (blob) => { variants[2] = blob; check() })
      generateVariant(img, 0, img.height * 0.5, img.width, img.height * 0.5, 2.0, 125, (blob) => { variants[3] = blob; check() })
      generateVariant(img, img.width * 0.15, img.height * 0.4, img.width * 0.7, img.height * 0.5, 2.2, 115, (blob) => { variants[4] = blob; check() })

      let done = 0
      function check() {
        done++
        if (done === 5) {
          URL.revokeObjectURL(url)
          resolve(variants)
        }
      }
    }
    img.src = url
  })
}

function generateVariant(img, sx, sy, sw, sh, contrast, threshold, callback) {
  const canvas = document.createElement('canvas')
  const scale = Math.max(2, Math.ceil(600 / sw))
  canvas.width = sw * scale
  canvas.height = sh * scale

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    const contrasted = Math.min(255, Math.max(0, (gray - 128) * contrast + 128))
    const binary = contrasted > threshold ? 255 : 0
    data[i] = data[i + 1] = data[i + 2] = binary
  }

  ctx.putImageData(imageData, 0, 0)
  canvas.toBlob(callback, 'image/png')
}

// ==================== TEXT EXTRACTION DENGAN FORMAT SPASI ====================

function extractPlateFromText(text) {
  if (!text) return null

  const cleaned = text
    .toUpperCase()
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const validPrefixes = {
    'A': true, 'AA': true, 'AB': true, 'AD': true, 'AE': true, 'AG': true,
    'B': true, 'BA': true, 'BB': true, 'BD': true, 'BE': true, 'BG': true,
    'BH': true, 'BK': true, 'BL': true, 'BM': true, 'BN': true, 'BP': true, 'BW': true,
    'D': true, 'DA': true, 'DB': true, 'DC': true, 'DD': true, 'DE': true, 'DG': true,
    'DH': true, 'DK': true, 'DL': true, 'DM': true, 'DN': true, 'DO': true, 'DW': true,
    'E': true, 'EA': true, 'EB': true, 'ED': true, 'EE': true,
    'F': true, 'G': true, 'H': true, 'K': true, 'KH': true, 'KT': true,
    'L': true, 'M': true, 'N': true, 'NA': true, 'NB': true, 'ND': true,
    'W': true, 'Z': true
  }

  const patterns = [
    /([A-Z]{1,2})\s*([0-9]{1,4})\s*([A-Z]{1,3})/g,
    /([A-Z]{1,2})[-.\s]*([0-9]{1,4})[-.\s]*([A-Z]{1,3})/g,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(cleaned)) !== null) {
      let prefix = match[1]
      let numbers = match[2]
        .replace(/O/g, '0').replace(/I/g, '1').replace(/l/g, '1')
        .replace(/S/g, '5').replace(/Z/g, '2').replace(/G/g, '6')
      let suffix = match[3]
        .replace(/0/g, 'O').replace(/1/g, 'I')
        .replace(/5/g, 'S').replace(/2/g, 'Z')

      if (numbers.length < 1 || numbers.length > 4 || suffix.length < 1 || suffix.length > 3) continue

      const isValid = validPrefixes[prefix] || fuzzyMatchPrefix(prefix, Object.keys(validPrefixes))

      if (isValid) {
        // ✅ RETURN STRING DENGAN FORMAT SPASI: "BK 7272 JT"
        return `${prefix} ${numbers} ${suffix}`
      }
    }
  }

  // Fallback
  for (const pattern of patterns) {
    const match = pattern.exec(cleaned)
    if (match) {
      return `${match[1]} ${match[2]} ${match[3]}`
    }
  }
  
  return null
}

function fuzzyMatchPrefix(input, validPrefixes, maxDistance = 1) {
  for (const valid of validPrefixes) {
    if (levenshteinDistance(input, valid) <= maxDistance) return valid
  }
  return null
}

function levenshteinDistance(a, b) {
  const dp = Array(b.length + 1).fill(0).map(() => Array(a.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[0][i] = i
  for (let j = 0; j <= b.length; j++) dp[j][0] = j

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (a[i - 1] === b[j - 1]) {
        dp[j][i] = dp[j - 1][i - 1]
      } else {
        dp[j][i] = Math.min(dp[j - 1][i - 1] + 1, dp[j - 1][i] + 1, dp[j][i - 1] + 1)
      }
    }
  }
  return dp[b.length][a.length]
}

async function runOCRAdvanced(blob) {
  try {
    const result = await Tesseract.recognize(blob, 'eng', {
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -.',
      tessedit_pageseg_mode: '7',
      preserve_interword_spaces: '1',
      tesseract_create_hocr: '0'
    })
    return result.data.text
  } catch (err) {
    console.error('OCR error:', err)
    return ''
  }
}

// ==================== MAIN FUNCTION - RETURN STRING ====================

export async function detectPlateNumber(file, onProgress) {
  try {
    onProgress?.(5)
    const croppedFile = await detectAndCropPlateArea(file)
    onProgress?.(15)

    const variants = await generatePlateVariants(croppedFile)
    onProgress?.(40)

    const results = []
    for (let i = 0; i < variants.length; i++) {
      try {
        const text = await runOCRAdvanced(variants[i])
        const plate = extractPlateFromText(text)
        if (plate) results.push(plate)
      } catch (err) {
        console.error(`Variant ${i} failed:`, err)
      }
      onProgress?.(40 + Math.floor((i + 1) / variants.length * 50))
    }

    onProgress?.(95)
    if (results.length === 0) return null

    // Voting system
    const frequency = {}
    results.forEach(r => { frequency[r] = (frequency[r] ?? 0) + 1 })
    const best = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]
    
    onProgress?.(100)
    
    // ✅ RETURN STRING (bukan object) agar compatible dengan UserUpload.jsx
    return best[0]
  } catch (err) {
    console.error('Plate detection error:', err)
    return null
  }
}