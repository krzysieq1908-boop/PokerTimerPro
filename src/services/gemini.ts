import { BlindLevel } from "../types";

const DEFAULT_LEVEL_DURATION = 15;
const DEFAULT_BREAK_DURATION = 5;

export async function parseStructureFromFile(file: File): Promise<BlindLevel[]> {
  if (file.type.startsWith("image/")) {
    throw new Error("Image import is not supported without OCR or an external API.");
  }

  const text = await readFileAsText(file);
  return parseStructureText(text);
}

function parseStructureText(text: string): BlindLevel[] {
  const normalizedText = text
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "\n");

  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const levels = lines
    .map((line, index) => parseLine(line, index))
    .filter((level): level is BlindLevel => level !== null);

  return levels.map((level, index) => ({
    ...level,
    id: level.id || randomId(),
    label: level.label || (level.isBreak ? "Break" : `Level ${index + 1}`),
  }));
}

function parseLine(line: string, index: number): BlindLevel | null {
  const duration = extractDuration(line);
  const isBreak = /\bbreak\b/i.test(line);

  if (isBreak) {
    return {
      id: `break-${index}`,
      smallBlind: 0,
      bigBlind: 0,
      duration: duration ?? DEFAULT_BREAK_DURATION,
      isBreak: true,
      label: extractBreakLabel(line),
    };
  }

  const slashMatch = line.match(
    /(\d[\d\s,.]*)\s*[\/\\-]\s*(\d[\d\s,.]*)(?:\s*[\/\\-]\s*(\d[\d\s,.]*))?/,
  );

  if (slashMatch) {
    const smallBlind = toNumber(slashMatch[1]);
    const bigBlind = toNumber(slashMatch[2]);
    const ante = slashMatch[3] ? toNumber(slashMatch[3]) : undefined;

    if (smallBlind > 0 && bigBlind > 0) {
      return {
        id: `level-${index}`,
        smallBlind,
        bigBlind,
        ante: ante && ante > 0 ? ante : undefined,
        duration: duration ?? DEFAULT_LEVEL_DURATION,
        isBreak: false,
        label: extractLevelLabel(line),
      };
    }
  }

  const separatedValues = line
    .split(/[\t,;|]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const numericValues = separatedValues
    .map((part) => toNumber(part))
    .filter((value) => value > 0);

  if (numericValues.length >= 2) {
    return {
      id: `level-${index}`,
      smallBlind: numericValues[0],
      bigBlind: numericValues[1],
      ante: numericValues[2] && numericValues[2] !== duration ? numericValues[2] : undefined,
      duration: duration ?? extractDurationFromColumns(separatedValues) ?? DEFAULT_LEVEL_DURATION,
      isBreak: false,
      label: extractLevelLabel(line),
    };
  }

  return null;
}

function extractDuration(line: string): number | undefined {
  const minuteMatch = line.match(/(\d+)\s*(?:m|min|mins|minute|minutes)\b/i);

  if (minuteMatch) {
    return Number(minuteMatch[1]);
  }

  return undefined;
}

function extractDurationFromColumns(parts: string[]): number | undefined {
  for (const part of parts) {
    if (/\b(?:m|min|mins|minute|minutes)\b/i.test(part)) {
      const parsed = toNumber(part);
      if (parsed > 0) {
        return parsed;
      }
    }
  }

  return undefined;
}

function extractBreakLabel(line: string): string {
  const cleaned = line.replace(/\s+/g, " ").trim();
  return cleaned || "Break";
}

function extractLevelLabel(line: string): string | undefined {
  const match = line.match(/\b(level\s*\d+)\b/i);
  return match ? match[1].replace(/\s+/g, " ") : undefined;
}

function toNumber(value: string): number {
  const normalized = value.replace(/[^\d]/g, "");
  return normalized ? Number(normalized) : 0;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 11);
}
