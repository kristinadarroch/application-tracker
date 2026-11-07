import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { makeStyles } from '../theme/makeStyles';
import { useScaledIconSize } from '../theme/useScaledIconSize';
import { useTheme } from '../theme/useTheme';
import { fontFamily } from '../tokens/typography';
import type { IconName } from './icons';

export interface FloatingTab {
  key: string;
  label: string;
  icon: IconName;
  focused: boolean;
  onPress: () => void;
  /** Small count on the tab ("1"); announced as the tab's value. */
  badge?: string;
}

export interface FloatingTabBarAction {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
}

export interface FloatingTabBarProps {
  tabs: FloatingTab[];
  action?: FloatingTabBarAction;
}

const BAR_HEIGHT = 62;
const TAB_HEIGHT = 50;
const BADGE = 16;
const BOTTOM_GAP = 12;

const useStyles = makeStyles((t) => ({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: t.space[4],
    paddingTop: t.space[2],
    backgroundColor: t.color.bg.canvas,
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: BAR_HEIGHT,
    paddingHorizontal: 6,
    borderRadius: t.radius.pill,
    borderWidth: 1,
    borderColor: t.color.border.subtle,
    backgroundColor: t.color.bg.surface,
    ...t.elevation[2],
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    minHeight: Math.max(TAB_HEIGHT, t.size.minTouchTarget),
    minWidth: t.size.minTouchTarget,
    paddingHorizontal: t.space[3],
    borderRadius: t.radius.pill,
  },
  tabFocused: { paddingHorizontal: t.space[4], backgroundColor: t.color.action.primary.bg },
  tabPressed: { opacity: 0.7 },
  label: { ...t.type.caption, fontFamily: fontFamily.bold, color: t.color.text.secondary },
  labelFocused: {
    ...t.type.caption,
    fontFamily: fontFamily.extrabold,
    color: t.color.action.primary.fg,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 4,
    minWidth: BADGE,
    height: BADGE,
    paddingHorizontal: 2,
    borderRadius: BADGE / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: t.color.text.primary,
    backgroundColor: t.color.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fontFamily.black,
    fontSize: 10,
    lineHeight: 12,
    color: t.color.text.primary,
  },
  fab: {
    width: BAR_HEIGHT,
    height: BAR_HEIGHT,
    borderRadius: t.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.color.sign.bg,
    ...t.elevation[2],
  },
  fabPressed: { opacity: 0.85 },
}));

/**
 * Floating pill tab bar with an optional round action button (B1). Rendered in normal flow
 * (not absolutely positioned) so screens above it are never covered; it pads for the home
 * indicator itself.
 */
export function FloatingTabBar({ tabs, action }: FloatingTabBarProps) {
  const styles = useStyles();
  const theme = useTheme();
  // Read the context directly so the bar also renders without a SafeAreaProvider (tests).
  const insets = useContext(SafeAreaInsetsContext);
  const iconSize = useScaledIconSize(20, 'caption');
  const bottom = { paddingBottom: Math.max(insets?.bottom ?? 0, BOTTOM_GAP) };
  return (
    <View style={[styles.wrap, bottom]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: tab.focused }}
            {...(tab.badge === undefined ? {} : { accessibilityValue: { text: tab.badge } })}
            onPress={tab.onPress}
            style={({ pressed }) => [
              styles.tab,
              tab.focused ? styles.tabFocused : null,
              pressed ? styles.tabPressed : null,
            ]}
          >
            <Ionicons
              name={tab.icon}
              size={iconSize}
              color={tab.focused ? theme.color.action.primary.fg : theme.color.text.secondary}
            />
            <RNText
              style={tab.focused ? styles.labelFocused : styles.label}
              maxFontSizeMultiplier={theme.maxFontSizeMultiplier.caption}
            >
              {tab.label}
            </RNText>
            {tab.badge !== undefined ? (
              <View style={styles.badge}>
                <RNText style={styles.badgeText} allowFontScaling={false}>
                  {tab.badge}
                </RNText>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
      {action !== undefined ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
          onPress={action.onPress}
          style={({ pressed }) => [styles.fab, pressed ? styles.fabPressed : null]}
        >
          <Ionicons name={action.icon} size={26} color={theme.color.urgent.bg} />
        </Pressable>
      ) : null}
    </View>
  );
}
