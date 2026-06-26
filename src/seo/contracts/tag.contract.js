export function mapTagToSeoContract(tag, contentType = "item") {
  // 🔥 ZAŠTITA: ako nema taga, vrati minimalni kontrakt
  if (!tag) {
    return {
      title: 'Tag',
      description: '',
      canonical: '/',
      isIndexable: true,
      name: 'Tag',
      slug: '',
    };
  }

  const name = tag.name || 'Tag';
  const slug = tag.slug || '';
  const isPost = contentType === "post";
  const basePath = isPost ? "/blog/tag" : "/prodavnica/tag";

  return {
    title: name,
    name: name,
    slug: slug,
    description: tag.shortDescription || tag.longDescription || `Svi ${isPost ? "članci" : "proizvodi"} sa oznakom "${name}".`,
    canonical: `${basePath}/${slug}`,
    image: null,
    isIndexable: tag.isIndexable !== false && tag.meta?.isActive !== false,
    type: "website",
    contentType,
  };
}