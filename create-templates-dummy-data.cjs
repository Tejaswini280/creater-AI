const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const templateData = [
  // Video Script Templates
  {
    title: "YouTube Tutorial Script Template",
    description: "A comprehensive template for creating engaging tutorial videos with clear structure and call-to-actions.",
    category: "video",
    type: "Script Template",
    content: `# [TUTORIAL TITLE]

## Hook (0-15 seconds)
"Have you ever struggled with [PROBLEM]? In the next [X] minutes, I'll show you exactly how to [SOLUTION] step by step."

## Introduction (15-30 seconds)
"Hey everyone, welcome back to [CHANNEL NAME]! I'm [YOUR NAME], and today we're diving into [TOPIC]. By the end of this video, you'll be able to [SPECIFIC OUTCOME]."

## Main Content Structure:

### Step 1: [STEP NAME]
- Explain the concept
- Show the process
- Common mistakes to avoid

### Step 2: [STEP NAME]
- Build on previous step
- Provide examples
- Tips for success

### Step 3: [STEP NAME]
- Advanced techniques
- Troubleshooting
- Best practices

## Conclusion (Last 30 seconds)
"And that's how you [MAIN TOPIC]! Which step did you find most helpful? Let me know in the comments below. Don't forget to like this video if it helped you, and subscribe for more [CONTENT TYPE] tutorials!"

## Call to Action
"Check out my previous video on [RELATED TOPIC] right here, and I'll see you in the next one!"`,
    thumbnailUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop",
    rating: 4.8,
    downloads: 1247,
    isActive: true,
    isFeatured: true,
    tags: ["youtube", "tutorial", "script", "education", "engagement"]
  },
  {
    title: "Product Review Script Template",
    description: "Perfect template for honest product reviews that build trust and drive conversions.",
    category: "video",
    type: "Script Template",
    content: `# [PRODUCT NAME] Review - Is It Worth It?

## Hook (0-10 seconds)
"I've been using [PRODUCT] for [TIME PERIOD], and the results might surprise you."

## Introduction (10-30 seconds)
"What's up everyone! Today I'm reviewing [PRODUCT NAME] - the [PRODUCT CATEGORY] that's been all over [PLATFORM/MEDIA]. I'll give you my honest thoughts, show you the pros and cons, and help you decide if it's worth your money."

## Product Overview (30-60 seconds)
- What is it?
- Key features
- Price point
- Target audience

## Unboxing/First Impressions (60-120 seconds)
- Packaging quality
- Initial setup
- First use experience

## Detailed Testing (2-4 minutes)
### Performance
- How well does it work?
- Speed/efficiency
- Reliability

### Design & Build Quality
- Materials used
- Aesthetics
- Durability

### Value for Money
- Compared to competitors
- Cost vs. benefits
- Who should buy it?

## Pros & Cons (30 seconds)
### Pros:
- [List 3-4 main benefits]

### Cons:
- [List 2-3 main drawbacks]

## Final Verdict (30 seconds)
"Overall, I'd rate [PRODUCT] a [X]/10. It's perfect for [TARGET USER] but might not be ideal for [OTHER USER TYPE]."

## Call to Action
"What do you think? Have you tried [PRODUCT]? Let me know your experience in the comments! And if this review helped you, smash that like button and subscribe for more honest reviews!"`,
    thumbnailUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
    rating: 4.6,
    downloads: 892,
    isActive: true,
    isFeatured: false,
    tags: ["review", "product", "honest", "comparison", "buying-guide"]
  },
  {
    title: "Viral TikTok Hook Template",
    description: "Proven hooks that grab attention in the first 3 seconds and keep viewers watching.",
    category: "social",
    type: "Script Template",
    content: `# Viral TikTok Hook Templates

## Pattern 1: The Contradiction
"Everyone thinks [COMMON BELIEF], but here's what actually happens..."

## Pattern 2: The Secret
"I wasn't supposed to tell you this, but..."

## Pattern 3: The Mistake
"I made a $[X] mistake so you don't have to..."

## Pattern 4: The Transformation
"This is me [TIME] ago vs. now - here's what changed..."

## Pattern 5: The Question
"Why do [SPECIFIC GROUP] always [SPECIFIC ACTION]?"

## Pattern 6: The List
"3 things I wish I knew before [EXPERIENCE]..."

## Pattern 7: The Controversy
"Unpopular opinion: [CONTROVERSIAL STATEMENT]"

## Pattern 8: The Story
"The day I [DRAMATIC EVENT] changed everything..."

## Pattern 9: The Comparison
"Rich people do this, poor people do that..."

## Pattern 10: The Warning
"Stop doing [COMMON ACTION] - here's why..."

## Usage Tips:
- Use within first 3 seconds
- Match your facial expression to the hook
- Follow up with valuable content
- Test multiple hooks for same content
- Analyze which hooks perform best for your niche`,
    thumbnailUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop",
    rating: 4.9,
    downloads: 2156,
    isActive: true,
    isFeatured: true,
    tags: ["tiktok", "hooks", "viral", "engagement", "social-media"]
  },

  // Thumbnail Templates
  {
    title: "High-CTR YouTube Thumbnail Template",
    description: "Proven thumbnail design that increases click-through rates with bold text and contrasting colors.",
    category: "thumbnail",
    type: "Thumbnail Template",
    content: `# High-CTR YouTube Thumbnail Design Guide

## Layout Structure:
- 1280x720 pixels (16:9 aspect ratio)
- Safe zone: Keep important elements within 1184x666 pixels

## Color Scheme:
- Primary: Bright, contrasting colors (Red, Orange, Yellow)
- Secondary: Complementary colors for balance
- Background: High contrast with subject

## Text Elements:
- Font: Bold, sans-serif (Arial Black, Impact, or custom)
- Size: Large enough to read on mobile (minimum 30px)
- Maximum: 6-8 words
- Position: Top or bottom third of image

## Subject Placement:
- Face: Large, expressive, looking at camera
- Position: Rule of thirds
- Size: Takes up 40-60% of thumbnail

## Visual Elements:
- Arrows pointing to key elements
- Bright borders or outlines
- Emoji reactions (😱, 🤯, 😍)
- Numbers or statistics
- Before/after comparisons

## Best Practices:
- Test multiple versions
- Ensure mobile readability
- Match video content
- Use consistent branding
- Avoid clickbait that doesn't deliver

## Tools Recommended:
- Canva Pro
- Photoshop
- Figma
- Thumbnail Blaster`,
    thumbnailUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop",
    rating: 4.7,
    downloads: 1543,
    isActive: true,
    isFeatured: true,
    tags: ["thumbnail", "youtube", "ctr", "design", "clickthrough"]
  },
  {
    title: "Instagram Story Template Pack",
    description: "Collection of engaging Instagram story templates for different content types and occasions.",
    category: "social",
    type: "Thumbnail Template",
    content: `# Instagram Story Template Collection

## Template 1: Question Sticker
- Background: Gradient or solid color
- Text: "Ask me anything about [TOPIC]"
- Sticker: Question sticker
- CTA: "I'll answer in my next story!"

## Template 2: Poll Engagement
- Background: Your brand colors
- Text: "Which do you prefer?"
- Options: A vs B with emojis
- Sticker: Poll sticker

## Template 3: Behind the Scenes
- Background: Transparent or subtle
- Text: "Behind the scenes of [PROJECT]"
- Element: Arrow pointing to action
- Style: Casual, authentic feel

## Template 4: Tutorial Steps
- Background: Clean, minimal
- Text: "Step [X] of [Y]"
- Content: Clear instruction
- Progress: Visual progress bar

## Template 5: Quote/Tip
- Background: Inspirational image
- Text: Motivational quote or tip
- Font: Script or elegant sans-serif
- Attribution: Your handle

## Template 6: Product Showcase
- Background: Lifestyle setting
- Text: Product name + key benefit
- Element: Price or discount badge
- CTA: "Swipe up to shop" or "Link in bio"

## Template 7: User-Generated Content
- Background: UGC photo/video
- Text: "Thank you @username!"
- Element: Repost indicator
- Tag: Original creator

## Dimensions: 1080x1920 pixels (9:16)
## Safe Zone: Keep text within 1080x1680 pixels
## File Format: JPG or PNG for images, MP4 for videos`,
    thumbnailUrl: "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=400&h=300&fit=crop",
    rating: 4.5,
    downloads: 987,
    isActive: true,
    isFeatured: false,
    tags: ["instagram", "stories", "social-media", "engagement", "templates"]
  },

  // Branding Templates
  {
    title: "Personal Brand Style Guide",
    description: "Complete branding template for content creators including colors, fonts, and visual guidelines.",
    category: "branding",
    type: "Brand Template",
    content: `# Personal Brand Style Guide Template

## Brand Identity
### Mission Statement:
"I help [TARGET AUDIENCE] achieve [DESIRED OUTCOME] through [YOUR METHOD/EXPERTISE]."

### Brand Values:
- [Value 1]: Authenticity
- [Value 2]: Education
- [Value 3]: Community
- [Value 4]: Innovation
- [Value 5]: Results

### Brand Personality:
- [Trait 1]: Approachable
- [Trait 2]: Expert
- [Trait 3]: Inspiring
- [Trait 4]: Reliable

## Visual Identity

### Color Palette:
- Primary Color: #[HEX CODE] (Main brand color)
- Secondary Color: #[HEX CODE] (Accent color)
- Neutral Color: #[HEX CODE] (Text/backgrounds)
- Success Color: #[HEX CODE] (Positive actions)
- Warning Color: #[HEX CODE] (Alerts/cautions)

### Typography:
- Primary Font: [Font Name] (Headings)
- Secondary Font: [Font Name] (Body text)
- Accent Font: [Font Name] (Special elements)

### Logo Usage:
- Primary logo for main applications
- Secondary logo for small spaces
- Icon version for social media
- Minimum size: 24px height
- Clear space: Logo height on all sides

## Content Guidelines

### Photography Style:
- Lighting: Natural, bright
- Colors: Consistent with brand palette
- Composition: Clean, professional
- Mood: [Your brand personality]

### Voice & Tone:
- Voice: [Consistent personality traits]
- Tone: Adapts to context (educational, motivational, casual)
- Language: [Formal/informal, technical/simple]

### Content Pillars:
1. [Pillar 1]: Educational content (40%)
2. [Pillar 2]: Behind-the-scenes (20%)
3. [Pillar 3]: Community engagement (20%)
4. [Pillar 4]: Personal stories (20%)

## Application Examples:
- Social media posts
- YouTube thumbnails
- Website design
- Email templates
- Business cards
- Merchandise`,
    thumbnailUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop",
    rating: 4.8,
    downloads: 756,
    isActive: true,
    isFeatured: true,
    tags: ["branding", "style-guide", "identity", "colors", "fonts"]
  },

  // Email Templates
  {
    title: "Newsletter Welcome Series",
    description: "5-email welcome sequence that builds relationships and drives engagement with new subscribers.",
    category: "email",
    type: "Email Template",
    content: `# Newsletter Welcome Series (5 Emails)

## Email 1: Welcome & Delivery (Send immediately)
**Subject:** Welcome to [NEWSLETTER NAME]! Here's what's next...

Hi [FIRST NAME],

Welcome to the [NEWSLETTER NAME] family! 🎉

I'm [YOUR NAME], and I'm thrilled you've joined [NUMBER] other [TARGET AUDIENCE] who are [MAIN BENEFIT].

Here's what you can expect:
✅ [Benefit 1]
✅ [Benefit 2]  
✅ [Benefit 3]

**Your first exclusive resource is here:** [LEAD MAGNET LINK]

Talk soon,
[YOUR NAME]

P.S. Hit reply and tell me - what's your biggest challenge with [TOPIC]?

---

## Email 2: Your Story (Send 2 days later)
**Subject:** Why I started [NEWSLETTER/BUSINESS NAME]

Hi [FIRST NAME],

I want to share something personal with you...

[SHARE YOUR ORIGIN STORY - Why you started, what problem you faced, how you overcame it]

This is exactly why I created [NEWSLETTER NAME] - to help people like you [MAIN BENEFIT].

[CALL TO ACTION - Could be to reply, check out content, etc.]

Best,
[YOUR NAME]

---

## Email 3: Social Proof (Send 4 days later)
**Subject:** "This changed everything for me..." - [SUBSCRIBER NAME]

Hi [FIRST NAME],

I love hearing success stories from subscribers like you.

Here's what [SUBSCRIBER NAME] shared with me:

"[TESTIMONIAL/SUCCESS STORY]"

This is exactly the kind of transformation I love seeing!

[RELATED CONTENT OR RESOURCE]

Your success story could be next 😊

[YOUR NAME]

---

## Email 4: Best Resources (Send 7 days later)
**Subject:** My top 3 resources for [TOPIC]

Hi [FIRST NAME],

You've been subscribed for a week now, so I wanted to share my absolute favorite resources for [TOPIC]:

**Resource 1:** [NAME]
Why it's great: [BRIEF DESCRIPTION]
Link: [URL]

**Resource 2:** [NAME]  
Why it's great: [BRIEF DESCRIPTION]
Link: [URL]

**Resource 3:** [NAME]
Why it's great: [BRIEF DESCRIPTION]
Link: [URL]

Which one will you try first? Hit reply and let me know!

[YOUR NAME]

---

## Email 5: What's Next (Send 10 days later)
**Subject:** What would you like to learn next?

Hi [FIRST NAME],

It's been amazing having you as part of the [NEWSLETTER NAME] community!

I'm curious - what would you like me to cover next? 

Reply and let me know:
• What's your biggest challenge with [TOPIC]?
• What topics interest you most?
• Any specific questions you'd like answered?

I read every reply and use your feedback to create better content.

Also, don't forget to:
📱 Follow me on [SOCIAL PLATFORM]: [LINK]
💬 Join our community: [COMMUNITY LINK]
⭐ Check out my most popular content: [LINK]

Thanks for being awesome!

[YOUR NAME]

P.S. Keep an eye out for my weekly newsletter every [DAY] - it's packed with [VALUE PROPOSITION]!`,
    thumbnailUrl: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=300&fit=crop",
    rating: 4.6,
    downloads: 634,
    isActive: true,
    isFeatured: false,
    tags: ["email", "newsletter", "welcome-series", "automation", "engagement"]
  },

  // Social Media Templates
  {
    title: "LinkedIn Thought Leadership Posts",
    description: "Professional LinkedIn post templates that establish authority and drive engagement in your industry.",
    category: "social",
    type: "Social Template",
    content: `# LinkedIn Thought Leadership Post Templates

## Template 1: Industry Insight
"After [X years] in [INDUSTRY], here's what I've learned about [TOPIC]:

🔹 [Insight 1 with brief explanation]
🔹 [Insight 2 with brief explanation]  
🔹 [Insight 3 with brief explanation]

The biggest mistake I see professionals make is [COMMON MISTAKE].

Instead, try [SOLUTION/ALTERNATIVE APPROACH].

What's been your experience with [TOPIC]? Share your thoughts below. 👇

#[RelevantHashtag] #[IndustryHashtag] #[ProfessionalDevelopment]"

---

## Template 2: Contrarian Take
"Unpopular opinion: [CONTRARIAN STATEMENT]

Here's why I believe this:

[Reason 1 with supporting evidence]
[Reason 2 with supporting evidence]
[Reason 3 with supporting evidence]

I know this goes against conventional wisdom, but [SUPPORTING ARGUMENT].

What do you think? Am I completely wrong, or is there merit to this perspective?

Let's discuss in the comments. 💬

#[IndustryHashtag] #[ThoughtLeadership]"

---

## Template 3: Personal Story/Lesson
"[X years] ago, I made a mistake that cost me [CONSEQUENCE].

Here's what happened:

[Brief story setup]

The mistake: [WHAT YOU DID WRONG]

The result: [NEGATIVE OUTCOME]

What I learned: [KEY LESSON]

Now I always [NEW APPROACH/BEHAVIOR].

If you're facing [SIMILAR SITUATION], here's my advice:
• [Tip 1]
• [Tip 2]
• [Tip 3]

Have you learned any expensive lessons in your career? Share below - we can all learn from each other.

#[CareerAdvice] #[LessonsLearned] #[ProfessionalGrowth]"

---

## Template 4: Industry Trend Analysis
"[TREND/CHANGE] is reshaping [INDUSTRY]. Here's what it means for professionals:

📈 What's happening:
[Brief explanation of the trend]

🎯 Why it matters:
[Impact on industry/professionals]

🔮 What's next:
[Predictions/implications]

💡 How to prepare:
• [Action item 1]
• [Action item 2]
• [Action item 3]

Are you seeing this trend in your organization? How are you adapting?

#[IndustryTrend] #[FutureOfWork] #[Innovation]"

---

## Template 5: Question/Discussion Starter
"Quick question for my network:

[THOUGHT-PROVOKING QUESTION RELATED TO YOUR INDUSTRY]

I'm curious because [CONTEXT/WHY YOU'RE ASKING].

In my experience, [YOUR PERSPECTIVE/EXPERIENCE].

But I'd love to hear different viewpoints.

What's your take? Comment below and let's get a discussion going! 👇

#[IndustryHashtag] #[Discussion] #[NetworkingQuestion]"

---

## Best Practices:
- Post during business hours (9 AM - 5 PM)
- Use 3-5 relevant hashtags
- Engage with comments within first hour
- Share valuable insights, not just opinions
- Include a clear call-to-action
- Use line breaks for readability
- Tag relevant people when appropriate`,
    thumbnailUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop",
    rating: 4.7,
    downloads: 1123,
    isActive: true,
    isFeatured: true,
    tags: ["linkedin", "thought-leadership", "professional", "networking", "business"]
  },

  // Content Planning Templates
  {
    title: "30-Day Content Calendar Template",
    description: "Complete monthly content planning template with post ideas, scheduling, and performance tracking.",
    category: "planning",
    type: "Planning Template",
    content: `# 30-Day Content Calendar Template

## Content Pillars (Plan your mix):
- Educational (40%): How-to, tips, tutorials
- Entertainment (20%): Behind-the-scenes, humor, trends
- Inspirational (20%): Quotes, success stories, motivation
- Promotional (20%): Products, services, announcements

## Weekly Themes:
- Week 1: [THEME] (e.g., "Getting Started")
- Week 2: [THEME] (e.g., "Advanced Techniques") 
- Week 3: [THEME] (e.g., "Common Mistakes")
- Week 4: [THEME] (e.g., "Success Stories")

## Daily Content Schedule:

### WEEK 1
**Monday - Motivation Monday**
- Content Type: Inspirational quote/story
- Platform: Instagram + LinkedIn
- Time: 9:00 AM
- Hashtags: #MotivationMonday #[YourNiche]

**Tuesday - Tutorial Tuesday**
- Content Type: Educational post/video
- Platform: YouTube + TikTok
- Time: 2:00 PM
- Hashtags: #TutorialTuesday #HowTo

**Wednesday - Wisdom Wednesday**
- Content Type: Industry insights/tips
- Platform: LinkedIn + Twitter
- Time: 11:00 AM
- Hashtags: #WisdomWednesday #Tips

**Thursday - Throwback Thursday**
- Content Type: Behind-the-scenes/journey
- Platform: Instagram Stories + Facebook
- Time: 4:00 PM
- Hashtags: #ThrowbackThursday #BTS

**Friday - Feature Friday**
- Content Type: Product/service highlight
- Platform: All platforms
- Time: 1:00 PM
- Hashtags: #FeatureFriday #[ProductName]

**Saturday - Social Saturday**
- Content Type: Community engagement
- Platform: Instagram + TikTok
- Time: 10:00 AM
- Hashtags: #SocialSaturday #Community

**Sunday - Sunday Reflection**
- Content Type: Weekly recap/planning
- Platform: LinkedIn + Email newsletter
- Time: 6:00 PM
- Hashtags: #SundayReflection #WeeklyWrap

## Content Ideas Bank:

### Educational Content:
1. "5 mistakes beginners make with [TOPIC]"
2. "Step-by-step guide to [PROCESS]"
3. "Tools I use for [TASK]"
4. "Before and after: [TRANSFORMATION]"
5. "Myth vs. Reality: [COMMON MISCONCEPTION]"

### Entertainment Content:
1. "Day in my life as a [PROFESSION]"
2. "Reacting to [TRENDING TOPIC]"
3. "Trying [NEW TREND/CHALLENGE]"
4. "Behind the scenes of [PROJECT]"
5. "Q&A with my audience"

### Inspirational Content:
1. "How I overcame [CHALLENGE]"
2. "Client success story spotlight"
3. "Motivational quote + personal story"
4. "Lessons learned from [EXPERIENCE]"
5. "Why I started [BUSINESS/JOURNEY]"

### Promotional Content:
1. "New product/service announcement"
2. "Limited-time offer/discount"
3. "Testimonial/review showcase"
4. "Free resource/lead magnet"
5. "Event/webinar promotion"

## Performance Tracking:
- Engagement rate by platform
- Best performing content types
- Optimal posting times
- Hashtag performance
- Follower growth
- Website traffic from social

## Monthly Review Questions:
1. Which content performed best?
2. What topics resonated most with audience?
3. Which platforms drove most engagement?
4. What should I do more/less of next month?
5. How did I progress toward my goals?

## Tools for Implementation:
- Scheduling: Buffer, Hootsuite, Later
- Design: Canva, Adobe Creative Suite
- Analytics: Native platform insights
- Planning: Notion, Trello, Google Sheets`,
    thumbnailUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop",
    rating: 4.9,
    downloads: 1876,
    isActive: true,
    isFeatured: true,
    tags: ["content-calendar", "planning", "social-media", "strategy", "organization"]
  }
];

