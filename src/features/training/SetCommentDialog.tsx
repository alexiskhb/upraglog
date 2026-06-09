import { useState } from "react"
import type { SetEntry } from "@/db/schema"
import { updateSetComment } from "@/db/repositories/workoutsRepo"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { ActionButton } from "@/shared/ui/ActionButton"

type SetCommentDialogProps = {
  set?: SetEntry
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function SetCommentDialog({
  set,
  open,
  onOpenChange,
  onSaved,
}: SetCommentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-sm border-zinc-800 bg-[#15191e] text-zinc-100">
        <DialogHeader>
          <DialogTitle>Set Comment</DialogTitle>
        </DialogHeader>
        {set && (
          <SetCommentForm
            key={set.id}
            set={set}
            onCancel={() => onOpenChange(false)}
            onSaved={() => {
              onSaved()
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SetCommentForm({
  set,
  onCancel,
  onSaved,
}: {
  set: SetEntry
  onCancel: () => void
  onSaved: () => void
}) {
  const [comment, setComment] = useState(set.comment ?? "")

  const saveComment = async () => {
    await updateSetComment(set.id, comment)
    onSaved()
  }

  return (
    <>
      <Textarea
        className="min-h-32 rounded-sm border-cyan-500/35 bg-[#090b0d] text-base text-zinc-100 focus-visible:ring-cyan-500"
        placeholder="Rest, form notes, machine settings..."
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <div className="flex gap-2">
        <ActionButton tone="save" onClick={saveComment}>
          Save
        </ActionButton>
        <ActionButton tone="secondary" onClick={onCancel}>
          Clear
        </ActionButton>
      </div>
    </>
  )
}
