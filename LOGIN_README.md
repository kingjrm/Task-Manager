# OJT Organizer - Login System Setup

## Database Updates Required

Run the following SQL script to add the necessary columns and create sample users:

1. Open phpMyAdmin
2. Select your `ojtapp` database
3. Go to the SQL tab
4. Copy and paste the contents of `update_database.sql`
5. Click "Go" to execute

## Default Login Credentials

### Admin Account
- **Username:** `admin`
- **Email:** `admin@ojtorganizer.com`
- **Password:** `admin123`

### Regular User Account
- **Username:** `user`
- **Email:** `user@ojtorganizer.com`  
- **Password:** `user123`

## Features Implemented

### Login System
- ✅ Modern, responsive login page with gradient design
- ✅ Username or email login support
- ✅ Password authentication with bcrypt hashing
- ✅ Remember me functionality
- ✅ Session management
- ✅ Activity logging

### User Types
- **Admin**: Full access to all features (you can add admin-specific features)
- **User**: Standard access to tasks, documents, progress, etc.

### Security Features
- ✅ Password hashing with PHP password_hash()
- ✅ Session-based authentication
- ✅ Authentication check on page load
- ✅ Logout functionality
- ✅ Active user verification

## Files Created

1. **login.html** - Beautiful login page with gradient design
2. **api/login.php** - Login authentication endpoint
3. **api/logout.php** - Logout endpoint
4. **api/check_auth.php** - Authentication verification
5. **update_database.sql** - Database schema updates

## Files Modified

1. **index.html** - Added authentication check and logout button

## Usage

1. Navigate to `http://localhost/OJTApp/`
2. You'll be redirected to `login.html`
3. Login with the credentials above
4. The system will redirect to the main dashboard
5. User information is displayed in the header
6. Click "Logout" button to end session

## Creating New Users

You can create new users manually through phpMyAdmin or create a registration page. To hash a password for manual entry:

```php
<?php
echo password_hash('your_password', PASSWORD_DEFAULT);
?>
```

Then insert into the database with the hashed password.

## Next Steps (Optional Enhancements)

- Create user registration page
- Add password reset functionality
- Create admin panel for user management
- Add role-based permissions
- Implement email verification
- Add two-factor authentication
