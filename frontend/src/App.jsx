import { useCallback, useEffect, useState } from 'react'
import './App.css'

const USER_URL = 'http://localhost:3000'
const ADMIN_URL = 'http://localhost:5000'
const tabs = [
  { id: 'global', label: 'Global' },
  { id: 'category', label: 'By category' },
  { id: 'consistency', label: 'Consistency' },
]

function score(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })
}
function userLabel(id) { return id ? `${String(id).slice(0, 8)}...` : 'Unknown user' }

function App() {
  const [activeTab, setActiveTab] = useState('global')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [user, setUser] = useState(null)
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', residency: 'Chhattisgarh' })
  const [postForm, setPostForm] = useState({ caption: '', category: 'Music', media: null })
  const [post, setPost] = useState(null)
  const [postId, setPostId] = useState('')
  const [comment, setComment] = useState('')
  const [running, setRunning] = useState(false)

  const request = async (url, options = {}) => {
    const response = await fetch(url, { credentials: 'include', ...options })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.message || body.error || 'Request failed')
    return body
  }

  const loadRanking = useCallback(async (tab) => {
    setLoading(true); setError('')
    try { setData(await request(`${ADMIN_URL}/api/v1/admin/rankings/${tab}`)) }
    catch (requestError) { setData(null); setError(requestError.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadRanking(activeTab), 0)
    return () => window.clearTimeout(timer)
  }, [activeTab, loadRanking])

  async function submitAuth(event) {
    event.preventDefault(); setError(''); setMessage('')
    try {
      const body = await request(`${USER_URL}/api/v1/auth/${authMode === 'login' ? 'login' : 'signup'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authForm) })
      setUser(body.user); setMessage(authMode === 'login' ? 'Welcome back.' : 'Account created.')
    } catch (requestError) { setError(requestError.message) }
  }

  async function logout() {
    try { await request(`${USER_URL}/api/v1/auth/logout`, { method: 'POST' }); setUser(null); setMessage('Logged out.') }
    catch (requestError) { setError(requestError.message) }
  }

  async function createPost(event) {
    event.preventDefault(); setError(''); setMessage('')
    const body = new FormData(); body.append('caption', postForm.caption); body.append('category', postForm.category); body.append('media', postForm.media)
    try { const result = await request(`${USER_URL}/api/v1/post/createpost`, { method: 'POST', body }); setPost(result.post); setPostId(result.post?._id || ''); setMessage('Post created.') }
    catch (requestError) { setError(requestError.message) }
  }

  async function postAction(action, method, body) {
    if (!postId) return setError('Enter or create a post ID first.')
    try { const result = await request(`${USER_URL}/api/v1/post/${postId}/${action}`, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined }); setPost(result.post); setMessage(action === 'comment' ? 'Comment added.' : `Post ${action}d.`) }
    catch (requestError) { setError(requestError.message) }
  }

  async function runCascade() {
    setRunning(true); setError(''); setMessage('')
    try { const result = await request(`${ADMIN_URL}/api/v1/admin/run-cascade`, { method: 'POST' }); setMessage(`${result.winners?.length || 0} winners saved.`) }
    catch (requestError) { setError(requestError.message) }
    finally { setRunning(false) }
  }

  const rows = activeTab === 'category' ? Object.entries(data || {}).flatMap(([category, ranking]) => ranking.map((item) => ({ ...item, category }))) : data || []
  const updateAuth = (field, value) => setAuthForm((current) => ({ ...current, [field]: value }))

  return <main className="shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">R</span><span>Rankroom</span></div><span className="environment"><i /> Local contest</span></header>
    <section className="intro"><div><p className="eyebrow">Contest operations</p><h1>Ranking desk</h1><p className="subcopy">Review creators, manage posts, and publish the prize order.</p></div><button className="run-button" onClick={runCascade} disabled={running}><span className="play">{running ? '...' : '▶'}</span>{running ? 'Running cascade' : 'Run cascade'}</button></section>
    <section className="status-strip"><div><span className="status-dot" /> System ready</div><span>Contest started <strong>05 Jan 2026</strong></span><span>Eligibility <strong>Chhattisgarh</strong></span></section>

    <section className="tools">
      <div className="tool-panel"><div className="panel-title"><p className="eyebrow">Creator access</p><h2>{user ? `Hello, ${user.name}` : authMode === 'login' ? 'Sign in' : 'Create account'}</h2></div>{user ? <button className="quiet-button" onClick={logout}>Log out</button> : <form onSubmit={submitAuth} className="form-grid">{authMode === 'signup' && <input required placeholder="Name" value={authForm.name} onChange={(event) => updateAuth('name', event.target.value)} />}<input required type="email" placeholder="Email" value={authForm.email} onChange={(event) => updateAuth('email', event.target.value)} /><input required type="password" placeholder="Password" value={authForm.password} onChange={(event) => updateAuth('password', event.target.value)} />{authMode === 'signup' && <input required placeholder="Residency" value={authForm.residency} onChange={(event) => updateAuth('residency', event.target.value)} />}<button className="dark-button">{authMode === 'login' ? 'Sign in' : 'Sign up'}</button><button type="button" className="text-button" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'Need an account?' : 'Already registered?'}</button></form>}</div>
      <div className="tool-panel"><div className="panel-title"><p className="eyebrow">Creator studio</p><h2>Publish a post</h2></div><form onSubmit={createPost} className="form-grid"><input required placeholder="Caption" value={postForm.caption} onChange={(event) => setPostForm({ ...postForm, caption: event.target.value })} /><select value={postForm.category} onChange={(event) => setPostForm({ ...postForm, category: event.target.value })}>{['Music','Dance','Comedy','Art','Sports','Cooking','Fashion','Tech','Travel','Education'].map((category) => <option key={category}>{category}</option>)}</select><input required type="file" accept="image/*,video/*" onChange={(event) => setPostForm({ ...postForm, media: event.target.files[0] })} /><button className="dark-button">Publish post</button></form></div>
      <div className="tool-panel"><div className="panel-title"><p className="eyebrow">Post actions</p><h2>Engagement</h2></div><div className="form-grid"><input placeholder="Post ID" value={postId} onChange={(event) => setPostId(event.target.value)} /><div className="action-row"><button className="quiet-button" onClick={() => postAction('like', 'POST')}>Like</button><button className="quiet-button" onClick={() => postAction('like', 'DELETE')}>Unlike</button></div><input placeholder="Write a comment" value={comment} onChange={(event) => setComment(event.target.value)} /><button className="quiet-button" onClick={() => { postAction('comment', 'POST', { text: comment }); setComment('') }}>Comment</button>{post && <small>Current post score: {score(post.score)}</small>}</div></div>
    </section>

    {(message || error) && <p className={error ? 'error' : 'notice'}>{error || message}</p>}
    <section className="workspace"><div className="workspace-head"><div><p className="eyebrow">Live standings</p><h2>{tabs.find((tab) => tab.id === activeTab).label} ranking</h2></div><button className="refresh" onClick={() => loadRanking(activeTab)} disabled={loading}>↻ <span>Refresh</span></button></div><nav className="tabs" aria-label="Ranking views">{tabs.map((tab) => <button className={activeTab === tab.id ? 'active' : ''} key={tab.id} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</nav><div className="table-wrap"><table><thead><tr><th>Rank</th><th>Creator</th>{activeTab === 'category' && <th>Category</th>}<th>Score</th><th>Result</th></tr></thead><tbody>{loading ? <tr><td className="empty" colSpan="5">Loading standings...</td></tr> : rows.length === 0 ? <tr><td className="empty" colSpan="5">No ranking data yet</td></tr> : rows.map((item, index) => <tr key={`${item.creator}-${item.category || ''}-${index}`}><td><span className={`rank rank-${index + 1}`}>{index + 1}</span></td><td><span className="creator">{userLabel(item.creator)}</span></td>{activeTab === 'category' && <td><span className="category">{item.category}</span></td>}<td className="score">{score(item.score)}</td><td><span className="result">{activeTab === 'consistency' ? 'Qualified' : index === 0 ? 'Leading' : 'In contention'}</span></td></tr>)}</tbody></table></div></section>
    <footer><span>Rankroom Admin</span><span>Internal use only</span></footer>
  </main>
}
export default App
