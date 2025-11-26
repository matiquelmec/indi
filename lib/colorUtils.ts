// Convert Hex to RGB
export const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Calculate relative luminance (WCAG definition)
  const getLuminance = (r: number, g: number, b: number) => {
    const a = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };
  
  // Get optimal text color (black or white) based on background contrast
  export const getContrastColor = (hexColor: string): '#ffffff' | '#0f172a' => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#ffffff';
    const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
    return luminance > 0.4 ? '#0f172a' : '#ffffff';
  };
  
  // Adjust color brightness (percent is -1.0 to 1.0)
  export const adjustColor = (hex: string, percent: number): string => {
    const f = parseInt(hex.slice(1), 16);
    const t = percent < 0 ? 0 : 255;
    const p = percent < 0 ? percent * -1 : percent;
    const R = f >> 16;
    const G = (f >> 8) & 0x00FF;
    const B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
  };
  
  // Generate a complete palette based on configuration
  export const generatePalette = (brandColor: string, atmosphere: 'midnight' | 'glass' | 'clean') => {
    const primary = brandColor;
    const secondary = adjustColor(brandColor, 0.2); // Lighter
    const darkShade = adjustColor(brandColor, -0.6); // Much darker
  
    // Determine Text Color for Primary Buttons/Accents
    const onPrimary = getContrastColor(primary);
  
    let background = '';
    let text = '';
    let gradient = '';
    let surface = '';
    let surfaceBorder = '';
  
    switch (atmosphere) {
      case 'clean':
        background = '#f8fafc'; // Slate 50
        text = '#0f172a'; // Slate 900
        gradient = `from-white via-slate-50 to-slate-100`;
        surface = 'rgba(255, 255, 255, 0.8)';
        surfaceBorder = 'rgba(0, 0, 0, 0.05)';
        break;
      case 'midnight':
        background = '#020617'; // Slate 950
        text = '#f8fafc'; // Slate 50
        gradient = `from-slate-950 via-slate-900 to-slate-950`;
        surface = 'rgba(30, 41, 59, 0.5)'; // Slate 800 alpha
        surfaceBorder = 'rgba(255, 255, 255, 0.1)';
        break;
      case 'glass':
      default:
        background = '#0f172a';
        text = '#ffffff';
        // Create a rich gradient using the brand color
        // If brand is Blue (#2563eb), gradient might go from Dark Blue to Slate
        gradient = `bg-gradient-to-br`; // We'll handle the colors via inline styles or tailwind classes
        surface = 'rgba(255, 255, 255, 0.1)';
        surfaceBorder = 'rgba(255, 255, 255, 0.2)';
        break;
    }
  
    return {
      colors: {
        primary,
        secondary,
        onPrimary,
        background,
        text,
        surface,
        surfaceBorder,
        darkShade
      },
      gradientStyle: atmosphere === 'glass' 
        ? { background: `linear-gradient(135deg, ${darkShade} 0%, #0f172a 50%, ${darkShade} 100%)` }
        : {},
      isDark: atmosphere !== 'clean'
    };
  };