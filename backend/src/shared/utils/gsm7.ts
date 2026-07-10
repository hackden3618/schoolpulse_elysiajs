/**
 * GSM 7-bit encoding segment calculator.
 *
 * Single SMS:    160 characters
 * Concatenated:  153 characters per segment
 *                (7 bytes reserved for UDH header)
 *
 * Segment cost table (GSM-7):
 *   0 – 160   → 1 segment
 * 161 – 306   → 2 segments
 * 307 – 459   → 3 segments
 * 460 – 612   → 4 segments
 * 613 – 765   → 5 segments
 * 766 – 918   → 6 segments
 * 919 – 1071  → 7 segments
 * 1072 – 1224 → 8 segments
 * 1225 – 1377 → 9 segments
 * 1378 – 1530 → 10 segments
 */

const SINGLE_SEGMENT_MAX = 160;
const CONCAT_SEGMENT_MAX = 153;

export interface Gsm7SegmentInfo {
  characterCount: number;
  segmentCount: number;
  perSegmentMax: number;
  remaining: number;
}

export function calculateGsm7Segments(text: string): Gsm7SegmentInfo {
  const charCount = text.length;

  let segments: number;
  if (charCount <= SINGLE_SEGMENT_MAX) {
    segments = 1;
  } else {
    segments = Math.ceil(charCount / CONCAT_SEGMENT_MAX);
  }

  const maxChars = segments === 1
    ? SINGLE_SEGMENT_MAX
    : segments * CONCAT_SEGMENT_MAX;

  return {
    characterCount: charCount,
    segmentCount: segments,
    perSegmentMax: segments === 1 ? SINGLE_SEGMENT_MAX : CONCAT_SEGMENT_MAX,
    remaining: Math.max(0, maxChars - charCount),
  };
}

export function segmentCostTable(): { maxChars: number; segments: number }[] {
  const table: { maxChars: number; segments: number }[] = [];
  for (let s = 1; s <= 10; s++) {
    table.push({
      maxChars: s === 1 ? SINGLE_SEGMENT_MAX : s * CONCAT_SEGMENT_MAX,
      segments: s,
    });
  }
  return table;
}
