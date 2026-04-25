import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Logo from '@/assets/images/levtrans.svg';

interface Props {
  shouldDismiss: boolean;
  onDone: () => void;
}

export default function AppSplash({ shouldDismiss, onDone }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.82);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, []);

  useEffect(() => {
    if (!shouldDismiss) return;
    opacity.value = withTiming(0, { duration: 500 }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  }, [shouldDismiss]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Logo width={180} height={180} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
