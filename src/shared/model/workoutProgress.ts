import type { SetEntry } from "@/db/schema"

export type SetProgress = {
  finishedSets: number
  totalSets: number
  percentComplete: number
}

export function countFinishedSets(sets: SetEntry[]) {
  return sets.filter((set) => Boolean(set.finishedAt)).length
}

export function countTotalSets(sets: SetEntry[]) {
  return sets.length
}

export function getSetProgress(sets: SetEntry[]): SetProgress {
  const totalSets = countTotalSets(sets)
  const finishedSets = countFinishedSets(sets)

  return {
    finishedSets,
    totalSets,
    percentComplete:
      totalSets === 0 ? 0 : Math.round((finishedSets / totalSets) * 100),
  }
}
