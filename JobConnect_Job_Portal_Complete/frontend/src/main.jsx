import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './style.css';

// configure axios base url and interceptor for jwt token
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// custom auth hook to manage user session
function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, setUser, logout };
}

// helper function to format currency
function formatSalary(amount) {
  if (!amount) return '';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

// helper for badge styling
function getBadgeClass(type = '') {
  const t = type.toLowerCase();
  if (t.includes('full')) return 'badge-full-time';
  if (t.includes('intern')) return 'badge-internship';
  if (t.includes('part')) return 'badge-part-time';
  return 'badge-contract';
}

// main app router component
function App() {
  const auth = useAuth();

  return (
    <BrowserRouter>
      <Header user={auth.user} logout={auth.logout} />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs/:id" element={<JobDetails user={auth.user} />} />
          <Route path="/login" element={<Login setUser={auth.setUser} />} />
          <Route path="/register" element={<Register setUser={auth.setUser} />} />
          <Route path="/applications" element={<MyApplications user={auth.user} />} />
          <Route path="/employer" element={<EmployerDashboard user={auth.user} />} />
          <Route path="/admin" element={<AdminDashboard user={auth.user} />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

// header component with navigation links
function Header({ user, logout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header>
      <div className="container nav-container">
        <Link className="brand-logo" to="/">
          Job<span>Connect</span>
        </Link>
        <nav className="nav-menu">
          <Link to="/">Browse Jobs</Link>
          {user?.role === 'job_seeker' && (
            <Link to="/applications">My Applications</Link>
          )}
          {user?.role === 'employer' && (
            <Link to="/employer">Employer Dashboard</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin">Admin Panel</Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="user-badge">
                {user.name} ({user.role === 'job_seeker' ? 'Seeker' : user.role})
              </span>
              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

// home page with job search and listings
function Home() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ search: '', location: '', jobType: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // fetch jobs list from backend
  const loadJobs = async (pageNumber = page) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/jobs', {
        params: {
          search: filters.search,
          location: filters.location,
          jobType: filters.jobType,
          page: pageNumber,
          limit: 6
        }
      });
      setJobs(response.data.jobs || []);
      setMeta(response.data.pagination || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load jobs from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs(page);
  }, [page]);

  const handleSearch = e => {
    e.preventDefault();
    setPage(1);
    loadJobs(1);
  };

  return (
    <>
      <section className="hero-section">
        <h1>Find Your Next Career Step</h1>
        <p>Explore full-time, part-time and internship openings with top tech companies.</p>

        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Job title, skills or company..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
          <input
            type="text"
            placeholder="Location (e.g. Pune, Remote)"
            value={filters.location}
            onChange={e => setFilters({ ...filters, location: e.target.value })}
          />
          <select
            value={filters.jobType}
            onChange={e => setFilters({ ...filters, jobType: e.target.value })}
          >
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </section>

      {error && (
        <div className="alert-box alert-danger">
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="section-header">
        <h2>Latest Openings</h2>
        <span>{meta.total || jobs.length} active jobs</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
          Loading jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-box">
          <p>No jobs found matching your search criteria.</p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setFilters({ search: '', location: '', jobType: '' });
              setPage(1);
              api.get('/jobs', { params: { page: 1, limit: 6 } }).then(r => {
                setJobs(r.data.jobs);
                setMeta(r.data.pagination);
              });
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {meta.totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {meta.totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

// single job card component
function JobCard({ job }) {
  const skillsList = job.skills
    ? job.skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="job-card">
      <div>
        <span className={`job-type-badge ${getBadgeClass(job.jobType)}`}>
          {job.jobType}
        </span>
        <h3>{job.title}</h3>
        <p className="job-company">{job.company}</p>

        <div className="job-info-row">
          <span>📍 {job.location}</span>
          {job.experience && <span>⏳ {job.experience}</span>}
        </div>

        {skillsList.length > 0 && (
          <div className="job-skills-list">
            {skillsList.slice(0, 3).map((skill, index) => (
              <span key={index} className="skill-pill">
                {skill}
              </span>
            ))}
            {skillsList.length > 3 && (
              <span className="skill-pill">+{skillsList.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="job-card-footer">
        <span className="salary-text">
          {job.salaryMin ? `${formatSalary(job.salaryMin)} - ${formatSalary(job.salaryMax)}` : 'Competitive'}
        </span>
        <Link to={`/jobs/${job.id}`} className="btn btn-secondary btn-sm">
          View Details
        </Link>
      </div>
    </div>
  );
}

// job details page and apply form
function JobDetails({ user }) {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setLoading(true);
    api.get(`/jobs/${id}`)
      .then(res => setJob(res.data))
      .catch(() => setMessage({ type: 'danger', text: 'Job not found or removed' }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApply = async e => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post(`/applications/${id}`, { coverLetter });
      setMessage({ type: 'success', text: 'Application submitted successfully! You can track it in My Applications.' });
      setCoverLetter('');
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Application submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p style={{ padding: '40px 0', textAlign: 'center' }}>Loading job details...</p>;
  }

  if (!job) {
    return (
      <div className="details-container">
        <div className="alert-box alert-danger">Job opportunity not found.</div>
        <Link to="/" className="btn btn-secondary">Back to Jobs</Link>
      </div>
    );
  }

  return (
    <div className="details-container">
      <Link to="/" className="back-link">← Back to all jobs</Link>

      {message.text && (
        <div className={`alert-box alert-${message.type}`}>
          <span>{message.text}</span>
          <button className="alert-close" onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      <div className="details-card">
        <span className={`job-type-badge ${getBadgeClass(job.jobType)}`}>
          {job.jobType}
        </span>
        <h1>{job.title}</h1>
        <p className="details-meta">
          <strong>{job.company}</strong> · {job.location} · Experience: {job.experience || 'Fresher'}
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '15px 0' }} />

        <div className="details-description">{job.description}</div>

        <div className="details-row">
          <strong>Required Skills:</strong> {job.skills || 'Not specified'}
        </div>
        <div className="details-row">
          <strong>Salary Range:</strong> {formatSalary(job.salaryMin)} - {formatSalary(job.salaryMax)}
        </div>
      </div>

      {/* Application section */}
      {user?.role === 'job_seeker' ? (
        <div className="apply-box">
          <h3>Apply for this Position</h3>
          <form onSubmit={handleApply}>
            <div className="form-group">
              <label>Cover Letter / Short Introduction</label>
              <textarea
                required
                placeholder="Write a few lines about your skills, background, and why you are interested in this role..."
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      ) : !user ? (
        <div className="apply-box" style={{ textAlign: 'center' }}>
          <h3>Interested in applying?</h3>
          <p style={{ color: '#6b7280', marginBottom: '15px' }}>
            Please log in with a Job Seeker account to submit your application.
          </p>
          <Link to="/login" className="btn btn-primary">
            Login to Apply
          </Link>
        </div>
      ) : (
        <div className="alert-box alert-info">
          Logged in as <strong>{user.role}</strong>. Only job seekers can submit applications.
        </div>
      )}
    </div>
  );
}

// login component
function Login({ setUser }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'seeker@gmail.com', password: 'Password@123' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', form);
      const data = response.data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      if (data.user.role === 'employer') {
        navigate('/employer');
      } else if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Sign In</h2>
        <p className="auth-subtitle">Login to your JobConnect account</p>

        {/* demo accounts helper */}
        <div className="demo-box">
          <strong>Quick Demo Logins:</strong>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('seeker@gmail.com', 'Password@123')}
            >
              Seeker
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('hr@techvista.com', 'Password@123')}
            >
              Employer
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('admin@jobconnect.com', 'Password@123')}
            >
              Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="alert-box alert-danger">
            <span>{error}</span>
            <button className="alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              required
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              required
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '5px' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}

// register component
function Register({ setUser }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'job_seeker',
    companyName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/register', form);
      const data = response.data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      if (form.role === 'employer') {
        navigate('/employer');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Create an Account</h2>
        <p className="auth-subtitle">Join JobConnect today</p>

        {error && (
          <div className="alert-box alert-danger">
            <span>{error}</span>
            <button className="alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              required
              type="text"
              className="form-input"
              placeholder="Enter full name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              required
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Password (min 8 chars)</label>
            <input
              required
              minLength={8}
              type="password"
              className="form-input"
              placeholder="Choose password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>I want to join as</label>
            <select
              className="form-select"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              <option value="job_seeker">Job Seeker</option>
              <option value="employer">Employer / Recruiter</option>
            </select>
          </div>

          {form.role === 'employer' && (
            <div className="form-group">
              <label>Company Name</label>
              <input
                required
                type="text"
                className="form-input"
                placeholder="e.g. Infosys, TCS, TechVista"
                value={form.companyName}
                onChange={e => setForm({ ...form, companyName: e.target.value })}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '5px' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

// job seeker applications page
function MyApplications({ user }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'job_seeker') {
      api.get('/applications/my')
        .then(res => setApplications(res.data || []))
        .catch(err => setError(err.response?.data?.message || 'Failed to load applications'))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (user?.role !== 'job_seeker') {
    return (
      <div style={{ padding: '40px 0' }}>
        <div className="alert-box alert-danger">
          Please log in as a Job Seeker to view your applications.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '25px 0' }}>
      <h1 className="dashboard-title">My Applications</h1>

      {error && (
        <div className="alert-box alert-danger">{error}</div>
      )}

      {loading ? (
        <p>Loading your applications...</p>
      ) : applications.length === 0 ? (
        <div className="empty-box">
          <p>You have not applied to any jobs yet.</p>
          <Link to="/" className="btn btn-primary">Browse Jobs</Link>
        </div>
      ) : (
        <div className="jobs-grid">
          {applications.map(app => (
            <div key={app.id} className="job-card">
              <div>
                <span className={`job-type-badge badge-${app.status}`}>
                  Status: {app.status}
                </span>
                <h3>{app.job?.title}</h3>
                <p className="job-company">{app.job?.company}</p>
                <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: '6px 0' }}>
                  Location: {app.job?.location}
                </p>
                {app.coverLetter && (
                  <p style={{ fontSize: '0.82rem', color: '#4b5563', background: '#f9fafb', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
                    <strong>Cover Letter:</strong> {app.coverLetter}
                  </p>
                )}
              </div>
              <div className="job-card-footer">
                <Link to={`/jobs/${app.job?.id}`} className="btn btn-secondary btn-sm">
                  View Job
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// employer dashboard to post jobs and review candidates
function EmployerDashboard({ user }) {
  const [jobs, setJobs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const initialForm = {
    title: '',
    description: '',
    company: user?.companyName || '',
    location: '',
    jobType: 'Full-time',
    experience: '0-2 years',
    salaryMin: '',
    salaryMax: '',
    skills: ''
  };

  const [form, setForm] = useState(initialForm);

  const loadJobs = () => {
    setLoading(true);
    api.get('/jobs/employer/mine')
      .then(res => setJobs(res.data || []))
      .catch(err => setMessage({ type: 'danger', text: err.response?.data?.message || 'Could not fetch your jobs' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === 'employer') {
      loadJobs();
    }
  }, [user]);

  if (user?.role !== 'employer') {
    return (
      <div style={{ padding: '40px 0' }}>
        <div className="alert-box alert-danger">
          Please log in as an Employer to access this dashboard.
        </div>
      </div>
    );
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      if (editingId) {
        await api.put(`/jobs/${editingId}`, form);
        setMessage({ type: 'success', text: 'Job updated successfully!' });
      } else {
        await api.post('/jobs', form);
        setMessage({ type: 'success', text: 'Job posted successfully!' });
      }
      setEditingId(null);
      setForm(initialForm);
      loadJobs();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to save job' });
    }
  };

  const handleEdit = job => {
    setEditingId(job.id);
    setForm({
      title: job.title || '',
      description: job.description || '',
      company: job.company || user.companyName || '',
      location: job.location || '',
      jobType: job.jobType || 'Full-time',
      experience: job.experience || '0-2 years',
      salaryMin: job.salaryMin || '',
      salaryMax: job.salaryMax || '',
      skills: job.skills || ''
    });
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleDelete = async id => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        await api.delete(`/jobs/${id}`);
        setMessage({ type: 'success', text: 'Job deleted successfully' });
        loadJobs();
      } catch (err) {
        setMessage({ type: 'danger', text: err.response?.data?.message || 'Could not delete job' });
      }
    }
  };

  return (
    <div style={{ padding: '25px 0' }}>
      <h1 className="dashboard-title">Employer Dashboard</h1>

      {message.text && (
        <div className={`alert-box alert-${message.type}`}>
          <span>{message.text}</span>
          <button className="alert-close" onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Post or Edit Job Form */}
      <div className="dashboard-card">
        <h3>{editingId ? 'Edit Job Opening' : 'Post a New Job Opening'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Job Title</label>
              <input
                required
                className="form-input"
                placeholder="e.g. React Developer"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Company Name</label>
              <input
                required
                className="form-input"
                placeholder="e.g. TechVista"
                value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                required
                className="form-input"
                placeholder="e.g. Pune, Mumbai, Remote"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Job Type</label>
              <select
                className="form-select"
                value={form.jobType}
                onChange={e => setForm({ ...form, jobType: e.target.value })}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div className="form-group">
              <label>Experience</label>
              <input
                className="form-input"
                placeholder="e.g. 0-2 years, 1-3 years"
                value={form.experience}
                onChange={e => setForm({ ...form, experience: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Skills (comma separated)</label>
              <input
                className="form-input"
                placeholder="e.g. React, Node.js, MySQL"
                value={form.skills}
                onChange={e => setForm({ ...form, skills: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Minimum Salary (₹/year)</label>
              <input
                type="number"
                className="form-input"
                placeholder="300000"
                value={form.salaryMin}
                onChange={e => setForm({ ...form, salaryMin: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Maximum Salary (₹/year)</label>
              <input
                type="number"
                className="form-input"
                placeholder="550000"
                value={form.salaryMax}
                onChange={e => setForm({ ...form, salaryMax: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label>Job Description</label>
              <textarea
                required
                rows={4}
                placeholder="Enter job responsibilities, qualifications, etc."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update Job' : 'Post Job'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Posted jobs list */}
      <div className="dashboard-card">
        <h3>Your Posted Jobs ({jobs.length})</h3>

        {loading ? (
          <p>Loading your jobs...</p>
        ) : jobs.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No jobs posted yet. Use the form above to add your first job.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {jobs.map(job => (
              <div key={job.id} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span className={`job-type-badge ${getBadgeClass(job.jobType)}`}>{job.jobType}</span>
                    <h4 style={{ fontSize: '1.1rem', color: '#111827', margin: '4px 0' }}>{job.title}</h4>
                    <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>
                      {job.location} · {job.experience || 'Fresher'} · {formatSalary(job.salaryMin)} - {formatSalary(job.salaryMax)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(job)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(job.id)}>
                      Delete
                    </button>
                  </div>
                </div>

                {/* Applicants subcomponent */}
                <JobApplicantsList jobId={job.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// view and update applicants for an employer's job
function JobApplicantsList({ jobId }) {
  const [open, setOpen] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/applications/employer/${jobId}`);
      setApplicants(res.data || []);
    } catch {
      alert('Could not load applicants');
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => {
    if (!open) fetchApplicants();
    setOpen(!open);
  };

  const updateStatus = async (appId, newStatus) => {
    try {
      await api.patch(`/applications/${appId}/status`, { status: newStatus });
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    } catch {
      alert('Could not update status');
    }
  };

  return (
    <div style={{ marginTop: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
      <button className="btn btn-secondary btn-sm" onClick={toggleOpen}>
        {open ? 'Hide Applicants' : 'View Applicants'} ({applicants.length})
      </button>

      {open && (
        <div className="applicants-box">
          {loading ? (
            <p style={{ fontSize: '0.85rem' }}>Loading applicants...</p>
          ) : applicants.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>No candidates have applied to this job yet.</p>
          ) : (
            applicants.map(app => (
              <div key={app.id} className="applicant-row">
                <div>
                  <strong>{app.seeker?.name}</strong> ({app.seeker?.email})
                  {app.seeker?.phone && <span> · Phone: {app.seeker.phone}</span>}
                  {app.seeker?.skills && <div style={{ fontSize: '0.78rem', color: '#4b5563' }}>Skills: {app.seeker.skills}</div>}
                  {app.coverLetter && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>"{app.coverLetter}"</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    className="applicant-status-select"
                    value={app.status}
                    onChange={e => updateStatus(app.id, e.target.value)}
                  >
                    <option value="applied">applied</option>
                    <option value="shortlisted">shortlisted</option>
                    <option value="hired">hired</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// admin dashboard for platform statistics and user management
function AdminDashboard({ user }) {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [dashRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users')
      ]);
      setStats(dashRes.data || {});
      setUsers(usersRes.data || []);
    } catch {
      setMessage({ type: 'danger', text: 'Could not load administrative data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '40px 0' }}>
        <div className="alert-box alert-danger">
          Admin login required to view this panel.
        </div>
      </div>
    );
  }

  const handleDeleteUser = async id => {
    if (window.confirm('Delete this user and all associated records?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        setMessage({ type: 'success', text: 'User removed successfully' });
        loadAdminData();
      } catch (err) {
        setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to delete user' });
      }
    }
  };

  return (
    <div style={{ padding: '25px 0' }}>
      <h1 className="dashboard-title">Admin Dashboard</h1>

      {message.text && (
        <div className={`alert-box alert-${message.type}`}>
          <span>{message.text}</span>
          <button className="alert-close" onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Summary statistics cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Users</span>
          <strong>{stats.users ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Employers</span>
          <strong>{stats.employers ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Seekers</span>
          <strong>{stats.seekers ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Jobs</span>
          <strong>{stats.jobs ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Applications</span>
          <strong>{stats.applications ?? 0}</strong>
        </div>
      </div>

      {/* User management table */}
      <div className="dashboard-card">
        <h3>Platform Users ({users.length})</h3>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Details</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className="user-badge">{u.role}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {u.companyName ? `Company: ${u.companyName} ` : ''}
                      {u.phone ? `Phone: ${u.phone}` : ''}
                    </td>
                    <td>
                      {u.id !== user.id ? (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteUser(u.id)}
                        >
                          Delete
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Current</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// render root component
createRoot(document.getElementById('root')).render(<App />);
