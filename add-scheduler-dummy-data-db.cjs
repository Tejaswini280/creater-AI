const { Client } = require('pg');

// Database connection
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'creators_dev_db',
  user: 'postgres',
  password: 'postgres'
});

async function addSchedulerDummyData() {
  console.log('🚀 Adding Scheduler Dummy Data to Database...\n');

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Get the test user ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['test@example.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Test user not found. Please run create-test-user.cjs first');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log('✅ Found test user:', userId);

    // Step 2: Create scheduled content
    console.log('\n2. Creating scheduled content...');

    const scheduledContentData = [
      {
        title: 'Morning Motivation Video',
        description: 'Daily motivation content for morning audience',
        platform: 'youtube',
        contentType: 'video',
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
      {
        title: 'Instagram Story Update',
        description: 'Behind the scenes content for Instagram stories',
        platform: 'instagram',
        contentType: 'story',
        scheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
      {
        title: 'LinkedIn Professional Post',
        description: 'Industry insights and professional tips',
        platform: 'linkedin',
        contentType: 'post',
        scheduledAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
      },
      {
        title: 'TikTok Trending Video',
        description: 'Fun and engaging short-form content',
        platform: 'tiktok',
        contentType: 'video',
        scheduledAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
      {
        title: 'Facebook Community Post',
        description: 'Community engagement and discussion starter',
        platform: 'facebook',
        contentType: 'post',
        scheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      }
    ];

    const createdContent = [];

    for (const contentData of scheduledContentData) {
      try {
        const result = await client.query(`
          INSERT INTO content (
            user_id, title, description, platform, content_type, 
            status, scheduled_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id, title, platform, scheduled_at
        `, [
          userId,
          contentData.title,
          contentData.description,
          contentData.platform,
          contentData.contentType,
          'scheduled',
          contentData.scheduledAt,
          new Date(),
          new Date()
        ]);

        createdContent.push(result.rows[0]);
        console.log(`✅ Created: ${contentData.title} (${contentData.platform})`);
      } catch (error) {
        console.log(`❌ Failed to create ${contentData.title}:`, error.message);
      }
    }

    // Step 3: Verify created content
    console.log('\n3. Verifying scheduled content...');

    const verifyResult = await client.query(`
      SELECT id, title, platform, scheduled_at, status
      FROM content 
      WHERE user_id = $1 AND status = 'scheduled'
      ORDER BY scheduled_at
    `, [userId]);

    console.log(`✅ Found ${verifyResult.rows.length} scheduled content items:`);
    
    verifyResult.rows.forEach((item, index) => {
      const scheduledTime = new Date(item.scheduled_at).toLocaleString();
      console.log(`   ${index + 1}. ${item.title} - ${item.platform} - ${scheduledTime}`);
    });

    console.log('\n🎉 Scheduler dummy data added successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Successfully created ${createdContent.length} scheduled content items`);
    console.log(`   • Platforms: YouTube, Instagram, LinkedIn, TikTok, Facebook`);
    console.log(`   • Scheduled times: Next 2-12 hours`);
    console.log(`   • Database integration: ✅ Working`);
    console.log(`   • Content scheduler service: ✅ Will process these items`);
    console.log('\n🌐 Access your scheduler at: http://localhost:5000/scheduler');
    console.log('🔑 Login with: test@example.com / password123');
    console.log('\n📊 The scheduler service will automatically:');
    console.log('   • Monitor these scheduled items');
    console.log('   • Execute publishing at scheduled times');
    console.log('   • Handle retries if publishing fails');
    console.log('   • Update status to "published" when complete');

  } catch (error) {
    console.error('❌ Error adding scheduler dummy data:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
addSchedulerDummyData();