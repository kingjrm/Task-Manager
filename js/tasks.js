// Task Management Module - Handle all task operations

const TaskManager = {
    // Create new task
    createTask(name, description, category, priority, dueDate, status) {
        return {
            id: Utils.generateId(),
            name,
            description,
            category,
            priority,
            dueDate,
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    // Update task
    updateTask(task, updates) {
        return {
            ...task,
            ...updates,
            updatedAt: new Date().toISOString()
        };
    },

    // Get task by ID
    getTaskById(tasks, id) {
        return tasks.find(t => t.id === id);
    },

    // Find task index
    findTaskIndex(tasks, id) {
        return tasks.findIndex(t => t.id === id);
    },

    // Filter tasks
    filterTasks(tasks, status = 'all') {
        if (status === 'all') return tasks;
        
        return tasks.filter(t => {
            // Handle both API format (status_name) and localStorage format (status)
            const taskStatus = (t.status_name || t.status || '').toLowerCase();
            const filterStatus = status.toLowerCase();
            
            // Normalize status names for comparison
            const normalizeStatus = (s) => {
                if (s === 'in-progress' || s === 'in progress') return 'in-progress';
                return s;
            };
            
            return normalizeStatus(taskStatus) === normalizeStatus(filterStatus);
        });
    },

    // Search tasks
    searchTasks(tasks, query) {
        const lowerQuery = query.toLowerCase();
        return tasks.filter(task => 
            task.name.toLowerCase().includes(lowerQuery) ||
            task.description.toLowerCase().includes(lowerQuery) ||
            task.category.toLowerCase().includes(lowerQuery)
        );
    },

    // Get tasks by category
    getTasksByCategory(tasks, category) {
        return tasks.filter(t => t.category === category);
    },

    // Get tasks by priority
    getTasksByPriority(tasks, priority) {
        return tasks.filter(t => t.priority === priority);
    },

    // Sort tasks
    sortTasks(tasks, sortBy = 'createdAt', order = 'desc') {
        const sorted = [...tasks];
        return sorted.sort((a, b) => {
            let valueA = a[sortBy];
            let valueB = b[sortBy];

            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }

            if (order === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
    },

    // Validate task
    validateTask(task) {
        const errors = [];

        if (!task.name || task.name.trim() === '') {
            errors.push('Task name is required');
        }

        if (!task.category || task.category.trim() === '') {
            errors.push('Category is required');
        }

        if (!task.priority || task.priority.trim() === '') {
            errors.push('Priority is required');
        }

        const validStatuses = ['pending', 'in-progress', 'completed'];
        if (!validStatuses.includes(task.status)) {
            errors.push('Invalid status');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Bulk update tasks
    bulkUpdateTasks(tasks, ids, updates) {
        return tasks.map(task => 
            ids.includes(task.id) ? this.updateTask(task, updates) : task
        );
    },

    // Bulk delete tasks
    bulkDeleteTasks(tasks, ids) {
        return tasks.filter(task => !ids.includes(task.id));
    },

    // Get recent tasks
    getRecentTasks(tasks, limit = 5) {
        return Utils.sortByDate(tasks, 'updatedAt', 'desc').slice(0, limit);
    },

    // Get upcoming tasks
    getUpcomingTasks(tasks) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return tasks
            .filter(t => t.dueDate && t.status !== 'completed')
            .filter(t => new Date(t.dueDate) >= today)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    },

    // Duplicate task
    duplicateTask(task) {
        return this.createTask(
            `${task.name} (Copy)`,
            task.description,
            task.category,
            task.priority,
            task.dueDate,
            'pending'
        );
    }
};
