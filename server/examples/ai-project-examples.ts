/**
 * Example responses and test data for AI Project Management System
 * This file contains sample data that demonstrates the system's capabilities
 */

export const exampleProjectCreationRequest = {
  title: "Fitness Transformation Journey",
  description: "A comprehensive 30-day fitness program with daily workout content, nutrition tips, and motivational posts",
  projectType: "fitness",
  duration: 30,
  targetChannels: ["instagram", "tiktok", "youtube"],
  contentFrequency: "daily",
  targetAudience: "Fitness enthusiasts aged 25-35 looking to transform their bodies",
  brandVoice: "motivational",
  contentGoals: ["Increase brand awareness", "Drive engagement", "Build community"],
  contentTitle: "Daily Fitness Tips",
  contentDescription: "Short, actionable fitness tips and workout routines for busy professionals",
  channelType: "multi-platform",
  tags: ["fitness", "workout", "nutrition", "motivation", "transformation"],
  aiSettings: {
    creativity: 0.8,
    formality: 0.3,
    hashtagCount: 15,
    includeEmojis: true,
    includeCallToAction: true
  },
  startDate: "2024-01-15T00:00:00.000Z"
};

export const exampleProjectCreationResponse = {
  success: true,
  message: "AI project created successfully",
  data: {
    project: {
      id: 1,
      userId: "user_123",
      title: "Fitness Transformation Journey",
      description: "A comprehensive 30-day fitness program with daily workout content, nutrition tips, and motivational posts",
      projectType: "fitness",
      duration: 30,
      targetChannels: ["instagram", "tiktok", "youtube"],
      contentFrequency: "daily",
      targetAudience: "Fitness enthusiasts aged 25-35 looking to transform their bodies",
      brandVoice: "motivational",
      contentGoals: ["Increase brand awareness", "Drive engagement", "Build community"],
      contentTitle: "Daily Fitness Tips",
      contentDescription: "Short, actionable fitness tips and workout routines for busy professionals",
      channelType: "multi-platform",
      tags: ["fitness", "workout", "nutrition", "motivation", "transformation"],
      aiSettings: {
        creativity: 0.8,
        formality: 0.3,
        hashtagCount: 15,
        includeEmojis: true,
        includeCallToAction: true
      },
      status: "active",
      startDate: "2024-01-15T00:00:00.000Z",
      endDate: "2024-02-14T00:00:00.000Z",
      createdAt: "2024-01-15T10:30:00.000Z",
      updatedAt: "2024-01-15T10:30:00.000Z"
    },
    contentItems: [
      {
        id: 1,
        aiProjectId: 1,
        userId: "user_123",
        title: "5-Minute Morning Energizer",
        description: "Start your day with this quick energy-boosting routine that will set the tone for success! 💪",
        content: "Good morning, fitness warriors! 🌅\n\nToday's 5-minute energizer:\n\n1️⃣ Jumping jacks (30 seconds)\n2️⃣ High knees (30 seconds)\n3️⃣ Mountain climbers (30 seconds)\n4️⃣ Burpees (30 seconds)\n5️⃣ Plank hold (30 seconds)\n\nRepeat 2 rounds for maximum energy! ⚡\n\nWho's ready to conquer the day? Drop a 💪 in the comments!",
        platform: "instagram",
        contentType: "post",
        status: "draft",
        scheduledDate: "2024-01-15T09:00:00.000Z",
        hashtags: ["#fitness", "#morningworkout", "#energizer", "#fitnessmotivation", "#quickworkout", "#startyourday", "#fitnessjourney", "#healthylifestyle", "#workout", "#motivation", "#fitnessgoals", "#transformation", "#fitnesslife", "#health", "#wellness"],
        metadata: {
          optimalPostingTime: "09:00",
          engagementStrategy: "Ask questions to encourage comments",
          visualElements: ["High-energy workout video", "Motivational quote overlay"],
          callToAction: "Drop a 💪 in the comments!"
        },
        aiModel: "gemini-2.5-flash",
        generationPrompt: "Create a motivational 5-minute morning workout post for Instagram...",
        confidence: 0.92,
        engagementPrediction: {
          average: 87,
          likes: 145,
          comments: 23,
          shares: 12
        },
        createdAt: "2024-01-15T10:30:00.000Z",
        updatedAt: "2024-01-15T10:30:00.000Z"
      },
      {
        id: 2,
        aiProjectId: 1,
        userId: "user_123",
        title: "TikTok Workout Challenge",
        description: "Join our 30-second plank challenge! Can you hold it? 🏆",
        content: "30-second plank challenge! 🏆\n\nCan you hold it? Let's see! 💪\n\nTag a friend to join the challenge! 👥\n\n#plankchallenge #fitness #workout #tiktok #challenge #core #strength #fitnessmotivation #transformation #fitnessjourney",
        platform: "tiktok",
        contentType: "short",
        status: "draft",
        scheduledDate: "2024-01-15T19:00:00.000Z",
        hashtags: ["#plankchallenge", "#fitness", "#workout", "#tiktok", "#challenge", "#core", "#strength", "#fitnessmotivation", "#transformation", "#fitnessjourney"],
        metadata: {
          optimalPostingTime: "19:00",
          engagementStrategy: "Create a challenge to encourage participation",
          visualElements: ["Plank demonstration video", "Timer overlay"],
          callToAction: "Tag a friend to join the challenge!"
        },
        aiModel: "gemini-2.5-flash",
        generationPrompt: "Create a TikTok short video script for a plank challenge...",
        confidence: 0.89,
        engagementPrediction: {
          average: 94,
          likes: 320,
          comments: 45,
          shares: 28
        },
        createdAt: "2024-01-15T10:30:00.000Z",
        updatedAt: "2024-01-15T10:30:00.000Z"
      },
      {
        id: 3,
        aiProjectId: 1,
        userId: "user_123",
        title: "Nutrition Tip: Pre-Workout Fuel",
        description: "What to eat before your workout for maximum energy and performance",
        content: "Pre-workout nutrition is crucial for performance! 🥗\n\nHere's what to eat 30-60 minutes before your workout:\n\n✅ Bananas - Quick energy boost\n✅ Oatmeal - Sustained energy\n✅ Greek yogurt - Protein for muscle support\n✅ Berries - Antioxidants for recovery\n\nAvoid heavy, greasy foods that can cause discomfort during exercise.\n\nWhat's your go-to pre-workout snack? Let me know in the comments! 👇",
        platform: "youtube",
        contentType: "video",
        status: "draft",
        scheduledDate: "2024-01-16T14:00:00.000Z",
        hashtags: ["#nutrition", "#preworkout", "#fitness", "#health", "#wellness", "#nutritiontips", "#workoutfuel", "#fitnessnutrition", "#healthyeating", "#fitnessjourney", "#transformation", "#motivation", "#fitnesslife", "#healthylifestyle", "#wellness"],
        metadata: {
          optimalPostingTime: "14:00",
          engagementStrategy: "Ask for personal experiences to encourage comments",
          visualElements: ["Food preparation video", "Nutrition facts graphics"],
          callToAction: "What's your go-to pre-workout snack?"
        },
        aiModel: "gemini-2.5-flash",
        generationPrompt: "Create a YouTube video script about pre-workout nutrition...",
        confidence: 0.91,
        engagementPrediction: {
          average: 82,
          likes: 98,
          comments: 18,
          shares: 8
        },
        createdAt: "2024-01-15T10:30:00.000Z",
        updatedAt: "2024-01-15T10:30:00.000Z"
      }
    ],
    calendarEntries: [
      {
        id: 1,
        aiProjectId: 1,
        contentId: 1,
        userId: "user_123",
        scheduledDate: "2024-01-15T09:00:00.000Z",
        scheduledTime: "09:00",
        platform: "instagram",
        contentType: "post",
        status: "scheduled",
        optimalPostingTime: true,
        engagementScore: 0.87,
        aiOptimized: true,
        metadata: {
          optimalTime: "09:00",
          engagementStrategy: "Ask questions to encourage comments",
          visualElements: ["High-energy workout video", "Motivational quote overlay"],
          callToAction: "Drop a 💪 in the comments!",
          channelType: "multi-platform",
          contentTitle: "Daily Fitness Tips",
          tags: ["fitness", "workout", "nutrition", "motivation", "transformation"]
        },
        createdAt: "2024-01-15T10:30:00.000Z",
        updatedAt: "2024-01-15T10:30:00.000Z"
      },
      {
        id: 2,
        aiProjectId: 1,
        contentId: 2,
        userId: "user_123",
        scheduledDate: "2024-01-15T19:00:00.000Z",
        scheduledTime: "19:00",
        platform: "tiktok",
        contentType: "short",
        status: "scheduled",
        optimalPostingTime: true,
        engagementScore: 0.94,
        aiOptimized: true,
        metadata: {
          optimalTime: "19:00",
          engagementStrategy: "Create a challenge to encourage participation",
          visualElements: ["Plank demonstration video", "Timer overlay"],
          callToAction: "Tag a friend to join the challenge!",
          channelType: "multi-platform",
          contentTitle: "Daily Fitness Tips",
          tags: ["fitness", "workout", "nutrition", "motivation", "transformation"]
        },
        createdAt: "2024-01-15T10:30:00.000Z",
        updatedAt: "2024-01-15T10:30:00.000Z"
      },
      {
        id: 3,
        aiProjectId: 1,
        contentId: 3,
        userId: "user_123",
        scheduledDate: "2024-01-16T14:00:00.000Z",
        scheduledTime: "14:00",
        platform: "youtube",
        contentType: "video",
        status: "scheduled",
        optimalPostingTime: true,
        engagementScore: 0.82,
        aiOptimized: true,
        metadata: {
          optimalTime: "14:00",
          engagementStrategy: "Ask for personal experiences to encourage comments",
          visualElements: ["Food preparation video", "Nutrition facts graphics"],
          callToAction: "What's your go-to pre-workout snack?",
          channelType: "multi-platform",
          contentTitle: "Daily Fitness Tips",
          tags: ["fitness", "workout", "nutrition", "motivation", "transformation"]
        },
        createdAt: "2024-01-15T10:30:00.000Z",
        updatedAt: "2024-01-15T10:30:00.000Z"
      }
    ],
    metadata: {
      totalContent: 3,
      totalCalendarEntries: 3,
      generatedAt: "2024-01-15T10:30:00.000Z"
    }
  }
};

