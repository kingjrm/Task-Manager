# OJT Task Management System - Setup Guide

## Overview
The OJT (On-the-Job Training) Task Management system has been updated to support comprehensive tracking of training activities with the following new fields:

- **Date Performed**: When the activity was completed
- **Hours Rendered**: Number of hours spent on the activity
- **Department**: Department/Organization where activity was performed
- **Supervisor**: Name of the supervising officer
- **Remarks**: Additional notes and observations about the activity

## What Was Updated

### 1. **Database Schema** 
New OJT-specific columns added to the `tasks` table:
- `date_performed` - Date field for when activity was performed
- `hours_rendered` - Decimal field for hours worked
- `department` - Text field for department name
- `supervisor` - Text field for supervisor name
- `remarks` - Text field for additional remarks
- `document_id` - Reference to attached documents

Two new tables created:
- **ojt_progress**: Tracks OJT completion percentage and hours (480-hour requirement)
- **ojt_logs**: Detailed OJT activity logging with approval workflow

### 2. **Frontend Form**
Updated `index.html` task creation form with new fields:
- Date input field for date performed
- Number input field for hours rendered
- Text inputs for department and supervisor
- Large textarea for remarks

### 3. **API Endpoints**
Updated `api/tasks.php` to:
- Accept OJT fields in POST requests (create task)
- Accept OJT fields in PUT requests (update task)
- Store OJT data in database

### 4. **Task Display**
Updated task cards to show:
- Date performed badge (📅)
- Hours rendered badge (⏱️)
- Department badge (🏢)
- Supervisor badge (👤)

## Setup Instructions

### Step 1: Apply Database Schema Updates
1. Open your browser and navigate to: `http://localhost/OJTApp/apply-ojt-schema.php`
2. The script will automatically:
   - Add OJT columns to the tasks table
   - Create ojt_progress table
   - Create ojt_logs table
3. You should see: **"✓ OJT Schema Update Complete!"**

**Alternative (Manual)**: If you prefer to apply SQL manually:
- Open phpMyAdmin
- Select your OJT database
- Go to SQL tab
- Copy contents from `ojt_schema_update.sql`
- Execute the script

### Step 2: Reload the Application
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. All OJT fields will now be available in the task creation form

## Using the OJT Fields

### Creating a Task with OJT Data
1. Click "Add Task" button
2. Fill in basic info:
   - Task/Activity Name (required)
   - Description
   - Category (required)
   - Priority (required)
3. Scroll down to "Schedule & Status" section
4. Fill in OJT-specific fields:
   - **Date Performed**: When was this activity done?
   - **Hours Rendered**: How many hours did you work?
   - **Department**: Which department?
   - **Supervisor**: Who supervised this work?
   - **Remarks**: Any additional notes?
5. Click "Save Task"

### Editing a Task
1. Click the edit icon (pencil) on any task
2. All fields including OJT data will be pre-populated
3. Make changes as needed
4. Click "Save Task"

### Viewing OJT Data
Task cards now display OJT information in badges:
- Green badge: Date Performed
- Purple badge: Hours Rendered
- Blue badge: Department
- Orange badge: Supervisor

## Database Schema Details

### tasks Table Additions
```sql
ALTER TABLE tasks ADD COLUMN date_performed DATE DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN hours_rendered DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN department VARCHAR(255) DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN supervisor VARCHAR(255) DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN remarks TEXT DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN document_id INT(11) DEFAULT NULL;
```

### ojt_progress Table
Tracks overall OJT completion:
- `total_hours_required`: 480 hours (default)
- `total_hours_completed`: Sum of hours rendered
- `completion_percentage`: Calculated percentage
- `ojt_status`: Not Started, In Progress, Completed, On Hold

### ojt_logs Table
Detailed activity tracking with approval workflow:
- `date_performed`: Activity date
- `hours_rendered`: Hours spent
- `status`: Draft, Submitted, Approved, Rejected
- `department`: Department info
- `supervisor`: Supervisor info
- `remarks`: Activity notes

## Features Available Now

✅ Create tasks with OJT fields
✅ Edit tasks with OJT data
✅ View OJT metadata on task cards
✅ Filter and search tasks
✅ Track hours rendered per activity
✅ Assign supervisors and departments
✅ Activity logging (all changes tracked)
✅ Task status tracking (Pending, In Progress, Completed)

## Future Enhancements

These features can be added:
- OJT Progress Dashboard (hours/percentage tracking)
- Supervisor approval workflow
- Document attachment for CV/certificates
- OJT completion reports
- Hour summary by department/supervisor
- Export OJT logs to PDF

## Troubleshooting

### Schema Update Fails
- Check if XAMPP is running (Apache and MySQL services)
- Verify database connection in `config.php`
- Ensure you have admin privileges on the database

### OJT Fields Not Showing
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh page (Ctrl+Shift+R)
- Check browser console for errors (F12)

### Tasks Not Saving
- Verify XAMPP services are running
- Check API response in browser console
- Ensure all required fields are filled (Name, Category, Priority)

## API Reference

### Create Task with OJT Data
```json
POST /api/tasks.php
{
  "user_id": 1,
  "title": "Activity Name",
  "description": "Details",
  "category_id": 1,
  "priority_id": 1,
  "due_date": "2024-12-31",
  "date_performed": "2024-12-20",
  "hours_rendered": 8.5,
  "department": "IT Department",
  "supervisor": "John Doe",
  "remarks": "Completed successfully"
}
```

### Update Task with OJT Data
```json
PUT /api/tasks.php?id=123
{
  "user_id": 1,
  "hours_rendered": 9,
  "remarks": "Updated remarks",
  "department": "Finance"
}
```

## Questions?

Refer to LOGIN_README.md for general system information, or check the browser console (F12) for any error messages.
