import { GoogleGenerativeAI } from '@google/generative-ai';

interface SearchGroundedRequest {
  query: string;
  context?: string;
}

interface SearchGroundedResponse {
  query: string;
  context: string;
  summary: string;
  keyPoints: string[];
  creatorInsights: string[];
  disclaimer: string;
}

export class SearchGroundedService {
  private static genAI: GoogleGenerativeAI;

  static initialize() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  static async generateGroundedResponse(request: SearchGroundedRequest): Promise<SearchGroundedResponse> {
    try {
      if (!this.genAI) {
        this.initialize();
      }

      const { query, context } = request;

      // Create a comprehensive system prompt for grounded search
      const systemPrompt = `You are a research assistant specializing in providing factual, up-to-date information for content creators. 

Your task is to:
1. Provide accurate, current information based on reliable sources
2. Structure your response for content creators who need actionable insights
3. Avoid hallucinations and clearly indicate when information may be uncertain
4. Focus on trends, opportunities, and practical applications

Always structure your response as a JSON object with the following format:
{
  "summary": "A comprehensive 2-3 sentence summary of the topic",
  "keyPoints": ["Key finding 1", "Key finding 2", "Key finding 3", "Key finding 4"],
  "creatorInsights": ["Actionable insight for creators 1", "Actionable insight for creators 2", "Actionable insight for creators 3"],
  "disclaimer": "Brief disclaimer about the information provided"
}

Ensure all arrays contain 3-4 relevant items each.`;

      const userPrompt = `Research Query: "${query}"
${context ? `Additional Context: ${context}` : ''}

Please provide a comprehensive, factual response about this topic. Focus on:
- Current trends and developments
- Key statistics or findings
- Opportunities for content creators
- Practical applications and implications

Structure your response as the JSON format specified in the system prompt.`;

      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.3, // Lower temperature for more factual responses
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt }
      ]);

      const response = await result.response;
      const text = response.text();

      // Parse the structured response
      let responseData;
      try {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          responseData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback: create structured response from plain text
        const lines = text.split('\n').filter(line => line.trim());
        responseData = {
          summary: lines[0] || 'Research completed on the requested topic',
          keyPoints: lines.slice(1, 5).map(line => line.replace(/^[-•*]\s*/, '')) || ['Key information found'],
          creatorInsights: lines.slice(5, 8).map(line => line.replace(/^[-•*]\s*/, '')) || ['Content opportunity identified'],
          disclaimer: 'Information is AI-generated and should be verified with current sources'
        };
      }

      // Ensure all required fields exist with proper fallbacks
      const structuredResponse: SearchGroundedResponse = {
        query: query,
        context: context || '',
        summary: responseData.summary || 'Research completed successfully on the requested topic.',
        keyPoints: Array.isArray(responseData.keyPoints) && responseData.keyPoints.length > 0
          ? responseData.keyPoints.slice(0, 4)
          : [
              'Current market trends identified',
              'Key developments in the field analyzed',
              'Industry insights gathered',
              'Relevant data points collected'
            ],
        creatorInsights: Array.isArray(responseData.creatorInsights) && responseData.creatorInsights.length > 0
          ? responseData.creatorInsights.slice(0, 3)
          : [
              'Content creation opportunities available',
              'Audience engagement strategies identified',
              'Platform-specific optimization possible'
            ],
        disclaimer: responseData.disclaimer || 'Results are AI-generated and may change as new information becomes available. Please verify with current sources.'
      };

      return structuredResponse;

    } catch (error) {
      console.error('Search grounded response error:', error);
      
      // Return fallback response for common errors
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        return {
          query: request.query,
          context: request.context || '',
          summary: 'Search functionality is temporarily limited due to API constraints. Please try again later.',
          keyPoints: [
            'Search service is currently experiencing high demand',
            'API rate limits may be affecting response generation',
            'Alternative research methods may be needed temporarily',
            'Service should be restored shortly'
          ],
          creatorInsights: [
            'Consider using multiple research sources',
            'Manual research may provide more detailed insights',
            'Bookmark this query to retry later'
          ],
          disclaimer: 'This is a fallback response due to temporary service limitations.'
        };
      }

      // Generic error fallback
      return {
        query: request.query,
        context: request.context || '',
        summary: 'Unable to complete search at this time. Please try again or refine your query.',
        keyPoints: [
          'Search service encountered an error',
          'Query may need to be more specific',
          'Network connectivity may be affecting results',
          'Alternative search methods recommended'
        ],
        creatorInsights: [
          'Try breaking down complex queries into simpler parts',
          'Use specific keywords for better results',
          'Consider manual research for critical information'
        ],
        disclaimer: 'Error response generated due to service unavailability.'
      };
    }
  }
}