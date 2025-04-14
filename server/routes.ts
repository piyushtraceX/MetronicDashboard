import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertSupplierSchema, insertDocumentSchema, insertTaskSchema, insertDeclarationSchema, insertSaqSchema, insertCustomerSchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "eudr-compliance-app-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' },
    store: new SessionStore({ checkPeriod: 86400000 }) // Cleanup expired sessions every 24h
  }));
  
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure passport local strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Invalid username" });
      }
      
      // In a real app, you'd use bcrypt.compare here
      if (user.password !== password) {
        return done(null, false, { message: "Invalid password" });
      }
      
      // Remove password before sending to client
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  }));
  
  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      
      // Remove password before sending to client
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });
  
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Auth routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });
  
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.json({ success: true });
    });
  });
  
  app.get("/api/auth/user", (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userInput = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(userInput.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userInput.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      // In a real app, you'd hash the password here
      const newUser = await storage.createUser(userInput);
      
      // Remove password before sending response
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });
  
  // Dashboard data routes
  app.get("/api/dashboard", async (req, res) => {
    try {
      console.log("Fetching dashboard data...");
      
      // Fetch each piece of data separately to isolate any issues
      let currentMetrics, riskCategories, recentActivities, upcomingTasks, suppliers;
      
      try {
        currentMetrics = await storage.getCurrentComplianceMetrics();
        console.log("Current metrics:", currentMetrics ? "found" : "not found");
      } catch (e) {
        console.error("Error fetching metrics:", e);
        currentMetrics = null;
      }
      
      try {
        riskCategories = await storage.listRiskCategories();
        console.log("Risk categories:", riskCategories?.length || 0);
      } catch (e) {
        console.error("Error fetching risk categories:", e);
        riskCategories = [];
      }
      
      try {
        recentActivities = await storage.listRecentActivities(4);
        console.log("Recent activities:", recentActivities?.length || 0);
      } catch (e) {
        console.error("Error fetching activities:", e);
        recentActivities = [];
      }
      
      try {
        upcomingTasks = await storage.listUpcomingTasks(4);
        console.log("Upcoming tasks:", upcomingTasks?.length || 0);
      } catch (e) {
        console.error("Error fetching tasks:", e);
        upcomingTasks = [];
      }
      
      try {
        suppliers = await storage.listSuppliers();
        console.log("Suppliers:", suppliers?.length || 0);
      } catch (e) {
        console.error("Error fetching suppliers:", e);
        suppliers = [];
      }
      
      // Construct response object with fallbacks for any missing data
      const responseData = {
        metrics: currentMetrics || {
          overallCompliance: 75,
          documentStatus: 80,
          supplierCompliance: 70,
          riskLevel: "Medium",
          issuesDetected: 12,
          date: new Date()
        },
        riskCategories: riskCategories || [],
        recentActivities: recentActivities || [],
        upcomingTasks: upcomingTasks || [],
        suppliers: (suppliers || []).slice(0, 4) // Limit to 4 suppliers for dashboard
      };
      
      console.log("Dashboard data prepared successfully");
      res.json(responseData);
    } catch (error) {
      console.error("Error in dashboard endpoint:", error);
      res.status(500).json({ message: "Error fetching dashboard data" });
    }
  });
  
  // Compliance history data for chart
  app.get("/api/compliance/history", async (req, res) => {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const history = await storage.getComplianceHistory(months);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching compliance history" });
    }
  });
  
  // Supplier routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.listSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching suppliers" });
    }
  });
  
  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Error fetching supplier" });
    }
  });
  
  app.get("/api/suppliers/stats", async (req, res) => {
    try {
      // Count suppliers by status
      const suppliers = await storage.listSuppliers();
      const total = suppliers.length;
      const active = suppliers.filter(s => s.status === 'active').length;
      const inactive = suppliers.filter(s => s.status === 'inactive').length;
      const pending = suppliers.filter(s => s.status === 'pending').length;
      
      res.json({
        total,
        active,
        inactive,
        pending
      });
    } catch (error) {
      console.error("Error fetching supplier stats:", error);
      res.status(500).json({ message: "Error fetching supplier statistics" });
    }
  });
  
  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplierInput = insertSupplierSchema.partial().parse(req.body);
      
      const supplier = await storage.getSupplier(id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      const updatedSupplier = await storage.updateSupplier(id, supplierInput);
      
      // Create activity record
      await storage.createActivity({
        type: "supplier",
        description: `Supplier ${supplier.name} was updated`,
        userId: 1, // Would use req.user.id in a real app
        entityType: "supplier",
        entityId: id,
        metadata: null
      });
      
      res.json(updatedSupplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error updating supplier:", error);
        res.status(500).json({ message: "Error updating supplier" });
      }
    }
  });
  
  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierInput = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierInput);
      
      // Create activity record
      await storage.createActivity({
        type: "supplier",
        description: `New supplier ${supplier.name} was added`,
        userId: 1, // Mock user ID
        entityType: "supplier",
        entityId: supplier.id,
        metadata: null
      });
      
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating supplier" });
      }
    }
  });
  
  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplierInput = insertSupplierSchema.partial().parse(req.body);
      
      const updatedSupplier = await storage.updateSupplier(id, supplierInput);
      
      if (!updatedSupplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      // Create activity record
      await storage.createActivity({
        type: "supplier",
        description: `Supplier ${updatedSupplier.name} was updated`,
        userId: 1, // Mock user ID
        entityType: "supplier",
        entityId: updatedSupplier.id,
        metadata: null
      });
      
      res.json(updatedSupplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating supplier" });
      }
    }
  });
  
  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.listDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching documents" });
    }
  });
  
  app.get("/api/suppliers/:id/documents", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const documents = await storage.listDocumentsBySupplier(supplierId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching supplier documents" });
    }
  });
  
  app.post("/api/documents", async (req, res) => {
    try {
      const documentInput = insertDocumentSchema.parse(req.body);
      
      // Set uploaded by to mock user
      documentInput.uploadedBy = 1;
      
      const document = await storage.createDocument(documentInput);
      
      // Create activity record
      await storage.createActivity({
        type: "document",
        description: `Document ${document.title} was uploaded`,
        userId: 1, // Mock user ID
        entityType: "document",
        entityId: document.id,
        metadata: null
      });
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating document" });
      }
    }
  });
  
  // Task routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const userId = 1; // Mock user ID
      const tasks = await storage.listTasksByAssignee(userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tasks" });
    }
  });
  
  app.post("/api/tasks", async (req, res) => {
    try {
      const taskInput = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskInput);
      
      // Create activity record
      await storage.createActivity({
        type: "task",
        description: `New task "${task.title}" was created`,
        userId: 1, // Mock user ID
        entityType: "task",
        entityId: task.id,
        metadata: null
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating task" });
      }
    }
  });
  
  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const taskInput = insertTaskSchema.partial().extend({
        completed: z.boolean().optional()
      }).parse(req.body);
      
      const updatedTask = await storage.updateTask(id, taskInput);
      
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Create activity for task completion
      if (taskInput.completed && updatedTask.completed) {
        await storage.createActivity({
          type: "task",
          description: `Task "${updatedTask.title}" was completed`,
          userId: 1, // Mock user ID
          entityType: "task",
          entityId: updatedTask.id,
          metadata: null
        });
      }
      
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating task" });
      }
    }
  });
  
  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.listRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activities" });
    }
  });
  
  // Declaration routes
  app.get("/api/declarations/stats", async (req, res) => {
    try {
      const stats = await storage.getDeclarationStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching declaration statistics" });
    }
  });
  
  app.get("/api/declarations", async (req, res) => {
    try {
      const type = req.query.type as string || "all"; // "inbound", "outbound", or "all"
      const declarations = await storage.listDeclarations(type);
      
      // Load all suppliers to get their names
      const suppliers = await storage.listSuppliers();
      
      // Load all customers to get their names
      const customers = await storage.listCustomers();
      
      // Create a map of supplier IDs to supplier names for quick lookup
      const supplierMap = new Map();
      suppliers.forEach(supplier => {
        supplierMap.set(supplier.id, supplier.name);
      });
      
      // Create a map of customer IDs to customer names for quick lookup
      const customerMap = new Map();
      customers.forEach(customer => {
        const displayName = customer.displayName || 
                           (customer.companyName || `${customer.firstName} ${customer.lastName}`);
        customerMap.set(customer.id, displayName);
      });
      
      // Add appropriate partner names to declarations based on type
      const enhancedDeclarations = declarations.map(declaration => {
        if (declaration.type === "inbound") {
          return {
            ...declaration,
            supplier: supplierMap.get(declaration.supplierId) || `Supplier ${declaration.supplierId}`,
            partnerName: supplierMap.get(declaration.supplierId) || `Supplier ${declaration.supplierId}`,
            partnerType: "supplier"
          };
        } else {
          // For outbound declarations, use customer name
          const customerId = declaration.customerId || (declaration.id % 4 + 1); // Fallback for existing data
          return {
            ...declaration,
            supplier: supplierMap.get(declaration.supplierId) || `Supplier ${declaration.supplierId}`,
            customer: customerMap.get(customerId) || `Customer ${customerId}`,
            partnerName: customerMap.get(customerId) || `Customer ${customerId}`,
            partnerType: "customer",
            customerId: customerId
          };
        }
      });
      
      res.json(enhancedDeclarations);
    } catch (error) {
      console.error("Error fetching declarations:", error);
      res.status(500).json({ message: "Error fetching declarations" });
    }
  });

  app.get("/api/declarations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const declaration = await storage.getDeclaration(id);
      
      if (!declaration) {
        return res.status(404).json({ message: "Declaration not found" });
      }
      
      if (declaration.type === "inbound") {
        // Get supplier information for inbound declarations
        const supplier = await storage.getSupplier(declaration.supplierId);
        
        // Add supplier name to declaration
        const declarationWithSupplier = {
          ...declaration,
          supplier: supplier ? supplier.name : `Supplier ${declaration.supplierId}`,
          partnerName: supplier ? supplier.name : `Supplier ${declaration.supplierId}`,
          partnerType: "supplier"
        };
        
        return res.json(declarationWithSupplier);
      } else {
        // For outbound declarations, get customer information
        const customerId = declaration.customerId || (declaration.id % 4 + 1); // Fallback for existing data
        const customer = await storage.getCustomer(customerId);
        
        const customerName = customer ? 
          (customer.displayName || customer.companyName || `${customer.firstName} ${customer.lastName}`) : 
          `Customer ${customerId}`;

        // Get supplier information too for completeness
        const supplier = await storage.getSupplier(declaration.supplierId);
        const supplierName = supplier ? supplier.name : `Supplier ${declaration.supplierId}`;
        
        // Add customer name to declaration
        const enhancedDeclaration = {
          ...declaration,
          supplier: supplierName,
          customer: customerName,
          partnerName: customerName, // Using partnerName field for consistent UI
          partnerType: "customer",
          customerPONumber: declaration.id % 2 === 0 ? `PO-${10000 + declaration.id}` : null,
          soNumber: declaration.id % 2 === 0 ? `SO-${20000 + declaration.id}` : null,
          shipmentNumber: declaration.id % 2 === 0 ? `SHM-${30000 + declaration.id}` : null,
          customerId: customerId,
          documents: [
            "Compliance Certificate.pdf",
            "Origin Documentation.pdf",
            declaration.id % 2 === 0 ? "Shipment Manifest.pdf" : null
          ].filter(Boolean),
          hasGeoJSON: !!declaration.geojsonData
        };
        
        return res.json(enhancedDeclaration);
      }
    } catch (error) {
      console.error("Error fetching declaration:", error);
      res.status(500).json({ message: "Error fetching declaration" });
    }
  });

  app.post("/api/declarations", async (req, res) => {
    try {
      // Log the incoming request for debugging
      console.log("Declaration submission payload:", JSON.stringify(req.body, null, 2));
      
      // Create a sanitized version of the request body with only the fields from our schema
      // Ensure types match the schema exactly
      const sanitizedBody: any = {
        type: String(req.body.type || ""),
        supplierId: Number(req.body.supplierId || 1),
        productName: String(req.body.productName || ""),
        productDescription: req.body.productDescription ? String(req.body.productDescription) : undefined,
        hsnCode: req.body.hsnCode ? String(req.body.hsnCode) : undefined,
        quantity: req.body.quantity !== undefined ? Number(req.body.quantity) : undefined,
        unit: req.body.unit ? String(req.body.unit) : undefined,
        status: String(req.body.status || "pending"),
        riskLevel: String(req.body.riskLevel || "medium"),
        geojsonData: req.body.geojsonData || undefined,
        startDate: req.body.startDate || undefined,
        endDate: req.body.endDate || undefined,
        createdBy: 1, // Always set this to 1 for consistency
        industry: req.body.industry ? String(req.body.industry) : undefined,
        rmId: req.body.rmId ? String(req.body.rmId) : undefined
      };
      
      // Add customerId for outbound declarations
      if (sanitizedBody.type === "outbound" && req.body.customerId) {
        sanitizedBody.customerId = Number(req.body.customerId);
      }
      
      console.log("Sanitized payload:", JSON.stringify(sanitizedBody, null, 2));
      
      const declarationInput = insertDeclarationSchema.parse(sanitizedBody);
      
      // Extract product names from items if they exist
      if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
        // If productName is not already set, use product names from items
        if (!declarationInput.productName) {
          // Join the first 3 product names with commas
          const productNames = req.body.items
            .filter((item: any) => item.productName)
            .map((item: any) => item.productName)
            .slice(0, 3);
            
          if (productNames.length > 0) {
            declarationInput.productName = productNames.join(", ");
            
            // If there are more than 3 products, add "and more"
            if (req.body.items.length > 3) {
              declarationInput.productName += ` and ${req.body.items.length - 3} more`;
            }
          }
        }
      }
      
      // Note: We don't need to store the supplier name anymore
      // as we now include it in the API response from supplier data
      
      const declaration = await storage.createDeclaration(declarationInput);
      
      // Create activity record
      await storage.createActivity({
        type: "declaration",
        description: `New ${declaration.type} declaration for product "${declaration.productName || 'Unknown'}" was created`,
        userId: 1, // Mock user ID
        entityType: "declaration",
        entityId: declaration.id,
        metadata: null
      });
      
      res.status(201).json(declaration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error details:", JSON.stringify(error.errors, null, 2));
        console.error("Failed declaration payload:", JSON.stringify(req.body, null, 2));
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error creating declaration:", error);
        res.status(500).json({ message: "Error creating declaration" });
      }
    }
  });

  app.put("/api/declarations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const declarationInput = insertDeclarationSchema.partial().parse(req.body);
      
      const updatedDeclaration = await storage.updateDeclaration(id, declarationInput);
      
      if (!updatedDeclaration) {
        return res.status(404).json({ message: "Declaration not found" });
      }
      
      // Create activity record
      await storage.createActivity({
        type: "declaration",
        description: `Declaration for product "${updatedDeclaration.productName}" was updated`,
        userId: 1, // Mock user ID
        entityType: "declaration",
        entityId: updatedDeclaration.id,
        metadata: null
      });
      
      res.json(updatedDeclaration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating declaration" });
      }
    }
  });

  // PATCH endpoint specifically for declaration updates like RM ID
  app.patch("/api/declarations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const declarationInput = insertDeclarationSchema.partial().parse(req.body);
      
      const updatedDeclaration = await storage.updateDeclaration(id, declarationInput);
      
      if (!updatedDeclaration) {
        return res.status(404).json({ message: "Declaration not found" });
      }
      
      // Create activity record for RM ID updates if that's what was updated
      const activityDescription = req.body.rmId !== undefined
        ? `RM ID was updated for declaration "${updatedDeclaration.productName}"`
        : `Declaration for product "${updatedDeclaration.productName}" was updated`;
      
      await storage.createActivity({
        type: "declaration",
        description: activityDescription,
        userId: 1, // Mock user ID
        entityType: "declaration",
        entityId: updatedDeclaration.id,
        metadata: null
      });
      
      res.json(updatedDeclaration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating declaration" });
      }
    }
  });

  // Customer routes are now implemented below with real data

  // Risk categories routes
  app.get("/api/risk-categories", async (req, res) => {
    try {
      const categories = await storage.listRiskCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching risk categories" });
    }
  });
  
  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const customers = await storage.listCustomers(status);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customers" });
    }
  });

  app.get("/api/customers/stats", async (req, res) => {
    try {
      const stats = await storage.getCustomerStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customer statistics" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerInput = insertCustomerSchema.parse(req.body);
      
      // Check if customer with email exists
      const existingCustomer = await storage.getCustomerByEmail(customerInput.email);
      if (existingCustomer) {
        return res.status(400).json({ message: "Customer with this email already exists" });
      }
      
      const customer = await storage.createCustomer(customerInput);
      
      // Log activity for customer creation
      await storage.createActivity({
        type: "customer",
        description: `New customer ${customer.displayName || customer.companyName || `${customer.firstName} ${customer.lastName}`} created`,
        userId: 1, // Assuming admin user
        entityType: "customer",
        entityId: customer.id,
        metadata: null
      });
      
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error creating customer:", error);
        res.status(500).json({ message: "Error creating customer" });
      }
    }
  });
  
  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerInput = insertCustomerSchema.partial().parse(req.body);
      
      const updatedCustomer = await storage.updateCustomer(id, customerInput);
      
      if (!updatedCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Log activity for customer update
      await storage.createActivity({
        type: "customer",
        description: `Customer ${updatedCustomer.displayName || updatedCustomer.companyName || `${updatedCustomer.firstName} ${updatedCustomer.lastName}`} information updated`,
        userId: 1, // Assuming admin user
        entityType: "customer",
        entityId: updatedCustomer.id,
        metadata: null
      });
      
      res.json(updatedCustomer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        console.error("Error updating customer:", error);
        res.status(500).json({ message: "Error updating customer" });
      }
    }
  });
  
  app.get("/api/customers/:id/declarations", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const declarations = await storage.listDeclarationsByCustomer(customerId);
      res.json(declarations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customer declarations" });
    }
  });
  
  app.get("/api/customers/:id/documents", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const documents = await storage.listDocumentsByCustomer(customerId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customer documents" });
    }
  });

  // SAQ routes
  app.get("/api/supplier/:id/saqs", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const status = req.query.status as string;
      const saqs = await storage.listSaqsBySupplier(supplierId, status);
      res.json(saqs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching SAQs" });
    }
  });
  
  app.get("/api/supplier/:id/saqs/stats", async (req, res) => {
    try {
      const supplierId = parseInt(req.params.id);
      const stats = await storage.getSaqStats(supplierId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching SAQ statistics" });
    }
  });
  
  app.get("/api/saqs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const saq = await storage.getSaq(id);
      
      if (!saq) {
        return res.status(404).json({ message: "SAQ not found" });
      }
      
      res.json(saq);
    } catch (error) {
      res.status(500).json({ message: "Error fetching SAQ" });
    }
  });
  
  app.post("/api/saqs", async (req, res) => {
    try {
      const saqInput = insertSaqSchema.parse(req.body);
      const saq = await storage.createSaq(saqInput);
      
      // Create activity record
      await storage.createActivity({
        type: "saq",
        description: `New SAQ "${saq.title}" was created for supplier #${saq.supplierId}`,
        userId: 1, // Mock user ID
        entityType: "saq",
        entityId: saq.id,
        metadata: null
      });
      
      res.status(201).json(saq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error creating SAQ" });
      }
    }
  });
  
  app.put("/api/saqs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const saqInput = insertSaqSchema.partial().parse(req.body);
      
      const updatedSaq = await storage.updateSaq(id, saqInput);
      
      if (!updatedSaq) {
        return res.status(404).json({ message: "SAQ not found" });
      }
      
      // Create activity for SAQ completion if status changed to completed
      if (saqInput.status === "completed") {
        await storage.createActivity({
          type: "saq",
          description: `SAQ "${updatedSaq.title}" was completed by supplier #${updatedSaq.supplierId}`,
          userId: 1, // Mock user ID
          entityType: "saq",
          entityId: updatedSaq.id,
          metadata: null
        });
      }
      
      res.json(updatedSaq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
        res.status(500).json({ message: "Error updating SAQ" });
      }
    }
  });
  
  // Endpoint to update RM IDs for declarations
  app.patch("/api/declarations/:id/rm-id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rmId } = req.body;
      
      if (!rmId) {
        return res.status(400).json({ message: "RM ID is required" });
      }
      
      const declaration = await storage.getDeclaration(id);
      if (!declaration) {
        return res.status(404).json({ message: "Declaration not found" });
      }
      
      const updated = await storage.updateDeclaration(id, { rmId });
      
      if (updated) {
        // Log the activity
        await storage.createActivity({
          type: "updated",
          entityType: "declaration",
          entityId: id,
          description: `Updated RM ID to '${rmId}'`,
          userId: 1, // Use actual user ID when available
        });
        
        res.json(updated);
      } else {
        res.status(500).json({ message: "Error updating declaration" });
      }
    } catch (error) {
      console.error('Error updating RM ID:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Endpoint to bulk update RM IDs for multiple declarations
  app.patch("/api/declarations/bulk-update-rm-ids", async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ message: "Invalid updates format" });
      }
      
      const results = [];
      for (const update of updates) {
        const { id, rmId } = update;
        
        if (!id || !rmId) {
          results.push({ id, success: false, message: "Missing id or rmId" });
          continue;
        }
        
        const declaration = await storage.getDeclaration(id);
        if (!declaration) {
          results.push({ id, success: false, message: "Declaration not found" });
          continue;
        }
        
        const updated = await storage.updateDeclaration(id, { rmId });
        
        if (updated) {
          // Log the activity
          await storage.createActivity({
            type: "updated",
            entityType: "declaration",
            entityId: id,
            description: `Updated RM ID to '${rmId}'`,
            userId: 1, // Use actual user ID when available
          });
          
          results.push({ id, success: true });
        } else {
          results.push({ id, success: false, message: "Error updating declaration" });
        }
      }
      
      res.json({ results });
    } catch (error) {
      console.error('Error bulk updating RM IDs:', error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Endpoint to download product list Excel template
  app.post("/api/declarations/product-list-template", async (req, res) => {
    try {
      // In a real-world scenario, we'd use a library like exceljs to generate
      // an Excel file dynamically based on the request data.
      // For this demo, we'll serve a pre-made Excel file.
      
      const products = req.body.products || [];
      
      // Log for debugging
      console.log(`Generating product list template for ${products.length} products`);
      
      // Send the static Excel file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Product List.xlsx"');
      
      // Serve the pre-made Excel file
      const path = require('path');
      const fs = require('fs');
      const filePath = path.join(__dirname, 'assets', 'Product List.xlsx');
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error('Excel template file not found at path:', filePath);
        return res.status(404).json({ message: "Template file not found" });
      }
      
      // Stream the file to the client
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error generating Excel template:', error);
      res.status(500).json({ message: "Error generating Excel template" });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
