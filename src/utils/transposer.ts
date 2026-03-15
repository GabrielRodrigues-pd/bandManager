const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Normalizes a note to its index in the chromatic scale (0-11)
 */
function getNoteIndex(note: string): number {
  const sharpIndex = NOTES_SHARP.indexOf(note);
  if (sharpIndex !== -1) return sharpIndex;

  const flatIndex = NOTES_FLAT.indexOf(note);
  if (flatIndex !== -1) return flatIndex;

  // Handle minor/other suffixes by only checking the first 1-2 chars
  const baseNote = note.length > 1 && (note[1] === '#' || note[1] === 'b') 
    ? note.substring(0, 2) 
    : note.substring(0, 1);
  
  const baseSharpIndex = NOTES_SHARP.indexOf(baseNote);
  if (baseSharpIndex !== -1) return baseSharpIndex;

  const baseFlatIndex = NOTES_FLAT.indexOf(baseNote);
  if (baseFlatIndex !== -1) return baseFlatIndex;

  return -1;
}

/**
 * Transposes a single chord string
 */
export function transposeChord(chord: string, semitones: number): string {
  // Regex to match the root note and optional accidental
  const rootRegex = /^([A-G][#b]?)/;
  const match = chord.match(rootRegex);

  if (!match) return chord;

  const root = match[1];
  const suffix = chord.substring(root.length);
  const index = getNoteIndex(root);

  if (index === -1) return chord;

  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  // Prefer sharp or flat based on original or common usage
  // For now, let's use SHARP as default
  const newRoot = NOTES_SHARP[newIndex];

  // Handle slash chords (e.g., C/E)
  if (suffix.includes('/')) {
    const parts = suffix.split('/');
    const bassNote = parts[1];
    const rest = parts[0];
    return newRoot + rest + '/' + transposeChord(bassNote, semitones);
  }

  return newRoot + suffix;
}

/**
 * Transposes an entire text containing chords
 * Assumes chords are either standalone words or contained in brackets/markup
 */
export function transposeText(text: string, semitones: number): string {
  // Simple regex to find things that look like chords: 
  // Capital letter + optional accidental + optional m/7/maj/etc.
  // This is a simplified version; real-world apps might use more complex parsing.
  const chordRegex = /\b[A-G][#b]?(?:m|maj|7|dim|aug|sus[24]?)?(?:\d+)?(?:\/[A-G][#b]?)?\b/g;

  return text.replace(chordRegex, (chord) => {
    return transposeChord(chord, semitones);
  });
}

/**
 * Calculates semitones between two keys
 */
export function getInterval(fromKey: string, toKey: string): number {
  const fromIndex = getNoteIndex(fromKey);
  const toIndex = getNoteIndex(toKey);

  if (fromIndex === -1 || toIndex === -1) return 0;

  let diff = toIndex - fromIndex;
  // Keep it within -6 to +6 range for more natural transposition if desired,
  // or just 0-11. Let's use 0-11 for simplicity now.
  if (diff < 0) diff += 12;
  
  return diff;
}
