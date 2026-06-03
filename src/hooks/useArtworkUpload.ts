import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UploadedArtwork {
  url: string;
  filename: string;
  size: number;
}

export function useArtworkUpload() {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File): Promise<UploadedArtwork> {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const path = `${session.user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("artwork").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("artwork").getPublicUrl(path);
      return { url: publicUrl, filename: file.name, size: file.size };
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading };
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
