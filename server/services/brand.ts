export interface BrandGuidelines {
  colors: BrandColor[];
  fonts: BrandFont[];
  logo: LogoGuidelines;
  tone: string;
  style: string;
  restrictions: string[];
}

export interface BrandColor {
  name: string;
  hex: string;
  usage: string;
  description: string;
}

export interface BrandFont {
  name: string;
  type: string;
  weight: string;
  usage: string;
}

export interface LogoGuidelines {
  primary: string;
  secondary?: string;
  usage: string;
  placement: string;
  size: string;
}

export class BrandService {
  async getBrandGuidelines(userId: string): Promise<BrandGuidelines> {
    // Mock implementation
    return {
      colors: [
        { name: 'Primary Blue', hex: '#007bff', usage: 'primary', description: 'Main brand color' }
      ],
      fonts: [
        { name: 'Arial', type: 'body', weight: 'normal', usage: 'Body text' }
      ],
      logo: {
        primary: 'https://example.com/logo.png',
        usage: 'always',
        placement: 'top-left',
        size: 'medium'
      },
      tone: 'professional',
      style: 'modern',
      restrictions: ['No bright colors', 'No comic fonts']
    };
  }
}
