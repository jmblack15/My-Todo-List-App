import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useAppTheme } from "@/hooks/useAppTheme";

export function SkeletonRect({
  height = 16,
  width = "100%",
}: {
  height?: number;
  width?: number | string;
}) {
  const { colors } = useAppTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          height,
          width: width as number,
          borderRadius: 8,
          backgroundColor: colors.bgSubtle,
        },
      ]}
    />
  );
}

export function SkeletonSection({ itemCount }: { itemCount: number }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <SkeletonRect height={11} width="32%" />
      {Array.from({ length: itemCount }).map((_, i) => (
        <View key={i} style={{ marginTop: 12 }}>
          <SkeletonRect height={56} />
        </View>
      ))}
    </View>
  );
}
