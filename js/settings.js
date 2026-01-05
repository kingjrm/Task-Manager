// Settings Module
const Settings = {
    allUsers: [],
    settingsKey: 'ojt_settings',

    // Initialize settings
    async init() {
        await this.loadProfile();
        this.setupEventListeners();
        this.loadSettings();
    },

    // Load current user profile
    async loadProfile() {
        try {
            // Wait for currentUser to be available
            let attempts = 0;
            while (!window.currentUser && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (window.currentUser) {
                const usernameInput = document.getElementById('profile_username');
                const fullnameInput = document.getElementById('profile_fullname');
                const emailInput = document.getElementById('profile_email');
                
                if (usernameInput) usernameInput.value = window.currentUser.username || '';
                if (fullnameInput) fullnameInput.value = window.currentUser.full_name || '';
                if (emailInput) emailInput.value = window.currentUser.email || '';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.saveProfile(e));
        }

        // Theme toggle in settings
        const themeToggle2 = document.getElementById('themeToggle2');
        if (themeToggle2) {
            themeToggle2.addEventListener('click', () => {
                Theme.toggleTheme();
                setTimeout(() => {
                    Theme.updateThemeIcons(Theme.getCurrentTheme());
                    this.updateThemeToggleState();
                }, 100);
            });
            // Set initial state
            this.updateThemeToggleState();
        }

        // Settings checkboxes
        setTimeout(() => {
            document.querySelectorAll('.settings-card input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', () => this.saveSettings());
            });
        }, 500);
    },

    // Update theme toggle visual state
    updateThemeToggleState() {
        const themeToggle2 = document.getElementById('themeToggle2');
        if (themeToggle2) {
            const isDark = Theme.isDark();
            if (isDark) {
                themeToggle2.classList.add('active');
            } else {
                themeToggle2.classList.remove('active');
            }
        }
    },

    // Save profile
    async saveProfile(e) {
        e.preventDefault();
        
        const messageDiv = document.getElementById('profileMessage');
        const password = document.getElementById('profile_password').value;
        const confirmPassword = document.getElementById('profile_confirm_password').value;
        
        // Validate passwords if provided
        if (password || confirmPassword) {
            if (password !== confirmPassword) {
                this.showMessage(messageDiv, 'Passwords do not match', 'error');
                return;
            }
            if (password.length < 6) {
                this.showMessage(messageDiv, 'Password must be at least 6 characters', 'error');
                return;
            }
        }
        
        const data = {
            userId: window.currentUser.id,
            username: document.getElementById('profile_username').value,
            fullName: document.getElementById('profile_fullname').value,
            email: document.getElementById('profile_email').value
        };
        
        if (password) {
            data.password = password;
        }
        
        try {
            const response = await fetch('api/update_user.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage(messageDiv, 'Profile updated successfully!', 'success');
                
                // Update current user
                window.currentUser = result.user;
                
                // Clear password fields
                document.getElementById('profile_password').value = '';
                document.getElementById('profile_confirm_password').value = '';
                
                // Update header display
                const userDisplay = document.querySelector('.user-display');
                if (userDisplay) {
                    userDisplay.textContent = result.user.full_name || result.user.username;
                }
                
                if (typeof UI !== 'undefined') {
                    UI.showNotification('Profile updated successfully!', 'success');
                }
            } else {
                this.showMessage(messageDiv, result.message, 'error');
            }
        } catch (error) {
            this.showMessage(messageDiv, 'An error occurred. Please try again.', 'error');
        }
    },

    // Load settings from localStorage
    loadSettings() {
        const savedSettings = localStorage.getItem(this.settingsKey);
        const settings = savedSettings ? JSON.parse(savedSettings) : {
            taskReminders: true,
            completionAlerts: true,
            autoComplete: false,
            showPriorities: true
        };
        
        // Apply settings to checkboxes - using specific card order after removal of user management
        const notificationCheckboxes = document.querySelectorAll('.settings-card:nth-child(3) input[type="checkbox"]');
        const taskSettingsCheckboxes = document.querySelectorAll('.settings-card:nth-child(4) input[type="checkbox"]');
        
        if (notificationCheckboxes[0]) notificationCheckboxes[0].checked = settings.taskReminders;
        if (notificationCheckboxes[1]) notificationCheckboxes[1].checked = settings.completionAlerts;
        if (taskSettingsCheckboxes[0]) taskSettingsCheckboxes[0].checked = settings.autoComplete;
        if (taskSettingsCheckboxes[1]) taskSettingsCheckboxes[1].checked = settings.showPriorities;
    },

    // Save settings to localStorage
    saveSettings() {
        const notificationCheckboxes = document.querySelectorAll('.settings-card:nth-child(3) input[type="checkbox"]');
        const taskSettingsCheckboxes = document.querySelectorAll('.settings-card:nth-child(4) input[type="checkbox"]');
        
        const settings = {
            taskReminders: notificationCheckboxes[0]?.checked || false,
            completionAlerts: notificationCheckboxes[1]?.checked || false,
            autoComplete: taskSettingsCheckboxes[0]?.checked || false,
            showPriorities: taskSettingsCheckboxes[1]?.checked || false
        };
        
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
        
        if (typeof UI !== 'undefined') {
            UI.showNotification('Settings saved!', 'success');
        }
    },

    // Show message helper
    showMessage(element, message, type) {
        if (!element) return;
        
        element.textContent = message;
        element.style.display = 'block';
        
        if (type === 'error') {
            element.style.background = 'rgba(239, 68, 68, 0.1)';
            element.style.color = '#ef4444';
        } else {
            element.style.background = 'rgba(16, 185, 129, 0.1)';
            element.style.color = '#10b981';
        }
    }
};
