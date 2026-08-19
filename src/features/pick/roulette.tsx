import { useState } from 'react';
import { View } from 'react-native';

import { Chip, Section } from '@/components/ui';
import { useSelectedCity } from '@/lib/selected-city';

import { AppRoulette } from './app-roulette';
import { CustomRoulette } from './custom-roulette';
import { styles } from './styles';

export function Roulette() {
  const { city } = useSelectedCity();
  const [source, setSource] = useState<'app' | 'mine'>('app');

  return (
    <>
      <Section>
        <View style={styles.chipRow}>
          <Chip
            label="앱에 있는 곳에서"
            active={source === 'app'}
            onPress={() => setSource('app')}
          />
          <Chip
            label="내가 적은 것 중에"
            active={source === 'mine'}
            onPress={() => setSource('mine')}
          />
        </View>
      </Section>

      {source === 'app' ? (
        <AppRoulette cityId={city?.id ?? null} cityName={city?.name ?? null} />
      ) : (
        <CustomRoulette cityId={city?.id ?? null} />
      )}
    </>
  );
}
