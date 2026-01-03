// App Module - Main application logic and orchestration

const App = {
    state: {
        tasks: [],
        currentFilter: 'all',
        editingTaskId: null,
        settings: {},
        userId: null, // Will be set from window.currentUser after auth
        apiUrl: 'api',
        isSubmitting: false, // Prevent duplicate submissions
        activityLog: [],
        activityFilter: 'all'
    },

    // Initialize the app
    async init() {
        // Wait for auth and set userId from current user
        if (window.currentUser && window.currentUser.id) {
            this.state.userId = window.currentUser.id;
            console.log('App initialized with user ID:', this.state.userId);
        } else {
            console.error('No current user found!');
            this.state.userId = 1; // Fallback
        }
        
        // Clear old localStorage data on init
        this.clearLocalStorage();
        
        // Ensure test user exists in database
        await this.ensureUserExists();
        
        // Load activity log first (per user)
        this.loadActivityLog();

        // Try to load from database, fallback to localStorage
        await this.loadTasks();
        this.state.settings = Storage.loadSettings();
        
        this.setupEventListeners();
        Theme.setupThemeListener();
        this.render();
        
        console.log('OJT Organizer initialized successfully');
    },

    // Load activity log persistence
    loadActivityLog() {
        const key = `ojt_activity_log_user_${this.state.userId || 'guest'}`;
        try {
            const saved = localStorage.getItem(key);
            this.state.activityLog = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.warn('Failed to load activity log', e);
            this.state.activityLog = [];
        }
    },

    generateInitialActivities() {
        // Generate activities from existing tasks if log is empty
        if (this.state.activityLog.length === 0 && this.state.tasks.length > 0) {
            console.log('Generating initial activities from existing tasks');
            
            this.state.tasks.forEach(task => {
                // Add creation activity
                const createdAt = task.created_at || task.createdAt || new Date().toISOString();
                this.state.activityLog.push({
                    id: `${task.id}_created`,
                    action: 'created',
                    taskId: task.id,
                    title: task.title || task.name || 'Task',
                    status: task.status_id || task.status || 'pending',
                    category: task.category_name || task.category || 'Uncategorized',
                    timestamp: createdAt
                });
                
                // Add completion activity if completed
                if (task.status_name === 'Completed' || task.status === 'completed' || task.status === '3') {
                    const completedAt = task.updated_at || task.updatedAt || new Date().toISOString();
                    this.state.activityLog.push({
                        id: `${task.id}_completed`,
                        action: 'status',
                        taskId: task.id,
                        title: task.title || task.name || 'Task',
                        status: 'Completed',
                        category: task.category_name || task.category || 'Uncategorized',
                        timestamp: completedAt
                    });
                }
            });
            
            // Sort by timestamp descending
            this.state.activityLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            this.saveActivityLog();
            console.log('Generated', this.state.activityLog.length, 'initial activities');
        }
    },

    saveActivityLog() {
        const key = `ojt_activity_log_user_${this.state.userId || 'guest'}`;
        try {
            localStorage.setItem(key, JSON.stringify(this.state.activityLog.slice(-200)));
        } catch (e) {
            console.warn('Failed to save activity log', e);
        }
    },

    logActivity(action, payload = {}) {
        const entry = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            action,
            taskId: payload.taskId || null,
            title: payload.title || 'Untitled Task',
            status: payload.status || null,
            category: payload.category || null,
            timestamp: new Date().toISOString()
        };
        this.state.activityLog.unshift(entry);
        this.saveActivityLog();
    },

    setActivityFilter(filter) {
        this.state.activityFilter = filter;
        document.querySelectorAll('.timeline-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderTimeline();
    },

    // Ensure test user exists in database
    async ensureUserExists() {
        try {
            const response = await fetch(`${this.state.apiUrl}/setup.php`);
            if (response.ok) {
                const result = await response.json();
                console.log('User setup:', result.message);
            }
        } catch (error) {
            console.log('Could not verify user setup:', error);
        }
    },

    // Clear all localStorage data
    clearLocalStorage() {
        const keysToRemove = [
            'ojt_tasks',
            'ojt_settings',
            'ojt_theme',
            'tasks',
            'settings',
            'theme'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            localStorage.removeItem(`ojt_${key}`);
        });
        
        console.log('Local storage cleared');
    },

    // Load tasks from API
    async loadTasks() {
        try {
            const apiUrl = `${this.state.apiUrl}/tasks.php?action=list&user_id=${this.state.userId}`;
            console.log('Loading tasks from:', apiUrl);
            const response = await fetch(apiUrl);
            
            console.log('API Response status:', response.status);
            
            if (response.ok) {
                const result = await response.json();
                console.log('API Result:', result);
                
                if (result.success) {
                    this.state.tasks = result.data || [];
                    // IMPORTANT: Don't save to localStorage, use API as source of truth
                    // Storage.saveTasks(this.state.tasks);
                    console.log('Tasks loaded from API:', this.state.tasks.length, 'tasks');
                    // Clear localStorage to prevent confusion
                    localStorage.removeItem('tasks');
                    
                    // Generate initial activities from tasks
                    this.generateInitialActivities();
                    return;
                } else {
                    console.warn('API returned error:', result.message);
                }
            } else {
                console.warn('API returned status:', response.status);
            }
        } catch (error) {
            console.warn('API unavailable:', error);
        }
        // IMPORTANT: Only use localStorage as fallback if user is offline
        console.log('Using localStorage fallback');
        this.state.tasks = Storage.loadTasks();
        console.log('Tasks loaded from localStorage:', this.state.tasks.length, 'tasks');
        
        // Generate initial activities from fallback tasks
        this.generateInitialActivities();
    },

    // Setup all event listeners
    setupEventListeners() {
        // Task form submission
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            // Clone to remove old event listeners
            const newTaskForm = taskForm.cloneNode(true);
            taskForm.parentNode.replaceChild(newTaskForm, taskForm);
            
            newTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const submitBtn = document.getElementById('taskFormSubmit');
                if (submitBtn && !this.state.isSubmitting) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Saving...';
                }
                this.handleAddTask(e);
            });
        }

        // Modal close on backdrop click
        const taskModal = document.getElementById('taskModal');
        if (taskModal) {
            taskModal.addEventListener('click', (e) => {
                if (e.target.id === 'taskModal') {
                    this.closeTaskModal();
                }
            });
        }

        // Task filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            // Clone each button to remove old listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', (e) => {
                this.filterTasks(newBtn.dataset.filter);
            });
        });

        // Timeline filter buttons
        document.querySelectorAll('.timeline-filter-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => this.setActivityFilter(newBtn.dataset.filter));
        });
    },

    // Add new task
    async handleAddTask(e) {
        e.preventDefault();
        
        // Prevent duplicate submissions
        if (this.state.isSubmitting) {
            console.warn('Task submission already in progress');
            return;
        }

        const taskName = document.getElementById('taskName').value.trim();
        const taskDescription = document.getElementById('taskDescription').value.trim();
        const taskCategory = document.getElementById('taskCategory').value;
        const taskPriority = document.getElementById('taskPriority').value;
        const taskDueDate = document.getElementById('taskDueDate').value;
        const taskStatus = document.getElementById('taskStatus').value;
        
        // OJT Fields
        const taskDatePerformed = document.getElementById('taskDatePerformed').value;
        const taskHoursRendered = document.getElementById('taskHoursRendered').value;
        const taskDepartment = document.getElementById('taskDepartment').value.trim();
        const taskSupervisor = document.getElementById('taskSupervisor').value.trim();
        const taskRemarks = document.getElementById('taskRemarks').value.trim();

        if (!taskName || !taskCategory || !taskPriority) {
            UI.showNotification('Please fill in all required fields', 'error');
            return;
        }

        this.state.isSubmitting = true;

        if (this.state.editingTaskId) {
            // Update existing task via API
            const previousTask = this.state.tasks.find(t => t.id === this.state.editingTaskId);
            try {
                const response = await fetch(`${this.state.apiUrl}/tasks.php?id=${this.state.editingTaskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: this.state.userId,
                        title: taskName,
                        description: taskDescription,
                        category_id: taskCategory,
                        priority_id: taskPriority,
                        due_date: taskDueDate || null,
                        status_id: taskStatus || 1,
                        date_performed: taskDatePerformed || null,
                        hours_rendered: taskHoursRendered || null,
                        department: taskDepartment,
                        supervisor: taskSupervisor,
                        remarks: taskRemarks
                    })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    const statusChanged = previousTask && (previousTask.status_id || previousTask.status) !== taskStatus;
                    this.logActivity(statusChanged ? 'status' : 'updated', {
                        taskId: this.state.editingTaskId,
                        title: taskName,
                        status: taskStatus,
                        category: taskCategory
                    });
                    await this.loadTasks();
                    this.render();
                    this.closeTaskModal();
                    UI.showNotification('Task updated successfully!', 'success');
                } else {
                    console.error('API Error:', result);
                    UI.showNotification(result.message || 'Failed to update task', 'error');
                }
            } catch (error) {
                console.error('Update error:', error);
                UI.showNotification('Error updating task', 'error');
            } finally {
                this.state.isSubmitting = false;
            }
        } else {
            // Create new task via API
            try {
                console.log('Creating task...', { taskName, taskCategory, taskPriority });
                const response = await fetch(`${this.state.apiUrl}/tasks.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: this.state.userId,
                        title: taskName,
                        description: taskDescription,
                        category_id: taskCategory,
                        priority_id: taskPriority,
                        due_date: taskDueDate || null,
                        status_id: taskStatus || 1,
                        date_performed: taskDatePerformed || null,
                        hours_rendered: taskHoursRendered || null,
                        department: taskDepartment,
                        supervisor: taskSupervisor,
                        remarks: taskRemarks
                    })
                });
                
                const result = await response.json();
                console.log('Create response:', response.status, result);
                
                if (response.ok && result.success) {
                    this.logActivity('created', {
                        taskId: result.data?.id,
                        title: taskName,
                        status: taskStatus,
                        category: taskCategory
                    });
                    console.log('Task created successfully, reloading...');
                    await this.loadTasks();
                    console.log('Tasks loaded:', this.state.tasks.length);
                    this.render();
                    this.closeTaskModal();
                    UI.showNotification('Task created successfully!', 'success');
                } else {
                    console.error('API Error:', result);
                    console.log('Response status:', response.status, 'Result:', result);
                    UI.showNotification('API Error: ' + (result.message || 'Failed to create task'), 'error');
                }
            } catch (error) {
                console.error('Create error:', error);
                console.log('API URL:', `${this.state.apiUrl}/tasks.php`);
                UI.showNotification('Error creating task. Please try again.', 'error');
            } finally {
                this.state.isSubmitting = false;
            }
        }
    },

    // Edit task
    editTask(id) {
        const task = TaskManager.getTaskById(this.state.tasks, id);
        if (!task) return;

        this.state.editingTaskId = id;
        document.getElementById('modalTitle').textContent = 'Edit Task';
        
        // Set form values with proper element IDs
        setTimeout(() => {
            document.getElementById('taskName').value = task.title || task.name || '';
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskCategory').value = task.category_id || task.category || '';
            document.getElementById('taskPriority').value = task.priority_id || task.priority || '';
            document.getElementById('taskDueDate').value = task.due_date || task.dueDate || '';
            
            // OJT Fields
            document.getElementById('taskDatePerformed').value = task.date_performed || '';
            document.getElementById('taskHoursRendered').value = task.hours_rendered || '';
            document.getElementById('taskDepartment').value = task.department || '';
            document.getElementById('taskSupervisor').value = task.supervisor || '';
            document.getElementById('taskRemarks').value = task.remarks || '';
            
            const statusValue = task.status_id || task.status || '1';
            document.getElementById('taskStatus').value = statusValue;
            
            // Update status button visuals
            document.querySelectorAll('.status-btn').forEach(btn => {
                btn.style.background = 'var(--bg-alt)';
                btn.style.border = '2px solid var(--border)';
                btn.style.color = 'var(--text)';
            });
            
            const selectedBtn = document.querySelector(`.status-btn[data-status="${statusValue}"]`);
            if (selectedBtn) {
                if (statusValue === '1') {
                    selectedBtn.style.background = 'rgba(245, 158, 11, 0.1)';
                    selectedBtn.style.border = '2px solid #f59e0b';
                    selectedBtn.style.color = '#f59e0b';
                } else if (statusValue === '2') {
                    selectedBtn.style.background = 'rgba(59, 130, 246, 0.1)';
                    selectedBtn.style.border = '2px solid #3b82f6';
                    selectedBtn.style.color = '#3b82f6';
                } else if (statusValue === '3') {
                    selectedBtn.style.background = 'rgba(16, 185, 129, 0.1)';
                    selectedBtn.style.border = '2px solid #10b981';
                    selectedBtn.style.color = '#10b981';
                }
            }
        }, 0);
        
        UI.openModal('taskModal');
        
        // Re-initialize status buttons
        setTimeout(() => {
            if (typeof initStatusButtons === 'function') {
                initStatusButtons();
            }
        }, 50);
    },

    // Show delete modal
    showDeleteModal(taskId) {
        this.state.deletingTaskId = taskId;
        UI.openModal('deleteModal');
    },

    // Delete task
    async deleteTask(id) {
        console.log('deleteTask() called with id:', id);
        
        if (!id) {
            UI.showNotification('No task selected', 'error');
            UI.closeModal('deleteModal');
            return;
        }
        
        try {
            console.log('Sending DELETE request for task:', id);
            const taskToDelete = this.state.tasks.find(t => t.id === id);
            
            const response = await fetch(`${this.state.apiUrl}/tasks.php?id=${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            console.log('DELETE response status:', response.status);
            const responseText = await response.text();
            console.log('DELETE response text:', responseText);
            
            let result = {};
            try {
                result = responseText ? JSON.parse(responseText) : { success: false };
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                result = { success: false };
            }
            
            console.log('DELETE result:', result);
            
            if (response.ok && result.success) {
                this.logActivity('deleted', {
                    taskId: id,
                    title: taskToDelete?.title || taskToDelete?.name || 'Task',
                    status: taskToDelete?.status || taskToDelete?.status_name,
                    category: taskToDelete?.category || taskToDelete?.category_name
                });
                UI.showNotification('Task deleted successfully!', 'success');
                // Reload tasks from API
                await this.loadTasks();
                this.render();
            } else {
                const errorMsg = result.message || 'Failed to delete task';
                UI.showNotification('Error: ' + errorMsg, 'error');
            }
        } catch (error) {
            console.error('DELETE error:', error);
            UI.showNotification('Error: ' + error.message, 'error');
        } finally {
            // ALWAYS close the modal
            UI.closeModal('deleteModal');
            this.state.deletingTaskId = null;
            console.log('Delete modal closed, deletingTaskId cleared');
        }
    },

    // Toggle task status
    toggleTaskStatus(id) {
        const task = TaskManager.getTaskById(this.state.tasks, id);
        if (!task) return;

        const statuses = ['pending', 'in-progress', 'completed'];
        const currentIndex = statuses.indexOf(task.status);
        task.status = statuses[(currentIndex + 1) % statuses.length];
        task.updatedAt = new Date().toISOString();

        Storage.saveTasks(this.state.tasks);
        this.render();
    },

    // Filter tasks
    filterTasks(filter) {
        this.state.currentFilter = filter;

        // Update active filter button styling
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.style.background = 'var(--bg-card)';
            btn.style.color = 'var(--text)';
            btn.style.border = '1px solid var(--border)';
        });

        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.style.background = 'var(--primary)';
            activeBtn.style.color = 'white';
            activeBtn.style.border = 'none';
        }

        this.renderTasks();
    },

    // Open add task modal
    openAddTaskModal() {
        this.state.editingTaskId = null;
        document.getElementById('modalTitle').textContent = 'Add New Task';
        
        // Clear all form fields
        document.getElementById('taskName').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskCategory').value = '';
        document.getElementById('taskPriority').value = '';
        document.getElementById('taskDueDate').value = '';
        document.getElementById('taskStatus').value = '1';
        
        // Reset status buttons to default (Pending selected)
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.style.background = 'var(--bg-alt)';
            btn.style.border = '2px solid var(--border)';
            btn.style.color = 'var(--text)';
        });
        const pendingBtn = document.querySelector('.status-btn[data-status="1"]');
        if (pendingBtn) {
            pendingBtn.style.background = 'rgba(245, 158, 11, 0.1)';
            pendingBtn.style.border = '2px solid #f59e0b';
            pendingBtn.style.color = '#f59e0b';
        }
        
        UI.openModal('taskModal');
        
        // Re-initialize status buttons
        if (typeof initStatusButtons === 'function') {
            initStatusButtons();
        }
    },

    // Close task modal
    closeTaskModal() {
        // Clear all form fields
        document.getElementById('taskForm').reset();
        
        // Clear OJT fields specifically
        document.getElementById('taskDatePerformed').value = '';
        document.getElementById('taskHoursRendered').value = '';
        document.getElementById('taskDepartment').value = '';
        document.getElementById('taskSupervisor').value = '';
        document.getElementById('taskRemarks').value = '';
        
        // Reset to create mode
        document.getElementById('modalTitle').textContent = 'Add New Task';
        
        UI.closeModal('taskModal');
        this.state.editingTaskId = null;
    },

    // Main render function
    render() {
        this.renderStats();
        this.renderTasks();
        this.renderProgress();
        this.renderTimeline();
    },

    // Render statistics
    renderStats() {
        const stats = Stats.calculateStats(this.state.tasks);
        
        UI.updateText('statTotal', stats.total);
        UI.updateText('statCompleted', stats.completed);
        UI.updateText('statInProgress', stats.inProgress);
        UI.updateText('statCompletion', `${stats.completionRate}%`);
        
        // Update progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${stats.completionRate}%`;
        }
        
        // Update progress percentage display
        const progressPercent = document.getElementById('progressPercent');
        if (progressPercent) {
            progressPercent.textContent = `${stats.completionRate}%`;
        }
        
        // Update circular progress ring
        const progressRingFill = document.getElementById('progressRingFill');
        if (progressRingFill) {
            const circumference = 2 * Math.PI * 52; // radius = 52
            const offset = circumference - (stats.completionRate / 100) * circumference;
            progressRingFill.style.strokeDashoffset = offset;
        }
        
        // Update completed and remaining counts
        const progressCompleted = document.getElementById('progressCompleted');
        const progressRemaining = document.getElementById('progressRemaining');
        
        if (progressCompleted) {
            progressCompleted.textContent = stats.completed;
        }
        
        if (progressRemaining) {
            progressRemaining.textContent = stats.total - stats.completed;
        }
        
        // Render dashboard tasks
        this.renderDashboardTasks();
    },

    // Render recent tasks on dashboard
    renderDashboardTasks() {
        const dashboardTasks = document.getElementById('dashboardTasks');
        if (!dashboardTasks) return;
        
        const recentTasks = this.state.tasks.slice(0, 5);
        
        if (recentTasks.length === 0) {
            dashboardTasks.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.3; margin: 0 auto 12px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <p>No tasks yet</p>
                    <button class="empty-action-btn" onclick="document.getElementById('newTaskBtn').click()">Create Your First Task</button>
                </div>
            `;
            return;
        }
        
        dashboardTasks.innerHTML = '';
        recentTasks.forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'recent-task-item';
            
            const statusClass = task.status_name === 'Completed' ? 'badge-completed' : 
                              task.status_name === 'In Progress' ? 'badge-in-progress' : 'badge-pending';
            
            const isCompleted = task.status_name === 'Completed';
            const checkboxClass = isCompleted ? 'recent-task-checkbox completed' : 'recent-task-checkbox';
            const checkIcon = isCompleted ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>` : '';
            
            taskDiv.innerHTML = `
                <div class="${checkboxClass}">
                    ${checkIcon}
                </div>
                <div class="recent-task-content">
                    <div class="recent-task-title">${task.title || task.name}</div>
                    <div class="recent-task-meta">
                        <span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${task.due_date || 'No date'}
                        </span>
                        <span>${task.category_name || 'Uncategorized'}</span>
                    </div>
                </div>
                <span class="recent-task-badge ${statusClass}">${task.status_name || task.status}</span>
            `;
            
            taskDiv.onclick = () => this.editTask(task.id);
            dashboardTasks.appendChild(taskDiv);
        });
    },

    // Render tasks list
    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        if (!tasksList) return;
        
        const filteredTasks = TaskManager.filterTasks(this.state.tasks, this.state.currentFilter);
        
        // Remove duplicates by task ID (safety check)
        const uniqueTasks = [];
        const seenIds = new Set();
        
        for (const task of filteredTasks) {
            if (!seenIds.has(task.id)) {
                seenIds.add(task.id);
                uniqueTasks.push(task);
            }
        }

        tasksList.innerHTML = '';

        if (uniqueTasks.length === 0) {
            tasksList.innerHTML = '<div class="text-slate-500 text-center py-8">No tasks found</div>';
            return;
        }

        uniqueTasks.forEach((task, index) => {
            const taskElement = this.createTaskElement(task);
            taskElement.style.animationDelay = `${index * 0.05}s`;
            tasksList.appendChild(taskElement);
        });

        // Remove old event listeners by cloning and replacing the container
        const newTasksList = tasksList.cloneNode(false);
        newTasksList.innerHTML = tasksList.innerHTML;
        tasksList.parentNode.replaceChild(newTasksList, tasksList);
        
        // Get the new tasksList reference
        const updatedTasksList = newTasksList;

        // Add event listeners for edit and delete buttons
        updatedTasksList.querySelectorAll('.task-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(btn.getAttribute('data-task-id'));
                this.editTask(taskId);
            });
        });

        updatedTasksList.querySelectorAll('.task-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = parseInt(btn.getAttribute('data-task-id'));
                this.showDeleteModal(taskId);
            });
        });
    },

    // Create task element
    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'task-item';
        
        // Handle both API (title) and localStorage (name) formats
        const taskTitle = task.title || task.name || 'Untitled Task';
        const taskStatus = task.status_name || task.status || 'pending';
        const categoryName = task.category_name || task.category || 'Uncategorized';
        const priorityName = task.priority_name || task.priority || 'medium';
        const dueDate = Utils.formatDate(task.due_date || task.dueDate);
        
        // OJT Fields
        const datePerformed = task.date_performed ? Utils.formatDate(task.date_performed) : null;
        const hoursRendered = task.hours_rendered ? `${task.hours_rendered} hrs` : null;
        const department = task.department;
        const supervisor = task.supervisor;

        const statusEmoji = {
            'Pending': 'tasks',
            'In Progress': 'progress',
            'Completed': 'check',
            'pending': 'tasks',
            'in-progress': 'progress',
            'completed': 'check'
        };

        // Build OJT metadata if available
        let ojtMeta = '';
        if (datePerformed || hoursRendered || department || supervisor) {
            ojtMeta = `
                <div class="task-ojt-meta" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(99, 102, 241, 0.1); font-size: 11px;">
                    ${datePerformed ? `<span style="background: rgba(34, 197, 94, 0.15); color: #22c55e; padding: 2px 6px; border-radius: 3px; margin-right: 4px;">📅 ${datePerformed}</span>` : ''}
                    ${hoursRendered ? `<span style="background: rgba(168, 85, 247, 0.15); color: #a855f7; padding: 2px 6px; border-radius: 3px; margin-right: 4px;">⏱️ ${hoursRendered}</span>` : ''}
                    ${department ? `<span style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 2px 6px; border-radius: 3px; margin-right: 4px;">🏢 ${department}</span>` : ''}
                    ${supervisor ? `<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 2px 6px; border-radius: 3px;">👤 ${supervisor}</span>` : ''}
                </div>
            `;
        }

        div.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <div class="task-title">${taskTitle}</div>
                ${task.description ? `<p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${task.description}</p>` : ''}
                <div class="task-meta">
                    <span style="background: rgba(99, 102, 241, 0.15); color: var(--primary); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                        ${categoryName}
                    </span>
                    <span style="background: rgba(99, 102, 241, 0.15); color: var(--primary); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 3px;">
                        <span style="width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${Icons.render(statusEmoji[taskStatus] || 'tasks')}</span>
                        ${taskStatus}
                    </span>
                    <span style="background: rgba(99, 102, 241, 0.15); color: var(--primary); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 3px;">
                        <span style="width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${Icons.render('calendar')}</span>
                        ${dueDate}
                    </span>
                </div>
                ${ojtMeta}
            </div>
            <div style="display: flex; gap: 6px; flex-shrink: 0;">
                <button class="task-btn task-edit-btn" data-task-id="${task.id}" style="color: #3b82f6;" title="Edit">${Icons.render('edit')}</button>
                <button class="task-btn task-delete-btn" data-task-id="${task.id}" style="color: #ef4444;" title="Delete">${Icons.render('trash')}</button>
            </div>
        `;
        
        return div;
    },

    // Render progress section
    async renderProgress() {
        try {
            // Fetch progress data from API
            const response = await fetch(`${this.state.apiUrl}/progress.php?user_id=${this.state.userId}`);
            const result = await response.json();
            
            console.log('Progress API response:', result);
            
            if (result.success) {
                const data = result.data;
                
                // Update overall progress
                const overallProgressBar = document.getElementById('overallProgressBar');
                const overallPercent = document.getElementById('overallPercent');
                const completionPercentage = parseFloat(data.overall.completion_percentage) || 0;
                
                console.log('Completion percentage:', completionPercentage);
                
                if (overallProgressBar) overallProgressBar.style.width = `${completionPercentage}%`;
                if (overallPercent) overallPercent.textContent = `${Math.round(completionPercentage)}%`;
                
                // Update completed and remaining counts using the correct IDs
                const completedEl = document.getElementById('progressCompletedCount');
                const remainingEl = document.getElementById('progressRemainingCount');
                
                if (completedEl) completedEl.textContent = data.overall.completed_tasks || 0;
                if (remainingEl) {
                    const remaining = (data.overall.total_tasks || 0) - (data.overall.completed_tasks || 0);
                    remainingEl.textContent = remaining;
                }
                
                // Update category progress
                this.renderCategoryProgressFromAPI(data.by_category || []);
                
                // Update milestones based on actual progress
                this.renderMilestonesFromProgress(completionPercentage);
            } else {
                console.error('Failed to fetch progress:', result.message);
                // Fallback to local calculation
                this.renderProgressFallback();
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
            // Fallback to local calculation
            this.renderProgressFallback();
        }
    },
    
    // Fallback progress rendering using local state
    renderProgressFallback() {
        const progress = Progress.calculateProgress(this.state.tasks);
        
        // Update overall progress bar
        const overallProgressBar = document.getElementById('overallProgressBar');
        const overallPercent = document.getElementById('overallPercent');
        if (overallProgressBar) overallProgressBar.style.width = `${progress}%`;
        if (overallPercent) overallPercent.textContent = `${progress}%`;

        // Update category progress
        this.renderCategoryProgress();

        // Update milestones
        this.renderMilestones();
    },

    // Render category progress from API data
    renderCategoryProgressFromAPI(categories) {
        const categoryProgressDiv = document.getElementById('categoryProgress');
        if (!categoryProgressDiv) return;
        
        categoryProgressDiv.innerHTML = '';

        if (!categories || categories.length === 0) {
            categoryProgressDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted); grid-column: 1 / -1;">No tasks in any category yet</div>';
            return;
        }

        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.style.cssText = 'background: var(--bg-alt); border-radius: 12px; padding: 16px; border: 1px solid var(--border);';
            
            const percentage = category.percentage || 0;
            const colorHex = category.color_hex || '#6366f1';
            
            categoryElement.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-weight: 600; color: var(--text); font-size: 13px;">${category.name}</span>
                        <span style="font-size: 12px; font-weight: 600; color: var(--text-muted);">${category.completed}/${category.total}</span>
                    </div>
                    <div style="width: 100%; background: var(--bg-card); border-radius: 4px; height: 8px; overflow: hidden;">
                        <div style="background: ${colorHex}; height: 100%; transition: width 0.5s ease; border-radius: 4px;" class="progress-bar-fill" data-width="${percentage}"></div>
                    </div>
                    <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted); font-weight: 600;">${Math.round(percentage)}% complete</div>
                </div>
            `;
            categoryProgressDiv.appendChild(categoryElement);
            
            // Animate progress bar
            setTimeout(() => {
                const bar = categoryElement.querySelector('.progress-bar-fill');
                if (bar) bar.style.width = `${percentage}%`;
            }, 100);
        });
    },
    
    // Render category progress (fallback using local state)
    renderCategoryProgress() {
        const categoryProgress = Progress.getCategoryProgress(this.state.tasks);
        const categoryProgressDiv = document.getElementById('categoryProgress');
        if (!categoryProgressDiv) return;
        
        categoryProgressDiv.innerHTML = '';

        if (Object.keys(categoryProgress).length === 0) {
            categoryProgressDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No tasks in any category yet</div>';
            return;
        }

        Object.entries(categoryProgress).forEach(([category, data]) => {
            const categoryElement = document.createElement('div');
            categoryElement.style.cssText = 'background: var(--bg-alt); border-radius: 12px; padding: 16px; border: 1px solid var(--border);';
            categoryElement.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span style="font-weight: 600; color: var(--text); font-size: 13px; text-transform: capitalize;">${category}</span>
                        <span style="font-size: 12px; font-weight: 600; color: var(--text-muted);">${data.completed}/${data.total}</span>
                    </div>
                    <div style="width: 100%; background: var(--bg-card); border-radius: 4px; height: 8px; overflow: hidden;">
                        <div style="background: var(--primary); height: 100%; transition: width 0.5s ease; width: ${data.percentage}%; border-radius: 4px;"></div>
                    </div>
                    <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted); font-weight: 600;">${data.percentage}% complete</div>
                </div>
            `;
            categoryProgressDiv.appendChild(categoryElement);
        });
    },

    // Render milestones based on progress percentage from API
    renderMilestonesFromProgress(progress) {
        const milestonesList = document.getElementById('milestones');
        if (!milestonesList) return;
        
        milestonesList.innerHTML = '';
        
        const milestones = [
            { percentage: 25, label: 'Getting Started', icon: '🔥', color: '#f59e0b' },
            { percentage: 50, label: 'Halfway There!', icon: '⭐', color: '#3b82f6' },
            { percentage: 75, label: 'Almost Done', icon: '💪', color: '#8b5cf6' },
            { percentage: 100, label: 'All Complete!', icon: '🎉', color: '#10b981' }
        ];

        milestones.forEach((milestone, index) => {
            const achieved = progress >= milestone.percentage;
            const milestoneElement = document.createElement('div');
            
            milestoneElement.style.cssText = `
                position: relative;
                background: var(--bg-card);
                border: 2px solid ${achieved ? milestone.color : 'var(--border)'};
                border-radius: 16px;
                padding: 20px 16px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                overflow: hidden;
                ${achieved ? `box-shadow: 0 4px 20px ${milestone.color}30;` : 'opacity: 0.7;'}
            `;
            
            // Add background effect for achieved milestones
            const bgEffect = achieved ? `
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, ${milestone.color}15, ${milestone.color}05); pointer-events: none;"></div>
            ` : '';
            
            milestoneElement.innerHTML = `
                ${bgEffect}
                <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: ${achieved ? `linear-gradient(135deg, ${milestone.color}, ${milestone.color}dd)` : 'var(--bg-alt)'}; border-radius: 50%; font-size: 24px; margin-bottom: 4px; box-shadow: ${achieved ? `0 4px 12px ${milestone.color}40` : 'none'}; transition: all 0.3s;">
                    ${milestone.icon}
                </div>
                <div style="position: relative; font-size: 20px; font-weight: 800; color: ${achieved ? milestone.color : 'var(--text-muted)'}; margin-bottom: 2px;">${milestone.percentage}%</div>
                <div style="position: relative; font-size: 12px; font-weight: 600; color: var(--text); text-align: center; line-height: 1.3;">${milestone.label}</div>
                ${achieved ? `
                    <div style="position: relative; margin-top: 4px; padding: 4px 10px; background: ${milestone.color}20; border-radius: 12px; display: flex; align-items: center; gap: 4px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${milestone.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span style="font-size: 10px; color: ${milestone.color}; font-weight: 700;">ACHIEVED</span>
                    </div>
                ` : `
                    <div style="position: relative; margin-top: 4px; padding: 4px 10px; background: var(--bg-alt); border-radius: 12px;">
                        <span style="font-size: 10px; color: var(--text-muted); font-weight: 600;">LOCKED</span>
                    </div>
                `}
            `;
            
            // Add hover effect
            milestoneElement.addEventListener('mouseenter', () => {
                if (achieved) {
                    milestoneElement.style.transform = 'translateY(-4px)';
                    milestoneElement.style.boxShadow = `0 8px 30px ${milestone.color}40`;
                }
            });
            milestoneElement.addEventListener('mouseleave', () => {
                milestoneElement.style.transform = 'translateY(0)';
                if (achieved) {
                    milestoneElement.style.boxShadow = `0 4px 20px ${milestone.color}30`;
                }
            });
            
            milestonesList.appendChild(milestoneElement);
        });
    },
    
    // Render milestones (fallback using local state)
    renderMilestones() {
        const milestones = Progress.getMilestones(this.state.tasks);
        const milestonesList = document.getElementById('milestones');
        if (!milestonesList) return;
        
        milestonesList.innerHTML = '';

        milestones.forEach(milestone => {
            const milestoneElement = document.createElement('div');
            milestoneElement.style.display = 'flex';
            milestoneElement.style.flexDirection = 'column';
            milestoneElement.style.alignItems = 'center';
            milestoneElement.style.justifyContent = 'center';
            milestoneElement.style.gap = '6px';
            milestoneElement.style.padding = '12px 16px';
            milestoneElement.style.borderRadius = '8px';
            milestoneElement.style.transition = 'all 0.2s';
            milestoneElement.style.minWidth = '100px';
            milestoneElement.style.textAlign = 'center';
            
            if (milestone.achieved) {
                milestoneElement.style.background = 'rgba(34, 197, 94, 0.1)';
                milestoneElement.style.border = '1px solid rgba(34, 197, 94, 0.3)';
            } else {
                milestoneElement.style.background = 'var(--bg-alt)';
                milestoneElement.style.border = '1px solid var(--border)';
                milestoneElement.style.opacity = '0.6';
            }
            
            milestoneElement.innerHTML = `
                <div style="font-size: 20px; line-height: 1;">${milestone.icon}</div>
                <div style="font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px;">${milestone.percentage}%</div>
                <div style="font-size: 11px; font-weight: 500; color: var(--text);">${milestone.label}</div>
                ${milestone.achieved ? `<div style="font-size: 9px; color: #22c55e; font-weight: 600; margin-top: 2px;">✓ Achieved</div>` : ''}
            `;
            milestonesList.appendChild(milestoneElement);
        });
    },

    // Render timeline from activity log
    renderTimeline() {
        const timelineList = document.getElementById('timelineList');
        if (!timelineList) return;
        
        timelineList.innerHTML = '';

        // Use tasks as the main data source for timeline
        let items = this.state.tasks.map(task => ({
            id: task.id,
            title: task.title || task.name || 'Untitled',
            description: task.description,
            category: task.category_name || task.category,
            status: task.status_name || task.status,
            priority: task.priority_name || task.priority,
            dueDate: task.due_date || task.dueDate,
            datePerformed: task.date_performed,
            hoursRendered: task.hours_rendered,
            department: task.department,
            supervisor: task.supervisor,
            remarks: task.remarks,
            updatedAt: task.updated_at || task.createdAt,
            createdAt: task.created_at || task.createdAt
        }));

        // Filter based on activity filter
        if (this.state.activityFilter !== 'all') {
            // For non-all filters, use activity log
            const filtered = this.state.activityLog.filter(item => {
                if (this.state.activityFilter === 'status') return item.action === 'status';
                return item.action === this.state.activityFilter;
            });
            
            if (filtered.length === 0) {
                timelineList.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 16px;">No activities yet</div>';
                return;
            }
            
            filtered.forEach((item, index) => {
                const timelineElement = document.createElement('div');
                timelineElement.className = 'timeline-item';
                timelineElement.style.animationDelay = `${index * 0.05}s`;

                const timeAgo = Utils.getTimeAgo(new Date(item.timestamp));
                const badgeColors = {
                    created: '#22c55e',
                    updated: '#3b82f6',
                    status: '#f59e0b',
                    deleted: '#ef4444'
                };
                const actionLabels = {
                    created: 'Created',
                    updated: 'Updated',
                    status: 'Status Changed',
                    deleted: 'Deleted'
                };
                const color = badgeColors[item.action] || 'var(--primary)';
                const actionLabel = actionLabels[item.action] || 'Activity';

                timelineElement.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 8px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                <span style="display:inline-flex; align-items:center; justify-content:center; padding:4px 8px; border-radius:999px; background:${color}15; color:${color}; font-weight:700; font-size:11px;">${actionLabel}</span>
                                ${item.category ? `<span style="font-size:11px; color: var(--text-muted); font-weight:600;">${item.category}</span>` : ''}
                            </div>
                            <h4 style="font-weight: 600; color: var(--text); margin: 0; font-size: 13px;">${item.title}</h4>
                            ${item.status ? `<p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">Status: <span style="font-weight: 600; color: var(--text);">${item.status}</span></p>` : ''}
                        </div>
                        <span style="font-size: 12px; color: var(--text-muted);">${timeAgo}</span>
                    </div>
                `;
                timelineList.appendChild(timelineElement);
            });
            return;
        }

        // For "all" filter, show full task timeline with OJT data
        if (items.length === 0) {
            timelineList.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 16px;">No tasks yet</div>';
            return;
        }

        // Sort by most recent
        items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        items.forEach((item, index) => {
            const timelineElement = document.createElement('div');
            timelineElement.className = 'timeline-item';
            timelineElement.style.animationDelay = `${index * 0.05}s`;

            const timeAgo = Utils.getTimeAgo(new Date(item.updatedAt));
            
            // Determine status color
            const statusColors = {
                'Pending': '#f59e0b',
                'In Progress': '#3b82f6',
                'Completed': '#10b981',
                'pending': '#f59e0b',
                'in-progress': '#3b82f6',
                'completed': '#10b981'
            };
            const statusColor = statusColors[item.status] || '#6b7280';

            // Build OJT data section
            let ojtData = '';
            if (item.datePerformed || item.hoursRendered || item.department || item.supervisor) {
                ojtData = `
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(99, 102, 241, 0.1); display: flex; gap: 6px; flex-wrap: wrap; font-size: 11px;">
                        ${item.datePerformed ? `<span style="background: rgba(34, 197, 94, 0.15); color: #22c55e; padding: 2px 6px; border-radius: 3px;">📅 ${Utils.formatDate(item.datePerformed)}</span>` : ''}
                        ${item.hoursRendered ? `<span style="background: rgba(168, 85, 247, 0.15); color: #a855f7; padding: 2px 6px; border-radius: 3px;">⏱️ ${item.hoursRendered}h</span>` : ''}
                        ${item.department ? `<span style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 2px 6px; border-radius: 3px;">🏢 ${item.department}</span>` : ''}
                        ${item.supervisor ? `<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 2px 6px; border-radius: 3px;">👤 ${item.supervisor}</span>` : ''}
                    </div>
                `;
            }

            timelineElement.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 8px;">
                    <div style="flex: 1;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            <span style="display:inline-flex; align-items:center; justify-content:center; padding:4px 8px; border-radius:999px; background:${statusColor}15; color:${statusColor}; font-weight:700; font-size:11px;">${item.status}</span>
                            ${item.priority ? `<span style="font-size:11px; color: var(--text-muted); font-weight:600;">Priority: ${item.priority}</span>` : ''}
                        </div>
                        <h4 style="font-weight: 600; color: var(--text); margin: 0; font-size: 13px;">${item.title}</h4>
                        ${item.description ? `<p style="font-size: 12px; color: var(--text-muted); margin: 4px 0 0 0; line-height: 1.4;">${item.description}</p>` : ''}
                        ${item.category ? `<p style="font-size: 11px; color: var(--text-muted); margin: 4px 0 0 0;">Category: <span style="font-weight: 600; color: var(--text);">${item.category}</span></p>` : ''}
                        ${ojtData}
                    </div>
                    <span style="font-size: 12px; color: var(--text-muted); white-space: nowrap;">${timeAgo}</span>
                </div>
            `;
            timelineList.appendChild(timelineElement);
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await App.init();
});

// Make App available globally for onclick handlers
window.App = App;
window.UI = UI;
window.Utils = Utils;
window.Storage = Storage;
