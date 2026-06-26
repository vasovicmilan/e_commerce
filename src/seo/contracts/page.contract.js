export function mapStaticPageToSeoContract(pageData) {
  if (!pageData) return null;

  return {
    title: pageData.title || "",
    description: pageData.description || "",
    canonical: pageData.canonical || "",
    image: pageData.image || null,
    isIndexable: pageData.isIndexable !== false,
    type: "website",
    pageType: pageData.pageType || "information",
  };
}