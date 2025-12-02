/**
 * Dynamic Meta Tags Generator for Social Sharing
 * Creates modern, personalized Open Graph tags for each digital card
 */

import { DigitalCard } from '../types';

export interface MetaTagsData {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
  type: string;
}

/**
 * Generate modern meta tags for a specific digital card
 */
export const generateCardMetaTags = (card: DigitalCard, baseUrl: string = ''): MetaTagsData => {
  const fullName = `${card.firstName} ${card.lastName}`.trim();
  const cardUrl = `${baseUrl}/card/${card.id}`;

  // Create modern, professional title
  const title = card.title
    ? `${fullName} - ${card.title} | INDI Digital Card`
    : `${fullName} | Professional Digital Card`;

  // Create engaging description
  const description = card.bio
    ? `${card.bio.substring(0, 120)}... Connect with ${fullName} through their digital business card.`
    : `Connect with ${fullName}${card.company ? ` at ${card.company}` : ''}${card.title ? ` - ${card.title}` : ''}. Professional digital business card with contact info and social links.`;

  // Generate modern card preview image URL
  // This could be enhanced to create actual card screenshots
  const imageUrl = card.avatarUrl || generateCardPreviewImage(card, baseUrl);

  return {
    title,
    description: description.substring(0, 155), // Optimal length for social platforms
    image: imageUrl,
    url: cardUrl,
    siteName: 'INDI Digital Cards',
    type: 'profile'
  };
};

/**
 * Generate a card preview image URL (placeholder for now)
 * In a full implementation, this would generate an actual card screenshot
 */
const generateCardPreviewImage = (card: DigitalCard, baseUrl: string): string => {
  // For now, return a placeholder. In production, this could:
  // 1. Use a service like Vercel OG Image Generation
  // 2. Generate card screenshots with Puppeteer
  // 3. Use a template-based image generator

  const encodedName = encodeURIComponent(`${card.firstName} ${card.lastName}`);
  const encodedTitle = encodeURIComponent(card.title || 'Professional');

  // Using a placeholder service that generates professional cards
  return `https://og-image.vercel.app/${encodedName}.png?theme=dark&md=1&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-white.svg&widths=250&heights=250`;
};

/**
 * Update the document's meta tags dynamically
 */
export const updateMetaTags = (metaData: MetaTagsData) => {
  // Update title
  document.title = metaData.title;

  // Helper function to update or create meta tag
  const updateMetaTag = (property: string, content: string, isName = false) => {
    const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
    let meta = document.querySelector(selector) as HTMLMetaElement;

    if (!meta) {
      meta = document.createElement('meta');
      if (isName) {
        meta.name = property;
      } else {
        meta.setAttribute('property', property);
      }
      document.head.appendChild(meta);
    }

    meta.content = content;
  };

  // Update Open Graph tags
  updateMetaTag('og:title', metaData.title);
  updateMetaTag('og:description', metaData.description);
  updateMetaTag('og:image', metaData.image);
  updateMetaTag('og:url', metaData.url);
  updateMetaTag('og:site_name', metaData.siteName);
  updateMetaTag('og:type', metaData.type);

  // Update Twitter tags
  updateMetaTag('twitter:card', 'summary_large_image', true);
  updateMetaTag('twitter:title', metaData.title);
  updateMetaTag('twitter:description', metaData.description);
  updateMetaTag('twitter:image', metaData.image);

  // Update standard meta tags
  updateMetaTag('description', metaData.description, true);

  console.log('🏷️ Meta tags updated for social sharing:', metaData);
};

/**
 * Generate a modern WhatsApp sharing message
 */
export const generateWhatsAppMessage = (card: DigitalCard, url: string): string => {
  const fullName = `${card.firstName} ${card.lastName}`.trim();

  const messages = [
    `¡Hola! 👋 Te comparto mi tarjeta digital profesional: ${url}`,
    `🌟 Conoce más sobre ${fullName} - ${url}`,
    `💼 Mi información profesional actualizada: ${url}`,
    `✨ ¡Mira mi nueva tarjeta digital! ${url}`,
    `🚀 Conectemos profesionalmente: ${url}`
  ];

  // Select message based on card content
  if (card.company && card.title) {
    return `💼 ${fullName} | ${card.title} en ${card.company}\n\n¡Conoce más sobre mi trabajo y conectemos! ${url}`;
  }

  if (card.bio) {
    return `✨ ${fullName}\n\n${card.bio.substring(0, 80)}...\n\nConoceme mejor: ${url}`;
  }

  // Fallback to random modern message
  return messages[Math.floor(Math.random() * messages.length)];
};

/**
 * Enhanced social sharing URLs with better messaging
 */
export const generateSocialShareUrls = (card: DigitalCard, url: string) => {
  const fullName = `${card.firstName} ${card.lastName}`.trim();
  const whatsappMessage = generateWhatsAppMessage(card, url);

  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Conoce a ${fullName} 👋`)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`Tarjeta digital de ${fullName}`)}`,
    email: `mailto:?subject=${encodeURIComponent(`Tarjeta digital de ${fullName}`)}&body=${encodeURIComponent(`Hola,\n\nTe comparto la tarjeta digital de ${fullName}:\n\n${url}\n\n¡Saludos!`)}`
  };
};