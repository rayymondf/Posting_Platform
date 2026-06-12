import { Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Button from './Button.jsx';
import EmptyState from './EmptyState.jsx';

const CATEGORIES = ['', 'Robotics', 'Firmware', 'Embedded Systems', 'Web Development', 'AI/ML', 'PCB Design', 'CAD/Mechanical', 'Data/Cloud', 'Electrical Design', 'Other'];
const STATUSES = ['', 'idea', 'in_progress', 'recruiting', 'completed'];
const STATUS_LABELS = { idea: 'Idea', in_progress: 'In Progress', recruiting: 'Recruiting', completed: 'Completed' };

export default function ProjectsPage({ currentUser, onOpenProject, onNewProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('ranked');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getProjects({ search, category, status, sort })
      .then((data) => { if (!cancelled) { setProjects(data); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [search, category, status, sort]);

  return (
    <div className="projects-page">
      <div className="projects-toolbar">
        <label className="search-box" htmlFor="proj-search">
          <Search size={17} aria-hidden="true" />
          <input id="proj-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." />
        </label>
        <div className="filter-row">
          <SlidersHorizontal size={16} className="filter-icon" aria-hidden="true" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="">All categories</option>
            {CATEGORIES.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.slice(1).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="ranked">Most Active</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
        {currentUser && (
          <Button onClick={onNewProject} className="new-project-btn">+ New Project</Button>
        )}
      </div>

      {error ? <p className="app-error">{error}</p> : null}

      {loading ? (
        <div className="loading-state">Loading projects…</div>
      ) : projects.length ? (
        <div className="project-grid">
          {projects.map((p) => <ProjectCard key={p.id} project={p} onOpen={onOpenProject} />)}
        </div>
      ) : (
        <EmptyState title="No projects found" text="Try adjusting your search or filters, or create the first project." />
      )}
    </div>
  );
}

function ProjectCard({ project, onOpen }) {
  const tags = Array.isArray(project.tags) ? project.tags : [];
  return (
    <article className="project-card" onClick={() => onOpen(project.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(project.id)}>
      <div className="project-card-header">
        <span className={`status-badge status-${project.status}`}>{STATUS_LABELS[project.status] || project.status}</span>
        <span className="category-tag">{project.category}</span>
      </div>
      <h3 className="project-card-title">{project.title}</h3>
      <p className="project-card-desc">{project.short_description}</p>
      {tags.length > 0 && (
        <div className="tag-list">
          {tags.slice(0, 5).map((tag) => <span key={tag} className="skill-tag">{tag}</span>)}
          {tags.length > 5 && <span className="skill-tag muted">+{tags.length - 5}</span>}
        </div>
      )}
      <div className="project-card-footer">
        <span className="project-owner">by {project.owner_display_name || project.owner_username}</span>
        <div className="project-stats">
          {project.members_count > 0 && <span>{project.members_count} member{project.members_count !== 1 ? 's' : ''}</span>}
          {project.open_roles_count > 0 && <span className="open-roles">{project.open_roles_count} open role{project.open_roles_count !== 1 ? 's' : ''}</span>}
        </div>
      </div>
    </article>
  );
}
