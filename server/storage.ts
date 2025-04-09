import {
  users, type User, type InsertUser,
  suppliers, type Supplier, type InsertSupplier,
  customers, type Customer, type InsertCustomer,
  declarations, type Declaration, type InsertDeclaration,
  documents, type Document, type InsertDocument,
  activities, type Activity, type InsertActivity,
  tasks, type Task, type InsertTask,
  riskCategories, type RiskCategory, type InsertRiskCategory,
  complianceMetrics, type ComplianceMetric, type InsertComplianceMetric,
  saqs, type Saq, type InsertSaq
} from "@shared/schema";

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
  
  // Customer management
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  listCustomers(status?: string): Promise<Customer[]>;
  getCustomerStats(): Promise<{ total: number, active: number, inactive: number }>;
  
  // Declaration management
  getDeclaration(id: number): Promise<Declaration | undefined>;
  createDeclaration(declaration: InsertDeclaration): Promise<Declaration>;
  updateDeclaration(id: number, declaration: Partial<InsertDeclaration>): Promise<Declaration | undefined>;
  listDeclarations(type?: string): Promise<Declaration[]>;
  listDeclarationsBySupplier(supplierId: number): Promise<Declaration[]>;
  listDeclarationsByCustomer(customerId: number): Promise<Declaration[]>;
  getDeclarationStats(): Promise<{ total: number, inbound: number, outbound: number, approved: number, pending: number, review: number, rejected: number }>;
  
  // Document management
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  listDocumentsBySupplier(supplierId: number): Promise<Document[]>;
  listDocumentsByCustomer(customerId: number): Promise<Document[]>;
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

  // Self-Assessment Questionnaires (SAQs)
  getSaq(id: number): Promise<Saq | undefined>;
  createSaq(saq: InsertSaq): Promise<Saq>;
  updateSaq(id: number, saq: Partial<InsertSaq>): Promise<Saq | undefined>;
  listSaqsBySupplier(supplierId: number, status?: string): Promise<Saq[]>;
  listSaqsByCustomer(customerId: number): Promise<Saq[]>;
  getSaqStats(supplierId: number): Promise<{ total: number, pending: number, inProgress: number, completed: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private suppliers: Map<number, Supplier>;
  private customers: Map<number, Customer>;
  private declarations: Map<number, Declaration>;
  private documents: Map<number, Document>;
  private activities: Map<number, Activity>;
  private tasks: Map<number, Task>;
  private riskCategories: Map<number, RiskCategory>;
  private complianceMetrics: Map<number, ComplianceMetric>;
  
  private userIdCounter: number;
  private supplierIdCounter: number;
  private customerIdCounter: number;
  private declarationIdCounter: number;
  private documentIdCounter: number;
  private activityIdCounter: number;
  private taskIdCounter: number;
  private riskCategoryIdCounter: number;
  private complianceMetricIdCounter: number;
  private saqIdCounter: number;
  private saqs: Map<number, Saq>;
  
  constructor() {
    this.users = new Map();
    this.suppliers = new Map();
    this.customers = new Map();
    this.declarations = new Map();
    this.documents = new Map();
    this.activities = new Map();
    this.tasks = new Map();
    this.riskCategories = new Map();
    this.complianceMetrics = new Map();
    this.saqs = new Map();
    
    this.userIdCounter = 1;
    this.supplierIdCounter = 1;
    this.customerIdCounter = 1;
    this.declarationIdCounter = 1;
    this.documentIdCounter = 1;
    this.activityIdCounter = 1;
    this.taskIdCounter = 1;
    this.riskCategoryIdCounter = 1;
    this.complianceMetricIdCounter = 1;
    this.saqIdCounter = 1;
    
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
  
  // Customer methods
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(
      (customer) => customer.email === email,
    );
  }
  
  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.customerIdCounter++;
    const now = new Date();
    const customer: Customer = {
      ...insertCustomer,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.customers.set(id, customer);
    return customer;
  }
  
  async updateCustomer(id: number, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) {
      return undefined;
    }
    
    const updatedCustomer: Customer = {
      ...customer,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async listCustomers(status?: string): Promise<Customer[]> {
    let customers = Array.from(this.customers.values());
    
    if (status && status !== "all") {
      customers = customers.filter(customer => customer.status === status);
    }
    
    return customers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async listDeclarationsByCustomer(customerId: number): Promise<Declaration[]> {
    return Array.from(this.declarations.values())
      .filter(declaration => declaration.customerId === customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async listDocumentsByCustomer(customerId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.customerId === customerId
    );
  }
  
  async getCustomerStats(): Promise<{ total: number, active: number, inactive: number }> {
    const customers = Array.from(this.customers.values());
    
    return {
      total: customers.length,
      active: customers.filter(c => c.status === "active").length,
      inactive: customers.filter(c => c.status !== "active").length
    };
  }
  
  // Declaration methods
  async getDeclaration(id: number): Promise<Declaration | undefined> {
    return this.declarations.get(id);
  }
  
  async createDeclaration(insertDeclaration: InsertDeclaration): Promise<Declaration> {
    const id = this.declarationIdCounter++;
    const now = new Date();
    const declaration: Declaration = { 
      ...insertDeclaration, 
      id, 
      createdAt: now,
      lastUpdated: now
    };
    this.declarations.set(id, declaration);
    return declaration;
  }
  
  async updateDeclaration(id: number, updateData: Partial<InsertDeclaration>): Promise<Declaration | undefined> {
    const declaration = this.declarations.get(id);
    if (!declaration) {
      return undefined;
    }
    
    const updatedDeclaration: Declaration = {
      ...declaration,
      ...updateData,
      lastUpdated: new Date()
    };
    
    this.declarations.set(id, updatedDeclaration);
    return updatedDeclaration;
  }
  
  async listDeclarations(type?: string): Promise<Declaration[]> {
    let declarations = Array.from(this.declarations.values());
    
    if (type && type !== "all") {
      declarations = declarations.filter(declaration => declaration.type === type);
    }
    
    return declarations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async listDeclarationsBySupplier(supplierId: number): Promise<Declaration[]> {
    return Array.from(this.declarations.values())
      .filter(declaration => declaration.supplierId === supplierId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getDeclarationStats(): Promise<{ total: number, inbound: number, outbound: number, approved: number, pending: number, review: number, rejected: number }> {
    const declarations = Array.from(this.declarations.values());
    
    return {
      total: declarations.length,
      inbound: declarations.filter(d => d.type === "inbound").length,
      outbound: declarations.filter(d => d.type === "outbound").length,
      approved: declarations.filter(d => d.status === "approved").length,
      pending: declarations.filter(d => d.status === "pending").length,
      review: declarations.filter(d => d.status === "review").length,
      rejected: declarations.filter(d => d.status === "rejected").length
    };
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
  
  // SAQ methods
  async getSaq(id: number): Promise<Saq | undefined> {
    return this.saqs.get(id);
  }
  
  async createSaq(insertSaq: InsertSaq): Promise<Saq> {
    const id = this.saqIdCounter++;
    const now = new Date();
    const saq: Saq = { 
      ...insertSaq, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.saqs.set(id, saq);
    return saq;
  }
  
  async updateSaq(id: number, updateData: Partial<InsertSaq>): Promise<Saq | undefined> {
    const saq = this.saqs.get(id);
    if (!saq) {
      return undefined;
    }
    
    const updatedSaq: Saq = {
      ...saq,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.saqs.set(id, updatedSaq);
    return updatedSaq;
  }
  
  async listSaqsBySupplier(supplierId: number, status?: string): Promise<Saq[]> {
    let saqs = Array.from(this.saqs.values())
      .filter(saq => saq.supplierId === supplierId);
    
    if (status) {
      saqs = saqs.filter(saq => saq.status === status);
    }
    
    return saqs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async listSaqsByCustomer(customerId: number): Promise<Saq[]> {
    return Array.from(this.saqs.values())
      .filter(saq => saq.customerId === customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getSaqStats(supplierId: number): Promise<{ total: number, pending: number, inProgress: number, completed: number }> {
    const saqs = Array.from(this.saqs.values())
      .filter(saq => saq.supplierId === supplierId);
    
    return {
      total: saqs.length,
      pending: saqs.filter(s => s.status === "pending").length,
      inProgress: saqs.filter(s => s.status === "in-progress").length,
      completed: saqs.filter(s => s.status === "completed").length
    };
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
      { 
        name: "EcoFarm Industries", 
        products: "Coffee, Cocoa", 
        category: "Tier 1", 
        status: "Compliant", 
        riskLevel: "Low", 
        riskScore: 85,
        country: "Colombia",
        registrationNumber: "REGCOL1234567",
        contactPerson: "Maria Rodriguez",
        email: "maria@ecofarm.example",
        phone: "+571234567890",
        complianceScore: 92
      },
      { 
        name: "Tropical Harvest Ltd", 
        products: "Palm Oil", 
        category: "Tier 1", 
        status: "Pending Review", 
        riskLevel: "Medium", 
        riskScore: 65,
        country: "Indonesia",
        registrationNumber: "REGIDN7654321",
        contactPerson: "Budi Santoso",
        email: "budi@tropical.example",
        phone: "+62123456789",
        complianceScore: 78
      },
      { 
        name: "Global Forestry Co.", 
        products: "Timber, Rubber", 
        category: "Tier 2", 
        status: "Non-Compliant", 
        riskLevel: "High", 
        riskScore: 30,
        country: "Brazil",
        registrationNumber: "REGBRA9876543",
        contactPerson: "Carlos Silva",
        email: "carlos@globalforestry.example",
        phone: "+5521987654321",
        complianceScore: 45
      },
      { 
        name: "Natural Nutrients Inc.", 
        products: "Soy, Corn", 
        category: "Tier 1", 
        status: "Compliant", 
        riskLevel: "Low", 
        riskScore: 90,
        country: "USA",
        registrationNumber: "REGUSA1122334",
        contactPerson: "Jennifer Adams",
        email: "jennifer@nutrients.example",
        phone: "+1234567890",
        complianceScore: 95
      }
    ];
    
    suppliers.forEach(supplier => {
      this.createSupplier(supplier);
    });
    
    // Customers
    const customers = [
      {
        type: "business",
        companyName: "EuroFood Retailers GmbH",
        firstName: "Hans",
        lastName: "Mueller",
        displayName: "EuroFood Retailers GmbH",
        email: "h.mueller@eurofood.example",
        workPhone: "+49987654321",
        mobilePhone: "+49123456789",
        
        billingAttention: "Accounts Department",
        billingCountry: "Germany",
        billingAddressLine1: "Europaallee 10",
        billingAddressLine2: "",
        billingCity: "Berlin",
        billingState: "Berlin",
        billingPostalCode: "10115",
        
        sameAsBilling: true,
        
        gstTreatment: "registered",
        placeOfSupply: "Berlin",
        taxPreference: "taxable",
        currency: "EUR",
        paymentTerms: "net30",
        enablePortal: true,
        portalLanguage: "german",
        
        complianceScore: 92,
        status: "active"
      },
      {
        type: "business",
        companyName: "Green Planet Distribution",
        firstName: "Emma",
        lastName: "Johnson",
        displayName: "Green Planet Distribution",
        email: "e.johnson@greenplanet.example",
        workPhone: "+441234567890",
        mobilePhone: "+447890123456",
        
        billingAttention: "Finance Department",
        billingCountry: "United Kingdom",
        billingAddressLine1: "72 Eco Street",
        billingAddressLine2: "Suite 401",
        billingCity: "London",
        billingState: "Greater London",
        billingPostalCode: "EC1V 7YY",
        
        sameAsBilling: true,
        
        gstTreatment: "registered",
        placeOfSupply: "London",
        taxPreference: "taxable",
        currency: "GBP",
        paymentTerms: "net15",
        enablePortal: true,
        portalLanguage: "english",
        
        complianceScore: 87,
        status: "active"
      },
      {
        type: "business",
        companyName: "Organic Foods Co.",
        firstName: "Robert",
        lastName: "Davis",
        displayName: "Organic Foods Co.",
        email: "r.davis@organicfoods.example",
        workPhone: "+15556667777",
        mobilePhone: "+15551112222",
        
        billingAttention: "Accounts Receivable",
        billingCountry: "United States",
        billingAddressLine1: "450 Green Avenue",
        billingAddressLine2: "",
        billingCity: "Portland",
        billingState: "Oregon",
        billingPostalCode: "97201",
        
        sameAsBilling: false,
        shippingAttention: "Warehouse Manager",
        shippingCountry: "United States",
        shippingAddressLine1: "789 Distribution Way",
        shippingAddressLine2: "",
        shippingCity: "Portland",
        shippingState: "Oregon",
        shippingPostalCode: "97230",
        
        gstTreatment: "registered",
        placeOfSupply: "Oregon",
        taxPreference: "taxable",
        currency: "USD",
        paymentTerms: "net30",
        enablePortal: true,
        portalLanguage: "english",
        
        complianceScore: 94,
        status: "active"
      },
      {
        type: "business",
        companyName: "Nordic Eco Markets AB",
        firstName: "Elsa",
        lastName: "Johansson",
        displayName: "Nordic Eco Markets AB",
        email: "e.johansson@nordicmarkets.example",
        workPhone: "+46123456789",
        mobilePhone: "+46987654321",
        
        billingAttention: "Finance Department",
        billingCountry: "Sweden",
        billingAddressLine1: "Kungsgatan 25",
        billingAddressLine2: "Floor 4",
        billingCity: "Stockholm",
        billingState: "Stockholm County",
        billingPostalCode: "11156",
        
        sameAsBilling: true,
        
        gstTreatment: "registered",
        placeOfSupply: "Stockholm",
        taxPreference: "taxable",
        currency: "SEK",
        paymentTerms: "net15",
        enablePortal: true,
        portalLanguage: "english",
        
        complianceScore: 88,
        status: "active"
      },
      {
        type: "business",
        companyName: "Mediterra Foods SpA",
        firstName: "Marco",
        lastName: "Rossi",
        displayName: "Mediterra Foods SpA",
        email: "m.rossi@mediterra.example",
        workPhone: "+39123456789",
        mobilePhone: "+39987654321",
        
        billingAttention: "Administrative Office",
        billingCountry: "Italy",
        billingAddressLine1: "Via Roma 45",
        billingAddressLine2: "",
        billingCity: "Milan",
        billingState: "Lombardy",
        billingPostalCode: "20121",
        
        sameAsBilling: false,
        shippingAttention: "Warehouse Manager",
        shippingCountry: "Italy",
        shippingAddressLine1: "Via Industriale 87",
        shippingAddressLine2: "",
        shippingCity: "Milan",
        shippingState: "Lombardy",
        shippingPostalCode: "20126",
        
        gstTreatment: "registered",
        placeOfSupply: "Milan",
        taxPreference: "taxable",
        currency: "EUR",
        paymentTerms: "net30",
        enablePortal: false,
        portalLanguage: "italian",
        
        complianceScore: 76,
        status: "pending"
      },
      {
        type: "business",
        companyName: "Iberia Gourmet Ltd",
        firstName: "Sofia",
        lastName: "Martinez",
        displayName: "Iberia Gourmet Ltd",
        email: "s.martinez@iberiagourmet.example",
        workPhone: "+34123456789",
        mobilePhone: "+34987654321",
        
        billingAttention: "Finance Office",
        billingCountry: "Spain",
        billingAddressLine1: "Calle Mayor 28",
        billingAddressLine2: "Floor 3",
        billingCity: "Madrid",
        billingState: "Community of Madrid",
        billingPostalCode: "28013",
        
        sameAsBilling: true,
        
        gstTreatment: "registered",
        placeOfSupply: "Madrid",
        taxPreference: "taxable",
        currency: "EUR",
        paymentTerms: "net45",
        enablePortal: true,
        portalLanguage: "spanish",
        
        complianceScore: 42,
        status: "active"
      }
    ];
    
    customers.forEach(customer => {
      this.createCustomer(customer);
    });

    // Declarations
    const currentDate = new Date();
    const oneMonthAgo = new Date(currentDate);
    oneMonthAgo.setMonth(currentDate.getMonth() - 1);
    
    const twoMonthsAgo = new Date(currentDate);
    twoMonthsAgo.setMonth(currentDate.getMonth() - 2);
    
    const threeMonthsAgo = new Date(currentDate);
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
    
    const oneWeekAgo = new Date(currentDate);
    oneWeekAgo.setDate(currentDate.getDate() - 7);
    
    const twoWeeksAgo = new Date(currentDate);
    twoWeeksAgo.setDate(currentDate.getDate() - 14);
    
    const declarations = [
      // INBOUND DECLARATIONS
      { 
        type: "inbound", 
        supplierId: 1, 
        productName: "Arabica Coffee Beans", 
        productDescription: "Shade-grown coffee beans from Guatemala highlands", 
        hsnCode: "0901.21.00", 
        quantity: 2500, 
        unit: "kg", 
        status: "approved", 
        riskLevel: "low", 
        startDate: threeMonthsAgo, 
        endDate: oneMonthAgo, 
        createdBy: 1,
        industry: "Food & Beverage",
        complianceStatus: "compliant"
      },
      { 
        type: "inbound", 
        supplierId: 2, 
        productName: "Crude Palm Oil", 
        productDescription: "Unrefined palm oil from sustainable plantations", 
        hsnCode: "1511.10.00", 
        quantity: 15000, 
        unit: "liters", 
        status: "review", 
        riskLevel: "medium", 
        startDate: oneMonthAgo, 
        endDate: null, 
        createdBy: 1,
        industry: "Agriculture",
        complianceStatus: "non-compliant"
      },
      { 
        type: "inbound", 
        supplierId: 3, 
        productName: "Tropical Hardwood", 
        productDescription: "FSC-certified mahogany timber", 
        hsnCode: "4407.21.00", 
        quantity: 85, 
        unit: "m³", 
        status: "rejected", 
        riskLevel: "high", 
        startDate: twoMonthsAgo, 
        endDate: null, 
        createdBy: 1,
        industry: "Forestry",
        complianceStatus: "non-compliant-geometry",
        geojsonData: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                name: "Deforested Area 1",
                issue: "Recent deforestation (2022-2023)",
                area_ha: 24.5,
                compliance: "non-compliant"
              },
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [102.0, 0.5],
                  [102.0, 0.6],
                  [102.1, 0.6],
                  [102.1, 0.5],
                  [102.0, 0.5]
                ]]
              }
            },
            {
              type: "Feature",
              properties: {
                name: "Traceability Gap Region",
                issue: "Missing traceability data",
                area_ha: 32.1,
                compliance: "non-compliant"
              },
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [102.2, 0.7],
                  [102.2, 0.8],
                  [102.3, 0.8],
                  [102.3, 0.7],
                  [102.2, 0.7]
                ]]
              }
            },
            {
              type: "Feature",
              properties: {
                name: "Documentation Issue Area",
                issue: "Incomplete documentation",
                area_ha: 18.7,
                compliance: "non-compliant"
              },
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [102.4, 0.9],
                  [102.4, 1.0],
                  [102.5, 1.0],
                  [102.5, 0.9],
                  [102.4, 0.9]
                ]]
              }
            }
          ]
        }
      },
      { 
        type: "inbound", 
        supplierId: 5, 
        productName: "Organic Cocoa Beans", 
        productDescription: "Premium organic cocoa beans from Tanzania", 
        hsnCode: "1801.00.00", 
        quantity: 3000, 
        unit: "kg", 
        status: "pending", 
        riskLevel: "medium", 
        startDate: oneWeekAgo, 
        endDate: null, 
        createdBy: 1,
        industry: "Food & Beverage",
        complianceStatus: "compliant"
      },
      { 
        type: "inbound", 
        supplierId: 6, 
        productName: "Natural Rubber", 
        productDescription: "Sustainably harvested rubber for industrial use", 
        hsnCode: "4001.21.00", 
        quantity: 8500, 
        unit: "kg", 
        status: "approved", 
        riskLevel: "low", 
        startDate: twoWeeksAgo, 
        endDate: oneWeekAgo, 
        createdBy: 1,
        industry: "Agriculture",
        complianceStatus: "compliant"
      },
      { 
        type: "inbound", 
        supplierId: 2, 
        productName: "Palm Kernel Oil", 
        productDescription: "Cold-pressed palm kernel oil", 
        hsnCode: "1513.21.00", 
        quantity: 7500, 
        unit: "liters", 
        status: "rejected", 
        riskLevel: "high", 
        startDate: oneMonthAgo, 
        endDate: null, 
        createdBy: 1,
        industry: "Agriculture",
        complianceStatus: "non-compliant-geometry"
      },
      
      // OUTBOUND DECLARATIONS
      { 
        type: "outbound", 
        supplierId: 1, 
        productName: "Roasted Coffee Blend", 
        productDescription: "Medium roast coffee blend for export", 
        hsnCode: "0901.22.00", 
        quantity: 1800, 
        unit: "kg", 
        status: "pending", 
        riskLevel: "medium", 
        startDate: twoMonthsAgo, 
        endDate: null, 
        createdBy: 1,
        industry: "Food & Beverage",
        complianceStatus: "compliant"
      },
      { 
        type: "outbound", 
        supplierId: 4, 
        productName: "Organic Soy Protein", 
        productDescription: "Plant-based protein isolate", 
        hsnCode: "2106.10.00", 
        quantity: 5000, 
        unit: "kg", 
        status: "approved", 
        riskLevel: "low", 
        startDate: threeMonthsAgo, 
        endDate: null, 
        createdBy: 1,
        industry: "Agriculture",
        complianceStatus: "compliant"
      },
      { 
        type: "outbound", 
        supplierId: 3, 
        productName: "Hardwood Furniture Components", 
        productDescription: "Processed hardwood for furniture manufacturing", 
        hsnCode: "4407.29.00", 
        quantity: 42, 
        unit: "m³", 
        status: "review", 
        riskLevel: "medium", 
        startDate: twoWeeksAgo, 
        endDate: null, 
        createdBy: 1,
        industry: "Forestry",
        complianceStatus: "non-compliant"
      },
      { 
        type: "outbound", 
        supplierId: 5, 
        productName: "Chocolate Products", 
        productDescription: "Organic chocolate bars and confections", 
        hsnCode: "1806.32.00", 
        quantity: 1200, 
        unit: "kg", 
        status: "approved", 
        riskLevel: "low", 
        startDate: oneMonthAgo, 
        endDate: oneWeekAgo, 
        createdBy: 1,
        industry: "Food & Beverage",
        complianceStatus: "compliant"
      },
      { 
        type: "outbound", 
        supplierId: 6, 
        productName: "Rubber Gaskets", 
        productDescription: "Industrial rubber components", 
        hsnCode: "4016.93.00", 
        quantity: 25000, 
        unit: "pcs", 
        status: "pending", 
        riskLevel: "medium", 
        startDate: oneWeekAgo, 
        endDate: null, 
        createdBy: 1,
        industry: "Manufacturing",
        complianceStatus: "non-compliant-geometry"
      }
    ];
    
    declarations.forEach(declaration => {
      this.createDeclaration(declaration);
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
    
    // Self-Assessment Questionnaires
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const oneMonthAgo2 = new Date();
    oneMonthAgo2.setMonth(oneMonthAgo2.getMonth() - 1);
    
    const saqData = [
      { 
        title: "Annual Deforestation Risk Assessment",
        description: "Annual self-assessment questionnaire for deforestation risk in your supply chain",
        supplierId: 1,
        customerId: 2,
        status: "completed",
        completedAt: twoWeeksAgo,
        score: 87,
        answers: JSON.stringify({
          supplyChainMappingComplete: true,
          documentationVerified: true,
          riskAssessmentConducted: true,
          mitigationMeasuresImplemented: true,
          certificationStatus: "Certified",
          monitoringSystemImplemented: true,
          traceabilityVerified: "Full",
          dueDate: "2025-05-15",
          productCategory: "Coffee",
          geographicSource: "Guatemala, Colombia",
          conversionMeasures: "No conversion of natural forests",
          peatlandManagement: "Not applicable",
          forestPreservationRating: 4,
          supplierTrainingPrograms: "Yes, twice annually",
          thirdPartyAudits: "Verified by Rainforest Alliance"
        })
      },
      { 
        title: "EUDR Compliance Self-Declaration",
        description: "Self-assessment of compliance with EU Deforestation Regulation requirements",
        supplierId: 1,
        customerId: 3,
        status: "completed",
        completedAt: oneMonthAgo2,
        score: 92,
        answers: JSON.stringify({
          coordinateBasedMapping: true,
          legalityVerification: true,
          dueDataCollection: true,
          riskAnalysis: true,
          mitigationSteps: true,
          geolocationData: "Available for 92% of production areas",
          tracingSystem: "Blockchain-based traceability system",
          certifications: "Rainforest Alliance, Organic, Fair Trade",
          landRightsVerification: "Documented land ownership with local authority verification",
          indigenousConsultation: "Full FPIC process documented",
          deforestationProtocols: "Zero deforestation commitment with satellite monitoring",
          laborPractices: "Living wage certification and third-party labor audits",
          grievanceMechanism: "Anonymous hotline and third-party verification"
        })
      },
      { 
        title: "Supplier Sustainability Assessment",
        description: "Annual assessment of overall sustainability practices",
        supplierId: 2,
        customerId: 1,
        status: "in-progress",
        completedAt: null,
        score: null,
        answers: JSON.stringify({
          environmentalPolicy: true,
          emissionsTracking: "Partial",
          wasteManagement: "Implementing circular economy principles",
          waterUsage: "Monitoring in place, 15% reduction target",
          energyEfficiency: "Solar panels installed in 30% of facilities",
          biodiversityProtection: "Buffer zones established around production areas",
          chemicalUsage: "Reducing with organic alternatives",
          currentChallenges: "Transitioning to fully organic production"
        })
      },
      { 
        title: "Social Compliance Questionnaire",
        description: "Assessment of labor practices and social responsibility",
        supplierId: 1,
        customerId: 4,
        status: "pending",
        completedAt: null,
        score: null,
        answers: null
      }
    ];
    
    saqData.forEach(saqItem => {
      this.createSaq(saqItem);
    });
  }
}

export const storage = new MemStorage();
