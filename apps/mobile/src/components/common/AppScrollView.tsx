import { ScrollView, type ScrollViewProps } from 'react-native';

/**
 * Foundation scroll container.
 *
 * The legacy app mutated `ScrollView.defaultProps` globally (and FlatList /
 * SectionList too). V2 does not mutate framework prototypes: the same visual
 * behaviour is provided by this explicitly used component instead.
 */
export function AppScrollView({
  children,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  overScrollMode = 'never',
  ...rest
}: ScrollViewProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      overScrollMode={overScrollMode}
      keyboardShouldPersistTaps="handled"
      {...rest}
    >
      {children}
    </ScrollView>
  );
}
