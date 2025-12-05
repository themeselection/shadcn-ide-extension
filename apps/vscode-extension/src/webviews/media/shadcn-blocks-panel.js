// Get VS Code API
const vscode = acquireVsCodeApi();

// State
let sectionsData = [];
let currentFilter = 'all';
let searchQuery = '';
let currentBlockPath = null;
let currentBlockName = null;
let licenseData = { email: '', licenseKey: '' };

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

  updateLicenseStatus(true);
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

// Fuzzy search utility function
function fuzzyMatch(text, query) {
  if (!text || !query) return { match: false, score: 0 };

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Exact match gets highest score
  if (lowerText.includes(lowerQuery)) {
    return { match: true, score: 100 - lowerText.indexOf(lowerQuery) * 10 };
  }

  // Fuzzy matching algorithm
  let textIndex = 0;
  let queryIndex = 0;
  const matches = [];
  let consecutiveMatches = 0;
  let totalScore = 0;

  while (textIndex < lowerText.length && queryIndex < lowerQuery.length) {
    if (lowerText[textIndex] === lowerQuery[queryIndex]) {
      matches.push(textIndex);
      consecutiveMatches++;
      queryIndex++;
      totalScore += consecutiveMatches * 2;
    } else {
      consecutiveMatches = 0;
    }
    textIndex++;
  }

  if (queryIndex === lowerQuery.length) {
    const wordBoundaryBonus =
      matches.filter(
        (index) =>
          index === 0 ||
          lowerText[index - 1] === ' ' ||
          lowerText[index - 1] === '-' ||
          lowerText[index - 1] === '_',
      ).length * 5;

    const spread =
      matches.length > 1 ? matches[matches.length - 1] - matches[0] : 0;
    const spreadPenalty = Math.floor(spread / lowerQuery.length);

    totalScore += wordBoundaryBonus - spreadPenalty;

    const normalizedScore = Math.max(
      0,
      Math.min(100, totalScore * (lowerQuery.length / lowerText.length) * 50),
    );

    return { match: true, score: normalizedScore };
  }

  return { match: false, score: 0 };
}

function fuzzySearchItems(items, query, searchFields) {
  if (!query.trim()) {
    return items;
  }

  const results = [];

  items.forEach((item) => {
    let bestScore = 0;
    let hasMatch = false;

    searchFields.forEach((field) => {
      const fieldValue = getNestedProperty(item, field);
      if (fieldValue) {
        const result = fuzzyMatch(fieldValue, query);
        if (result.match) {
          hasMatch = true;
          bestScore = Math.max(bestScore, result.score);
        }
      }
    });

    if (hasMatch) {
      results.push({ item, score: bestScore });
    }
  });

  results.sort((a, b) => b.score - a.score);

  return results.map((result) => result.item);
}

function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
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

// Main functions
function fetchSectionsData() {
  showLoadingState(true);
  vscode.postMessage({ type: 'fetchSectionsData' });
}

function refreshData() {
  fetchSectionsData();
}

