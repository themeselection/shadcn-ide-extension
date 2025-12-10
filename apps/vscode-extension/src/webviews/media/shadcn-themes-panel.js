// Themes Panel JavaScript
// Handles theme fetching, searching, and display
// theme sequence to display in the panel : primary, background, muted, card
// Note: Uses the global `vscode` variable from shadcn-blocks-panel.js
// acquireVsCodeApi() can only be called once per webview

// State
let themesData = [];
let themesSearchQuery = '';
let themesFuse = null;

// Initialize Fuse.js for themes search
function initializeThemesFuse(data) {
  const fuseOptions = {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  };
  themesFuse = new Fuse(data, fuseOptions);
}

// Escape HTML to prevent XSS
function escapeHtmlThemes(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// Highlight search matches
function highlightThemeMatches(text, query) {
  if (!text || !query) return escapeHtmlThemes(text);

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerText.includes(lowerQuery)) {
    const index = lowerText.indexOf(lowerQuery);
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    return `${escapeHtmlThemes(before)}<mark class="search-highlight">${escapeHtmlThemes(match)}</mark>${escapeHtmlThemes(after)}`;
  }

  return escapeHtmlThemes(text);
}

// Fetch themes data (using fake data for now)
function fetchThemesData() {
  showThemesLoadingState(true);

  // Fetch theme data from VSCode extension host
  vscode.postMessage({ type: 'fetchThemesData' });
}

// State management functions
function showThemesLoadingState(loading) {
  const loadingState = document.getElementById('themesLoadingState');
  const emptyState = document.getElementById('themesEmptyState');
  const errorState = document.getElementById('themesErrorState');
  const themesGrid = document.getElementById('themesGrid');

  if (loading) {
    loadingState?.classList.remove('hidden');
    emptyState?.classList.add('hidden');
    errorState?.classList.add('hidden');
    themesGrid?.classList.add('hidden');
  } else {
    loadingState?.classList.add('hidden');
  }
}

function showThemesEmptyState() {
  const loadingState = document.getElementById('themesLoadingState');
  const emptyState = document.getElementById('themesEmptyState');
  const errorState = document.getElementById('themesErrorState');
  const themesGrid = document.getElementById('themesGrid');

  loadingState?.classList.add('hidden');
  emptyState?.classList.remove('hidden');
  errorState?.classList.add('hidden');
  themesGrid?.classList.add('hidden');
}

function showThemesErrorState(message) {
  const loadingState = document.getElementById('themesLoadingState');
  const emptyState = document.getElementById('themesEmptyState');
  const errorState = document.getElementById('themesErrorState');
  const errorMessage = document.getElementById('themesErrorMessage');
  const themesGrid = document.getElementById('themesGrid');

  loadingState?.classList.add('hidden');
  emptyState?.classList.add('hidden');
  errorState?.classList.remove('hidden');
  themesGrid?.classList.add('hidden');

  if (errorMessage) {
    errorMessage.textContent = message || 'Failed to load themes';
  }
}

function showThemesGrid() {
  const loadingState = document.getElementById('themesLoadingState');
  const emptyState = document.getElementById('themesEmptyState');
  const errorState = document.getElementById('themesErrorState');
  const themesGrid = document.getElementById('themesGrid');

  loadingState?.classList.add('hidden');
  emptyState?.classList.add('hidden');
  errorState?.classList.add('hidden');
  themesGrid?.classList.remove('hidden');
}

// Filter themes by search query
function filterThemes(searchTerm) {
  themesSearchQuery = searchTerm.trim().toLowerCase();
  renderThemes();
}

