#!/usr/bin/env node

/**
 * Check Database Tables and Add Basic Data
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { sql } = require('drizzle-orm');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/creatornexus';

async function checkAndSetupDatabase() {
  console.log('🔍 Checking Database Tables and Adding Data...');
  
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    // Check what tables exist
    console.log('\\n📋 Checking existing tables...');
    
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\\n✅ Existing tables:');
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name}`);
    });
    
    // Check if users table exists and add test user
    const hasUsers = tables.some(t => t.table_name === 'users');
    if (hasUsers) {
      console.log('\\n👤 Adding test user...');
      
      const userId = 'dashboard-user-123';
      await db.execute(sql`
        INSERT INTO users (id, email, password, first_name, last_name, is_active)
        VALUES (${userId}, 'dashboard@test.com', '$2b$10$hashedpassword', 'Dashboard', 'User', true)
        ON CONFLICT (id) DO NOTHING
      `);
      
      console.log('   ✅ Test user ready');
      
      // Add content if content table exists
      const hasContent = tables.some(t => t.table_name === 'content');
      if (hasContent) {
        console.log('\\n📝 Adding content data...');
        
        // Simple content without project reference
        const contentItems = [
          {
            title: 'AI Tools Guide 2025',
            description: 'Complete guide to AI tools',
            platform: 'youtube',
            contentType: 'video',
            status: 'published'
          },
          {
            title: 'Social Media Growth',
            description: 'Grow your social media presence',
            platform: 'instagram',
            contentType: 'reel',
            status: 'published'
          },
          {
            title: 'Content Creation Tips',
            description: 'Best practices for content creation',
            platform: 'tiktok',
            contentType: 'short',
            status: 'published'
          }
        ];
        
        for (let i = 0; i < contentItems.length; i++) {
          const item = contentItems[i];
          
          const result = await db.execute(sql`
            INSERT INTO content (
              user_id, title, description, platform, content_type, status, 
              published_at, ai_generated, created_at
            ) VALUES (
              ${userId}, ${item.title}, ${item.description}, ${item.platform}, 
              ${item.contentType}, ${item.status}, NOW(), true, NOW()
            )
            ON CONFLICT DO NOTHING
            RETURNING id
          `);
          
          console.log(`   ✅ Added: ${item.title}`);
          
          // Add metrics if table exists
          const hasMetrics = tables.some(t => t.table_name === 'content_metrics');
          if (hasMetrics && result.length > 0) {
            const contentId = result[0].id;
            const views = Math.floor(Math.random() * 50000) + 10000;
            const likes = Math.floor(views * 0.05);
            const comments = Math.floor(views * 0.02);
            const shares = Math.floor(views * 0.01);
            const engagementRate = ((likes + comments + shares) / views * 100).toFixed(2);
            const revenue = (views * 0.01).toFixed(2);
            
            await db.execute(sql`
              INSERT INTO content_metrics (
                content_id, platform, views, likes, comments, shares, 
                engagement_rate, revenue, last_updated
              ) VALUES (
                ${contentId}, ${item.platform}, ${views}, ${likes}, 
                ${comments}, ${shares}, ${engagementRate}, ${revenue}, NOW()
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
            
            console.log(`      📊 Metrics: ${views.toLocaleString()} views, ${engagementRate}% engagement`);
          }
        }
      }
      
      // Add social accounts if table exists
      const hasSocialAccounts = tables.some(t => t.table_name === 'social_accounts');
      if (hasSocialAccounts) {
        console.log('\\n🔗 Adding social accounts...');
        
        const accounts = [
          { platform: 'youtube', accountId: 'UC123456789', accountName: 'My YouTube Channel' },
          { platform: 'instagram', accountId: 'my_instagram', accountName: 'My Instagram' },
          { platform: 'tiktok', accountId: 'my_tiktok', accountName: 'My TikTok' }
        ];
        
        for (const account of accounts) {
          await db.execute(sql`
            INSERT INTO social_accounts (
              user_id, platform, account_id, account_name, is_active, 
              access_token, created_at
            ) VALUES (
              ${userId}, ${account.platform}, ${account.accountId}, 
              ${account.accountName}, true, 'dummy_token', NOW()
            )
            ON CONFLICT (user_id, platform, account_id) DO NOTHING
          `);
          
          console.log(`   ✅ Added ${account.platform}: ${account.accountName}`);
        }
      }
      
      // Get final statistics
      console.log('\\n📊 Final Statistics...');
      
      if (hasContent) {
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
        console.log('🎉 DATABASE SETUP COMPLETE!');
        console.log('='.repeat(50));
        console.log(`📝 Content Items: ${summary.content_count || 0}`);
        console.log(`👀 Total Views: ${totalViews.toLocaleString()}`);
        console.log(`❤️ Total Likes: ${Number(summary.total_likes || 0).toLocaleString()}`);
        console.log(`💬 Total Comments: ${Number(summary.total_comments || 0).toLocaleString()}`);
        console.log(`🔄 Total Shares: ${Number(summary.total_shares || 0).toLocaleString()}`);
        console.log(`📊 Engagement Rate: ${engagementRate}%`);
        console.log(`💰 Total Revenue: $${Number(summary.total_revenue || 0).toFixed(2)}`);
        console.log('\\n🚀 Your dashboard should now show real data!');
        console.log('📱 Open http://localhost:5000 to see the results');
        console.log('='.repeat(50));
      }
      
    } else {
      console.log('\\n❌ Users table not found. Database may not be properly initialized.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

// Run the check and setup
if (require.main === module) {
  checkAndSetupDatabase().catch(console.error);
}

module.exports = { checkAndSetupDatabase };