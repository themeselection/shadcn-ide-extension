export interface SectionFileData {
  path: string;
  type: string;
  target: string;
}

export interface Section {
  id: string;
  name: string;
  count: number;
  items: Item[];
}

export interface SectionMetaData {
  id: string;
  name: string;
  count: number;
}

export interface Item {
  name: string;
  description: string;
  type: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: SectionFileData[];
  cssVars?: any;
  css?: any;
  meta: {
    category: string;
    section: string;
    title: string;
    isPro?: boolean;
    isNew?: boolean;
  };
}

export interface groupedItem {
  [key: string]: Item[];
}

// Helper to format section names
const formatSectionName = (section: string): string => {
  return section
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getImageForSection = (sectionId: string): string => {
  const sectionImages: { [key: string]: string } = {
    'about-us-page':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/about-us-page/about-us-page-19.png',
    'app-integration':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/app-integration/app-integration-10.png?format=auto',
    'blog-component':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/blog-component/blog-component-02.png?format=auto',
    'contact-us-page':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/contact-us-page/contact-us-page-16.png?format=auto',
    'cookies-consent':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/cookies-consent/cookies-consent-01.png?format=auto',
    'cta-section':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/cta-section/cta-section-14.png?format=auto',
    'error-page':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/error-page/error-page-02.png?format=auto',
    'faq-component':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/faq-component/faq-component-19.png?format=auto',
    'features-section':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/features-section/features-section-12.png?format=auto',
    'footer-component':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/footer-component/footer-component-02.png?format=auto',
    'forgot-password': '',
    'gallery-component':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/gallery-component/gallery-component-05.png?format=auto',
    'hero-section':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/hero-section/hero-section-23.png?format=auto',
    'login-page': '',
    'logo-cloud':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/logo-cloud/logo-cloud-06.png?format=auto',
    'navbar-component':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/navbar-component/navbar-component-02.png?format=auto',
    portfolio:
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/portfolio/portfolio-13.png?format=auto',
    'pricing-component':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/pricing-component/pricing-component-15.png?format=auto',
    register:
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/register/register-01.png?format=auto',
    'reset-password': '',
    'social-proof':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/social-proof/social-proof-11.png?format=auto',
    'team-section':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/team-section/team-section-13.png?format=auto',
    'testimonials-component':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/testimonials-component/testimonials-component-19.png?format=auto',
    'two-factor-authentication':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/marketing-ui/two-factor-authentication/two-factor-authentication-01.png?format=auto',
    'verify-email': '',
    'application-shell': '',
    'charts-component':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/dashboard-and-application/charts-component/chart-component-09.png?format=auto',
    'dashboard-dialog': '',
    'dashboard-shell':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/dashboard-and-application/dashboard-shell/dashboard-shell-01.png?format=auto',
    'dashboard-dropdown': '',
    'dashboard-footer': '',
    'dashboard-header': '',
    'dashboard-sidebar': '',
    'multi-step-form': '',
    'statistics-component':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/dashboard-and-application/statistics-component/statistics-component-04.png?format=auto',
    'widgets-component':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/dashboard-and-application/widgets-component/widget-component-01.png?format=auto',
    'datatable-component': '',
    'bento-grid':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/bento-grid/bento-grid/bento-grid-14.png?format=auto',
    'category-filter': '',
    'checkout-page':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/ecommerce/checkout-page/checkout-page-01.png?format=auto',
    'mega-footer':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/ecommerce/mega-footer/mega-footer-02.png?format=auto',
    'offer-modal': '',
    'order-summary':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/ecommerce/order-summary/order-summary-01.png?format=auto',
    'shopping-cart': '',
    'product-reviews':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/ecommerce/product-reviews/product-reviews-03.png?format=auto',
    'product-quick-view':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/ecommerce/product-quick-view/product-quick-view-01.png?format=auto',
    'product-overview':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/ecommerce/product-overview/product-overview-01.png?format=auto',
    'product-list':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/ecommerce/product-list/product-list-06.png?format=auto',
    'product-category':
      'https://cdn.shadcnstudio.com/ss-assets/ide-extension/ecommerce/product-category/product-category-11.png?format=auto',
  };
  return sectionImages[sectionId] || '';
};

export const getSections = (items: Item[]): Section[] => {
  const sectionMap = new Map();

  items.forEach((item) => {
    const section = item.meta.section;
    if (!sectionMap.has(section)) {
      sectionMap.set(section, {
        id: section,
        name: formatSectionName(section),
        count: 0,
        img: getImageForSection(section),
        items: [],
      });
    }

    const sectionData = sectionMap.get(section);
    sectionData.count++;
    sectionData.items.push(item);
  });

  // print all section Name
  console.log('Sections found:', Array.from(sectionMap.keys()));

  return Array.from(sectionMap.values());
};

export const getItemsBySection = (items: Item[], sectionId: string): Item[] => {
  return items.filter((item) => item.meta.section === sectionId);
};

export const getSectionsMetaData = (sections: Section[]): SectionMetaData[] => {
  return sections.map((section) => {
    return {
      id: section.id,
      name: section.name,
      count: section.count,
    };
  });
};

// Search sections by name
export const searchSections = (
  sections: Section[],
  query: string,
): Section[] => {
  const lowerQuery = query.toLowerCase();
  return sections.filter((section) =>
    section.name.toLowerCase().includes(lowerQuery),
  );
};

// Search items by name or description
export const searchItems = (items: Item[], query: string): Item[] => {
  const lowerQuery = query.toLowerCase();
  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.meta.title.toLowerCase().includes(lowerQuery),
  );
};

// const sections = getSections(items)
// const sectionsMetaData = getSectionsMetaData(sections)

// const aboutusItems = getItemBySection(items, 'about-us-page')
// Example usage
// console.log("Sections:", sections)
// console.log("Sections MetaData:", sectionsMetaData)
// console.log("Items in 'about-us-page' section:", getItemBySection(items, 'about-us-page'))
// console.log("Search Sections for 'app':", searchSections(sections, 'contact'))
// console.log("Search Items for 'blog':", searchItems(aboutusItems, 'centered'))
