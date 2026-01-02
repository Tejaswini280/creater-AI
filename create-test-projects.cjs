const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { projects } = require('./shared/schema');

// Database connection
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:CreatorsDev54321@localhost:5432/creators_dev_db"
";
const client = postgres(connectionString);
const db = drizzle(client);

async function createTestProjects() {
  try {
    console.log('🌱 Creating test projects...');
    
    // First, let's get an existing user ID
    const users = await client`SELECT id FROM users LIMIT 1`;
    if (users.length === 0) {
      console.log('❌ No users found in database. Please run user seeding first.');
      return;
    }
    
    const userId = users[0].id;
    console.log('✅ Using user ID:', userId);
    
    // Create test projects
    const testProjects = [
      {
        userId,
        name: "YouTube Channel Launch",
        description: "Launching a new YouTube channel focused on tech tutorials",
        type: "video",
        platform: "youtube",
        targetAudience: "Tech enthusiasts and beginners",
        estimatedDuration: "3 months",
        tags: ["tech", "tutorials", "youtube", "education"],
        status: "active"
      },
      {
        userId,
        name: "Instagram Brand Campaign",
        description: "Creating engaging Instagram content for brand awareness",
        type: "campaign",
        platform: "instagram",
        targetAudience: "Young professionals",
        estimatedDuration: "2 months",
        tags: ["branding", "social media", "instagram", "marketing"],
        status: "active"
      },
      {
        userId,
        name: "Podcast Series",
        description: "Weekly podcast episodes about productivity and business",
        type: "audio",
        platform: "spotify",
        targetAudience: "Business professionals",
        estimatedDuration: "6 months",
        tags: ["podcast", "productivity", "business", "audio"],
        status: "active"
      }
    ];
    
    console.log('📝 Inserting projects...');
    const insertedProjects = await db.insert(projects).values(testProjects).returning();
    
    console.log('✅ Successfully created projects:');
    insertedProjects.forEach(project => {
      console.log(`  - ${project.name} (ID: ${project.id})`);
    });
    
    // Also add some content linked to these projects
    console.log('📹 Creating sample content for projects...');
    
    // Get the first project ID
    const firstProjectId = insertedProjects[0].id;
    
    // Add some content linked to the first project
    const sampleContent = [
      {
        userId,
        projectId: firstProjectId,
        title: "Getting Started with React",
        description: "A beginner-friendly tutorial on React basics",
        platform: "youtube",
        contentType: "video",
        status: "draft",
        tags: ["react", "javascript", "tutorial", "beginner"]
      },
      {
        userId,
        projectId: firstProjectId,
        title: "Advanced React Patterns",
        description: "Deep dive into advanced React concepts",
        platform: "youtube",
        contentType: "video",
        status: "draft",
        tags: ["react", "javascript", "advanced", "patterns"]
      }
    ];
    
    // Insert content (we'll need to import the content table)
    const { content } = require('./shared/schema');
    const insertedContent = await db.insert(content).values(sampleContent).returning();
    
    console.log('✅ Successfully created content:');
    insertedContent.forEach(item => {
      console.log(`  - ${item.title} (Project ID: ${item.projectId})`);
    });
    
    console.log('\n🎉 Test data creation complete!');
    console.log('You can now test the project pages with these project IDs:');
    insertedProjects.forEach(project => {
      console.log(`  - Project: ${project.name} -> /project/${project.id}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test projects:', error);
  } finally {
    await client.end();
  }
}

createTestProjects();
