import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, "db.json");

// Middleware
app.use(express.json());

// Enable CORS for local development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Initialize db.json if it doesn't exist
const initializeDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      employees: [],
      entries: [],
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    console.log("✅ db.json initialized");
  }
};

// Read from db.json
const readDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading db.json:", error);
    return {
      employees: [],
      entries: [],
      lastUpdated: new Date().toISOString(),
    };
  }
};

// Write to db.json
const writeDB = (data: any) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    console.log("✅ db.json updated");
  } catch (error) {
    console.error("Error writing to db.json:", error);
  }
};

// GET all data
app.get("/api/data", (req, res) => {
  const db = readDB();
  res.json(db);
});

// GET employees
app.get("/api/employees", (req, res) => {
  const db = readDB();
  res.json(db.employees || []);
});

// POST new employee (add single)
app.post("/api/employees", (req, res) => {
  const db = readDB();
  const newEmployee = req.body;

  // Check for duplicates
  const isDuplicate = db.employees.some(
    (emp: any) => emp.name.toLowerCase() === newEmployee.name.toLowerCase(),
  );

  if (isDuplicate) {
    return res.status(400).json({
      error: `Employee "${newEmployee.name}" already exists`,
    });
  }

  db.employees.push(newEmployee);
  db.lastUpdated = new Date().toISOString();
  writeDB(db);

  res.json(db.employees);
});

// PUT update employees list (with duplicate validation)
app.put("/api/employees", (req, res) => {
  const db = readDB();
  const newEmployees = req.body;

  // Validate for duplicates
  const employeeNames = new Set();
  for (const emp of newEmployees) {
    const nameLower = emp.name.toLowerCase();
    if (employeeNames.has(nameLower)) {
      return res.status(400).json({
        error: `Duplicate employee name: "${emp.name}" already exists`,
      });
    }
    employeeNames.add(nameLower);
  }

  db.employees = newEmployees;
  db.lastUpdated = new Date().toISOString();
  writeDB(db);

  res.json(db.employees);
});

// GET entries
app.get("/api/entries", (req, res) => {
  const db = readDB();
  res.json(db.entries || []);
});

// POST new entry
app.post("/api/entries", (req, res) => {
  const db = readDB();
  const newEntry = req.body;

  db.entries.unshift(newEntry); // Add to beginning (newest first)
  db.lastUpdated = new Date().toISOString();
  writeDB(db);

  res.json(db.entries);
});

// PUT update entries list
app.put("/api/entries", (req, res) => {
  const db = readDB();
  db.entries = req.body;
  db.lastUpdated = new Date().toISOString();
  writeDB(db);
  res.json(db.entries);
});

// DELETE entry
app.delete("/api/entries/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;

  db.entries = db.entries.filter((entry: any) => entry.id !== id);
  db.lastUpdated = new Date().toISOString();
  writeDB(db);

  res.json(db.entries);
});

// Initialize and start server
initializeDB();
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Data stored in: ${DB_FILE}`);
});
