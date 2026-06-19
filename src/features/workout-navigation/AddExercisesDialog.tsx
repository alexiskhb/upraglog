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
      <DialogContent className="top-4 max-h-[calc(100dvh-2rem)] translate-y-0 overflow-y-auto rounded-md border-white/10 bg-[var(--app-surface-raised)] text-zinc-100 shadow-2xl sm:top-1/2 sm:max-w-lg sm:-translate-y-1/2">
        <DialogHeader>
          <DialogTitle>Paste Workout</DialogTitle>
        </DialogHeader>
        <Textarea
          className="min-h-0 resize-none overflow-y-auto rounded-md border-white/10 bg-[var(--app-surface-muted)] text-base text-zinc-100 [field-sizing:fixed] focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
          placeholder="Use Share to send your history with instructions to an AI assistant, then paste its response here.

You can also Copy Workout from another day."
          rows={6}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="sticky bottom-0 z-10 flex shrink-0 gap-2 bg-[var(--app-surface-raised)] pt-1">
          <ActionButton disabled={adding} tone="save" onClick={addExercises}>
            Add
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
