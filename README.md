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

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd farm-link-intelligence
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

### Database Setup

The application uses SQLite for data persistence. The database file (`data/app.db`) and image uploads directory (`public/uploads/crops/`) are created automatically when you first run the application.

### User Accounts

You can create accounts as either a farmer or buyer:
- **Farmers**: Can list crops for sale with photos
- **Buyers**: Can browse and purchase crops

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── crops/          # Crop listing components
│   ├── dashboard/      # Dashboard components
│   └── ui/             # Reusable UI components
├── lib/
│   ├── database.ts     # SQLite database setup
│   ├── dbService.ts    # Database operations
│   └── imageUtils.ts   # Image upload utilities
├── pages/              # Page components
└── data/               # SQLite database file (created automatically)
public/uploads/crops/   # Crop images (created automatically)
```

## Key Features Implementation

### Crop Listings with Photos
- Farmers can upload crop photos (JPEG, PNG, GIF, WebP)
- Images are stored locally in `public/uploads/crops/`
- Automatic image validation and resizing
- CRUD operations for crop management

### Authentication System
- User registration and login
- Password hashing with bcrypt
- Session management via localStorage
- Role-based access (farmer/buyer)

### Database Schema
- **Users**: Authentication and profile data
- **Crops**: Crop listings with farmer references
- **Messages**: Chat functionality
- **Orders**: Purchase transactions
- **AgroPlan Data**: AI planning data

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

1. Update the database schema in `src/lib/database.ts`
2. Add new service methods in `src/lib/dbService.ts`
3. Create UI components in the appropriate directory
4. Update routing in `src/App.tsx` if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
