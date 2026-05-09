# Instigator - Full Stack Messaging App

A modern, full-stack messaging and social dashboard application inspired by Twitter/X and Instigator. Built with Node.js, Express, PostgreSQL, and vanilla JavaScript following The Odin Project's Full Stack JavaScript curriculum.

## Features

✨ **User Authentication**
- Register new accounts with unique usernames
- Login with encrypted passwords (bcrypt)
- Guest account access for testing
- Session-based authentication with Passport.js

💬 **Messaging & Posts**
- Create, read, and delete posts
- Real-time post feed
- Like/unlike functionality
- Comments on posts
- Character-limited composing

👥 **User Management**
- View all users on the platform
- Search users by username
- View user profiles with post history
- User statistics (post count, join date)

🎨 **Modern UI**
- Clean, minimal design inspired by Instigator
- Responsive layout (desktop and mobile)
- Smooth animations and transitions
- Real-time updates
- Dark/light theme ready

## Tech Stack

### Backend
- **Node.js & Express.js** - Server framework
- **PostgreSQL** - Database
- **Passport.js** - Authentication
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **pg** - PostgreSQL client

### Frontend
- **Vanilla JavaScript** - No frameworks (SPA routing)
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables
- **REST API** - Backend communication

## Project Structure

```
messaging-app/
├── server.js              # Main server file with Express setup
├── package.json           # Dependencies
├── .env.example          # Environment variables template
├── public/
│   ├── index.html        # HTML entry point
│   ├── app.js            # Frontend JavaScript (routing, state, UI)
│   └── styles.css        # All styling
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. **Clone or download the project**
```bash
cd messaging-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Create PostgreSQL database**
```bash
createdb messaging_app
```

4. **Configure environment variables**
```bash
cp .env.example .env
```

Then edit `.env` with your database credentials:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/messaging_app
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
PORT=3000
```

5. **Start the server**
```bash
npm run dev    # Development with nodemon
# or
npm start      # Production
```

6. **Open in browser**
Navigate to `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/guest-login` - Login as guest
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post (authenticated)
- `GET /api/posts/:id` - Get specific post
- `DELETE /api/posts/:id` - Delete post (authenticated, owner only)
- `POST /api/posts/:id/like` - Like/unlike post (authenticated)

### Comments
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Create comment (authenticated)

### Users
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/:id` - Get user profile with posts

## Usage

### Creating an Account
1. Click "Register" on the login page
2. Enter a unique username and password
3. Click "Sign In" to create account and login

### Guest Access
- Click "Continue as Guest" to explore without registering
- Guest account can view posts and users but cannot create posts

### Creating Posts
1. Login to your account
2. Type your message in the post composer
3. Click "Post" to publish

### Interacting with Posts
- Click the heart icon (🤍/❤️) to like/unlike
- Click the comment icon (💬) to view/add comments
- Click the three dots (⋮) to delete your own posts

### Exploring Users
1. Navigate to "Users" tab
2. Browse all users or search by username
3. Click a user card to view their profile and posts

## Database Schema

### users
```sql
id: SERIAL PRIMARY KEY
username: VARCHAR(50) UNIQUE
password: VARCHAR(255)
created_at: TIMESTAMP
```

### posts
```sql
id: SERIAL PRIMARY KEY
user_id: INTEGER (FK users)
content: TEXT
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### likes
```sql
id: SERIAL PRIMARY KEY
post_id: INTEGER (FK posts)
user_id: INTEGER (FK users)
created_at: TIMESTAMP
UNIQUE(post_id, user_id)
```

### comments
```sql
id: SERIAL PRIMARY KEY
post_id: INTEGER (FK posts)
user_id: INTEGER (FK users)
content: TEXT
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

## Code Highlights

### Frontend Architecture
The frontend uses a single-page application (SPA) pattern with vanilla JavaScript:

```javascript
// State management
const app = {
  user: null,
  currentPage: 'home',
  posts: [],
  render() { /* renders current page */ }
};

// API client
const API = {
  async getPosts() { /* fetch posts */ },
  async createPost(content) { /* create post */ }
};
```

### Authentication Flow
1. User submits credentials
2. Passport.js validates against bcrypt-hashed password
3. User session is created and stored
4. Frontend receives user object and updates state

### Real-time Updates
Posts are fetched fresh from API and re-rendered without page reload, creating a real-time feel.

## Styling Approach

- **CSS Variables** - Centralized color and spacing system
- **Mobile-First** - Responsive design using media queries
- **Animations** - Subtle fade-ins and slide transitions
- **Accessibility** - Proper semantic HTML and color contrast

## Development Notes

### Adding Features

**To add direct messaging:**
1. Create `conversations` and `messages` tables
2. Add API endpoints for fetching/creating messages
3. Update frontend to include messaging UI

**To add following system:**
1. Create `follows` table with user_id and follower_id
2. Filter home feed to show only followed users' posts
3. Add follow/unfollow buttons to user profiles

**To add notifications:**
1. Create `notifications` table
2. Emit events when posts/comments receive interactions
3. Display notification badge in sidebar

### Testing

Use these credentials to test:
- Username: `testuser`
- Password: `testpass123`

Or use the Guest account to explore anonymously.

## Performance Optimizations

- Database indexes on frequently queried columns
- Connection pooling with pg module
- Session store in memory (can be upgraded to Redis)
- Efficient SQL queries with JOINs
- Lazy loading of comments

## Security Considerations

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ SQL injection prevention with parameterized queries
- ✅ CSRF protection via session cookies
- ✅ XSS prevention with HTML escaping
- ✅ Authentication middleware on protected routes

**For Production:**
- Use environment-specific SESSION_SECRET
- Enable secure cookie flag (HTTPS only)
- Implement rate limiting
- Add input validation and sanitization
- Use HTTPS
- Consider using a dedicated session store (Redis)

## Troubleshooting

**"Cannot connect to database"**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists: `psql -l`

**"Port 3000 already in use"**
- Change PORT in .env
- Or kill existing process: `lsof -ti:3000 | xargs kill -9`

**"Username already exists"**
- Choose a different username
- Usernames are case-insensitive and must be unique

**Comments not showing**
- Click comment button again to refresh
- Check browser console for errors
- Ensure you're logged in to comment

## Learning Outcomes

This project demonstrates:
- ✨ Full-stack web development with Node.js
- ✨ RESTful API design
- ✨ Database design and PostgreSQL
- ✨ User authentication and authorization
- ✨ Frontend routing and state management without frameworks
- ✨ Modern CSS and responsive design
- ✨ Security best practices
- ✨ Project structure and code organization

## Future Enhancements

- [ ] Direct messaging
- [ ] Following/followers system
- [ ] Notifications
- [ ] Email verification
- [ ] Password reset flow
- [ ] Image uploads for posts
- [ ] Hashtags and mentions
- [ ] Trending topics
- [ ] User blocking
- [ ] Dark mode toggle
- [ ] Real-time updates with WebSockets

## License

MIT License - Feel free to use this for learning and modification.

## Contributing

This is a learning project. Feel free to fork and customize!

## Support

For questions or issues, check:
1. The Odin Project - https://www.theodinproject.com/
2. Express.js Docs - https://expressjs.com/
3. PostgreSQL Docs - https://www.postgresql.org/docs/

---

**Happy coding! 🔥**
