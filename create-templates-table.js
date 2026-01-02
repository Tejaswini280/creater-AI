import { Client } from 'pg';

async function createTemplatesTable() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'creatornexus',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create templates table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS templates (
        id SERIAL PRIMARY KEY,
        title VARCHAR NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR NOT NULL,
        type VARCHAR NOT NULL,
        content TEXT,
        thumbnail_url VARCHAR,
        rating DECIMAL(3,2) DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        tags TEXT[],
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await client.query(createTableQuery);
    console.log('✅ Templates table created successfully');

    // Check if templates already exist
    const checkQuery = 'SELECT COUNT(*) FROM templates';
    const result = await client.query(checkQuery);
    const count = parseInt(result.rows[0].count);

    if (count === 0) {
      // Insert sample templates
      const insertQuery = `
        INSERT INTO templates (title, description, category, type, content, thumbnail_url, rating, downloads, is_active, is_featured, tags) VALUES
        ('Product Review Template', 'Professional product review video structure with proven engagement patterns', 'video', 'Script Template', $1, 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop', 4.8, 1247, true, true, ARRAY['product review', 'video script', 'youtube', 'tutorial']),
        ('Tutorial Video Format', 'Step-by-step tutorial video template for educational content', 'video', 'Video Template', $2, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop', 4.9, 2156, true, true, ARRAY['tutorial', 'educational', 'how-to', 'step-by-step']),
        ('Tech Review Thumbnail', 'High-CTR tech review thumbnail design template', 'thumbnail', 'Thumbnail Template', $3, 'https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?w=300&h=200&fit=crop', 4.9, 3421, true, true, ARRAY['thumbnail', 'tech', 'review', 'design']),
        ('YouTube Shorts Hook', 'Viral opening hooks for short-form content', 'script', 'Script Template', $4, 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=300&h=200&fit=crop', 4.9, 4532, true, true, ARRAY['shorts', 'hook', 'viral', 'opening']),
        ('Before/After Thumbnail', 'Split screen comparison thumbnail template', 'thumbnail', 'Thumbnail Template', $5, 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop', 4.8, 2876, true, false, ARRAY['before-after', 'comparison', 'transformation', 'thumbnail']),
        ('Unboxing Video Script', 'Engaging unboxing experience template', 'video', 'Script Template', $6, 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop', 4.7, 892, true, false, ARRAY['unboxing', 'first impressions', 'product', 'review'])
      `;

      const content1 = `## Product Review Script Template

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
- Comment with questions`;

      const content2 = `## Tutorial Video Structure

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
- Join community`;

      const content3 = `## Tech Review Thumbnail Design

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
- Use arrows or circles to highlight features`;

      const content4 = `## YouTube Shorts Hook Templates

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
4. Call to action (45-60 seconds)`;

      const content5 = `## Before/After Thumbnail Design

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
- Include transformation indicators`;

      const content6 = `## Unboxing Video Script

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
- Comment with questions`;

      await client.query(insertQuery, [content1, content2, content3, content4, content5, content6]);
      console.log('✅ Sample templates inserted successfully');
    } else {
      console.log('✅ Templates already exist, skipping insertion');
    }

    // Verify the data
    const verifyQuery = 'SELECT id, title, category, downloads FROM templates ORDER BY id';
    const verifyResult = await client.query(verifyQuery);
    console.log('📋 Current templates:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.id}. ${row.title} (${row.category}) - ${row.downloads} downloads`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createTemplatesTable(); 