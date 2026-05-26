# Database Setup Instructions

## Overview

Your app now uses a **db.json** file on the backend server to persist all data instead of browser localStorage. This means:

- ✅ Data survives app restarts
- ✅ Data is stored on the server in a JSON file
- ✅ All changes are automatically saved

## Project Structure

```
employee-entry-ledger/
├── db.json              ← Persistent data file (auto-created)
├── server.ts            ← Express backend (runs on port 3001)
├── src/
│   ├── App.tsx          ← Loads data from API
│   ├── components/
│   │   ├── EmployeeForm.tsx   ← Saves to API
│   │   ├── EntryForm.tsx      ← Saves to API
│   │   └── EntryList.tsx      ← Manages data via API
│   └── ...
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## How to Run

### Option 1: Run Both Server & App Together (Recommended)

```bash
npm start
```

This will:

- Start the backend server on port 3001
- Start the Vite dev server on port 3000
- Open http://localhost:3000 in your browser

### Option 2: Run Separately (For Development)

**Terminal 1 - Start Backend:**

```bash
npm run server
```

Server runs on: `http://localhost:3001`

**Terminal 2 - Start Frontend:**

```bash
npm run dev
```

Frontend runs on: `http://localhost:3000`

## Data Storage

### db.json Format

```json
{
  "employees": [
    {
      "id": "uuid",
      "name": "Employee Name",
      "address": "Location",
      "createdAt": "2026-05-26T..."
    }
  ],
  "entries": [
    {
      "id": "uuid",
      "name": "Employee Name",
      "amount": 1000,
      "address": "Location",
      "date": "May 26, 2026, 10:30 AM"
    }
  ],
  "lastUpdated": "2026-05-26T..."
}
```

### Auto-Saved Operations

These operations automatically update `db.json`:

- ✅ Add new employee
- ✅ Add new entry
- ✅ Edit entry
- ✅ Delete entry
- ✅ Clear all entries
- ✅ Import JSON data

### Manual Export/Import

- **Save JSON**: Downloads your data as a backup JSON file
- **Load JSON**: Import data from a JSON file (merge or replace)
- **Export Excel**: Downloads data as Excel spreadsheet

## Features

| Feature          | Status    | Notes                         |
| ---------------- | --------- | ----------------------------- |
| Add Employees    | ✅ Active | Saved to db.json              |
| Add Entries      | ✅ Active | Multiple per employee allowed |
| Edit Entries     | ✅ Active | Updates db.json               |
| Delete Entries   | ✅ Active | Updates db.json               |
| Export Excel     | ✅ Active | Downloads XLSX file           |
| Save JSON        | ✅ Active | Downloads JSON backup         |
| Load JSON        | ✅ Active | Merge or replace data         |
| Data Persistence | ✅ Active | Uses db.json file             |

## Troubleshooting

### Server Won't Start

```bash
# Check if port 3001 is already in use
# Kill existing process or use different port
```

### CORS Errors

If you see CORS errors, ensure:

1. Server is running on http://localhost:3001
2. Frontend is running on http://localhost:3000
3. Both are running together

### Data Not Saving

1. Check that `db.json` file exists in root directory
2. Verify server is running (check terminal)
3. Check browser console for API errors (F12 → Console)

### API Endpoints (For Reference)

```
GET    /api/data              → Get all data
GET    /api/employees         → Get all employees
POST   /api/employees         → Add employee (via body)
PUT    /api/employees         → Update employees list
GET    /api/entries           → Get all entries
POST   /api/entries           → Add entry
PUT    /api/entries           → Update entries list
DELETE /api/entries/:id       → Delete entry
```

## Backup & Recovery

### Backup Your Data

1. Click "Save JSON" button in the app
2. A JSON file will download automatically
3. Keep this file safe

### Restore Your Data

1. Click "Load JSON" button in the app
2. Select your backed-up JSON file
3. Choose "Merge" or "Replace"

## Notes

- Data is stored on the server in `db.json`
- No data is stored in browser localStorage anymore
- If you delete `db.json`, a new empty one will be created on next run
- The `lastUpdated` field tracks when db.json was last modified
