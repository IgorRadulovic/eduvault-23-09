// src/pages/CreateCoursePage.jsx
import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, toast } from '../context';
import { createProduct, uploadProductImage, uploadEbookFile, uploadLectureVideo } from '../api/services';
import EbookFileInput from '../components/courses/EbookFileInput';
import Icon from '../components/ui/Icon';
import { Button, Input, Select, Textarea } from '../components/ui';
import SEO from '../components/layout/SEO';

// ─── constants ────────────────────────────────
const STEPS = [
  { id:'type',        icon:'📦', label:'Type'          },
  { id:'curriculum',  icon:'📋', label:'Curriculum'     },
  { id:'landing',     icon:'🖼️',  label:'Landing Page'  },
  { id:'pricing',     icon:'💰', label:'Pricing'        },
  { id:'messages',    icon:'💬', label:'Messages'       },
];

const CATEGORIES = ['Development','Design','Business','Data Science','Marketing','Productivity'];
const LEVELS     = ['Beginner','Intermediate','Advanced','All Levels'];
const LANGUAGES  = ['English','Spanish','French','German','Portuguese','Italian','Arabic','Chinese','Japanese','Hindi','Other'];
// All prices on the site are in US dollars
const CURRENCIES = [{ code:'USD', symbol:'$', label:'USD — US Dollar' }];

// Supabase free plan: 50 MB per file. On the Pro plan, raise the project's
// upload limit (Storage → Settings) and this value together.
const VIDEO_MAX_MB  = 50;
const VIDEO_ACCEPT  = '.mp4,.webm,.mov';
const fmtMB = b => `${(b/1024/1024).toFixed(1)} MB`;

// ─── tiny sub-components ──────────────────────
function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom:28 }}>
      <h2 style={{ fontSize:24, fontWeight:700, marginBottom:sub?8:0 }}>{children}</h2>
      {sub && <p style={{ color:'var(--text3)', fontSize:15 }}>{sub}</p>}
    </div>
  );
}

function Card({ children, style={} }) {
  return <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:'28px 28px', ...style }}>{children}</div>;
}

function FieldRow({ children }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 20px' }}>{children}</div>;
}

function InfoBox({ icon='💡', color='var(--info)', bg='var(--info-bg)', border='var(--info-border)', children }) {
  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:12, padding:'14px 18px', marginTop:16 }}>
      <p style={{ fontSize:13, color, lineHeight:1.65 }}><strong>{icon}</strong> {children}</p>
    </div>
  );
}

