"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordMedia } from "@/app/(members)/animals/actions";

export function MediaUploader({ animalId, ownerId }: { animalId: string; ownerId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function upload(files: FileList) {
    setError("");
    const supabase = createClient();
    for (const file of Array.from(files)) {
      const kind = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "photo" : null;
      if (!kind) {
        setError(`${file.name} isn't a photo or video.`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError(`${file.name} is over 50 MB.`);
        continue;
      }
      setBusy(`Uploading ${file.name}…`);
      const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${ownerId}/${animalId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
      if (upErr) {
        setError(`${file.name}: ${upErr.message}`);
        continue;
      }
      const res = await recordMedia(animalId, path, kind);
      if (!res.ok) setError(res.error ?? "Upload failed");
    }
    setBusy("");
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <label className="btn-secondary cursor-pointer">
        {busy || "Add photos or videos"}
        <input
          ref={input}
          type="file"
          accept="image/*,video/*"
          multiple
          className="sr-only"
          disabled={!!busy}
          onChange={(e) => e.target.files && upload(e.target.files)}
          data-testid="media-input"
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
