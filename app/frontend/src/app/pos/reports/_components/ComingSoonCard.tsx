import { Card, Chip } from "@heroui/react";
import { Lock } from "lucide-react";

// Cost and stock need recipes and inventory (CD-05 D1, S2) — shown so the plan is visible.
export function ComingSoonCard() {
  return (
    <Card aria-disabled="true" className="opacity-70">
      <Card.Content className="flex flex-row items-center gap-3 text-text-muted">
        <Lock size={18} aria-hidden />
        <div className="flex flex-1 flex-col">
          <span className="text-body-strong">ต้นทุนและสต็อก</span>
          <span className="text-small">ต้องมีสูตรและสต็อก (S2)</span>
        </div>
        <Chip size="sm" variant="soft">
          เร็วๆ นี้
        </Chip>
      </Card.Content>
    </Card>
  );
}
