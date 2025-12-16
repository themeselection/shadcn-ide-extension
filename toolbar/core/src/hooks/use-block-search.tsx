import Fuse from 'fuse.js';
import { useEffect, useState } from 'react';
export interface BlockItem {
  name: string;
  description: string;
  category?: 'popular' | 'recent';
  type?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: FileItem[];
  meta?: MetaItem;
}

export interface FileItem {
  path: string;
  type: string;
  target: string;
}

export interface MetaItem {
  title: string;
  category: string;
  section: string;
  isPro: boolean;
}

interface UseBlockSearchOptions {
  licenseKey?: string;
  debounceMs?: number;
  minScore?: number;
  maxResults?: number;
}

interface UseBlockSearchResult {
  searchResults: BlockItem[];
  isSearching: boolean;
  searchError: string | null;
}

const performLocalSearch = (
  blocks: BlockItem[],
  query: string,
): BlockItem[] => {
  const fuseLocalSearchOptions = {
    keys: ['name'],
    threshold: 0.3,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  };
  const localBlocksFuse = new Fuse(blocks, fuseLocalSearchOptions);

  return localBlocksFuse.search(query).map((result) => result.item);
};

const fetchBlocksFromAPI = async () => {
  const fetchBlocksUrl =
    'https://shadcnstudio.com/r/blocks/registry.json?is_extension=true';

  try {
    const response = await fetch(fetchBlocksUrl, { method: 'GET' });
    if (!response.ok) {
      console.warn(
        `Failed to fetch blocks: ${response.status} ${response.statusText}`,
      );
      return [];
    }
    const data = await response.json();

    return data.items as BlockItem[];
  } catch (error) {
    console.warn('Error fetching blocks:', error);
    return [];
  }
};

const fetchAndSearchBlocks = async (query: string): Promise<BlockItem[]> => {
  try {
    // Step 1: Fetch from the registry
    const searchResults = await fetchBlocksFromAPI();
    if (searchResults.length === 0) {
      return [];
    }

    // Step 2: Fuzzy search the fetched blocks
    const fuseBlocksOptions = {
      keys: ['name'],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
    };

    const blocksFuse = new Fuse(searchResults, fuseBlocksOptions);
    const searchResult = blocksFuse.search(query).map((result) => result.item);

    return searchResult;
  } catch (error) {
    console.warn(
      'Shadcn/Studio API search failed, using local results only:',
      error,
    );
    return [];
  }
};

const removeDuplicateBlocks = (blocks: BlockItem[]): BlockItem[] => {
  const seen = new Set<string>();
  return blocks.filter((block) => {
    if (seen.has(block.name)) {
      return false;
    }
    seen.add(block.name);
    return true;
  });
};

export const useBlockSearch = (
  searchQuery: string,
  localBlocks: BlockItem[],
  options: UseBlockSearchOptions = {},
): UseBlockSearchResult => {
  const {
    licenseKey,
    debounceMs = 200,
    minScore = 0.35,
    maxResults = 20,
  } = options;

  const [searchResults, setSearchResults] = useState<BlockItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Search for blocks using the API
  useEffect(() => {
    if (!searchQuery?.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const query = searchQuery.trim().toLowerCase();

        // Step 1: Quick local search first
        const localResults = performLocalSearch(localBlocks, query);

        // Show local results immediately
        setSearchResults(localResults);

        // Step 2: Fetch from FlyonUI API (includes fuzzy search)
        const apiResults = await fetchAndSearchBlocks(query);

        if (apiResults.length > 0) {
          const combinedResults = [...apiResults, ...localResults];
          const uniqueResults = removeDuplicateBlocks(combinedResults);

          // Apply maxResults limit before updating state
          setSearchResults(uniqueResults.slice(0, maxResults));
        } else {
          console.log('No API results found, keeping local results only');
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('Search failed');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, localBlocks, licenseKey, debounceMs, minScore, maxResults]);

  return {
    searchResults,
    isSearching,
    searchError,
  };
};
