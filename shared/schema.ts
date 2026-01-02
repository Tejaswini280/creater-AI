import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with authentication fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  password: text("password").notNull(), // Hashed password
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const socialAccounts = pgTable("social_accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(), // youtube, instagram, facebook, tiktok
  accountId: varchar("account_id").notNull(),
  accountName: varchar("account_name").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"), // platform-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  script: text("script"),
  platform: varchar("platform").notNull(),
  contentType: varchar("content_type").notNull(), // video, image, text, reel, short
  status: varchar("status").notNull().default("draft"), // draft, scheduled, published, failed, paused, stopped
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  thumbnailUrl: varchar("thumbnail_url"),
  videoUrl: varchar("video_url"),
  tags: text("tags").array(),
  metadata: jsonb("metadata"), // platform-specific metadata
  aiGenerated: boolean("ai_generated").default(false),
  // Enhanced fields for social media project workflow
  dayNumber: integer("day_number"), // Day number in the project (1, 2, 3, etc.)
  isPaused: boolean("is_paused").default(false), // Individual content pause state
  isStopped: boolean("is_stopped").default(false), // Individual content stop state
  canPublish: boolean("can_publish").default(true), // Whether this content can be published
  publishOrder: integer("publish_order").default(0), // Order of publishing within the day
  contentVersion: integer("content_version").default(1), // Version for regeneration tracking
  lastRegeneratedAt: timestamp("last_regenerated_at"), // When content was last regenerated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contentMetrics = pgTable("content_metrics", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull().references(() => content.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const niches = pgTable("niches", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  category: varchar("category").notNull(),
  trendScore: integer("trend_score").default(0),
  difficulty: varchar("difficulty").notNull(), // easy, medium, hard
  profitability: varchar("profitability").notNull(), // low, medium, high
  keywords: text("keywords").array(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiGenerationTasks = pgTable("ai_generation_tasks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskType: varchar("task_type").notNull(), // script, voiceover, video, thumbnail
  prompt: text("prompt").notNull(),
  result: text("result"),
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // video, thumbnail, script, branding, social
  type: varchar("type").notNull(), // Script Template, Video Template, Thumbnail Template, etc.
  content: text("content"), // Template content/script
  thumbnailUrl: varchar("thumbnail_url"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  downloads: integer("downloads").default(0),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  tags: text("tags").array(),
  metadata: jsonb("metadata"), // Additional template data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table for real notification functionality
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // content_ready, ai_complete, schedule_reminder, etc.
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"), // additional data for the notification
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// New tables for enhanced social media project management
export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  caption: text("caption"),
  hashtags: text("hashtags").array(),
  emojis: text("emojis").array(),
  contentType: varchar("content_type").notNull(), // post, reel, short, story, video
  status: varchar("status").notNull().default("draft"), // draft, scheduled, published, failed
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  thumbnailUrl: varchar("thumbnail_url"),
  mediaUrls: text("media_urls").array(), // Array of media file URLs
  aiGenerated: boolean("ai_generated").default(false),
  metadata: jsonb("metadata"), // platform-specific metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const platformPosts = pgTable("platform_posts", {
  id: serial("id").primaryKey(),
  socialPostId: integer("social_post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(), // instagram, facebook, linkedin, youtube, tiktok
  accountId: integer("account_id").notNull().references(() => socialAccounts.id, { onDelete: "cascade" }),
  caption: text("caption"), // Platform-specific caption
  hashtags: text("hashtags").array(), // Platform-specific hashtags
  emojis: text("emojis").array(), // Platform-specific emojis
  scheduledAt: timestamp("scheduled_at"), // Platform-specific scheduling
  publishedAt: timestamp("published_at"),
  status: varchar("status").notNull().default("draft"), // draft, scheduled, published, failed
  platformPostId: varchar("platform_post_id"), // ID from the actual platform
  platformUrl: varchar("platform_url"), // URL to the published post
  metadata: jsonb("metadata"), // Platform-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const postMedia = pgTable("post_media", {
  id: serial("id").primaryKey(),
  socialPostId: integer("social_post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
  mediaType: varchar("media_type").notNull(), // image, video, pdf, thumbnail
  mediaUrl: varchar("media_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  duration: integer("duration"), // For video/audio files in seconds
  dimensions: jsonb("dimensions"), // {width, height} for images/videos
  metadata: jsonb("metadata"), // Additional media metadata
  createdAt: timestamp("created_at").defaultNow(),
});

export const postSchedules = pgTable("post_schedules", {
  id: serial("id").primaryKey(),
  socialPostId: integer("social_post_id").notNull().references(() => socialPosts.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  recurrence: varchar("recurrence").default("none"), // none, daily, weekly, monthly, weekdays
  timezone: varchar("timezone").default("UTC"), // timezone identifier
  seriesEndDate: timestamp("series_end_date"), // end date for recurring series
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  retryCount: integer("retry_count").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const hashtagSuggestions = pgTable("hashtag_suggestions", {
  id: serial("id").primaryKey(),
  platform: varchar("platform").notNull(),
  category: varchar("category").notNull(),
  hashtag: varchar("hashtag").notNull(),
  trendScore: integer("trend_score").default(0),
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiContentSuggestions = pgTable("ai_content_suggestions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  suggestionType: varchar("suggestion_type").notNull(), // caption, hashtags, best_time, content_idea
  platform: varchar("platform").notNull(),
  content: text("content").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // video, audio, image, script, campaign
  template: varchar("template"), // template ID if using a template
  platform: varchar("platform"), // primary platform
  targetAudience: varchar("target_audience"),
  estimatedDuration: varchar("estimated_duration"),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false),
  status: varchar("status").notNull().default("active"), // active, completed, archived
  metadata: jsonb("metadata"), // additional project data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  socialAccounts: many(socialAccounts),
  content: many(content),
  aiTasks: many(aiGenerationTasks),
}));

export const socialAccountRelations = relations(socialAccounts, ({ one }) => ({
  user: one(users, {
    fields: [socialAccounts.userId],
    references: [users.id],
  }),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
  user: one(users, {
    fields: [content.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [content.projectId],
    references: [projects.id],
  }),
  metrics: many(contentMetrics),
}));

export const contentMetricsRelations = relations(contentMetrics, ({ one }) => ({
  content: one(content, {
    fields: [contentMetrics.contentId],
    references: [content.id],
  }),
}));

export const aiGenerationTaskRelations = relations(aiGenerationTasks, ({ one }) => ({
  user: one(users, {
    fields: [aiGenerationTasks.userId],
    references: [users.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  content: many(content),
}));

// New relations for social media tables
export const socialPostRelations = relations(socialPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [socialPosts.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [socialPosts.projectId],
    references: [projects.id],
  }),
  platformPosts: many(platformPosts),
  media: many(postMedia),
  schedules: many(postSchedules),
}));

export const platformPostRelations = relations(platformPosts, ({ one }) => ({
  socialPost: one(socialPosts, {
    fields: [platformPosts.socialPostId],
    references: [socialPosts.id],
  }),
  socialAccount: one(socialAccounts, {
    fields: [platformPosts.accountId],
    references: [socialAccounts.id],
  }),
}));

export const postMediaRelations = relations(postMedia, ({ one }) => ({
  socialPost: one(socialPosts, {
    fields: [postMedia.socialPostId],
    references: [socialPosts.id],
  }),
}));

export const postScheduleRelations = relations(postSchedules, ({ one }) => ({
  socialPost: one(socialPosts, {
    fields: [postSchedules.socialPostId],
    references: [socialPosts.id],
  }),
}));

export const aiContentSuggestionRelations = relations(aiContentSuggestions, ({ one }) => ({
  user: one(users, {
    fields: [aiContentSuggestions.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [aiContentSuggestions.projectId],
    references: [projects.id],
  }),
}));

// AI Project Management Tables
export const aiProjects = pgTable("ai_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  projectType: varchar("project_type").notNull(), // fitness, business, lifestyle, etc.
  duration: integer("duration").notNull(), // in days
  customDuration: integer("custom_duration"), // for custom durations
  targetChannels: text("target_channels").array().notNull(), // ["instagram", "facebook", "tiktok"]
  contentFrequency: varchar("content_frequency").notNull(), // daily, weekly, bi-weekly, monthly
  targetAudience: varchar("target_audience"),
  brandVoice: varchar("brand_voice"),
  contentGoals: text("content_goals").array(),
  // Enhanced fields for AI content generation
  contentTitle: varchar("content_title"),
  contentDescription: text("content_description"),
  channelType: varchar("channel_type"), // single platform or multi-platform
  tags: text("tags").array(),
  aiSettings: jsonb("ai_settings"), // AI generation preferences
  status: varchar("status").notNull().default("active"), // active, completed, archived
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiGeneratedContent = pgTable("ai_generated_content", {
  id: serial("id").primaryKey(),
  aiProjectId: integer("ai_project_id").notNull().references(() => aiProjects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  platform: varchar("platform").notNull(),
  contentType: varchar("content_type").notNull(), // post, reel, short, story, video, blog
  status: varchar("status").notNull().default("draft"), // draft, scheduled, published, failed, paused, stopped
  scheduledDate: timestamp("scheduled_date"),
  publishedAt: timestamp("published_at"),
  hashtags: text("hashtags").array(),
  metadata: jsonb("metadata"),
  aiModel: varchar("ai_model").default("gemini-2.5-flash"),
  generationPrompt: text("generation_prompt"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  engagementPrediction: jsonb("engagement_prediction"),
  // Enhanced content management fields
  dayNumber: integer("day_number").notNull(), // Day number in the project (1, 2, 3, etc.)
  isPaused: boolean("is_paused").default(false), // Individual content pause state
  isStopped: boolean("is_stopped").default(false), // Individual content stop state
  canPublish: boolean("can_publish").default(true), // Whether this content can be published
  publishOrder: integer("publish_order").default(0), // Order of publishing within the day
  contentVersion: integer("content_version").default(1), // Version for regeneration tracking
  lastRegeneratedAt: timestamp("last_regenerated_at"), // When content was last regenerated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiContentCalendar = pgTable("ai_content_calendar", {
  id: serial("id").primaryKey(),
  aiProjectId: integer("ai_project_id").notNull().references(() => aiProjects.id, { onDelete: "cascade" }),
  contentId: integer("content_id").notNull().references(() => aiGeneratedContent.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: varchar("scheduled_time").notNull(), // HH:MM format
  platform: varchar("platform").notNull(),
  contentType: varchar("content_type").notNull(),
  status: varchar("status").notNull().default("scheduled"), // scheduled, published, failed
  optimalPostingTime: boolean("optimal_posting_time").default(false),
  engagementScore: decimal("engagement_score", { precision: 3, scale: 2 }),
  aiOptimized: boolean("ai_optimized").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiEngagementPatterns = pgTable("ai_engagement_patterns", {
  id: serial("id").primaryKey(),
  platform: varchar("platform").notNull(),
  category: varchar("category").notNull(),
  optimalTimes: text("optimal_times").array().notNull(), // ["09:00", "12:00", "17:00"]
  engagementScore: decimal("engagement_score", { precision: 3, scale: 2 }),
  sampleSize: integer("sample_size").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Content Management Table
export const projectContentManagement = pgTable("project_content_management", {
  id: serial("id").primaryKey(),
  aiProjectId: integer("ai_project_id").notNull().references(() => aiProjects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Content generation settings
  totalDays: integer("total_days").notNull(), // Total number of days in the project
  contentPerDay: integer("content_per_day").default(1), // Number of content pieces per day
  currentDay: integer("current_day").default(1), // Current day being processed
  // Content management settings
  isPaused: boolean("is_paused").default(false), // Global pause for the project
  isStopped: boolean("is_stopped").default(false), // Global stop for the project
  canPublishUnpublished: boolean("can_publish_unpublished").default(true), // Can publish unpublished content
  // Extension settings
  originalDuration: integer("original_duration").notNull(), // Original project duration
  extendedDays: integer("extended_days").default(0), // Number of days extended
  extensionHistory: jsonb("extension_history").default([]), // History of extensions
  // Calendar settings
  calendarUpdatedAt: timestamp("calendar_updated_at").defaultNow(),
  lastContentGeneratedAt: timestamp("last_content_generated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content Action History Table
export const contentActionHistory = pgTable("content_action_history", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull().references(() => aiGeneratedContent.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action").notNull(), // play, pause, stop, delete, edit, regenerate, update, extend
  previousStatus: varchar("previous_status"),
  newStatus: varchar("new_status"),
  metadata: jsonb("metadata"), // Additional action data
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Project Relations
export const aiProjectRelations = relations(aiProjects, ({ one, many }) => ({
  user: one(users, {
    fields: [aiProjects.userId],
    references: [users.id],
  }),
  generatedContent: many(aiGeneratedContent),
  calendarEntries: many(aiContentCalendar),
}));

export const aiGeneratedContentRelations = relations(aiGeneratedContent, ({ one, many }) => ({
  aiProject: one(aiProjects, {
    fields: [aiGeneratedContent.aiProjectId],
    references: [aiProjects.id],
  }),
  user: one(users, {
    fields: [aiGeneratedContent.userId],
    references: [users.id],
  }),
  calendarEntries: many(aiContentCalendar),
}));

export const aiContentCalendarRelations = relations(aiContentCalendar, ({ one }) => ({
  aiProject: one(aiProjects, {
    fields: [aiContentCalendar.aiProjectId],
    references: [aiProjects.id],
  }),
  content: one(aiGeneratedContent, {
    fields: [aiContentCalendar.contentId],
    references: [aiGeneratedContent.id],
  }),
  user: one(users, {
    fields: [aiContentCalendar.userId],
    references: [users.id],
  }),
}));

export const projectContentManagementRelations = relations(projectContentManagement, ({ one }) => ({
  aiProject: one(aiProjects, {
    fields: [projectContentManagement.aiProjectId],
    references: [aiProjects.id],
  }),
  user: one(users, {
    fields: [projectContentManagement.userId],
    references: [users.id],
  }),
}));

export const contentActionHistoryRelations = relations(contentActionHistory, ({ one }) => ({
  content: one(aiGeneratedContent, {
    fields: [contentActionHistory.contentId],
    references: [aiGeneratedContent.id],
  }),
  user: one(users, {
    fields: [contentActionHistory.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  createdAt: true, 
  updatedAt: true 
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertContentSchema = createInsertSchema(content).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertContentMetricsSchema = createInsertSchema(contentMetrics).omit({ 
  id: true 
});

export const insertNicheSchema = createInsertSchema(niches).omit({ 
  id: true, 
  updatedAt: true 
});

export const insertAIGenerationTaskSchema = createInsertSchema(aiGenerationTasks).omit({ 
  id: true, 
  createdAt: true, 
  completedAt: true 
});

export const insertTemplateSchema = createInsertSchema(templates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  createdAt: true 
});

export const insertProjectSchema = createInsertSchema(projects).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;
export type InsertContentMetrics = z.infer<typeof insertContentMetricsSchema>;
export type ContentMetrics = typeof contentMetrics.$inferSelect;
export type InsertNiche = z.infer<typeof insertNicheSchema>;
export type Niche = typeof niches.$inferSelect;
export type InsertAIGenerationTask = z.infer<typeof insertAIGenerationTaskSchema>;
export type AIGenerationTask = typeof aiGenerationTasks.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// New types for social media tables
export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformPostSchema = createInsertSchema(platformPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPostMediaSchema = createInsertSchema(postMedia).omit({
  id: true,
  createdAt: true,
});

export const insertPostScheduleSchema = createInsertSchema(postSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  recurrence: z.string().optional().default("none"),
  timezone: z.string().optional().default("UTC"),
  seriesEndDate: z.date().optional(),
});

export const insertHashtagSuggestionSchema = createInsertSchema(hashtagSuggestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiContentSuggestionSchema = createInsertSchema(aiContentSuggestions).omit({
  id: true,
  createdAt: true,
});

export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertPlatformPost = z.infer<typeof insertPlatformPostSchema>;
export type PlatformPost = typeof platformPosts.$inferSelect;
export type InsertPostMedia = z.infer<typeof insertPostMediaSchema>;
export type PostMedia = typeof postMedia.$inferSelect;
export type InsertPostSchedule = z.infer<typeof insertPostScheduleSchema>;
export type PostSchedule = typeof postSchedules.$inferSelect;
export type InsertHashtagSuggestion = z.infer<typeof insertHashtagSuggestionSchema>;
export type HashtagSuggestion = typeof hashtagSuggestions.$inferSelect;
export type InsertAiContentSuggestion = z.infer<typeof insertAiContentSuggestionSchema>;
export type AiContentSuggestion = typeof aiContentSuggestions.$inferSelect;

// AI Project Management Insert Schemas
export const insertAiProjectSchema = createInsertSchema(aiProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiGeneratedContentSchema = createInsertSchema(aiGeneratedContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiContentCalendarSchema = createInsertSchema(aiContentCalendar).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiEngagementPatternSchema = createInsertSchema(aiEngagementPatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectContentManagementSchema = createInsertSchema(projectContentManagement).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentActionHistorySchema = createInsertSchema(contentActionHistory).omit({
  id: true,
  createdAt: true,
});

// AI Project Management Types
export type InsertAiProject = z.infer<typeof insertAiProjectSchema>;
export type AiProject = typeof aiProjects.$inferSelect;
export type InsertAiGeneratedContent = z.infer<typeof insertAiGeneratedContentSchema>;
export type AiGeneratedContent = typeof aiGeneratedContent.$inferSelect;
export type InsertAiContentCalendar = z.infer<typeof insertAiContentCalendarSchema>;
export type AiContentCalendar = typeof aiContentCalendar.$inferSelect;
export type InsertAiEngagementPattern = z.infer<typeof insertAiEngagementPatternSchema>;
export type AiEngagementPattern = typeof aiEngagementPatterns.$inferSelect;
export type InsertProjectContentManagement = z.infer<typeof insertProjectContentManagementSchema>;
export type ProjectContentManagement = typeof projectContentManagement.$inferSelect;
export type InsertContentActionHistory = z.infer<typeof insertContentActionHistorySchema>;
export type ContentActionHistory = typeof contentActionHistory.$inferSelect;
// Structured outputs table for Gemini structured JSON generation
export const structuredOutputs = pgTable("structured_outputs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  schema: jsonb("schema").notNull(),
  responseJson: jsonb("response_json").notNull(),
  model: varchar("model").default("gemini-2.5-flash"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const structuredOutputRelations = relations(structuredOutputs, ({ one }) => ({
  user: one(users, {
    fields: [structuredOutputs.userId],
    references: [users.id],
  }),
}));

export const insertStructuredOutputSchema = createInsertSchema(structuredOutputs).omit({
  id: true,
  createdAt: true,
});

export type InsertStructuredOutput = z.infer<typeof insertStructuredOutputSchema>;
export type StructuredOutput = typeof structuredOutputs.$inferSelect;
// Generated code table for AI code generation
export const generatedCode = pgTable("generated_code", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  language: varchar("language").notNull(),
  framework: varchar("framework"),
  code: text("code").notNull(),
  explanation: text("explanation"),
  dependencies: text("dependencies").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedCodeRelations = relations(generatedCode, ({ one }) => ({
  user: one(users, {
    fields: [generatedCode.userId],
    references: [users.id],
  }),
}));

export const insertGeneratedCodeSchema = createInsertSchema(generatedCode).omit({
  id: true,
  createdAt: true,
});

export type InsertGeneratedCode = z.infer<typeof insertGeneratedCodeSchema>;
export type GeneratedCode = typeof generatedCode.$inferSelect;