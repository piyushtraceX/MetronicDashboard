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
  location: text("location").notNull(),
  country: text("country").notNull(),
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

// Declarations
export const declarations = pgTable("declarations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "inbound" or "outbound"
  supplierId: integer("supplier_id").notNull(),
  productName: text("product_name").notNull(),
  productDescription: text("product_description"),
  hsnCode: text("hsn_code"),
  quantity: integer("quantity"),
  unit: text("unit"),
  status: text("status").notNull().default("pending"), // "approved", "review", "rejected", "pending"
  riskLevel: text("risk_level").notNull().default("medium"), // "low", "medium", "high"
  geojsonData: json("geojson_data"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  industry: text("industry"),
  rmId: text("rm_id"),
});

export const insertDeclarationSchema = createInsertSchema(declarations).pick({
  type: true,
  supplierId: true,
  productName: true,
  productDescription: true,
  hsnCode: true,
  quantity: true,
  unit: true,
  status: true,
  riskLevel: true,
  geojsonData: true,
  startDate: true,
  endDate: true,
  createdBy: true,
  industry: true,
  rmId: true,
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

export type Declaration = typeof declarations.$inferSelect;
export type InsertDeclaration = z.infer<typeof insertDeclarationSchema>;

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

// Self-Assessment Questionnaires (SAQs)
export const saqs = pgTable("saqs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  customerId: integer("customer_id").notNull(),
  supplierId: integer("supplier_id").notNull(),
  status: text("status").notNull(), // "pending", "in-progress", "completed"
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
  answers: json("answers"), // Store answers as JSON
});

export const insertSaqSchema = createInsertSchema(saqs).pick({
  title: true,
  description: true,
  customerId: true,
  supplierId: true,
  status: true,
  completedAt: true,
  score: true,
  answers: true,
});

export type Saq = typeof saqs.$inferSelect;
export type InsertSaq = z.infer<typeof insertSaqSchema>;

// Customer schema
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  companyName: text("company_name"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  displayName: text("display_name"),
  email: text("email").notNull(),
  workPhone: text("work_phone"),
  mobilePhone: text("mobile_phone"),
  
  // Billing address
  billingAttention: text("billing_attention"),
  billingCountry: text("billing_country").notNull(),
  billingAddressLine1: text("billing_address_line1").notNull(),
  billingAddressLine2: text("billing_address_line2"),
  billingCity: text("billing_city").notNull(),
  billingState: text("billing_state").notNull(),
  billingPostalCode: text("billing_postal_code").notNull(),
  
  // Shipping address
  sameAsBilling: boolean("same_as_billing").default(true),
  shippingAttention: text("shipping_attention"),
  shippingCountry: text("shipping_country"),
  shippingAddressLine1: text("shipping_address_line1"),
  shippingAddressLine2: text("shipping_address_line2"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingPostalCode: text("shipping_postal_code"),
  
  // Other details
  gstTreatment: text("gst_treatment"),
  placeOfSupply: text("place_of_supply"),
  pan: text("pan"),
  taxPreference: text("tax_preference").default("taxable"),
  currency: text("currency").default("USD"),
  paymentTerms: text("payment_terms").default("dueOnReceipt"),
  enablePortal: boolean("enable_portal").default(false),
  portalLanguage: text("portal_language").default("english"),
  
  // EUDR compliance fields
  registrationNumber: text("registration_number"),
  complianceScore: integer("compliance_score").default(50),
  riskLevel: text("risk_level").default("medium"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  type: true,
  companyName: true,
  firstName: true,
  lastName: true,
  displayName: true,
  email: true,
  workPhone: true,
  mobilePhone: true,
  billingAttention: true,
  billingCountry: true,
  billingAddressLine1: true,
  billingAddressLine2: true,
  billingCity: true,
  billingState: true,
  billingPostalCode: true,
  sameAsBilling: true,
  shippingAttention: true,
  shippingCountry: true,
  shippingAddressLine1: true,
  shippingAddressLine2: true,
  shippingCity: true,
  shippingState: true,
  shippingPostalCode: true,
  gstTreatment: true,
  placeOfSupply: true,
  pan: true,
  taxPreference: true,
  currency: true,
  paymentTerms: true,
  enablePortal: true,
  portalLanguage: true,
  registrationNumber: true,
  complianceScore: true,
  riskLevel: true,
  status: true,
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
