import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UploadedArtwork {
  url: string;
  filename: string;
  size: number;
}

export function useArtworkUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function upload(
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<UploadedArtwork> {
    setUploading(true);
    setProgress(0);
    const report = (pct: number) => {
      setProgress(pct);
      onProgress?.(pct);
    };
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const path = `${session.user.id}/${Date.now()}-${file.name}`;

      // Use a signed upload URL so we can PUT via XHR and track real progress.
      const { data: signed, error: signErr } = await supabase
        .storage.from("artwork").createSignedUploadUrl(path);
      if (signErr || !signed) throw signErr ?? new Error("Could not create upload URL");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signed.signedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/pdf");
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            report(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            report(100);
            resolve();
          } else {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      const { data: { publicUrl } } = supabase.storage.from("artwork").getPublicUrl(path);
      return { url: publicUrl, filename: file.name, size: file.size };
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, progress };
}

// Read PDF page count locally so we can validate before submitting.
// Uses pdfjs-dist with the worker bundled by Vite (?url).
export async function readPdfPageCount(file: File): Promise<number> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerUrl = (await import("pdfjs-dist/legacy/build/pdf.worker.mjs?url")).default;
  (pdfjs as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc = workerUrl;
  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({
    data: arrayBuffer,
    isEvalSupported: false,
  }).promise;
  const n = doc.numPages;
  await doc.destroy();
  return n;
}


export interface FileSlotConstraints {
  min_pages?: number;
  max_pages?: number;
  exact_pages?: number;
  page_count_divisible_by?: number;
}

export function validatePageCount(pages: number, c: FileSlotConstraints): string | null {
  if (c.exact_pages !== undefined && pages !== c.exact_pages) {
    return `This file must have exactly ${c.exact_pages} pages (got ${pages}).`;
  }
  if (c.min_pages !== undefined && pages < c.min_pages) {
    return `This file must have at least ${c.min_pages} pages (got ${pages}).`;
  }
  if (c.max_pages !== undefined && pages > c.max_pages) {
    return `This file must have at most ${c.max_pages} pages (got ${pages}).`;
  }
  if (c.page_count_divisible_by && pages % c.page_count_divisible_by !== 0) {
    return `Page count must be divisible by ${c.page_count_divisible_by} (got ${pages}).`;
  }
  return null;
}
