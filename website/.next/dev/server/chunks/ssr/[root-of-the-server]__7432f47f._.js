module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/lib/api.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAllArticles",
    ()=>getAllArticles,
    "getArticleBySlug",
    ()=>getArticleBySlug,
    "getArticlesByCategory",
    ()=>getArticlesByCategory,
    "getFeaturedArticles",
    ()=>getFeaturedArticles,
    "getRelatedArticles",
    ()=>getRelatedArticles,
    "searchArticles",
    ()=>searchArticles
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$gray$2d$matter$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/gray-matter/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$marked$2f$lib$2f$marked$2e$esm$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/marked/lib/marked.esm.js [app-rsc] (ecmascript)");
;
;
;
;
const articlesDirectory = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), 'content/articles');
// Real articles from Instagram @balizero0 (converted from top-performing posts)
const mockArticles = [
    {
        slug: 'bali-floods-overtourism-reckoning',
        title: "Bali's Reckoning: When Paradise Drowns, Who's to Blame?",
        excerpt: "18 lives lost. 81 neighborhoods submerged. September's floods exposed the deadly cost of unchecked development. Did overtourism and illegal building kill Bali's rice terraces—and with them, the island's flood defenses?",
        category: 'property',
        image: '/instagram/post_4_cover.jpg',
        publishedAt: '2025-10-01',
        updatedAt: '2025-10-01',
        readTime: 12,
        author: 'Bali Zero Research Team',
        featured: true,
        content: 'Full article in /content/articles/bali-floods-overtourism-reckoning.md',
        tags: [
            'Bali floods',
            'overtourism',
            'Subak',
            'environmental crisis',
            'property development'
        ],
        relatedArticles: [
            'north-bali-airport-decade-promises',
            'd12-visa-indonesia-business-explorer'
        ]
    },
    {
        slug: 'north-bali-airport-decade-promises',
        title: 'North Bali Airport: Ten Years of Promises, Still No Runway',
        excerpt: "Billions discussed. Consultants hired. Studies commissioned. And Buleleng still waits for the airport that was supposed to change everything. After a decade of broken promises, is North Bali's airport just a political mirage?",
        category: 'business',
        image: '/instagram/post_2_cover.jpg',
        publishedAt: '2025-10-21',
        updatedAt: '2025-10-21',
        readTime: 10,
        author: 'Bali Zero Research Team',
        featured: true,
        content: 'Full article in /content/articles/north-bali-airport-decade-promises.md',
        tags: [
            'North Bali airport',
            'infrastructure',
            'Buleleng',
            'investment',
            'government accountability'
        ],
        relatedArticles: [
            'bali-floods-overtourism-reckoning',
            'oss-2-migration-deadline-indonesia'
        ]
    },
    {
        slug: 'd12-visa-indonesia-business-explorer',
        title: "The D12 Visa: Indonesia's 2-Year Business Exploration Gateway",
        excerpt: "Imagine spending up to two years exploring Indonesia—meeting partners, scouting locations, testing business ideas—all on a completely legal visa. The D12 Pre-Investment Visa is your roadmap to informed Indonesian business entry.",
        category: 'immigration',
        image: '/instagram/post_3_cover.jpg',
        publishedAt: '2025-10-15',
        updatedAt: '2025-10-15',
        readTime: 8,
        author: 'Bali Zero Immigration Desk',
        featured: true,
        content: 'Full article in /content/articles/d12-visa-indonesia-business-explorer.md',
        tags: [
            'D12 visa',
            'business visa',
            'pre-investment',
            'immigration',
            'entrepreneur visa'
        ],
        relatedArticles: [
            'oss-2-migration-deadline-indonesia',
            'skpl-alcohol-license-bali-complete-guide'
        ]
    },
    {
        slug: 'skpl-alcohol-license-bali-complete-guide',
        title: 'When Inspectors Walk In: The Real Cost of Skipping Your SKPL',
        excerpt: "Your bar is packed. Music's loud. Drinks are flowing. Then you see them: two officials with clipboards, walking straight toward your manager. And you realize—nobody checked the alcohol license in six months.",
        category: 'business',
        image: '/instagram/post_1_cover.jpg',
        publishedAt: '2025-10-24',
        updatedAt: '2025-10-24',
        readTime: 9,
        author: 'Bali Zero Legal Compliance',
        featured: false,
        content: 'Full article in /content/articles/skpl-alcohol-license-bali-complete-guide.md',
        tags: [
            'SKPL',
            'alcohol license',
            'F&B compliance',
            'bar license',
            'Bali business'
        ],
        relatedArticles: [
            'oss-2-migration-deadline-indonesia',
            'd12-visa-indonesia-business-explorer'
        ]
    },
    {
        slug: 'oss-2-migration-deadline-indonesia',
        title: 'OSS 2.0: The Migration Deadline That Locked Out Thousands',
        excerpt: "October 5th, 2025 wasn't just another date. It was the day Indonesia's business licensing system fundamentally changed. 47,000 companies missed the migration—and found themselves frozen out. Learn about Positif Fiktif and the new compliance reality.",
        category: 'business',
        image: '/instagram/post_5_cover.jpg',
        publishedAt: '2025-09-20',
        updatedAt: '2025-10-05',
        readTime: 11,
        author: 'Bali Zero Corporate Services',
        featured: true,
        content: 'Full article in /content/articles/oss-2-migration-deadline-indonesia.md',
        tags: [
            'OSS 2.0',
            'NIB',
            'LKPM',
            'business licensing',
            'Positif Fiktif',
            'PT PMA compliance'
        ],
        relatedArticles: [
            'd12-visa-indonesia-business-explorer',
            'north-bali-airport-decade-promises'
        ]
    }
];
async function getAllArticles() {
    return mockArticles.sort((a, b)=>new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
async function getArticleBySlug(slug) {
    const article = mockArticles.find((a)=>a.slug === slug);
    if (!article) return null;
    // Read the actual markdown file
    try {
        const fullPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(articlesDirectory, `${slug}.md`);
        const fileContents = __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].readFileSync(fullPath, 'utf8');
        const { content } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$gray$2d$matter$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])(fileContents);
        // Convert markdown to HTML
        const htmlContent = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$marked$2f$lib$2f$marked$2e$esm$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["marked"].parse(content);
        // Return article with actual HTML content
        return {
            ...article,
            content: htmlContent
        };
    } catch (error) {
        console.error(`Error reading article ${slug}:`, error);
        return article // Return with placeholder content if file not found
        ;
    }
}
async function getArticlesByCategory(category) {
    return mockArticles.filter((a)=>a.category === category).sort((a, b)=>new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
async function getFeaturedArticles(limit = 6) {
    return mockArticles.filter((a)=>a.featured).sort((a, b)=>new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, limit);
}
async function getRelatedArticles(slug, limit = 3) {
    const currentArticle = await getArticleBySlug(slug);
    if (!currentArticle) return [];
    return mockArticles.filter((a)=>a.slug !== slug && a.category === currentArticle.category).slice(0, limit);
}
async function searchArticles(query) {
    const lowerQuery = query.toLowerCase();
    return mockArticles.filter((article)=>article.title.toLowerCase().includes(lowerQuery) || article.excerpt.toLowerCase().includes(lowerQuery) || article.tags?.some((tag)=>tag.toLowerCase().includes(lowerQuery)));
}
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/components/header.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "Header",
    ()=>Header
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const Header = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call Header() from the server but Header is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/Desktop/NUZANTARA-RAILWAY/website/components/header.tsx <module evaluation>", "Header");
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/components/header.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "Header",
    ()=>Header
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const Header = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call Header() from the server but Header is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/Desktop/NUZANTARA-RAILWAY/website/components/header.tsx", "Header");
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/components/header.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$header$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/components/header.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$header$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/components/header.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$header$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/lib/utils/date.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatDate",
    ()=>formatDate,
    "formatDateRelative",
    ()=>formatDateRelative
]);
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
function formatDateRelative(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/lib/categories.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "categories",
    ()=>categories,
    "getCategoryBySlug",
    ()=>getCategoryBySlug
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-rsc] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/lucide-react/dist/esm/icons/briefcase.js [app-rsc] (ecmascript) <export default as Briefcase>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scale$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Scale$3e$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/lucide-react/dist/esm/icons/scale.js [app-rsc] (ecmascript) <export default as Scale>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/lucide-react/dist/esm/icons/house.js [app-rsc] (ecmascript) <export default as Home>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$brain$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Brain$3e$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/lucide-react/dist/esm/icons/brain.js [app-rsc] (ecmascript) <export default as Brain>");
;
const categories = [
    {
        slug: 'immigration',
        name: 'Immigration',
        description: 'Visa, residency, and citizenship insights for living in Indonesia',
        color: '#FF0000',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"],
        heroImage: '/category-headers/immigration-hero.jpg'
    },
    {
        slug: 'business',
        name: 'Business',
        description: 'Company formation, trade laws, and entrepreneurship in Indonesia',
        color: '#D4AF37',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$briefcase$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Briefcase$3e$__["Briefcase"],
        heroImage: '/category-headers/business-hero.jpg'
    },
    {
        slug: 'tax-legal',
        name: 'Tax & Legal',
        description: 'Compliance, regulations, and legal framework for businesses',
        color: '#FFFFFF',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$scale$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Scale$3e$__["Scale"],
        heroImage: '/category-headers/tax-legal-hero.jpg'
    },
    {
        slug: 'property',
        name: 'Property',
        description: 'Real estate ownership, leasehold, and investment opportunities',
        color: '#D4AF37',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$house$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Home$3e$__["Home"],
        heroImage: '/category-headers/property-hero.jpg'
    },
    {
        slug: 'ai',
        name: 'AI & Innovation',
        description: 'Cultural intelligence, technology, and the future of Southeast Asia',
        color: '#FF0000',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$brain$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Brain$3e$__["Brain"],
        heroImage: '/category-headers/ai-hero.jpg'
    }
];
function getCategoryBySlug(slug) {
    return categories.find((cat)=>cat.slug === slug);
}
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ArticleHero",
    ()=>ArticleHero
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/lib/utils/date.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$lib$2f$categories$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/lib/categories.ts [app-rsc] (ecmascript)");
;
;
;
function ArticleHero({ article }) {
    const category = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$lib$2f$categories$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getCategoryBySlug"])(article.category);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "relative w-full",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative w-full h-[60vh] md:h-[70vh] overflow-hidden",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    src: article.image,
                    alt: article.title,
                    className: "w-full h-full object-cover"
                }, void 0, false, {
                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                    lineNumber: 16,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"
                }, void 0, false, {
                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                    lineNumber: 23,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute inset-0 flex items-end",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pb-12 md:pb-16 w-full",
                        children: [
                            category && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "inline-block bg-red px-4 py-2 mb-6",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-black font-serif font-bold text-sm tracking-widest uppercase",
                                    children: category.name
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                                    lineNumber: 31,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                                lineNumber: 30,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-white font-serif font-bold text-4xl md:text-5xl lg:text-6xl leading-tight mb-6",
                                children: article.title
                            }, void 0, false, {
                                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                                lineNumber: 38,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap items-center gap-4 text-white/70 font-sans text-sm md:text-base",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "By ",
                                            article.author || 'Bali Zero Team'
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                                        lineNumber: 44,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "•"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                                        lineNumber: 45,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["formatDate"])(article.publishedAt)
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                                        lineNumber: 46,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "•"
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                                        lineNumber: 47,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            article.readTime,
                                            " min read"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                                        lineNumber: 48,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                                lineNumber: 43,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                        lineNumber: 27,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
                    lineNumber: 26,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
            lineNumber: 15,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-content.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "ArticleContent",
    ()=>ArticleContent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const ArticleContent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ArticleContent() from the server but ArticleContent is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-content.tsx <module evaluation>", "ArticleContent");
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-content.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

// This file is generated by next-core EcmascriptClientReferenceModule.
__turbopack_context__.s([
    "ArticleContent",
    ()=>ArticleContent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const ArticleContent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call ArticleContent() from the server but ArticleContent is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-content.tsx", "ArticleContent");
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-content.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$article$2f$article$2d$content$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-content.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$article$2f$article$2d$content$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-content.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$article$2f$article$2d$content$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RelatedArticles",
    ()=>RelatedArticles
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/lib/utils/date.ts [app-rsc] (ecmascript)");
;
;
;
function RelatedArticles({ articles }) {
    if (!articles || articles.length === 0) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "border-t border-white/10 bg-black",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-20",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-12",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-white font-serif font-bold text-3xl md:text-4xl mb-3",
                            children: "You Might Also Like"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                            lineNumber: 17,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-white/60 font-sans text-lg",
                            children: "Continue exploring related insights"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                            lineNumber: 20,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                    lineNumber: 16,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 md:grid-cols-3 gap-8",
                    children: articles.map((article)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                            href: `/article/${article.slug}`,
                            className: "group",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                className: "flex flex-col h-full",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative w-full aspect-[16/9] overflow-hidden rounded-lg border border-white/10 group-hover:border-red/70 transition-colors duration-300 mb-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: article.image,
                                                alt: article.title,
                                                className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                                                lineNumber: 36,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute top-3 left-3 bg-black/80 border border-red/50 px-2 py-1 text-xs font-serif font-bold text-red",
                                                children: article.category.toUpperCase().replace('-', ' ')
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                                                lineNumber: 43,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                                        lineNumber: 35,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-white font-serif font-bold text-xl leading-snug mb-3 group-hover:text-red transition-colors",
                                                children: article.title
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                                                lineNumber: 50,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 text-white/50 font-sans text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$lib$2f$utils$2f$date$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["formatDate"])(article.publishedAt)
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                                                        lineNumber: 55,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "•"
                                                    }, void 0, false, {
                                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                                                        lineNumber: 56,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: [
                                                            article.readTime,
                                                            " min"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                                                        lineNumber: 57,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                                                lineNumber: 54,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                                        lineNumber: 49,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                                lineNumber: 33,
                                columnNumber: 15
                            }, this)
                        }, article.slug, false, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                            lineNumber: 28,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
                    lineNumber: 26,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
            lineNumber: 14,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CTASection",
    ()=>CTASection
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
;
function CTASection() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "py-20 px-4 md:px-6 lg:px-8 bg-black border-t border-white/10",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-4xl mx-auto text-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-white font-serif font-bold text-4xl md:text-5xl leading-tight",
                            children: "Stay Ahead of the Curve"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
                            lineNumber: 7,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-white/70 font-sans text-lg md:text-xl leading-relaxed",
                            children: "Get exclusive access to premium insights, research reports, and AI-powered analysis delivered directly to your inbox."
                        }, void 0, false, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
                            lineNumber: 11,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "email",
                                    placeholder: "Enter your email",
                                    className: "flex-1 bg-black border border-white/20 text-white px-4 py-3 font-sans placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
                                    lineNumber: 18,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "bg-red text-black px-6 py-3 font-serif font-bold hover:bg-red/90 transition-colors whitespace-nowrap hover:shadow-[0_0_30px_rgba(255,0,0,0.6)]",
                                    children: "Subscribe"
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
                                    lineNumber: 23,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
                            lineNumber: 17,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-white/50 font-sans text-sm",
                            children: "We respect your privacy. Unsubscribe at any time."
                        }, void 0, false, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
                            lineNumber: 28,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
                    lineNumber: 6,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-16 pt-16 border-t border-white/10",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-white/50 font-sans text-sm mb-6",
                            children: "TRUSTED BY LEADING ORGANIZATIONS"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
                            lineNumber: 33,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap justify-center gap-8 items-center",
                            children: [
                                "Fortune 500",
                                "Tech Leaders",
                                "Startups",
                                "Investors"
                            ].map((org)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-white/40 font-sans font-medium",
                                    children: org
                                }, org, false, {
                                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
                                    lineNumber: 36,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
            lineNumber: 4,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx",
        lineNumber: 3,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Footer",
    ()=>Footer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/client/app-dir/link.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/lucide-react/dist/esm/icons/mail.js [app-rsc] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$linkedin$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Linkedin$3e$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/lucide-react/dist/esm/icons/linkedin.js [app-rsc] (ecmascript) <export default as Linkedin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$twitter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Twitter$3e$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/lucide-react/dist/esm/icons/twitter.js [app-rsc] (ecmascript) <export default as Twitter>");
;
;
;
function Footer() {
    const currentYear = new Date().getFullYear();
    const footerLinks = {
        Company: [
            {
                label: "About Us",
                href: "#"
            },
            {
                label: "Careers",
                href: "#"
            },
            {
                label: "Press",
                href: "#"
            },
            {
                label: "Contact",
                href: "#"
            }
        ],
        Resources: [
            {
                label: "Research",
                href: "#"
            },
            {
                label: "Reports",
                href: "#"
            },
            {
                label: "Webinars",
                href: "#"
            },
            {
                label: "Blog",
                href: "#"
            }
        ],
        Legal: [
            {
                label: "Privacy Policy",
                href: "#"
            },
            {
                label: "Terms of Service",
                href: "#"
            },
            {
                label: "Cookie Policy",
                href: "#"
            },
            {
                label: "Disclaimer",
                href: "#"
            }
        ]
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
        className: "bg-black border-t border-white/10",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "lg:col-span-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/",
                                    className: "flex items-center gap-2 mb-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-8 h-8 bg-red rounded-sm flex items-center justify-center",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-black font-serif font-bold text-lg",
                                                children: "Z"
                                            }, void 0, false, {
                                                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                                lineNumber: 37,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                            lineNumber: 36,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-serif font-bold text-white",
                                            children: "Bali Zero"
                                        }, void 0, false, {
                                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                            lineNumber: 39,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                    lineNumber: 35,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-white/60 font-sans text-sm leading-relaxed",
                                    children: "Premium business intelligence and AI insights for Southeast Asia."
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                    lineNumber: 41,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this),
                        Object.entries(footerLinks).map(([category, links])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: "text-white font-serif font-bold mb-4",
                                        children: category
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                        lineNumber: 49,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-2",
                                        children: links.map((link)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"], {
                                                    href: link.href,
                                                    className: "text-white/60 hover:text-red transition-colors font-sans text-sm",
                                                    children: link.label
                                                }, void 0, false, {
                                                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                                    lineNumber: 53,
                                                    columnNumber: 21
                                                }, this)
                                            }, link.href, false, {
                                                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                                lineNumber: 52,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                        lineNumber: 50,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, category, true, {
                                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                lineNumber: 48,
                                columnNumber: 13
                            }, this))
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "border-t border-white/10 my-8"
                }, void 0, false, {
                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                    lineNumber: 64,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col md:flex-row justify-between items-center gap-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-white/50 font-sans text-sm",
                            children: [
                                "© ",
                                currentYear,
                                " Bali Zero Insights. All rights reserved."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                            lineNumber: 69,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "text-white/60 hover:text-red transition-colors",
                                    "aria-label": "Email",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"], {
                                        size: 20
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                        lineNumber: 74,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                    lineNumber: 73,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "text-white/60 hover:text-red transition-colors",
                                    "aria-label": "LinkedIn",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$linkedin$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Linkedin$3e$__["Linkedin"], {
                                        size: 20
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                        lineNumber: 77,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                    lineNumber: 76,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "text-white/60 hover:text-red transition-colors",
                                    "aria-label": "Twitter",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$twitter$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__default__as__Twitter$3e$__["Twitter"], {
                                        size: 20
                                    }, void 0, false, {
                                        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                        lineNumber: 80,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                                    lineNumber: 79,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                            lineNumber: 72,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
                    lineNumber: 67,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
            lineNumber: 30,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ArticlePage,
    "generateMetadata",
    ()=>generateMetadata,
    "generateStaticParams",
    ()=>generateStaticParams
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/node_modules/next/dist/client/components/navigation.react-server.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/lib/api.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$header$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/components/header.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$article$2f$article$2d$hero$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-hero.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$article$2f$article$2d$content$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/article-content.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$article$2f$related$2d$articles$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/components/article/related-articles.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$cta$2d$section$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/components/cta-section.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$footer$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/components/footer.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
;
async function generateStaticParams() {
    const articles = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAllArticles"])();
    return articles.map((article)=>({
            slug: article.slug
        }));
}
async function generateMetadata({ params }) {
    const { slug } = await params;
    const article = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getArticleBySlug"])(slug);
    if (!article) {
        return {
            title: "Article Not Found | Bali Zero"
        };
    }
    return {
        title: `${article.title} | Bali Zero`,
        description: article.excerpt,
        openGraph: {
            title: article.title,
            description: article.excerpt,
            images: [
                article.image
            ],
            type: "article",
            publishedTime: article.publishedAt,
            modifiedTime: article.updatedAt,
            authors: [
                article.author || "Bali Zero Team"
            ]
        },
        twitter: {
            card: "summary_large_image",
            title: article.title,
            description: article.excerpt,
            images: [
                article.image
            ]
        }
    };
}
async function ArticlePage({ params }) {
    const { slug } = await params;
    const article = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getArticleBySlug"])(slug);
    if (!article) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$client$2f$components$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["notFound"])();
    }
    const relatedArticles = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$lib$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getRelatedArticles"])(slug, 3);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "bg-black batik-pattern min-h-screen",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$header$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Header"], {}, void 0, false, {
                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$article$2f$article$2d$hero$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ArticleHero"], {
                article: article
            }, void 0, false, {
                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx",
                lineNumber: 70,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$article$2f$article$2d$content$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ArticleContent"], {
                content: article.content,
                excerpt: article.excerpt
            }, void 0, false, {
                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "border-t border-white/10 bg-black/50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-16 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-white font-serif font-bold text-2xl md:text-3xl mb-4",
                            children: "Need Professional Help?"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx",
                            lineNumber: 76,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-white/70 font-sans text-lg mb-8",
                            children: "Our team of experts can guide you through the complexities of Indonesian regulations and business setup."
                        }, void 0, false, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx",
                            lineNumber: 79,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: "https://welcome.balizero.com",
                            className: "inline-block bg-red text-black px-8 py-4 font-serif font-bold tracking-tight hover:bg-gold transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)]",
                            children: "Explore Our Services"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx",
                            lineNumber: 82,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx",
                    lineNumber: 75,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$article$2f$related$2d$articles$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["RelatedArticles"], {
                articles: relatedArticles
            }, void 0, false, {
                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$cta$2d$section$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["CTASection"], {}, void 0, false, {
                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$NUZANTARA$2d$RAILWAY$2f$website$2f$components$2f$footer$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Footer"], {}, void 0, false, {
                fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx",
        lineNumber: 68,
        columnNumber: 5
    }, this);
}
}),
"[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Desktop/NUZANTARA-RAILWAY/website/app/article/[slug]/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7432f47f._.js.map