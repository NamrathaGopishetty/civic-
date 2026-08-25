# Web Portal Integration Guide

## Overview
The web portal (`jharkhand-civic-track-main`) is now connected to the same shared backend that powers the mobile app. Both use:
- **MongoDB** database (`mongodb://127.0.0.1:27017/civic-app`)
- **Cloudinary** for media storage
- **Shared API endpoints** on port 4000

## Setup Instructions

### 1. Backend Setup
The shared backend is located in `backend/` directory:

```bash
cd backend
npm install
npm start
```

The backend will run on **port 4000** (or next available port if 4000 is busy).

### 2. Web Portal Setup
The web portal frontend is located in `jharkhand-civic-track-main/jharkhand-civic-track-main/`:

```bash
cd jharkhand-civic-track-main/jharkhand-civic-track-main
npm install
npm run dev
```

The web portal will run on **port 5173** (Vite default).

### 3. Environment Variables

#### Backend (.env in `backend/`)
```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/civic-app
JWT_SECRET=your_secret_key_here
CLOUDINARY_CLOUD=your_cloud_name
CLOUDINARY_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret
```

#### Web Portal (.env in `jharkhand-civic-track-main/jharkhand-civic-track-main/`)
```env
VITE_API_URL=http://localhost:4000/api
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Issues
- `GET /api/issues` - Get all issues (with filters: status, category, city)
- `GET /api/issues/my` - Get user's issues (mobile app)
- `GET /api/issues/:id` - Get issue by ID
- `POST /api/issues/create` - Create new issue (mobile app)
- `PUT /api/issues/:id/status` - Update issue status (web portal)
- `GET /api/issues/analytics` - Get analytics data

## Data Transformation

The backend automatically transforms data for the web portal when the `transform=true` query parameter or `X-Transform: true` header is sent. This converts:
- MongoDB `_id` → `id`
- Status values: `Pending` → `NEW`, `Acknowledged` → `ACKNOWLEDGED`, etc.
- Category values: `Roads` → `POTHOLES`, `Water` → `WATER`, etc.
- Adds computed fields: `title`, `slaBreached`, `ageInHours`, etc.

## Features

### Shared Database
- Both mobile app and web portal read/write to the same MongoDB database
- Issues created on mobile appear in web portal dashboard
- Status updates from web portal reflect in mobile app

### Shared Media Storage
- All images/videos uploaded via mobile app are stored in Cloudinary
- Web portal can display media from mobile submissions
- Media URLs are accessible from both platforms

### Role-Based Access
- Users have a `role` field: `citizen`, `authority`, or `admin`
- Web portal is designed for `authority` and `admin` roles
- Mobile app is for `citizen` role

## Testing the Connection

1. Start the backend: `cd backend && npm start`
2. Start the web portal: `cd jharkhand-civic-track-main/jharkhand-civic-track-main && npm run dev`
3. Create an issue via mobile app
4. Check the web portal dashboard - the issue should appear
5. Update issue status in web portal
6. Check mobile app - status should be updated

## Troubleshooting

### Port Conflicts
If port 4000 is busy, the backend will automatically try the next available port. Update `VITE_API_URL` in web portal `.env` to match.

### CORS Issues
The backend has CORS enabled for all origins. If you encounter CORS errors, check that the backend is running and accessible.

### Data Format Mismatches
The backend includes automatic transformation for web portal requests. Ensure you're sending `transform=true` or `X-Transform: true` header.

## Next Steps

- Add role-based access control for issue viewing/editing
- Implement real-time updates using Socket.IO
- Add more analytics endpoints
- Implement notification system


