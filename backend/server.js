// server.mjs

// Import environment variables early
import dotenv from 'dotenv';
dotenv.config();

// Import required modules and packages
import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Server as SocketIOServer } from 'socket.io';

// Postgres pool setup (DO NOT MODIFY THIS SNIPPET)
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
const pool = new Pool({
  host: PGHOST || "ep-ancient-dream-abbsot9k-pooler.eu-west-2.aws.neon.tech",
  database: PGDATABASE || "neondb",
  user: PGUSER || "neondb_owner",  // note: key "username" in snippet replaced by "user" for pg
  password: PGPASSWORD || "npg_jAS3aITLC5DX",
  port: 5432,
  ssl: {
    require: true,
  },
});

// Setup Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*"
  }
});

// Middleware: Use CORS, JSON parser, and morgan for logging details of each incoming request
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// JWT secret key from env
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// JWT Authentication Middleware for REST endpoints and Socket connections
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Expect header: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// Socket.io middleware to authenticate socket connections using query param "token"
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (!token) {
    return next(new Error("Authentication error: token required"));
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next(new Error("Authentication error: Invalid token"));
    socket.user = user;
    next();
  });
});

// ------------------------- REST API Endpoints ---------------------------

// Endpoint: Create User (Registration)
// This endpoint registers a new user using the provided details.
// It hashes the plaintext password and stores the user in the users table.
// Returns a JWT token along with the created user information.
app.post('/api/users', async (req, res) => {
  /*
    Function: create_user
    - Accepts a JSON payload with "name", "email", "password", "role" and optional "avatar_url".
    - Hashes the password with bcrypt.
    - Generates a new uid and timestamps.
    - Inserts into the "users" table.
    - Returns a JWT token and created user information.
  */
  const { name, email, password, role, avatar_url } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const client = await pool.connect();
    // Check if email already exists
    const check = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (check.rows.length > 0) {
      client.release();
      return res.status(400).json({ error: "Email already exists" });
    }
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    const uid = uuidv4();
    const timestamp = new Date().toISOString();
    const queryText = `INSERT INTO users (uid, name, email, password_hash, role, avatar_url, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING uid, name, email, role, avatar_url, created_at, updated_at`;
    const result = await client.query(queryText, [uid, name, email, password_hash, role, avatar_url || null, timestamp, timestamp]);
    client.release();
    // Generate JWT token with uid and role
    const token = jwt.sign({ uid: result.rows[0].uid, role: result.rows[0].role }, JWT_SECRET, { expiresIn: '24h' });
    return res.status(201).json({ ...result.rows[0], token });
  } catch (err) {
    console.error("Error creating user:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint: User Login & Authentication
// This endpoint validates the user credentials and returns a JWT token if successful.
app.post('/api/auth/login', async (req, res) => {
  /*
    Function: login_user
    - Accepts "email" and "password" in the payload.
    - Retrieves user record matching the provided email.
    - Compares hashed password using bcrypt.
    - On success, returns a JWT token along with user uid and role.
  */
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }
  try {
    const client = await pool.connect();
    const queryResult = await client.query("SELECT uid, password_hash, role FROM users WHERE email = $1", [email]);
    client.release();
    if (queryResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = queryResult.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ uid: user.uid, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.status(200).json({ token, uid: user.uid, role: user.role });
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint: Create Project
// This endpoint creates a new project record in the "projects" table.
// Requires a valid authentication token. The project is linked to the authenticated user.
app.post('/api/projects', authenticateToken, async (req, res) => {
  /*
    Function: create_project
    - Accepts project details: title, description, due_date, priority, and optional milestones.
    - Generates a new uid and timestamps.
    - Sets status to "active" by default.
    - Inserts into "projects" with created_by set from the authenticated user.
  */
  const { title, description, due_date, priority, milestones } = req.body;
  if (!title || !description || !due_date || !priority) {
    return res.status(400).json({ error: "Missing required project fields" });
  }
  try {
    const client = await pool.connect();
    const uid = uuidv4();
    const timestamp = new Date().toISOString();
    const status = "active";
    const queryText = `INSERT INTO projects (uid, title, description, due_date, priority, status, milestones, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING uid, title, description, due_date, priority, status, milestones, created_by, created_at, updated_at`;
    const result = await client.query(queryText, [uid, title, description, due_date, priority, status, milestones || null, req.user.uid, timestamp, timestamp]);
    client.release();
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating project:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint: Update Task Status (e.g., via drag-and-drop on Kanban board)
// This endpoint updates the status of an existing task. It also logs the activity and emits a realtime event.
// Requires a valid authentication token.
app.patch('/api/tasks/:task_uid/status', authenticateToken, async (req, res) => {
  /*
    Function: update_task_status
    - Accepts a task_uid in the path and new "status" in the body.
    - Updates the "status" and "updated_at" fields in the "tasks" table.
    - Logs the status change in the "activity_feed" table.
    - Emits a "task_status_updated" event via socket.io with the updated details.
  */
  const { task_uid } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: "Missing status in request body" });
  }
  try {
    const client = await pool.connect();
    const updated_at = new Date().toISOString();
    // Update the task's status in the tasks table
    const updateQuery = `UPDATE tasks SET status = $1, updated_at = $2 WHERE uid = $3 RETURNING *`;
    const updateResult = await client.query(updateQuery, [status, updated_at, task_uid]);
    if (updateResult.rows.length === 0) {
      client.release();
      return res.status(400).json({ error: "Task not found" });
    }
    // Log the status change in the activity_feed table
    const activity_uid = uuidv4();
    const activityQuery = `INSERT INTO activity_feed (uid, task_uid, user_uid, action, details, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)`;
    const details = JSON.stringify({ from: updateResult.rows[0].status, to: status });
    await client.query(activityQuery, [activity_uid, task_uid, req.user.uid, 'updated_status', details, updated_at]);
    client.release();
    // Emit realtime event via socket.io
    io.emit("task_status_updated", { task_uid, status, updated_at });
    return res.status(200).json(updateResult.rows[0]);
  } catch (err) {
    console.error("Error updating task status:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint: Add Comment to Task
// This endpoint allows adding a comment to a given task. It inserts a record into the "comments" table.
// Also emits a "new_comment_added" realtime event.
// Requires a valid authentication token.
app.post('/api/tasks/:task_uid/comments', authenticateToken, async (req, res) => {
  /*
    Function: add_comment_to_task
    - Accepts a task_uid in the path and a comment payload in the body (content and optional mentions).
    - Generates a new uid and inserts into "comments" with created_at set.
    - Emits a "new_comment_added" event via socket.io.
  */
  const { task_uid } = req.params;
  const { content, mentions } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Comment content is required" });
  }
  try {
    const client = await pool.connect();
    const uid = uuidv4();
    const created_at = new Date().toISOString();
    const insertQuery = `INSERT INTO comments (uid, task_uid, user_uid, content, created_at, mentions)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING uid, task_uid, user_uid, content, created_at, mentions`;
    const result = await client.query(insertQuery, [uid, task_uid, req.user.uid, content, created_at, mentions ? JSON.stringify(mentions) : null]);
    client.release();
    // Emit realtime event with new comment details
    io.emit("new_comment_added", {
      comment_uid: uid,
      task_uid,
      user_uid: req.user.uid,
      content,
      created_at
    });
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding comment:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint: Get Notifications for the authenticated user
// This endpoint retrieves notification records from the "notifications" table for the logged-in user.
app.get('/api/notifications', authenticateToken, async (req, res) => {
  /*
    Function: get_notifications
    - Retrieves all notifications for the user (matched by req.user.uid) from the "notifications" table.
    - Orders results by created_at in descending order.
  */
  try {
    const client = await pool.connect();
    const query = `SELECT * FROM notifications WHERE user_uid = $1 ORDER BY created_at DESC`;
    const result = await client.query(query, [req.user.uid]);
    client.release();
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error retrieving notifications:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ------------------------- Socket.io Event Handling ---------------------------

// Handle new socket connections and log successful connections
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id} (user: ${socket.user.uid})`);
  // Additional socket event handlers can be added here if needed.
  
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// ------------------------- Server Startup ---------------------------
const PORT = process.env.PORT || 1337;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});