import { View, ScrollView } from 'react-native';
import { Chip } from 'heroui-native';
import type { FilterType } from '../../hooks/useQueueFilter';

export interface FilterOption {
  id: FilterType;
  label: string;
}

export const FILTERS: FilterOption[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'pending', label: 'ใหม่' },
  { id: 'accepted', label: 'กำลังเตรียม' },
  { id: 'ready', label: 'พร้อมเสิร์ฟ' },
  { id: 'issue', label: 'มีปัญหา' },
];

export interface QueueFilterChipsProps {
  currentFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  hasIssue: boolean;
}

export function QueueFilterChips({
  currentFilter,
  onSelectFilter,
  hasIssue,
}: QueueFilterChipsProps) {
  return (
    <View className="pb-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 gap-2"
      >
        {FILTERS.map((f) => {
          const active = currentFilter === f.id;
          return (
            <Chip
              key={f.id}
              testID={`filter-${f.id}`}
              onPress={() => onSelectFilter(f.id)}
              accessibilityState={{ selected: active }}
              className={`flex-row items-center gap-1.5 px-4 rounded-full border min-h-[44px] ${
                active ? 'bg-accent-soft border-accent' : 'bg-surface-card border-line'
              }`}
            >
              <Chip.Label
                className={`text-sm font-semibold font-sans ${
                  active ? 'text-text-accent' : 'text-text-muted'
                }`}
              >
                {f.label}
              </Chip.Label>
              {f.id === 'issue' && hasIssue && (
                <View testID="issue-dot" className="w-2 h-2 rounded-full bg-status-void" />
              )}
            </Chip>
          );
        })}
      </ScrollView>
    </View>
  );
}

