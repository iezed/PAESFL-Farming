/**
 * Get the image path for a breed
 * @param {string} breedName - The name of the breed
 * @returns {string} - The path to the breed image
 */
export function getBreedImage(breedName) {
  if (!breedName) return '/breeds/default.jpg';
  
  // Normalize breed name to match file names
  const normalized = breedName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .replace(/murciano-granadina/i, 'murciano-granadina')
    .replace(/saanen/i, 'saanen')
    .replace(/alpine/i, 'alpine')
    .replace(/alpina/i, 'alpine')
    .replace(/nubia/i, 'nubia')
    .replace(/lamancha/i, 'lamancha')
    .replace(/la-mancha/i, 'lamancha')
    .replace(/toggenburg/i, 'toggenburg')
    .replace(/holandesa/i, 'holandesa')
    .replace(/dutch/i, 'holandesa');
  
  // Map of breed names to image files
  const breedMap = {
    'murciano-granadina': '/breeds/murciano-granadina.jpg',
    'saanen': '/breeds/saanen.jpg',
    'alpine': '/breeds/alpine.jpg',
    'alpina': '/breeds/alpine.jpg',
    'nubia': '/breeds/nubia.jpg',
    'lamancha': '/breeds/lamancha.jpg',
    'la-mancha': '/breeds/lamancha.jpg',
    'toggenburg': '/breeds/toggenburg.jpg',
    'holandesa': '/breeds/holandesa.jpg',
    'holandesa-dutch': '/breeds/holandesa.jpg',
  };
  
  // Try to find exact match
  if (breedMap[normalized]) {
    return breedMap[normalized];
  }
  
  // Try to find partial match
  for (const [key, value] of Object.entries(breedMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
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
