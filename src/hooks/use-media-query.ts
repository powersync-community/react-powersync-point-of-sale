import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook to detect media query matches
 * @param query - CSS media query string
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = useCallback((query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  }, []);

  const [matches, setMatches] = useState<boolean>(() => getMatches(query));

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Update the state initially
    setMatches(matchMedia.matches);

    // Create event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the listener
    matchMedia.addEventListener("change", handleChange);

    // Cleanup
    return () => {
      matchMedia.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoint hooks following Tailwind CSS defaults
 */
export function useIsMobile(): boolean {
  return !useMediaQuery("(min-width: 768px)");
}

export function useIsTablet(): boolean {
  const isAboveMobile = useMediaQuery("(min-width: 768px)");
  const isBelowDesktop = !useMediaQuery("(min-width: 1024px)");
  return isAboveMobile && isBelowDesktop;
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery("(min-width: 1280px)");
}

/**
 * Combined breakpoint hook for responsive layouts
 * @returns Object with boolean values for each breakpoint
 */
export function useBreakpoint() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isLargeDesktop = useIsLargeDesktop();

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Convenience getters
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
  };
}
