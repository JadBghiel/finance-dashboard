const DEFAULT_COLORS = [
  '#4caf50', '#f44336', '#2196f3', '#ff9800', '#9c27b0',
  '#00bcd4', '#ffc107', '#8bc34a', '#e91e63', '#607d8b'
];

// NOW:simple color choice based on key, no user edits
export function getColorForKey(key: string): string {
  // key examples: 'cat:3', 'acc:1'
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % DEFAULT_COLORS.length;
  return DEFAULT_COLORS[idx];
}

export default getColorForKey;