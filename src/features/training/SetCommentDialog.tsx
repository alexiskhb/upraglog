import { useEffect, useRef, useState } from "react"
import type { SetEntry } from "@/db/schema"
import { getSettings } from "@/db/repositories/settingsRepo"
import { updateSetComment } from "@/db/repositories/workoutsRepo"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
      <DialogContent className="top-4 flex max-h-[calc(100dvh-2rem)] translate-y-0 flex-col gap-3 overflow-y-auto rounded-md border-white/10 bg-[var(--app-surface-raised)] text-zinc-100 shadow-2xl sm:top-[42%] sm:-translate-y-1/2">
        <DialogHeader className="shrink-0 pr-8">
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
  const [templates, setTemplates] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false

    getSettings().then((settings) => {
      if (!cancelled) {
        setTemplates(settings.setCommentTemplates)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const saveComment = async () => {
    await updateSetComment(set.id, comment)
    onSaved()
  }

  const insertTemplate = (template: string) => {
    const input = inputRef.current
    const selectionStart = input?.selectionStart ?? comment.length
    const selectionEnd = input?.selectionEnd ?? comment.length
    const insertion =
      selectionStart === comment.length && comment && !comment.endsWith(" ")
        ? ` ${template}`
        : template
    const nextComment = [
      comment.slice(0, selectionStart),
      insertion,
      comment.slice(selectionEnd),
    ].join("")
    const nextCursorPosition = selectionStart + insertion.length

    setComment(nextComment)
    requestAnimationFrame(() => {
      input?.focus()
      input?.setSelectionRange(nextCursorPosition, nextCursorPosition)
    })
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {templates.length > 0 && (
        <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1">
          {templates.map((template) => (
            <button
              className="h-10 shrink-0 cursor-pointer rounded-md border border-white/10 bg-white/5 px-3 text-sm text-zinc-200 transition hover:border-cyan-300/50 hover:bg-white/10"
              key={template}
              type="button"
              onClick={() => insertTemplate(template)}
            >
              {template}
            </button>
          ))}
        </div>
      )}
      <Input
        className="h-11 rounded-md border-white/10 bg-[var(--app-surface-muted)] text-base text-zinc-100 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
        placeholder="Rest, form notes, machine settings..."
        ref={inputRef}
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
    </div>
  )
}
