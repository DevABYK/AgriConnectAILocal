import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Database setup
const dbPath = path.join(__dirname, '../data/app.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Ensure buyer_contact column exists in orders table (for older DBs)
try {
  const col = db.prepare("PRAGMA table_info(orders)").all().find(c => c.name === 'buyer_contact');
  if (!col) {
    db.prepare("ALTER TABLE orders ADD COLUMN buyer_contact TEXT").run();
    console.log('Migrated: added orders.buyer_contact');
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
    user_type TEXT NOT NULL CHECK (user_type IN ('farmer', 'buyer')),
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
