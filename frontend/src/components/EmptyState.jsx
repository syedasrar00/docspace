import { FileText } from 'lucide-react';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><FileText size={25} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
