# IO Space - Multi-Location Classroom Management System

A comprehensive classroom management system for multi-location educational instituitions built with React, Node.js, Express, and MongoDB.

## Prerequisites

Before running this project locally, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5.0 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

## MongoDB Setup

### Option 1: Install MongoDB Locally (Recommended)

#### For Windows:

1. Download MongoDB Community Server from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the setup wizard
3. Choose "Complete" installation
4. Install MongoDB as a Windows Service (recommended)
5. MongoDB will start automatically

#### For macOS:

```bash
# Using Homebrew (recommended)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

#### For Linux (Ubuntu/Debian):

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 2: Use MongoDB Atlas (Cloud)

If you prefer using MongoDB Atlas (cloud database):

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update the `MONGODB_URI` in `server/.env` file

## Project Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd io-space
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 4. Environment Configuration

The backend environment file is already created at `server/.env` with the following configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/io-space

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex-2024
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-make-it-even-longer-2024
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Security Configuration
BCRYPT_SALT_ROUNDS=12
```

**Important**: In production, make sure to:

- Use strong, unique JWT secrets
- Use environment-specific database URLs
- Enable authentication on your MongoDB instance

### 5. Start the Application

#### Option 1: Start Both Servers Separately

**Terminal 1 - Start Backend Server:**

```bash
cd server
npm run dev
```

The backend will run on `http://localhost:5000`

**Terminal 2 - Start Frontend Server:**

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

#### Option 2: Start Both Servers Concurrently

```bash
# Install concurrently globally (if not already installed)
npm install -g concurrently

# Start both servers
npm run dev:all
```

## Verification

### 1. Check MongoDB Connection

- Open MongoDB Compass (if installed) and connect to `mongodb://localhost:27017`
- Or use the MongoDB shell: `mongosh`

### 2. Check Backend API

- Visit `http://localhost:5000/api/health`
- You should see a JSON response indicating the server is running

### 3. Check Frontend

- Visit `http://localhost:5173`
- You should see the IO Space login page

## Default Admin Account

To create an admin account, you can register through the registration form and then manually update the user's role and status in the database:

```javascript
// Connect to MongoDB shell
mongosh

// Use the io-space database
use io-space

// Update a user to be an admin
db.users.updateOne(
  { email: "your-email@example.com" },
  {
    $set: {
      role: "admin",
      status: "active"
    }
  }
)
```

## Demo Accounts

The application includes demo accounts for testing:

- **Admin**: admin@school.com / password
- **Teacher**: teacher@school.com / password
- **Student**: student@school.com / password
- **Parent**: parent@school.com / password

_Note: These are mock accounts for frontend demonstration. For full functionality, register new accounts through the registration form._

## Features

- **Multi-role Authentication** (Admin, Teacher, Student, Parent)
- **User Registration & Approval System**
- **Location Management** (Nelliyadi, Chavakacheri)
- **Class Management**
- **Attendance Tracking**
- **Fee Management**
- **Materials & Resources**
- **Notice Board**
- **Reports & Analytics**

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/pending` - Get pending approvals (Admin only)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users

- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id/approve` - Approve user (Admin only)
- `PUT /api/users/:id/reject` - Reject user (Admin only)

### Locations

- `GET /api/locations` - Get all locations
- `POST /api/locations` - Create location (Admin only)

### Classes

- `GET /api/classes` - Get classes
- `POST /api/classes` - Create class (Admin only)

## Troubleshooting

### MongoDB Connection Issues

1. **Check if MongoDB is running:**

   ```bash
   # Windows
   net start MongoDB

   # macOS/Linux
   brew services list | grep mongodb
   # or
   sudo systemctl status mongod
   ```

2. **Check MongoDB logs:**

   ```bash
   # Default log location
   tail -f /var/log/mongodb/mongod.log
   ```

3. **Verify MongoDB port:**
   ```bash
   netstat -an | grep 27017
   ```

### Backend Issues

1. **Check if port 5000 is available:**

   ```bash
   netstat -an | grep 5000
   ```

2. **Check backend logs in the terminal**

3. **Verify environment variables are loaded**

### Frontend Issues

1. **Clear browser cache and cookies**
2. **Check browser console for errors**
3. **Verify API endpoints are accessible**

## Development

### Project Structure

```
io-space/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── types/             # TypeScript types
│   └── ...
├── server/                # Backend Node.js application
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── ...
└── ...
```

### Adding New Features

1. Create new components in `src/components/`
2. Add new API routes in `server/routes/`
3. Update types in `src/types/index.ts`
4. Test thoroughly before deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
