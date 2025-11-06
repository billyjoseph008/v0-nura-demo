
type ClassValue =
  | string
  | number
  | null
  | undefined
  | boolean
  | ClassValue[]
  | { [key: string]: ClassValue | boolean };

function toClassList(value: ClassValue): string[] {
  if (!value) return []
  if (typeof value === "string" || typeof value === "number") {
    return [String(value)]
  }
  if (Array.isArray(value)) {
    return value.flatMap(toClassList)
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .flatMap(([key, enabled]) => {
        if (typeof enabled === "object" && enabled !== null) {
          return [key, ...toClassList(enabled as ClassValue)]
        }
        return [key]
      })
  }
  return []
}

export function cn(...inputs: ClassValue[]) {
  return Array.from(
    new Set(
      inputs
        .flatMap(toClassList)
        .join(" ")
        .split(/\s+/)
        .filter(Boolean),
    ),
  ).join(" ")
}
