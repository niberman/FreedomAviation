import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getSessionUser } from "./replitAuth";
import { 
  insertAircraftSchema, 
  insertServiceRequestSchema,
  insertServiceSchema,
  insertMembershipSchema,
  type InsertAircraft,
  type InsertServiceRequest,
  type InsertService,
  type InsertMembership
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Auth route - get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = String(req.user.claims.sub);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profiles
  app.get("/api/profiles/:id", async (req, res) => {
    const profile = await storage.getProfile(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  });

  app.patch("/api/profiles/:id", async (req, res) => {
    const profile = await storage.updateProfile(req.params.id, req.body);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  });

  // User Roles
  app.get("/api/users/:userId/roles", async (req, res) => {
    const roles = await storage.getUserRoles(req.params.userId);
    res.json(roles);
  });

  app.get("/api/users/:userId/has-role/:role", async (req, res) => {
    const hasRole = await storage.hasRole(req.params.userId, req.params.role);
    res.json({ hasRole });
  });

  // Aircraft
  app.get("/api/aircraft", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { ownerId } = req.query;
    
    if (user.role === 'admin') {
      if (ownerId) {
        const aircraft = await storage.getAircraftByOwner(ownerId as string);
        return res.json(aircraft);
      }
      const aircraft = await storage.getAllAircraft();
      return res.json(aircraft);
    }
    
    const aircraft = await storage.getAircraftByOwner(user.id);
    res.json(aircraft);
  });

  app.get("/api/aircraft/:id", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const aircraft = await storage.getAircraft(req.params.id);
    if (!aircraft) {
      return res.status(404).json({ error: "Aircraft not found" });
    }
    
    if (user.role !== 'admin' && aircraft.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    res.json(aircraft);
  });

  app.post("/api/aircraft", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const result = insertAircraftSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    if (user.role !== 'admin' && result.data.ownerId && result.data.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const aircraft = await storage.createAircraft(result.data as unknown as InsertAircraft);
    res.status(201).json(aircraft);
  });

  app.patch("/api/aircraft/:id", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const existing = await storage.getAircraft(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Aircraft not found" });
    }
    
    if (user.role !== 'admin' && existing.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    if (user.role !== 'admin' && req.body.ownerId && req.body.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const aircraft = await storage.updateAircraft(req.params.id, req.body);
    res.json(aircraft);
  });

  app.delete("/api/aircraft/:id", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const existing = await storage.getAircraft(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Aircraft not found" });
    }
    
    if (user.role !== 'admin' && existing.ownerId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const deleted = await storage.deleteAircraft(req.params.id);
    res.status(204).send();
  });

  // Services
  app.get("/api/services", async (req, res) => {
    const { category, active } = req.query;
    if (category) {
      const services = await storage.getServicesByCategory(category as string);
      return res.json(services);
    }
    if (active === 'true') {
      const services = await storage.getActiveServices();
      return res.json(services);
    }
    const services = await storage.getAllServices();
    res.json(services);
  });

  app.get("/api/services/:id", async (req, res) => {
    const service = await storage.getService(req.params.id);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json(service);
  });

  app.post("/api/services", async (req, res) => {
    const result = insertServiceSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const service = await storage.createService(result.data as unknown as InsertService);
    res.status(201).json(service);
  });

  app.patch("/api/services/:id", async (req, res) => {
    const service = await storage.updateService(req.params.id, req.body);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.json(service);
  });

  // Service Requests
  app.get("/api/service-requests", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { userId, aircraftId } = req.query;
    
    if (user.role === 'admin') {
      if (userId) {
        const requests = await storage.getServiceRequestsByUser(userId as string);
        return res.json(requests);
      }
      if (aircraftId) {
        const requests = await storage.getServiceRequestsByAircraft(aircraftId as string);
        return res.json(requests);
      }
      const requests = await storage.getAllServiceRequests();
      return res.json(requests);
    }
    
    const requests = await storage.getServiceRequestsByUser(user.id);
    res.json(requests);
  });

  app.get("/api/service-requests/:id", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const request = await storage.getServiceRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Service request not found" });
    }
    
    if (user.role !== 'admin' && request.userId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    res.json(request);
  });

  app.post("/api/service-requests", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const result = insertServiceRequestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    if (user.role !== 'admin' && result.data.userId && result.data.userId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const request = await storage.createServiceRequest(result.data as unknown as InsertServiceRequest);
    res.status(201).json(request);
  });

  app.patch("/api/service-requests/:id", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const existing = await storage.getServiceRequest(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Service request not found" });
    }
    
    if (user.role !== 'admin' && existing.userId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const request = await storage.updateServiceRequest(req.params.id, req.body);
    res.json(request);
  });

  app.delete("/api/service-requests/:id", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const existing = await storage.getServiceRequest(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Service request not found" });
    }
    
    if (user.role !== 'admin' && existing.userId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const deleted = await storage.deleteServiceRequest(req.params.id);
    res.status(204).send();
  });

  // Service Tasks
  app.get("/api/service-tasks", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { aircraftId } = req.query;
    
    if (user.role === 'admin') {
      if (aircraftId) {
        const tasks = await storage.getServiceTasksByAircraft(aircraftId as string);
        return res.json(tasks);
      }
      const tasks = await storage.getAllServiceTasks();
      return res.json(tasks);
    }
    
    if (aircraftId) {
      const aircraft = await storage.getAircraft(aircraftId as string);
      if (!aircraft || aircraft.ownerId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const tasks = await storage.getServiceTasksByAircraft(aircraftId as string);
      return res.json(tasks);
    }
    
    const userAircraft = await storage.getAircraftByOwner(user.id);
    const allTasks = [];
    for (const plane of userAircraft) {
      const tasks = await storage.getServiceTasksByAircraft(plane.id);
      allTasks.push(...tasks);
    }
    res.json(allTasks);
  });

  app.post("/api/service-tasks", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role !== 'admin' && req.body.aircraft_id) {
      const aircraft = await storage.getAircraft(req.body.aircraft_id);
      if (!aircraft || aircraft.ownerId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    
    const task = await storage.createServiceTask(req.body);
    res.status(201).json(task);
  });

  app.patch("/api/service-tasks/:id", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const task = await storage.updateServiceTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: "Service task not found" });
    }
    
    if (user.role !== 'admin') {
      const aircraft = await storage.getAircraft(task.aircraftId);
      if (!aircraft || aircraft.ownerId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    
    res.json(task);
  });

  // Memberships
  app.get("/api/memberships", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { ownerId } = req.query;
    
    if (user.role === 'admin') {
      if (ownerId) {
        const membership = await storage.getMembershipByOwner(ownerId as string);
        return res.json(membership || null);
      }
      const memberships = await storage.getAllMemberships();
      return res.json(memberships);
    }
    
    const membership = await storage.getMembershipByOwner(user.id);
    res.json(membership || null);
  });

  app.post("/api/memberships", async (req, res) => {
    const result = insertMembershipSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const membership = await storage.createMembership(result.data as unknown as InsertMembership);
    res.status(201).json(membership);
  });

  app.patch("/api/memberships/:id", async (req, res) => {
    const membership = await storage.updateMembership(req.params.id, req.body);
    if (!membership) {
      return res.status(404).json({ error: "Membership not found" });
    }
    res.json(membership);
  });

  // Membership Tiers
  app.get("/api/membership-tiers", async (req, res) => {
    const { active } = req.query;
    if (active === 'true') {
      const tiers = await storage.getActiveMembershipTiers();
      return res.json(tiers);
    }
    const tiers = await storage.getAllMembershipTiers();
    res.json(tiers);
  });

  app.get("/api/membership-tiers/:id", async (req, res) => {
    const tier = await storage.getMembershipTier(req.params.id);
    if (!tier) {
      return res.status(404).json({ error: "Membership tier not found" });
    }
    res.json(tier);
  });

  // Activity Logs
  app.post("/api/activity-logs", async (req, res) => {
    const log = await storage.createActivityLog(req.body);
    res.status(201).json(log);
  });

  app.get("/api/activity-logs", async (req, res) => {
    const { userId } = req.query;
    if (userId) {
      const logs = await storage.getActivityLogsByUser(userId as string);
      return res.json(logs);
    }
    res.status(400).json({ error: "userId is required" });
  });

  // Invoices
  app.get("/api/invoices", isAuthenticated, async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const { ownerId } = req.query;
    
    if (user.role === 'admin') {
      if (ownerId) {
        const invoices = await storage.getInvoicesByOwner(ownerId as string);
        return res.json(invoices);
      }
      return res.status(400).json({ error: "ownerId is required" });
    }
    
    const invoices = await storage.getInvoicesByOwner(user.id);
    res.json(invoices);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    const invoice = await storage.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  });

  app.get("/api/invoices/:id/lines", async (req, res) => {
    const lines = await storage.getInvoiceLines(req.params.id);
    res.json(lines);
  });

  app.post("/api/invoices", async (req, res) => {
    const invoice = await storage.createInvoice(req.body);
    res.status(201).json(invoice);
  });

  app.post("/api/invoice-lines", async (req, res) => {
    const line = await storage.createInvoiceLine(req.body);
    res.status(201).json(line);
  });

  const httpServer = createServer(app);
  return httpServer;
}