export const exampleProjectAnalytics = {
  success: true,
  data: {
    totalContent: 30,
    totalCalendarEntries: 30,
    contentByPlatform: {
      instagram: 12,
      tiktok: 10,
      youtube: 8
    },
    contentByType: {
      post: 12,
      short: 10,
      video: 8
    },
    engagementPredictions: {
      average: 85.2,
      byPlatform: {
        instagram: 87.5,
        tiktok: 92.1,
        youtube: 76.8
      }
    },
    optimalPostingTimes: {
      instagram: ["09:00", "12:00", "17:00"],
      tiktok: ["06:00", "10:00", "19:00"],
      youtube: ["14:00", "20:00"]
    },
    projectHealth: {
      score: 88,
      recommendations: [
        "Consider adding more content pieces for better coverage",
        "Diversify your content across more platforms",
        "Enable AI optimization for more calendar entries",
        "Focus on improving content engagement through better captions and hashtags"
      ]
    }
  },
  metadata: {
    projectId: 1,
    generatedAt: "2024-01-15T10:30:00.000Z"
  }
};

export const exampleOptimalTimesResponse = {
  success: true,
  data: {
    instagram: ["09:00", "12:00", "17:00"],
    facebook: ["09:00", "13:00", "15:00"],
    tiktok: ["06:00", "10:00", "19:00"],
    youtube: ["14:00", "20:00"],
    linkedin: ["08:00", "12:00", "17:00"],
    twitter: ["09:00", "15:00", "21:00"]
  },
  metadata: {
    platforms: ["instagram", "facebook", "tiktok", "youtube", "linkedin", "twitter"],
    category: "fitness",
    timezone: "UTC",
    generatedAt: "2024-01-15T10:30:00.000Z"
  }
};

