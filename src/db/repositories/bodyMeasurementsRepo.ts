import { db } from "@/db/db"
import type { BodyMeasurementEntry } from "@/db/schema"
import { createId } from "@/shared/model/ids"

export async function addBodyMeasurement(input: {
  localDate: string
  measurementType: string
  value: number
  unit: string
}) {
  const now = new Date().toISOString()
  const entry: BodyMeasurementEntry = {
    id: createId("body"),
    localDate: input.localDate,
    measurementType: input.measurementType.trim(),
    value: input.value,
    unit: input.unit.trim(),
    createdAt: now,
    updatedAt: now,
  }

  await db.bodyMeasurements.add(entry)
  return entry
}

export async function getRecentBodyMeasurements(limit = 30) {
  const entries = await db.bodyMeasurements
    .orderBy("createdAt")
    .reverse()
    .limit(limit)
    .toArray()

  return entries.sort((a, b) => {
    if (a.localDate === b.localDate) {
      return b.createdAt.localeCompare(a.createdAt)
    }

    return b.localDate.localeCompare(a.localDate)
  })
}

export async function deleteBodyMeasurement(entryId: string) {
  await db.bodyMeasurements.delete(entryId)
}
