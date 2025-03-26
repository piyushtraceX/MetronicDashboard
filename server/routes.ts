import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertSupplierSchema, insertDocumentSchema, insertTaskSchema, insertDeclarationSchema } from "@shared/schema";
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
      const currentMetrics = await storage.getCurrentComplianceMetrics();
      const riskCategories = await storage.listRiskCategories();
      const recentActivities = await storage.listRecentActivities(4);
      const upcomingTasks = await storage.listUpcomingTasks(4);
      const suppliers = await storage.listSuppliers();
      
      res.json({
        metrics: currentMetrics,
        riskCategories,
        recentActivities,
        upcomingTasks,
        suppliers: suppliers.slice(0, 4) // Limit to 4 suppliers for dashboard
      });
    } catch (error) {
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
      res.json(declarations);
    } catch (error) {
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
      
      res.json(declaration);
    } catch (error) {
      res.status(500).json({ message: "Error fetching declaration" });
    }
  });

  app.post("/api/declarations", async (req, res) => {
    try {
      const declarationInput = insertDeclarationSchema.parse(req.body);
      
      // Set created by to mock user
      declarationInput.createdBy = 1;
      
      const declaration = await storage.createDeclaration(declarationInput);
      
      // Create activity record
      await storage.createActivity({
        type: "declaration",
        description: `New ${declaration.type} declaration for product "${declaration.productName}" was created`,
        userId: 1, // Mock user ID
        entityType: "declaration",
        entityId: declaration.id,
        metadata: null
      });
      
      res.status(201).json(declaration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: error.errors });
      } else {
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

  // Risk categories routes
  app.get("/api/risk-categories", async (req, res) => {
    try {
      const categories = await storage.listRiskCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching risk categories" });
    }
  });
  
  const httpServer = createServer(app);
  
  return httpServer;
}
