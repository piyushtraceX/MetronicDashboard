import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatar: text("avatar"),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
});

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  products: text("products").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull(),
  riskLevel: text("risk_level").notNull(),
  riskScore: integer("risk_score").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  products: true,
  category: true,
  status: true,
  riskLevel: true,
  riskScore: true,
});

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  supplierId: integer("supplier_id").notNull(),
  status: text("status").notNull(),
  uploadedBy: integer("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  documentType: text("document_type").notNull(),
  filePath: text("file_path"),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  supplierId: true,
  status: true,
  uploadedBy: true,
  documentType: true,
  filePath: true,
  expiresAt: true,
});

// Activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  userId: integer("user_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  metadata: json("metadata"),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  type: true,
  description: true,
  userId: true,
  entityType: true,
  entityId: true,
  metadata: true,
});

// Tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to").notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  title: true,
  description: true,
  assignedTo: true,
  dueDate: true,
  status: true,
  priority: true,
});

// Risk Assessment Categories
export const riskCategories = pgTable("risk_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  score: integer("score").notNull(),
  color: text("color").notNull(),
});

export const insertRiskCategorySchema = createInsertSchema(riskCategories).pick({
  name: true,
  score: true,
  color: true,
});

// Compliance Metrics
export const complianceMetrics = pgTable("compliance_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow(),
  overallCompliance: integer("overall_compliance").notNull(),
  documentStatus: integer("document_status").notNull(),
  supplierCompliance: integer("supplier_compliance").notNull(),
  riskLevel: text("risk_level").notNull(),
  issuesDetected: integer("issues_detected").notNull(),
});

export const insertComplianceMetricSchema = createInsertSchema(complianceMetrics).pick({
  overallCompliance: true,
  documentStatus: true,
  supplierCompliance: true,
  riskLevel: true,
  issuesDetected: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type RiskCategory = typeof riskCategories.$inferSelect;
export type InsertRiskCategory = z.infer<typeof insertRiskCategorySchema>;

export type ComplianceMetric = typeof complianceMetrics.$inferSelect;
export type InsertComplianceMetric = z.infer<typeof insertComplianceMetricSchema>;
