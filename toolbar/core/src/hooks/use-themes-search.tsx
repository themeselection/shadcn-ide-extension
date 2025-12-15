import Fuse from 'fuse.js';
import { useEffect, useState } from 'react';

export interface ThemeItem {
  name: string;
  category?: 'popular' | 'recent';
  type?: string;
  cssVars: {
    theme: Record<string, string>;
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

interface UseThemeSearchOptions {
  licenseKey?: string;
  debounceMs?: number;
  minScore?: number;
  maxResults?: number;
}

interface UseThemeSearchResult {
  searchResults: ThemeItem[];
  isSearching: boolean;
  searchError: string | null;
}

const fetchThemesFromAPI = async () => {
  const fetchThemesUrl =
    'https://shadcnstudio.com/r/themes/registry.json?is_extension=true';

  try {
    const response = await fetch(fetchThemesUrl, { method: 'GET' });
    if (!response.ok) {
      console.warn(
        `Failed to fetch themes: ${response.status} ${response.statusText}`,
      );
      return [];
    }
    const data = await response.json();

    return data.items as ThemeItem[];
  } catch (error) {
    console.warn('Error fetching themes:', error);
    return [];
  }
};

const fetchAndSearchThemes = async (searchQuery: string) => {
  try {
    // Step 1: Fetch themes from API
    const searchResults = await fetchThemesFromAPI();
    if (searchResults.length === 0) {
      return [];
    }

    // Step 2: Fuzzy search the fetched blocks
    const fuseThemesOptions = {
      keys: ['name'],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
    };

    // 3. Perform search
    const themesFuse = new Fuse(searchResults, fuseThemesOptions);
    const searchResult = themesFuse
      .search(searchQuery)
      .map((result) => result.item);

    return searchResult;
  } catch (error) {
    console.warn('Shadcn/Studio API search failed:', error);
    return [];
  }
};

export const useThemeSearch = (
  searchQuery: string,
  options: UseThemeSearchOptions = {},
): UseThemeSearchResult => {
  const {
    licenseKey,
    debounceMs = 200,
    minScore = 0.35,
    maxResults = 20,
  } = options;

  const [searchResults, setSearchResults] = useState<ThemeItem[]>([]);
  const [initialThemes, setInitialThemes] = useState<ThemeItem[]>([]);
  const [isSearching, setIsSearching] = useState(true); // Start as true for initial load
  const [searchError, setSearchError] = useState<string | null>(null);

  // Fetch initial themes on mount
  useEffect(() => {
    const loadInitialThemes = async () => {
      setIsSearching(true);
      try {
        const themes = await fetchThemesFromAPI();
        setInitialThemes(themes);
        setSearchResults(themes);
      } catch (error) {
        console.error('Error loading initial themes:', error);
        setSearchError('Failed to load themes');
      } finally {
        setIsSearching(false);
      }
    };

    loadInitialThemes();
  }, []); // Only run once on mount

  // Search for themes using the API
  useEffect(() => {
    if (!searchQuery?.trim()) {
      // When no search query, show initial themes (keep loading state if initial themes not loaded)
      if (initialThemes.length > 0) {
        setSearchResults(initialThemes);
        setSearchError(null);
      }
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const query = searchQuery.trim().toLowerCase();
        const apiResults = await fetchAndSearchThemes(query);

        setSearchResults(apiResults.slice(0, maxResults));
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('Search failed');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => clearTimeout(searchTimeout);
  }, [
    searchQuery,
    initialThemes,
    licenseKey,
    debounceMs,
    minScore,
    maxResults,
  ]);

  return {
    searchResults,
    isSearching,
    searchError,
  };
};
