import { DateTime } from "luxon";
export default function(eleventyConfig) {
eleventyConfig.addFilter("readableDate", (dateInput, format, zone) => {
        if (!dateInput) {
            return "Date Missing"; 
        }
        let dateObj;
        const targetZone = zone || "utc";
        const defaultFormat = format || "dd LLLL yyyy";
        if (typeof dateInput === 'string') {
            dateObj = DateTime.fromISO(dateInput, { zone: targetZone });
        } else {
            dateObj = DateTime.fromJSDate(dateInput, { zone: targetZone });
        }
        if (!dateObj.isValid) {
            console.error("Luxon Parsing Failed to input:", dateInput);
            return "Invalid Date Format";
        }
        return dateObj.toFormat(defaultFormat);
    });
eleventyConfig.addFilter("date", eleventyConfig.getFilter("readableDate"));
    eleventyConfig.addFilter("htmlDateString", (dateObj) => {
        return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
    });
    eleventyConfig.addNunjucksFilter("limit", (arr, limit) => arr.slice(0, limit));    
    eleventyConfig.addFilter("head", (array, n) => {
        if(!Array.isArray(array) || array.length === 0) {
            return [];
        }
        if( n < 0 ) {
            return array.slice(n);
        }
        return array.slice(0, n);
    });
	eleventyConfig.addFilter("contains", (arr, value) => {
    if (!Array.isArray(arr) || arr.length === 0) {
        return false;
    }
    const lowerCaseArray = arr.map(item => String(item).toLowerCase());
    return lowerCaseArray.includes(String(value).toLowerCase());
    });
    eleventyConfig.addFilter("includes", (arr, value) => {
        if (typeof arr === 'string') {
            return arr.includes(value);
        }
        if (!Array.isArray(arr) || arr.length === 0) {
            return false;
        }
        return arr.includes(value);
    });
    eleventyConfig.addFilter("min", (...numbers) => {
        return Math.min.apply(null, numbers);
    });
    eleventyConfig.addFilter("getKeys", target => {
        return Object.keys(target);
    });
    eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
        return (tags || []).filter(tag => ["all", "posts" ].indexOf(tag) === -1);
    });

   eleventyConfig.addFilter("sortAlphabetically", strings =>
        (strings || []).sort((a, b) => {
            const strA = String(a || '').toLowerCase();
            const strB = String(b || '').toLowerCase();
            if (strA < strB) {
                return -1;
            }
            if (strA > strB) {
                return 1;
            }
            return 0;
        })
    );
    eleventyConfig.addFilter("isFeatured", (post) => {
        if (!post || !Array.isArray(post.category_names)) {
            return false;
        }
        const lowerCaseCategories = post.category_names.map(name => String(name).toLowerCase());
        return lowerCaseCategories.includes('featured');
    });
eleventyConfig.addFilter("map", (arr, key) => {
    if (!Array.isArray(arr)) {
        return arr;
    }
    if (typeof key === 'string' && typeof arr[0]?.[key] === 'function') {
        return arr.map(item => item[key]());
    }
    if (key === 'lower' && typeof eleventyConfig.getFilter('lower') === 'function') {
        const lowerFilter = eleventyConfig.getFilter('lower');
        return arr.map(item => lowerFilter(item));
    }
    return arr.map(item => item[key]);
    });
    eleventyConfig.addFilter("lower", (value) => {
        if (typeof value === 'string') {
            return value.toLowerCase();
        }
        if (Array.isArray(value)) {
            return value.map(v => String(v).toLowerCase());
        }
        return value;
    });
};