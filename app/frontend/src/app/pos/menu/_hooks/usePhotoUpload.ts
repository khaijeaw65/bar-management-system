"use client";

import { IMAGE_MAX_BYTES, ImageContentTypeSchema } from "@bar/contracts";
import { useEffect, useRef, useState } from "react";
import { createImageUploadUrl, uploadToS3 } from "@/lib/api/menu";

export type UploadState = { status: "idle" } | { status: "uploading"; progress: number } | { status: "error" };

// Pick → presign → POST to S3 (BRIEF-041). The draft only changes when the upload finishes, so a cancel or failure keeps the previous photo.
export function usePhotoUpload(onDone: (photo: { key: string; preview: string }) => void) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const abort = useRef<AbortController | null>(null);
  const preview = useRef<string | null>(null);

  useEffect(
    () => () => {
      abort.current?.abort();
      if (preview.current) URL.revokeObjectURL(preview.current);
    },
    [],
  );

  const pick = async (file: File) => {
    abort.current?.abort();
    const type = ImageContentTypeSchema.safeParse(file.type);
    if (!type.success || file.size === 0 || file.size > IMAGE_MAX_BYTES) {
      setState({ status: "error" });
      return;
    }
    const controller = new AbortController();
    abort.current = controller;
    setState({ status: "uploading", progress: 0 });
    try {
      const target = await createImageUploadUrl(type.data);
      await uploadToS3(target, file, {
        signal: controller.signal,
        onProgress: (progress) => setState({ status: "uploading", progress }),
      });
      if (controller.signal.aborted) return;
      if (preview.current) URL.revokeObjectURL(preview.current);
      preview.current = URL.createObjectURL(file);
      onDone({ key: target.key, preview: preview.current });
      setState({ status: "idle" });
    } catch {
      if (!controller.signal.aborted) setState({ status: "error" });
    }
  };

  const cancel = () => {
    abort.current?.abort();
    setState({ status: "idle" });
  };

  return { state, pick, cancel };
}
