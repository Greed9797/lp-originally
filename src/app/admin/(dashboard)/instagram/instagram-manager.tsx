"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Trash2, UploadCloud } from "lucide-react";
import type { InstagramTile } from "@/lib/types";

const MAX_TILES = 12;

export function InstagramManager({ tiles }: { tiles: InstagramTile[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const slotsLeft = Math.max(0, MAX_TILES - tiles.length);
  const previews = useMemo(
    () => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  return (
    <div className="admin-instagram-upload">
      <button className="instagram-dropzone" type="button" onClick={() => inputRef.current?.click()} disabled={pending || slotsLeft <= 0}>
        <UploadCloud size={26} />
        <strong>Enviar fotos para Instagram</strong>
        <span>{slotsLeft} espaco(s) disponiveis. JPEG, PNG ou WebP ate 5MB.</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          addFiles(Array.from(event.target.files || []));
          event.currentTarget.value = "";
        }}
      />

      {previews.length ? (
        <div className="instagram-preview-grid">
          {previews.map((preview) => (
            <div key={preview.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.url} alt={preview.name} />
            </div>
          ))}
        </div>
      ) : null}

      <div className="admin-filter-actions mt-4">
        <button className="btn btn-mint text-sm" type="button" disabled={pending || !files.length} onClick={uploadFiles}>
          <UploadCloud size={17} />
          Enviar {files.length ? files.length : ""}
        </button>
        {files.length ? (
          <button className="btn btn-ghost text-sm" type="button" disabled={pending} onClick={() => setFiles([])}>
            Limpar selecao
          </button>
        ) : null}
      </div>

      {tiles.length ? (
        <div className="instagram-existing-strip">
          {tiles.map((tile) => (
            <article key={tile.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tile.image_url} alt={tile.alt_text || "Instagram Originally"} />
              <button type="button" onClick={() => removeTile(tile.id)} disabled={pending} aria-label="Remover foto do Instagram">
                <Trash2 size={15} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="instagram-upload-empty">
          <ImageIcon size={28} />
          <span>Nenhuma foto cadastrada ainda.</span>
        </div>
      )}

      {message ? <p className="media-message">{message}</p> : null}
    </div>
  );

  function addFiles(nextFiles: File[]) {
    const imagesOnly = nextFiles.filter((file) => file.type.startsWith("image/"));
    const remaining = MAX_TILES - tiles.length - files.length;
    if (remaining <= 0) {
      setMessage(`Limite de ${MAX_TILES} fotos atingido.`);
      return;
    }
    const accepted = imagesOnly.slice(0, remaining);
    setFiles((current) => [...current, ...accepted]);
    setMessage(accepted.length ? `${accepted.length} foto(s) pronta(s) para envio.` : "Envie apenas imagens.");
  }

  function uploadFiles() {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    startTransition(async () => {
      const response = await fetch("/api/admin/instagram", { method: "POST", body: form });
      const data = await readJson(response);
      if (!response.ok || data.error) {
        setMessage(data.error || "Nao foi possivel enviar as fotos.");
        return;
      }
      setFiles([]);
      setMessage("Fotos cadastradas.");
      router.refresh();
    });
  }

  function removeTile(id: string) {
    startTransition(async () => {
      const response = await fetch("/api/admin/instagram", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await readJson(response);
      if (!response.ok || data.error) {
        setMessage(data.error || "Nao foi possivel remover a foto.");
        return;
      }
      setMessage("Foto removida.");
      router.refresh();
    });
  }
}

async function readJson(response: Response): Promise<{ error?: string }> {
  try {
    return await response.json() as { error?: string };
  } catch {
    return { error: "Resposta inesperada do servidor." };
  }
}
