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

async function setupAnalyticsData() {
  console.log('🚀 SETTING UP ANALYTICS DUMMY DATA\n');

  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database');

    // 1. Get existing user or use test user
    console.log('\n1. Finding existing user...');
    const userResult = await client.query('SELECT id FROM users LIMIT 1');
    let testUserId;
    
    if (userResult.rows.length > 0) {
      testUserId = userResult.rows[0].id;
      console.log(`✅ Using existing user: ${testUserId}`);
    } else {
      // Create user with password
      testUserId = 'analytics-test-user';
      await client.query(`
        INSERT INTO users (id, email, password, first_name, last_name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [testUserId, 'analytics@test.com', 'hashedpassword123', 'Analytics', 'User']);
      console.log('✅ Test user created');
    }

    // 2. Create dummy content
    console.log('\n2. Creating dummy content...');
    const dummyContent = [
      { title: 'AI Content Creation Guide 2025', platform: 'youtube', contentType: 'video' },
      { title: 'Social Media Trends 2025', platform: 'instagram', contentType: 'post' },
      { title: 'TikTok Growth Hacks', platform: 'tiktok', contentType: 'short' },
      { title: 'LinkedIn Marketing Guide', platform: 'linkedin', contentType: 'post' },
      { title: 'YouTube Shorts Strategy', platform: 'youtube', contentType: 'short' },
      { title: 'Instagram Reels Formula', platform: 'instagram', contentType: 'reel' },
      { title: 'Twitter Growth Strategy', platform: 'twitter', contentType: 'post' },
      { title: 'Facebook Marketing Guide', platform: 'facebook', contentType: 'post' }
    ];

    const contentIds = [];
    for (const content of dummyContent) {
      try {
        const result = await client.query(`
          INSERT INTO content (
            user_id, title, description, platform, content_type, status, 
            created_at, updated_at, published_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
          RETURNING id
        `, [
          testUserId,
          content.title,
          `Description for ${content.title}`,
          content.platform,
          content.contentType,
          'published'
        ]);
        
        contentIds.push(result.rows[0].id);
        console.log(`   ✅ Created: ${content.title}`);
      } catch (err) {
        console.log(`   ⚠️ Skipped: ${content.title} (may already exist)`);
      }
    }

    // 3. Create dummy metrics
    console.log('\n3. Creating dummy metrics...');
    for (const contentId of contentIds) {
      const views = Math.floor(Math.random() * 100000) + 5000;
      const likes = Math.floor(views * 0.05);
      const comments = Math.floor(views * 0.01);
      const shares = Math.floor(views * 0.005);
      
      try {
        await client.query(`
          INSERT INTO content_metrics (
            content_id, views, likes, comments, shares, last_updated
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (content_id) DO UPDATE SET
            views = $2, likes = $3, comments = $4, shares = $5, last_updated = NOW()
        `, [contentId, views, likes, comments, shares]);
        
        console.log(`   📊 Content ${contentId}: ${views.toLocaleString()} views`);
      } catch (err) {
        console.log(`   ⚠️ Metrics for content ${contentId}: ${err.message}`);
      }
    }

    // 4. Test analytics API
    console.log('\n4. Testing Analytics API...');
    const analyticsResponse = await makeRequest('GET', '/api/analytics/performance?period=30D');
    
    if (analyticsResponse.status === 200 && analyticsResponse.data?.analytics) {
      const analytics = analyticsResponse.data.analytics;
      console.log('✅ Analytics API working!');
      console.log(`   📈 Total Views: ${analytics.views.toLocaleString()}`);
      console.log(`   💬 Total Engagement: ${analytics.engagement.toLocaleString()}`);
      console.log(`   👥 Subscribers: ${analytics.subscribers.toLocaleString()}`);
      console.log(`   💰 Revenue: $${analytics.revenue}`);
      console.log(`   📝 Content Count: ${analytics.contentCount}`);
      console.log(`   📊 Avg Engagement Rate: ${analytics.avgEngagementRate}%`);
    } else {
      console.log('❌ Analytics API response:', analyticsResponse.status, analyticsResponse.data);
    }

    console.log('\n🎉 ANALYTICS SETUP COMPLETE!\n');
    console.log('🌐 CHECK YOUR ANALYTICS:');
    console.log('   1. Open: http://localhost:5000/analytics');
    console.log('   2. You should see:');
    console.log('      • Real data in charts and metrics');
    console.log('      • Multiple platforms represented');
    console.log('      • Content performance data');
    console.log('      • Working export features');
    console.log('\n✅ Analytics system is ready!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

setupAnalyticsData();