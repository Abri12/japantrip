import { Pressable, TextInput, View } from 'react-native';

import { Chip, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

/**
 * 후보 입력 칸 묶음.
 *
 * 가챠와 사다리가 같은 것을 요구하므로 한 컴포넌트로 둔다. 두 벌로 두면 한쪽만
 * 고쳐 놓고 다른 쪽이 어긋나기 시작한다.
 */
export function CandidateList({
  items,
  onChange,
  min,
  max,
  colors,
  extra,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  min: number;
  max: number;
  colors?: string[];
  extra?: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <>
      {items.map((value, i) => (
        <View key={i} style={i === 0 ? styles.inputRow : styles.inputRowGap}>
          {colors ? (
            <View style={[styles.colorDot, { backgroundColor: colors[i] }]} />
          ) : (
            <Txt variant="caption" color="textTertiary">
              {i + 1}
            </Txt>
          )}
          <TextInput
            value={value}
            onChangeText={(t) => onChange(items.map((v, k) => (k === i ? t : v)))}
            placeholder={`${i + 1}번`}
            placeholderTextColor={theme.textTertiary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
          />
          {items.length > min ? (
            <Pressable onPress={() => onChange(items.filter((_, k) => k !== i))} hitSlop={8}>
              <Txt variant="body" color="textTertiary">
                ✕
              </Txt>
            </Pressable>
          ) : null}
        </View>
      ))}

      <View style={styles.addRow}>
        {items.length < max ? (
          <Chip label="+ 추가" active={false} onPress={() => onChange([...items, ''])} />
        ) : null}
        {extra}
      </View>
    </>
  );
}
