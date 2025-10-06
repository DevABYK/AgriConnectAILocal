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
    const { farmerId } = req.query;
    let crops;
    
    if (farmerId) {
      crops = db.prepare('SELECT * FROM crops WHERE farmer_id = ? ORDER BY created_at DESC').all(farmerId);
    } else {
      crops = db.prepare('SELECT * FROM crops ORDER BY created_at DESC').all();
    }
    
    res.json(crops);
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
