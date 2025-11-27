import { supabase } from './supabaseAuth';
import { DigitalCard } from '../types';

// Database interface matching the SQL schema
interface DbCard {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    title: string;
    company: string | null;
    bio: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    website: string | null;
    avatar_url: string | null;
    theme_id: string;
    theme_config: any;
    social_links: any;
    is_published: boolean;
    published_url: string | null;
    views_count: number;
    created_at: string;
    updated_at: string;
    subscription_status?: string;
    trial_ends_at?: string;
    plan_type?: string;
}

export const supabaseDataService = {
    console.error('Error fetching cards:', error);
    return [];
}
    },

return null;
    }
},

return null;
    }
},
id: user.id,
    email: user.email,
        first_name: user.user_metadata?.first_name || 'User',
            last_name: user.user_metadata?.last_name || '',
                email_verified: true
    });
}
        } catch (err) {
    console.error('Error ensuring user exists:', err);
}
    },

    /**
     * Create a new card
     */
    async createCard(card: Partial<DigitalCard>): Promise < DigitalCard > {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) throw new Error('User not authenticated');

        // Ensure user exists in public table to satisfy Foreign Key
        await this.ensureUserExists(user);

        return this.mapDbToFrontend(data);
    } catch(error: any) {
        console.error('Error creating card:', error);
        throw error;
    }
},

    /**
     * Update an existing card
     */
    async updateCard(card: DigitalCard): Promise < DigitalCard > {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            return this.mapDbToFrontend(data);
        } catch(error: any) {
            console.error('Error updating card:', error);
            throw error;
        }
    },

        /**
         * Delete a card
         */
        async deleteCard(id: string): Promise < boolean > {
            try {
                const { error } = await supabase
                    .from('cards')
                    .delete()
                    .eq('id', id);

                if(error) throw error;
                return true;
            } catch(error) {
                console.error('Error deleting card:', error);
                return false;
            }
        },

            /**
             * Helper: Map DB snake_case to Frontend camelCase
             */
            mapDbToFrontend(dbCard: DbCard): DigitalCard {
    return {
        id: dbCard.id,
        userId: dbCard.user_id,
        firstName: dbCard.first_name,
        lastName: dbCard.last_name,
        title: dbCard.title,
        company: dbCard.company || '',
        bio: dbCard.bio || '',
        email: dbCard.email || '',
        phone: dbCard.phone || '',
        location: dbCard.location || '',
        avatarUrl: dbCard.avatar_url || '',
        themeId: dbCard.theme_id,
        themeConfig: dbCard.theme_config || {},
        socialLinks: dbCard.social_links || [],
        isPublished: dbCard.is_published,
        publishedUrl: dbCard.published_url || undefined,
        viewsCount: dbCard.views_count,
        subscriptionStatus: (dbCard.subscription_status as any) || 'free',
        trialEndsAt: dbCard.trial_ends_at ? new Date(dbCard.trial_ends_at).getTime() : undefined,
        planType: (dbCard.plan_type as any) || 'free',
        isActive: true, // Default to true as DB doesn't have this yet
        createdAt: dbCard.created_at,
        updatedAt: dbCard.updated_at
    };
},

/**
 * Helper: Map Frontend camelCase to DB snake_case
 */
mapFrontendToDb(card: Partial<DigitalCard>, userId: string): Partial < DbCard > {
    return {
        user_id: userId,
        first_name: card.firstName,
        last_name: card.lastName,
        title: card.title,
        company: card.company,
        bio: card.bio,
        email: card.email,
        phone: card.phone,
        location: card.location,
        avatar_url: card.avatarUrl,
        theme_id: card.themeId || 'emerald',
        theme_config: card.themeConfig || {},
        social_links: card.socialLinks || [],
        is_published: card.isPublished || false,
        published_url: card.publishedUrl,
        subscription_status: card.subscriptionStatus,
        trial_ends_at: card.trialEndsAt ? new Date(card.trialEndsAt).toISOString() : undefined,
        plan_type: card.planType
    };
}
};
