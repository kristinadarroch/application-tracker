import { useRouter, type Href } from 'expo-router';

/** Pops the stack, or replaces with `fallback` when the screen was opened from a deep link. */
export function useGoBack(fallback: Href = '/'): () => void {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback);
  };
}
