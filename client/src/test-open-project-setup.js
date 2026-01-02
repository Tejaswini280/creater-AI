// Test setup for Open Project functionality
// This script populates localStorage with test data to demonstrate the Open Project modal

const testProjects = [
  {
    id: 1,
    name: "YouTube Tech Tutorials",
    description: "Creating comprehensive tech tutorials for beginners and intermediate developers",
    type: "video",
    tags: ["tech", "tutorials", "youtube", "programming"],
    createdAt: "2024-01-15T10:00:00Z",
    status: "active",
    duration: 30,
    startDate: "2024-01-15T00:00:00Z",
    endDate: "2024-02-15T00:00:00Z",
    targetChannels: ["youtube"],
    targetAudience: "Developers and tech enthusiasts",
    brandVoice: "Educational and approachable",
    contentGoals: ["Educate", "Build community", "Drive engagement"],
    contentFrequency: "Weekly",
    contentDescription: "In-depth tutorials covering web development, programming languages, and tech tools",
    channelType: "Educational",
    projectType: "Content Series"
  },
  {
    id: 2,
    name: "Instagram Fitness Journey",
    description: "Documenting my fitness transformation with daily posts and tips",
    type: "social",
    tags: ["fitness", "health", "instagram", "motivation"],
    createdAt: "2024-01-20T14:30:00Z",
    status: "active",
    duration: 90,
    startDate: "2024-01-20T00:00:00Z",
    endDate: "2024-04-20T00:00:00Z",
    targetChannels: ["instagram", "facebook"],
    targetAudience: "Fitness enthusiasts and beginners",
    brandVoice: "Motivational and supportive",
    contentGoals: ["Inspire", "Share progress", "Build community"],
    contentFrequency: "Daily",
    contentDescription: "Daily fitness updates, workout tips, nutrition advice, and motivational content",
    channelType: "Lifestyle",
    projectType: "Personal Brand"
  },
  {
    id: 3,
    name: "Podcast: Future of Work",
    description: "Exploring how technology is reshaping the workplace",
    type: "audio",
    tags: ["podcast", "technology", "work", "future"],
    createdAt: "2024-02-01T09:15:00Z",
    status: "scheduled",
    duration: 180,
    startDate: "2024-02-01T00:00:00Z",
    endDate: "2024-08-01T00:00:00Z",
    targetChannels: ["spotify", "apple-podcasts"],
    targetAudience: "Working professionals and business leaders",
    brandVoice: "Thoughtful and analytical",
    contentGoals: ["Inform", "Provoke discussion", "Network"],
    contentFrequency: "Bi-weekly",
    contentDescription: "Interviews with industry experts about AI, remote work, and workplace innovation",
    channelType: "Business",
    projectType: "Interview Series"
  }
];

const testContent = [
  // Content for YouTube Tech Tutorials project
  {
    id: 1,
    title: "React Hooks Deep Dive",
    description: "Understanding useState, useEffect, and custom hooks with practical examples",
    platform: "youtube",
    contentType: "video",
    status: "published",
    createdAt: "2024-01-16T10:00:00Z",
    scheduledAt: "2024-01-16T15:00:00Z",
    projectId: 1,
    hashtags: ["react", "hooks", "javascript", "tutorial"],
    aiGenerated: true,
    engagementPrediction: 85,
    expectedReach: "2.5K-5K",
    confidence: 92,
    qualityScore: 88,
    bestPostingTime: "2:00 PM EST",
    metadata: {
      aiGenerated: true,
      recommendations: [
        "Add timestamps in description for better navigation",
        "Create companion blog post for written tutorial"
      ]
    }
  },
  {
    id: 2,
    title: "CSS Grid vs Flexbox",
    description: "When to use CSS Grid and when to use Flexbox for modern layouts",
    platform: "youtube",
    contentType: "video",
    status: "scheduled",
    createdAt: "2024-01-18T10:00:00Z",
    scheduledAt: "2024-01-23T14:00:00Z",
    projectId: 1,
    hashtags: ["css", "grid", "flexbox", "webdev"],
    aiGenerated: true,
    engagementPrediction: 78,
    expectedReach: "1.8K-3.5K",
    confidence: 89,
    qualityScore: 85,
    bestPostingTime: "1:00 PM EST"
  },
  {
    id: 3,
    title: "JavaScript ES6 Features",
    description: "Essential ES6 features every developer should know",
    platform: "youtube",
    contentType: "video",
    status: "draft",
    createdAt: "2024-01-20T10:00:00Z",
    projectId: 1,
    hashtags: ["javascript", "es6", "programming", "tutorial"],
    aiGenerated: true,
    engagementPrediction: 72,
    expectedReach: "1.2K-2.8K",
    confidence: 87,
    qualityScore: 82,
    bestPostingTime: "3:00 PM EST"
  },
  // Content for Instagram Fitness Journey project
  {
    id: 4,
    title: "Morning Workout Routine",
    description: "Start your day right with this energizing 20-minute workout",
    platform: "instagram",
    contentType: "video",
    status: "published",
    createdAt: "2024-01-21T07:00:00Z",
    scheduledAt: "2024-01-21T08:00:00Z",
    projectId: 2,
    hashtags: ["fitness", "workout", "morning", "motivation"],
    aiGenerated: false,
    engagementPrediction: 65,
    expectedReach: "800-1.5K",
    confidence: 78,
    qualityScore: 75,
    bestPostingTime: "7:00 AM EST"
  },
  {
    id: 5,
    title: "Healthy Meal Prep Ideas",
    description: "Quick and nutritious meal ideas for busy days",
    platform: "instagram",
    contentType: "image",
    status: "scheduled",
    createdAt: "2024-01-22T10:00:00Z",
    scheduledAt: "2024-01-25T12:00:00Z",
    projectId: 2,
    hashtags: ["mealprep", "healthy", "nutrition", "fitness"],
    aiGenerated: true,
    engagementPrediction: 58,
    expectedReach: "600-1.2K",
    confidence: 82,
    qualityScore: 79,
    bestPostingTime: "11:00 AM EST"
  },
  // Content for Podcast project
  {
    id: 6,
    title: "AI in the Workplace",
    description: "How artificial intelligence is transforming modern work environments",
    platform: "spotify",
    contentType: "audio",
    status: "processing",
    createdAt: "2024-02-05T10:00:00Z",
    scheduledAt: "2024-02-10T10:00:00Z",
    projectId: 3,
    hashtags: ["ai", "workplace", "technology", "future"],
    aiGenerated: false,
    engagementPrediction: 45,
    expectedReach: "300-800",
    confidence: 76,
    qualityScore: 80,
    bestPostingTime: "9:00 AM EST"
  }
];

// Store test data in localStorage
localStorage.setItem('localProjects', JSON.stringify(testProjects));
localStorage.setItem('localContent', JSON.stringify(testContent));

console.log('✅ Test data populated for Open Project functionality!');
console.log('📊 Created', testProjects.length, 'test projects');
console.log('📝 Created', testContent.length, 'test content items');
console.log('🔗 Projects:', testProjects.map(p => `${p.name} (ID: ${p.id})`));

// Instructions for testing
console.log('\n📋 Testing Instructions:');
console.log('1. Open the dashboard');
console.log('2. Look for the "Your Projects" section');
console.log('3. Click "Open Project" on any project');
console.log('4. The modal should open showing project details');
console.log('5. Try switching between Overview, Content, Calendar, and Analytics tabs');
console.log('6. Test the search and filter functionality in the Content tab');

export { testProjects, testContent };
