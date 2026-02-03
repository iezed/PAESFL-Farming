/**
 * Get the image path for a breed
 * @param {string} breedName - The name of the breed
 * @returns {string} - The path to the breed image
 */
export function getBreedImage(breedName) {
  if (!breedName) return '/breeds/default.jpg';
  
  // Direct mapping of breed names to image files (case-insensitive)
  const breedMap = {
    // Exact matches
    'dutch': '/breeds/Dutch.png',
    'alpina (genérica)': '/breeds/AlpineGenerica.png',
    'alpina generica': '/breeds/AlpineGenerica.png',
    'alpina genérica': '/breeds/AlpineGenerica.png',
    'alpina americana': '/breeds/ALPINE.png',
    'alpina británica': '/breeds/ALPINE.png',
    'alpina britanica': '/breeds/ALPINE.png',
    'alpina francesa': '/breeds/ALPINE.png',
    'alpine': '/breeds/ALPINE.png',
    'alpina': '/breeds/ALPINE.png',
    'saanen (genérica)': '/breeds/ALPINE.png', // Note: SAANEN.png not available, using ALPINE as placeholder
    'saanen generica': '/breeds/ALPINE.png',
    'saanen genérica': '/breeds/ALPINE.png',
    'saanen': '/breeds/ALPINE.png',
    'saanen americana': '/breeds/ALPINE.png',
    'saanen francesa': '/breeds/ALPINE.png',
    'saanen': '/breeds/ALPINE.png',
    'lamancha': '/breeds/LAMANCHA.png',
    'la-mancha': '/breeds/LAMANCHA.png',
    'la mancha': '/breeds/LAMANCHA.png',
    'toggenburg americana': '/breeds/TOGGUNBURG.png',
    'toggenburg': '/breeds/TOGGUNBURG.png',
    'sable': '/breeds/Sable.png',
    'florida': '/breeds/FLORIDA.png',
    'poitevine': '/breeds/POITEVINE.png',
    'murciano-granadina': '/breeds/MURCIANA.png',
    'murciano granadina': '/breeds/MURCIANA.png',
    'murciana': '/breeds/MURCIANA.png',
    'malagueña': '/breeds/MALAGUENA.png',
    'malaguena': '/breeds/MALAGUENA.png',
    'oberhasli': '/breeds/Oberhasli.png',
    'nubian': '/breeds/NUBIAN.png',
    'nubia': '/breeds/NUBIAN.png',
    'majorera': '/breeds/MAJORERA.png',
    'serrana': '/breeds/Serrana.png',
    'nigerian dwarf': '/breeds/NigerianDwarf.PNG',
    'nigerian': '/breeds/NigerianDwarf.PNG',
    'mestiza (genérica)': '/breeds/ALPINE.png', // Using Alpine as generic placeholder
    'mestiza generica': '/breeds/ALPINE.png',
    'mestiza genérica': '/breeds/ALPINE.png',
    'mestiza': '/breeds/ALPINE.png',
    'criolla argentina': '/breeds/ALPINE.png', // Placeholder - no specific image
    'criolla mexicana': '/breeds/CriollaMexicana.png',
    'criolla (genérica)': '/breeds/ALPINE.png', // Placeholder
    'criolla generica': '/breeds/ALPINE.png',
    'criolla genérica': '/breeds/ALPINE.png',
    'criolla colombiana': '/breeds/Criollacolombiana.png',
    'criolla venezolana': '/breeds/CriollaVenezolana.png',
    'criolla peruana': '/breeds/ALPINE.png', // Placeholder - no specific image
    'criolla': '/breeds/ALPINE.png',
  };
  
  // Normalize breed name for matching
  const normalized = breedName
    .toLowerCase()
    .trim()
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ');
  
  // Try exact match first
  if (breedMap[normalized]) {
    return breedMap[normalized];
  }
  
  // Try partial matches
  for (const [key, value] of Object.entries(breedMap)) {
    const keyNormalized = key.toLowerCase().trim();
    if (normalized.includes(keyNormalized) || keyNormalized.includes(normalized)) {
      return value;
    }
  }
  
  // Special cases for compound names
  if (normalized.includes('dutch') || normalized.includes('holandesa')) {
    return '/breeds/Dutch.png';
  }
  if (normalized.includes('alpina') || normalized.includes('alpine')) {
    if (normalized.includes('generica') || normalized.includes('genérica')) {
      return '/breeds/AlpineGenerica.png';
    }
    return '/breeds/ALPINE.png';
  }
  if (normalized.includes('saanen')) {
    // Note: SAANEN.png image not available - using ALPINE as placeholder
    // TODO: Add proper SAANEN.png image file
    return '/breeds/ALPINE.png';
  }
  if (normalized.includes('lamancha') || normalized.includes('la-mancha')) {
    return '/breeds/LAMANCHA.png';
  }
  if (normalized.includes('toggenburg')) {
    return '/breeds/TOGGUNBURG.png';
  }
  if (normalized.includes('murciano') || normalized.includes('murciana')) {
    return '/breeds/MURCIANA.png';
  }
  if (normalized.includes('malagueña') || normalized.includes('malaguena')) {
    return '/breeds/MALAGUENA.png';
  }
  if (normalized.includes('criolla')) {
    if (normalized.includes('mexicana')) {
      return '/breeds/CriollaMexicana.png';
    }
    if (normalized.includes('colombiana')) {
      return '/breeds/Criollacolombiana.png';
    }
    if (normalized.includes('venezolana')) {
      return '/breeds/CriollaVenezolana.png';
    }
    return '/breeds/ALPINE.png'; // Generic Criolla placeholder
  }
  
  // Default image
  return '/breeds/default.jpg';
}

/**
 * Get breed initials for placeholder
 * @param {string} breedName - The name of the breed
 * @returns {string} - The initials (max 2 characters)
 */
export function getBreedInitials(breedName) {
  if (!breedName) return '??';
  
  const words = breedName.split(/[\s-]+/).filter(w => w.length > 0);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
