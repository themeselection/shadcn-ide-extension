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

// Sample data
// const items: Item[] = [
//     {
//         "name": "about-us-page-01",
//         "description": "Centered header with video/image section and overlapping stats grid card displaying icons, values, and descriptions",
//         "type": "registry:block",
//         "dependencies": [
//             "lucide-react"
//         ],
//         "registryDependencies": [
//             "badge",
//             "button",
//             "card"
//         ],
//         "files": [
//             {
//                 "path": "src/registry/new-york/blocks/marketing-ui/about-us-page/about-us-page-01/page.tsx",
//                 "type": "registry:page",
//                 "target": "app/about-us-page-01/page.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/components/blocks/about-us-page-01/about-us-page-01.tsx",
//                 "type": "registry:component",
//                 "target": "components/shadcn-studio/blocks/about-us-page-01/about-us-page-01.tsx"
//             }
//         ],
//         "meta": {
//             "category": "marketing-ui",
//             "section": "about-us-page",
//             "title": "About Us 1",
//             "isPro": false
//         }
//     },
//     {
//         "name": "about-us-page-02",
//         "description": "Three-column grid layout with two image cards featuring action buttons and one stats card displaying metrics and descriptions",
//         "type": "registry:block",
//         "dependencies": [
//             "lucide-react"
//         ],
//         "registryDependencies": [
//             "button",
//             "card"
//         ],
//         "files": [
//             {
//                 "path": "src/registry/new-york/blocks/marketing-ui/about-us-page/about-us-page-02/page.tsx",
//                 "type": "registry:page",
//                 "target": "app/about-us-page-02/page.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/components/blocks/about-us-page-02/about-us-page-02.tsx",
//                 "type": "registry:component",
//                 "target": "components/shadcn-studio/blocks/about-us-page-02/about-us-page-02.tsx"
//             }
//         ],
//         "meta": {
//             "category": "marketing-ui",
//             "section": "about-us-page",
//             "title": "About Us 2"
//         }
//     },
//     {
//         "name": "app-integration-07",
//         "description": "Business growth through app connections with marquee display and extensive integration showcase",
//         "type": "registry:block",
//         "registryDependencies": [
//             "avatar",
//             "button",
//             "card",
//             "utils"
//         ],
//         "files": [
//             {
//                 "path": "src/registry/new-york/blocks/marketing-ui/app-integration/app-integration-07/page.tsx",
//                 "type": "registry:page",
//                 "target": "app/app-integration-07/page.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/components/blocks/app-integration-07/app-integration-07.tsx",
//                 "type": "registry:component",
//                 "target": "components/shadcn-studio/blocks/app-integration-07/app-integration-07.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/ui/marquee.tsx",
//                 "type": "registry:ui",
//                 "target": "components/ui/marquee.tsx"
//             }
//         ],
//         "cssVars": {
//             "theme": {
//                 "animate-marquee-horizontal": "marquee-horizontal var(--marquee-duration) infinite linear",
//                 "animate-marquee-vertical": "marquee-vertical var(--marquee-duration) infinite linear"
//             }
//         },
//         "css": {
//             "@keyframes marquee-horizontal": {
//                 "from": {
//                     "transform": "translateX(0)"
//                 },
//                 "to": {
//                     "transform": "translateX(calc(-100% - var(--marquee-gap)))"
//                 }
//             },
//             "@keyframes marquee-vertical": {
//                 "from": {
//                     "transform": "translateY(0)"
//                 },
//                 "to": {
//                     "transform": "translateY(calc(-100% - var(--marquee-gap)))"
//                 }
//             }
//         },
//         "meta": {
//             "category": "marketing-ui",
//             "section": "app-integration",
//             "title": "App Integration 7"
//         }
//     },
//     {
//         "name": "blog-component-08",
//         "description": "Five-card grid layout featuring educational blog posts with images, titles, descriptions, and \"See all blogs\" button",
//         "type": "registry:block",
//         "dependencies": [
//             "lucide-react"
//         ],
//         "registryDependencies": [
//             "button",
//             "card",
//             "utils"
//         ],
//         "files": [
//             {
//                 "path": "src/registry/new-york/blocks/marketing-ui/blog-component/blog-component-08/page.tsx",
//                 "type": "registry:page",
//                 "target": "app/blog-component-08/page.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/components/blocks/blog-component-08/blog-component-08.tsx",
//                 "type": "registry:component",
//                 "target": "components/shadcn-studio/blocks/blog-component-08/blog-component-08.tsx"
//             }
//         ],
//         "meta": {
//             "category": "marketing-ui",
//             "section": "blog-component",
//             "title": "Blog 8"
//         }
//     },
//     {
//         "name": "contact-us-page-03",
//         "description": "Full-width background image overlay with centered contact card featuring form section and contact information with border beam effects",
//         "type": "registry:block",
//         "dependencies": [
//             "lucide-react",
//             "motion"
//         ],
//         "registryDependencies": [
//             "button",
//             "card",
//             "input",
//             "label",
//             "textarea",
//             "utils"
//         ],
//         "files": [
//             {
//                 "path": "src/registry/new-york/blocks/marketing-ui/contact-us-page/contact-us-page-03/page.tsx",
//                 "type": "registry:page",
//                 "target": "app/contact-us-page-03/page.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/components/blocks/contact-us-page-03/contact-form.tsx",
//                 "type": "registry:component",
//                 "target": "components/shadcn-studio/blocks/contact-us-page-03/contact-form.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/components/blocks/contact-us-page-03/contact-us-page-03.tsx",
//                 "type": "registry:component",
//                 "target": "components/shadcn-studio/blocks/contact-us-page-03/contact-us-page-03.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/ui/border-beam.tsx",
//                 "type": "registry:ui",
//                 "target": "components/ui/border-beam.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/ui/motion-preset.tsx",
//                 "type": "registry:ui",
//                 "target": "components/ui/motion-preset.tsx"
//             }
//         ],
//         "meta": {
//             "category": "marketing-ui",
//             "section": "contact-us-page",
//             "title": "Contact Us 3"
//         }
//     },
//     {
//         "name": "contact-us-page-11",
//         "description": "Two-column layout with dual business meeting images and contact form card featuring input icons, quote request button, and hover image translations",
//         "type": "registry:block",
//         "dependencies": [
//             "lucide-react",
//             "motion"
//         ],
//         "registryDependencies": [
//             "button",
//             "card",
//             "input",
//             "label",
//             "textarea"
//         ],
//         "files": [
//             {
//                 "path": "src/registry/new-york/blocks/marketing-ui/contact-us-page/contact-us-page-11/page.tsx",
//                 "type": "registry:page",
//                 "target": "app/contact-us-page-11/page.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/components/blocks/contact-us-page-11/contact-form.tsx",
//                 "type": "registry:component",
//                 "target": "components/shadcn-studio/blocks/contact-us-page-11/contact-form.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/components/blocks/contact-us-page-11/contact-us-page-11.tsx",
//                 "type": "registry:component",
//                 "target": "components/shadcn-studio/blocks/contact-us-page-11/contact-us-page-11.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/ui/motion-preset.tsx",
//                 "type": "registry:ui",
//                 "target": "components/ui/motion-preset.tsx"
//             }
//         ],
//         "meta": {
//             "category": "marketing-ui",
//             "section": "contact-us-page",
//             "title": "Contact Us 11",
//             "isNew": true
//         }
//     },
//     {
//         "name": "cta-section-03",
//         "description": "Dark background card with three-column grid featuring newsletter description, large \"Get In Touch\" text, and get started button with decorative dashboard images",
//         "type": "registry:block",
//         "dependencies": [
//             "motion"
//         ],
//         "registryDependencies": [
//             "button",
//             "card"
//         ],
//         "files": [
//             {
//                 "path": "src/registry/new-york/blocks/marketing-ui/cta-section/cta-section-03/page.tsx",
//                 "type": "registry:page",
//                 "target": "app/cta-section-03/page.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/components/blocks/cta-section-03/cta-section-03.tsx",
//                 "type": "registry:component",
//                 "target": "components/shadcn-studio/blocks/cta-section-03/cta-section-03.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/ui/motion-preset.tsx",
//                 "type": "registry:ui",
//                 "target": "components/ui/motion-preset.tsx"
//             }
//         ],
//         "meta": {
//             "category": "marketing-ui",
//             "section": "cta-section",
//             "title": "CTA 3"
//         }
//     },
//     {
//         "name": "faq-component-09",
//         "description": "FAQ section with contact support card featuring accordion questions in two-thirds layout and a call-to-action support card with messaging icon and contact button for additional assistance",
//         "type": "registry:block",
//         "dependencies": [
//             "lucide-react"
//         ],
//         "registryDependencies": [
//             "button",
//             "card",
//             "accordion"
//         ],
//         "files": [
//             {
//                 "path": "src/registry/new-york/blocks/marketing-ui/faq-component/faq-component-09/page.tsx",
//                 "type": "registry:page",
//                 "target": "app/faq-component-09/page.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/components/blocks/faq-component-09/faq-component-09.tsx",
//                 "type": "registry:component",
//                 "target": "components/shadcn-studio/blocks/faq-component-09/faq-component-09.tsx"
//             }
//         ],
//         "meta": {
//             "category": "marketing-ui",
//             "section": "faq-component",
//             "title": "FAQ 9"
//         }
//     },
//     {
//         "name": "features-section-14",
//         "description": "Integration showcase with animated beams connecting central logo to service cards, notification stacks, heartbeat effects, and floating dashboard widgets with cursor interactions",
//         "type": "registry:block",
//         "dependencies": [
//             "lucide-react",
//             "motion"
//         ],
//         "registryDependencies": [
//             "avatar",
//             "badge",
//             "utils"
//         ],
//         "files": [
//             {
//                 "path": "src/registry/new-york/blocks/marketing-ui/features-section/features-section-14/page.tsx",
//                 "type": "registry:page",
//                 "target": "app/features-section-14/page.tsx"
//             },
//             {
//                 "path": "src/assets/svg/logo-vector.tsx",
//                 "type": "registry:component",
//                 "target": "assets/svg/logo-vector.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/components/blocks/features-section-14/features-section-14.tsx",
//                 "type": "registry:component",
//                 "target": "components/shadcn-studio/blocks/features-section-14/features-section-14.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/components/blocks/features-section-14/notification-stack.tsx",
//                 "type": "registry:component",
//                 "target": "components/shadcn-studio/blocks/features-section-14/notification-stack.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/ui/animated-beam.tsx",
//                 "type": "registry:ui",
//                 "target": "components/ui/animated-beam.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/ui/cursor.tsx",
//                 "type": "registry:ui",
//                 "target": "components/ui/cursor.tsx"
//             },
//             {
//                 "path": "src/registry/new-york/ui/motion-preset.tsx",
//                 "type": "registry:ui",
//                 "target": "components/ui/motion-preset.tsx"
//             }
//         ],
//         "cssVars": {
//             "theme": {
//                 "animate-heartbeat": "heartbeat 2s infinite ease-in-out"
//             }
//         },
//         "css": {
//             "@keyframes heartbeat": {
//                 "0%": {
//                     "box-shadow": "0 0 0 0 var(--heartbeat-color, var(--destructive))",
//                     "transform": "scale(1)"
//                 },
//                 "50%": {
//                     "box-shadow": "0 0 0 7px transparent",
//                     "transform": "scale(1.05)"
//                 },
//                 "100%": {
//                     "box-shadow": "0 0 0 0 transparent",
//                     "transform": "scale(1)"
//                 }
//             }
//         },
//         "meta": {
//             "category": "marketing-ui",
//             "section": "features-section",
//             "title": "Features 14",
//             "isNew": true
//         }
//     },
// ]

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
