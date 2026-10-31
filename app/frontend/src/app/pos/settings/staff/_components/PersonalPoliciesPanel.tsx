"use client";

import type { StaffMember } from "@bar/contracts";
import { Button, Chip, Label, Modal, Radio, RadioGroup, toast } from "@heroui/react";
import { X } from "lucide-react";
import { useState } from "react";
import { usePolicies } from "@/hooks/useIamData";
import { iamFailure, useRefreshIam } from "@/hooks/useIamWrite";
import { useMe } from "@/hooks/useMe";
import { useSelfGuard } from "@/hooks/useSelfGuard";
import { setPersonalPolicies } from "@/lib/api/iam";
import { FailureAlert } from "../../groups/_components/FailureAlert";

/** The one place a person-level exception lives (BRIEF-058): every change writes the whole set from the member the server last returned. */
export function PersonalPoliciesPanel({ member }: Readonly<{ member: StaffMember }>) {
  const policies = usePolicies();
  const me = useMe();
  const refresh = useRefreshIam();
  const guard = useSelfGuard();
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState("");
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const attached = (policies.data ?? []).filter((policy) => member.policyIds.includes(policy.id));
  const available = (policies.data ?? []).filter((policy) => !member.policyIds.includes(policy.id) && policy.system === null);

  async function write(policyIds: string[]) {
    setSaving(true);
    setFailure(null);
    try {
      await setPersonalPolicies(member.id, policyIds);
      toast.success("บันทึกแล้ว · มีผลทันที");
      setAdding(false);
      setPick("");
    } catch (error) {
      setFailure(iamFailure(error).message);
    } finally {
      await refresh();
      setSaving(false);
    }
  }

  function change(policyIds: string[]) {
    if (member.id === me.data?.id) guard.run({ personalPolicyIds: policyIds }, () => void write(policyIds));
    else void write(policyIds);
  }

  return (
    <section aria-labelledby="personal-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="personal-heading" className="text-heading">นโยบายส่วนตัว</h2>
        <Button size="lg" variant="secondary" className="min-h-11" onPress={() => setAdding(true)}>
          เพิ่มนโยบาย
        </Button>
      </div>
      <FailureAlert message={failure} />
      {attached.length === 0 ? <p className="text-body text-text-muted">ไม่มีนโยบายส่วนตัว</p> : null}
      <ul className="flex flex-col gap-2">
        {attached.map((policy) => (
          <li key={policy.id} className="flex items-center gap-3 rounded-card border border-line-hairline bg-surface p-3">
            <Chip size="sm" variant="soft" color="accent" className="flex-1">{policy.name}</Chip>
            <Button isIconOnly size="lg" variant="ghost" className="min-h-11 min-w-11" aria-label={`ถอดนโยบาย ${policy.name}`} isDisabled={saving} onPress={() => change(member.policyIds.filter((id) => id !== policy.id))}>
              <X size={18} aria-hidden />
            </Button>
          </li>
        ))}
      </ul>
      {adding ? (
        <Modal.Backdrop isOpen onOpenChange={(open) => { if (!open) setAdding(false); }}>
          <Modal.Container size="md" scroll="inside">
            <Modal.Dialog aria-label="เพิ่มนโยบาย">
              <div className="flex flex-col gap-4">
                <Modal.Heading className="text-heading">เพิ่มนโยบายให้ {member.displayName}</Modal.Heading>
                {available.length === 0 ? <p className="text-body text-text-muted">ไม่มีนโยบายให้เพิ่ม</p> : null}
                <RadioGroup aria-label="นโยบาย" value={pick} onChange={setPick}>
                  {available.map((policy) => (
                    <Radio key={policy.id} value={policy.id} aria-label={policy.name}>
                      <Radio.Content aria-label={policy.name}>
                        <Radio.Control>
                          <Radio.Indicator />
                        </Radio.Control>
                        <Label>{policy.name}</Label>
                      </Radio.Content>
                    </Radio>
                  ))}
                </RadioGroup>
                <div className="flex gap-2">
                  <Button size="lg" variant="secondary" className="min-h-11 flex-1" onPress={() => setAdding(false)}>
                    ยกเลิก
                  </Button>
                  <Button size="lg" className="min-h-11 flex-1" isDisabled={pick === "" || saving} onPress={() => change([...member.policyIds, pick])}>
                    เพิ่มนโยบาย
                  </Button>
                </div>
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      ) : null}
      {guard.dialog}
    </section>
  );
}
