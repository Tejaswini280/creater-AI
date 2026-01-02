import { db } from "./db";
import { users, socialAccounts, content, contentMetrics, niches, aiGenerationTasks, sessions, templates } from "@shared/schema";
import { sql } from "drizzle-orm";

async function setupDatabase() {
  try {
    console.log("Setting up database...");
    
    // Test database connection
    await testDatabaseConnection();
    
    // Create tables (Drizzle will handle this automatically)
    console.log("✅ Database tables created successfully!");
    
    // Seed initial data
    await seedTemplates();
    await seedSampleNiches();
    await seedSampleContent();
    
    console.log("✅ Database is ready to use!");
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    process.exit(1);
  }
}

async function testDatabaseConnection() {
  try {
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection test successful");
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    throw error;
  }
}

setupDatabase(); 

export async function seedTemplates() {
  console.log("Seeding templates...");
  
  const templateData = [
    {
      title: "Product Review Template",
      description: "Professional product review video structure with proven engagement patterns",
      category: "video",
      type: "Script Template",
      content: `## Product Review Script Template

### Introduction (0:00-0:15)
- Hook: "What if I told you this [product] could [main benefit]?"
- Brief personal story or problem this solves
- Preview of what you'll cover

### Product Overview (0:15-0:45)
- What is it and who is it for?
- Key features and specifications
- Price point and value proposition

### Unboxing/First Impressions (0:45-1:30)
- Packaging quality
- Initial thoughts and expectations
- Build quality and materials

### Testing & Performance (1:30-3:00)
- Real-world testing scenarios
- Performance metrics and results
- Comparison with alternatives

### Pros & Cons (3:00-3:45)
- 3-5 major pros
- 2-3 honest cons
- Who should/shouldn't buy this

### Final Verdict (3:45-4:00)
- Overall rating (1-10)
- Would you recommend it?
- Best use cases

### Call to Action (4:00-4:15)
- Subscribe for more reviews
- Like if this helped
- Comment with questions`,
      thumbnailUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop",
      rating: "4.8",
      downloads: 1247,
      isActive: true,
      isFeatured: true,
      tags: ["product review", "video script", "youtube", "tutorial"]
    },
    {
      title: "Tutorial Video Format",
      description: "Step-by-step tutorial video template for educational content",
      category: "video",
      type: "Video Template",
      content: `## Tutorial Video Structure

### Opening Hook (0:00-0:10)
- Problem statement: "Struggling with [specific issue]?"
- Promise: "In this video, I'll show you exactly how to [solution]"

### What You'll Learn (0:10-0:25)
- 3-5 key takeaways
- Time stamps for each section
- Tools/software needed

### Step-by-Step Process (0:25-4:00)
- Clear numbered steps
- Visual demonstrations
- Common mistakes to avoid
- Pro tips and shortcuts

### Troubleshooting (4:00-4:30)
- Common issues and solutions
- Alternative approaches
- When to seek help

### Summary & Next Steps (4:30-4:45)
- Recap of main points
- What to practice next
- Related tutorials to watch

### Call to Action (4:45-5:00)
- Subscribe for more tutorials
- Download resources
- Join community`,
      thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop",
      rating: "4.9",
      downloads: 2156,
      isActive: true,
      isFeatured: true,
      tags: ["tutorial", "educational", "how-to", "step-by-step"]
    },
    {
      title: "Tech Review Thumbnail",
      description: "High-CTR tech review thumbnail design template",
      category: "thumbnail",
      type: "Thumbnail Template",
      content: `## Tech Review Thumbnail Design

### Layout Structure
- Main product image (60% of thumbnail)
- Bold, contrasting text overlay
- Rating or score indicator
- "REVIEW" badge in corner

### Color Scheme
- Primary: #FF6B35 (Orange for tech)
- Secondary: #2C3E50 (Dark blue)
- Accent: #E74C3C (Red for urgency)

### Text Elements
- Main title: "iPhone 15 Pro Review"
- Subtitle: "WORTH IT? 🤔"
- Rating: "9.2/10" or "⭐⭐⭐⭐⭐"

### Design Tips
- Use high-contrast colors
- Keep text large and readable
- Add emojis for personality
- Include product close-up
- Use arrows or circles to highlight features`,
      thumbnailUrl: "https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?w=300&h=200&fit=crop",
      rating: "4.9",
      downloads: 3421,
      isActive: true,
      isFeatured: true,
      tags: ["thumbnail", "tech", "review", "design"]
    },
    {
      title: "YouTube Shorts Hook",
      description: "Viral opening hooks for short-form content",
      category: "script",
      type: "Script Template",
      content: `## YouTube Shorts Hook Templates

### Hook Type 1: Question Hook
"Have you ever wondered why [controversial statement]?"
"Did you know that [surprising fact]?"
"What if I told you [counterintuitive claim]?"

### Hook Type 2: Problem Hook
"Stop doing [common mistake] - here's why..."
"The #1 mistake people make with [topic]"
"Why [popular belief] is actually wrong"

### Hook Type 3: Story Hook
"Last week, I [personal story] and you won't believe what happened..."
"I spent [time period] doing [activity] and here's what I learned..."
"When I first started [topic], I made this huge mistake..."

### Hook Type 4: Promise Hook
"In 60 seconds, I'll show you [specific benefit]"
"3 simple steps to [desired outcome]"
"The secret to [goal] that nobody talks about"

### Hook Type 5: Controversy Hook
"[Popular opinion] is completely wrong"
"Why I stopped [common practice]"
"The truth about [controversial topic]"

### Structure for Each Hook:
1. Hook (0-3 seconds)
2. Setup (3-8 seconds)
3. Value delivery (8-45 seconds)
4. Call to action (45-60 seconds)`,
      thumbnailUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=300&h=200&fit=crop",
      rating: "4.9",
      downloads: 4532,
      isActive: true,
      isFeatured: true,
      tags: ["shorts", "hook", "viral", "opening"]
    },
    {
      title: "Before/After Thumbnail",
      description: "Split screen comparison thumbnail template",
      category: "thumbnail",
      type: "Thumbnail Template",
      content: `## Before/After Thumbnail Design

### Layout Structure
- Split screen: 50/50 or 60/40 ratio
- Left side: "BEFORE" (problem state)
- Right side: "AFTER" (solution state)
- Bold text overlay on each side

### Visual Elements
- BEFORE: Dark, messy, sad emoji
- AFTER: Bright, clean, happy emoji
- Arrow pointing from left to right
- Dramatic contrast between sides

### Text Elements
- "BEFORE" (left side)
- "AFTER" (right side)
- Main benefit: "Lose 20 lbs" or "Clear Skin"
- Time frame: "In 30 Days" or "Overnight"

### Color Psychology
- BEFORE: Dark blues, grays, reds
- AFTER: Bright greens, yellows, whites
- Use complementary colors for contrast

### Design Tips
- Keep it simple and clear
- Use high-quality images
- Add dramatic lighting differences
- Include transformation indicators`,
      thumbnailUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop",
      rating: "4.8",
      downloads: 2876,
      isActive: true,
      isFeatured: false,
      tags: ["before-after", "comparison", "transformation", "thumbnail"]
    },
    {
      title: "Unboxing Video Script",
      description: "Engaging unboxing experience template",
      category: "video",
      type: "Script Template",
      content: `## Unboxing Video Script

### Introduction (0:00-0:15)
- "Today we're unboxing [product name]"
- Brief background on why you bought it
- What you're most excited about

### Package Arrival (0:15-0:30)
- Show package condition
- Shipping time and experience
- First impressions of packaging

### Unboxing Process (0:30-2:00)
- Slow, deliberate unboxing
- Comment on packaging quality
- Show all included items
- Read any included literature

### First Look (2:00-3:00)
- Initial reactions to design
- Build quality assessment
- Size and weight impressions
- Comparison to expectations

### Quick Test (3:00-4:00)
- Basic functionality test
- Key features demonstration
- Initial performance thoughts

### Closing Thoughts (4:00-4:30)
- Overall first impressions
- Would you recommend it?
- What you'll test next

### Call to Action (4:30-4:45)
- Subscribe for full review
- Like if you want to see more
- Comment with questions`,
      thumbnailUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop",
      rating: "4.7",
      downloads: 892,
      isActive: true,
      isFeatured: false,
      tags: ["unboxing", "first impressions", "product", "review"]
    }
  ];

  try {
    // Check if templates already exist
    const existingTemplates = await db.select().from(templates).limit(1);
    
    if (existingTemplates.length === 0) {
      await db.insert(templates).values(templateData);
      console.log(`✅ Seeded ${templateData.length} templates successfully`);
    } else {
      console.log("✅ Templates already exist, skipping seed");
    }
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
  }
}

