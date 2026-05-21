"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Trash2, UploadCloud } from "lucide-react";
import type { ProductImage } from "@/lib/types";

const MAX_IMAGES = 12;

export function ImageManager({ productId, images }: { productId: string; images: ProductImage[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const slotsLeft = Math.max(0, MAX_IMAGES - images.length);
  const previews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  return (
    <section className="shopify-card media-card">
      <div className="shopify-card-title">
        <div>
          <ImageIcon size={18} />
        </div>
        <span>
          <strong>Midia do produto</strong>
          <small>Cadastre ate 12 imagens. A primeira imagem vira capa nas vitrines.</small>
        </span>
      </div>

      <div className="media-status">
        <span>{images.length}/{MAX_IMAGES} usadas</span>
        <span>{slotsLeft} livres</span>
      </div>

      <div className="media-grid">
        {images.map((image, index) => (
          <article key={image.id} className="media-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.alt || `Imagem ${index + 1}`} />
            <div className="media-thumb-bar">
              <span>{index === 0 ? "Capa" : `Imagem ${index + 1}`}</span>
              <button type="button" aria-label="Remover imagem" onClick={() => removeImage(image.id)} disabled={pending || deletingId === image.id}>
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        ))}
        {!images.length ? (
          <div className="media-empty">
            <ImageIcon size={32} />
            <span>Nenhuma imagem cadastrada</span>
          </div>
        ) : null}
      </div>

      <div
        className={dragging ? "media-dropzone is-dragging" : "media-dropzone"}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <UploadCloud size={28} />
        <strong>Arraste imagens aqui</strong>
        <span>ou clique para selecionar JPEG, PNG ou WebP ate 5MB cada</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          hidden
          onChange={(event) => {
            addFiles(Array.from(event.target.files || []));
            event.currentTarget.value = "";
          }}
        />
      </div>

      {previews.length ? (
        <div className="media-preview">
          {previews.map((preview) => (
            <div key={preview.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.url} alt={preview.name} />
            </div>
          ))}
        </div>
      ) : null}

      <div className="media-actions">
        <button className="btn btn-mint text-sm" type="button" disabled={pending || !files.length} onClick={uploadFiles}>
          <UploadCloud size={17} />
          Enviar {files.length ? `${files.length} imagem${files.length > 1 ? "s" : ""}` : "imagens"}
        </button>
        {files.length ? (
          <button className="btn btn-ghost text-sm" type="button" disabled={pending} onClick={() => setFiles([])}>
            Limpar selecao
          </button>
        ) : null}
      </div>

      {message ? <p className="media-message">{message}</p> : null}
    </section>
  );

  function addFiles(nextFiles: File[]) {
    const imagesOnly = nextFiles.filter((file) => file.type.startsWith("image/"));
    if (imagesOnly.length !== nextFiles.length) {
      setMessage("Alguns arquivos foram ignorados. Envie apenas imagens.");
    }
    const remaining = MAX_IMAGES - images.length - files.length;
    if (remaining <= 0) {
      setMessage("Este produto ja atingiu o limite de 12 imagens.");
      return;
    }
    const accepted = imagesOnly.slice(0, remaining);
    setFiles((current) => [...current, ...accepted]);
    if (imagesOnly.length > accepted.length) {
      setMessage(`Limite de 12 imagens. ${imagesOnly.length - accepted.length} arquivo(s) ficaram de fora.`);
    } else if (accepted.length) {
      setMessage(`${accepted.length} imagem(ns) pronta(s) para envio.`);
    }
  }

  function uploadFiles() {
    if (!files.length) return;
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    startTransition(async () => {
      const response = await fetch(`/api/admin/products/${productId}/images`, { method: "POST", body: form });
      const data = await readJson(response);
      if (!response.ok || data.error) {
        setMessage(data.error || "Nao foi possivel enviar as imagens.");
        return;
      }
      setFiles([]);
      setMessage("Imagens cadastradas.");
      router.refresh();
    });
  }

  function removeImage(imageId: string) {
    setDeletingId(imageId);
    startTransition(async () => {
      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      const data = await readJson(response);
      setDeletingId(null);
      if (!response.ok || data.error) {
        setMessage(data.error || "Nao foi possivel remover a imagem.");
        return;
      }
      setMessage("Imagem removida.");
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
