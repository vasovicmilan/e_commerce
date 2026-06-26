import { SITE_URL } from "../utils.js";

function toAbsoluteUrl(img) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  const clean = img.replace(/^images\//, "");
  return `${SITE_URL}/images/${clean}`;
}

function calculateReadTime(content = []) {
  if (!Array.isArray(content)) return 0;
  const words = content.reduce((sum, block) => {
    const text = block.text || "";
    const items = (block.items || []).join(" ");
    const rows = (block.rows || []).flat().join(" ");
    const allText = [text, items, rows].filter(Boolean).join(" ");
    return sum + allText.split(/\s+/).length;
  }, 0);
  return Math.max(1, Math.ceil(words / 200));
}

function extractFirstImage(content = []) {
  const imgBlock = content.find(b => b.type === "image" && b.src);
  return imgBlock?.src ? toAbsoluteUrl(imgBlock.src) : null;
}

function getAuthorDisplayName(author) {
  if (!author) return "TopHelanke";
  if (typeof author === "object" && author !== null) {
    if (author.firstName && author.lastName) {
      return `${author.firstName} ${author.lastName}`.trim();
    }
    if (author.name) return author.name;
  }
  return "TopHelanke";
}

export function mapPostToSeoContract(post) {
  // 🔥 ZAŠTITA: ako nema post-a, vrati minimalni kontrakt
  if (!post) {
    return {
      title: 'Članak',
      description: '',
      image: null,
      isIndexable: true,
      type: 'article',
    };
  }

  const content = post.content || [];
  const title = post.title || 'Članak';

  const authorName = getAuthorDisplayName(post.author);
  const primaryCategory = post.categories?.[0];
  const categoryName = primaryCategory?.name || "";
  const categorySlug = primaryCategory?.slug || "";

  const featureImage = post.featureImage?.img
    ? toAbsoluteUrl(post.featureImage.img)
    : null;

  const contentImage = extractFirstImage(content);

  return {
    id: post._id?.toString(),
    slug: post.slug || '',
    title: title,

    description: post.shortDescription || post.description || `Pročitajte članak "${title}" na blogu TopHelanke.`,
    fullDescription: post.description || "",
    excerpt: post.shortDescription || "",

    image: featureImage || contentImage,
    images: [featureImage, contentImage].filter(Boolean),

    isIndexable: post.status !== "not-published",
    type: "article",

    author: {
      name: authorName,
      url: null,
    },

    category: {
      name: categoryName,
      slug: categorySlug,
    },

    tags: (post.tags || []).map(t => t.name || t),

    publishedTime: post.createdAt,
    modifiedTime: post.updatedAt,

    readTime: calculateReadTime(content),
    wordCount: content.reduce((sum, block) => {
      const text = block.text || "";
      return sum + text.split(/\s+/).length;
    }, 0),

    faq: (post.faq || []).map(f => ({
      question: f.question,
      answer: f.answer,
    })),

    aiAttributes: {
      contentLength: content.length,
      hasImages: content.some(b => b.type === "image"),
      hasList: content.some(b => b.type === "list"),
      hasTable: content.some(b => b.type === "table"),
      hasQuote: content.some(b => b.type === "quote"),
      authorName,
      categoryName,
      tagCount: (post.tags || []).length,
    },
  };
}

export function mapPostsListToSeoContract(posts, title, description, canonical) {
  const firstPost = posts?.[0];
  const image = firstPost?.featureImage?.img
    ? toAbsoluteUrl(firstPost.featureImage.img)
    : null;

  return {
    title: title || 'Blog',
    description: description || '',
    canonical: canonical || '/blog',
    image: image,
    isIndexable: true,
    type: "website",
    pageType: "blog-list",
    postCount: posts?.length || 0,
    latestPostDate: firstPost?.createdAt || null,
  };
}