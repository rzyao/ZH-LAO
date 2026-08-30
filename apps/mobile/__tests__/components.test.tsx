import { Text } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';

import { ThemeProvider, useTheme, THEME_PRESETS } from '../src/theme/ThemeProvider';
import { AppText } from '../src/components/common/AppText';
import { LaoText } from '../src/components/common/LaoText';
import { StateView } from '../src/components/common/StateView';
import { AppButton } from '../src/components/common/AppButton';
import { createInMemoryPreferencesStorage } from '../src/storage/preferencesStorage';
import { UnknownError } from '../src/api/errors/errors';

function ThemeProbe() {
  const { themeId, isHydrated, setThemeId, availableThemes } = useTheme();
  return (
    <>
      <Text testID="theme-id">{themeId}</Text>
      <Text testID="theme-hydrated">{String(isHydrated)}</Text>
      <Text testID="theme-count">{availableThemes.length}</Text>
      <Text onPress={() => setThemeId(THEME_PRESETS[1]!.id)}>switch</Text>
    </>
  );
}

describe('ThemeProvider', () => {
  it('renders with the default theme and persists a switch', async () => {
    const storage = createInMemoryPreferencesStorage();
    await render(
      <ThemeProvider storage={storage} initialThemeId={null}>
        <ThemeProbe />
      </ThemeProvider>,
    );
    await act(async () => {});
    expect(screen.getByTestId('theme-hydrated')).toHaveTextContent('true');
    expect(screen.getByTestId('theme-id')).toHaveTextContent(THEME_PRESETS[0]!.id);

    fireEvent.press(screen.getByText('switch'));
    await waitFor(() => expect(screen.getByTestId('theme-id')).toHaveTextContent(THEME_PRESETS[1]!.id));
    expect(await storage.getString('zhlao.preferences.theme_id')).toBe(THEME_PRESETS[1]!.id);
  });

  it('hydrates a stored theme id asynchronously', async () => {
    const storage = createInMemoryPreferencesStorage();
    await storage.setString('zhlao.preferences.theme_id', THEME_PRESETS[1]!.id);
    await render(
      <ThemeProvider storage={storage}>
        <ThemeProbe />
      </ThemeProvider>,
    );
    await act(async () => {});
    await waitFor(() => expect(screen.getByTestId('theme-id')).toHaveTextContent(THEME_PRESETS[1]!.id));
  });

  it('falls back to the default theme for unknown stored ids', async () => {
    const storage = createInMemoryPreferencesStorage();
    await storage.setString('zhlao.preferences.theme_id', 'does-not-exist');
    await render(
      <ThemeProvider storage={storage}>
        <ThemeProbe />
      </ThemeProvider>,
    );
    await act(async () => {});
    await Promise.resolve();
    expect(screen.getByTestId('theme-id')).toHaveTextContent(THEME_PRESETS[0]!.id);
  });
});

describe('Text components', () => {
  it('AppText renders children', async () => {
    await render(
      <ThemeProvider initialThemeId={null}>
        <AppText variant="h2">你好 ZH-LAO</AppText>
      </ThemeProvider>,
    );
    await act(async () => {});
    expect(screen.getByText('你好 ZH-LAO')).toBeOnTheScreen();
  });

  it('LaoText renders Lao script content', async () => {
    await render(
      <ThemeProvider initialThemeId={null}>
        <LaoText>ສະບາຍດີ</LaoText>
      </ThemeProvider>,
    );
    await act(async () => {});
    expect(screen.getByText('ສະບາຍດີ')).toBeOnTheScreen();
  });
});

describe('StateView', () => {
  it('renders empty and loading states', async () => {
    await render(
      <ThemeProvider initialThemeId={null}>
        <StateView kind="empty" />
      </ThemeProvider>,
    );
    await act(async () => {});
    expect(screen.getByTestId('state-view-empty')).toBeOnTheScreen();

    await render(
      <ThemeProvider initialThemeId={null}>
        <StateView kind="loading" />
      </ThemeProvider>,
    );
    await act(async () => {});
    expect(screen.getByTestId('state-view-loading')).toBeOnTheScreen();
  });

  it('renders the safe user message of an error, never internals', async () => {
    await render(
      <ThemeProvider initialThemeId={null}>
        <StateView kind="error" error={new UnknownError('服务暂时不可用，请稍后重试。')} />
      </ThemeProvider>,
    );
    await act(async () => {});
    expect(screen.getByText('服务暂时不可用，请稍后重试。')).toBeOnTheScreen();
    expect(screen.queryByText(/at Object/)).toBeNull();
  });

  it('invokes onRetry', async () => {
    const onRetry = jest.fn();
    await render(
      <ThemeProvider initialThemeId={null}>
        <StateView kind="error" onRetry={onRetry} />
      </ThemeProvider>,
    );
    await act(async () => {});
    fireEvent.press(screen.getByTestId('state-view-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('AppButton', () => {
  it('fires onPress when enabled', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider initialThemeId={null}>
        <AppButton title="提交" onPress={onPress} testID="btn" />
      </ThemeProvider>,
    );
    await act(async () => {});
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('blocks press when disabled', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider initialThemeId={null}>
        <AppButton title="提交" onPress={onPress} disabled testID="btn-disabled" />
      </ThemeProvider>,
    );
    await act(async () => {});
    fireEvent.press(screen.getByTestId('btn-disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a loading state and blocks press', async () => {
    const onPress = jest.fn();
    await render(
      <ThemeProvider initialThemeId={null}>
        <AppButton title="提交" onPress={onPress} loading testID="submit-loading" />
      </ThemeProvider>,
    );
    await act(async () => {});
    const button = screen.getByTestId('submit-loading');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true, busy: true });
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
