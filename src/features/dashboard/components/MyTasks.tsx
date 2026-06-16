
import React from 'react';
import { CheckSquare } from 'lucide-react';
import Card from './Card';
import { useTasks } from '../../../contexts/TasksContext';
import { Link } from 'react-router-dom';

const MyTasks: React.FC = () => {
  const { tasks } = useTasks();
  const pendingTasks = tasks.filter(t => t.status !== 'Completed').slice(0, 5);

  return (
    <Card title="My Tasks" icon={CheckSquare}>
        {pendingTasks.length > 0 ? (
            <div className="space-y-3">
                {pendingTasks.map(task => (
                    <div key={task.id} className="flex justify-between items-center text-sm">
                        <span className="text-text-main">{task.title}</span>
                        <span className="text-text-light">{task.dueDate}</span>
                    </div>
                ))}
                 <Link to="/tasks" className="text-primary text-sm font-semibold hover:underline pt-2 inline-block">View All Tasks</Link>
            </div>
        ) : (
            <div className="h-full flex items-center justify-center">
                <p className="text-text-light">No pending tasks. Great job!</p>
            </div>
        )}
    </Card>
  );
};

export default MyTasks;
