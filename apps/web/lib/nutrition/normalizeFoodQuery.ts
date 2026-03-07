export function normalizeFoodQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/\s+/g, "");
}
