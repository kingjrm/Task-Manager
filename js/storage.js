// Storage Module - Handle localStorage operations

const Storage = {
    // Save tasks to localStorage
    saveTasks(tasks) {
        try {
            localStorage.setItem('ojtTasks', JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Error saving tasks:', error);
            return false;
        }
    },

    // Load tasks from localStorage
    loadTasks() {
        try {
            const saved = localStorage.getItem('ojtTasks');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    },

    // Clear all tasks
    clearTasks() {
        try {
            localStorage.removeItem('ojtTasks');
            return true;
        } catch (error) {
            console.error('Error clearing tasks:', error);
            return false;
        }
    },

    // Save app settings
    saveSettings(settings) {
        try {
            localStorage.setItem('ojtSettings', JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    },

    // Load app settings
    loadSettings() {
        try {
            const saved = localStorage.getItem('ojtSettings');
            return saved ? JSON.parse(saved) : { theme: 'light', notifications: true };
        } catch (error) {
            console.error('Error loading settings:', error);
            return { theme: 'light', notifications: true };
        }
    }
};
