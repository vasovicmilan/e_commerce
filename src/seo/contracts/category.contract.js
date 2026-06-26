import { SITE_URL } from "../utils.js";

function toAbsoluteUrl(img) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  const clean = img.replace(/^images\//, "");
  return `${SITE_URL}/images/${clean}`;
}

export function mapCategoryToSeoContract(category, contentType = "item") {
  // 🔥 ZAŠTITA: ako nema kategorije, vrati minimalni kontrakt
  if (!category) {
    return {
      title: 'Kategorija',
      description: '',
      canonical: '/',
      isIndexable: true,
      name: 'Kategorija',
      slug: '',
    };
  }

  const name = category.name || 'Kategorija';
  const slug = category.slug || '';
  const isPost = contentType === "post";
  const basePath = isPost ? "/blog/kategorija" : "/prodavnica/kategorija";

  return {
    id: category._id?.toString(),
    slug: slug,
    name: name,
    title: name,
    description: category.shortDescription || category.longDescription || `Svi ${isPost ? "članci" : "proizvodi"} u kategoriji "${name}".`,
    longDescription: category.longDescription || "",
    image: category.featureImage?.img ? toAbsoluteUrl(category.featureImage.img) : null,
    isIndexable: category.isIndexable !== false && category.meta?.isActive !== false,
    canonical: `${basePath}/${slug}`,
    parent: category.parent ? {
      id: category.parent._id?.toString(),
      name: category.parent.name,
      slug: category.parent.slug,
    } : null,
    domain: category.domain || contentType,
    aiAttributes: {
      contentType,
      hasParent: !!category.parent,
      isActive: category.meta?.isActive !== false,
      priority: category.meta?.priority || 0,
    },
  };
}