import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Database,
  Gauge,
  ListChecks,
  Menu,
  Moon,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { JsonBlock } from "./components/JsonBlock.jsx";
import { StatusBadge } from "./components/StatusBadge.jsx";
import { DemoRuntimeClient } from "./lib/demo-runtime.js";
import { RuntimeHttpClient } from "./lib/runtime-client.js";

const NAV = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "runs", label: "Runs", icon: ListChecks },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "lifecycle", label: "Lifecycle", icon: Moon },
  { id: "settings", label: "Settings", icon: Settings },
];

function formatTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function shortId(value) {
  if (!value) return "-";
  const parts = value.split(":");
  return parts.at(-1).replaceAll("-", " ");
}

function PageHeader({ title, meta, onRefresh, loading }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">House Runtime</p>
        <h1>{title}</h1>
      </div>
      <div className="page-actions">
        {meta && <span className="header-meta">{meta}</span>}
        {onRefresh && (
          <button className="icon-button bordered" type="button" title="Refresh" aria-label="Refresh" disabled={loading} onClick={onRefresh}>
            <RefreshCw size={17} className={loading ? "spin" : ""} />
          </button>
        )}
      </div>
    </header>
  );
}

function LoadingRows() {
  return <div className="loading-rows" aria-label="Loading"><span /><span /><span /></div>;
}

function EmptyState({ icon: Icon = Database, title, detail }) {
  return <div className="empty-state"><Icon size={24} /><strong>{title}</strong>{detail && <span>{detail}</span>}</div>;
}

function ErrorBanner({ error }) {
  if (!error) return null;
  return <div className="error-banner" role="alert"><CircleAlert size={18} /><span>{error.message}</span><code>{error.code || "E_CONSOLE"}</code></div>;
}

function RunTable({ runs, selectedId, onSelect }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Run</th><th>Agent</th><th>Status</th><th>Updated</th><th aria-label="Open" /></tr></thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.run_id} className={selectedId === run.run_id ? "selected" : ""} onClick={() => onSelect?.(run.run_id)}>
              <td><strong className="run-name">{shortId(run.run_id)}</strong><span className="subline">{shortId(run.room_id)}</span></td>
              <td>{shortId(run.agent_id)}</td>
              <td><StatusBadge status={run.status} /></td>
              <td>{formatTime(run.updated_at)}</td>
              <td><ChevronRight size={16} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useRuns(client, refreshKey, options = {}) {
  const [state, setState] = useState({ loading: true, runs: [], error: null });
  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    client.listRuns(options).then((runs) => active && setState({ loading: false, runs, error: null })).catch((error) => active && setState({ loading: false, runs: [], error }));
    return () => { active = false; };
  }, [client, refreshKey, options.status]);
  return state;
}

function Overview({ client, refreshKey, refresh }) {
  const { loading, runs, error } = useRuns(client, refreshKey);
  const counts = runs.reduce((all, run) => ({ ...all, [run.status]: (all[run.status] || 0) + 1 }), {});
  return (
    <>
      <PageHeader title="Overview" meta={`${runs.length} recent runs`} onRefresh={refresh} loading={loading} />
      <ErrorBanner error={error} />
      <section className="metric-band" aria-label="Run summary">
        <div><Activity size={18} /><span>Total</span><strong>{runs.length}</strong></div>
        <div><Clock3 size={18} /><span>In flight</span><strong>{(counts.queued || 0) + (counts.running || 0)}</strong></div>
        <div><CheckCircle2 size={18} /><span>Completed</span><strong>{counts.completed || 0}</strong></div>
        <div><CircleAlert size={18} /><span>Needs attention</span><strong>{(counts.failed || 0) + (counts.waiting_confirmation || 0)}</strong></div>
      </section>
      <section className="panel">
        <div className="section-heading"><div><h2>Recent runs</h2><span>Newest Runtime activity</span></div></div>
        {loading ? <LoadingRows /> : runs.length ? <RunTable runs={runs.slice(0, 8)} /> : <EmptyState title="No runs" />}
      </section>
    </>
  );
}

