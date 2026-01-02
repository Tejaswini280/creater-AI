import { BaseAgent, AgentMessage } from '../services/ai-orchestration';
import { DesignService } from '../services/design';
import { BrandService } from '../services/brand';

export interface CreativeRequest {
  contentType: 'video' | 'image' | 'thumbnail' | 'banner' | 'story';
  brandGuidelines: BrandGuidelines;
  content: ContentBrief;
  targetAudience: AudienceProfile;
  platform: string;
  dimensions?: ContentDimensions;
}

export interface CreativeResponse {
  designs: DesignOption[];
  recommendations: CreativeRecommendation[];
  brandCompliance: BrandComplianceReport;
  visualElements: VisualElement[];
}

export interface BrandGuidelines {
  colors: BrandColor[];
  fonts: BrandFont[];
  logo: LogoGuidelines;
  tone: 'professional' | 'casual' | 'playful' | 'serious';
  style: 'modern' | 'classic' | 'minimalist' | 'bold';
  restrictions: string[];
}

export interface BrandColor {
  name: string;
  hex: string;
  usage: 'primary' | 'secondary' | 'accent' | 'background' | 'text';
  description: string;
}

export interface BrandFont {
  name: string;
  type: 'heading' | 'body' | 'accent';
  weight: string;
  usage: string;
}

export interface LogoGuidelines {
  primary: string; // URL
  secondary?: string;
  usage: 'always' | 'sometimes' | 'never';
  placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  size: 'small' | 'medium' | 'large';
}

export interface ContentBrief {
  title: string;
  description: string;
  keyMessages: string[];
  callToAction?: string;
  mood: string;
  style: string;
}

export interface AudienceProfile {
  age: string;
  interests: string[];
  demographics: string[];
  preferences: string[];
  behavior: string[];
}

export interface ContentDimensions {
  width: number;
  height: number;
  aspectRatio: string;
  platform: string;
}

export interface DesignOption {
  id: string;
  name: string;
  description: string;
  preview: string; // URL
  elements: DesignElement[];
  compliance: number; // 0-100
  appeal: number; // 0-100
  uniqueness: number; // 0-100
  estimatedEngagement: number;
}

export interface DesignElement {
  type: 'text' | 'image' | 'shape' | 'icon' | 'logo';
  content: string;
  position: Position;
  size: Size;
  style: ElementStyle;
  animation?: Animation;
}

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ElementStyle {
  color?: string;
  font?: string;
  fontSize?: number;
  opacity?: number;
  border?: Border;
  shadow?: Shadow;
}

export interface Border {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface Shadow {
  x: number;
  y: number;
  blur: number;
  color: string;
  opacity: number;
}

export interface Animation {
  type: 'fade' | 'slide' | 'scale' | 'rotate';
  duration: number;
  delay: number;
  easing: string;
}

export interface CreativeRecommendation {
  type: 'layout' | 'color' | 'typography' | 'imagery' | 'animation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  implementation: string[];
  expectedImpact: string;
}

export interface BrandComplianceReport {
  overallScore: number; // 0-100
  violations: ComplianceViolation[];
  suggestions: string[];
  approved: boolean;
}

export interface ComplianceViolation {
  type: 'color' | 'font' | 'logo' | 'spacing' | 'tone';
  severity: 'high' | 'medium' | 'low';
  description: string;
  element: string;
  suggestion: string;
}

export interface VisualElement {
  type: 'icon' | 'illustration' | 'pattern' | 'texture' | 'gradient';
  name: string;
  description: string;
  usage: string;
  preview: string;
  category: string;
}

export class CreativeDirectorAgent extends BaseAgent {
  private designService: DesignService;
  private brandService: BrandService;

  constructor() {
    super(
      'creative-director',
      [
        'visual_design',
        'brand_alignment',
        'style_guidance',
        'layout_optimization',
        'color_theory',
        'typography',
        'animation_design'
      ],
      {
        name: 'Creative Director',
        description: 'Creates visually compelling designs aligned with brand guidelines',
        version: '1.0.0'
      }
    );

    this.designService = new DesignService();
    this.brandService = new BrandService();
  }

