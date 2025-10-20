import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://agri-connect-ai-local-62lqxpyjs-allans-projects-5df5c5a9.vercel.app']
    : ['http://localhost:5173', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Database setup
const dbPath = path.join(__dirname, '../data/app.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Database migrations for older DBs
try {
  // Ensure buyer_contact column exists in orders table
  const col = db.prepare("PRAGMA table_info(orders)").all().find(c => c.name === 'buyer_contact');
  if (!col) {
    db.prepare("ALTER TABLE orders ADD COLUMN buyer_contact TEXT").run();
    console.log('Migrated: added orders.buyer_contact');
  }
  // Ensure approved_by column exists in orders table
  const approvedCol = db.prepare("PRAGMA table_info(orders)").all().find(c => c.name === 'approved_by');
  if (!approvedCol) {
    db.prepare("ALTER TABLE orders ADD COLUMN approved_by TEXT").run();
    console.log('Migrated: added orders.approved_by');
  }

  // Update user_type CHECK constraint to include admin types
  try {
    db.exec(`
      ALTER TABLE users ADD COLUMN user_type_new TEXT CHECK (user_type_new IN ('farmer', 'buyer', 'admin', 'super_admin'));
      UPDATE users SET user_type_new = user_type;
      ALTER TABLE users DROP COLUMN user_type;
      ALTER TABLE users RENAME COLUMN user_type_new TO user_type;
    `);
    console.log('Migrated: updated user_type constraint to include admin types');
  } catch (err) {
    // Constraint might already be updated, ignore
  }
} catch (err) {
  // ignore migration errors
}

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('farmer', 'buyer', 'admin', 'super_admin')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    avatar_url TEXT,
    location TEXT,
    phone TEXT,
    rating REAL DEFAULT 0,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS crops (
    id TEXT PRIMARY KEY,
    farmer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    price_per_unit REAL NOT NULL,
    harvest_date TEXT,
    location TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    crop_id TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    total_price REAL NOT NULL,
    buyer_contact TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
    delivery_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS agroplan_data (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    soil_type TEXT,
    location TEXT,
    previous_crops TEXT,
    recommendations TEXT,
    sustainability_score INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Create super admin account if it doesn't exist
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

if (superAdminEmail && superAdminPassword) {
  const existingSuperAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(superAdminEmail);
  if (!existingSuperAdmin) {
    const passwordHash = await bcrypt.hash(superAdminPassword, 10);
    const superAdminId = uuidv4();
    db.prepare('INSERT INTO users (id, email, password_hash, full_name, user_type) VALUES (?, ?, ?, ?, ?)')
      .run(superAdminId, superAdminEmail, passwordHash, 'Super Admin', 'super_admin');
    db.prepare('INSERT INTO profiles (id) VALUES (?)').run(superAdminId);
    console.log('Super admin account created successfully');
  }
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/crops');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, userType } = req.body;
    
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.prepare('INSERT INTO users (id, email, password_hash, full_name, user_type) VALUES (?, ?, ?, ?, ?)')
      .run(userId, email, passwordHash, fullName, userType);

    db.prepare('INSERT INTO profiles (id) VALUES (?)').run(userId);

    res.json({ 
      id: userId, 
      email, 
      full_name: fullName, 
      user_type: userType 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crop Routes
app.get('/api/crops', (req, res) => {
  try {
    const { farmerId, q, status, page, limit } = req.query;

    // Build WHERE clauses dynamically
    const whereClauses = [];
    const params = [];

    if (farmerId) {
      whereClauses.push('c.farmer_id = ?');
      params.push(farmerId);
    }

    if (status) {
      whereClauses.push('c.status = ?');
      params.push(status);
    }

    if (q) {
      whereClauses.push('(c.name LIKE ? OR c.description LIKE ? OR c.location LIKE ?)');
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Pagination
    const pageNum = parseInt(page) || 1;
    const pageSize = Math.min(parseInt(limit) || 10, 100);
    const offset = (pageNum - 1) * pageSize;

    // Total count for pagination
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM crops c ${whereSql}`);
    const total = countStmt.get(...params).count;

    // Select crops and include farmer's full_name
    const sql = `SELECT c.*, u.full_name as farmer_name FROM crops c LEFT JOIN users u ON c.farmer_id = u.id ${whereSql} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    const crops = db.prepare(sql).all(...params, pageSize, offset);

    res.json({ crops, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/crops', upload.single('image'), (req, res) => {
  try {
    const { farmerId, name, description, quantity, unit, pricePerUnit, harvestDate, location } = req.body;
    const imageUrl = req.file ? `/uploads/crops/${req.file.filename}` : null;
    
    const cropId = uuidv4();
    
    db.prepare(`
      INSERT INTO crops (id, farmer_id, name, description, quantity, unit, price_per_unit, harvest_date, location, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cropId, farmerId, name, description, parseFloat(quantity), unit, parseFloat(pricePerUnit), harvestDate, location, imageUrl);
    
    const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(cropId);
    res.json(crop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/crops/:id', upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, unit, pricePerUnit, harvestDate, location, status } = req.body;
    
    const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(id);
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    let imageUrl = crop.image_url;
    if (req.file) {
      // Delete old image if exists
      if (crop.image_url) {
        const oldImagePath = path.join(__dirname, '../public', crop.image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = `/uploads/crops/${req.file.filename}`;
    }
    
    db.prepare(`
      UPDATE crops 
      SET name = ?, description = ?, quantity = ?, unit = ?, price_per_unit = ?, 
          harvest_date = ?, location = ?, image_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description, parseFloat(quantity), unit, parseFloat(pricePerUnit), harvestDate, location, imageUrl, status || crop.status, id);
    
    const updatedCrop = db.prepare('SELECT * FROM crops WHERE id = ?').get(id);
    res.json(updatedCrop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/crops/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(id);
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    // Delete image file if exists
    if (crop.image_url) {
      const imagePath = path.join(__dirname, '../public', crop.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    db.prepare('DELETE FROM crops WHERE id = ?').run(id);
    res.json({ message: 'Crop deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Routes
app.get('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare(`
      SELECT u.id, u.email, u.full_name, u.user_type, u.created_at,
             p.avatar_url, p.location, p.phone, p.rating
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE u.id = ?
    `).get(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Orders Routes
// Create orders - accepts an array of items { crop_id, quantity } and buyer_id, buyer_contact
app.post('/api/orders', (req, res) => {
  try {
    const { buyer_id, buyer_contact, items } = req.body; // items: [{ crop_id, quantity }]
    if (!buyer_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Invalid order payload' });
    }

    const created = [];
    const insertStmt = db.prepare(`INSERT INTO orders (id, crop_id, buyer_id, quantity, total_price, buyer_contact, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);

    for (const it of items) {
      const crop = db.prepare('SELECT * FROM crops WHERE id = ?').get(it.crop_id);
      if (!crop) return res.status(404).json({ error: `Crop not found: ${it.crop_id}` });
      const qty = parseFloat(it.quantity) || 0;
      const total = qty * crop.price_per_unit;
      const orderId = uuidv4();
      insertStmt.run(orderId, it.crop_id, buyer_id, qty, total, buyer_contact || null, 'pending');
      const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
      created.push(o);
    }

    res.json({ created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List orders. Optional query: farmerId to get orders for crops belonging to a farmer
app.get('/api/orders', (req, res) => {
  try {
    const { farmerId } = req.query;
    let orders;
    if (farmerId) {
      // Join orders -> crops to filter by farmer
      orders = db.prepare(`SELECT o.*, c.farmer_id, c.name as crop_name, c.image_url, u.full_name as buyer_name FROM orders o JOIN crops c ON o.crop_id = c.id LEFT JOIN users u ON o.buyer_id = u.id WHERE c.farmer_id = ? ORDER BY o.created_at DESC`).all(farmerId);
    } else {
      orders = db.prepare(`SELECT o.*, c.name as crop_name, c.image_url, u.full_name as buyer_name FROM orders o LEFT JOIN crops c ON o.crop_id = c.id LEFT JOIN users u ON o.buyer_id = u.id ORDER BY o.created_at DESC`).all();
    }
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve order (admin only)
app.put('/api/orders/:id/approve', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(token);
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.user_type)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    // fetch order and related crop/farmer
    const order = db.prepare(`SELECT o.*, c.farmer_id, c.name as crop_name, u.full_name as buyer_name FROM orders o JOIN crops c ON o.crop_id = c.id LEFT JOIN users u ON o.buyer_id = u.id WHERE o.id = ?`).get(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be approved' });
    }

    // update order
    db.prepare('UPDATE orders SET status = ?, approved_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('confirmed', adminUser.id, id);

    // notify farmer via messages table
    const farmerId = order.farmer_id;
    if (farmerId) {
      const msgId = uuidv4();
      const content = `Your order ${order.id} for ${order.crop_name} has been approved by ${adminUser.full_name || adminUser.email}`;
      db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)').run(msgId, adminUser.id, farmerId, content);
    }

    // return updated order with approver name
    const updated = db.prepare(`SELECT o.*, c.name as crop_name, c.image_url, u.full_name as buyer_name, a.full_name as approver_name FROM orders o LEFT JOIN crops c ON o.crop_id = c.id LEFT JOIN users u ON o.buyer_id = u.id LEFT JOIN users a ON o.approved_by = a.id WHERE o.id = ?`).get(id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes
// Get all users (admin only)
app.get('/api/admin/users', (req, res) => {
  try {
    // Check if user is admin or super_admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(token);
    if (!user || !['admin', 'super_admin'].includes(user.user_type)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const users = db.prepare(`
      SELECT u.id, u.email, u.full_name, u.user_type, u.created_at,
             p.avatar_url, p.location, p.phone, p.rating
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      ORDER BY u.created_at DESC
    `).all();

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user (admin only)
app.post('/api/admin/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(token);
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.user_type)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { email, password, fullName, userType } = req.body;

    // Validate user type
    if (!['farmer', 'buyer', 'admin'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Only super_admin can create admin accounts
    if (userType === 'admin' && adminUser.user_type !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can create admin accounts' });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.prepare('INSERT INTO users (id, email, password_hash, full_name, user_type) VALUES (?, ?, ?, ?, ?)')
      .run(userId, email, passwordHash, fullName, userType);

    db.prepare('INSERT INTO profiles (id) VALUES (?)').run(userId);

    res.json({
      id: userId,
      email,
      full_name: fullName,
      user_type: userType
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (admin only)
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(token);
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.user_type)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const { email, password, fullName, userType } = req.body;

    // Prevent modifying super_admin
    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.user_type === 'super_admin') {
      return res.status(403).json({ error: 'Cannot modify super admin' });
    }

    // Only super_admin can modify admin accounts
    if (targetUser.user_type === 'admin' && adminUser.user_type !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can modify admin accounts' });
    }

    // Validate user type
    if (userType && !['farmer', 'buyer', 'admin'].includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Only super_admin can change to admin
    if (userType === 'admin' && adminUser.user_type !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can create admin accounts' });
    }

    let updateFields = [];
    let params = [];

    if (email) {
      updateFields.push('email = ?');
      params.push(email);
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateFields.push('password_hash = ?');
      params.push(passwordHash);
    }

    if (fullName) {
      updateFields.push('full_name = ?');
      params.push(fullName);
    }

    if (userType) {
      updateFields.push('user_type = ?');
      params.push(userType);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    db.prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`).run(...params);

    const updatedUser = db.prepare(`
      SELECT u.id, u.email, u.full_name, u.user_type, u.created_at,
             p.avatar_url, p.location, p.phone, p.rating
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE u.id = ?
    `).get(id);

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(token);
    if (!adminUser || !['admin', 'super_admin'].includes(adminUser.user_type)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    // Prevent deleting super_admin
    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.user_type === 'super_admin') {
      return res.status(403).json({ error: 'Cannot delete super admin' });
    }

    // Only super_admin can delete admin accounts
    if (targetUser.user_type === 'admin' && adminUser.user_type !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can delete admin accounts' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Messaging Routes
// Get messages for user
app.get('/api/messages', (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const messages = db.prepare(`
      SELECT m.*,
             s.full_name as sender_name, s.user_type as sender_type,
             r.full_name as receiver_name, r.user_type as receiver_type
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.created_at DESC
    `).all(userId, userId);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
app.post('/api/messages', (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ error: 'senderId, receiverId, and content required' });
    }

    // Validate users exist
    const sender = db.prepare('SELECT * FROM users WHERE id = ?').get(senderId);
    const receiver = db.prepare('SELECT * FROM users WHERE id = ?').get(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate messaging permissions
    const isAdminSender = ['admin', 'super_admin'].includes(sender.user_type);
    const isAdminReceiver = ['admin', 'super_admin'].includes(receiver.user_type);

    // Allow: user to admin, admin to user, admin to admin
    if (!isAdminSender && !isAdminReceiver) {
      return res.status(403).json({ error: 'Users cannot message each other directly' });
    }

    const messageId = uuidv4();
    db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)')
      .run(messageId, senderId, receiverId, content);

    const message = db.prepare(`
      SELECT m.*,
             s.full_name as sender_name, s.user_type as sender_type,
             r.full_name as receiver_name, r.user_type as receiver_type
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      WHERE m.id = ?
    `).get(messageId);

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark message as read
app.put('/api/messages/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // Verify user can mark this message as read
    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.receiver_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    db.prepare('UPDATE messages SET read = 1 WHERE id = ?').run(id);
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public route to get admins
app.get('/api/admins', (req, res) => {
  try {
    const admins = db.prepare(`
      SELECT u.id, u.email, u.full_name, u.user_type, u.created_at,
             p.avatar_url, p.location, p.phone, p.rating
      FROM users u
      LEFT JOIN profiles p ON u.id = p.id
      WHERE u.user_type IN ('admin', 'super_admin')
      ORDER BY u.user_type DESC, u.created_at ASC
    `).all();

    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AgroPlan route - accept soil/location data + optional image and return AI recommendations
app.post('/api/agroplan/analyze', upload.single('soilImage'), async (req, res) => {
  try {
    const {
      inputMode,
      location,
      previousCrops,
      soilPh,
      soilMoisture,
      soilType,
      simpleInput,
    } = req.body;

    const soilImage = req.file;

    let userPrompt = '';

    if (inputMode === 'detailed') {
      userPrompt = `
        Analyze the following farm data:
        - Location: ${location}
        - Soil Type: ${soilType}
        - Soil pH: ${soilPh}
        - Soil Moisture: ${soilMoisture}%
        - Previous Crops: ${previousCrops}
      `;
    } else {
      userPrompt = `
        Analyze the following farm data:
        - User Description: "${simpleInput}"
      `;
    }

    const systemPrompt = `
      You are AgroAdvisor, an expert AI agronomist. Your goal is to provide comprehensive, actionable advice to farmers.
      Analyze the provided data (and image if available) and return a JSON object with the following structure:
      {
        "weather": { "location": "...", "temperature": "...", "forecast": "...", "wind": "..." },
        "soilAnalysis": { "ph": "...", "moisture": "...", "type": "...", "summary": "..." },
        "warnings": [{ "title": "...", "description": "..." }],
        "recommendations": {
          "crops": [{ "name": "...", "suitability": "High/Medium/Low", "notes": "..." }],
          "fertilizer": "...",
          "irrigation": "...",
          "sustainability": ["...", "...", "..."]
        }
      }
      - Infer the weather based on the location.
      - If an image is provided, analyze it for soil color, texture, and potential issues.
      - The response MUST be a valid JSON object.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    // Optionally, save the analysis to the database
    // const { userId } = req.body; // Assuming you send userId
    // if (userId) {
    //   db.prepare('INSERT INTO agroplan_data (id, user_id, recommendations) VALUES (?, ?, ?)')
    //     .run(uuidv4(), userId, JSON.stringify(analysis));
    // }

    res.json(analysis);

  } catch (error) {
    console.error('Error in /api/agroplan/analyze:', error);

    // Handle specific API errors
    if (error.status === 402 || error.status === 429) {
      return res.status(402).json({ error: 'Insufficient API credits or quota exceeded. Please check your OpenAI account billing and top up if necessary to continue using the AI advisory features.' });
    }

    res.status(500).json({ error: 'Failed to generate AI analysis.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
