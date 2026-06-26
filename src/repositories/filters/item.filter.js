export function buildItemFilter({
    search,
    sku,
    slug,
    status,
    statuses,
    categoryIds,
    tagIds,
    hasVariations,
    isOnAction,
    minPrice,
    maxPrice,
    size,
    color,
    inStock,
    isBackOrder,
    minRating,
    ids,
    rawFilter,
} = {}) {
    const filter = {};

    if (search && search.trim()) {
        const regex = new RegExp(search.trim(), "i");
        filter.$or = [
            { title: regex },
            { sku: regex },
            { description: regex },
            { keyWords: regex },
        ];
    }

    if (sku) {
        filter.sku = sku.toLowerCase().trim();
    }

    if (slug) {
        filter.slug = slug.toLowerCase().trim();
    }

    if (status) {
        filter.status = status;
    }

    if (statuses && Array.isArray(statuses) && statuses.length > 0) {
        filter.status = { $in: statuses };
    }

    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
        filter.categories = { $in: categoryIds };
    }

    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
        filter.tags = { $in: tagIds };
    }

    if (hasVariations === true) {
        filter["variations.0"] = { $exists: true };
    } else if (hasVariations === false) {
        filter.variations = { $size: 0 };
    }

    if (isOnAction === true) {
        filter["variations.onAction"] = true;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        const priceFilter = {};
        if (minPrice !== undefined) priceFilter.$gte = minPrice;
        if (maxPrice !== undefined) priceFilter.$lte = maxPrice;
        filter["variations.price"] = priceFilter;
    }

    if (size) {
        filter["variations.size"] = size;
    }

    if (color) {
        filter["variations.color"] = color;
    }

    if (inStock === true) {
        filter["variations.amount"] = { $gt: 0 };
    }

    if (typeof isBackOrder === "boolean") {
        filter["backOrder.isAllowed"] = isBackOrder;
    }

    if (minRating !== undefined) {
        filter["rating.average"] = { $gte: minRating };
    }

    if (ids && Array.isArray(ids) && ids.length > 0) {
        filter._id = { $in: ids };
    }

    if (rawFilter && typeof rawFilter === "object") {
        Object.assign(filter, rawFilter);
    }

    return filter;
}