import { useEffect, useMemo, useState } from "react"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { z } from "zod"
import type { ExerciseCategory, ExerciseType } from "@/db/schema"
import {
  createExercise,
  getExercise,
  updateExercise,
} from "@/db/repositories/exercisesRepo"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { ActionButton } from "@/shared/ui/ActionButton"
import {
  exerciseCategories,
  exerciseTypes,
  formatExerciseCategory,
  formatExerciseType,
} from "@/shared/model/exercises"
import { useAppStore } from "@/shared/store/appStore"

const exerciseFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  category: z.enum(exerciseCategories),
  exerciseType: z.enum(exerciseTypes),
  isFavorite: z.boolean(),
})

type ExerciseFormState = z.infer<typeof exerciseFormSchema>

const defaultForm: ExerciseFormState = {
  name: "",
  category: "custom",
  exerciseType: "strength",
  isFavorite: false,
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
  const [form, setForm] = useState<ExerciseFormState>(defaultForm)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (!exerciseId) {
      return
    }

    let cancelled = false

    getExercise(exerciseId).then((exercise) => {
      if (!cancelled && exercise) {
        setForm({
          name: exercise.name,
          category: exercise.category,
          exerciseType: exercise.exerciseType,
          isFavorite: exercise.isFavorite,
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

    if (exerciseId) {
      await updateExercise(exerciseId, result.data)
    } else {
      await createExercise(result.data)
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
        <div className="mt-2 h-px bg-cyan-500/70" />
      </div>

      {error && (
        <div className="rounded-sm border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="space-y-4 rounded-sm bg-[#15191e] p-3">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Name
          </Label>
          <Input
            className="h-11 rounded-sm border-cyan-500/35 bg-[#090b0d] text-base text-zinc-100 focus-visible:ring-cyan-500"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Category
          </Label>
          <select
            className="h-11 w-full rounded-sm border border-cyan-500/35 bg-[#090b0d] px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value as ExerciseCategory,
              }))
            }
          >
            {exerciseCategories.map((category) => (
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
            className="h-11 w-full rounded-sm border border-cyan-500/35 bg-[#090b0d] px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
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

        <label className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
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

      <div className="flex gap-2">
        <ActionButton tone="save" onClick={saveExercise}>
          Save
        </ActionButton>
        <ActionButton tone="secondary" onClick={() => void navigate({ to: "/picker" })}>
          Clear
        </ActionButton>
      </div>
    </ScreenContainer>
  )
}
