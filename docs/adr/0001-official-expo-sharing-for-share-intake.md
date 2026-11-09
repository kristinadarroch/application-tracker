---
status: accepted
---

# Use the official `expo-sharing` receive API for share intake

Share-to-app intake uses `expo-sharing`'s config plugin and `useIncomingShare()`, instead of the third-party `expo-share-intent`. `+native-intent.ts` only checks the incoming URL's hostname (`expo-sharing`) and redirects to `/intake/share`, where `useIncomingShare()` reads the payload. It is Expo's first-party path in SDK 58 and stays aligned with SDK upgrades.

## Consequences

- The receive API is **experimental** in SDK 58. On iOS the share extension opens the main app rather than handling the share inside the sheet.
- It needs a dev build (native config), so Expo Go can't run the app.
- Because the API may change, paste intake is a full peer of share intake, not a fallback afterthought. Both feed the same `extract-listing` flow.

Source: [Expo SDK 58 Sharing docs](https://docs.expo.dev/versions/v58.0.0/sdk/sharing/).
