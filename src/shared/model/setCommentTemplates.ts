export const defaultSetCommentTemplates = ["Left side only", "Right side only"]

export function normalizeSetCommentTemplate(template?: string) {
  return template?.trim() ?? ""
}

export function normalizeSetCommentTemplates(templates?: string[]) {
  const normalizedTemplates: string[] = []
  const seen = new Set<string>()

  for (const template of templates ?? []) {
    const normalized = normalizeSetCommentTemplate(template)
    const key = normalized.toLocaleLowerCase()

    if (!normalized || seen.has(key)) {
      continue
    }

    normalizedTemplates.push(normalized)
    seen.add(key)
  }

  return normalizedTemplates.length > 0
    ? normalizedTemplates
    : [...defaultSetCommentTemplates]
}