  protected async processMessage(message: AgentMessage): Promise<AgentMessage | null> {
    const { type, payload } = message;

    switch (type) {
      case 'request':
        return await this.handleCreativeRequest(payload);
      case 'notification':
        return await this.handleNotification(payload);
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  }

  private async handleCreativeRequest(payload: any): Promise<AgentMessage> {
    const request: CreativeRequest = payload.input;

    try {
      // Validate brand compliance
      const brandCompliance = await this.validateBrandCompliance(request);

      // Generate design options
      const designs = await this.generateDesignOptions(request);

      // Create recommendations
      const recommendations = await this.generateRecommendations(request, designs);

      // Get visual elements
      const visualElements = await this.getVisualElements(request);

      const response: CreativeResponse = {
        designs,
        recommendations,
        brandCompliance,
        visualElements
      };

      return {
        id: this.generateMessageId(),
        from: this.id,
        to: message.from,
        type: 'response',
        payload: response,
        timestamp: new Date(),
        correlationId: message.correlationId
      };
    } catch (error) {
      throw new Error(`Creative design failed: ${error.message}`);
    }
  }

  private async validateBrandCompliance(request: CreativeRequest): Promise<BrandComplianceReport> {
    const violations: ComplianceViolation[] = [];
    let score = 100;

    // Check color compliance
    const colorViolations = this.checkColorCompliance(request);
    violations.push(...colorViolations);
    score -= colorViolations.length * 10;

    // Check font compliance
    const fontViolations = this.checkFontCompliance(request);
    violations.push(...fontViolations);
    score -= fontViolations.length * 15;

    // Check logo compliance
    const logoViolations = this.checkLogoCompliance(request);
    violations.push(...logoViolations);
    score -= logoViolations.length * 20;

    // Check tone compliance
    const toneViolations = this.checkToneCompliance(request);
    violations.push(...toneViolations);
    score -= toneViolations.length * 5;

    const suggestions = this.generateComplianceSuggestions(violations);

    return {
      overallScore: Math.max(0, score),
      violations,
      suggestions,
      approved: score >= 80
    };
  }

  private async generateDesignOptions(request: CreativeRequest): Promise<DesignOption[]> {
    const designs: DesignOption[] = [];

    // Generate multiple design variations
    for (let i = 0; i < 3; i++) {
      const design = await this.createDesignOption(request, i);
      designs.push(design);
    }

    // Sort by appeal and compliance
    return designs.sort((a, b) => {
      const scoreA = (a.appeal + a.compliance + a.uniqueness) / 3;
      const scoreB = (b.appeal + b.compliance + b.uniqueness) / 3;
      return scoreB - scoreA;
    });
  }

  private async createDesignOption(request: CreativeRequest, variant: number): Promise<DesignOption> {
    const elements = await this.generateDesignElements(request, variant);
    const preview = await this.designService.generatePreview(elements, request.dimensions);
    
    return {
      id: `design_${variant}_${Date.now()}`,
      name: `${request.contentType} Design ${variant + 1}`,
      description: this.generateDesignDescription(request, variant),
      preview,
      elements,
      compliance: this.calculateCompliance(elements, request.brandGuidelines),
      appeal: this.calculateAppeal(elements, request.targetAudience),
      uniqueness: this.calculateUniqueness(elements),
      estimatedEngagement: this.estimateEngagement(elements, request.targetAudience)
    };
  }

  private async generateDesignElements(request: CreativeRequest, variant: number): Promise<DesignElement[]> {
    const elements: DesignElement[] = [];

    // Add title text
    elements.push({
      type: 'text',
      content: request.content.title,
      position: { x: 50, y: 20 },
      size: { width: 300, height: 60 },
      style: {
        color: request.brandGuidelines.colors.find(c => c.usage === 'primary')?.hex || '#000000',
        font: request.brandGuidelines.fonts.find(f => f.type === 'heading')?.name || 'Arial',
        fontSize: 24,
        opacity: 1
      }
    });

    // Add description text
    elements.push({
      type: 'text',
      content: request.content.description,
      position: { x: 50, y: 100 },
      size: { width: 300, height: 120 },
      style: {
        color: request.brandGuidelines.colors.find(c => c.usage === 'text')?.hex || '#333333',
        font: request.brandGuidelines.fonts.find(f => f.type === 'body')?.name || 'Arial',
        fontSize: 14,
        opacity: 0.9
      }
    });

    // Add logo if required
    if (request.brandGuidelines.logo.usage !== 'never') {
      elements.push({
        type: 'logo',
        content: request.brandGuidelines.logo.primary,
        position: this.calculateLogoPosition(request.brandGuidelines.logo.placement),
        size: this.calculateLogoSize(request.brandGuidelines.logo.size),
        style: { opacity: 1 }
      });
    }

    // Add call-to-action if provided
    if (request.content.callToAction) {
      elements.push({
        type: 'text',
        content: request.content.callToAction,
        position: { x: 50, y: 250 },
        size: { width: 200, height: 40 },
        style: {
          color: request.brandGuidelines.colors.find(c => c.usage === 'accent')?.hex || '#007bff',
          font: request.brandGuidelines.fonts.find(f => f.type === 'accent')?.name || 'Arial',
          fontSize: 16,
          opacity: 1
        },
        animation: {
          type: 'fade',
          duration: 1000,
          delay: 500,
          easing: 'ease-in-out'
        }
      });
    }

    // Add background elements based on variant
    if (variant === 1) {
      elements.push({
        type: 'shape',
        content: 'rectangle',
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        style: {
          color: request.brandGuidelines.colors.find(c => c.usage === 'background')?.hex || '#ffffff',
          opacity: 0.1
        }
      });
    }

    return elements;
  }

  private async generateRecommendations(
    request: CreativeRequest,
    designs: DesignOption[]
  ): Promise<CreativeRecommendation[]> {
    const recommendations: CreativeRecommendation[] = [];

    // Analyze designs for improvement opportunities
    const avgCompliance = designs.reduce((sum, d) => sum + d.compliance, 0) / designs.length;
    if (avgCompliance < 80) {
      recommendations.push({
        type: 'layout',
        priority: 'high',
        title: 'Improve Brand Compliance',
        description: 'Designs need better alignment with brand guidelines',
        reasoning: 'Current compliance score is below 80%',
        implementation: [
          'Use brand colors more consistently',
          'Apply brand fonts correctly',
          'Follow logo placement guidelines'
        ],
        expectedImpact: 'Increased brand recognition and consistency'
      });
    }

    const avgAppeal = designs.reduce((sum, d) => sum + d.appeal, 0) / designs.length;
    if (avgAppeal < 70) {
      recommendations.push({
        type: 'color',
        priority: 'medium',
        title: 'Enhance Visual Appeal',
        description: 'Designs could be more visually engaging',
        reasoning: 'Current appeal score is below 70%',
        implementation: [
          'Use more vibrant colors',
          'Add visual hierarchy',
          'Improve contrast ratios'
        ],
        expectedImpact: 'Higher engagement and click-through rates'
      });
    }

    // Platform-specific recommendations
    if (request.platform === 'instagram') {
      recommendations.push({
        type: 'imagery',
        priority: 'medium',
        title: 'Optimize for Instagram',
        description: 'Add Instagram-specific visual elements',
        reasoning: 'Instagram users expect high-quality visuals',
        implementation: [
          'Use square or vertical formats',
          'Add Instagram-style filters',
          'Include relevant hashtags visually'
        ],
        expectedImpact: 'Better performance on Instagram feed'
      });
    }

    return recommendations;
  }

  private async getVisualElements(request: CreativeRequest): Promise<VisualElement[]> {
    // Get relevant visual elements from design service
    const elements = await this.designService.getVisualElements({
      category: request.contentType,
      style: request.brandGuidelines.style,
      platform: request.platform
    });

    return elements.map(element => ({
      type: element.type,
      name: element.name,
      description: element.description,
      usage: element.usage,
      preview: element.preview,
      category: element.category
    }));
  }

  // Compliance checking methods
  private checkColorCompliance(request: CreativeRequest): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];
    
