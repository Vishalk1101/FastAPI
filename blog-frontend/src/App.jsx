import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [token, setToken] = useState(localStorage.getItem("blog_token") || "");
  const [form, setForm] = useState({ title: "", content: "" });
  const [editingId, setEditingId] = useState(null);

  const totalPages = Math.max(1, Math.ceil((window.__blogTotal || 0) / limit));

  async function loadBlogs(selectedPage = page, selectedSearch = search) {
    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams({
        page: String(selectedPage),
        limit: String(limit),
      });

      if (selectedSearch.trim()) {
        params.set("search", selectedSearch.trim());
      }

      const response = await fetch(`${API_URL}/blogs?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to load blogs");
      }

      window.__blogTotal = data.total;
      setBlogs(data.data || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBlogs(page, search);
  }, [page]);

  async function login() {
    try {
      const response = await fetch(`${API_URL}/login`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("blog_token", data.access_token);
      setToken(data.access_token);
      setMessage("Logged in successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    localStorage.removeItem("blog_token");
    setToken("");
    setMessage("Logged out.");
  }

  async function saveBlog(event) {
    event.preventDefault();

    if (!token) {
      setMessage("Please login first.");
      return;
    }

    const url = editingId
      ? `${API_URL}/blogs/${editingId}`
      : `${API_URL}/create_blog`;

    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to save blog");
      }

      setForm({ title: "", content: "" });
      setEditingId(null);
      setMessage(editingId ? "Blog updated." : "Blog created.");
      await loadBlogs(page, search);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editBlog(blog) {
    setEditingId(blog.id);
    setForm({ title: blog.title, content: blog.content });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteBlog(id) {
    if (!token) {
      setMessage("Please login first.");
      return;
    }

    if (!window.confirm("Delete this blog?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/blogs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to delete blog");
      }

      setMessage("Blog deleted.");
      await loadBlogs(page, search);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ title: "", content: "" });
  }

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    loadBlogs(1, search);
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>My Blog</h1>
          <p>FastAPI + PostgreSQL + React</p>
        </div>

        {token ? (
          <button className="secondary" onClick={logout}>Logout</button>
        ) : (
          <button onClick={login}>Login</button>
        )}
      </header>

      <main className="container">
        {message && <div className="message">{message}</div>}

        {token && (
          <section className="card">
            <h2>{editingId ? "Edit Blog" : "Create Blog"}</h2>

            <form onSubmit={saveBlog}>
              <input
                type="text"
                placeholder="Blog title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <textarea
                placeholder="Write your blog..."
                rows="7"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />

              <div className="actions">
                <button type="submit">
                  {editingId ? "Update Blog" : "Create Blog"}
                </button>

                {editingId && (
                  <button type="button" className="secondary" onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        <section className="search-row">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </section>

        <section>
          <div className="section-title">
            <h2>Latest Blogs</h2>
            {loading && <span>Loading...</span>}
          </div>

          {blogs.length === 0 && !loading ? (
            <div className="card empty">No blogs found.</div>
          ) : (
            <div className="blog-list">
              {blogs.map((blog) => (
                <article className="card blog" key={blog.id}>
                  <div className="blog-top">
                    <h3>{blog.title}</h3>
                    <span>#{blog.id}</span>
                  </div>

                  <p>{blog.content}</p>

                  {token && (
                    <div className="actions">
                      <button onClick={() => editBlog(blog)}>Edit</button>
                      <button className="danger" onClick={() => deleteBlog(blog.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="pagination">
          <button
            className="secondary"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <span>Page {page}</span>

          <button
            className="secondary"
            disabled={blogs.length < limit}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </main>

      <footer>Blog API Project</footer>
    </div>
  );
}

export default App;
