const DEMO_USERS = [
  { name: 'Alice', email: 'alice@docspace.demo', description: 'Document owner account' },
  { name: 'Bob', email: 'bob@docspace.demo', description: 'Collaborator account' },
];

export default function DemoUserSelector({ value, onChange }) {
  return (
    <div className="demo-user-options">
      {DEMO_USERS.map((user) => (
        <button
          key={user.email}
          type="button"
          className={`demo-user-option${value === user.email ? ' selected' : ''}`}
          onClick={() => onChange(user.email)}
        >
          <span className="avatar">{user.name.charAt(0)}</span>
          <span className="demo-user-copy">
            <strong>{user.name}</strong>
            <small>{user.description}</small>
          </span>
          <span className="radio-indicator" />
        </button>
      ))}
    </div>
  );
}
