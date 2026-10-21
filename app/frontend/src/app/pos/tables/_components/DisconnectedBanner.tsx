import { Alert } from "@heroui/react";
import { WifiOff } from "lucide-react";

export function DisconnectedBanner() {
  return (
    <Alert status="warning">
      <Alert.Indicator>
        <WifiOff aria-hidden size={18} />
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Description>การเชื่อมต่อขาด ข้อมูลอาจไม่อัปเดต</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
