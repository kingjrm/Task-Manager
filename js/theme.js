// Theme Module - Dark and Light mode management

const Theme = {
    // Initialize theme
    init() {
        const savedTheme = localStorage.getItem('ojtTheme') || 'light';
        this.setTheme(savedTheme);
    },

    // Set theme
    setTheme(theme) {
        localStorage.setItem('ojtTheme', theme);
        
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Update theme toggle icons (both sidebar and settings)
        this.updateThemeIcons(theme);

        const themeToggle2 = document.getElementById('themeToggle2');
        if (themeToggle2) {
            // Add active class for dark mode
            if (theme === 'dark') {
                themeToggle2.classList.add('active');
            } else {
                themeToggle2.classList.remove('active');
            }
        }

        // Dispatch event for theme change
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    },
    
    // Update theme icons
    updateThemeIcons(theme) {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon && typeof Icons !== 'undefined') {
            themeIcon.innerHTML = Icons.render(theme === 'dark' ? 'moon' : 'sun');
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
