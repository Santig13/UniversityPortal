# 📚 University Event Management Portal

This project is a web platform designed to facilitate the management and participation in academic and cultural events within a university environment. The application follows a full-stack architecture, developed entirely using client-side and server-side technologies:

- **Frontend**: HTML, CSS, JavaScript, and EJS.
- **Backend**: Node.js with Express.js, organized in RESTful routes by service.
- **Database**: Local SQL database with a manually designed schema and connection pooling.

## 🚀 Key Features

### 👥 Authentication & Registration
- User login and registration with data validation.
- Password recovery via email.
- Role-based access: **participant** and **organizer**.

### 🗓️ Event Management
- **Organizers** can:
  - Create, edit, and delete events.
  - View the list of participants.
  - Access detailed usage statistics.

- **Participants** can:
  - Register and unregister for events.
  - Rate completed events and view feedback.

### 📅 Calendar
- Monthly, weekly, and daily event views.
- Event details shown in a modal on click.

### 📊 Usage Statistics
- Available only for organizers.
- Table view with real-time session data: IP, browser, OS, timestamps.

### ♿ Accessibility & Usability
- Toggle between light/dark mode.
- Adjustable font sizes.
- Navigation mode selection: mouse, keyboard, or both.
- Keyboard shortcuts for quick actions and navigation.

### 🛡️ Security Features
- **SQL injection prevention** through parameterized queries and input validation.
- **IP blacklist system** to automatically register and block malicious IPs attempting suspicious actions (e.g. repeated failed logins or attack patterns). Blocked IPs are denied future access to the server.

## 🧩 Technologies Used

### Frontend
- `HTML`, `CSS`, `JavaScript` (Vanilla)
- `EJS` templating engine

### Backend
- `Node.js` + `Express.js`
- RESTful API structured by service
- Email notifications (e.g., password reset)

### Database
- Local SQL database with custom-designed schema
- Connection pool for optimized performance and concurrency

### Security
- SQL injection protection
- Blacklist mechanism for attacker IPs

### Other
- Session-based authentication
- Client-side and server-side form validation