function Runs({ client, refreshKey, refresh }) {
  const [status, setStatus] = useState("");
  const { loading, runs, error } = useRuns(client, refreshKey, { status: status || undefined, limit: 100 });
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState({ loading: false, run: null, evidence: null, initiative: null, error: null });

  useEffect(() => {
    if (!selectedId && runs.length) setSelectedId(runs[0].run_id);
    if (selectedId && !runs.some((run) => run.run_id === selectedId)) setSelectedId(runs[0]?.run_id || null);
  }, [runs, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setDetail((current) => ({ ...current, loading: true, error: null }));
    Promise.all([client.getRun(selectedId), client.getEvidence(selectedId), client.getInitiative(selectedId)])
      .then(([run, evidence, initiative]) => active && setDetail({ loading: false, run, evidence, initiative, error: null }))
      .catch((detailError) => active && setDetail({ loading: false, run: null, evidence: null, initiative: null, error: detailError }));
    return () => { active = false; };
  }, [client, selectedId, refreshKey]);

  return (
    <>
      <PageHeader title="Runs" meta={`${runs.length} shown`} onRefresh={refresh} loading={loading} />
      <ErrorBanner error={error || detail.error} />
      <div className="filter-bar">
        <label htmlFor="run-status">Status</label>
        <select id="run-status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="queued">Queued</option><option value="running">Running</option><option value="waiting_confirmation">Awaiting approval</option>
          <option value="completed">Completed</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option><option value="timed_out">Timed out</option>
        </select>
      </div>
      <div className="runs-layout">
        <section className="panel runs-list">
          {loading ? <LoadingRows /> : runs.length ? <RunTable runs={runs} selectedId={selectedId} onSelect={setSelectedId} /> : <EmptyState title="No matching runs" />}
        </section>
        <section className="panel run-detail">
          {detail.loading ? <LoadingRows /> : detail.run ? (
            <>
              <div className="detail-title"><div><span className="mono">{detail.run.run_id}</span><h2>{shortId(detail.run.agent_id)}</h2></div><StatusBadge status={detail.run.status} /></div>
              <dl className="facts"><div><dt>Room</dt><dd>{detail.run.room_id}</dd></div><div><dt>Attempts</dt><dd>{detail.run.attempts} / {detail.run.max_attempts}</dd></div><div><dt>Created</dt><dd>{formatTime(detail.run.created_at)}</dd></div><div><dt>Updated</dt><dd>{formatTime(detail.run.updated_at)}</dd></div></dl>
              <div className="record-stack">
                <JsonBlock label="Initiative" value={detail.initiative} />
                <JsonBlock label="Evidence" value={detail.evidence} />
              </div>
            </>
          ) : <EmptyState title="Select a run" detail="Run evidence and initiative records appear here." />}
        </section>
      </div>
    </>
  );
}

function Memory({ client, refreshKey }) {
  const [subjectId, setSubjectId] = useState("agent:lantern");
  const [submitted, setSubmitted] = useState("agent:lantern");
  const [includeQuarantined, setIncludeQuarantined] = useState(false);
  const [state, setState] = useState({ loading: true, records: [], error: null });
  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    client.queryMemories({ subjectId: submitted, limit: 100, includeQuarantined }).then((records) => active && setState({ loading: false, records, error: null })).catch((error) => active && setState({ loading: false, records: [], error }));
    return () => { active = false; };
  }, [client, submitted, includeQuarantined, refreshKey]);
  return (
    <>
      <PageHeader title="Memory" meta={`${state.records.length} records`} />
      <ErrorBanner error={state.error} />
      <form className="query-bar" onSubmit={(event) => { event.preventDefault(); if (subjectId.trim()) setSubmitted(subjectId.trim()); }}>
        <label htmlFor="memory-subject">Subject ID</label><input id="memory-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} />
        <label className="checkbox"><input type="checkbox" checked={includeQuarantined} onChange={(event) => setIncludeQuarantined(event.target.checked)} /> Include quarantined</label>
        <button className="primary-button" type="submit"><Search size={16} /> Query</button>
      </form>
      <section className="record-list">
        {state.loading ? <LoadingRows /> : state.records.length ? state.records.map((record) => (
          <article className="record-row" key={record.memory_id}>
            <div className="record-meta"><StatusBadge status={record.status} /><span>{record.kind}</span><time>{formatTime(record.created_at)}</time></div>
            <p>{record.body}</p><code>{record.memory_id}</code>
          </article>
        )) : <EmptyState icon={Brain} title="No memory records" />}
      </section>
    </>
  );
}

function Lifecycle({ client, refreshKey }) {
  const [subjectId, setSubjectId] = useState("agent:lantern");
  const [kind, setKind] = useState("journal");
  const [query, setQuery] = useState({ subjectId: "agent:lantern", kind: "journal" });
  const [state, setState] = useState({ loading: true, records: [], error: null });
  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    client.queryLifecycle({ ...query, limit: 50 }).then((records) => active && setState({ loading: false, records, error: null })).catch((error) => active && setState({ loading: false, records: [], error }));
    return () => { active = false; };
  }, [client, query, refreshKey]);
  return (
    <>
      <PageHeader title="Lifecycle" meta={`${state.records.length} records`} />
      <ErrorBanner error={state.error} />
      <form className="query-bar" onSubmit={(event) => { event.preventDefault(); if (subjectId.trim()) setQuery({ subjectId: subjectId.trim(), kind }); }}>
        <label htmlFor="life-subject">Subject ID</label><input id="life-subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} />
        <label htmlFor="life-kind">Record</label><select id="life-kind" value={kind} onChange={(event) => setKind(event.target.value)}><option value="journal">Journal</option><option value="dream">Dream</option><option value="handoff">Handoff</option></select>
        <button className="primary-button" type="submit"><Search size={16} /> Query</button>
      </form>
      <section className="record-list">
        {state.loading ? <LoadingRows /> : state.records.length ? state.records.map((record, index) => <JsonBlock key={record.journal_id || record.dream_id || record.handoff_id || index} label={`${kind} record`} value={record} />) : <EmptyState icon={BookOpen} title="No lifecycle records" />}
      </section>
    </>
  );
}

