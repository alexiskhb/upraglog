export const defaultProfileName = "Default"
export const defaultProfileNames = [defaultProfileName, "Cardio"]

export function normalizeProfileName(profileName?: string) {
  return profileName?.trim() ?? ""
}

export function normalizeProfileList(profileNames?: string[]) {
  const profiles: string[] = []
  const seen = new Set<string>()

  for (const profileName of profileNames ?? []) {
    const normalized = normalizeProfileName(profileName)
    const key = normalized.toLocaleLowerCase()

    if (!normalized || seen.has(key)) {
      continue
    }

    profiles.push(normalized)
    seen.add(key)
  }

  return profiles.length > 0 ? profiles : [...defaultProfileNames]
}

export function resolveSelectedProfile(
  profileNames?: string[],
  selectedProfile?: string,
) {
  const profiles = normalizeProfileList(profileNames)
  const normalizedSelected = selectedProfile
    ? normalizeProfileName(selectedProfile)
    : ""
  const existingSelected = profiles.find(
    (profileName) =>
      profileName.toLocaleLowerCase() ===
      normalizedSelected.toLocaleLowerCase(),
  )

  return {
    profiles,
    selectedProfile: existingSelected ?? profiles[0],
  }
}
