import { DigitalCard } from '../types';

export const generateVCard = (card: DigitalCard) => {
  // Construct vCard 3.0 format
  const vCardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${card.lastName};${card.firstName};;;`,
    `FN:${card.firstName} ${card.lastName}`,
    `ORG:${card.company}`,
    `TITLE:${card.title}`,
    `EMAIL;type=INTERNET;type=WORK:${card.email}`,
    `TEL;type=CELL:${card.phone}`,
    `ADR;type=WORK:;;;${card.location};;;`,
    `NOTE:${card.bio.replace(/\n/g, '\\n')}`,
    `URL:${card.publishedUrl || window.location.href}`,
  ];

  // Add social links as URLs
  card.socialLinks.forEach(link => {
    if (link.active && link.url) {
      vCardLines.push(`URL;type=${link.platform.toUpperCase()}:${link.url}`);
    }
  });

  vCardLines.push('END:VCARD');

  return vCardLines.join('\n');
};

export const downloadVCard = (card: DigitalCard) => {
  const vCardData = generateVCard(card);
  const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${card.firstName}_${card.lastName}.vcf`);
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};