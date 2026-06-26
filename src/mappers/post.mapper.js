import { formatDateTime, formatDate } from "../utils/date.time.util.js";

function translateStatus(status) {
  const map = {
    "not-published": "Nije objavljen",
    published: "Objavljen",
    featured: "Istaknut",
  };
  return map[status] || status;
}

function formatFeatureImage(image) {
  if (!image?.img) return null;
  return {
    url: image.img,
    opis: image.imgDesc || "",
  };
}

function mapCategoryList(categories = []) {
  return categories.map((c) => ({
    id: c._id?.toString(),
    naziv: c.name,
    slug: c.slug,
  }));
}

function mapTagList(tags = []) {
  return tags.map((t) => ({
    id: t._id?.toString(),
    naziv: t.name,
    slug: t.slug,
    tip: t.type,
  }));
}

function mapKeywords(keyWords = []) {
  return keyWords.filter((k) => k && k.trim());
}

function mapFaq(faq = []) {
  return faq.map((f) => ({
    id: f._id?.toString(),
    pitanje: f.question,
    odgovor: f.answer,
    ikona: f.icon || null,
  }));
}

function renderContentBlocks(blocks = []) {
  if (!Array.isArray(blocks)) return "";

  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading": {
          const level = block.level || 2;
          return `<h${level}>${block.text || ""}</h${level}>`;
        }
        case "paragraph":
          return `<p>${block.text || ""}</p>`;
        case "list": {
          const tag = "ul";
          const items = (block.items || [])
            .map((item) => `<li>${item}</li>`)
            .join("");
          return `<${tag}>${items}</${tag}>`;
        }
        case "table": {
          const headers = (block.headers || [])
            .map((h) => `<th>${h}</th>`)
            .join("");
          const rows = (block.rows || [])
            .map(
              (row) =>
                `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
            )
            .join("");
          return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
        }
        case "image":
          return `<figure><img src="${block.src || ""}" alt="${block.alt || ""}" loading="lazy"></figure>`;
        case "quote":
          return `<blockquote><p>${block.text || ""}</p></blockquote>`;
        default:
          return "";
      }
    })
    .join("\n");
}

function calculateReadTime(content = []) {
  if (!Array.isArray(content)) return 0;
  const words = content.reduce((sum, block) => {
    const text = block.text || "";
    return sum + text.split(/\s+/).length;
  }, 0);
  return Math.max(1, Math.ceil(words / 200));
}

function getAuthorDisplayName(author) {
  if (!author) return "Nepoznat";
  if (typeof author === "object" && author !== null) {
    if (author.firstName && author.lastName) {
      return `${author.firstName} ${author.lastName}`.trim();
    }
    if (author.name) return author.name;
    return author._id?.toString() || "Nepoznat";
  }
  return author.toString();
}

function getAuthorId(author) {
  if (!author) return null;
  if (typeof author === "object" && author !== null) {
    return author._id?.toString() || null;
  }
  return author.toString();
}

export function mapPostsForAdminList(posts = []) {
  return posts
    .map((post) => {
      if (!post) return null;

      return {
        id: post._id.toString(),
        naziv: post.title,
        slug: post.slug,
        status: translateStatus(post.status),
        statusRaw: post.status,
        autor: getAuthorDisplayName(post.author),
        autorId: getAuthorId(post.author),
        // 🔥 IZMENA: direktna putanja do slike
        slika: post.featureImage?.img ? `/images/posts/${post.featureImage.img}` : null,
        kategorije: (post.categories || []).map((c) => c.name || c).join(", "),
        tagovi: (post.tags || []).map((t) => t.name || t).join(", "),
        kreiran: formatDate(post.createdAt),
        azuriran: formatDate(post.updatedAt),
      };
    })
    .filter(Boolean);
}

export function mapPostForAdminDetail(post) {
  if (!post) return null;

  return {
    id: post._id.toString(),
    osnovno: {
      naziv: post.title,
      slug: post.slug,
      status: translateStatus(post.status),
      statusRaw: post.status,
      autor: getAuthorDisplayName(post.author),
      autorId: getAuthorId(post.author),
    },
    slika: formatFeatureImage(post.featureImage),
    kategorije: mapCategoryList(post.categories || []),
    tagovi: mapTagList(post.tags || []),
    sadrzaj: {
      blokovi: post.content || [],
      html: renderContentBlocks(post.content),
      vremeCitanja: calculateReadTime(post.content),
    },
    seo: {
      opis: post.description || "",
      kratakOpis: post.shortDescription || "",
      kljucneReci: mapKeywords(post.keyWords || []),
      faq: mapFaq(post.faq || []),
    },
    vreme: {
      kreirano: formatDateTime(post.createdAt),
      azurirano: formatDateTime(post.updatedAt),
    },
  };
}

export function mapPostForEdit(post) {
  if (!post) return null;

  return {
    id: post._id.toString(),
    title: post.title,
    slug: post.slug,
    status: post.status,
    author: getAuthorId(post.author),
    featureImage: post.featureImage,
    categories: (post.categories || []).map((c) => c._id?.toString() || c),
    tags: (post.tags || []).map((t) => t._id?.toString() || t),
    content: post.content || [],
    description: post.description,
    shortDescription: post.shortDescription,
    keyWords: post.keyWords || [],
    faq: post.faq || [],
  };
}

export function mapPostsForCards(posts = []) {
  return posts
    .map((post) => {
      if (!post) return null;

      return {
        id: post._id.toString(),
        naziv: post.title,
        slug: post.slug,
        kratakOpis: post.shortDescription || "",
        slika: formatFeatureImage(post.featureImage),
        kategorije: mapCategoryList(post.categories || []),
        tagovi: mapTagList(post.tags || []),
        datum: formatDate(post.createdAt),
        vremeCitanja: calculateReadTime(post.content),
      };
    })
    .filter(Boolean);
}

export function mapPostForPublic(post) {
  if (!post) return null;

  return {
    id: post._id.toString(),
    naziv: post.title,
    slug: post.slug,
    autor: getAuthorDisplayName(post.author),
    datum: formatDate(post.createdAt),
    azuriran: formatDate(post.updatedAt),
    slika: formatFeatureImage(post.featureImage),
    kategorije: mapCategoryList(post.categories || []),
    tagovi: mapTagList(post.tags || []),
    kratakOpis: post.shortDescription || "",
    opis: post.description || "",
    sadrzaj: renderContentBlocks(post.content),
    vremeCitanja: calculateReadTime(post.content),
    kljucneReci: mapKeywords(post.keyWords || []),
    faq: mapFaq(post.faq || []),
  };
}

export function mapPostRaw(post) {
  return post;
}

export default {
  mapPostsForAdminList,
  mapPostForAdminDetail,
  mapPostForEdit,
  mapPostsForCards,
  mapPostForPublic,
  mapPostRaw,
};