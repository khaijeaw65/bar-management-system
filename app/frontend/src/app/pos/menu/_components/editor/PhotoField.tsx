"use client";

import { Button, ProgressBar } from "@heroui/react";
import { ImageIcon } from "lucide-react";
import { useRef, type DragEvent } from "react";
import type { PhotoDraft } from "../../_lib/draft";
import type { UploadState } from "../../_hooks/usePhotoUpload";

export function PhotoField({
  savedUrl,
  photo,
  upload,
  onPick,
  onCancel,
  onRemove,
}: Readonly<{
  savedUrl: string | null;
  photo: PhotoDraft;
  upload: UploadState;
  onPick: (file: File) => void;
  onCancel: () => void;
  onRemove: () => void;
}>) {
  const input = useRef<HTMLInputElement>(null);
  let shown: string | null = null;
  if (photo.kind === "new") shown = photo.preview;
  else if (photo.kind === "keep") shown = savedUrl;
  const uploading = upload.status === "uploading";

  const drop = (event: DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && !uploading) onPick(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-text-muted">รูปเมนู</span>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="เลือกไฟล์รูป"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = "";
        }}
      />
      <div
        className="flex aspect-4/3 w-52 items-center justify-center overflow-hidden rounded-card bg-surface-input text-text-faint"
        onDragOver={(event) => event.preventDefault()}
        onDrop={drop}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL or local blob, not optimisable
          <img src={shown} alt="รูปเมนู" className="size-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 p-3 text-center">
            <ImageIcon aria-hidden className="size-8" />
            <span className="text-text-muted">อัปโหลดรูป</span>
            <span className="text-small">JPG, PNG หรือ WebP ไม่เกิน 5 MB</span>
          </div>
        )}
      </div>
      {uploading ? (
        <div className="flex w-52 flex-col gap-2">
          <ProgressBar.Root aria-label="กำลังอัปโหลด" value={upload.progress} minValue={0} maxValue={100}>
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar.Root>
          <span className="text-small text-text-muted">กำลังอัปโหลด {upload.progress}%</span>
          <Button size="sm" variant="secondary" onPress={onCancel}>
            ยกเลิกการอัปโหลด
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onPress={() => input.current?.click()}>
            {shown ? "เปลี่ยนรูป" : "เลือกรูป"}
          </Button>
          {shown ? (
            <Button size="sm" variant="ghost" onPress={onRemove}>
              ลบรูป
            </Button>
          ) : null}
        </div>
      )}
      {upload.status === "error" ? (
        <div role="alert" className="flex flex-col text-small text-text-danger">
          <span className="font-semibold">อัปโหลดไม่สำเร็จ</span>
          <span>ไฟล์ต้องเป็น JPG, PNG หรือ WebP ไม่เกิน 5 MB</span>
          <span>เลือกไฟล์ใหม่</span>
        </div>
      ) : null}
    </div>
  );
}
