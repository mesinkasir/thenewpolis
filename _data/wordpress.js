const BASE_URL = 'https://admin.000000076.xyz';
// CUSTOM WP API
const API_ROOT = `${BASE_URL}/index.php?rest_route=`; 
const POSTS_API_URL = `${API_ROOT}/wp/v2/posts&per_page=100&_embed&status=publish`; 
const POSTS_API_URL_BASE = `${API_ROOT}/wp/v2/posts&per_page=100&_embed&status=publish`; 
const TAGS_API_URL = `${API_ROOT}/wp/v2/tags&per_page=100`; 
const PAGES_API_URL_BASE = `${API_ROOT}/wp/v2/pages&per_page=100&_embed&status=publish`; 
const SETTINGS_API_URL = `${API_ROOT}/wp/v2/settings`; 
const CUSTOM_CONFIG_API_URL = `${API_ROOT}/eleventy/v1/config`;


// DEFAULT WP LIKE THIS
//const API_ROOT = `${BASE_URL}/wp-json`;
// const POSTS_API_URL = `${API_ROOT}/wp/v2/posts?per_page=100&_embed&status=publish`;
// const POSTS_API_URL_BASE = `${API_ROOT}/wp/v2/posts?per_page=100&_embed&status=publish`;
// const SETTINGS_API_URL = `${API_ROOT}/wp/v2/settings`;
// const CUSTOM_CONFIG_API_URL = `${API_ROOT}/eleventy/v1/config`;
// const TAGS_API_URL = `${API_ROOT}/wp/v2/tags?per_page=100`;
// const PAGES_API_URL_BASE = `${API_ROOT}/wp/v2/pages?per_page=100&_embed&status=publish`;


