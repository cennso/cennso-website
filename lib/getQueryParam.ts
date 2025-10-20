export function getQueryParam(path: string, key: string): string | undefined {
  const match = path.match(new RegExp(`[&?]${key}=(.*?)(&|$)`))
  if (!match) return undefined
  return decodeURIComponent(match[1])
}
