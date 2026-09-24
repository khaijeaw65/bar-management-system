export function MenuListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p className="text-error">เกิดข้อผิดพลาด</p>
      <button
        type="button"
        onClick={onRetry}
        className="h-10 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground"
      >
        ลองอีกครั้ง
      </button>
    </div>
  );
}