// Render themes grid
function renderThemes() {
  const themesGrid = document.getElementById('themesGrid');
  if (!themesGrid) return;

  let filteredThemes = themesData;

  console.log(
    'Rendering themes with search query:',
    themesSearchQuery,
    themesFuse,
  );
  // Apply fuzzy search using Fuse.js
  if (themesSearchQuery && themesFuse) {
    const results = themesFuse.search(themesSearchQuery);
    console.log('Fuse search results:', results);
    filteredThemes = results.map((result) => result.item);
  }

  if (filteredThemes.length === 0) {
    const message = themesSearchQuery
      ? `No themes found matching "${escapeHtmlThemes(themesSearchQuery)}"`
      : 'No themes available';
    themesGrid.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1;">
        <div class="no-results-icon">🔍</div>
        <p>${message}</p>
      </div>
    `;
    return;
  }

  themesGrid.innerHTML = filteredThemes
    .map((theme) => createThemeCardHtml(theme))
    .join('');
}

// Extract preview colors from theme cssVars
function getThemePreviewColors(theme) {
  const lightVars = theme.cssVars?.light || {};
  // Extract key colors for preview: primary, background, muted, card
  const colorKeys = ['primary', 'background', 'muted', 'card'];
  return colorKeys.map((key) => lightVars[key]).filter((color) => color); // Filter out undefined values
}

// Create theme card HTML
function createThemeCardHtml(theme) {
  const themeName = theme.name || 'Unnamed Theme';
  const themeId = theme.name; // Use name as ID since there's no separate id field

  const displayName = themesSearchQuery
    ? highlightThemeMatches(themeName, themesSearchQuery)
    : escapeHtmlThemes(themeName);

  // Get preview colors from cssVars
  const previewColors = getThemePreviewColors(theme);
  const colorSwatches = previewColors
    .map(
      (color) =>
        `<div class="theme-preview-color" style="background-color: ${color};"></div>`,
    )
    .join('');

  return `
    <div class="theme-card" data-id="${escapeHtmlThemes(themeId)}">
      <div class="theme-preview">
        <div class="theme-preview-colors">
          ${colorSwatches}
        </div>
      </div>
      <div class="theme-info">
        <h4 class="theme-name">${displayName
          .split('-')
          .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
          .join(' ')}</h4>
        <div class="theme-actions">
          <button class="btn-action btn-copy theme-apply-btn" data-theme-id="${escapeHtmlThemes(themeId)}">
            <span class="action-icon">✓</span>
            <span>Apply</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Handle theme actions

function applyTheme(themeId) {
  const theme = themesData.find((t) => t.name === themeId);

  if (theme) {
    const themeInstallationCmd =
      CLIVersion === 'cli-v3'
        ? `npx shadcn@latest add @ss-themes/${theme.name}`
        : `npx shadcn@latest add "https://shadcnstudio.com/r/themes/${theme.name}.json`;
    vscode.postMessage({
      type: 'openTerminalandInstall',
      command: themeInstallationCmd,
      cliVersion: CLIVersion,
    });
  }
}

// Initialize themes when DOM is ready
function initializeThemes() {
  // Add search input for themes
  const themesSearchInput = document.getElementById('themesSearchInput');
  if (themesSearchInput) {
    themesSearchInput.addEventListener('input', (e) => {
      filterThemes(e.target.value);
    });
  }

  // Event delegation for theme buttons
  document.addEventListener('click', (e) => {
    // Handle theme apply button
    if (
      e.target.classList.contains('theme-apply-btn') ||
      e.target.closest('.theme-apply-btn')
    ) {
      const btn = e.target.classList.contains('theme-apply-btn')
        ? e.target
        : e.target.closest('.theme-apply-btn');
      const themeId = btn.dataset.themeId;
      if (themeId) {
        applyTheme(themeId);
      }
    }
  });

  console.log(
    'Fetching themes data at the end of initializeThemes function...',
  );
  // Fetch themes data on init
  fetchThemesData();
}

window.addEventListener('message', (event) => {
  const message = event.data;

  switch (message.type) {
    case 'themesDataLoading':
      if (message.loading) {
        showThemesLoadingState(true);
      }
      break;

    case 'themesDataReceived':
      showThemesLoadingState(false);
      if (message.error) {
        showThemesErrorState(message.error);
      } else if (message.data && message.data.length > 0) {
        themesData = message.data;
        console.log('Received themes data:', themesData);
        initializeThemesFuse(themesData);
        renderThemes();
        showThemesGrid();
      } else {
        showThemesEmptyState();
      }
      break;
  }
});

// Make functions globally accessible
window.fetchThemesData = fetchThemesData;
window.filterThemes = filterThemes;
window.renderThemes = renderThemes;
window.applyTheme = applyTheme;
window.initializeThemes = initializeThemes;