// ==========================================================
// FUNGSI ASYNC: MENGAMBIL POSTS (DENGAN PAGINATION & EKSTRAKSI LENGKAP)
// ==========================================================
async function fetchPosts() {
    let allPosts = [];
    let page = 1;
    let totalPages = 1;
    try {
        do {
            const currentApiUrl = `${POSTS_API_URL_BASE}&page=${page}`;           
            console.log(`Fetching posts from page ${page}...`);
            const response = await fetch(currentApiUrl);
            if (!response.ok) {
                console.error(`Gagal mengambil halaman ${page}: ${response.statusText}`);
                break;
            }
            const posts = await response.json();
            if (posts.length === 0) {
                console.log("Array post kosong, mengakhiri fetching.");
                break; 
            }
            totalPages = parseInt(response.headers.get('X-WP-TotalPages')) || 1;
            const totalPosts = parseInt(response.headers.get('X-WP-Total')) || 0;           
            console.log(`Total Posts Diharapkan: ${totalPosts}, Total Pages: ${totalPages}. Post diterima: ${posts.length}`);
            const processedPosts = posts.map(post => {
                let category_names = post._embedded?.['wp:term']?.[0]
                    ?.map(term => term.name.toLowerCase()) || [];
                let tag_names = post._embedded?.['wp:term']?.[1]
                    ?.map(term => term.name) || [];
                if (Array.isArray(post.class_list)) {
                    const classListCategories = post.class_list
                        .filter(cls => cls.startsWith('category-'))
                        .map(cls => cls.replace('category-', ''))
                        .map(name => name.toLowerCase());
                    category_names = [...new Set([...category_names, ...classListCategories])];
                }
                const authorData = post._embedded?.author?.[0];
                const authorName = authorData?.name || authorData?.slug || 'Unknown Author';
                const authorDescription = authorData?.description || '';
                const authorWebsite = authorData?.url || '';
                const authorAvatar = authorData?.avatar_urls?.['96'] || null;
                const rawTitle = post.title?.rendered;
                const finalTitle = (typeof rawTitle === 'string' && rawTitle.length > 0) ? rawTitle : 'Untitled Post';
               return {
                    id: post.id || post.slug,
                    slug: post.slug || `post-${post.id}`,
                    title: post.title?.rendered || post.title || 'Untitled Post', 
                    excerpt: post.excerpt?.rendered || '',
                    content: post.content?.rendered || '',
                    author_name: authorName,author_description: authorDescription,
                    author_website: authorWebsite,
                    author_profile_picture: authorAvatar,
                    date: post.date || null, 
                    featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
                    category_names: category_names,
                    tags: tag_names, 
                    sticky: post.sticky || false,
                };
            });
            allPosts = allPosts.concat(processedPosts);
            page++;
        } while (page <= totalPages);
        return allPosts;
    } catch (error) {
        console.error("❌ Error fetching posts:", error.message);
        return [];
    }
}
async function fetchPages() {
    let allPages = [];
    
    try {
        const response = await fetch(PAGES_API_URL_BASE);

        if (!response.ok) {
            console.error(`Gagal mengambil halaman: ${response.statusText}`);
            return [];
        }

        const pages = await response.json();
        const processedPages = pages.map(page => {
            let featuredImageURL = page._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
            if (!featuredImageURL && page.content?.rendered) {
                const imgRegex = /<img[^>]+src="([^"]+)"/i;
                const contentMatch = page.content.rendered.match(imgRegex);
                if (contentMatch && contentMatch[1]) {
                    featuredImageURL = contentMatch[1];
                }
            }
            return {
                id: page.id || page.slug,
                slug: page.slug || `page-${page.id}`,
                title: page.title?.rendered || 'Untitled Page',
                content: page.content?.rendered || 'Content Missing',
                date: page.date || null,
                template: page.template || 'page.njk',
                featuredImage: featuredImageURL, 
            };
        });
        allPages = allPages.concat(processedPages);
        return allPages;
    } catch (error) {
        console.error("❌ Error fetching pages:", error.message);
        return [];
    }
}
// ==========================================================
// FUNGSI ASYNC: MENGAMBIL KONFIGURASI (TIDAK ADA PERUBAHAN)
// ==========================================================
async function fetchConfig() {
    let configData = {};    
    try {
        const response = await fetch(SETTINGS_API_URL);
        if (response.ok) {
            const settings = await response.json();
            configData.title = settings.title;
            configData.tagline = settings.description;
        }
    } catch (e) { /* ignore */ }
    try {
        const customResponse = await fetch(CUSTOM_CONFIG_API_URL);
        if (customResponse.ok) {
            const customData = await customResponse.json();
            Object.assign(configData, customData); 
			const rawTocValue = customData.widget_show_toc;
            configData.widget_show_toc = (rawTocValue === 'true' || rawTocValue === true);
        }
    } catch (e) { /* ignore */ }
    
    if (!configData.widget_featured) {
        configData.widget_featured = "Featured Articles";
    }
    return configData;
}

async function fetchTags() {
    let tagsData = {};
    try {
        const response = await fetch(TAGS_API_URL);
        if (response.ok) {
            const tags = await response.json();
            tags.forEach(tag => {
                // Gunakan nama tag yang dinormalisasi (lowercase) sebagai key
                const normalizedName = String(tag.name).toLowerCase(); 
                tagsData[normalizedName] = {
                    name: tag.name,
                    description: tag.description || '', // Ambil deskripsi
                    slug: tag.slug
                };
            });
        }
    } catch (e) {
        console.error("Error fetching tags:", e);
    }
    return tagsData;
}

// ==========================================================
// FUNGSI UTAMA EKSPOR DEFAULT
// ==========================================================
export default async function() {
console.log("Starting parallel fetch for Posts, Config, and Pages..."); 
    const [posts, config, pages, tags] = await Promise.all([
        fetchPosts(),
        fetchConfig(),
        fetchPages(),
        fetchTags()
    ]);
    console.log(`✅ Fetch Complete. Posts: ${posts.length}, Config keys: ${Object.keys(config).length}`);
    return {
        posts: posts,
        config: config, 
        pages: pages,
        tags: tags
    };
}

