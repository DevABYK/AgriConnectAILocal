# AgriConnect2 - Farm Link Intelligence

A comprehensive web application connecting farmers and buyers in Kenya, featuring crop listings with photos, real-time messaging, AI-powered agricultural planning, and integrated payment systems.

## Features

- **Farmer Dashboard**: Crop listing management with photo uploads
- **Buyer Platform**: Browse crops by location, price, and quality
- **Smart Matching**: Location-based farmer-buyer pairing
- **Real-time Chat**: Communication between farmers and buyers
- **AgroPlan AI**: AI-powered soil and crop planning assistant
- **Local Storage**: SQLite database with local file storage for images

## Technologies Used

- **Frontend**: React, TypeScript, Vite
- **UI Framework**: shadcn/ui, Tailwind CSS
- **Database**: SQLite (better-sqlite3)
- **Authentication**: Custom auth with bcrypt password hashing
- **File Storage**: Local file system for crop images
- **State Management**: React hooks
```markdown
# AgriConnect2 — Farm Link Intelligence

A modern web platform connecting farmers and buyers. AgriConnect2 provides crop listings with photos, role-based dashboards (farmer & buyer), real-time chat, and an AI-powered AgroPlan assistant to help with crop planning.

Status: Work in progress — actively developed

Key features
- Crop listings with image uploads
- Farmer and buyer dashboards
- Real-time messaging
- AgroPlan: AI-driven crop and soil guidance
- Local SQLite storage with simple file-based image uploads

Quick start
1. Install dependencies
```powershell
npm install
```
2. Run the dev server
```powershell
npm run dev
```
3. Open http://localhost:5173 (or the URL shown by the dev server)

Notes
- The project uses Vite + React + TypeScript and Tailwind (shadcn/ui components).
- Database: SQLite (data/app.db). Uploads are stored in `public/uploads/crops/`.

Project layout (important dirs)
```
src/                # React app (components, pages, hooks, UI)
server/             # Minimal backend server (if used)
public/uploads/     # Uploaded crop images
data/               # SQLite database file
```

Contributing
- Create a branch, add changes, and open a pull request.

License
- MIT

``` 
│   ├── auth/           # Authentication components