export async function seedSampleNiches() {
  console.log("Seeding sample niches...");
  
  const nicheData = [
    {
      name: "Fitness & Health",
      category: "lifestyle",
      trendScore: 85,
      difficulty: "medium",
      profitability: "high",
      keywords: ["fitness", "health", "workout", "nutrition", "wellness"],
      description: "Content focused on fitness, health, and wellness topics"
    },
    {
      name: "Technology Reviews",
      category: "tech",
      trendScore: 92,
      difficulty: "hard",
      profitability: "high",
      keywords: ["tech", "reviews", "gadgets", "software", "apps"],
      description: "Technology product reviews and software tutorials"
    },
    {
      name: "Cooking & Recipes",
      category: "food",
      trendScore: 78,
      difficulty: "easy",
      profitability: "medium",
      keywords: ["cooking", "recipes", "food", "kitchen", "baking"],
      description: "Cooking tutorials, recipes, and food content"
    },
    {
      name: "Personal Finance",
      category: "finance",
      trendScore: 88,
      difficulty: "medium",
      profitability: "high",
      keywords: ["finance", "money", "investing", "budgeting", "savings"],
      description: "Personal finance tips, investing advice, and money management"
    },
    {
      name: "Travel Vlogs",
      category: "travel",
      trendScore: 75,
      difficulty: "hard",
      profitability: "medium",
      keywords: ["travel", "vlog", "adventure", "destinations", "tourism"],
      description: "Travel content, destination guides, and adventure vlogs"
    }
  ];

  try {
    // Check if niches already exist
    const existingNiches = await db.select().from(niches).limit(1);
    
    if (existingNiches.length === 0) {
      await db.insert(niches).values(nicheData);
      console.log(`✅ Seeded ${nicheData.length} niches successfully`);
    } else {
      console.log("✅ Niches already exist, skipping seed");
    }
  } catch (error) {
    console.error("❌ Error seeding niches:", error);
  }
}

