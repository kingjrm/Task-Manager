// Theme Module - Dark and Light mode management

const Theme = {
    // Initialize theme
    init() {
        const savedTheme = localStorage.getItem('ojtTheme') || 'light';
        this.setTheme(savedTheme);
        
        // Initialize toggle button state on load
        setTimeout(() => this.updateThemeToggleStates(savedTheme), 100);
    },

    // Set theme
    setTheme(theme) {
        localStorage.setItem('ojtTheme', theme);
        
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Update theme toggle buttons (both sidebar and settings)
        this.updateThemeIcons(theme);
        this.updateThemeToggleStates(theme);

        // Dispatch event for theme change
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    },

    // Update all theme toggle button states
    updateThemeToggleStates(theme) {
        const themeToggle2 = document.getElementById('themeToggle2');
        if (themeToggle2) {
            if (theme === 'dark') {
                themeToggle2.classList.add('active');
            } else {
                themeToggle2.classList.remove('active');
            }
        }
    },
    
    // Update theme icons
    updateThemeIcons(theme) {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            if (theme === 'dark') {
                // Moon icon for dark mode
                themeIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
            } else {
                // Sun icon for light mode
                themeIcon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
            }
        }
    },

    // Toggle theme
    toggleTheme() {
        const currentTheme = localStorage.getItem('ojtTheme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    // Get current theme
    getCurrentTheme() {
        return localStorage.getItem('ojtTheme') || 'light';
    },

    // Check if dark mode
    isDark() {
        return this.getCurrentTheme() === 'dark';
    },

    // Setup theme toggle listener
    setupThemeListener() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }
};

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
});
