import { useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Status messages (WCAG 4.1.3): speaks `message` with VoiceOver whenever it becomes a new
 * non-empty value, without moving focus.
 *
 * iOS only. On Android, put `accessibilityLiveRegion="polite"` on the visible text instead:
 * Android 16 deprecates announcement events and lets TalkBack ignore them, and doing both
 * would read the message twice.
 */
export function useAnnounce(message: string | undefined): void {
  useEffect(() => {
    if (Platform.OS !== 'ios' || message === undefined || message.length === 0) return;
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);
}
