export function prepareBlogHomeData(data) {
  return {
    featured: data.featured || [],
    posts: data.posts || [],
    categories: data.categories || [],
    tags: data.tags || [],
    pagination: {
      currentPage: data.pagination?.page || 1,
      totalPages: data.pagination?.totalPages || 1,
      basePath: "/blog",
      query: {},
    },
    seo: data.seo,
  };
}

export function prepareBlogPostData(data) {
  return {
    post: data.post || {},
    categories: data.categories || [],
    tags: data.tags || [],
    seo: data.seo || {},
    breadcrumbs: [
      { label: "Početna", url: "/" },
      { label: "Blog", url: "/blog" },
      ...(data.post?.kategorije?.[0]
        ? [{ label: data.post.kategorije[0].naziv, url: `/blog/kategorija/${data.post.kategorije[0].slug}` }]
        : []),
      { label: data.post?.naziv || "", url: null },
    ],
  };
}

export function prepareBlogCategoryData(data) {
  return {
    category: data.category || {},
    posts: data.data || [],
    categories: data.categories || [],
    tags: data.tags || [],
    pagination: {
      currentPage: data.page || 1,
      totalPages: data.totalPages || 1,
      basePath: `/blog/kategorija/${data.category?.slug || ""}`,
      query: {},
    },
    seo: data.seo || {},
    breadcrumbs: [
      { label: "Početna", url: "/" },
      { label: "Blog", url: "/blog" },
      { label: data.category?.name || "", url: null },
    ],
  };
}

export function prepareBlogTagData(data) {
  return {
    tag: data.tag || {},
    posts: data.data || [],
    categories: data.categories || [],
    tags: data.tags || [],
    pagination: {
      currentPage: data.page || 1,
      totalPages: data.totalPages || 1,
      basePath: `/blog/tag/${data.tag?.slug || ""}/${data.tag?.type || ""}`,
      query: {},
    },
    seo: data.seo || {},
    breadcrumbs: [
      { label: "Početna", url: "/" },
      { label: "Blog", url: "/blog" },
      { label: data.tag?.name || "", url: null },
    ],
  };
}

export function prepareBlogSearchData(data) {
  return {
    search: data.search || "",
    posts: data.data || [],
    categories: data.categories || [],
    pagination: {
      currentPage: data.page || 1,
      totalPages: data.totalPages || 1,
      basePath: "/blog/pretraga",
      query: { q: data.search },
    },
    seo: data.seo || {},
    breadcrumbs: [
      { label: "Početna", url: "/" },
      { label: "Blog", url: "/blog" },
      { label: `Pretraga: ${data.search || ""}`, url: null },
    ],
  };
}