export const exampleRegenerationResponse = {
  success: true,
  message: "Content regenerated successfully",
  data: {
    contentItems: [
      {
        id: 31,
        aiProjectId: 1,
        userId: "user_123",
        title: "HIIT Cardio Blast",
        description: "Get your heart pumping with this intense 20-minute HIIT session! 🔥",
        content: "Ready for a cardio challenge? 🔥\n\n20-minute HIIT session:\n\n🔥 4 rounds of:\n• 30s Burpees\n• 30s Mountain Climbers\n• 30s Jump Squats\n• 30s High Knees\n• 30s Rest\n\nPush yourself to the limit! 💪\n\nWho's joining me? Comment 'CHALLENGE' below! 👇",
        platform: "instagram",
        contentType: "post",
        status: "draft",
        scheduledDate: "2024-01-16T09:00:00.000Z",
        hashtags: ["#hiit", "#cardio", "#workout", "#fitness", "#challenge", "#burpees", "#mountainclimbers", "#jumpsquats", "#highknees", "#fitnessmotivation", "#transformation", "#fitnessjourney", "#healthylifestyle", "#workout", "#motivation"],
        metadata: {
          optimalPostingTime: "09:00",
          engagementStrategy: "Create a challenge to encourage participation",
          visualElements: ["HIIT workout demonstration", "Timer overlay"],
          callToAction: "Comment 'CHALLENGE' below!"
        },
        aiModel: "gemini-2.5-flash",
        generationPrompt: "Create a HIIT workout post for Instagram...",
        confidence: 0.94,
        engagementPrediction: {
          average: 91,
          likes: 180,
          comments: 35,
          shares: 18
        },
        createdAt: "2024-01-15T11:00:00.000Z",
        updatedAt: "2024-01-15T11:00:00.000Z"
      }
    ],
    calendarEntries: [
      {
        id: 31,
        aiProjectId: 1,
        contentId: 31,
        userId: "user_123",
        scheduledDate: "2024-01-16T09:00:00.000Z",
        scheduledTime: "09:00",
        platform: "instagram",
        contentType: "post",
        status: "scheduled",
        optimalPostingTime: true,
        engagementScore: 0.91,
        aiOptimized: true,
        metadata: {
          optimalTime: "09:00",
          engagementStrategy: "Create a challenge to encourage participation",
          visualElements: ["HIIT workout demonstration", "Timer overlay"],
          callToAction: "Comment 'CHALLENGE' below!",
          channelType: "multi-platform",
          contentTitle: "Daily Fitness Tips",
          tags: ["fitness", "workout", "nutrition", "motivation", "transformation"]
        },
        createdAt: "2024-01-15T11:00:00.000Z",
        updatedAt: "2024-01-15T11:00:00.000Z"
      }
    ]
  },
  metadata: {
    regenerateType: "both",
    generatedAt: "2024-01-15T11:00:00.000Z"
  }
};