    // Check if all colors used are in brand guidelines
    const brandColors = request.brandGuidelines.colors.map(c => c.hex);
    
    // This would be implemented based on actual design analysis
    // For now, return empty array as placeholder
    
    return violations;
  }

  private checkFontCompliance(request: CreativeRequest): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];
    
    // Check if fonts used are in brand guidelines
    const brandFonts = request.brandGuidelines.fonts.map(f => f.name);
    
    return violations;
  }

  private checkLogoCompliance(request: CreativeRequest): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];
    
    // Check logo usage according to guidelines
    if (request.brandGuidelines.logo.usage === 'always') {
      // Verify logo is present in design
    }
    
    return violations;
  }

  private checkToneCompliance(request: CreativeRequest): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];
    
    // Check if design tone matches brand tone
    const brandTone = request.brandGuidelines.tone;
    
    return violations;
  }

  private generateComplianceSuggestions(violations: ComplianceViolation[]): string[] {
    return violations.map(violation => violation.suggestion);
  }

  // Helper methods
  private generateDesignDescription(request: CreativeRequest, variant: number): string {
    const descriptions = [
      `Clean and modern ${request.contentType} design with strong visual hierarchy`,
      `Bold and engaging ${request.contentType} with vibrant colors and dynamic layout`,
      `Minimalist ${request.contentType} design focusing on content clarity`
    ];
    return descriptions[variant] || descriptions[0];
  }

  private calculateCompliance(elements: DesignElement[], guidelines: BrandGuidelines): number {
    // Calculate compliance score based on brand guidelines adherence
    let score = 100;
    
    // Check color usage
    const usedColors = elements
      .filter(e => e.style.color)
      .map(e => e.style.color);
    
    const brandColors = guidelines.colors.map(c => c.hex);
    const nonBrandColors = usedColors.filter(color => !brandColors.includes(color));
    score -= nonBrandColors.length * 10;
    
    return Math.max(0, score);
  }

  private calculateAppeal(elements: DesignElement[], audience: AudienceProfile): number {
    // Calculate visual appeal based on audience preferences
    let score = 50; // Base score
    
    // Add points for elements that match audience preferences
    if (audience.preferences.includes('modern')) score += 20;
    if (audience.preferences.includes('colorful')) score += 15;
    if (audience.preferences.includes('minimal')) score += 10;
    
    return Math.min(100, score);
  }

  private calculateUniqueness(elements: DesignElement[]): number {
    // Calculate uniqueness based on element variety and creativity
    const uniqueElements = new Set(elements.map(e => e.type));
    return Math.min(100, uniqueElements.size * 20);
  }

  private estimateEngagement(elements: DesignElement[], audience: AudienceProfile): number {
    // Estimate engagement based on design elements and audience
    let engagement = 1000; // Base engagement
    
    // Adjust based on audience size and preferences
    if (audience.demographics.includes('18-24')) engagement *= 1.5;
    if (audience.interests.includes('design')) engagement *= 1.2;
    
    return Math.round(engagement);
  }

  private calculateLogoPosition(placement: string): Position {
    const positions = {
      'top-left': { x: 20, y: 20 },
      'top-right': { x: 350, y: 20 },
      'bottom-left': { x: 20, y: 250 },
      'bottom-right': { x: 350, y: 250 },
      'center': { x: 200, y: 150 }
    };
    return positions[placement] || positions['top-left'];
  }

  private calculateLogoSize(size: string): Size {
    const sizes = {
      'small': { width: 50, height: 50 },
      'medium': { width: 100, height: 100 },
      'large': { width: 150, height: 150 }
    };
    return sizes[size] || sizes['medium'];
  }

  private async handleNotification(payload: any): Promise<AgentMessage | null> {
    console.log('Creative Director received notification:', payload);
    return null;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
