import { View } from 'react-native';
import { Alert } from 'heroui-native';
import { QUEUE_COPY } from '../../lib/tickets/copy';

export interface QueueNoticesProps {
  disconnected: boolean;
  readOnly: boolean;
}

/** queue·6 connection banner and queue·8 read-only notice. */
export function QueueNotices({ disconnected, readOnly }: Readonly<QueueNoticesProps>) {
  if (!disconnected && !readOnly) return null;
  return (
    <View className="px-4 pb-3 gap-2">
      {disconnected && (
        <Alert testID="queue-disconnected" status="warning" className="w-full">
          <Alert.Content>
            <Alert.Title className="text-sm font-sans">{QUEUE_COPY.disconnectedTitle}</Alert.Title>
            <Alert.Description className="text-xs font-sans">{QUEUE_COPY.disconnectedBody}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      {readOnly && (
        <Alert testID="queue-read-only" status="default" className="w-full">
          <Alert.Content>
            <Alert.Title className="text-sm font-sans">{QUEUE_COPY.readOnly}</Alert.Title>
          </Alert.Content>
        </Alert>
      )}
    </View>
  );
}
