
// Map Database (snake_case) to API (camelCase)
export const toApiCard = (dbCard: any) => {
    if (!dbCard) return null;
    return {
        id: dbCard.id,
        userId: dbCard.user_id,
        firstName: dbCard.first_name,
        lastName: dbCard.last_name,
        title: dbCard.title,
        company: dbCard.company,
        bio: dbCard.bio,
        email: dbCard.email,
        phone: dbCard.phone,
        location: dbCard.location,
        website: dbCard.website,
        avatarUrl: dbCard.avatar_url,
        themeId: dbCard.theme_id,
        themeConfig: dbCard.theme_config || {},
        socialLinks: dbCard.social_links || [],
        isPublished: dbCard.is_published,
        publishedUrl: dbCard.published_url,
        customSlug: dbCard.custom_slug,
        slug: dbCard.custom_slug, // Alias
        viewsCount: dbCard.views_count,
        contactsSaved: dbCard.contacts_saved,
        sharesCount: dbCard.shares_count,
        isActive: dbCard.is_active,
        planType: dbCard.plan_type,
        features: dbCard.features,
        createdAt: dbCard.created_at,
        updatedAt: dbCard.updated_at,
        publishedAt: dbCard.published_at
    };
};

// Map API (camelCase) to Database (snake_case)
// Note: We don't map everything (like timestamps) as DB handles them, 
// allows partial updates.
export const toDbCard = (apiCard: any) => {
    const dbCard: any = {};

    if (apiCard.userId) dbCard.user_id = apiCard.userId;
    if (apiCard.firstName !== undefined) dbCard.first_name = apiCard.firstName;
    if (apiCard.lastName !== undefined) dbCard.last_name = apiCard.lastName;
    if (apiCard.title !== undefined) dbCard.title = apiCard.title;
    if (apiCard.company !== undefined) dbCard.company = apiCard.company;
    if (apiCard.bio !== undefined) dbCard.bio = apiCard.bio;
    if (apiCard.email !== undefined) dbCard.email = apiCard.email;
    if (apiCard.phone !== undefined) dbCard.phone = apiCard.phone;
    if (apiCard.location !== undefined) dbCard.location = apiCard.location;
    if (apiCard.website !== undefined) dbCard.website = apiCard.website;
    if (apiCard.avatarUrl !== undefined) dbCard.avatar_url = apiCard.avatarUrl;
    if (apiCard.themeId !== undefined) dbCard.theme_id = apiCard.themeId;
    if (apiCard.themeConfig !== undefined) dbCard.theme_config = apiCard.themeConfig;
    if (apiCard.socialLinks !== undefined) dbCard.social_links = apiCard.socialLinks;
    if (apiCard.isPublished !== undefined) dbCard.is_published = apiCard.isPublished;
    if (apiCard.publishedUrl !== undefined) dbCard.published_url = apiCard.publishedUrl;
    if (apiCard.customSlug !== undefined) dbCard.custom_slug = apiCard.customSlug;
    // Stats generally updated via specific methods, but can be set here if needed
    if (apiCard.viewsCount !== undefined) dbCard.views_count = apiCard.viewsCount;

    return dbCard;
};