function copyToClipboard(text) {
  vscode.postMessage({
    type: 'copyToClipboard',
    text: text,
  });
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

function copyBlockCode(path) {
  vscode.postMessage({
    type: 'copyBlockCode',
    path: path,
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
  renderBlocksGrid();
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

  renderBlocksGrid();
}

// Render blocks grid
function renderSections() {
  const containerGrid = document.getElementById('containerGrid');
  if (!containerGrid) return;

  const filteredSections = sectionsData.filter((section) => {
    const matchesSearch =
      !searchQuery ||
      section.name.toLowerCase().includes(searchQuery) ||
      section.description?.toLowerCase().includes(searchQuery);

    const matchesFilter =
      currentFilter === 'all' ||
      section.name.toLowerCase().includes(currentFilter) ||
      section.categories?.some((cat) =>
        cat.toLowerCase().includes(currentFilter),
      );

    return matchesSearch && matchesFilter;
  });

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
      console.log('Rendering section:', section);
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
      <div class="section-preview">
        ${getSectionIcon(section.name)}
      </div>
      <div class="section-info">
        <p class="section-name">${displayName}</p>
        <p class="section-type">${section.count || 0} blocks</p>
      </div>
    </div>
  `;
}

function getSectionIcon(name) {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('sidebar')) return '📑';
  if (nameLower.includes('login') || nameLower.includes('auth')) return '🔐';
  if (nameLower.includes('dashboard')) return '📊';
  if (nameLower.includes('chart')) return '📈';
  if (nameLower.includes('table')) return '📋';
  if (nameLower.includes('form')) return '📝';
  if (nameLower.includes('card')) return '🃏';
  if (nameLower.includes('calendar')) return '📅';
  return '▢';
}

function formateSectionName(name) {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Open Section details
function openSectionDetails(id, name) {
  currentSectionId = id;
  currentSectionName = name;

  // Fetch section details
  vscode.postMessage({
    type: 'openSectionDetails',
    id: id,
    name: name,
  });
}

function goBackToBlocks() {
  fetchSectionsData();
}

// Render block details
function renderBlockDetails(data, error) {
  console.log('Rendering block details:', data, error);
  const containerGrid = document.getElementById('containerGrid');
  if (!containerGrid) return;

  if (error || !data) {
    containerGrid.innerHTML = `
      <button class="go-back-btn" onclick="goBackToBlocks()">← Go Back</button>
      <div class="details-loading">
        <div class="error-icon">⚠️</div>
        <p>${escapeHtml(error) || 'Failed to load block details'}</p>
      </div>
    `;
    return;
  }

  // Data is an array of items (blocks in the section)
  const items = Array.isArray(data) ? data : [data];

  if (items.length === 0) {
    containerGrid.innerHTML = `
      <button class="go-back-btn" onclick="goBackToBlocks()">← Go Back</button>
      <div class="details-loading">
        <div class="error-icon">📭</div>
        <p>No blocks found in this section</p>
      </div>
    `;
    return;
  }

  containerGrid.innerHTML = `
    <button class="go-back-btn" onclick="goBackToBlocks()">← Go Back</button>
    <div class="section-header">
      <h3>${escapeHtml(currentSectionName || 'Section Details')}</h3>
      <span class="item-count">${items.length} blocks</span>
    </div>
    <div class="details-files">
      ${items
        .map(
          (item) => `
        <div class="file-item">
          <div class="file-header">
            <span class="file-name">${escapeHtml(item.name || 'Unknown Block')}</span>
            <span class="file-type">${escapeHtml(item.meta?.title || item.type || '')}</span>
          </div>
          <p class="file-description">${escapeHtml(item.description || '')}</p>
          ${
            item.files && item.files.length > 0
              ? `<div class="file-paths">${item.files.map((f) => `<span class="file-path">${escapeHtml(f.path || f.target || '')}</span>`).join('')}</div>`
              : ''
          }
          ${
            (item.dependencies && item.dependencies.length > 0) ||
            (item.registryDependencies && item.registryDependencies.length > 0)
              ? `
            <div class="dependencies-list">
              ${(item.dependencies || []).map((dep) => `<span class="dependency-tag">${escapeHtml(dep)}</span>`).join('')}
              ${(item.registryDependencies || []).map((dep) => `<span class="dependency-tag">@shadcn/${escapeHtml(dep)}</span>`).join('')}
            </div>
          `
              : ''
          }
        </div>
      `,
        )
        .join('')}
    </div>
  `;
}

function getFileType(filename) {
  if (!filename) return 'file';
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'ts':
      return 'TypeScript';
    case 'jsx':
    case 'js':
      return 'JavaScript';
    case 'css':
      return 'CSS';
    case 'json':
      return 'JSON';
    default:
      return ext?.toUpperCase() || 'file';
  }
}

function truncateCode(code, maxLength = 200) {
  if (code.length <= maxLength) return code;
  return code.substring(0, maxLength) + '...';
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
      renderBlockDetails(message.data, message.error);
      showContainerGrid(); // Show containerGrid and hide other states
      break;
  }
});

// Setup event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize license data
  initializeLicense();

  // License section toggle
  const licenseHeader = document.querySelector('.license-header');
  if (licenseHeader) {
    licenseHeader.addEventListener('click', toggleLicenseSection);
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

  // Copy code button
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
      if (currentBlockPath) {
        copyBlockCode(currentBlockPath);
      }
    });
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
  const shadcnLink = document.getElementById('shadcnLink');
  if (shadcnLink) {
    shadcnLink.addEventListener('click', (e) => {
      e.preventDefault();
      openExternalUrl('https://ui.shadcn.com');
    });
  }

  const githubLink = document.getElementById('githubLink');
  if (githubLink) {
    githubLink.addEventListener('click', (e) => {
      e.preventDefault();
      openExternalUrl('https://github.com/shadcn-ui/ui');
    });
  }

  const docsLink = document.getElementById('docsLink');
  if (docsLink) {
    docsLink.addEventListener('click', (e) => {
      e.preventDefault();
      openExternalUrl('https://ui.shadcn.com/docs');
    });
  }
});

// Make functions globally accessible
window.filterBlocks = filterBlocks;
window.setFilter = setFilter;
window.openBlockDetails = openBlockDetails;
window.goBackToBlocks = goBackToBlocks;
window.copyBlockCode = copyBlockCode;
window.sendToIDEAgent = sendToIDEAgent;
window.previewBlock = previewBlock;
window.fetchSectionsData = fetchSectionsData;
window.saveLicense = saveLicense;
window.toggleLicenseSection = toggleLicenseSection;
