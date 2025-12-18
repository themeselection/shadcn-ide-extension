// Get VS Code API
const vscode = acquireVsCodeApi();

// State
let sectionsData = [];
let currentFilter = 'all';
let searchQuery = '';
let currentBlockPath = null;
let currentBlockName = null;
let licenseData = { email: '', licenseKey: '' };
let isInSectionDetails = false;
let currentSectionItems = [];
let CLIVersion = 'cli-v3';
let themesInitialized = false; // Track if themes have been initialized

// Tab switching function
function switchTab(tabName) {
  // Update tab buttons
  const mainTabs = document.querySelectorAll('.main-tab');
  mainTabs.forEach((tab) => {
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update tab contents
  const blocksTabContent = document.getElementById('blocksTabContent');
  const themesTabContent = document.getElementById('themesTabContent');

  if (tabName === 'blocks') {
    blocksTabContent.classList.add('active');
    themesTabContent.classList.remove('active');
  } else if (tabName === 'themes') {
    blocksTabContent.classList.remove('active');
    themesTabContent.classList.add('active');

    // Initialize themes on first switch to themes tab
    if (!themesInitialized) {
      window.initializeThemes();
      themesInitialized = true;
    }
  }
}

// License management functions
function initializeLicense() {
  // Request license data from extension
  vscode.postMessage({ type: 'getLicenseData' });
}

function saveLicense() {
  const emailInput = document.getElementById('emailInput');
  const licenseKeyInput = document.getElementById('licenseKeyInput');

  const email = emailInput ? emailInput.value.trim() : '';
  const licenseKey = licenseKeyInput ? licenseKeyInput.value.trim() : '';

  if (!email || !licenseKey) {
    return;
  }

  licenseData = { email, licenseKey };

  vscode.postMessage({
    type: 'saveLicenseData',
    data: licenseData,
  });

  // updateLicenseStatus(true);
}

function updateLicenseUI(data) {
  const emailInput = document.getElementById('emailInput');
  const licenseKeyInput = document.getElementById('licenseKeyInput');

  if (data) {
    licenseData = data;
    if (emailInput) emailInput.value = data.email || '';
    if (licenseKeyInput) licenseKeyInput.value = data.licenseKey || '';
    updateLicenseStatus(Boolean(data.email && data.licenseKey));
  }
}

function updateLicenseStatus(isActive) {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');

  if (statusDot && statusText) {
    if (isActive) {
      statusDot.classList.remove('inactive');
      statusDot.classList.add('active');
      statusText.textContent = 'License configured';
    } else {
      statusDot.classList.remove('active');
      statusDot.classList.add('inactive');
      statusText.textContent = 'No license configured';
    }
  }
}

function toggleLicenseSection() {
  const toggleBtn = document.getElementById('toggleLicenseBtn');
  const licenseContent = document.getElementById('licenseContent');

  if (toggleBtn && licenseContent) {
    toggleBtn.classList.toggle('collapsed');
    licenseContent.classList.toggle('collapsed');
  }
}

// Fuse.js configuration
let sectionsFuse = null;
let itemsFuse = null;

function initializeSectionsFuse(data) {
  const fuseOptions = {
    keys: ['name', 'description'],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  };
  sectionsFuse = new Fuse(data, fuseOptions);
}

function initializeItemsFuse(data) {
  const fuseOptions = {
    keys: ['name', 'description', 'meta.title'],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  };
  itemsFuse = new Fuse(data, fuseOptions);
}

function highlightMatches(text, query) {
  if (!text || !query) return escapeHtml(text);

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerText.includes(lowerQuery)) {
    const index = lowerText.indexOf(lowerQuery);
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    return `${escapeHtml(before)}<mark class="search-highlight">${escapeHtml(match)}</mark>${escapeHtml(after)}`;
  }

  let result = '';
  let textIndex = 0;
  let queryIndex = 0;

  while (textIndex < text.length) {
    if (
      queryIndex < query.length &&
      lowerText[textIndex] === lowerQuery[queryIndex]
    ) {
      result += `<mark class="search-highlight">${escapeHtml(text[textIndex])}</mark>`;
      queryIndex++;
    } else {
      result += escapeHtml(text[textIndex]);
    }
    textIndex++;
  }

  return result;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// Fetch Sections Data
function fetchSectionsData() {
  showLoadingState(true);
  vscode.postMessage({ type: 'fetchSectionsData' });
}

function refreshData() {
  fetchSectionsData();
}

function openBlock(path, name) {
  currentBlockPath = path;
  currentBlockName = name;
  vscode.postMessage({
    type: 'openBlock',
    path: path,
    name: name,
  });
}

function copyInstallationCmd(command, CLIVersion) {
  vscode.postMessage({
    type: 'copyToClipboard',
    text: command,
    cliVersion: CLIVersion,
  });
}

function installCmd(command, CLIVersion) {
  vscode.postMessage({
    type: 'openTerminalandInstall',
    command,
    cliVersion: CLIVersion,
  });
}

function sendToIDEAgent(path, name) {
  vscode.postMessage({
    type: 'sendToIDEAgent',
    path: path,
    name: name,
  });
}

function previewBlock(path, name) {
  vscode.postMessage({
    type: 'previewBlock',
    path: path,
    name: name,
  });
}

function openExternalUrl(url) {
  vscode.postMessage({
    type: 'openExternalUrl',
    url: url,
  });
}

// State management
function showLoadingState(loading) {
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const errorState = document.getElementById('errorState');
  const containerGrid = document.getElementById('containerGrid');

  if (loading) {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
    containerGrid.classList.add('hidden');
  } else {
    loadingState.classList.add('hidden');
  }
}

function showEmptyState() {
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const errorState = document.getElementById('errorState');
  const containerGrid = document.getElementById('containerGrid');

  loadingState.classList.add('hidden');
  emptyState.classList.remove('hidden');
  errorState.classList.add('hidden');
  containerGrid.classList.add('hidden');
}

function showErrorState(message) {
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const errorState = document.getElementById('errorState');
  const errorMessage = document.getElementById('errorMessage');
  const containerGrid = document.getElementById('containerGrid');

  loadingState.classList.add('hidden');
  emptyState.classList.add('hidden');
  errorState.classList.remove('hidden');
  containerGrid.classList.add('hidden');

  if (errorMessage) {
    errorMessage.textContent = message || 'Failed to load blocks';
  }
}

function showContainerGrid() {
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const errorState = document.getElementById('errorState');
  const containerGrid = document.getElementById('containerGrid');

  loadingState.classList.add('hidden');
  emptyState.classList.add('hidden');
  errorState.classList.add('hidden');
  containerGrid.classList.remove('hidden');
}

// Filter blocks
function filterBlocks(searchTerm) {
  searchQuery = searchTerm.trim().toLowerCase();
  if (isInSectionDetails) {
    renderSectionDetailsFiltered();
  } else {
    renderSections();
  }
}

function setFilter(filter) {
  currentFilter = filter;

  // Update active tab
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach((tab) => {
    if (tab.dataset.filter === filter) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  if (isInSectionDetails) {
    renderSectionDetailsFiltered();
  } else {
    renderSections();
  }
}

// Render blocks grid
function renderSections() {
  const containerGrid = document.getElementById('containerGrid');
  if (!containerGrid) return;

  let filteredSections = sectionsData;

  // Apply fuzzy search using Fuse.js
  if (searchQuery && sectionsFuse) {
    const results = sectionsFuse.search(searchQuery);
    filteredSections = results.map((result) => result.item);
  }

  // Apply category filter
  if (currentFilter !== 'all') {
    filteredSections = filteredSections.filter((section) => {
      return (
        section.name.toLowerCase().includes(currentFilter) ||
        section.categories?.some((cat) =>
          cat.toLowerCase().includes(currentFilter),
        )
      );
    });
  }

  if (filteredSections.length === 0) {
    containerGrid.innerHTML = `
      <div class="no-results" style="grid-column: 1 / -1;">
        <div class="no-results-icon">🔍</div>
        <p>No sections found matching your criteria</p>
      </div>
    `;
    return;
  }

  containerGrid.innerHTML = filteredSections
    .map((section) => {
      return createSectionCardHtml(section);
    })
    .join('');

  // Add click handlers
  containerGrid.querySelectorAll('.section-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const name = card.dataset.name;
      openSectionDetails(id, name);
    });
  });
}

function createSectionCardHtml(section) {
  const displayName = searchQuery
    ? highlightMatches(section.name, searchQuery)
    : escapeHtml(section.name);

  return `
    <div class="section-card" data-id="${escapeHtml(section.id)}" data-name="${escapeHtml(section.name)}">
      <div class="section-card-image-wrapper">
        <img src="${escapeHtml(section.img)}" alt="${escapeHtml(section.name)}" class="section-card-image" />
      </div>
      <div class="section-card-content">
        <h3 class="section-card-title">${displayName}</h3>
        <div class="section-card-footer">
          <span class="section-card-count">${section.count || 0} ${section.count === 1 ? 'block' : 'blocks'}</span>
        </div>
      </div>
    </div>
  `;
}

function formateSectionName(name) {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Open Section details
function openSectionDetails(id, name) {
  currentSectionName = name;
  isInSectionDetails = true;
  searchQuery = ''; // Clear search when entering section details
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  // Fetch section details
  vscode.postMessage({
    type: 'openSectionDetails',
    id: id,
    name: name,
  });
}

function goBackToBlocks() {
  isInSectionDetails = false;
  currentSectionItems = [];
  itemsFuse = null;
  searchQuery = ''; // Clear search when going back
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  fetchSectionsData();
}

// Render Section details
function renderSectionDetails(data, error) {
  const containerGrid = document.getElementById('containerGrid');
  if (!containerGrid) return;

  if (error) {
    showErrorState(error);
    return;
  }

  if (error || !data) {
    containerGrid.innerHTML = `
      <button class="go-back-btn" onclick="goBackToBlocks()">
        <span class="back-icon">←</span>
        <span>Go Back</span>
      </button>
      <div class="details-loading">
        <div class="error-icon">⚠️</div>
        <p>${escapeHtml(error) || 'Failed to load block details'}</p>
      </div>
    `;
    return;
  }

  const items = Array.isArray(data) ? data : [data];
  currentSectionItems = items;
  initializeItemsFuse(items);
  renderSectionDetailsFiltered();
}

// Render filtered section details
function renderSectionDetailsFiltered() {
  const containerGrid = document.getElementById('containerGrid');
  if (!containerGrid) return;

  let filteredItems = currentSectionItems;

  // Apply fuzzy search using Fuse.js
  if (searchQuery && itemsFuse) {
    const results = itemsFuse.search(searchQuery);
    filteredItems = results.map((result) => result.item);
  }

  const items = filteredItems;

  if (items.length === 0) {
    const message = searchQuery
      ? `No blocks found matching "${escapeHtml(searchQuery)}"`
      : 'No blocks found in this section';
    containerGrid.innerHTML = `
      <button class="go-back-btn" onclick="goBackToBlocks()">
        <span class="back-icon">←</span>
        <span>Go Back</span>
      </button>
      <div class="details-loading">
        <div class="error-icon">🔍</div>
        <p>${message}</p>
      </div>
    `;
    return;
  }

  containerGrid.innerHTML = `
    <button class="go-back-btn" onclick="goBackToBlocks()">
      <span class="back-icon">←</span>
      <span>Go Back</span>
    </button>
    <div class="section-details-header">
      <h3 class="section-title">${escapeHtml(formateSectionName(currentSectionName) || 'Section Details')}</h3>
    </div>
    <div class="blocks-list">
      ${items
        .map((item) => {
          const imgUrl = `https://cdn.shadcnstudio.com/ss-assets/ide-extension/${item.meta?.category || ''}/${item.meta?.section || ''}/${item.name}.png?format=auto`;

          return `
        <div class="block-item">
          ${imgUrl ? `<img src="${imgUrl}" alt="${escapeHtml(item.name || 'Unknown Block')}" class="component-image" />` : ''}
          <div class="block-item-header">
            <div class="block-name-wrapper">
              <span class="block-item-name">${searchQuery ? highlightMatches(item.meta?.title || 'Unknown Block', searchQuery) : escapeHtml(item.meta?.title || 'Unknown Block')}</span>
            </div>
            <div class="block-item-actions">
              <button class="icon-btn preview-btn" onclick="openExternalUrl('https://shadcnstudio.com/preview/${item.meta?.category || ''}/${item.meta?.section || ''}/${item.name}')" title="Preview block">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
              <button class="icon-btn copy-btn copy-cmd-btn" data-item="${escapeHtml(item.name)}" title="Copy command">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button class="icon-btn install-btn install-cmd-btn" data-item="${escapeHtml(item.name)}" title="Install block">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
        })
        .join('')}
    </div>
  `;
}

// Handle messages from extension
window.addEventListener('message', (event) => {
  const message = event.data;

  switch (message.type) {
    case 'licenseDataReceived':
      updateLicenseUI(message.data);
      break;

    case 'licenseSaved':
      if (message.success) {
        updateLicenseStatus(true);
      }
      break;

    case 'sectionsDataLoading':
      if (message.loading) {
        showLoadingState(true);
      }
      break;

    case 'sectionsDataReceived':
      showLoadingState(false);
      if (message.error) {
        showErrorState(message.error);
      } else if (message.data && message.data.length > 0) {
        sectionsData = message.data;
        initializeSectionsFuse(sectionsData);
        renderSections();
        showContainerGrid();
      } else {
        showEmptyState();
      }
      break;

    case 'sectionDetailsReceived':
      showLoadingState(false);
      if (message.error) {
        showErrorState(message.error);
        return;
      }
      renderSectionDetails(message.data, message.error);
      showContainerGrid(); // Show containerGrid and hide other states
      break;
  }
});

// Setup event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize license data
  initializeLicense();

  // Main tab switching
  const mainTabs = document.querySelectorAll('.main-tab');
  mainTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      if (tabName) {
        switchTab(tabName);
      }
    });
  });

  // Event delegation for buttons (handles dynamically created buttons)
  document.addEventListener('click', (e) => {
    // Handle copy command button
    if (
      e.target.classList.contains('copy-cmd-btn') ||
      e.target.closest('.copy-cmd-btn')
    ) {
      const btn = e.target.classList.contains('copy-cmd-btn')
        ? e.target
        : e.target.closest('.copy-cmd-btn');
      const itemName = btn.dataset.item;
      console.log('Item name for installation command:', itemName, CLIVersion);
      if (itemName) {
        const command =
          CLIVersion === 'cli-v3'
            ? `npx shadcn@latest add @ss-blocks/${itemName}`
            : `npx shadcn@latest add "https://shadcnstudio.com/r/blocks/${itemName}`;
        copyInstallationCmd(command, CLIVersion);
      }
    }

    // Handle preview button
    if (
      e.target.classList.contains('btn-preview') ||
      e.target.closest('.btn-preview')
    ) {
      const btn = e.target.classList.contains('btn-preview')
        ? e.target
        : e.target.closest('.btn-preview');
      const previewUrl = btn.dataset.previewUrl;
      if (previewUrl) {
        openExternalUrl(previewUrl);
      }
    }

    // Handle Install command button
    if (
      e.target.classList.contains('install-cmd-btn') ||
      e.target.closest('.install-cmd-btn')
    ) {
      const installBtn = e.target.classList.contains('install-cmd-btn')
        ? e.target
        : e.target.closest('.install-cmd-btn');
      const itemName = installBtn.dataset.item;
      if (itemName) {
        const command =
          CLIVersion === 'cli-v3'
            ? `npx shadcn@latest add @ss-blocks/${itemName}`
            : `npx shadcn@latest add "https://shadcnstudio.com/r/blocks/${itemName}`;
        installCmd(command, CLIVersion);
      }
    }
  });

  // Event delegation for CLI version selector (handles dynamically created select)
  const cliVersionSelector = document.getElementById('cliVersionSelector');
  if (cliVersionSelector) {
    cliVersionSelector.addEventListener('change', (e) => {
      CLIVersion = e.target.value;
    });
  }

  // License section toggle
  const licenseHeader = document.querySelector('.license-header');
  if (licenseHeader) {
    licenseHeader.addEventListener('click', toggleLicenseSection);
    toggleLicenseSection(); // Start collapsed
  }

  // Save license button
  const saveLicenseBtn = document.getElementById('saveLicenseBtn');
  if (saveLicenseBtn) {
    saveLicenseBtn.addEventListener('click', saveLicense);
  }

  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshData);
  }

  // Open docs button
  const openDocsBtn = document.getElementById('openDocsBtn');
  if (openDocsBtn) {
    openDocsBtn.addEventListener('click', () => {
      openExternalUrl('https://ui.shadcn.com/blocks');
    });
  }

  // Fetch blocks button
  const fetchSectionsBtn = document.getElementById('fetchSectionBtn');
  if (fetchSectionsBtn) {
    fetchSectionsBtn.addEventListener('click', fetchSectionsData);
  }

  // Retry button
  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
  }

  // Back button
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', goBackToBlocks);
  }

  // Preview button
  const previewBtn = document.getElementById('previewBtn');
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      if (currentBlockPath) {
        previewBlock(currentBlockPath, currentBlockName);
      }
    });
  }

  // Send to agent button
  const sendToAgentBtn = document.getElementById('sendToAgentBtn');
  if (sendToAgentBtn) {
    sendToAgentBtn.addEventListener('click', () => {
      if (currentBlockPath) {
        sendToIDEAgent(currentBlockPath, currentBlockName);
      }
    });
  }

  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterBlocks(e.target.value);
    });
  }

  // Filter tabs
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setFilter(tab.dataset.filter || 'all');
    });
  });

  // Footer links
  const shadcnStudioLink = document.getElementById('shadcnStudioLink');
  if (shadcnStudioLink) {
    shadcnStudioLink.addEventListener('click', (e) => {
      e.preventDefault();
      openExternalUrl('https://shadcnstudio.com');
    });
  }

  const getLicenseLink = document.getElementById('getLicenseLink');
  if (getLicenseLink) {
    getLicenseLink.addEventListener('click', (e) => {
      e.preventDefault();
      openExternalUrl('https://shadcnstudio.com#pricing');
    });
  }

  const docsLink = document.getElementById('docsLink');
  if (docsLink) {
    docsLink.addEventListener('click', (e) => {
      e.preventDefault();
      openExternalUrl('https://shadcnstudio.com/docs');
    });
  }
});

// Make functions globally accessible
window.filterBlocks = filterBlocks;
window.setFilter = setFilter;
window.goBackToBlocks = goBackToBlocks;
window.copyInstallationCmd = copyInstallationCmd;
window.sendToIDEAgent = sendToIDEAgent;
window.previewBlock = previewBlock;
window.fetchSectionsData = fetchSectionsData;
window.saveLicense = saveLicense;
window.toggleLicenseSection = toggleLicenseSection;
window.switchTab = switchTab;
