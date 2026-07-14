import express from "express";
import * as dotenv from 'dotenv';
dotenv.config();
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { User, Challenge, UserChallenge, CheckIn, Verification, SystemLog } from "./src/types";
import { GoogleGenAI, Type } from "@google/genai";
import { dbEngine } from "./src/db";

// Auth validator middleware / parsed helper
async function getUserIdFromAuth(req: express.Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  if (authHeader.startsWith("mock-jwt-token-for-")) {
    const userId = authHeader.replace("mock-jwt-token-for-", "");
    // verify user exists
    const user = await dbEngine.getUserById(userId);
    return user ? user.id : null;
  }
  return null;
}

async function startServer() {

  const app = express();
  const PORT = 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  // Middleware for body parsing
  app.use(express.json());

  // Serve uploaded files as static assets
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));

  // Multer storage config for lobby video uploads
  const videoStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.mp4';
      cb(null, `lobby-video${ext}`);
    }
  });
  const videoUpload = multer({
    storage: videoStorage,
    limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed.'));
      }
    }
  });

  // Log request API
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API REQUEST] ${req.method} ${req.path}`);
    }
    next();
  });

  // --- API ROUTES ---

  // Upload lobby promo video
  app.post("/api/upload/lobby-video", (req, res) => {
    videoUpload.single('video')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || "Upload failed." });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No video file received." });
      }
      const url = `/uploads/${req.file.filename}`;
      res.json({ url, filename: req.file.filename, size: req.file.size });
    });
  });

  // Get current lobby video URL
  app.get("/api/upload/lobby-video", (_req, res) => {
    const extensions = ['.mp4', '.webm', '.mov', '.mkv', '.avi'];
    let found: string | null = null;
    for (const ext of extensions) {
      const filePath = path.join(uploadsDir, `lobby-video${ext}`);
      if (fs.existsSync(filePath)) {
        found = `/uploads/lobby-video${ext}`;
        break;
      }
    }
    res.json({ url: found });
  });

  // Temporary endpoint to locate uploaded files recursively (dev only)
  if (process.env.NODE_ENV !== 'production') {
    app.get("/api/dev/files", (req, res) => {
      function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
        try {
          const files = fs.readdirSync(dirPath);
          files.forEach((file) => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
              if (file !== "node_modules" && file !== ".git" && file !== "dist") {
                getAllFiles(fullPath, arrayOfFiles);
              }
            } else {
              arrayOfFiles.push(path.relative(process.cwd(), fullPath));
            }
          });
        } catch (e) {
          // ignore errors
        }
        return arrayOfFiles;
      }
      try {
        const files = getAllFiles(process.cwd());
        res.json({ files });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });
  } // end dev-only block

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: "Username and email are required fields." });
    }
    if (!password || typeof password !== 'string' || password.trim().length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    try {
      const newUser = await dbEngine.registerUser(username, email, password);
      res.json({
        user: newUser,
        token: `mock-jwt-token-for-${newUser.id}`
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Registration failed" });
    }
  });

  // Auth: Login / Quick Switch
  app.post("/api/auth/login", async (req, res) => {
    const { usernameOrEmail } = req.body;
    if (!usernameOrEmail) {
      return res.status(400).json({ error: "Username or email is required." });
    }
    try {
      const user = await dbEngine.loginUser(usernameOrEmail);
      res.json({
        user,
        token: `mock-jwt-token-for-${user.id}`
      });
    } catch (e: any) {
      res.status(404).json({ error: e.message || "Login failed" });
    }
  });

  // Get generic feed (Checkins + their votes)
  app.get("/api/feed", async (req, res) => {
    try {
      const feed = await dbEngine.getFeed();
      res.json(feed);
    } catch (e) {
      res.status(500).json({ error: "Failed to load feed" });
    }
  });

  // Get challenges list
  app.get("/api/challenges", async (req, res) => {
    try {
      const chal = await dbEngine.getChallenges();
      res.json(chal);
    } catch (e) {
      res.status(500).json({ error: "Failed to load challenges" });
    }
  });

  // Create a new challenge
  app.post("/api/challenges", async (req, res) => {
    const userId = await getUserIdFromAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized session credentials." });
    }
    const user = await dbEngine.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { title, description, category, reward_xp, duration_days, starts_in_hours } = req.body;

    if (!title || !description || !category || !reward_xp || !duration_days) {
      return res.status(400).json({ error: "All challenge meta parameters are required." });
    }

    try {
      const newChal = await dbEngine.createChallenge(title, description, category, Number(reward_xp), Number(duration_days), user.id, user.username, starts_in_hours);
      res.json(newChal);
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to create challenge" });
    }
  });

  // Get Leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const lb = await dbEngine.getLeaderboard();
      res.json(lb);
    } catch (e) {
      res.status(500).json({ error: "Failed to load leaderboard" });
    }
  });

  // Get system logs
  app.get("/api/system/logs", async (req, res) => {
    try {
      const logs = await dbEngine.getSystemLogs();
      res.json(logs);
    } catch (e) {
      res.status(500).json({ error: "Failed to load logs" });
    }
  });

  // Get full database state
  app.get("/api/system/state", async (req, res) => {
    try {
      const state = await dbEngine.getSystemState();
      res.json(state);
    } catch (e) {
      res.status(500).json({ error: "Failed to load system state" });
    }
  });

  // Get active user's specialized enrollments
  app.get("/api/users/:userId/challenges", async (req, res) => {
    try {
      const data = await dbEngine.getUserEnrollments(req.params.userId);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch user enrollments" });
    }
  });

  // Join challenge
  app.post("/api/challenges/:challengeId/join", async (req, res) => {
    const userId = await getUserIdFromAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized session." });

    const user = await dbEngine.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    try {
      const enrollment = await dbEngine.joinChallenge(userId, user.username, req.params.challengeId);
      res.json(enrollment);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Failed to join challenge" });
    }
  });

  // Submit check-in
  app.post("/api/challenges/:challengeId/checkin", async (req, res) => {
    const userId = await getUserIdFromAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized session." });

    const user = await dbEngine.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { text_proof, imageUrl } = req.body;
    if (!text_proof) return res.status(400).json({ error: "Text proof detailing your progress is required." });

    try {
      const checkIn = await dbEngine.submitCheckIn(userId, user.username, req.params.challengeId, text_proof, imageUrl);
      res.json(checkIn);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Failed to submit check-in" });
    }
  });

  // Cast vote / verify checkin
  app.post("/api/checkins/:checkInId/verify", async (req, res) => {
    const userId = await getUserIdFromAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized session." });

    const { vote } = req.body; // 'APPROVE' or 'DISPUTED'
    if (!vote || (vote !== 'APPROVE' && vote !== 'DISPUTED')) {
      return res.status(400).json({ error: "Vote type must be 'APPROVE' or 'DISPUTED'." });
    }

    try {
      const result = await dbEngine.verifyCheckIn(req.params.checkInId, userId, vote);
      res.json({
        status: "success",
        checkInStatus: result.status
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Failed to verify check-in" });
    }
  });

  app.post("/api/system/reset-engine", async (req, res) => {
    try {
      await dbEngine.writeLog('CLOCK_ADVANCED', `Triggered cron processing. Simulating peer validations on pending checkpoints.`);
      
      const state = await dbEngine.getSystemState();
      const pendingCheckins = state.check_ins.filter(ci => ci.status === 'PENDING');
      let processedCount = 0;

      for (const ci of pendingCheckins) {
        // Find other eligible users
        const potentialHelpers = state.users.filter(u => u.id !== ci.user_id);
        if (potentialHelpers.length > 0) {
          const helper = potentialHelpers[Math.floor(Math.random() * potentialHelpers.length)];
          try {
            await dbEngine.verifyCheckIn(ci.id, helper.id, 'APPROVE');
            processedCount++;
            await dbEngine.writeLog('SIMULATED_VOTE', `@${helper.username} auto-verified checkin for @${ci.username}.`);
          } catch (e) {
            // ignore if already voted
          }
        }
      }

      await dbEngine.writeLog('CRON_COMPLETE', `Engine cycle complete. Validated ${processedCount} pending proof logs.`);
      res.json({ message: "Advancement processed successfully", processed: processedCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/system/reset-sandbox", async (req, res) => {
    try {
      await dbEngine.resetSandbox();
      res.json({ status: "ok" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/system/clear-logs", async (req, res) => {
    try {
      await dbEngine.clearLogs();
      res.json({ status: "ok" });
    } catch (e) {
      res.status(500).json({ error: "Failed to clear logs" });
    }
  });

  app.post("/api/system/simulate-fail", async (req, res) => {
    const { userId, userChallengeId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }
    try {
      const result = await dbEngine.simulateFail(userId, userChallengeId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/system/simulate-reminder", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }
    try {
      const result = await dbEngine.simulateReminder(userId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/system/simulate-start", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }
    try {
      const result = await dbEngine.simulateStart(userId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Research and generate challenge + challenger using Gemini API
  app.post("/api/system/research-challenger", async (req, res) => {
    const { topic, userId } = req.body;
    if (!topic) return res.status(400).json({ error: "Research topic is required." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(400).json({ error: "GEMINI_API_KEY environment variable is not configured." });

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Find/research a matching human friend/accountability partner and a custom challenge outline for: "${topic}".`,
        config: {
          systemInstruction: `You are an expert matchmaking and social discovery engine for BETZ, a high-stakes habit verification game. Based on the user's research topic or interest, find/create a realistic human friend/accountability partner (a real person, NOT a bot or AI) who shares this specific passion, and design a customized daily habit challenge for both of them to complete. Return JSON with 'challenge' (title, description, category, reward_xp, duration_days) and 'challenger' (username, email, bio). The category must be one of: Fitness, Coding, Research, Nutrition, Mental. The challenger MUST be a human-like friend profile with a realistic human username (e.g. 'sarah_runs', 'dev_dan', 'alex_keto', 'emily_reads' - NO 'bot', 'ai', 'system', or 'agent' in the name). The bio should describe their human background, career, or hobby interests that make them a perfect new partner friend for the user.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              challenge: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  reward_xp: { type: Type.INTEGER },
                  duration_days: { type: Type.INTEGER }
                },
                required: ["title", "description", "category", "reward_xp", "duration_days"]
              },
              challenger: {
                type: Type.OBJECT,
                properties: {
                  username: { type: Type.STRING },
                  email: { type: Type.STRING },
                  bio: { type: Type.STRING }
                },
                required: ["username", "email", "bio"]
              }
            },
            required: ["challenge", "challenger"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) throw new Error("Empty response from Gemini research model.");
      const data = JSON.parse(resultText);

      // Create Challenger via dbEngine
      let finalUsername = data.challenger.username.toLowerCase().replace(/[^a-z0-9_]/g, '') || "ai_challenger";
      let challengerUser;
      try {
        challengerUser = await dbEngine.registerUser(finalUsername, data.challenger.email || `${finalUsername}@betz.ai`, 'ai_generated', data.challenger.bio);
      } catch (e) {
        // Fallback if username taken
        finalUsername = finalUsername + Math.floor(Math.random() * 1000);
        challengerUser = await dbEngine.registerUser(finalUsername, `${finalUsername}@betz.ai`, 'ai_generated', data.challenger.bio);
      }

      // Create Challenge
      const challenge = await dbEngine.createChallenge(
        data.challenge.title || `${topic} Challenge`,
        data.challenge.description || `Daily tracking of ${topic}.`,
        data.challenge.category || "Research",
        Number(data.challenge.reward_xp) || 150,
        Number(data.challenge.duration_days) || 7,
        challengerUser.id,
        challengerUser.username,
        1
      );

      // Enroll User if userId exists
      if (userId) {
        const user = await dbEngine.getUserById(userId);
        if (user) {
          await dbEngine.joinChallenge(userId, user.username, challenge.id);
        }
      }

      res.json({
        success: true,
        challenge: challenge,
        challenger: challengerUser,
        bio: data.challenger.bio
      });

    } catch (err: any) {
      console.error("[GEMINI ERROR]", err);
      res.status(500).json({ error: err.message || "Failed to research challenge using Gemini." });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} already in use. Set PORT to a free port and retry.`);
      process.exit(1);
    }
    throw err;
  });
}

startServer();
