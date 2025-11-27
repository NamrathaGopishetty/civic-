# Authority Portal Integration Guide

## Overview
The authority web portal is now fully connected to MongoDB and Cloudinary, with Nominatim integration for location geocoding. Both authorities and users can track issues in real-time.

## Features Implemented

### 1. **Authority Registration with Nominatim**
- Authority registers with: Name, Phone, Email, Password, Department, Department Location (Address + City)
- Nominatim automatically geocodes the department location to get latitude/longitude
- Location data is stored in MongoDB

### 2. **Issue Filtering by Department**
- Authorities only see issues matching their department category
- Filter by Priority (High/Medium/Low)
- Filter by Status (Pending/Acknowledged/In Progress/Resolved)

### 3. **Issue Acceptance & Tracking**
- When authority clicks "Accept Issue" (Acknowledged status):
  - Issue is assigned to that authority
  - Authority name and department are recorded
  - Timeline entry is created
  - Both authority and user can now track the issue

### 4. **User Data Display**
- Web portal shows:
  - Reporter name, phone, email
  - Issue images from Cloudinary
  - Location with map link
  - Complete timeline of status updates

### 5. **Real-time Issue Tracking**
- Both authority and user can see:
  - Current status
  - Complete timeline with timestamps
  - Who updated the status
  - Notes for each update
  - Assigned officer information

## API Endpoints

### Authority Registration
```
POST /api/auth/register-authority
Body: {
  name, phone, email, password, department,
  departmentLocation: { address, city }
}
```

### Get Issues (Filtered by Department)
```
GET /api/issues?transform=true&priority=High&status=Pending
Headers: Authorization: Bearer <token>
```

### Update Issue Status
```
PUT /api/issues/:id/status?transform=true
Body: { status, notes }
Headers: Authorization: Bearer <token>
```

## Database Schema

### User Model (Authority)
```javascript
{
  name, phone, email, password,
  role: "authority",
  department: "Roads" | "Water" | "Sanitation" | "Electricity" | "Other",
  departmentLocation: {
    address, city, latitude, longitude
  }
}
```

### Issue Model
```javascript
{
  user: ObjectId (reporter),
  description, category, priority,
  location: { latitude, longitude, address },
  media: [{ url, type }], // Cloudinary URLs
  status: "Pending" | "Acknowledged" | "In Progress" | "Resolved",
  assignedTo: {
    authority: ObjectId,
    assignedAt: Date
  },
  assignedDepartment, assignedOfficerName,
  timeline: [{ status, timestamp, note }]
}
```

## How It Works

1. **Authority Registration:**
   - Authority fills registration form
   - Backend uses Nominatim to geocode department location
   - Coordinates are stored in MongoDB

2. **Issue Viewing:**
   - Authority logs in
   - Backend filters issues by authority's department
   - Only matching category issues are shown

3. **Issue Acceptance:**
   - Authority clicks "Accept Issue"
   - Status changes to "Acknowledged"
   - Issue is assigned to that authority
   - Timeline entry is created
   - User can see the update in mobile app

4. **Status Updates:**
   - Authority updates status (In Progress, Resolved)
   - Timeline entry is added
   - Both authority and user see the update
   - Images from Cloudinary are displayed

## Testing

1. **Register an Authority:**
   - Open `web-portal/index.html`
   - Register with department "Roads"
   - Enter department location (address + city)
   - Nominatim will geocode the location

2. **View Issues:**
   - Login as authority
   - Only "Roads" category issues will appear
   - Filter by priority/status

3. **Accept and Track:**
   - Click "Accept Issue" on an issue
   - View issue details to see timeline
   - Check mobile app - user should see the update

4. **Update Status:**
   - Change status to "In Progress" or "Resolved"
   - Timeline updates in both portal and mobile app

## Notes

- Nominatim geocoding happens automatically during registration
- Cloudinary images are displayed in both portal and mobile app
- Timeline is synchronized between portal and mobile app
- Department filtering ensures authorities only see relevant issues





