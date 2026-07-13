import { usePathname, useRouter } from "expo-router";
import { useRef } from "react";

export function useGuardedPush() {
  const router = useRouter();
  const pathname = usePathname();
  const last = useRef(0);

  return (href: string): boolean => {
    if (pathname === href) return false; // already on this route
    const now = Date.now();
    if (now - last.current < 700) return false; // debounce spam
    last.current = now;
    router.push(href as never);
    return true;
  };
}
