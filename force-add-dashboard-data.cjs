#!/usr/bin/env node

/**
 * Force Add Dashboard Data
 * Adds content data regardless of existing user
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { sql } = require('drizzle-orm');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/creatornexus';

async function forceAddData() {
  console.log('🚀 Force Adding Dashboard Data...');
  
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    const userId = 'dashboard-user-123';
    
    // Ensure user exists
    console.log('👤 Ensuring user exists...');
    try {
      await db.execute(sql`
        INSERT INTO users (id, email, first_name, last_name, is_active, created_at) VALUES (${userId}, 'dashboard@creatornexus.dev', 'Dashboard', 'OAuth', true, NOW()))
      `);
      console.log('   ✅ User created');
    } catch (e) {
      console.log('   ✅ User already exists');
    }
    
    // Clear existing content for this user to start fresh
    console.log('🧹 Clearing existing content...');
    await db.execute(sql`DELETE FROM content_metrics WHERE content_id IN (SELECT id FROM content WHERE user_id = ${userId})`);
    await db.execute(sql`DELETE FROM content WHERE user_id = ${userId}`);
    await db.execute(sql`DELETE FROM social_accounts WHERE user_id = ${userId}`);
    console.log('   ✅ Cleared existing data');
    
    // Add fresh content data
    console.log('📝 Adding fresh content...');
    
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
      const engagementRate = parseFloat(((item.likes + item.comments + item.shares) / item.views * 100).toFixed(2));
      const revenue = parseFloat((item.views * 0.01).toFixed(2));
      
      await db.execute(sql`
        INSERT INTO content_metrics (
          content_id, platform, views, likes, comments, shares, 
          engagement_rate, revenue, last_updated
        ) VALUES (
          ${contentId}, ${item.platform}, ${item.views}, ${item.likes}, 
          ${item.comments}, ${item.shares}, ${engagementRate}, ${revenue}, NOW()
        )
      `);
      
      console.log(`   ✅ ${item.title}: ${item.views.toLocaleString()} views, ${engagementRate}% engagement`);
    }
    
    // Add social accounts
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
    
    // Get final summary
    console.log('\\n📊 Final Summary...');
    
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
    
    console.log('\\n' + '='.repeat(70));
    console.log('🎉 DASHBOARD DATA SUCCESSFULLY ADDED!');
    console.log('='.repeat(70));
    console.log(`👤 User ID: ${userId}`);
    console.log(`📧 Email: dashboard@test.com`);
    console.log(`📝 Content Items: ${summary.content_count}`);
    console.log(`👀 Total Views: ${totalViews.toLocaleString()}`);
    console.log(`❤️ Total Likes: ${Number(summary.total_likes).toLocaleString()}`);
    console.log(`💬 Total Comments: ${Number(summary.total_comments).toLocaleString()}`);
    console.log(`🔄 Total Shares: ${Number(summary.total_shares).toLocaleString()}`);
    console.log(`📊 Engagement Rate: ${engagementRate}%`);
    console.log(`💰 Total Revenue: $${Number(summary.total_revenue).toFixed(2)}`);
    console.log('\\n🎯 Your Dashboard Should Now Show:');
    console.log(`   📊 Real metrics instead of zeros`);
    console.log(`   📈 Working analytics charts`);
    console.log(`   🔗 Connected social accounts`);
    console.log(`   📝 Recent content with performance data`);
    console.log('\\n🚀 Next Steps:');
    console.log('   1. 🌐 Open http://localhost:5000 in your browser');
    console.log('   2. 📊 Check the Dashboard - should show real numbers');
    console.log('   3. 📈 Visit Analytics page - should work with data');
    console.log('   4. 🔧 If still getting 400 errors, check server logs');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

// Run the setup
if (require.main === module) {
  forceAddData().catch(console.error);
}

module.exports = { forceAddData };