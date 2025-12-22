import { useLicenseKey } from '@/hooks/use-license-key';
import { useThemeSearch, type ThemeItem } from '@/hooks/use-themes-search';
import { cn } from '@/utils';
import { Loader } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

export type { ThemeItem };

interface ThemesListProps {
  searchQuery?: string;
  onThemeSelection?: (item: ThemeItem) => void;
  onFocusReturn?: () => void;
  onFocusChange?: (isFocused: boolean, activeTheme?: ThemeItem) => void;
  onCloseThemes?: () => void;
  onReady?: () => void;
}

export interface ThemesListRef {
  focusOnThemes: () => void;
  selectActiveTheme: () => boolean;
}

const RECENT_THEMES_KEY = 'shadcnstudio-`toolbar-themes-recent';

// Helper functions for localStorage
const getRecentThemes = (): ThemeItem[] => {
  try {
    const stored = localStorage.getItem(RECENT_THEMES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addToRecentThemes = (item: ThemeItem) => {
  try {
    const recent = getRecentThemes();
    // Remove if already exists
    const filtered = recent.filter((theme) => theme.name !== item.name);
    // Add to beginning with recent category
    const updatedRecent = [
      { ...item, category: 'recent' as const },
      ...filtered,
    ].slice(0, 5);
    localStorage.setItem(RECENT_THEMES_KEY, JSON.stringify(updatedRecent));
  } catch (error) {
    console.warn('Failed to save recent blocks:', error);
  }
};

export const ThemesList = forwardRef<ThemesListRef, ThemesListProps>(
  (
    {
      searchQuery,
      onThemeSelection,
      onFocusReturn,
      onFocusChange,
      onCloseThemes,
      onReady,
    },
    ref,
  ) => {
    const { licenseKey } = useLicenseKey();
    const [recentThemes, setRecentThemes] = useState<ThemeItem[]>([]);

    // Load recent themes on mount
    useEffect(() => {
      setRecentThemes(getRecentThemes());
    }, []);

    // Use the theme search hook
    const { searchResults, isSearching, searchError } = useThemeSearch(
      searchQuery || '',
      { licenseKey, debounceMs: 500 },
    );

    // Use search results from API if searching, otherwise combine API results with recent themes
    const filteredThemes = useMemo(() => {
      if (searchQuery?.trim()) {
        // When searching, use API results
        return searchResults;
      } else {
        // When no search, prioritize recent themes, then show API results
        const recentPaths = new Set(recentThemes.map((theme) => theme.name));
        const apiFiltered = searchResults.filter(
          (theme) => !recentPaths.has(theme.name),
        );
        return [...recentThemes, ...apiFiltered];
      }
    }, [searchQuery, searchResults, recentThemes]);

    // Keyboard navigation state
    const [activeIndex, setActiveIndex] = useState(-1);
    const [startIndex, setStartIndex] = useState(0); // Start of the visible window
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Show 3 themes starting from startIndex (like bookmarks-list)
    const visibleThemes = useMemo(() => {
      return filteredThemes.slice(startIndex, startIndex + 3);
    }, [filteredThemes, startIndex]);

    // Reset activeIndex when search results change
    useEffect(() => {
      if (activeIndex >= filteredThemes.length && filteredThemes.length > 0) {
        setActiveIndex(filteredThemes.length - 1);
        setStartIndex(Math.max(0, filteredThemes.length - 3));
      } else if (filteredThemes.length === 0 && activeIndex !== -1) {
        setActiveIndex(-1);
        setStartIndex(0);
      }
    }, [filteredThemes.length, activeIndex]);

    // Auto-select first item when themes appear (regardless of focus state)
    useEffect(() => {
      if (filteredThemes.length > 0 && activeIndex === -1) {
        setActiveIndex(0);
        setStartIndex(0);
      }
    }, [filteredThemes.length, activeIndex]);
    // Note: Visual focus (activeIndex) persists even when keyboard focus (isFocused) is false
    // This enables the dual focus pattern where blocks remain visually focused while
    // allowing character input to flow to the textarea

    const activeBlock = useMemo(() => {
      // Visual focus persists even when keyboard focus is temporarily given to textarea
      // This enables the dual focus pattern where preview remains visible during character input
      if (activeIndex >= 0 && activeIndex < filteredThemes.length) {
        return filteredThemes[activeIndex];
      }
      return null;
    }, [activeIndex, filteredThemes]);

    // Notify ready immediately
    useEffect(() => {
      onReady?.();
    }, [onReady]);

    const handleThemeSelection = useCallback(
      (item: ThemeItem) => {
        // Add to recent blocks
        addToRecentThemes(item);
        setRecentThemes(getRecentThemes());

        onThemeSelection?.(item);
        if (onCloseThemes) {
          setTimeout(() => onCloseThemes(), 100);
        }
      },
      [onThemeSelection, onCloseThemes],
    );

    // Expose methods
    useImperativeHandle(
      ref,
      () => ({
        focusOnThemes: () => {
          if (!isFocused) {
            setIsFocused(true);
            // CRITICAL: Don't reset activeIndex when re-focusing - maintain current selection
            // Only set activeIndex if no item is currently selected
            if (activeIndex === -1 && filteredThemes.length > 0) {
              setActiveIndex(0);
              setStartIndex(0);
            }
            // NOTE: Don't call containerRef.current?.focus() here!
            // This would steal DOM focus from textarea and hide the cursor.
            // For dual focus, textarea keeps DOM focus (cursor) while blocks get logical focus (keyboard handling)
          }
        },
        selectActiveTheme: () => {
          if (
            isFocused &&
            activeIndex >= 0 &&
            activeIndex < filteredThemes.length
          ) {
            const activeThemeItem = filteredThemes[activeIndex];
            handleThemeSelection(activeThemeItem);
            return true;
          }
          return false;
        },
      }),
      [filteredThemes, isFocused, activeIndex, handleThemeSelection],
    );

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (!isFocused || filteredThemes.length === 0) {
          return;
        }

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            setActiveIndex((prev) => {
              const nextIndex = prev + 1;
              const newIndex =
                nextIndex < filteredThemes.length ? nextIndex : 0;

              // Update startIndex to keep active element visible (like bookmarks-list)
              setStartIndex((currentStart) => {
                if (newIndex === 0) {
                  return 0; // Wrapped to beginning
                } else if (newIndex >= currentStart + 3) {
                  return Math.min(newIndex - 2, filteredThemes.length - 3); // Scroll down
                }
                return currentStart;
              });

              return newIndex;
            });
            break;
          case 'ArrowUp':
            e.preventDefault();
            setActiveIndex((prev) => {
              const newIndex = prev > 0 ? prev - 1 : filteredThemes.length - 1;

              // Update startIndex to keep active element visible (like bookmarks-list)
              setStartIndex((currentStart) => {
                if (newIndex === filteredThemes.length - 1) {
                  return Math.max(0, filteredThemes.length - 3); // Wrapped to end
                } else if (newIndex < currentStart) {
                  return Math.max(0, newIndex); // Scroll up
                }
                return currentStart;
              });

              return newIndex;
            });
            break;
          case 'Enter':
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < filteredThemes.length) {
              const activeThemeItem = filteredThemes[activeIndex];
              console.log('Selecting theme via Enter:', activeThemeItem);
              handleThemeSelection(activeThemeItem);
              setTimeout(() => {
                setIsFocused(false);
                setActiveIndex(-1);
                setStartIndex(0);
                if (onCloseThemes) {
                  onCloseThemes();
                }
                if (onFocusReturn) {
                  onFocusReturn();
                }
              }, 100);
            }
            break;
          case 'Escape':
            e.preventDefault();
            setIsFocused(false);
            setActiveIndex(-1);
            setStartIndex(0);
            if (onFocusChange) {
              onFocusChange(false);
            }
            if (onFocusReturn) {
              onFocusReturn();
            }
            break;
          default:
            // THE KEY TO DUAL FOCUS: Character input and editing keys return to textarea
            if (
              (e.key.length === 1 && !e.ctrlKey && !e.metaKey) || // Regular characters
              e.key === 'Backspace' || // Backspace to edit
              e.key === 'Delete' || // Delete to edit
              (e.ctrlKey &&
                (e.key === 'a' ||
                  e.key === 'x' ||
                  e.key === 'c' ||
                  e.key === 'v')) || // Ctrl+A, Ctrl+X, Ctrl+C, Ctrl+V
              (e.metaKey &&
                (e.key === 'a' ||
                  e.key === 'x' ||
                  e.key === 'c' ||
                  e.key === 'v')) // Cmd+A, Cmd+X, Cmd+C, Cmd+V (Mac)
            ) {
              // setIsFocused(false); // IMMEDIATELY stop handling events
              if (onFocusReturn) {
                onFocusReturn(); // Focus textarea
              }
              // NOTE: Key event continues propagating to textarea!
              // Do NOT reset activeIndex/startIndex - maintain visual focus
            }
            break;
        }
      },
      [
        isFocused,
        filteredThemes.length,
        activeIndex,
        handleThemeSelection,
        onFocusReturn,
        onFocusChange,
        onCloseThemes,
      ],
    );

    // Add keyboard listeners when focused
    useEffect(() => {
      if (isFocused) {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
    }, [isFocused, handleKeyDown]);

    const handleContainerFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    const handleContainerBlur = useCallback(() => {
      setTimeout(() => {
        // In dual focus mode, container doesn't get DOM focus, so this blur
        // should only reset focus state, not visual selection
        if (!containerRef.current?.contains(document.activeElement)) {
          setIsFocused(false);
          // Don't reset activeIndex here - visual focus should persist
          // Only explicit actions (Escape, selection, etc.) should reset it
        }
      }, 100);
    }, []);

    // Notify focus change
    useEffect(() => {
      onFocusChange?.(isFocused, activeBlock);
    }, [isFocused, activeBlock, onFocusChange]);

    return (
      <div
        ref={containerRef}
        tabIndex={-1}
        onFocus={handleContainerFocus}
        onBlur={handleContainerBlur}
        className="space-y-3 outline-none"
        role="listbox"
        aria-label="Blocks list"
      >
        {/* Preview */}
        {activeBlock && (
          <div className="mb-6 flex items-center justify-center rounded-lg">
            <div className="flex h-10 w-3/5 overflow-hidden rounded-lg ring-2 ring-muted-foreground">
              <div
                className="w-full"
                style={{ backgroundColor: activeBlock.cssVars.light.primary }}
              />
              <div
                className="w-full"
                style={{
                  backgroundColor: activeBlock.cssVars.light.background,
                }}
              />
              <div
                className="w-full"
                style={{ backgroundColor: activeBlock.cssVars.light.card }}
              />
              <div
                className="w-full"
                style={{ backgroundColor: activeBlock.cssVars.light.muted }}
              />
            </div>
          </div>
        )}

        {isSearching ? (
          <div className="flex items-center justify-center p-4">
            <Loader className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-muted-foreground text-xs">
              Searching Themes...
            </span>
          </div>
        ) : searchError ? (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-2 text-destructive text-xs">
            Search error: {searchError}
          </div>
        ) : filteredThemes.length > 0 ? (
          <div className="space-y-1">
            {/* Show category headers only for local blocks (when not searching) */}
            {!searchQuery?.trim() && (
              <>
                {/* Show Popular header only if there are visible popular blocks */}
                {visibleThemes.some(
                  (block) => block.category === 'popular',
                ) && (
                  <div
                    className={cn(
                      'px-1 font-medium text-muted-foreground text-xs',
                      visibleThemes.some(
                        (block) => block.category === 'recent',
                      ) && 'mt-2',
                    )}
                  >
                    Popular
                  </div>
                )}
              </>
            )}

            {visibleThemes.map((block, idx) => {
              // Visual focus indicator persists even during character input (dual focus pattern)
              const isItemFocused = activeIndex === startIndex + idx;
              return (
                <button
                  key={block.name}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md border p-2 text-left text-xs transition-colors',
                    isItemFocused
                      ? 'border-border bg-background ring-2 ring-muted-foreground'
                      : 'border-border bg-background hover:border-muted-foreground hover:bg-muted',
                  )}
                  onClick={() => handleThemeSelection(block)}
                >
                  <span className="truncate font-medium text-foreground">
                    {block.name
                      .split('-')
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(' ')}
                  </span>
                  {block.category === 'recent' && !searchQuery?.trim() && (
                    <span className="ml-auto rounded-full bg-blue-100 px-1.5 py-0.5 font-medium text-blue-800 text-xs dark:bg-blue-900 dark:text-blue-300">
                      Recent
                    </span>
                  )}
                </button>
              );
            })}

            <div className="flex items-center justify-between px-1 py-1">
              {filteredThemes.length > 0 && (
                <div className="text-muted-foreground text-xs">
                  {searchQuery?.trim() ? (
                    <>
                      Found {filteredThemes.length} Themes •{' '}
                      {activeIndex >= 0 ? activeIndex + 1 : 1} of{' '}
                      {filteredThemes.length}
                    </>
                  ) : (
                    <>
                      {activeIndex >= 0 ? activeIndex + 1 : 1} of{' '}
                      {filteredThemes.length}
                    </>
                  )}
                </div>
              )}
              <div className="ml-auto text-primary text-xs">
                ↑↓ navigate • ⏎ select
              </div>
            </div>
          </div>
        ) : (
          <div className="px-1 py-2 text-muted-foreground text-xs">
            {searchQuery?.trim()
              ? `No Themes found for "${searchQuery}"`
              : 'No Themes found'}
          </div>
        )}
      </div>
    );
  },
);

ThemesList.displayName = 'ThemesList';
