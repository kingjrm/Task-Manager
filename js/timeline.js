// Timeline Module - Handle activity timeline and logging

const Timeline = {
    // Get activity log
    getActivityLog(tasks) {
        const log = [];

        tasks.forEach(task => {
            log.push({
                timestamp: new Date(task.createdAt),
                type: 'created',
                task,
                description: `Created task "${task.name}"`
            });

            if (task.status === 'completed') {
                log.push({
                    timestamp: new Date(task.updatedAt),
                    type: 'completed',
                    task,
                    description: `Completed task "${task.name}"`
                });
            }
        });

        return log.sort((a, b) => b.timestamp - a.timestamp);
    },

    // Get timeline events
    getTimelineEvents(tasks) {
        const events = [];

        tasks.forEach(task => {
            events.push({
                id: task.id,
                date: new Date(task.createdAt),
                title: task.name,
                description: task.description,
                status: task.status,
                category: task.category,
                type: 'task_created',
                icon: '📝'
            });

            if (task.status === 'in-progress') {
                events.push({
                    id: `${task.id}_started`,
                    date: new Date(task.updatedAt),
                    title: `Started: ${task.name}`,
                    description: 'In progress',
                    status: 'in-progress',
                    category: task.category,
                    type: 'task_started',
                    icon: '⏳'
                });
            }

            if (task.status === 'completed') {
                events.push({
                    id: `${task.id}_completed`,
                    date: new Date(task.updatedAt),
                    title: `Completed: ${task.name}`,
                    description: 'Task finished',
                    status: 'completed',
                    category: task.category,
                    type: 'task_completed',
                    icon: '✅'
                });
            }
        });

        return events.sort((a, b) => b.date - a.date);
    },

    // Get today's activities
    getTodayActivities(tasks) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return tasks.filter(task => {
            const taskDate = new Date(task.updatedAt);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate >= today && taskDate < tomorrow;
        });
    },

    // Get weekly summary
    getWeeklySummary(tasks) {
        const summary = {};
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const dateStr = date.toISOString().split('T')[0];

            const dayTasks = tasks.filter(task => {
                const taskDate = new Date(task.updatedAt);
                taskDate.setHours(0, 0, 0, 0);
                return taskDate.toISOString().split('T')[0] === dateStr;
            });

            summary[dateStr] = {
                created: dayTasks.filter(t => t.createdAt.split('T')[0] === dateStr).length,
                completed: dayTasks.filter(t => t.status === 'completed').length,
                updated: dayTasks.length
            };
        }

        return summary;
    },

    // Get milestone events
    getMilestoneEvents(tasks) {
        const events = [];
        const completed = tasks.filter(t => t.status === 'completed');
        
        if (completed.length >= 1) {
            events.push({
                type: 'milestone',
                count: 1,
                icon: '🎯',
                label: 'First Task Completed'
            });
        }
        
        if (completed.length >= 5) {
            events.push({
                type: 'milestone',
                count: 5,
                icon: '⚡',
                label: '5 Tasks Completed'
            });
        }
        
        if (completed.length >= 10) {
            events.push({
                type: 'milestone',
                count: 10,
                icon: '🚀',
                label: '10 Tasks Completed'
            });
        }

        return events;
    },

    // Get last activity
    getLastActivity(tasks) {
        if (tasks.length === 0) return null;

        const sorted = [...tasks].sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );

        return sorted[0];
    },

    // Get activity by category
    getActivityByCategory(tasks) {
        const activities = Utils.groupBy(tasks, 'category');
        const result = {};

        Object.keys(activities).forEach(category => {
            result[category] = {
                total: activities[category].length,
                completed: activities[category].filter(t => t.status === 'completed').length,
                lastUpdate: new Date(activities[category][0].updatedAt)
            };
        });

        return result;
    }
};