// ─── Curriculum builder ───────────────────────
// onChange receives an updater function, so a video that finishes uploading
// doesn't overwrite edits made while it was uploading.
function CurriculumBuilder({ value, onChange, withVideos, errors=[] }) {
  const mapSection = (sid, fn) => onChange(cur => cur.map(s => s.id===sid ? fn(s) : s));
  const mapLecture = (sid, lid, fn) => mapSection(sid, s => ({ ...s, lectures:s.lectures.map(l => l.id===lid ? fn(l) : l) }));

  const addSection    = ()        => onChange(cur => [...cur, { id:Date.now(), title:'', lectures:[] }]);
  const removeSection = sid       => onChange(cur => cur.filter(s => s.id!==sid));
  const addLecture    = sid       => mapSection(sid, s => ({ ...s, lectures:[...s.lectures, { id:Date.now(), title:'', caption:'' }] }));
  const removeLecture = (sid,lid) => mapSection(sid, s => ({ ...s, lectures:s.lectures.filter(l => l.id!==lid) }));

  async function pickVideo(sid, lid, e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!VIDEO_ACCEPT.split(',').includes(`.${ext}`)) { toast.error('Upload an MP4, WebM or MOV video.'); return; }
    if (file.size > VIDEO_MAX_MB*1024*1024) { toast.error(`Videos must be under ${VIDEO_MAX_MB} MB (this one is ${fmtMB(file.size)}).`); return; }
    mapLecture(sid, lid, l => ({ ...l, uploading:0 }));
    try {
      const path = await uploadLectureVideo(file, pct => mapLecture(sid, lid, l => ({ ...l, uploading:pct })));
      mapLecture(sid, lid, l => ({ ...l, uploading:undefined, videoPath:path, videoName:file.name, videoSize:file.size }));
    } catch (err) {
      mapLecture(sid, lid, l => ({ ...l, uploading:undefined }));
      toast.error(`${file.name}: ${err.message}`);
    }
  }

  const inputStyle = { width:'100%', background:'var(--bg)', border:'1.5px solid var(--border2)', borderRadius:8, padding:'8px 12px', fontSize:14, color:'var(--text)', outline:'none' };

  return (
    <div>
      {errors.length>0 && (
        <div role="alert" style={{ background:'var(--danger-bg)', border:'1px solid var(--danger-border)', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
          <p style={{ fontSize:14, fontWeight:600, color:'var(--danger)', marginBottom:4 }}>Please fix the following:</p>
          <ul style={{ margin:0, paddingLeft:18, fontSize:13, color:'var(--danger)', lineHeight:1.7 }}>
            {errors.map(e => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}

      {value.map((section,si) => (
        <div key={section.id} style={{ border:'1px solid var(--border)', borderRadius:12, marginBottom:14, overflow:'hidden' }}>
          <div style={{ background:'var(--bg3)', padding:'14px 18px', display:'flex', gap:12, alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.7px', flexShrink:0 }}>{withVideos?'Section':'Chapter'} {si+1}</span>
            <input value={section.title} onChange={e=>{ const v=e.target.value; mapSection(section.id, s=>({ ...s, title:v })); }}
              placeholder={withVideos?'Section title (e.g. Introduction, Getting Started…)':'Chapter title'} aria-label={`Section ${si+1} title`}
              style={{ ...inputStyle, flex:1, background:'var(--bg2)', borderColor:section.title.trim()?'var(--border2)':'var(--border2)' }} />
            <button type="button" onClick={()=>removeSection(section.id)}
              style={{ background:'var(--danger-bg)', border:'none', borderRadius:7, padding:'6px 10px', cursor:'pointer', color:'var(--danger)', fontSize:13, flexShrink:0 }}>
              Remove
            </button>
          </div>

          <div style={{ padding:'12px 18px 14px' }}>
            {section.lectures.map((lec,li) => {
              const uploading = lec.uploading !== undefined;
              return (
                <div key={lec.id} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:12, paddingLeft:12, borderLeft:'2px solid var(--accent-border)' }}>
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6, minWidth:0 }}>
                    <input value={lec.title} onChange={e=>{ const v=e.target.value; mapLecture(section.id, lec.id, l=>({ ...l, title:v })); }}
                      placeholder={withVideos?`Lecture ${li+1} title`:`Part ${li+1} title`} aria-label={`Lecture ${li+1} title`} style={inputStyle} />
                    <input value={lec.caption} onChange={e=>{ const v=e.target.value; mapLecture(section.id, lec.id, l=>({ ...l, caption:v })); }}
                      placeholder="Short description (optional)" aria-label={`Lecture ${li+1} description`} style={{ ...inputStyle, fontSize:13, color:'var(--text2)' }} />
                    {withVideos && (
                      uploading ? (
                        <div>
                          <p style={{ fontSize:13, color:'var(--text2)', marginBottom:4 }}>Uploading video… {lec.uploading}%</p>
                          <div style={{ background:'var(--bg3)', borderRadius:99, height:6, overflow:'hidden' }}>
                            <div style={{ width:`${lec.uploading}%`, height:6, background:'var(--accent)', transition:'width .2s' }} />
                          </div>
                        </div>
                      ) : (
                        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer', padding:'8px 12px', borderRadius:8,
                          border:`1.5px dashed ${lec.videoPath?'var(--success-border)':'var(--border2)'}`, background:lec.videoPath?'var(--success-bg)':'transparent', color:lec.videoPath?'var(--success)':'var(--text2)' }}>
                          <Icon name={lec.videoPath?'check':'play'} size={15} />
                          <span style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {lec.videoPath ? `${lec.videoName ?? 'Video uploaded'}${lec.videoSize?` · ${fmtMB(lec.videoSize)}`:''} — click to replace` : `Upload lecture video * (MP4, WebM or MOV · max ${VIDEO_MAX_MB} MB)`}
                          </span>
                          <input type="file" accept={VIDEO_ACCEPT} onChange={e=>pickVideo(section.id, lec.id, e)} style={{ display:'none' }} />
                        </label>
                      )
                    )}
                  </div>
                  <button type="button" onClick={()=>removeLecture(section.id,lec.id)} aria-label="Remove lecture" disabled={uploading}
                    style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:4, marginTop:4 }}>
                    <Icon name="close" size={18} />
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={()=>addLecture(section.id)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', background:'transparent', border:'1.5px dashed var(--border2)', borderRadius:8, cursor:'pointer', fontSize:13, color:'var(--text2)', marginTop:section.lectures.length?6:0 }}>
              <Icon name="plus" size={15} /> {withVideos?'Add lecture':'Add part'}
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={addSection}
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px 20px', background:'var(--accent-bg)', border:'1.5px dashed var(--accent-border)', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:600, color:'var(--accent-text)', width:'100%' }}>
        <Icon name="plus" size={16} /> {withVideos?'Add section':'Add chapter'}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────
export default function CreateCoursePage() {
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();
  const imgRef  = useRef();
  const videoRef= useRef();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [imgFile,  setImgFile]  = useState(null);
  const [imgPrev,  setImgPrev]  = useState('');
  const [ebookFile, setEbookFile] = useState(null);
  const [uploadPct, setUploadPct] = useState(null);
  const [errors, setErrors]     = useState({});
  const [badSteps, setBadSteps] = useState([]);   // steps with missing fields after a submit attempt

  const [form, setForm] = useState({
    type:            'course',
    // Curriculum
    curriculum:      [],
    // Landing
    title:           '',
    slug:            '',
    description:     '',
    longDescription: '',
    author:          user?.name??'',
    language:        'English',
    level:           'All Levels',
    duration:        '',
    category:        'Development',
    promoVideoUrl:   '',
    emoji:           '',
    color:           '#1565C0',
    // Pricing
    currency:        'USD',
    price:           '',
    originalPrice:   '',
    // Messages
    welcomeMessage:  '',
    congratsMessage: '',
    // eBook extras
    pages:           '',
    format:          'PDF + ePub',
    tags:            '',
  });

  const sf = useCallback((k,v) => {
    setForm(f => {
      const next = { ...f, [k]:v };
      if (k==='title') next.slug = v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
      return next;
    });
    setErrors(e=>({...e,[k]:''}));
  }, []);

  const F = (k) => ({ value:form[k], onChange:(v)=>sf(k,v) });

  // Required everywhere: everything a buyer sees. Optional: compare-at price,
  // promo video URL and lecture descriptions.
  function checkStep(s) {
    const e={};
    const isCourse = form.type==='course';
    const blank = v => !String(v ?? '').trim();
    if (s===1) {
      const list=[];
      if (form.type==='ebook'&&!ebookFile) e.ebookFile = 'Upload the eBook file buyers will download.';
      if (form.curriculum.length===0) list.push(isCourse?'Add at least one section.':'Add at least one chapter.');
      form.curriculum.forEach((sec,si) => {
        const name = sec.title.trim() ? `"${sec.title.trim()}"` : `${isCourse?'Section':'Chapter'} ${si+1}`;
        if (!sec.title.trim()) list.push(`${name} needs a title.`);
        if (isCourse&&sec.lectures.length===0) list.push(`${name} needs at least one lecture.`);
        sec.lectures.forEach((l,li) => {
          if (!l.title.trim()) list.push(`${name}: lecture ${li+1} needs a title.`);
          if (isCourse&&l.uploading!==undefined) list.push(`${name}: wait for "${l.title||`lecture ${li+1}`}" to finish uploading.`);
          else if (isCourse&&!l.videoPath) list.push(`${name}: upload a video for "${l.title||`lecture ${li+1}`}".`);
        });
      });
      if (list.length) e.curriculum = list;
    }
    if (s===2) {
      if (blank(form.title))           e.title           = 'Title is required.';
      if (blank(form.slug))            e.slug            = 'URL slug is required.';
      if (blank(form.description))     e.description     = 'Short description is required.';
      if (blank(form.longDescription)) e.longDescription = 'Full description is required.';
      if (blank(form.author))          e.author          = 'Author / instructor name is required.';
      if (blank(form.tags))            e.tags            = 'Add at least one tag.';
      if (!imgFile)                    e.image           = 'Upload a cover image.';
      if (isCourse&&blank(form.duration)) e.duration     = 'Total duration is required.';
      if (!isCourse&&(!form.pages||isNaN(form.pages)||Number(form.pages)<1)) e.pages = 'Enter the number of pages.';
      if (form.promoVideoUrl.trim()&&!/^https?:\/\/\S+$/i.test(form.promoVideoUrl.trim())) e.promoVideoUrl = 'Enter a full link starting with https://';
    }
    if (s===3) {
      if (blank(form.price)||isNaN(form.price)||Number(form.price)<0) e.price = 'Enter a valid price (0 for free).';
      if (form.originalPrice&&(isNaN(form.originalPrice)||Number(form.originalPrice)<=Number(form.price))) e.originalPrice = 'Must be higher than the price, or leave it blank.';
    }
    if (s===4) {
      if (blank(form.welcomeMessage))  e.welcomeMessage  = 'Write a welcome message.';
      if (blank(form.congratsMessage)) e.congratsMessage = 'Write a congratulations message.';
    }
    return e;
  }

  function validate(s) {
    const e = checkStep(s);
    setErrors(e);
    setBadSteps(b => Object.keys(e).length ? [...new Set([...b, s])] : b.filter(x => x!==s));
    return Object.keys(e).length===0;
  }

  // Every step must pass before submitting; jump to the first incomplete one.
  function validateAll() {
    const bad = [1,2,3,4].filter(s => Object.keys(checkStep(s)).length);
    setBadSteps(bad);
    if (!bad.length) return true;
    setStep(bad[0]);
    setErrors(checkStep(bad[0]));
    toast.error('Some required fields are missing — they are highlighted.');
    return false;
  }

  function next()  { if (validate(step)) setStep(s=>Math.min(s+1, STEPS.length-1)); }
  function goTo(i) { setStep(i); setErrors(badSteps.includes(i) ? checkStep(i) : {}); }
  function prev()  { setStep(s=>Math.max(s-1,0)); }

  function handleImg(e) {
    const f=e.target.files[0]; if(!f) return;
    if(f.size>5*1024*1024){toast.error('Image must be under 5MB.');return;}
    setImgFile(f); setImgPrev(URL.createObjectURL(f)); setErrors(er=>({...er,image:''}));
  }

  async function handleSubmit() {
    if (!validateAll()) return;
    setSaving(true);
    try {
      // The cover image is required, so a failed upload stops the submit
      const imageUrl = await uploadProductImage(imgFile);

      // Unlike the image, the ebook file is essential — stop if it fails
      let ebookFileUrl = null;
      if (form.type==='ebook') {
        setUploadPct(0);
        ebookFileUrl = await uploadEbookFile(ebookFile, setUploadPct);
      }

      const payload = {
        type:            form.type,
        title:           form.title.trim(),
        slug:            form.slug,
        description:     form.description.trim(),
        longDescription: form.longDescription.trim(),
        author:          form.author.trim(),
        price:           Number(form.price)||0,
        originalPrice:   form.originalPrice ? Number(form.originalPrice) : null,
        category:        form.category,
        language:        form.language,
        level:           form.type==='course' ? form.level : undefined,
        duration:        form.type==='course' ? form.duration.trim() : undefined,
        lessons:         form.type==='course' ? form.curriculum.reduce((n,s)=>n+s.lectures.length,0) : undefined,
        image:           imageUrl,
        color:           form.color,
        emoji:           form.emoji||(form.type==='ebook'?'📖':'💻'),
        tags:            form.tags.split(',').map(t=>t.trim()).filter(Boolean),
        // Drop transient upload state before saving
        curriculum:      form.curriculum.map(s=>({ ...s, title:s.title.trim(), lectures:s.lectures.map(({ uploading, ...l })=>({ ...l, title:l.title.trim(), caption:(l.caption??'').trim() })) })),
        promoVideoUrl:   form.promoVideoUrl.trim(),
        welcomeMessage:  form.welcomeMessage.trim(),
        congratsMessage: form.congratsMessage.trim(),
        pages:           form.type==='ebook' ? form.pages : undefined,
        format:          form.type==='ebook' ? form.format : undefined,
        ebookFileUrl,
        ebookFileSize:   ebookFile?.size ?? null,
        // Admins publish directly; everyone else submits a draft for review
        isPublished:     isAdmin,
        lastUpdated:     new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'}),
      };

      const saved = await createProduct(payload);
      if (isAdmin) {
        toast.success('🎉 Published! It is now live on the site.');
        nav(`/product/${saved.slug}`);
      } else {
        toast.success('🎉 Submitted! Our team will review and publish it shortly.');
        nav('/my-courses');
      }
    } catch (err) {
      toast.error(err.message);
    } finally { setSaving(false); setUploadPct(null); }
  }

  const currStep = STEPS[step];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <SEO title="Create Course or eBook" noIndex />

      {/* ── Top bar ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100, boxShadow:'var(--shadow-sm)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px', height:60, display:'flex', alignItems:'center', gap:20 }}>
          <Link to="/">
            <img src="/logo.png" alt="EduVault" style={{ height:34, objectFit:'contain' }} onError={e=>{e.target.src='/logo-white.png';}} />
          </Link>
          <div style={{ width:1, height:28, background:'var(--border)' }} />
          <span style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>Course Creator</span>
          <div style={{ flex:1 }} />
          <Link to="/"><Button variant="ghost" size="sm">← Exit</Button></Link>
          {step < STEPS.length-1
            ? <Button variant="primary" size="sm" onClick={next}>Save & Continue →</Button>
            : <Button variant="primary" size="sm" onClick={handleSubmit} loading={saving}>Submit for Review 🚀</Button>
          }
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px', display:'flex', gap:28, alignItems:'flex-start' }}>
        {/* ── Sidebar stepper ── */}
        <aside style={{ width:220, flexShrink:0, position:'sticky', top:76 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
            {STEPS.map((s,i) => {
              const done = i < step;
              const active = i === step;
              return (
                <button key={s.id} onClick={()=>goTo(i)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 18px', border:'none', borderBottom:'1px solid var(--border)', background: active?'var(--accent-bg)':'transparent', cursor:'pointer', textAlign:'left', transition:'background .15s' }}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.background='var(--bg3)';}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent';}}>
                  <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, transition:'all .25s', background:done?'var(--success)':active?'var(--accent)':'var(--bg3)', color:done||active?'#fff':'var(--text3)' }}>
                    {badSteps.includes(i)?'!':done?'✓':i+1}
                  </div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:active?600:400, color:active?'var(--accent-text)':done?'var(--text)':'var(--text3)' }}>{s.label}</p>
                    {badSteps.includes(i)&&<p style={{ fontSize:11, color:'var(--danger)', fontWeight:600 }}>Missing fields</p>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Summary card */}
          {form.title&&(
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:16, marginTop:16 }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.7px', color:'var(--text3)', marginBottom:10 }}>Your Course</p>
              <div style={{ width:'100%', height:64, borderRadius:9, overflow:'hidden', background:`${form.color}22`, marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
                {imgPrev ? <img src={imgPrev} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (form.emoji||'📚')}
              </div>
              <p style={{ fontSize:13, fontWeight:600, lineHeight:1.4, marginBottom:4 }}>{form.title}</p>
              {form.price&&<p style={{ fontSize:15, fontWeight:700, color:'var(--accent-text)' }}>${form.price}</p>}
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex:1, minWidth:0 }}>
          <div className="fade-up" key={step}>

            {/* STEP 0 — Type */}
            {step===0&&(
              <Card>
                <SectionTitle sub="Choose the type of content you want to create and sell.">What are you creating?</SectionTitle>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  {[
                    { value:'course', icon:'🎥', label:'Video Course', desc:'Structured video lessons, sections, quizzes. Best for teaching skills step-by-step.' },
                    { value:'ebook',  icon:'📖', label:'eBook / Guide', desc:'PDF, ePub, or Kindle download. Best for guides, tutorials, reference material.' },
                  ].map(opt=>(
                    <button key={opt.value} onClick={()=>sf('type',opt.value)}
                      style={{ padding:'24px 20px', borderRadius:14, border:`2px solid ${form.type===opt.value?'var(--accent)':'var(--border)'}`, background:form.type===opt.value?'var(--accent-bg)':'var(--bg)', cursor:'pointer', textAlign:'left', transition:'all .22s' }}
                      onMouseEnter={e=>{if(form.type!==opt.value){e.currentTarget.style.borderColor='var(--accent-border)';}}}
                      onMouseLeave={e=>{if(form.type!==opt.value){e.currentTarget.style.borderColor='var(--border)';}}}
                    >
                      <div style={{ fontSize:36, marginBottom:12 }}>{opt.icon}</div>
                      <p style={{ fontSize:16, fontWeight:700, color:form.type===opt.value?'var(--accent-text)':'var(--text)', marginBottom:8 }}>{opt.label}</p>
                      <p style={{ fontSize:13, color:'var(--text3)', lineHeight:1.6 }}>{opt.desc}</p>
                      {form.type===opt.value&&<div style={{ marginTop:12, fontSize:12, color:'var(--accent-text)', fontWeight:600 }}>✓ Selected</div>}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* STEP 1 — Curriculum */}
            {step===1&&(
              <Card>
                <SectionTitle sub={form.type==='ebook'?'Outline the chapters and sections of your ebook.':'Plan your course structure with sections and lectures.'}>
                  {form.type==='ebook'?'eBook Structure':'Course Curriculum'}
                </SectionTitle>
                {form.type==='ebook'&&(
                  <EbookFileInput file={ebookFile} error={errors.ebookFile} progress={uploadPct}
                    onChange={f=>{ setEbookFile(f); setErrors(e=>({...e,ebookFile:''})); }} />
                )}
                <CurriculumBuilder value={form.curriculum} withVideos={form.type==='course'} errors={errors.curriculum}
                  onChange={upd=>setForm(f=>({ ...f, curriculum:typeof upd==='function'?upd(f.curriculum):upd }))} />
                {form.curriculum.length===0&&(
                  <InfoBox>{form.type==='course'
                    ? 'Add a section (e.g. "Introduction"), then lectures inside it. Every lecture needs a title and a video.'
                    : 'Add the chapters of your eBook. Buyers see this list on the product page.'}</InfoBox>
                )}
              </Card>
            )}

            {/* STEP 2 — Landing page */}
            {step===2&&(
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                {/* Title & description */}
                <Card>
                  <SectionTitle sub="This is what learners see first — make it compelling.">Course Landing Page</SectionTitle>
                  <Input label="Course Title *" {...F('title')} placeholder="e.g. The Complete React Developer Bootcamp 2024" error={errors.title} required />
                  <div style={{ marginBottom:18 }}>
                    <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text2)', marginBottom:6 }}>URL Slug</label>
                    <div style={{ display:'flex', alignItems:'center', background:'var(--bg)', border:'1.5px solid var(--border2)', borderRadius:9, overflow:'hidden' }}>
                      <span style={{ padding:'11px 12px', fontSize:12, color:'var(--text3)', background:'var(--bg3)', borderRight:'1px solid var(--border2)', whiteSpace:'nowrap' }}>{window.location.host}/product/</span>
                      <input value={form.slug} onChange={e=>sf('slug',e.target.value)}
                        style={{ flex:1, padding:'11px 14px', border:'none', background:'transparent', fontSize:14, color:'var(--text)', outline:'none' }} />
                    </div>
                  </div>
                  <Textarea label="Short Description *" {...F('description')} placeholder="1-2 sentence hook shown on cards and search results." rows={3} error={errors.description} required />
                  {errors.slug&&<p style={{ fontSize:12, color:'var(--danger)', marginTop:-12, marginBottom:14 }}>{errors.slug}</p>}
                  <Textarea label="Full Description *" error={errors.longDescription} required {...F('longDescription')} placeholder="Describe what students will learn, who it's for, prerequisites, and what makes your course unique." rows={6} />
                </Card>

                {/* Basic info */}
                <Card>
                  <h3 style={{ fontSize:18, marginBottom:20 }}>Basic Info</h3>
                  <FieldRow>
                    <Select label="Language" value={form.language} onChange={v=>sf('language',v)} options={LANGUAGES} />
                    <Select label="Category" value={form.category} onChange={v=>sf('category',v)} options={CATEGORIES} />
                    {form.type==='course'&&<Select label="Level" value={form.level} onChange={v=>sf('level',v)} options={LEVELS} />}
                    {form.type==='course'&&<Input label="Total Duration *" {...F('duration')} placeholder="e.g. 4.5 hours" error={errors.duration} required />}
                    {form.type==='ebook'&&<Input label="Number of Pages *" {...F('pages')} placeholder="e.g. 220" error={errors.pages} required />}
                    {form.type==='ebook'&&<Select label="File Format" value={form.format} onChange={v=>sf('format',v)} options={['PDF','ePub','PDF + ePub','PDF + ePub + Kindle']} />}
                  </FieldRow>
                  <Input label="Author / Instructor *" {...F('author')} placeholder="Your name or brand" icon="👤" error={errors.author} required />
                  <Input label="Tags (comma-separated) *" error={errors.tags} required {...F('tags')} placeholder="e.g. React, JavaScript, Frontend, Hooks" hint="Helps learners discover your course through search." />
                </Card>

                {/* Image & video */}
                <Card>
                  <h3 style={{ fontSize:18, marginBottom:20 }}>Media</h3>

                  {/* Thumbnail */}
                  <p style={{ fontSize:13, fontWeight:500, color:'var(--text2)', marginBottom:10 }}>Cover Image <span style={{ color:'var(--danger)' }}>*</span></p>
                  {errors.image&&<p style={{ fontSize:12, color:'var(--danger)', marginTop:-6, marginBottom:8 }}>{errors.image}</p>}
                  <div onClick={()=>imgRef.current?.click()}
                    style={{ border:`2px dashed ${imgPrev?'var(--accent)':'var(--border2)'}`, borderRadius:14, minHeight:160, cursor:'pointer', background:imgPrev?'var(--accent-bg)':'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10, transition:'all .2s', marginBottom:20, overflow:'hidden', position:'relative' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.background='var(--accent-bg)';}}
                    onMouseLeave={e=>{if(!imgPrev){e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.background='var(--bg)';}}}
                  >
                    {imgPrev?(
                      <img src={imgPrev} style={{ width:'100%', maxHeight:220, objectFit:'cover' }} />
                    ):(
                      <>
                        <div style={{ width:52, height:52, borderRadius:12, background:'var(--accent-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🖼️</div>
                        <p style={{ fontSize:14, fontWeight:500, color:'var(--text)' }}>Click to upload thumbnail</p>
                        <p style={{ fontSize:12, color:'var(--text3)' }}>PNG or JPG · Max 5MB · Recommended 1280×720</p>
                      </>
                    )}
                    <input ref={imgRef} type="file" accept="image/*" onChange={handleImg} style={{ display:'none' }} />
                  </div>
                  {imgPrev&&<button onClick={()=>{setImgFile(null);setImgPrev('');}} style={{ fontSize:13, color:'var(--danger)', background:'none', border:'none', cursor:'pointer', marginBottom:20 }}>✕ Remove image</button>}

                  {/* Promo video */}
                  <Input label="Promotional Video URL (optional)" error={errors.promoVideoUrl} {...F('promoVideoUrl')} placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..." icon="▶" hint="A short preview video shown on the landing page to boost conversions." />

                  {/* Color */}
                  <p style={{ fontSize:13, fontWeight:500, color:'var(--text2)', marginBottom:10 }}>Card Accent Color</p>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:8 }}>
                    {['#1565C0','#7B1FA2','#00695C','#E65100','#AD1457','#558B2F','#0277BD','#4527A0','#B71C1C','#E65100'].map(c=>(
                      <button key={c} onClick={()=>sf('color',c)}
                        style={{ width:32, height:32, borderRadius:8, background:c, border:`3px solid ${form.color===c?'var(--text)':'transparent'}`, cursor:'pointer', transition:'transform .15s', transform:form.color===c?'scale(1.2)':'scale(1)' }} />
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* STEP 3 — Pricing */}
            {step===3&&(
              <Card>
                <SectionTitle sub="Set your price. You can change this anytime after publishing.">Pricing</SectionTitle>
                <FieldRow>
                  <Input label="Price *" {...F('price')} placeholder="e.g. 79" icon={CURRENCIES.find(c=>c.code===form.currency)?.symbol??'$'} error={errors.price} required hint="In US dollars. Enter 0 for a free product." />
                  <Input label="Compare-at Price (optional)" error={errors.originalPrice} {...F('originalPrice')} placeholder="e.g. 149" icon={CURRENCIES.find(c=>c.code===form.currency)?.symbol??'$'} hint="Shows strikethrough to highlight a discount. Leave blank for no discount." />
                </FieldRow>

                {/* Preview */}
                {form.price&&(
                  <div style={{ background:'var(--bg3)', borderRadius:12, padding:'18px 20px', display:'flex', alignItems:'center', gap:16, marginTop:8 }}>
                    <div style={{ width:52, height:52, borderRadius:10, overflow:'hidden', background:`${form.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                      {imgPrev?<img src={imgPrev} style={{ width:'100%', height:'100%', objectFit:'cover' }} />:(form.emoji||'📚')}
                    </div>
                    <div>
                      <p style={{ fontSize:14, fontWeight:600 }}>{form.title||'Your course title'}</p>
                      <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:4 }}>
                        <span style={{ fontSize:22, fontWeight:700, color:'var(--accent-text)' }}>{CURRENCIES.find(c=>c.code===form.currency)?.symbol}{form.price}</span>
                        {form.originalPrice&&<span style={{ fontSize:14, color:'var(--text3)', textDecoration:'line-through' }}>{CURRENCIES.find(c=>c.code===form.currency)?.symbol}{form.originalPrice}</span>}
                        {form.originalPrice&&<span style={{ fontSize:12, background:'var(--success-bg)', color:'var(--success)', borderRadius:99, padding:'2px 9px', fontWeight:700 }}>
                          -{Math.round((1-form.price/form.originalPrice)*100)}% off
                        </span>}
                      </div>
                    </div>
                  </div>
                )}

                <InfoBox>Tip: a compare-at price shows buyers the discount they're getting. Leave it blank if the product isn't on sale.</InfoBox>
              </Card>
            )}

            {/* STEP 4 — Messages */}
            {step===4&&(
              <Card>
                <SectionTitle sub="These messages are shown to students at key moments in their learning journey.">Course Messages</SectionTitle>
                <div style={{ marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:'var(--success-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👋</div>
                    <div>
                      <p style={{ fontSize:15, fontWeight:600 }}>Welcome Message <span style={{ color:'var(--danger)' }}>*</span></p>
                      <p style={{ fontSize:13, color:'var(--text2)' }}>Shown to buyers when they open the {form.type==='ebook'?'eBook page':'course'} for the first time</p>
                    </div>
                  </div>
                  <Textarea error={errors.welcomeMessage} {...F('welcomeMessage')} placeholder="Welcome to the course! I'm so excited to have you here. In this course you'll learn..." rows={5} />
                </div>

                <div style={{ borderTop:'1px solid var(--border)', paddingTop:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:'var(--gold-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏆</div>
                    <div>
                      <p style={{ fontSize:15, fontWeight:600 }}>Congratulations Message <span style={{ color:'var(--danger)' }}>*</span></p>
                      <p style={{ fontSize:13, color:'var(--text2)' }}>Shown when a student completes every lesson</p>
                    </div>
                  </div>
                  <Textarea error={errors.congratsMessage} {...F('congratsMessage')} placeholder="Congratulations on completing the course! You've come a long way. Here's what you can do next..." rows={5} />
                </div>

                <InfoBox icon="✨" color="var(--success)" bg="var(--success-bg)" border="var(--success-border)">
                  A personal welcome and a congratulations note make the experience feel human — keep them short and friendly.
                </InfoBox>
              </Card>
            )}

            {/* Bottom nav */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:24 }}>
              <Button variant="secondary" onClick={prev} style={{ visibility:step===0?'hidden':'visible' }}>← Back</Button>
              <div style={{ display:'flex', gap:12 }}>
                {step < STEPS.length-1
                  ? <Button variant="primary" onClick={next}>Save & Continue →</Button>
                  : <Button variant="primary" onClick={handleSubmit} loading={saving}>{uploadPct!==null?`Uploading file… ${uploadPct}%`:isAdmin?'🚀 Publish':'🚀 Submit for Review'}</Button>
                }
              </div>
            </div>
          </div>
        </main>
      </div>

      <style>{`@media(max-width:768px){aside{display:none!important}}`}</style>
    </div>
  );
}
