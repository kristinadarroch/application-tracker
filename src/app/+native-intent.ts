/** Base for parsing in-app paths like `/application/abc`, which have no scheme or host. */
const PATH_BASE = 'applicationtracker://';

/**
 * Incoming shares arrive as `<scheme>://expo-sharing?...`; route them to the
 * share-received screen (INT-1). Every other link opens as usual.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    return new URL(path, PATH_BASE).hostname === 'expo-sharing' ? '/intake/share' : path;
  } catch {
    return '/';
  }
}
