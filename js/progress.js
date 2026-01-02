// Progress Module - Handle progress tracking and calculations

const Progress = {
    // Calculate overall progress percentage
    calculateProgress(tasks) {
        if (tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.status === 'completed').length;
        return Math.round((completed / tasks.length) * 100);
    },

    // Get category progress
    getCategoryProgress(tasks) {
        const categories = Utils.groupBy(tasks, 'category');
        const categoryProgress = {};

        Object.keys(categories).forEach(category => {
            const categoryTasks = categories[category];
            const completed = categoryTasks.filter(t => t.status === 'completed').length;
            categoryProgress[category] = {
                total: categoryTasks.length,
                completed,
                percentage: categoryTasks.length === 0 ? 0 : Math.round((completed / categoryTasks.length) * 100)
            };
        });

        return categoryProgress;
    },

    // Get milestone achievements
    getMilestones(tasks) {
        const progress = this.calculateProgress(tasks);
        
        const milestones = [
            { percentage: 25, label: '25% Complete', icon: Icons.fire },
            { percentage: 50, label: 'Halfway There!', icon: Icons.star },
            { percentage: 75, label: '75% Complete', icon: Icons.star },
            { percentage: 100, label: 'All Done!', icon: Icons.check }
        ];

        return milestones.map(milestone => ({
            ...milestone,
            achieved: progress >= milestone.percentage
        }));
    },

    // Get next milestone
    getNextMilestone(tasks) {
        const progress = this.calculateProgress(tasks);
        const milestones = this.getMilestones(tasks);
        
        const unachieved = milestones.find(m => !m.achieved);
        if (!unachieved) return null;

        const progressToNext = unachieved.percentage - progress;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const tasksToNext = Math.ceil((progressToNext / 100) * totalTasks);

        return {
            milestone: unachieved,
            progress,
            tasksToComplete: tasksToNext,
            percentageToNext: progressToNext
        };
    },

    // Get progress by priority
    getProgressByPriority(tasks) {
        const priorities = { high: {}, medium: {}, low: {} };
        
        ['high', 'medium', 'low'].forEach(priority => {
            const priorityTasks = tasks.filter(t => t.priority === priority);
            const completed = priorityTasks.filter(t => t.status === 'completed').length;
            priorities[priority] = {
                total: priorityTasks.length,
                completed,
                percentage: priorityTasks.length === 0 ? 0 : Math.round((completed / priorityTasks.length) * 100)
            };
        });

        return priorities;
    },

    // Get progress timeline data
    getProgressTimeline(tasks) {
        const timeline = {};
        
        tasks.forEach(task => {
            const date = task.createdAt.split('T')[0];
            if (!timeline[date]) {
                timeline[date] = { created: 0, completed: 0 };
            }
            timeline[date].created++;

            if (task.status === 'completed') {
                const completedDate = task.updatedAt.split('T')[0];
                if (!timeline[completedDate]) {
                    timeline[completedDate] = { created: 0, completed: 0 };
                }
                timeline[completedDate].completed++;
            }
        });

        return timeline;
    },

    // Get estimated completion date
    getEstimatedCompletion(tasks) {
        const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length;
        if (pending === 0) return null;

        const last7Days = tasks.filter(t => {
            const createdDate = new Date(t.createdAt);
            const daysAgo = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
            return daysAgo <= 7 && t.status === 'completed';
        }).length;

        if (last7Days === 0) return null;

        const avgPerDay = last7Days / 7;
        const daysToComplete = Math.ceil(pending / avgPerDay);
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + daysToComplete);

        return estimatedDate;
    },

    // Get productivity score (0-100)
    getProductivityScore(tasks) {
        if (tasks.length === 0) return 0;

        const completed = tasks.filter(t => t.status === 'completed').length;
        const completionRate = (completed / tasks.length) * 40; // 40 points for completion

        const onTimeCount = tasks.filter(t => {
            if (!t.dueDate || t.status !== 'completed') return false;
            const dueDate = new Date(t.dueDate);
            const completedDate = new Date(t.updatedAt);
            return completedDate <= dueDate;
        }).length;
        const onTimeRate = (onTimeCount / completed) * 40; // 40 points for on-time

        const priorityScore = tasks
            .filter(t => t.status === 'completed')
            .reduce((acc, t) => {
                return acc + (t.priority === 'high' ? 2 : t.priority === 'medium' ? 1 : 0);
            }, 0);
        const priorityBonus = Math.min((priorityScore / tasks.length) * 20, 20); // 20 points for priority

        return Math.round(completionRate + onTimeRate + priorityBonus);
    }
};