export const exampleBusinessProject = {
  title: "Startup Success Stories",
  description: "Weekly content series featuring successful entrepreneurs and their journey to building million-dollar businesses",
  projectType: "business",
  duration: 12,
  targetChannels: ["linkedin", "youtube", "twitter"],
  contentFrequency: "weekly",
  targetAudience: "Entrepreneurs, startup founders, and business professionals",
  brandVoice: "professional",
  contentGoals: ["Share expertise", "Build community", "Generate leads"],
  contentTitle: "Entrepreneur Spotlight",
  contentDescription: "In-depth interviews and case studies with successful business leaders",
  channelType: "multi-platform",
  tags: ["entrepreneurship", "startup", "business", "success", "leadership", "innovation"],
  aiSettings: {
    creativity: 0.6,
    formality: 0.8,
    hashtagCount: 8,
    includeEmojis: false,
    includeCallToAction: true
  }
};

export const exampleLifestyleProject = {
  title: "Minimalist Living Guide",
  description: "Daily tips and inspiration for living a more intentional, clutter-free lifestyle",
  projectType: "lifestyle",
  duration: 21,
  targetChannels: ["instagram", "pinterest", "tiktok"],
  contentFrequency: "daily",
  targetAudience: "People seeking simplicity and mindfulness in their daily lives",
  brandVoice: "inspirational",
  contentGoals: ["Increase brand awareness", "Drive engagement", "Educate audience"],
  contentTitle: "Minimalist Daily",
  contentDescription: "Simple, actionable tips for decluttering and mindful living",
  channelType: "multi-platform",
  tags: ["minimalism", "mindfulness", "simplicity", "declutter", "lifestyle", "wellness"],
  aiSettings: {
    creativity: 0.7,
    formality: 0.4,
    hashtagCount: 12,
    includeEmojis: true,
    includeCallToAction: true
  }
};

export const exampleTechProject = {
  title: "AI & Machine Learning Insights",
  description: "Weekly deep-dive content exploring the latest trends and applications in artificial intelligence",
  projectType: "technology",
  duration: 8,
  targetChannels: ["youtube", "linkedin", "twitter"],
  contentFrequency: "weekly",
  targetAudience: "Tech professionals, developers, and AI enthusiasts",
  brandVoice: "educational",
  contentGoals: ["Educate audience", "Share expertise", "Build community"],
  contentTitle: "AI Weekly",
  contentDescription: "Comprehensive analysis of AI trends, tools, and real-world applications",
  channelType: "multi-platform",
  tags: ["artificialintelligence", "machinelearning", "tech", "innovation", "programming", "data"],
  aiSettings: {
    creativity: 0.5,
    formality: 0.9,
    hashtagCount: 6,
    includeEmojis: false,
    includeCallToAction: true
  }
};

