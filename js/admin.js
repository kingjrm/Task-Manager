// Admin Module - User Management
const Admin = {
    state: {
        users: [],
        filteredUsers: [],
        currentUser: null,
        isAdmin: false,
        currentFilter: 'all'
    },

    // Initialize admin module
    init() {
        this.checkAdminStatus();
        if (this.state.isAdmin) {
            this.loadUsers();
            this.setupEventListeners();
        }
    },

    // Check if current user is admin
    checkAdminStatus() {
        if (window.currentUser && window.currentUser.user_type === 'admin') {
            this.state.isAdmin = true;
            this.state.currentUser = window.currentUser;
            
            // Show Users navigation button
            const usersNavBtn = document.getElementById('usersNavBtn');
            if (usersNavBtn) {
                usersNavBtn.style.display = 'flex';
            }
            
            // Hide user management section from settings
            const userManagementInSettings = document.getElementById('userManagement');
            if (userManagementInSettings) {
                userManagementInSettings.style.display = 'none';
            }
        }
    },

    // Load all users
    async loadUsers() {
        try {
            const response = await fetch('api/get_users.php');
            const result = await response.json();
            
            if (result.success) {
                this.state.users = result.data || [];
                this.state.filteredUsers = this.state.users;
                this.updateStats();
                this.renderUsersTable();
            } else {
                console.error('Failed to load users:', result.message);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    },

    // Update statistics
    updateStats() {
        const total = this.state.users.length;
        const active = this.state.users.filter(u => u.is_active).length;
        const admins = this.state.users.filter(u => u.user_type === 'admin').length;

        const totalEl = document.getElementById('totalUsersCount');
        const activeEl = document.getElementById('activeUsersCount');
        const adminEl = document.getElementById('adminUsersCount');

        if (totalEl) totalEl.textContent = total;
        if (activeEl) activeEl.textContent = active;
        if (adminEl) adminEl.textContent = admins;
    },

    // Filter users
    filterUsers(filter) {
        this.state.currentFilter = filter;
        
        switch(filter) {
            case 'active':
                this.state.filteredUsers = this.state.users.filter(u => u.is_active);
                break;
            case 'inactive':
                this.state.filteredUsers = this.state.users.filter(u => !u.is_active);
                break;
            case 'admin':
                this.state.filteredUsers = this.state.users.filter(u => u.user_type === 'admin');
                break;
            default:
                this.state.filteredUsers = this.state.users;
        }

        this.renderUsersTable();
        
        // Update filter button styles
        document.querySelectorAll('[data-user-filter]').forEach(btn => {
            if (btn.dataset.userFilter === filter) {
                btn.classList.add('active');
                btn.style.background = 'var(--primary)';
                btn.style.color = 'white';
                btn.style.borderColor = 'var(--primary)';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'var(--bg-alt)';
                btn.style.color = 'var(--text)';
                btn.style.borderColor = 'var(--border)';
            }
        });
    },

    // Render users table
    renderUsersTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        const usersToRender = this.state.filteredUsers;

        if (usersToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding: 40px; text-align: center; color: var(--text-muted);">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = usersToRender.map(user => `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 10px 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 11px;">
                            ${user.full_name ? user.full_name.substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text); font-size: 13px;">${user.full_name || user.username}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">@${user.username}</div>
                        </div>
                    </div>
                </td>
                <td style="padding: 10px 12px; font-size: 12px; color: var(--text);">${user.email}</td>
                <td style="padding: 10px 12px; font-size: 12px;">
                    <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; background: ${user.user_type === 'admin' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(107, 114, 128, 0.2)'}; color: ${user.user_type === 'admin' ? '#667eea' : '#6b7280'}; font-size: 11px; font-weight: 600;">
                        ${user.user_type === 'admin' ? 'Administrator' : 'User'}
                    </span>
                </td>
                <td style="padding: 10px 12px; font-size: 12px; color: var(--text);">
                    <span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                        ${user.task_count || 0} tasks
                    </span>
                </td>
                <td style="padding: 10px 12px; font-size: 12px;">
                    <span style="display: inline-block; padding: 3px 10px; border-radius: 4px; background: ${user.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${user.is_active ? '#22c55e' : '#ef4444'}; font-size: 11px; font-weight: 600;">
                        ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td style="padding: 10px 12px; font-size: 12px;">
                    <div style="display: flex; gap: 6px;">
                        ${user.id !== this.state.currentUser.id ? `
                            <button class="admin-action-btn admin-edit-btn" onclick="Admin.editUser(${user.id})" title="Edit">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="admin-action-btn admin-delete-btn" onclick="Admin.confirmDelete(${user.id}, '${user.username}')" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                        ` : '<span style="color: var(--text-muted); font-size: 11px;">(You)</span>'}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    // Open edit user modal
    editUser(userId) {
        const user = this.state.users.find(u => u.id === userId);
        if (!user) return;

        const modal = document.getElementById('editUserModal');
        if (!modal) {
            this.createEditUserModal();
        }

        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserUsername').value = user.username;
        document.getElementById('editUserFullName').value = user.full_name;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserType').value = user.user_type;
        document.getElementById('editUserStatus').value = user.is_active ? 'active' : 'inactive';

        const editModal = document.getElementById('editUserModal');
        if (editModal) {
            editModal.classList.add('active');
        }
    },

    // Create edit user modal if it doesn't exist
    createEditUserModal() {
        const modal = document.createElement('div');
        modal.id = 'editUserModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Edit User</h2>
                    <button class="modal-close" onclick="document.getElementById('editUserModal').classList.remove('active')">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editUserForm" style="display: grid; gap: 16px;">
                        <input type="hidden" id="editUserId">
                        
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 6px;">Username</label>
                            <input type="text" id="editUserUsername" class="settings-input" readonly style="background: var(--bg-alt); cursor: not-allowed;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 6px;">Full Name</label>
                            <input type="text" id="editUserFullName" class="settings-input" required>
                        </div>

                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 6px;">Email</label>
                            <input type="email" id="editUserEmail" class="settings-input" required>
                        </div>

                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 6px;">User Type</label>
                            <select id="editUserType" class="settings-input" style="cursor: pointer;">
                                <option value="user">User</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>

                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 500; color: var(--text); margin-bottom: 6px;">Status</label>
                            <select id="editUserStatus" class="settings-input" style="cursor: pointer;">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div id="editUserMessage" style="display: none; padding: 12px; border-radius: 8px; font-size: 14px;"></div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <button type="button" class="settings-btn settings-btn-secondary" onclick="document.getElementById('editUserModal').classList.remove('active')">
                                Cancel
                            </button>
                            <button type="submit" class="settings-btn settings-btn-primary">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('editUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUserChanges();
        });

        // Close modal on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    },

    // Save user changes
    async saveUserChanges() {
        const userId = document.getElementById('editUserId').value;
        const fullName = document.getElementById('editUserFullName').value.trim();
        const email = document.getElementById('editUserEmail').value.trim();
        const userType = document.getElementById('editUserType').value;
        const status = document.getElementById('editUserStatus').value;

        if (!fullName || !email) {
            this.showMessage('editUserMessage', 'Please fill in all fields', 'error');
            return;
        }

        try {
            const response = await fetch('api/update_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    fullName: fullName,
                    email: email,
                    userType: userType,
                    isActive: status === 'active' ? 1 : 0
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('editUserMessage', 'User updated successfully!', 'success');
                setTimeout(() => {
                    document.getElementById('editUserModal').classList.remove('active');
                    this.loadUsers();
                }, 1500);
            } else {
                this.showMessage('editUserMessage', result.message || 'Failed to update user', 'error');
            }
        } catch (error) {
            this.showMessage('editUserMessage', 'Error updating user: ' + error.message, 'error');
        }
    },

    // Confirm delete user
    confirmDelete(userId, username) {
        if (confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            this.deleteUser(userId);
        }
    },

    // Delete user
    async deleteUser(userId) {
        try {
            const response = await fetch('api/delete_user.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId })
            });

            const result = await response.json();

            if (result.success) {
                alert('User deleted successfully');
                this.loadUsers();
            } else {
                alert('Error: ' + (result.message || 'Failed to delete user'));
            }
        } catch (error) {
            alert('Error deleting user: ' + error.message);
        }
    },

    // Show message in modal
    showMessage(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
            element.style.background = type === 'error' ? '#fef2f2' : '#f0fdf4';
            element.style.color = type === 'error' ? '#dc2626' : '#16a34a';
            element.style.border = `1px solid ${type === 'error' ? '#fecaca' : '#bbf7d0'}`;
        }
    },

    // Setup event listeners
    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshUsersBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadUsers());
        }

        // Search functionality
        const searchInput = document.getElementById('searchUsers');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchUsers(e.target.value));
        }

        // Filter buttons
        document.querySelectorAll('[data-user-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterUsers(btn.dataset.userFilter);
            });
        });
    },

    // Search users
    searchUsers(query) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (!query.trim()) {
            this.filterUsers(this.state.currentFilter);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filteredUsers = this.state.filteredUsers.filter(user => 
            (user.full_name || '').toLowerCase().includes(lowerQuery) ||
            (user.username || '').toLowerCase().includes(lowerQuery) ||
            (user.email || '').toLowerCase().includes(lowerQuery)
        );

        if (filteredUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding: 40px; text-align: center; color: var(--text-muted);">No users found matching your search</td></tr>';
            return;
        }

        tbody.innerHTML = filteredUsers.map(user => `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 10px 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 11px;">
                            ${user.full_name ? user.full_name.substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--text); font-size: 13px;">${user.full_name || user.username}</div>
                            <div style="font-size: 11px; color: var(--text-muted);">@${user.username}</div>
                        </div>
                    </div>
                </td>
                <td style="padding: 10px 12px; font-size: 12px; color: var(--text);">${user.email}</td>
                <td style="padding: 10px 12px; font-size: 12px;">
                    <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; background: ${user.user_type === 'admin' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(107, 114, 128, 0.2)'}; color: ${user.user_type === 'admin' ? '#667eea' : '#6b7280'}; font-size: 11px; font-weight: 600;">
                        ${user.user_type === 'admin' ? 'Administrator' : 'User'}
                    </span>
                </td>
                <td style="padding: 10px 12px; font-size: 12px; color: var(--text);">
                    <span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                        ${user.task_count || 0} tasks
                    </span>
                </td>
                <td style="padding: 10px 12px; font-size: 12px;">
                    <span style="display: inline-block; padding: 3px 10px; border-radius: 4px; background: ${user.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${user.is_active ? '#22c55e' : '#ef4444'}; font-size: 11px; font-weight: 600;">
                        ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td style="padding: 10px 12px; font-size: 12px;">
                    <div style="display: flex; gap: 6px;">
                        ${user.id !== this.state.currentUser.id ? `
                            <button class="admin-action-btn admin-edit-btn" onclick="Admin.editUser(${user.id})" title="Edit">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="admin-action-btn admin-delete-btn" onclick="Admin.confirmDelete(${user.id}, '${user.username}')" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            </button>
                        ` : '<span style="color: var(--text-muted); font-size: 11px;">(You)</span>'}
                    </div>
                </td>
            </tr>
        `).join('');
    }
};

// Add CSS for admin
const adminStyles = `
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
    }

    .modal.active {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-content {
        background: var(--bg);
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 600px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-height: 80vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--border);
    }

    .modal-header h2 {
        font-size: 16px;
        font-weight: 700;
        color: var(--text);
        margin: 0;
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-muted);
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .modal-close:hover {
        background: var(--bg-alt);
        color: var(--text);
    }

    .modal-body {
        color: var(--text);
    }

    .admin-action-btn {
        background: var(--bg-alt);
        border: 1px solid var(--border);
        padding: 6px;
        border-radius: 6px;
        cursor: pointer;
        color: var(--text-muted);
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .admin-action-btn:hover {
        border-color: var(--text);
        color: var(--text);
    }

    .admin-edit-btn:hover {
        background: rgba(102, 126, 234, 0.1);
        border-color: #667eea;
        color: #667eea;
    }

    .admin-delete-btn:hover {
        background: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        color: #ef4444;
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = adminStyles;
document.head.appendChild(styleSheet);
