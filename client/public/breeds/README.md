# Breed Images for Module 3

This folder contains images for goat breeds displayed in Module 3 (Lactation and Productive Life).

## Image Requirements

- **Format:** JPG or PNG
- **Size:** Recommended 400x400px minimum (square aspect ratio)
- **Quality:** High quality, clear image of the breed
- **Background:** Preferably clean/neutral background

## File Naming Convention

Images should be named using lowercase with hyphens, matching the breed names:

- `murciano-granadina.jpg`
- `saanen.jpg`
- `alpine.jpg`
- `nubia.jpg`
- `lamancha.jpg`
- `toggenburg.jpg`
- `holandesa.jpg` (for Dutch/Holandesa breeds)
- `default.jpg` (fallback image)

## Current Status

⚠️ **Placeholder images are currently in place.** Please replace these with actual breed photographs.

## How Images Are Used

1. **Ranking Panel:** Circular thumbnails (48x48px) next to breed names
2. **Comparison View:** May be displayed in breed cards
3. **Fallback:** If an image fails to load, breed initials are shown instead

## Adding New Breeds

When adding a new breed to the database:
1. Add the breed image to this folder
2. Use the naming convention above (lowercase, hyphens)
3. Update `client/src/utils/breedImages.js` if the breed name doesn't match the standard mapping

## Image Sources

Ensure all images are:
- ✅ Properly licensed or owned
- ✅ High quality and representative of the breed
- ✅ Consistent in style across all breeds
- ✅ Optimized for web (compressed but clear)

---

**Contact:** For questions about breed images, contact the development team.
