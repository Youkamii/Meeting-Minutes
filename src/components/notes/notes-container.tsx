"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotesTimeline } from "./notes-timeline";
import type { InternalNote, NoteTag } from "@/types";

interface NotesContainerProps {
  ownerType: string;
  ownerId: string;
}

export function NotesContainer({ ownerType, ownerId }: NotesContainerProps) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: InternalNote[] }>({
    queryKey: ["notes", ownerType, ownerId],
    queryFn: () =>
      fetch(
        `/api/notes?owner_type=${ownerType}&owner_id=${ownerId}`,
      ).then((r) => r.json()),
  });

  const addNote = useMutation({
    mutationFn: (noteData: {
      owner_type: string;
      owner_id: string;
      title?: string;
      body: string;
      tag?: NoteTag;
    }) =>
      fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes", ownerType, ownerId] });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-[var(--muted-foreground)]">로딩 중...</p>;
  }

  return (
    <NotesTimeline
      notes={data?.data ?? []}
      ownerType={ownerType}
      ownerId={ownerId}
      onAdd={(noteData) => addNote.mutate(noteData)}
      isAdding={addNote.isPending}
    />
  );
}