async function createTemplatesData() {
  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    
    console.log('🗑️ Clearing existing templates...');
    await client.query('DELETE FROM templates');
    
    console.log('📝 Creating template data...');
    
    for (const template of templateData) {
      const query = `
        INSERT INTO templates (
          title, description, category, type, content, thumbnail_url, 
          rating, downloads, is_active, is_featured, tags, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;
      
      const values = [
        template.title,
        template.description,
        template.category,
        template.type,
        template.content,
        template.thumbnailUrl,
        template.rating,
        template.downloads,
        template.isActive,
        template.isFeatured,
        template.tags,
        JSON.stringify({ 
          difficulty: 'beginner',
          estimatedTime: '15-30 minutes',
          lastUpdated: new Date().toISOString()
        })
      ];
      
      await client.query(query, values);
      console.log(`✅ Created template: ${template.title}`);
    }
    
    console.log('🎉 Successfully created all template data!');
    
    // Verify the data
    const result = await client.query('SELECT COUNT(*) as count FROM templates');
    console.log(`📊 Total templates in database: ${result.rows[0].count}`);
    
    // Show templates by category
    const categoryResult = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM templates 
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    console.log('\n📋 Templates by category:');
    categoryResult.rows.forEach(row => {
      console.log(`  ${row.category}: ${row.count} templates`);
    });
    
  } catch (error) {
    console.error('❌ Error creating template data:', error);
  } finally {
    await client.end();
  }
}

createTemplatesData();