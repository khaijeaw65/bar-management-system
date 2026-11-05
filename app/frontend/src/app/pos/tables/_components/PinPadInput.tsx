"use client";

import { Button } from "@heroui/react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface PinPadInputProps {
  value: string;
  onChange: (next: string) => void;
  error?: string | null;
  disabled?: boolean;
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function PinPadInput({
  value,
  onChange,
  error,
  disabled = false,
}: Readonly<PinPadInputProps>) {
  const handleDigit = (digit: string) => {
    if (disabled) return;
    if (value.length < 4) {
      onChange(value + digit);
    }
  };

  const handleDelete = () => {
    if (disabled) return;
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (disabled) return;
    onChange("");
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3 py-2" role="group" aria-label="PIN indicators">
        {[0, 1, 2, 3].map((index) => {
          const filled = index < value.length;
          return (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                "h-4 w-4 rounded-full transition-colors",
                filled
                  ? "bg-accent"
                  : "border-2 border-line bg-transparent",
                error && "border-danger",
              )}
            />
          );
        })}
      </div>

      {error ? (
        <p className="text-small text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid w-full max-w-xs grid-cols-3 gap-2">
        {DIGITS.map((digit) => (
          <Button
            key={digit}
            type="button"
            variant="secondary"
            isDisabled={disabled}
            onPress={() => handleDigit(digit)}
            className="h-12 text-body-lg font-medium"
          >
            {digit}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          isDisabled={disabled || value.length === 0}
          onPress={handleClear}
          className="h-12 text-small text-text-muted"
        >
          ล้าง
        </Button>
        <Button
          key="0"
          type="button"
          variant="secondary"
          isDisabled={disabled}
          onPress={() => handleDigit("0")}
          className="h-12 text-body-lg font-medium"
        >
          0
        </Button>
        <Button
          type="button"
          variant="ghost"
          isDisabled={disabled || value.length === 0}
          onPress={handleDelete}
          aria-label="ลบ"
          className="h-12 text-body-lg"
        >
          <Delete className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">ลบ</span>
        </Button>
      </div>
    </div>
  );
}