export const sampleEngagementPatterns = [
  {
    platform: "instagram",
    category: "fitness",
    optimalTimes: ["09:00", "12:00", "17:00"],
    engagementScore: 0.87,
    sampleSize: 1250
  },
  {
    platform: "tiktok",
    category: "fitness",
    optimalTimes: ["06:00", "10:00", "19:00"],
    engagementScore: 0.92,
    sampleSize: 2100
  },
  {
    platform: "youtube",
    category: "fitness",
    optimalTimes: ["14:00", "20:00"],
    engagementScore: 0.78,
    sampleSize: 890
  },
  {
    platform: "linkedin",
    category: "business",
    optimalTimes: ["08:00", "12:00", "17:00"],
    engagementScore: 0.82,
    sampleSize: 1560
  },
  {
    platform: "twitter",
    category: "technology",
    optimalTimes: ["09:00", "15:00", "21:00"],
    engagementScore: 0.75,
    sampleSize: 980
  }
];

export const sampleContentIdeas = {
  fitness: [
    "5-Minute Morning Energizer",
    "TikTok Workout Challenge",
    "Nutrition Tip: Pre-Workout Fuel",
    "HIIT Cardio Blast",
    "Yoga Flow for Stress Relief",
    "Strength Training Basics",
    "Recovery Day Stretches",
    "Meal Prep Sunday Routine",
    "Hydration Hacks",
    "Sleep Optimization Tips"
  ],
  business: [
    "Startup Success Stories",
    "Leadership Lessons Learned",
    "Digital Marketing Trends 2024",
    "Building High-Performing Teams",
    "Investment Strategies for Entrepreneurs",
    "Customer Acquisition Tactics",
    "Product Development Insights",
    "Scaling Your Business",
    "Financial Planning for Startups",
    "Networking Strategies"
  ],
  lifestyle: [
    "Minimalist Living Guide",
    "Morning Routine Optimization",
    "Sustainable Living Tips",
    "Mindfulness Practices",
    "Home Organization Hacks",
    "Work-Life Balance Strategies",
    "Personal Development Goals",
    "Healthy Habit Formation",
    "Stress Management Techniques",
    "Creative Expression Ideas"
  ],
  technology: [
    "AI & Machine Learning Insights",
    "Programming Best Practices",
    "Cybersecurity Essentials",
    "Cloud Computing Trends",
    "Mobile App Development",
    "Data Science Applications",
    "Blockchain Technology",
    "IoT Innovations",
    "Software Architecture Patterns",
    "Tech Career Development"
  ]
};

export const sampleHashtags = {
  fitness: [
    "#fitness", "#workout", "#motivation", "#health", "#wellness", "#fitnessjourney",
    "#transformation", "#fitnessmotivation", "#healthylifestyle", "#fitnesslife",
    "#workoutmotivation", "#fitnessgoals", "#fitnessinspiration", "#fitnesscommunity",
    "#fitnessaddict", "#fitnesslover", "#fitnesslife", "#fitnessfirst", "#fitnessmindset"
  ],
  business: [
    "#entrepreneur", "#startup", "#business", "#leadership", "#success", "#innovation",
    "#entrepreneurship", "#businessstrategy", "#leadershipdevelopment", "#businessgrowth",
    "#startupjourney", "#businessmindset", "#entrepreneurlife", "#businesssuccess",
    "#leadershipskills", "#businessinsights", "#startupadvice", "#businesscoaching"
  ],
  lifestyle: [
    "#lifestyle", "#minimalism", "#mindfulness", "#wellness", "#selfcare", "#motivation",
    "#lifestyleblogger", "#minimalist", "#mindfulliving", "#wellnessjourney",
    "#selfimprovement", "#personalgrowth", "#lifestyleinspiration", "#mindfulmoments",
    "#wellnesswednesday", "#selfcare", "#lifestylegoals", "#mindfulnesspractice"
  ],
  technology: [
    "#technology", "#ai", "#machinelearning", "#programming", "#tech", "#innovation",
    "#artificialintelligence", "#datascience", "#softwaredevelopment", "#techtrends",
    "#programminglife", "#techcareer", "#coding", "#techinnovation", "#digitaltransformation",
    "#technews", "#programmingtips", "#techcommunity", "#techstartup"
  ]
};
