type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

const CONFLICT_PREFIXES = ["m", "mx", "my", "mt", "mr", "mb", "ml", "p", "px", "py", "pt", "pr", "pb", "pl", "h", "w"];

function flattenClassNames(input: ClassValue): string[] {
  if (!input) {
    return [];
  }

  if (typeof input === "string" || typeof input === "number") {
    return `${input}`
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);
  }

  if (Array.isArray(input)) {
    return input.flatMap(flattenClassNames);
  }

  if (typeof input === "object") {
    return Object.entries(input)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([className]) => className);
  }

  return [];
}

function getConflictKey(token: string) {
  const [modifier, baseClass] = token.includes(":") ? token.split(/:(.+)/, 2) : ["", token];

  for (const prefix of CONFLICT_PREFIXES) {
    if (baseClass === prefix || baseClass.startsWith(`${prefix}-`)) {
      return `${modifier}:${prefix}`;
    }
  }

  return token;
}

export function cn(...inputs: ClassValue[]) {
  const merged = new Map<string, string>();

  inputs
    .flatMap(flattenClassNames)
    .forEach((token) => merged.set(getConflictKey(token), token));

  return Array.from(merged.values()).join(" ");
}
