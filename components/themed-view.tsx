import { View, type ViewProps } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const { colors, isDark } = useAppTheme();
  const backgroundColor = (isDark ? darkColor : lightColor) ?? colors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
