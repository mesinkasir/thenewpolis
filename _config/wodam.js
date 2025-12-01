import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import markdownItFootnote from "markdown-it-footnote";
import markdownItAttrs from 'markdown-it-attrs';
import markdownItTableOfContents from "markdown-it-table-of-contents";
import slugify from "slugify";

export default function (eleventyConfig) {
   
    eleventyConfig.addFilter("md", function (content) {
    return markdownLib.render(content);
});
  let options = {
    html: true,
    breaks: true,
    linkify: true,
      permalink: true,
    typographer: true,
      permalinkClass: "direct-link",
      permalinkSymbol: "#"
  };
	
   let markdownLib = markdownIt(options).use(markdownItAttrs).use(markdownItFootnote).use(markdownItTableOfContents);
  eleventyConfig.setLibrary("md", markdownLib);
	  eleventyConfig.amendLibrary("md", mdLib => {
		mdLib.use(markdownItAnchor, {
			permalink: markdownItAnchor.permalink.ariaHidden({
				placement: "after",
				class: "header-anchor",
				symbol: "",
				ariaHidden: false,
			}),
			level: [1,2,3,4],
			slugify: eleventyConfig.getFilter("slugify")
		});
	});
eleventyConfig.addFilter("addHeadingIDs", function(content) {
        if (!content || typeof content !== 'string') return content;
        const headingRegex = /(<h[2-5])([^>]*)>(.*?)<\/h[2-5]>/gi;
        const contentWithIDs = content.replace(headingRegex, (match, openTag, attributes, title) => {
            const cleanTitle = title.replace(/<[^>]*>?/gm, ''); 
            const id = slugify(cleanTitle, { lower: true, strict: true });
            const closeTag = `</h${openTag.substring(2, 3)}>`
            return `${openTag} id="${id}"${attributes}>${title}${closeTag}`;
        });        
        return contentWithIDs;
    });
    eleventyConfig.addFilter("toc", function(content) {
        if (!content || typeof content !== 'string') return '';
        const headingRegex = /<h([2-5])\b[^>]*>(.*?)<\/h\1>/gi;
        let toc = [];
        let match;
        while ((match = headingRegex.exec(content)) !== null) {
            const level = parseInt(match[1], 10);
            const title = match[2].replace(/<[^>]*>?/gm, '');
            const id = slugify(title, { lower: true, strict: true }); 
            toc.push({
                level: level,
                title: title,
                id: id
            });
        }
        if (toc.length === 0) return '';
        let html = '<ul class="toc-list ms-3">';
        let currentLevel = 2;
        toc.forEach(item => {
            while (item.level > currentLevel) {
                html += '<ul>';
                currentLevel++;
            }
            while (item.level < currentLevel) {
                html += '</ul>';
                currentLevel--;
            }
            html += `<li class="toc-level-${item.level}"><a class="none" href="#${item.id}">${item.title}</a></li>`;
        });
        while (currentLevel > 2) {
            html += '</ul>';
            currentLevel--;
        }
        html += '</ul>';
        return html; 
    });
const extractPosts = (collection) => collection.getAll()[0]?.data?.wordpress?.posts || [];
const getSlug = (eleventyConfig) => eleventyConfig.getFilter("slugify");


eleventyConfig.addCollection("categories", function(collection) {
    let categories = {};
    const allPosts = collection.getAll()[0]?.data?.wordpress?.posts || [];
    const uniqueCategories = [];
    const slugSet = new Set();
    allPosts.forEach(post => { 
        if (post.category_names && Array.isArray(post.category_names)) {
            post.category_names.forEach(categoryName => {
                const normalizedCategoryName = String(categoryName).toLowerCase();               
                if (!categories[normalizedCategoryName]) {
                    categories[normalizedCategoryName] = [];
                }
                categories[normalizedCategoryName].push(post);
            });
        }
    });
    Object.keys(categories).forEach(categoryName => {
        const slug = eleventyConfig.getFilter("slugify")(categoryName);
        
        // Pengecekan Unik
        if (slugSet.has(slug)) {
            console.warn(`[Eleventy Category Conflict] Kategori "${categoryName}" menghasilkan slug duplikat: "${slug}". Kategori ini dilewati untuk mencegah build error.`);
            return; // Skip kategori yang menghasilkan slug duplikat
        }

        slugSet.add(slug); // Daftarkan slug yang unik

        uniqueCategories.push({
            name: categoryName,
            slug: slug,
            posts: categories[categoryName]
        });
    });

    return uniqueCategories;
});


// KODE FOR DEFAULT WP
// eleventyConfig.addCollection("categories", function(collection) {
//     let categories = {};
//     const allPosts = collection.getAll()[0]?.data?.wordpress?.posts || []; 
//     allPosts.forEach(post => { 
//         if (post.category_names && Array.isArray(post.category_names)) {
//             post.category_names.forEach(categoryName => {
//                 const normalizedCategoryName = String(categoryName).toLowerCase();               
//                 if (!categories[normalizedCategoryName]) {
//                     categories[normalizedCategoryName] = [];
//                 }
//                 categories[normalizedCategoryName].push(post);
//             });
//         }
//     });
// 
//     return Object.keys(categories).map(categoryName => {
//         return {
//             name: categoryName,
//             slug: eleventyConfig.getFilter("slugify")(categoryName), 
//             posts: categories[categoryName]
//         };
//     });
// });

eleventyConfig.addCollection("tags", function(collection) {
    let tags = {};
    const allTags = collection.getAll()[0]?.data?.wordpress?.tags || {}; 
    const allPosts = collection.getAll()[0]?.data?.wordpress?.posts || []; 
    allPosts.forEach(post => { 
        const postTags = post.tags || [];
        if (Array.isArray(postTags)) {
            postTags.forEach(tagName => {
                const normalizedTagName = String(tagName).toLowerCase();
                if (!tags[normalizedTagName]) {
                    tags[normalizedTagName] = [];
                }
                tags[normalizedTagName].push(post);
            });
        }
    });
    return Object.keys(tags).map(tagName => {
        const tagInfo = allTags[tagName] || {}; 

        return {
            name: tagName,
            description: tagInfo.description || `Articles related to ${tagName}.`, 
            slug: eleventyConfig.getFilter("slugify")(tagName), 
            posts: tags[tagName]
        };
    });
});

	eleventyConfig.addCollection("tagList", function(collection) {
        let tagSet = new Set();
        const postData = collection.getAll()[0]?.data?.wordpress?.posts || [];
        postData.forEach(post => {
            if (post.tags && Array.isArray(post.tags)) {
                post.tags.forEach(tagName => {
                    tagSet.add(tagName);
                });
            }
        });
        return [...tagSet];
    });

eleventyConfig.addCollection("authors", function(collection) {
    let authors = {};
    const allPosts = collection.getAll()[0]?.data?.wordpress?.posts || []; 
    allPosts.forEach(post => { 
        const authorName = post.author_name || 'Unknown Author'; 
        const normalizedAuthorName = String(authorName).trim();
        const authorSlug = eleventyConfig.getFilter("slugify")(normalizedAuthorName);
        const authorBio = post.author_description || 'Biografi Not fill';
        const authorWebsite = post.author_website || '';
        const authorPicture = post.author_profile_picture || ''; 
        if (!authors[authorSlug]) {
            authors[authorSlug] = {
                name: normalizedAuthorName,
                slug: authorSlug,
                posts: [],
                description: authorBio, 
                website: authorWebsite,
                profile_picture: authorPicture
            };
        }
        authors[authorSlug].posts.push(post);
    });

    return Object.values(authors)
        .filter(author => author.posts.length > 0)
        .sort((a, b) => a.name.localeCompare(b.name));
});


eleventyConfig.addCollection("wordpressPostsOnly", function(collection) {
    const allPosts = collection.getAll()[0]?.data?.wordpress?.posts || []; 
    const sortedPosts = allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    return sortedPosts.map(post => {
        const postUrl = `/post/${post.slug}/`; 
        return {
            url: postUrl,
            fileSlug: post.slug, 
            data: {
                title: post.title,
                date: post.date,
                author_name: post.author_name,
                category_names: post.category_names,
            }
        };
    });
});

eleventyConfig.addFilter("filterBySticky", function(posts, isSticky = true) {
    if (!Array.isArray(posts)) return [];
    return posts.filter(post => post.sticky === isSticky);
});

}