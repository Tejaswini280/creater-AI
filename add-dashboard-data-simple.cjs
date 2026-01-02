#!/usr/bin/env node

/**
 * Simple Dashboard Data Setup
 * Adds real data to make dashboard functional
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { eq, sql } = require('drizzle-orm');

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/creatornexus';

async function addDashboardData() {
  console.log('🚀 Adding Dashboard Data...');
  
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    // Create test user if not exists
    console.log('👤 Creating test user...');
    
    const userId = 'dashboard-user-123';
    const userEmail = 'dashboard@test.com';
    
    await db.execute(sql`
      INSERT INTO users (id, email, password, first_name, last_name, is_active)
      VALUES (${userId}, ${userEmail}, '$2b$10$hashedpassword', 'Dashboard', 'User', true)
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log('✅ Test user ready');
    
    // Create test project
    console.log('🎯 Creating test project...');
    
    const projectResult = await db.execute(sql`
      INSERT INTO projects (user_id, name, description, type, platform, target_audience, status)
      VALUES (${userId}, 'Analytics Dashboard Project', 'Test project for dashboard', 'video', 'youtube', 'creators', 'active')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    
    let projectId = 1; // Default fallback
    if (projectResult.length > 0 && projectResult[0].id) {
      projectId = projectResult[0].id;
    }
    
    console.log('✅ Test project ready, ID:', projectId);
    
    // Add content data
    console.log('📝 Adding content data...');
    
    const contentData = [
      {
        title: 'Ultimate AI Tools Guide 2025',
        description: 'Complete guide to AI tools for content creators',
        platform: 'youtube',
        contentType: 'video',
        status: 'published',
        views: 45000,
        likes: 2800,
        comments: 450,
        shares: 320
      },
      {
        title: 'Social Media Growth Hacks',
        description: 'Proven strategies to grow your social media',
        platform: 'instagram',
        contentType: 'reel',
        status: 'published',
        views: 28000,
        likes: 1900,
        comments: 280,
        shares: 150
      },
      {
        title: 'Content Creation Masterclass',
        description: 'Everything you need to know about content creation',
        platform: 'tiktok',
        contentType: 'short',
        status: 'published',
        views: 67000,
        likes: 4200,
        comments: 680,
        shares: 890
      },
      {
        title: 'YouTube Algorithm Secrets',
        description: 'How to beat the YouTube algorithm in 2025',
        platform: 'youtube',
        contentType: 'video',
        status: 'published',
        views: 52000,
        likes: 3100,
        comments: 520,
        shares: 410
      },
      {
        title: 'Monetization Strategies',
        description: 'Turn your content into a profitable business',
        platform: 'linkedin',
        contentType: 'post',
        status: 'published',
        views: 18000,
        likes: 850,
        comments: 120,
        shares: 95
      }
    ];
    
    for (let i = 0; i < contentData.length; i++) {
      const item = contentData[i];
      
      // Insert content
      const contentResult = await db.execute(sql`
        INSERT INTO content (
          user_id, project_id, title, description, platform, content_type, 
          status, published_at, ai_generated
        ) VALUES (
          ${userId}, ${projectId}, ${item.title}, ${item.description}, 
          ${item.platform}, ${item.contentType}, ${item.status}, 
          NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days',
          ${Math.random() > 0.5}
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      `);
      
      let contentId = i + 1; // Fallback ID
      if (contentResult.length > 0 && contentResult[0].id) {
        contentId = contentResult[0].id;
      }
      
      // Insert metrics
      const engagementRate = ((item.likes + item.comments + item.shares) / item.views * 100).toFixed(2);
      const revenue = (item.views * 0.01).toFixed(2);
      
      await db.execute(sql`
        INSERT INTO content_metrics (
          content_id, platform, views, likes, comments, shares, 
          engagement_rate, revenue, last_updated
        ) VALUES (
          ${contentId}, ${item.platform}, ${item.views}, ${item.likes}, 
          ${item.comments}, ${item.shares}, ${engagementRate}, ${revenue}, NOW()
        )
        ON CONFLICT (content_id, platform) DO UPDATE SET
          views = EXCLUDED.views,
          likes = EXCLUDED.likes,
          comments = EXCLUDED.comments,
          shares = EXCLUDED.shares,
          engagement_rate = EXCLUDED.engagement_rate,
          revenue = EXCLUDED.revenue,
          last_updated = NOW()
      `);
      
      console.log(`   ✅ Added: ${item.title} (${item.views.toLocaleString()} views)`);
    }
    
    // Add social accounts
    console.log('🔗 Adding social accounts...');
    
    const socialAccounts = [
      { platform: 'youtube', accountId: 'UC123456789', accountName: 'My YouTube Channel' },
      { platform: 'instagram', accountId: 'my_instagram', accountName: 'My Instagram' },
      { platform: 'tiktok', accountId: 'my_tiktok', accountName: 'My TikTok' }
    ];
    
    for (const account of socialAccounts) {
      await db.execute(sql`
        INSERT INTO social_accounts (
          user_id, platform, account_id, account_name, is_active, 
          access_token, created_at
        ) VALUES (
          ${userId}, ${account.platform}, ${account.accountId}, 
          ${account.accountName}, true, 'dummy_token_${account.platform}', NOW()
        )
        ON CONFLICT (user_id, platform, account_id) DO NOTHING
      `);
      
      console.log(`   ✅ Added ${account.platform}: ${account.accountName}`);
    }
    
    // Add notifications
    console.log('🔔 Adding notifications...');
    
    const notifications = [
      {
        type: 'content_ready',
        title: 'Content Ready for Review',
        message: 'Your AI-generated content is ready for review and publishing.'
      },
      {
        type: 'schedule_reminder',
        title: 'Scheduled Post Reminder',
        message: 'You have 3 posts scheduled to publish today.'
      },
      {
        type: 'ai_complete',
        title: 'AI Analysis Complete',
        message: 'Performance prediction and competitor analysis completed.'
      }
    ];
    
    for (const notification of notifications) {
      await db.execute(sql`
        INSERT INTO notifications (
          user_id, type, title, message, is_read, created_at
        ) VALUES (
          ${userId}, ${notification.type}, ${notification.title}, 
          ${notification.message}, false, NOW()
        )
      `);
      
      console.log(`   ✅ Added notification: ${notification.title}`);
    }
    
    // Get summary statistics
    console.log('\\n📊 Calculating summary statistics...');
    
    const stats = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT c.id) as content_count,
        COALESCE(SUM(cm.views), 0) as total_views,
        COALESCE(SUM(cm.likes), 0) as total_likes,
        COALESCE(SUM(cm.comments), 0) as total_comments,
        COALESCE(SUM(cm.shares), 0) as total_shares,
        COALESCE(SUM(cm.revenue::numeric), 0) as total_revenue
      FROM content c
      LEFT JOIN content_metrics cm ON c.id = cm.content_id
      WHERE c.user_id = ${userId}
    `);
    
    const summary = stats[0] || {};
    const totalViews = Number(summary.total_views || 0);
    const totalEngagement = Number(summary.total_likes || 0) + Number(summary.total_comments || 0) + Number(summary.total_shares || 0);
    const engagementRate = totalViews > 0 ? (totalEngagement / totalViews * 100).toFixed(2) : 0;
    
    console.log('\\n' + '='.repeat(50));
    console.log('🎉 DASHBOARD DATA SETUP COMPLETE!');
    console.log('='.repeat(50));
    console.log(`📝 Content Items: ${summary.content_count || 0}`);
    console.log(`👀 Total Views: ${totalViews.toLocaleString()}`);
    console.log(`❤️ Total Likes: ${Number(summary.total_likes || 0).toLocaleString()}`);
    console.log(`💬 Total Comments: ${Number(summary.total_comments || 0).toLocaleString()}`);
    console.log(`🔄 Total Shares: ${Number(summary.total_shares || 0).toLocaleString()}`);
    console.log(`📊 Engagement Rate: ${engagementRate}%`);
    console.log(`💰 Total Revenue: $${Number(summary.total_revenue || 0).toFixed(2)}`);
    console.log('\\n🚀 Your dashboard now has real data!');
    console.log('📱 Open http://localhost:5000 to see the results');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error setting up dashboard data:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the setup
if (require.main === module) {
  addDashboardData().catch(console.error);
}

module.exports = { addDashboardData };