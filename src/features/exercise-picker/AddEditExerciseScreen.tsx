import { useEffect, useMemo, useState } from "react"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { z } from "zod"
import type {
  ExerciseCategory,
  ExerciseSetIncrements,
  ExerciseType,
  SetFieldKey,
} from "@/db/schema"
import {
  createExercise,
  getExercise,
  getExerciseCategories,
  updateExercise,
} from "@/db/repositories/exercisesRepo"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { ActionButton } from "@/shared/ui/ActionButton"
import {
  defaultExerciseCategories,
  exerciseTypes,
  formatExerciseCategory,
  formatExerciseType,
} from "@/shared/model/exercises"
import {
  defaultSetIncrements,
  getSetIncrement,
  setFieldsForExerciseType,
} from "@/shared/model/setFields"
import { useAppStore } from "@/shared/store/appStore"

const exerciseFormSchema = z.object({
  id: z.string().trim().min(1, "Name is required."),
  category: z.string().trim().min(1, "Category is required."),
  exerciseType: z.enum(exerciseTypes),
  isFavorite: z.boolean(),
})

type ExerciseFormBase = z.infer<typeof exerciseFormSchema>
type IncrementFormState = Record<SetFieldKey, string>
type ExerciseFormState = ExerciseFormBase & {
  setIncrements: IncrementFormState
}

const incrementKeys = Object.keys(defaultSetIncrements) as SetFieldKey[]

function buildIncrementForm(
  setIncrements?: ExerciseSetIncrements,
): IncrementFormState {
  return Object.fromEntries(
    incrementKeys.map((key) => [
      key,
      getSetIncrement(setIncrements, key).toString(),
    ]),
  ) as IncrementFormState
}

const defaultForm: ExerciseFormState = {
  id: "",
  category: "Custom",
  exerciseType: "strength",
  isFavorite: false,
  setIncrements: buildIncrementForm(),
}

export function AddEditExerciseScreen() {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const exerciseId = useMemo(() => {
    const match = pathname.match(/^\/exercise\/(.+)\/edit$/)
    return match ? decodeURIComponent(match[1]) : undefined
  }, [pathname])
  const [categories, setCategories] = useState<ExerciseCategory[]>([
    ...defaultExerciseCategories,
  ])
  const [form, setForm] = useState<ExerciseFormState>(defaultForm)
  const [error, setError] = useState<string | undefined>()
  const incrementFields = useMemo(
    () => setFieldsForExerciseType(form.exerciseType),
    [form.exerciseType],
  )
  const categoryOptions = useMemo(() => {
    if (categories.includes(form.category)) {
      return categories
    }

    return [...categories, form.category]
  }, [categories, form.category])

  useEffect(() => {
    let cancelled = false

    getExerciseCategories().then((nextCategories) => {
      if (!cancelled && nextCategories.length > 0) {
        setCategories(nextCategories)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!exerciseId) {
      return
    }

    let cancelled = false

    getExercise(exerciseId).then((exercise) => {
      if (!cancelled && exercise) {
        setForm({
          id: exercise.id,
          category: exercise.category,
          exerciseType: exercise.exerciseType,
          isFavorite: exercise.isFavorite,
          setIncrements: buildIncrementForm(exercise.setIncrements),
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [exerciseId])

  const saveExercise = async () => {
    const result = exerciseFormSchema.safeParse(form)

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Exercise is invalid.")
      return
    }

    const setIncrements: ExerciseSetIncrements = {}

    for (const field of incrementFields) {
      const value = Number(form.setIncrements[field.key])

      if (!Number.isFinite(value) || value <= 0) {
        setError(`${field.label} increment must be greater than 0.`)
        return
      }

      setIncrements[field.key] = value
    }

    try {
      if (exerciseId) {
        await updateExercise(exerciseId, { ...result.data, setIncrements })
      } else {
        await createExercise({ ...result.data, setIncrements })
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Exercise could not be saved.",
      )
      return
    }

    bumpRefresh()
    void navigate({ to: "/picker" })
  }

  return (
    <ScreenContainer className="gap-4">
      <div className="pt-3">
        <h1 className="text-[17px] font-semibold text-zinc-50">
          {exerciseId ? "Edit Exercise" : "Add Exercise"}
        </h1>
        <div className="mt-2 h-px bg-cyan-300/50" />
      </div>

      {error && (
        <div className="rounded-md border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="app-surface space-y-4 rounded-md p-3.5">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Name
          </Label>
          <Input
            className="h-11 rounded-md border-white/10 bg-[var(--app-surface-muted)] text-base text-zinc-100 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
            value={form.id}
            onChange={(event) =>
              setForm((current) => ({ ...current, id: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Category
          </Label>
          <select
            className="h-11 w-full rounded-md border border-white/10 bg-[var(--app-surface-muted)] px-3 text-base text-zinc-100 outline-none focus:border-cyan-300/60"
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value as ExerciseCategory,
              }))
            }
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {formatExerciseCategory(category)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Exercise Type
          </Label>
          <select
            className="h-11 w-full rounded-md border border-white/10 bg-[var(--app-surface-muted)] px-3 text-base text-zinc-100 outline-none focus:border-cyan-300/60"
            value={form.exerciseType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                exerciseType: event.target.value as ExerciseType,
              }))
            }
          >
            {exerciseTypes.map((type) => (
              <option key={type} value={type}>
                {formatExerciseType(type)}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span className="text-sm text-zinc-200">Favorite</span>
          <Switch
            checked={form.isFavorite}
            className="data-checked:bg-cyan-500"
            onCheckedChange={(isFavorite) =>
              setForm((current) => ({ ...current, isFavorite }))
            }
          />
        </label>
      </div>

      <div className="app-surface space-y-4 rounded-md p-3.5">
        <div className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
          Increment Values
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {incrementFields.map((field) => (
            <div className="space-y-2" key={field.key}>
              <Label className="text-xs uppercase tracking-normal text-zinc-400">
                {field.label}
              </Label>
              <Input
                className="h-11 rounded-md border-white/10 bg-[var(--app-surface-muted)] text-base text-zinc-100 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
                inputMode="decimal"
                min="0"
                step="any"
                type="number"
                value={form.setIncrements[field.key]}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    setIncrements: {
                      ...current.setIncrements,
                      [field.key]: event.target.value,
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <ActionButton tone="save" onClick={saveExercise}>
          Save
        </ActionButton>
        <ActionButton tone="secondary" onClick={() => void navigate({ to: "/picker" })}>
          Cancel
        </ActionButton>
      </div>
    </ScreenContainer>
  )
}
