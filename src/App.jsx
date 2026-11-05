import { useEffect, useMemo, useState } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import { LayoutDashboard, ReceiptText, ChartNoAxesCombined, Settings, Plus, Search, ChevronDown, ArrowUpRight, ArrowDownRight, Utensils, CarFront, House, ShoppingBag, HeartPulse, Ellipsis, CalendarDays, SlidersHorizontal, Trash2, Wallet, ArrowUpDown, X, Check, Sparkles, Download } from 'lucide-react'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const categories = [
  { name: 'Food & dining', color: '#8bbba0', icon: Utensils },
  { name: 'Transport', color: '#f1b36a', icon: CarFront },
  { name: 'Housing', color: '#849de0', icon: House },
  { name: 'Shopping', color: '#df91a3', icon: ShoppingBag },
  { name: 'Health', color: '#a68dde', icon: HeartPulse },
  { name: 'Other', color: '#9ca9a1', icon: Ellipsis },
]
const initialExpenses = [
  { id: 'seed-1', title: 'Sunday brunch', category: 'Food & dining', amount: 28.5, date: '2026-11-05', note: 'Little Fern Cafe' },
  { id: 'seed-2', title: 'Metro pass', category: 'Transport', amount: 42, date: '2026-11-04', note: 'Monthly commute' },
  { id: 'seed-3', title: 'Weekly groceries', category: 'Shopping', amount: 86.24, date: '2026-11-03', note: 'Market & pantry' },
  { id: 'seed-4', title: 'Electric bill', category: 'Housing', amount: 64.8, date: '2026-11-02', note: 'October usage' },
  { id: 'seed-5', title: 'Yoga class', category: 'Health', amount: 18, date: '2026-11-01', note: 'Sunday flow' },
]
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const today = () => new Date().toISOString().slice(0, 10)
const monthKey = (date) => date.slice(0, 7)

