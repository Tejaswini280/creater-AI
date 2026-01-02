#!/usr/bin/env node

/**
 * Add Dashboard Data - Working Version
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { sql } = require('drizzle-orm');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/creatornexus';

async function addDashboardData() {
  console.log('🚀 Adding Dashboard Data...');
  
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    const userId = 'dashboard-user-123';
    
    // 1. Create test user
    console.log('👤 Creating test user...');
    await db.execute(sql`
      INSERT INTO users (id, email, password, first_name, last_name, is_active, created_at)
      VALUES (${userId}, 'dashboard@test.com', '$2b$10$hashedpassword', 'Dashboard', 'User', true, NOW())
    `);
    console.log('   ✅ User created');
    
    // 2. Add content data
    console.log('📝 Adding content...');
    
    const contentItems = [
      { title: 'Ultimate AI Tools Guide 2025', platform: 'youtube', views: 45000, likes: 2800, comments: 450, shares: 320 },
      { title: 'Social Media Growth Hacks', platform: 'instagram', views: 28000, likes: 1900, comments: 280, shares: 150 },
      { title: 'Content Creation Masterclass', platform: 'tiktok', views: 67000, likes: 4200, comments: 680, shares: 890 },
      { title: 'YouTube Algorithm Secrets', platform: 'youtube', views: 52000, likes: 3100, comments: 520, shares: 410 },
      { title: 'Monetization Strategies', platform: 'linkedin', views: 18000, likes: 850, comments: 120, shares: 95 }
    ];
    
    for (const item of contentItems) {
      // Insert content
      const contentResult = await db.execute(sql`
        INSERT INTO content (
          user_id, title, description, platform, content_type, status, 
          published_at, ai_generated, created_at, updated_at
        ) VALUES (
          ${userId}, ${item.title}, ${'Description for ' + item.title}, ${item.platform}, 
          'video', 'published', NOW(), true, NOW(), NOW()
        )
        RETURNING id
      `);
      
      const contentId = contentResult[0].id;
      
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
      `);
      
      console.log(`   ✅ ${item.title}: ${item.views.toLocaleString()} views`);
    }
    
    // 3. Add social accounts
    console.log('🔗 Adding social accounts...');
    
    const accounts = [
      { platform: 'youtube', accountId: 'UC123456789', accountName: 'My YouTube Channel' },
      { platform: 'instagram', accountId: 'my_instagram', accountName: 'My Instagram' },
      { platform: 'tiktok', accountId: 'my_tiktok', accountName: 'My TikTok' }
    ];
    
    for (const account of accounts) {
      await db.execute(sql`
        INSERT INTO social_accounts (
          user_id, platform, account_id, account_name, is_active, 
          access_token, created_at, updated_at
        ) VALUES (
          ${userId}, ${account.platform}, ${account.accountId}, 
          ${account.accountName}, true, ${'dummy_token_' + account.platform}, NOW(), NOW()
        )
      `);
      
      console.log(`   ✅ ${account.platform}: ${account.accountName}`);
    }
    
    // 4. Get summary
    console.log('\\n📊 Calculating summary...');
    
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
    
    const summary = stats[0];
    const totalViews = Number(summary.total_views);
    const totalEngagement = Number(summary.total_likes) + Number(summary.total_comments) + Number(summary.total_shares);
    const engagementRate = totalViews > 0 ? (totalEngagement / totalViews * 100).toFixed(2) : 0;
    
    console.log('\\n' + '='.repeat(60));
    console.log('🎉 DASHBOARD DATA ADDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`👤 Test User ID: ${userId}`);
    console.log(`📝 Content Items: ${summary.content_count}`);
    console.log(`👀 Total Views: ${totalViews.toLocaleString()}`);
    console.log(`❤️ Total Likes: ${Number(summary.total_likes).toLocaleString()}`);
    console.log(`💬 Total Comments: ${Number(summary.total_comments).toLocaleString()}`);
    console.log(`🔄 Total Shares: ${Number(summary.total_shares).toLocaleString()}`);
    console.log(`📊 Engagement Rate: ${engagementRate}%`);
    console.log(`💰 Total Revenue: $${Number(summary.total_revenue).toFixed(2)}`);
    console.log('\\n🎯 Next Steps:');
    console.log('   1. 🔧 The dashboard should now show real data');
    console.log('   2. 📱 Open http://localhost:5000 to test');
    console.log('   3. 🔑 If you get 400 errors, check authentication');
    console.log('   4. 📊 Analytics section should work with this data');
    console.log('='.repeat(60));
    
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      console.log('   ℹ️ User already exists, that\'s fine!');
      
      // Still show summary
      console.log('\\n📊 Getting existing data summary...');
      
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
        WHERE c.user_id = 'dashboard-user-123'
      `);
      
      const summary = stats[0];
      console.log('\\n✅ Existing data found:');
      console.log(`   📝 Content Items: ${summary.content_count}`);
      console.log(`   👀 Total Views: ${Number(summary.total_views).toLocaleString()}`);
      console.log(`   💰 Total Revenue: $${Number(summary.total_revenue).toFixed(2)}`);
      
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await client.end();
  }
}

// Run the setup
if (require.main === module) {
  addDashboardData().catch(console.error);
}

module.exports = { addDashboardData };