import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ActionButton } from "@/shared/ui/ActionButton"
import { importWorkoutRoutineCsvToDate } from "./importWorkoutRoutineCsv"

type AddExercisesDialogProps = {
  localDate: string
  open: boolean
  profileName: string
  onAdded: () => void
  onOpenChange: (open: boolean) => void
}

export function AddExercisesDialog({
  localDate,
  open,
  profileName,
  onAdded,
  onOpenChange,
}: AddExercisesDialogProps) {
  const [text, setText] = useState("")
  const [adding, setAdding] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      setText("")
      setAdding(false)
    }
  }

  const addExercises = async () => {
    if (adding) {
      return
    }

    setAdding(true)
    await importWorkoutRoutineCsvToDate({
      localDate,
      profileName,
      text,
    })
    onAdded()
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] rounded-md border-white/10 bg-[var(--app-surface-raised)] text-zinc-100 shadow-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Exercises</DialogTitle>
        </DialogHeader>
        <Textarea
          className="min-h-[42dvh] rounded-md border-white/10 bg-[var(--app-surface-muted)] text-base text-zinc-100 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
          placeholder="Paste CSV or an AI response..."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="flex gap-2">
          <ActionButton disabled={adding} tone="save" onClick={addExercises}>
            Add
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