function SettingsPage({ mode, setMode, endpoint, setEndpoint, client, refreshKey, refresh }) {
  const [health, setHealth] = useState({ loading: true, result: null, error: null });
  useEffect(() => {
    let active = true;
    setHealth({ loading: true, result: null, error: null });
    client.health().then((result) => active && setHealth({ loading: false, result, error: null })).catch((error) => active && setHealth({ loading: false, result: null, error }));
    return () => { active = false; };
  }, [client, refreshKey]);
  return (
    <>
      <PageHeader title="Settings" onRefresh={refresh} loading={health.loading} />
      <ErrorBanner error={health.error} />
      <section className="settings-grid">
        <div className="settings-section"><div className="section-heading"><div><h2>Connection</h2><span>Runtime transport</span></div><ShieldCheck size={20} /></div>
          <div className="field-group"><span>Mode</span><div className="segmented"><button type="button" className={mode === "demo" ? "active" : ""} onClick={() => setMode("demo")}>Demo</button><button type="button" className={mode === "live" ? "active" : ""} onClick={() => setMode("live")}>Live</button></div></div>
          <label className="field-group" htmlFor="runtime-endpoint"><span>Runtime endpoint</span><input id="runtime-endpoint" value={endpoint} disabled={mode === "demo"} onChange={(event) => setEndpoint(event.target.value)} /></label>
        </div>
        <div className="settings-section"><div className="section-heading"><div><h2>Runtime</h2><span>Current health</span></div><Activity size={20} /></div>
          {health.loading ? <LoadingRows /> : health.result ? <dl className="facts vertical"><div><dt>Status</dt><dd className="healthy-dot">Connected</dd></div><div><dt>Version</dt><dd>{health.result.runtime_version}</dd></div><div><dt>Authentication</dt><dd>Host session cookie</dd></div></dl> : <EmptyState title="Unavailable" />}
        </div>
      </section>
    </>
  );
}

export default function App() {
  const [page, setPage] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState("demo");
  const [endpoint, setEndpoint] = useState(import.meta.env.VITE_HOUSE_RUNTIME_ENDPOINT || "/api/runtime");
  const [refreshKey, setRefreshKey] = useState(0);
  const client = useMemo(() => mode === "demo" ? new DemoRuntimeClient() : new RuntimeHttpClient({ endpoint }), [mode, endpoint]);
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);
  const active = NAV.find((item) => item.id === page);
  const CurrentIcon = active?.icon || Gauge;

  const navigate = (id) => { setPage(id); setMenuOpen(false); };
  return (
    <div className="app-shell">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand"><div className="brand-mark"><Database size={20} /></div><div><strong>House</strong><span>Console alpha</span></div><button className="icon-button mobile-close" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
        <nav aria-label="Primary navigation">{NAV.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={page === id ? "active" : ""} onClick={() => navigate(id)}><Icon size={18} /><span>{label}</span></button>)}</nav>
        <div className="sidebar-status"><span className="connection-dot" /><div><strong>{mode === "demo" ? "Demo data" : "Live Runtime"}</strong><span>Protocol 0.2</span></div></div>
      </aside>
      {menuOpen && <button className="scrim" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <main>
        <div className="mobile-bar"><button className="icon-button" type="button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={21} /></button><div><CurrentIcon size={17} /><span>{active?.label}</span></div><span className="connection-dot" /></div>
        <div className="content">
          {page === "overview" && <Overview client={client} refreshKey={refreshKey} refresh={refresh} />}
          {page === "runs" && <Runs client={client} refreshKey={refreshKey} refresh={refresh} />}
          {page === "memory" && <Memory client={client} refreshKey={refreshKey} />}
          {page === "lifecycle" && <Lifecycle client={client} refreshKey={refreshKey} />}
          {page === "settings" && <SettingsPage mode={mode} setMode={setMode} endpoint={endpoint} setEndpoint={setEndpoint} client={client} refreshKey={refreshKey} refresh={refresh} />}
        </div>
      </main>
    </div>
  );
}
