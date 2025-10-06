# Testing Instructions for AgriConnect2

## Migration Status: ✅ COMPLETE

The application has been successfully migrated from Supabase to a local SQLite + Express.js backend.

## How to Run the Application

### Step 1: Stop Current Servers
If servers are running, press `Ctrl+C` in the terminal to stop them.

### Step 2: Start Both Servers
```bash
npm run dev:all
```

This will start:
- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:8080

### Alternative: Run Separately
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run dev
```

## Testing Checklist

### 1. User Registration & Authentication
- [ ] Open http://localhost:8080
- [ ] Click "Get Started" or "Sign In"
- [ ] Register as a Farmer
  - Email: farmer@test.com
  - Password: password123
  - Full Name: Test Farmer
  - User Type: Farmer
- [ ] Verify successful registration
- [ ] Logout
- [ ] Login with same credentials
- [ ] Verify redirect to Farmer Dashboard

### 2. Crop Listings
- [ ] Click "Add Crop" button
- [ ] Fill in crop details:
  - Name: Tomatoes
  - Description: Fresh organic tomatoes
  - Quantity: 100
  - Unit: kg
  - Price: 80
  - Harvest Date: (select a date)
  - Location: Nairobi, Kenya
- [ ] Upload a crop photo
- [ ] Click "Add Crop"
- [ ] Verify crop appears in dashboard
- [ ] Verify crop count updates in stats

### 3. Edit Crop
- [ ] Click Edit button on a crop
- [ ] Modify crop details
- [ ] Click "Update Crop"
- [ ] Verify changes are saved

### 4. Delete Crop
- [ ] Click Delete button on a crop
- [ ] Confirm deletion
- [ ] Verify crop is removed
- [ ] Verify crop count updates

### 5. Buyer Account (Optional)
- [ ] Logout from farmer account
- [ ] Register as a Buyer
- [ ] Verify Buyer Dashboard loads

## Troubleshooting

### Blank Page Issue
If you see a blank page:
1. Stop the dev server (Ctrl+C)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Restart: `npm run dev:all`
4. Hard refresh browser (Ctrl+F5)

### Port Already in Use
If port 3001 or 8080 is in use:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or change ports in:
# - server/index.js (line 10)
# - vite.config.ts (line 8)
```

### Database Issues
If database errors occur:
```bash
# Delete and recreate database
Remove-Item data/app.db -Force
# Restart server - database will be recreated
```

### Image Upload Issues
If images don't upload:
```bash
# Ensure upload directory exists
mkdir -p public/uploads/crops
```

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Crops
- `GET /api/crops?farmerId=xxx` - Get farmer's crops
- `POST /api/crops` - Create crop (multipart/form-data)
- `PUT /api/crops/:id` - Update crop (multipart/form-data)
- `DELETE /api/crops/:id` - Delete crop

### Users
- `GET /api/users/:id` - Get user profile

## File Locations

### Backend
- Server: `server/index.js`
- Database: `data/app.db` (auto-created)
- Uploads: `public/uploads/crops/` (auto-created)

### Frontend
- API Client: `src/lib/api.ts`
- Auth Form: `src/components/auth/AuthForm.tsx`
- Farmer Dashboard: `src/components/dashboard/FarmerDashboard.tsx`
- Add Crop Form: `src/components/crops/AddCropForm.tsx`
- Crop Card: `src/components/crops/CropCard.tsx`

## Success Criteria

✅ User can register and login
✅ Farmer dashboard displays correctly
✅ Crops can be added with photos
✅ Crops display in dashboard with images
✅ Crops can be edited
✅ Crops can be deleted
✅ Dashboard stats update correctly
✅ No console errors
✅ Backend API responds correctly

## Next Development Steps

After successful testing:
1. Implement Buyer Dashboard features
2. Add messaging system between farmers and buyers
3. Integrate M-Pesa payment API
4. Add Google Maps for location services
5. Connect AgroPlan AI features
6. Implement order management
7. Add real-time notifications

## Support

If you encounter issues:
1. Check browser console for errors (F12)
2. Check terminal for backend errors
3. Verify both servers are running
4. Check database file exists: `data/app.db`
5. Verify upload directory exists: `public/uploads/crops/`

## Notes

- Database is SQLite (local file)
- Images stored locally in `public/uploads/crops/`
- Authentication uses localStorage (no JWT tokens)
- Password hashing with bcrypt
- CORS enabled for localhost:8080
- File uploads limited to 5MB