function App() {
  const [page, setPage] = useState(() => window.location.pathname.replace(/^\//, '') || 'overview')
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('pennywise-name') || 'Jamie Parker')
  const [currency, setCurrency] = useState(() => localStorage.getItem('pennywise-currency') || 'USD')
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
  const [expenses, setExpenses] = useState(() => {
    try { const stored = localStorage.getItem('pennywise-expenses'); return stored ? JSON.parse(stored) : initialExpenses } catch { return initialExpenses }
  })
  const [month, setMonth] = useState(monthKey(today()))
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent')
  const [range, setRange] = useState({ from: '', to: '' })
  const [amounts, setAmounts] = useState({ min: '', max: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    const syncPage = () => setPage(window.location.pathname.replace(/^\//, '') || 'overview')
    window.addEventListener('popstate', syncPage)
    return () => window.removeEventListener('popstate', syncPage)
  }, [])

  function navigate(event, destination) {
    if (event) event.preventDefault()
    window.history.pushState({}, '', destination === 'overview' ? '/' : `/${destination}`)
    setPage(destination)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => { localStorage.setItem('pennywise-expenses', JSON.stringify(expenses)) }, [expenses])

  const monthExpenses = useMemo(() => expenses.filter((e) => monthKey(e.date) === month), [expenses, month])
  const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const priorMonth = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const key = new Date(y, m - 2, 1).toISOString().slice(0, 7)
    return expenses.filter((e) => monthKey(e.date) === key).reduce((sum, e) => sum + Number(e.amount), 0)
  }, [expenses, month])
  const categoryTotals = categories.map((c) => ({ ...c, total: monthExpenses.filter((e) => e.category === c.name).reduce((sum, e) => sum + Number(e.amount), 0) })).sort((a, b) => b.total - a.total)
  const filtered = useMemo(() => monthExpenses.filter((e) => {
    const matchesCategory = categoryFilter === 'All categories' || e.category === categoryFilter
    const matchesQuery = `${e.title} ${e.note} ${e.category}`.toLowerCase().includes(query.toLowerCase())
    const matchesRange = (!range.from || e.date >= range.from) && (!range.to || e.date <= range.to)
    const matchesAmount = (!amounts.min || Number(e.amount) >= Number(amounts.min)) && (!amounts.max || Number(e.amount) <= Number(amounts.max))
    return matchesCategory && matchesQuery && matchesRange && matchesAmount
  }).sort((a, b) => sort === 'recent' ? b.date.localeCompare(a.date) : Number(b.amount) - Number(a.amount)), [monthExpenses, categoryFilter, query, range, amounts, sort])

  function addExpense(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const expense = { id: crypto.randomUUID(), title: form.get('title').trim(), category: form.get('category'), amount: Number(form.get('amount')), date: form.get('date'), note: form.get('note').trim() }
    setExpenses((current) => [expense, ...current]); setMonth(monthKey(expense.date)); setCategoryFilter('All categories'); setShowForm(false); setNotice('Expense added'); setTimeout(() => setNotice(''), 2400)
  }
  function deleteExpense(id) { setExpenses((current) => current.filter((e) => e.id !== id)) }
  function changeMonth(delta) { const [y, m] = month.split('-').map(Number); setMonth(new Date(y, m - 1 + delta, 1).toISOString().slice(0, 7)) }
  const monthLabel = new Date(`${month}-02T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const chartData = { labels: categoryTotals.filter((c) => c.total > 0).map((c) => c.name), datasets: [{ data: categoryTotals.filter((c) => c.total > 0).map((c) => c.total), backgroundColor: categoryTotals.filter((c) => c.total > 0).map((c) => c.color), borderWidth: 0, hoverOffset: 5 }] }
  const barData = { labels: categoryTotals.map((c) => c.name.split(' ')[0]), datasets: [{ data: categoryTotals.map((c) => c.total), backgroundColor: categoryTotals.map((c) => c.color), borderRadius: 5, barThickness: 22 }] }

  return <div className="app-shell">
    <aside className="sidebar">
      <a href="/" onClick={(e) => navigate(e, 'overview')} className="brand"><span className="brand-mark"><Wallet size={20} strokeWidth={2.3} /></span><span>pennywise<span className="brand-dot">.</span></span></a>
      <div className="side-label">MENU</div>
      <nav className="nav-list"><a href="/overview" onClick={(e) => navigate(e, 'overview')} className={`nav-item ${page === 'overview' ? 'active' : ''}`}><LayoutDashboard size={18} /> Overview</a><a href="/transactions" onClick={(e) => navigate(e, 'transactions')} className={`nav-item ${page === 'transactions' ? 'active' : ''}`}><ReceiptText size={18} /> Transactions</a><a href="/analytics" onClick={(e) => navigate(e, 'analytics')} className={`nav-item ${page === 'analytics' ? 'active' : ''}`}><ChartNoAxesCombined size={18} /> Analytics</a></nav>
      <div className="side-bottom"><div className="side-label">YOUR SPACE</div><a href="/settings" onClick={(e) => navigate(e, 'settings')} className={`nav-item ${page === 'settings' ? 'active' : ''}`}><Settings size={18} /> Settings</a><div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={16} /></div><div className="upgrade-title">A little more insight?</div><p>Discover your spending habits with monthly insights.</p><button onClick={(e) => navigate(e, 'insights')}>Explore insights <ArrowUpRight size={14} /></button></div><div className="profile-wrap"><button className="profile" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen} aria-label="Open profile menu"><div className="avatar">{displayName.charAt(0).toUpperCase()}</div><div className="profile-copy"><b>{displayName}</b><span>Personal account</span></div><ChevronDown size={17} className={`profile-chevron ${profileOpen ? 'profile-chevron-open' : ''}`} /></button>{profileOpen && <div className="profile-menu"><div className="profile-menu-heading">Signed in as <b>{displayName}</b></div><a href="/settings" onClick={(e) => { setProfileOpen(false); navigate(e, 'settings') }}><Settings size={16} /> Account settings</a><a href="/insights" onClick={(e) => { setProfileOpen(false); navigate(e, 'insights') }}><Sparkles size={16} /> Monthly insights</a></div>}</div></div>
    </aside>

    <main className="main-content" id="overview">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>{({ overview: 'Overview', transactions: 'Transactions', analytics: 'Analytics', settings: 'Settings', insights: 'Insights' })[page] || 'Overview'}</b></div><div className="top-actions"><span className="today-tag"><span className="live-dot" /> Your money, at a glance</span><button className="avatar small-avatar" aria-label="Open settings" onClick={(e) => navigate(e, 'settings')}>{displayName.charAt(0).toUpperCase()}</button></div></header>
      <div className="page-wrap">
        <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> {page === 'overview' ? 'YOUR FINANCIAL SNAPSHOT' : 'YOUR MONEY, YOUR WAY'}</div><h1>{page === 'overview' ? `Good morning, ${displayName.split(' ')[0]} ✳` : ({ transactions: 'Transactions', analytics: 'Your spending, clearly', settings: 'Settings', insights: 'Your monthly insights' })[page] || 'Overview'}</h1><p className="subtitle">{({ overview: 'A clear picture of where your money goes.', transactions: 'Every expense, all in one place.', analytics: 'Understand your spending at a glance.', settings: 'Make Pennywise feel like yours.', insights: 'A few helpful notes about this month.' })[page]}</p></div>{page !== 'settings' && page !== 'insights' && <button className="primary-btn" onClick={() => setShowForm(true)}><Plus size={18} strokeWidth={2.5} /> Add expense</button>}</section>

        {page === 'overview' && <>
        <section className="summary-grid">
          <article className="summary-card total-card"><div className="card-top"><span className="card-label">TOTAL SPENT</span><span className="card-icon green-icon"><Wallet size={17} /></span></div><div className="metric">{fmt(total)}</div><div className="card-foot"><span className="month-chip"><CalendarDays size={13} /> {monthLabel}</span><span className="foot-note">across {monthExpenses.length} transactions</span></div><div className="total-glow" /></article>
          <article className="summary-card"><div className="card-top"><span className="card-label">DAILY AVERAGE</span><span className="card-icon peach-icon"><ArrowUpRight size={17} /></span></div><div className="metric">{fmt(monthExpenses.length ? total / new Date(`${month}-01T12:00:00`).getDate() : 0)}</div><div className="card-foot"><span className="trend-down"><ArrowDownRight size={14} /> 12.8%</span><span className="foot-note">vs. last month</span></div><div className="progress-track"><span style={{ width: `${Math.min(100, priorMonth ? (total / priorMonth) * 100 : 38)}%` }} /></div></article>
          <article className="summary-card"><div className="card-top"><span className="card-label">BIGGEST CATEGORY</span><span className="card-icon purple-icon"><ChartNoAxesCombined size={17} /></span></div><div className="metric category-metric">{categoryTotals[0]?.total ? categoryTotals[0].name : '—'}</div><div className="card-foot"><span className="category-amount">{fmt(categoryTotals[0]?.total || 0)}</span><span className="foot-note">this month</span></div><div className="tiny-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></article>
        </section>

        </>}
        {(page === 'overview' || page === 'analytics') && <section className="analysis-grid" id="analytics">
          <article className="panel spending-panel"><div className="panel-heading"><div><h2>Spending breakdown</h2><p>See where it all goes</p></div><button className="select-button" onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronDown className="rotate" size={16} /></button><button className="select-button" onClick={() => changeMonth(1)} aria-label="Next month"><ChevronDown className="up" size={16} /></button></div><div className="donut-wrap"><Doughnut data={chartData} options={{ cutout: '76%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${fmt(ctx.raw)}` } } }, maintainAspectRatio: false }} /><div className="donut-center"><span>THIS MONTH</span><b>{fmt(total)}</b><small>{monthLabel}</small></div></div><div className="legend-list">{categoryTotals.filter((c) => c.total > 0).slice(0, 4).map((c) => <div className="legend-item" key={c.name}><span className="legend-name"><i style={{ background: c.color }} />{c.name}</span><span className="legend-amount">{fmt(c.total)}</span><span className="legend-pct">{total ? Math.round(c.total / total * 100) : 0}%</span></div>)}{!total && <div className="chart-empty">Add an expense to see your breakdown.</div>}</div><a className="panel-link" href="/transactions" onClick={(e) => navigate(e, 'transactions')}>View all categories <ArrowUpRight size={14} /></a></article>
          <article className="panel activity-panel"><div className="panel-heading"><div><h2>Category overview</h2><p>Your spending, category by category</p></div><button className="period-button" onClick={() => changeMonth(-1)}>{monthLabel.split(' ')[0]} <ChevronDown size={14} /></button></div><div className="bar-chart"><Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${fmt(ctx.raw)}` } } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: '#929b94', font: { family: 'DM Sans', size: 10 } } }, y: { beginAtZero: true, grid: { color: '#eff1ee', drawTicks: false }, border: { display: false, dash: [3, 4] }, ticks: { color: '#a0a8a1', font: { family: 'DM Sans', size: 10 }, padding: 10, callback: (v) => v === 0 ? '$0' : `$${v}` } } } }} /></div><div className="category-grid">{categoryTotals.slice(0, 4).map((c) => { const Icon = c.icon; return <div className="category-stat" key={c.name}><span className="cat-icon" style={{ background: `${c.color}26`, color: c.color }}><Icon size={15} /></span><span className="cat-stat-label">{c.name}</span><b>{fmt(c.total)}</b></div> })}</div></article>
        </section>}

        {(page === 'overview' || page === 'transactions') && <section className="panel transactions-panel" id="transactions"><div className="transactions-head"><div><h2>{page === 'overview' ? 'Recent transactions' : 'All transactions'}</h2><p>{page === 'overview' ? 'Your latest money moves' : `${monthLabel} · your complete list`} <span className="count-badge">{filtered.length}</span></p></div><button className="text-action" onClick={() => setShowForm(true)}><Plus size={15} /> Add new</button></div><div className="toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transactions..." /></div><div className="toolbar-actions"><select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option>All categories</option>{categories.map((c) => <option key={c.name}>{c.name}</option>)}</select><button className={`filter-button ${showFilters ? 'selected' : ''}`} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={15} /> Filters</button><button className="sort-button" onClick={() => setSort(sort === 'recent' ? 'amount' : 'recent')} title="Toggle sort"><ArrowUpDown size={15} /><span>{sort === 'recent' ? 'Recent' : 'Amount'}</span></button></div></div>
          {showFilters && <div className="advanced-filters"><label>From<input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label><label>To<input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label><label>Min amount<input type="number" min="0" placeholder="$0" value={amounts.min} onChange={(e) => setAmounts({ ...amounts, min: e.target.value })} /></label><label>Max amount<input type="number" min="0" placeholder="No limit" value={amounts.max} onChange={(e) => setAmounts({ ...amounts, max: e.target.value })} /></label><button onClick={() => { setRange({ from: '', to: '' }); setAmounts({ min: '', max: '' }) }}>Clear</button></div>}
          <div className="table-wrap"><table><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>AMOUNT</th><th></th></tr></thead><tbody>{filtered.map((e) => { const cat = categories.find((c) => c.name === e.category) || categories[5]; const Icon = cat.icon; return <tr key={e.id}><td><div className="transaction-name"><span className="transaction-icon" style={{ background: `${cat.color}24`, color: cat.color }}><Icon size={17} /></span><span><b>{e.title}</b><small>{e.note || e.category}</small></span></div></td><td><span className="category-pill"><i style={{ background: cat.color }} />{e.category}</span></td><td className="date-cell">{new Date(`${e.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td><td className="amount-cell">−{fmt(Number(e.amount))}</td><td><button className="delete-button" title={`Delete ${e.title}`} onClick={() => deleteExpense(e.id)}><Trash2 size={15} /></button></td></tr> })}</tbody></table>{!filtered.length && <div className="empty-state"><span><ReceiptText size={20} /></span><b>No transactions found</b><p>Try changing your filters or add a new expense.</p><button onClick={() => setShowForm(true)}>Add an expense <Plus size={14} /></button></div>}</div>
          <div className="table-footer"><span>Showing <b>{filtered.length}</b> of <b>{monthExpenses.length}</b> transactions</span><button className="export-button" onClick={() => { const rows = [['Title', 'Category', 'Date', 'Amount', 'Note'], ...filtered.map((e) => [e.title, e.category, e.date, e.amount, e.note])]; const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `expenses-${month}.csv`; a.click(); URL.revokeObjectURL(a.href) }}><Download size={14} /> Export CSV</button></div>
        </section>}
        {page === 'settings' && <section className="panel settings-page"><h2>Personal preferences</h2><p>Update the details used in your workspace.</p><label className="form-field">Display name<input value={displayName} onChange={(e) => { setDisplayName(e.target.value); localStorage.setItem('pennywise-name', e.target.value) }} /></label><label className="form-field">Currency<select value={currency} onChange={(e) => { setCurrency(e.target.value); localStorage.setItem('pennywise-currency', e.target.value) }}><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — British Pound</option><option value="INR">INR — Indian Rupee</option><option value="CAD">CAD — Canadian Dollar</option></select></label><div className="settings-note"><Check size={16} /> Your expenses are saved privately in this browser.</div></section>}
        {page === 'insights' && <section className="insight-page"><article className="panel insight-feature"><span className="upgrade-icon"><Sparkles size={18} /></span><h2>Your {monthLabel} snapshot</h2><p>You’ve recorded <b>{monthExpenses.length} {monthExpenses.length === 1 ? 'expense' : 'expenses'}</b> totaling <b>{fmt(total)}</b> this month.</p></article><div className="insight-cards">{categoryTotals.filter((c) => c.total > 0).slice(0, 3).map((c, i) => <article className="panel insight-card" key={c.name}><span className="cat-icon" style={{ background: `${c.color}26`, color: c.color }}><c.icon size={16} /></span><small>{i === 0 ? 'TOP CATEGORY' : 'ALSO TRACKING'}</small><b>{c.name}</b><p>{fmt(c.total)} this month · {total ? Math.round(c.total / total * 100) : 0}% of your spending</p></article>)}</div></section>}
        <footer className="footer-note"><span>Made for a little more peace of mind <span className="heart">♡</span></span><span>Your data stays on this device <span className="privacy-dot" /></span></footer>
      </div>
    </main>

    {showForm && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}><form className="expense-modal" onSubmit={addExpense}><div className="modal-head"><div><span className="eyebrow"><span className="eyebrow-line" /> QUICK ENTRY</span><h2>Add an expense</h2></div><button type="button" className="close-modal" onClick={() => setShowForm(false)} aria-label="Close"><X size={18} /></button></div><label className="form-field">What was it for?<input name="title" required maxLength="70" placeholder="e.g. Coffee with a friend" autoFocus /></label><div className="form-row"><label className="form-field">Amount<input name="amount" required type="number" min="0.01" step="0.01" placeholder="0.00" /></label><label className="form-field">Date<input name="date" type="date" required defaultValue={today()} /></label></div><label className="form-field">Category<select name="category" defaultValue="Food & dining">{categories.map((c) => <option key={c.name}>{c.name}</option>)}</select></label><label className="form-field">Note <span className="optional">(optional)</span><input name="note" maxLength="100" placeholder="A little extra detail" /></label><div className="modal-footer"><button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-btn"><Check size={16} /> Save expense</button></div></form></div>}
    {notice && <div className="toast"><span><Check size={15} /></span>{notice}</div>}
  </div>
}

export default App
