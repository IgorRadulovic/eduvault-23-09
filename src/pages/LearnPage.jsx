// src/pages/LearnPage.jsx
// Course player for buyers (and the creator/admins, for previewing).
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth, toast } from '../context';
import { getProductForLearning, getMyEnrollment, getLectureVideoUrl, saveCourseProgress } from '../api/services';
import { Button, Spinner } from '../components/ui';
import Icon from '../components/ui/Icon';
import SEO from '../components/layout/SEO';

export default function LearnPage() {
  const { slug } = useParams();
  const { user, isAdmin } = useAuth();
  const [product, setProduct]       = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [current, setCurrent]       = useState(0);
  const [completed, setCompleted]   = useState([]);
  const [videoUrl, setVideoUrl]     = useState(null);
  const [videoErr, setVideoErr]     = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProductForLearning(slug)
      .then(async p => {
        const enr = await getMyEnrollment(p.id);
        setProduct(p); setEnrollment(enr);
        setCompleted(enr?.completed_lectures ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, user?.id]);

  // Every titled lecture, in order, with its section name
  const lectures = useMemo(() => (product?.curriculum ?? []).flatMap(s =>
    (s.lectures ?? []).filter(l => l.title?.trim()).map(l => ({ ...l, id: String(l.id), section: s.title }))
  ), [product]);

  // Start at the first lecture not yet completed
  useEffect(() => {
    if (!lectures.length) return;
    const i = lectures.findIndex(l => !completed.includes(l.id));
    setCurrent(i === -1 ? 0 : i);
  }, [lectures.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const lecture = lectures[current];

  useEffect(() => {
    setVideoUrl(null); setVideoErr(null);
    if (!lecture?.videoPath) return;
    getLectureVideoUrl(lecture.videoPath).then(setVideoUrl).catch(e => setVideoErr(e.message));
  }, [lecture?.videoPath]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spinner size={36} /></div>;

  if (error || !product) return (
    <div className="page" style={{ padding: '100px 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Course not found</h1>
      <Link to="/my-courses"><Button variant="primary">Back to My Courses</Button></Link>
    </div>
  );

  const canWatch = !!enrollment || isAdmin || product.createdBy === user?.id;
  if (!canWatch) return (
    <div className="page" style={{ padding: '100px 24px', textAlign: 'center' }}>
      <SEO title={product.title} noIndex />
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>You don’t have access to this course yet</h1>
      <p style={{ color: 'var(--text2)', marginBottom: 24 }}>Buy it once and it’s yours for life.</p>
      <Link to={`/product/${product.slug}`}><Button variant="primary">View course</Button></Link>
    </div>
  );

  const progress = lectures.length ? Math.round((completed.length / lectures.length) * 100) : 0;
  const allDone  = lectures.length > 0 && completed.length >= lectures.length;
  const isDone   = id => completed.includes(id);

  async function toggleComplete(id, value = !isDone(id)) {
    const next = value ? [...new Set([...completed, id])] : completed.filter(x => x !== id);
    setCompleted(next);
    if (!enrollment) return;   // preview mode (creator/admin): nothing to save
    try { await saveCourseProgress(product.id, next, lectures.length); }
    catch (e) { toast.error('Could not save progress: ' + e.message); }
  }

  function onEnded() {
    toggleComplete(lecture.id, true);
    if (current < lectures.length - 1) setCurrent(current + 1);
  }

  return (
    <main>
      <SEO title={product.title} noIndex />
      <div className="page" style={{ paddingTop: 24, paddingBottom: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <Link to="/my-courses" style={{ color: 'var(--accent-text)', fontWeight: 600, fontSize: 14 }}>← My Courses</Link>
          <h1 style={{ fontSize: 24, fontWeight: 600, flex: '1 1 300px' }}>{product.title}</h1>
          <div style={{ flex: '0 1 240px', minWidth: 180 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 5 }}>
              <span>{completed.length} of {lectures.length} lessons</span><strong style={{ color: 'var(--text)' }}>{progress}%</strong>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 99, height: 7, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: 7, background: allDone ? 'var(--success)' : 'var(--accent)', transition: 'width .4s var(--ease)' }} />
            </div>
          </div>
        </div>

        {!enrollment && (
          <p style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', borderRadius: 10, padding: '10px 14px', fontSize: 14, marginBottom: 16 }}>
            Preview mode: you’re seeing this as the {isAdmin ? 'admin' : 'creator'}. Progress isn’t saved.
          </p>
        )}

        {showWelcome && progress === 0 && product.welcomeMessage && (
          <Message tone="info" title="Welcome!" text={product.welcomeMessage} onClose={() => setShowWelcome(false)} />
        )}
        {allDone && product.congratsMessage && (
          <Message tone="success" title="Congratulations — you finished the course!" text={product.congratsMessage} />
        )}

        {lectures.length === 0 ? (
          <p style={{ color: 'var(--text2)', padding: '40px 0' }}>This course has no lessons yet.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
            {/* Video + lesson info */}
            <div style={{ flex: '999 1 600px', minWidth: 0 }}>
              <div style={{ background: '#000', borderRadius: 14, overflow: 'hidden', aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {videoUrl ? (
                  <video key={videoUrl} src={videoUrl} controls controlsList="nodownload" onEnded={onEnded} onContextMenu={e => e.preventDefault()}
                    style={{ width: '100%', height: '100%', background: '#000' }} />
                ) : (
                  <p style={{ color: '#C9D7E8', fontSize: 15, padding: 24, textAlign: 'center' }}>
                    {videoErr ?? (lecture?.videoPath ? 'Loading video…' : 'This lesson has no video.')}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 18 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{lecture.section}</p>
                  <h2 style={{ fontSize: 22, fontWeight: 600, margin: '2px 0 4px' }}>{lecture.title}</h2>
                  {lecture.caption && <p style={{ color: 'var(--text2)', fontSize: 15 }}>{lecture.caption}</p>}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Button variant={isDone(lecture.id) ? 'success' : 'secondary'} onClick={() => toggleComplete(lecture.id)}>
                    <Icon name="check" size={16} /> {isDone(lecture.id) ? 'Completed' : 'Mark as complete'}
                  </Button>
                  {current < lectures.length - 1 && (
                    <Button variant="primary" onClick={() => setCurrent(current + 1)}>Next lesson <Icon name="arrow" size={16} /></Button>
                  )}
                </div>
              </div>
            </div>

            {/* Lesson list */}
            <aside style={{ flex: '1 1 300px', minWidth: 0, maxWidth: 420, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              {(product.curriculum ?? []).filter(s => s.lectures?.some(l => l.title?.trim())).map((s, si) => (
                <div key={s.id ?? si}>
                  <p style={{ padding: '12px 16px', background: 'var(--bg3)', fontSize: 13, fontWeight: 700 }}>{si + 1}. {s.title}</p>
                  {s.lectures.filter(l => l.title?.trim()).map(l => {
                    const idx = lectures.findIndex(x => x.id === String(l.id));
                    const active = idx === current;
                    return (
                      <button key={l.id} type="button" onClick={() => setCurrent(idx)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', borderTop: '1px solid var(--border)', background: active ? 'var(--accent-bg)' : 'transparent', textAlign: 'left', fontSize: 14, color: active ? 'var(--accent-text)' : 'var(--text)', fontWeight: active ? 600 : 400 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone(String(l.id)) ? 'var(--success)' : 'var(--bg3)', border: isDone(String(l.id)) ? 'none' : '1.5px solid var(--border2)' }}>
                          {isDone(String(l.id)) && <Icon name="check" size={13} stroke={3} color="#fff" />}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>{l.title}</span>
                        <Icon name="play" size={12} color="var(--text3)" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function Message({ tone, title, text, onClose }) {
  const c = tone === 'success'
    ? { bg: 'var(--success-bg)', border: 'var(--success-border)', fg: 'var(--success)' }
    : { bg: 'var(--info-bg)', border: 'var(--info-border)', fg: 'var(--info)' };
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '16px 20px', marginBottom: 18, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, color: c.fg, marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 15, color: 'var(--text)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{text}</p>
      </div>
      {onClose && <button type="button" onClick={onClose} aria-label="Dismiss" style={{ background: 'none', border: 'none', padding: 4 }}><Icon name="close" size={18} color="var(--text2)" /></button>}
    </div>
  );
}
