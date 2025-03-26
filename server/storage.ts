import {
  users, type User, type InsertUser,
  suppliers, type Supplier, type InsertSupplier,
  documents, type Document, type InsertDocument,
  activities, type Activity, type InsertActivity,
  tasks, type Task, type InsertTask,
  riskCategories, type RiskCategory, type InsertRiskCategory,
  complianceMetrics, type ComplianceMetric, type InsertComplianceMetric
} from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;

  // Supplier management
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  listSuppliers(): Promise<Supplier[]>;
  
  // Document management
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  listDocumentsBySupplier(supplierId: number): Promise<Document[]>;
  listDocuments(): Promise<Document[]>;
  
  // Activity tracking
  createActivity(activity: InsertActivity): Promise<Activity>;
  listRecentActivities(limit: number): Promise<Activity[]>;
  
  // Task management
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  listTasksByAssignee(userId: number): Promise<Task[]>;
  listUpcomingTasks(limit: number): Promise<Task[]>;
  
  // Risk categories
  getRiskCategory(id: number): Promise<RiskCategory | undefined>;
  createRiskCategory(category: InsertRiskCategory): Promise<RiskCategory>;
  listRiskCategories(): Promise<RiskCategory[]>;
  
  // Compliance metrics
  getCurrentComplianceMetrics(): Promise<ComplianceMetric | undefined>;
  createComplianceMetrics(metrics: InsertComplianceMetric): Promise<ComplianceMetric>;
  getComplianceHistory(months: number): Promise<ComplianceMetric[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private suppliers: Map<number, Supplier>;
  private documents: Map<number, Document>;
  private activities: Map<number, Activity>;
  private tasks: Map<number, Task>;
  private riskCategories: Map<number, RiskCategory>;
  private complianceMetrics: Map<number, ComplianceMetric>;
  
  private userIdCounter: number;
  private supplierIdCounter: number;
  private documentIdCounter: number;
  private activityIdCounter: number;
  private taskIdCounter: number;
  private riskCategoryIdCounter: number;
  private complianceMetricIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.suppliers = new Map();
    this.documents = new Map();
    this.activities = new Map();
    this.tasks = new Map();
    this.riskCategories = new Map();
    this.complianceMetrics = new Map();
    
    this.userIdCounter = 1;
    this.supplierIdCounter = 1;
    this.documentIdCounter = 1;
    this.activityIdCounter = 1;
    this.taskIdCounter = 1;
    this.riskCategoryIdCounter = 1;
    this.complianceMetricIdCounter = 1;
    
    // Initialize with admin user
    this.createUser({
      username: "admin",
      password: "password123",
      email: "admin@example.com",
      fullName: "Admin User",
    });
    
    // Initialize demo data
    this.initializeDemoData();
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      role: "user", 
      avatar: undefined,
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Supplier methods
  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }
  
  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.supplierIdCounter++;
    const now = new Date();
    const supplier: Supplier = { ...insertSupplier, id, lastUpdated: now };
    this.suppliers.set(id, supplier);
    return supplier;
  }
  
  async updateSupplier(id: number, updateData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier) {
      return undefined;
    }
    
    const updatedSupplier: Supplier = {
      ...supplier,
      ...updateData,
      lastUpdated: new Date()
    };
    
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }
  
  async listSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }
  
  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const now = new Date();
    const document: Document = { 
      ...insertDocument, 
      id, 
      uploadedAt: now 
    };
    this.documents.set(id, document);
    return document;
  }
  
  async listDocumentsBySupplier(supplierId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.supplierId === supplierId
    );
  }
  
  async listDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }
  
  // Activity methods
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      timestamp: now 
    };
    this.activities.set(id, activity);
    return activity;
  }
  
  async listRecentActivities(limit: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const now = new Date();
    const task: Task = { 
      ...insertTask, 
      id, 
      completed: false, 
      createdAt: now 
    };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, updateData: Partial<InsertTask> & { completed?: boolean }): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) {
      return undefined;
    }
    
    const updatedTask: Task = {
      ...task,
      ...updateData
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async listTasksByAssignee(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.assignedTo === userId
    );
  }
  
  async listUpcomingTasks(limit: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => !task.completed)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      })
      .slice(0, limit);
  }
  
  // Risk category methods
  async getRiskCategory(id: number): Promise<RiskCategory | undefined> {
    return this.riskCategories.get(id);
  }
  
  async createRiskCategory(insertCategory: InsertRiskCategory): Promise<RiskCategory> {
    const id = this.riskCategoryIdCounter++;
    const category: RiskCategory = { ...insertCategory, id };
    this.riskCategories.set(id, category);
    return category;
  }
  
  async listRiskCategories(): Promise<RiskCategory[]> {
    return Array.from(this.riskCategories.values());
  }
  
  // Compliance metrics methods
  async getCurrentComplianceMetrics(): Promise<ComplianceMetric | undefined> {
    const metrics = Array.from(this.complianceMetrics.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    return metrics.length > 0 ? metrics[0] : undefined;
  }
  
  async createComplianceMetrics(insertMetrics: InsertComplianceMetric): Promise<ComplianceMetric> {
    const id = this.complianceMetricIdCounter++;
    const now = new Date();
    const metrics: ComplianceMetric = { ...insertMetrics, id, date: now };
    this.complianceMetrics.set(id, metrics);
    return metrics;
  }
  
  async getComplianceHistory(months: number): Promise<ComplianceMetric[]> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - months);
    
    return Array.from(this.complianceMetrics.values())
      .filter(metric => metric.date.getTime() >= startDate.getTime())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  // Initialize demo data
  private initializeDemoData() {
    // Risk categories
    const riskCategories = [
      { name: "Environmental", score: 68, color: "#ffc700" },
      { name: "Social", score: 82, color: "#50cd89" },
      { name: "Governance", score: 59, color: "#f1416c" },
      { name: "Deforestation", score: 76, color: "#009ef7" }
    ];
    
    riskCategories.forEach(category => {
      this.createRiskCategory(category);
    });
    
    // Suppliers
    const suppliers = [
      { name: "EcoFarm Industries", products: "Coffee, Cocoa", category: "Tier 1", status: "Compliant", riskLevel: "Low", riskScore: 85 },
      { name: "Tropical Harvest Ltd", products: "Palm Oil", category: "Tier 1", status: "Pending Review", riskLevel: "Medium", riskScore: 65 },
      { name: "Global Forestry Co.", products: "Timber, Rubber", category: "Tier 2", status: "Non-Compliant", riskLevel: "High", riskScore: 30 },
      { name: "Natural Nutrients Inc.", products: "Soy, Corn", category: "Tier 1", status: "Compliant", riskLevel: "Low", riskScore: 90 }
    ];
    
    suppliers.forEach(supplier => {
      this.createSupplier(supplier);
    });
    
    // Documents
    const documents = [
      { title: "EcoFarm Certificate", supplierId: 1, status: "Valid", uploadedBy: 1, documentType: "Certification" },
      { title: "Tropical Harvest Audit", supplierId: 2, status: "Pending", uploadedBy: 1, documentType: "Audit" },
      { title: "Global Forestry Assessment", supplierId: 3, status: "Expired", uploadedBy: 1, documentType: "Assessment" },
      { title: "Natural Nutrients Compliance", supplierId: 4, status: "Valid", uploadedBy: 1, documentType: "Compliance" }
    ];
    
    documents.forEach(document => {
      this.createDocument({
        ...document,
        filePath: undefined,
        expiresAt: undefined
      });
    });
    
    // Tasks
    const now = new Date();
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);
    
    const inThreeDays = new Date(now);
    inThreeDays.setDate(now.getDate() + 3);
    
    const inFiveDays = new Date(now);
    inFiveDays.setDate(now.getDate() + 5);
    
    const tasks = [
      { 
        title: "Review supplier documentation for Global Forestry Co.", 
        description: "Complete review of missing documentation", 
        assignedTo: 1, 
        dueDate: twoDaysAgo, 
        status: "overdue", 
        priority: "high" 
      },
      { 
        title: "Schedule risk assessment meeting with Tropical Harvest", 
        description: "Arrange meeting to discuss risk factors", 
        assignedTo: 1, 
        dueDate: now, 
        status: "pending", 
        priority: "medium" 
      },
      { 
        title: "Prepare quarterly compliance report for executive team", 
        description: "Create comprehensive report of compliance status", 
        assignedTo: 1, 
        dueDate: inThreeDays, 
        status: "pending", 
        priority: "medium" 
      },
      { 
        title: "Update supplier information for EcoFarm Industries", 
        description: "Verify and update all supplier details", 
        assignedTo: 1, 
        dueDate: inFiveDays, 
        status: "pending", 
        priority: "low" 
      }
    ];
    
    tasks.forEach(task => {
      this.createTask(task);
    });
    
    // Activities
    const activities = [
      { 
        type: "document", 
        description: "Supplier certification for EcoFarm Industries uploaded by Jane Smith", 
        userId: 1, 
        entityType: "document", 
        entityId: 1, 
        metadata: null 
      },
      { 
        type: "risk", 
        description: "Risk level for Tropical Harvest Ltd changed from Low to Medium", 
        userId: 1, 
        entityType: "supplier", 
        entityId: 2, 
        metadata: null 
      },
      { 
        type: "compliance", 
        description: "Natural Nutrients Inc. has passed all compliance requirements", 
        userId: 1, 
        entityType: "supplier", 
        entityId: 4, 
        metadata: null 
      },
      { 
        type: "issue", 
        description: "Missing documentation for Global Forestry Co. - action required", 
        userId: 1, 
        entityType: "supplier", 
        entityId: 3, 
        metadata: null 
      }
    ];
    
    // Create activities with staggered timestamps
    const threeHoursAgo = new Date(now);
    threeHoursAgo.setHours(now.getHours() - 3);
    
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(now.getDate() - 1);
    
    const twoDaysAgo2 = new Date(now);
    twoDaysAgo2.setDate(now.getDate() - 2);
    
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);
    
    const timestamps = [threeHoursAgo, oneDayAgo, twoDaysAgo2, threeDaysAgo];
    
    activities.forEach((activity, index) => {
      const activityToCreate = { ...activity };
      const createdActivity = this.createActivity(activityToCreate);
      // Override timestamp for demo data
      createdActivity.timestamp = timestamps[index];
      this.activities.set(createdActivity.id, createdActivity);
    });
    
    // Compliance metrics
    this.createComplianceMetrics({
      overallCompliance: 78,
      documentStatus: 84,
      supplierCompliance: 86,
      riskLevel: "Medium",
      issuesDetected: 17
    });
    
    // Historical compliance data for chart
    const months = 6;
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      // Generate slightly different compliance values for historical data
      const randomFactor = Math.floor(Math.random() * 10) - 5; // Random between -5 and 5
      const historicalCompliance = Math.max(50, Math.min(90, 75 + randomFactor));
      
      const metrics: ComplianceMetric = {
        id: this.complianceMetricIdCounter++,
        date,
        overallCompliance: historicalCompliance,
        documentStatus: Math.max(50, Math.min(90, 80 + randomFactor)),
        supplierCompliance: Math.max(50, Math.min(90, 82 + randomFactor)),
        riskLevel: historicalCompliance > 75 ? "Low" : "Medium",
        issuesDetected: Math.floor(20 - (historicalCompliance / 5))
      };
      
      this.complianceMetrics.set(metrics.id, metrics);
    }
  }
}

export const storage = new MemStorage();
