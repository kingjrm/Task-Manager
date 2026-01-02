// Statistics Module - Handle statistics calculations

const Stats = {
    // Calculate all statistics
    calculateStats(tasks) {
        const total = tasks.length;
        
        // Handle both API format (status_name) and localStorage format (status)
        const completed = tasks.filter(t => {
            const status = (t.status_name || t.status || '').toLowerCase();
            return status === 'completed';
        }).length;
        
        const inProgress = tasks.filter(t => {
            const status = (t.status_name || t.status || '').toLowerCase();
            return status === 'in progress' || status === 'in-progress';
        }).length;
        
        const pending = tasks.filter(t => {
            const status = (t.status_name || t.status || '').toLowerCase();
            return status === 'pending';
        }).length;
        
        const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

        return {
            total,
            completed,
            inProgress,
            pending,
            completionRate
        };
    },

    // Get stats by category
    statsByCategory(tasks) {
        const categories = {};
        
        tasks.forEach(task => {
            const categoryName = task.category_name || task.category || 'Uncategorized';
            const status = (task.status_name || task.status || '').toLowerCase();
            
            if (!categories[categoryName]) {
                categories[categoryName] = { total: 0, completed: 0, pending: 0, inProgress: 0 };
            }
            categories[categoryName].total++;
            
            if (status === 'completed') {
                categories[categoryName].completed++;
            } else if (status === 'pending') {
                categories[categoryName].pending++;
            } else if (status === 'in progress' || status === 'in-progress') {
                categories[categoryName].inProgress++;
            }
        });

        // Calculate percentages
        Object.keys(categories).forEach(cat => {
            categories[cat].percentage = categories[cat].total === 0 ? 0 : 
                Math.round((categories[cat].completed / categories[cat].total) * 100);
        });

        return categories;
    },

    // Get stats by priority
    statsByPriority(tasks) {
        const priorities = { high: 0, medium: 0, low: 0 };
        
        tasks.forEach(task => {
            const priorityName = (task.priority_name || task.priority || 'medium').toLowerCase();
            if (priorityName in priorities) {
                priorities[priorityName]++;
            }
        });

        return priorities;
    },

    // Get overdue tasks
    getOverdueTasks(tasks) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return tasks.filter(task => {
            const dueDate = task.due_date || task.dueDate;
            const status = (task.status_name || task.status || '').toLowerCase();
            if (!dueDate || status === 'completed') return false;
            const taskDue = new Date(dueDate);
            taskDue.setHours(0, 0, 0, 0);
            return taskDue < today;
        });
    },

    // Get tasks due this week
    getDueThisWeek(tasks) {
        const today = new Date();
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        return tasks.filter(task => {
            const dueDate = task.due_date || task.dueDate;
            const status = (task.status_name || task.status || '').toLowerCase();
            if (!dueDate || status === 'completed') return false;
            const taskDue = new Date(dueDate);
            return taskDue >= today && taskDue <= weekEnd;
        });
    },

    // Get completion rate by category
    getCompletionRateByCategory(tasks) {
        const categories = this.statsByCategory(tasks);
        return categories;
    },

    // Get average tasks per category
    getAverageTasksPerCategory(tasks) {
        const categories = this.statsByCategory(tasks);
        const categoryCount = Object.keys(categories).length;
        const totalTasks = tasks.length;
        return categoryCount === 0 ? 0 : Math.round(totalTasks / categoryCount);
    },

    // Get weekly stats
    getWeeklyStats(tasks) {
        const today = new Date();
        const weekStats = {};

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            weekStats[dateStr] = 0;
        }

        tasks.forEach(task => {
            const dueDate = task.dueDate ? task.dueDate.split('T')[0] : null;
            if (dueDate && dueDate in weekStats) {
                weekStats[dueDate]++;
            }
        });

        return weekStats;
    }
};
