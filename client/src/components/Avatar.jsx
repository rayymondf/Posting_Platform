import { initials } from '../utils/format.js';

export default function Avatar({ name, size = 'md' }) {
  return (
    <div className={`avatar avatar-${size}`} aria-hidden="true">
      {initials(name)}
    </div>
  );
}
