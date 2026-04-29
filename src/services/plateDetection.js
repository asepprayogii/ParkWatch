// src/services/plateDetection.js

/**
 * Format plat nomor Indonesia dengan spasi otomatis
 * Input: "BK7272JT" atau "BK 7272 JT" → Output: "BK 7272 JT"
 */
export function formatIndonesianPlate(text) {
  if (!text) return null;
  
  // Bersihkan dan uppercase
  const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Pattern plat Indonesia: PREFIX(1-2 huruf) + NUMBER(1-4 digit) + SUFFIX(1-3 huruf)
  const pattern = /^([A-Z]{1,2})([0-9]{1,4})([A-Z]{1,3})$/;
  const match = cleaned.match(pattern);
  
  if (match) {
    const prefix = match[1];
    const number = match[2];
    const suffix = match[3];
    
    // Validasi prefix (kode daerah Indonesia)
    const validPrefixes = [
      'A','AA','AB','AD','AE','AG','B','BA','BB','BD','BE','BG','BH','BK','BL','BM','BN','BP','BW',
      'D','DA','DB','DC','DD','DE','DK','DL','DM','DN','DT','DW',
      'E','EA','EB','ED','EE','F','G','H','K','KH','KT','L','M','N','NA','NB','ND','W','Z'
    ];
    
    if (validPrefixes.includes(prefix)) {
      return `${prefix} ${number} ${suffix}`;
    }
  }
  
  // Fallback: return null jika tidak valid
  return null;
}

/**
 * Deteksi plat nomor menggunakan PlateRecognizer API
 * Return: String formatted "BK 7272 JT" atau null
 */
export async function detectPlateWithAPI(file) {
  const API_TOKEN = import.meta.env.VITE_PLATE_RECOGNIZER_API_KEY;
  const API_URL = 'https://api.platerecognizer.com/v1/plate-reader/';

  const formData = new FormData();
  formData.append('upload', file);
  formData.append('regions', 'id'); // Indonesia

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${API_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const plate = data.results[0];
      const rawPlate = plate.plate.toUpperCase();
      
      // ✅ FORMAT DENGAN SPASI
      const formattedPlate = formatIndonesianPlate(rawPlate);
      
      if (formattedPlate) {
        return formattedPlate; // Return string: "BK 7272 JT"
      }
    }

    return null;
  } catch (error) {
    console.error('PlateRecognizer error:', error);
    return null;
  }
}

/**
 * Fallback: Validasi manual format Indonesia
 */
export function validateIndonesianPlate(text) {
  return formatIndonesianPlate(text);
}