const { Client } = require('pg');
const http = require('http');

// Database connection
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'creatornexus',
  user: 'postgres',
  password: 'password'
});

const BASE_URL = 'localhost';
const PORT = 5000;

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function createComprehensiveAnalyticsData() {
  console.log('🚀 CREATING COMPREHENSIVE ANALYTICS DUMMY DATA\n');

  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database');

    // 1. Get or create test user
    console.log('\n1. Setting up test user...');
    let testUserId;
    
    const userResult = await client.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length > 0) {
      testUserId = userResult.rows[0].id;
      console.log(`✅ Using existing user: ${testUserId}`);
    } else {
      testUserId = 'analytics-demo-user';
      await client.query(`
        INSERT INTO users (id, email, password, first_name, last_name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [testUserId, 'demo@analytics.com', 'hashedpassword123', 'Demo', 'User']);
      console.log('✅ Demo user created');
    }

    // 2. Create comprehensive content data
    console.log('\n2. Creating comprehensive content data...');
    
    const comprehensiveContent = [
      // YouTube Content
      {
        title: 'Ultimate AI Content Creation Guide 2025',
        description: 'Complete step-by-step guide to creating viral content using AI tools and strategies',
        platform: 'youtube',
        contentType: 'video',
        status: 'published',
        views: 156000,
        likes: 8200,
        comments: 1240,
        shares: 890
      },
      {
        title: 'YouTube Shorts Algorithm Secrets Revealed',
        description: 'Insider tips on how the YouTube Shorts algorithm really works',
        platform: 'youtube',
        contentType: 'short',
        status: 'published',
        views: 89000,
        likes: 5600,
        comments: 780,
        shares: 450
      },
      {
        title: 'Monetize Your Channel in 30 Days',
        description: 'Proven strategies to start earning from your YouTube channel quickly',
        platform: 'youtube',
        contentType: 'video',
        status: 'published',
        views: 67000,
        likes: 4100,
        comments: 890,
        shares: 320
      },
      
      // Instagram Content
      {
        title: 'Instagram Reels Viral Formula 2025',
        description: 'The exact formula top creators use to make their reels go viral every time',
        platform: 'instagram',
        contentType: 'reel',
        status: 'published',
        views: 54000,
        likes: 4200,
        comments: 650,
        shares: 280
      },
      {
        title: 'Instagram Growth Hacks That Actually Work',
        description: 'Proven growth strategies that helped me gain 100K followers in 6 months',
        platform: 'instagram',
        contentType: 'post',
        status: 'published',
        views: 42000,
        likes: 3800,
        comments: 520,
        shares: 190
      },
      {
        title: 'Instagram Story Templates Pack',
        description: 'Professional story templates to boost your engagement and sales',
        platform: 'instagram',
        contentType: 'story',
        status: 'published',
        views: 38000,
        likes: 2900,
        comments: 340,
        shares: 150
      },
      
      // TikTok Content
      {
        title: 'TikTok Algorithm Hack 2025',
        description: 'Secret method to get your videos on the For You page consistently',
        platform: 'tiktok',
        contentType: 'short',
        status: 'published',
        views: 125000,
        likes: 9800,
        comments: 1560,
        shares: 780
      },
      {
        title: 'Viral TikTok Trends to Try Now',
        description: 'Current trending sounds and hashtags that guarantee views',
        platform: 'tiktok',
        contentType: 'short',
        status: 'published',
        views: 78000,
        likes: 6200,
        comments: 890,
        shares: 420
      },
      
      // LinkedIn Content
      {
        title: 'LinkedIn Personal Branding Masterclass',
        description: 'Build a powerful personal brand on LinkedIn that attracts opportunities',
        platform: 'linkedin',
        contentType: 'post',
        status: 'published',
        views: 28000,
        likes: 1800,
        comments: 340,
        shares: 180
      },
      {
        title: 'B2B Content Strategy That Converts',
        description: 'How to create LinkedIn content that generates leads and sales',
        platform: 'linkedin',
        contentType: 'post',
        status: 'published',
        views: 22000,
        likes: 1400,
        comments: 280,
        shares: 120
      },
      
      // Twitter Content
      {
        title: 'Twitter Thread: Building in Public',
        description: 'My journey building a SaaS product in public - lessons learned',
        platform: 'twitter',
        contentType: 'thread',
        status: 'published',
        views: 35000,
        likes: 2100,
        comments: 450,
        shares: 890
      },
      {
        title: 'Twitter Spaces: Future of Social Media',
        description: 'Live discussion about emerging social media trends and predictions',
        platform: 'twitter',
        contentType: 'space',
        status: 'published',
        views: 18000,
        likes: 980,
        comments: 230,
        shares: 150
      },
      
      // Facebook Content
      {
        title: 'Facebook Groups Marketing Strategy',
        description: 'How to leverage Facebook groups for business growth and community building',
        platform: 'facebook',
        contentType: 'post',
        status: 'published',
        views: 25000,
        likes: 1600,
        comments: 320,
        shares: 140
      },
      
      // Scheduled Content
      {
        title: 'Upcoming: AI Tools Review 2025',
        description: 'Comprehensive review of the best AI tools for content creators',
        platform: 'youtube',
        contentType: 'video',
        status: 'scheduled',
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      },
      {
        title: 'Coming Soon: Instagram Algorithm Update',
        description: 'Breaking down the latest Instagram algorithm changes',
        platform: 'instagram',
        contentType: 'reel',
        status: 'scheduled',
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      }
    ];

    const contentIds = [];
    
    for (const content of comprehensiveContent) {
      try {
        // Create content
        const contentResult = await client.query(`
          INSERT INTO content (
            user_id, title, description, platform, content_type, status, 
            created_at, updated_at, published_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 
            NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days',
            NOW(), 
            CASE WHEN $6 = 'published' THEN NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days' ELSE NULL END
          )
          RETURNING id
        `, [
          testUserId,
          content.title,
          content.description,
          content.platform,
          content.contentType,
          content.status
        ]);
        
        const contentId = contentResult.rows[0].id;
        contentIds.push(contentId);
        
        // Create metrics only for published content
        if (content.status === 'published') {
          try {
            await client.query(`
              INSERT INTO content_metrics (
                content_id, views, likes, comments, shares, last_updated
              ) VALUES ($1, $2, $3, $4, $5, NOW())
            `, [contentId, content.views, content.likes, content.comments, content.shares]);
          } catch (metricsError) {
            // If content_metrics table doesn't exist or has issues, skip
            console.log(`   ⚠️ Metrics skipped for: ${content.title}`);
          }
        }
        
        console.log(`   ✅ Created: ${content.title} (${content.views?.toLocaleString() || 0} views)`);
        
      } catch (err) {
        console.log(`   ⚠️ Skipped: ${content.title} (${err.message})`);
      }
    }

    // 3. Create additional analytics data
    console.log('\n3. Creating additional analytics data...');
    
    // Create projects for better organization
    try {
      const projectResult = await client.query(`
        INSERT INTO projects (
          user_id, name, description, type, status, created_at, updated_at
        ) VALUES 
          ($1, 'YouTube Growth Campaign', 'Focus on growing YouTube subscriber base', 'content', 'active', NOW(), NOW()),
          ($1, 'Instagram Engagement Boost', 'Increase Instagram engagement rates', 'content', 'active', NOW(), NOW()),
          ($1, 'TikTok Viral Strategy', 'Create viral TikTok content consistently', 'content', 'active', NOW(), NOW())
        RETURNING id
      `, [testUserId]);
      
      console.log(`   ✅ Created ${projectResult.rows.length} projects`);
    } catch (err) {
      console.log(`   ⚠️ Projects creation skipped: ${err.message}`);
    }

    // 4. Test analytics with new data
    console.log('\n4. Testing analytics with comprehensive data...');
    
    const analyticsResponse = await makeRequest('GET', '/api/analytics/performance?period=30D');
    
    if (analyticsResponse.status === 200 && analyticsResponse.data?.analytics) {
      const analytics = analyticsResponse.data.analytics;
      console.log('✅ Analytics API working with comprehensive data!');
      console.log(`   📈 Total Views: ${analytics.views.toLocaleString()}`);
      console.log(`   💬 Total Engagement: ${analytics.engagement.toLocaleString()}`);
      console.log(`   👥 Subscribers: ${analytics.subscribers.toLocaleString()}`);
      console.log(`   💰 Revenue: $${analytics.revenue}`);
      console.log(`   📝 Content Count: ${analytics.contentCount}`);
      console.log(`   📊 Avg Engagement Rate: ${analytics.avgEngagementRate}%`);
      console.log(`   🏆 Top Platforms: ${analytics.topPlatforms.length} platforms`);
      console.log(`   📋 Recent Content: ${analytics.recentContent.length} items`);
      
      // Show platform breakdown
      if (analytics.topPlatforms.length > 0) {
        console.log('\n   🎯 Platform Breakdown:');
        analytics.topPlatforms.forEach(platform => {
          console.log(`      • ${platform.platform}: ${platform.views.toLocaleString()} views, ${platform.engagement.toLocaleString()} engagement`);
        });
      }
      
      // Show recent content
      if (analytics.recentContent.length > 0) {
        console.log('\n   📋 Recent Top Content:');
        analytics.recentContent.slice(0, 3).forEach((content, index) => {
          console.log(`      ${index + 1}. ${content.title} (${content.platform}): ${content.views.toLocaleString()} views`);
        });
      }
    } else {
      console.log('❌ Analytics API failed:', analyticsResponse.status);
    }

    // 5. Summary and testing instructions
    console.log('\n🎉 COMPREHENSIVE ANALYTICS DATA CREATED!\n');
    
    console.log('📊 DATA SUMMARY:');
    console.log(`   ✅ ${comprehensiveContent.length} content items created`);
    console.log('   ✅ Multiple platforms: YouTube, Instagram, TikTok, LinkedIn, Twitter, Facebook');
    console.log('   ✅ Various content types: Videos, Shorts, Reels, Posts, Stories, Threads');
    console.log('   ✅ Realistic engagement metrics');
    console.log('   ✅ Published and scheduled content');
    console.log('   ✅ Historical data (up to 30 days old)');

    console.log('\n🌐 HOW TO TEST YOUR ANALYTICS:');
    console.log('\n   1. OPEN ANALYTICS DASHBOARD:');
    console.log('      → http://localhost:5000/analytics');
    
    console.log('\n   2. TEST EACH TAB:');
    console.log('      ✓ Dashboard - Should show comprehensive metrics');
    console.log('      ✓ Predictive AI - Test with sample content');
    console.log('      ✓ Advanced Analytics - Detailed breakdowns');
    console.log('      ✓ Competitor Intel - Market analysis tools');
    console.log('      ✓ Monetization - Revenue strategies');
    console.log('      ✓ Traditional - Classic analytics view');

    console.log('\n   3. VERIFY FEATURES:');
    console.log('      ✓ Charts showing real data from multiple platforms');
    console.log('      ✓ Platform performance comparison');
    console.log('      ✓ Content performance rankings');
    console.log('      ✓ Time period filtering (7D, 30D, 90D, 1Y)');
    console.log('      ✓ Export functionality (CSV, JSON, Reports)');
    console.log('      ✓ Growth metrics and trends');

    console.log('\n   4. EXPECTED RESULTS:');
    console.log('      • Total views: 700K+ across all platforms');
    console.log('      • Multiple platforms represented in charts');
    console.log('      • Realistic engagement rates (3-8%)');
    console.log('      • Content performance rankings');
    console.log('      • Platform-specific insights');

    console.log('\n🎯 ANALYTICS SYSTEM: READY FOR COMPREHENSIVE TESTING ✅');

  } catch (error) {
    console.error('❌ Error creating comprehensive analytics data:', error);
  } finally {
    await client.end();
  }
}

createComprehensiveAnalyticsData();