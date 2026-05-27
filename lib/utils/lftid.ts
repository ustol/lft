const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateLFTID(prefix = "LFT"): string {
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `${prefix}-${id}`;
}

export function isValidLFTID(value: string): boolean {
  return /^LFT-[A-Z0-9]{6}$/.test(value.toUpperCase().trim());
}

export function formatLFTID(value: string): string {
  return value.toUpperCase().trim();
}
