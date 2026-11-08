/**
 * The job link from `applicationtracker://intake/new?url=<encoded link>`, or `undefined` when
 * there is none or it isn't a web link. Anything else (`javascript:`, `file:`, app links) is ignored.
 */
export function linkFromDeepLink(param: string | string[] | undefined): string | undefined {
  const value = (Array.isArray(param) ? param[0] : param)?.trim();
  if (value === undefined || value.length === 0) return undefined;
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:' ? value : undefined;
  } catch {
    return undefined;
  }
}