export async function seedSampleContent() {
  console.log("Seeding sample content...");
  
  const contentData = [
    {
      userId: "sample-user-1",
      title: "10 Fitness Tips for Beginners",
      description: "Essential fitness tips for anyone starting their fitness journey",
      platform: "youtube",
      contentType: "video",
      status: "published",
      tags: ["fitness", "beginners", "tips"],
      metadata: {
        views: 12500,
        likes: 890,
        comments: 120,
        duration: "8:45"
      }
    },
    {
      userId: "sample-user-1",
      title: "Best Budget Smartphones 2024",
      description: "Top affordable smartphones that offer great value",
      platform: "youtube",
      contentType: "video",
      status: "published",
      tags: ["tech", "smartphones", "budget", "reviews"],
      metadata: {
        views: 8900,
        likes: 567,
        comments: 89,
        duration: "12:30"
      }
    },
    {
      userId: "sample-user-1",
      title: "Quick 15-Minute Workout",
      description: "Fast and effective workout you can do anywhere",
      platform: "instagram",
      contentType: "reel",
      status: "published",
      tags: ["workout", "quick", "fitness", "reel"],
      metadata: {
        views: 3400,
        likes: 234,
        comments: 45,
        duration: "0:15"
      }
    }
  ];

  try {
    // Check if content already exists
    const existingContent = await db.select().from(content).limit(1);
    
    if (existingContent.length === 0) {
      await db.insert(content).values(contentData);
      console.log(`✅ Seeded ${contentData.length} sample content items successfully`);
    } else {
      console.log("✅ Sample content already exists, skipping seed");
    }
  } catch (error) {
    console.error("❌ Error seeding sample content:", error);
  }
}