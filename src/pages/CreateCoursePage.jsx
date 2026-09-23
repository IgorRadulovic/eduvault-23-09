// src/pages/CreateCoursePage.jsx
import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, toast } from '../context';
import { createProduct, uploadProductImage } from '../api/services';
import { Button, Input, Select, Textarea } from '../components/ui';
import SEO from '../components/layout/SEO';

// ─── constants ────────────────────────────────
const STEPS = [
  { id:'type',        icon:'📦', label:'Type'          },
  { id:'curriculum',  icon:'📋', label:'Curriculum'     },
  { id:'landing',     icon:'🖼️',  label:'Landing Page'  },
  { id:'pricing',     icon:'💰', label:'Pricing'        },
  { id:'promotions',  icon:'🎫', label:'Promotions'     },
  { id:'messages',    icon:'💬', label:'Messages'       },
];

const CATEGORIES = ['Development','Design','Business','Data Science','Marketing','Productivity'];
const LEVELS     = ['Beginner','Intermediate','Advanced','All Levels'];
const LANGUAGES  = ['English','Spanish','French','German','Portuguese','Italian','Arabic','Chinese','Japanese','Hindi','Other'];
const CURRENCIES = [
  { code:'USD', symbol:'$', label:'USD — US Dollar' },
  { code:'EUR', symbol:'€', label:'EUR — Euro' },
  { code:'GBP', symbol:'£', label:'GBP — British Pound' },
  { code:'BAM', symbol:'KM', label:'BAM — Bosnia & Herzegovina' },
];

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
function CurriculumBuilder({ value, onChange }) {
  function addSection() {
    onChange([...value, { id:Date.now(), title:'', lectures:[] }]);
  }
  function removeSection(sid) {
    onChange(value.filter(s=>s.id!==sid));
  }
  function updateSection(sid, title) {
    onChange(value.map(s=>s.id===sid?{...s,title}:s));
  }
  function addLecture(sid) {
    onChange(value.map(s=>s.id===sid?{...s,lectures:[...s.lectures,{id:Date.now(),title:'',caption:''}]}:s));
  }
  function removeLecture(sid,lid) {
    onChange(value.map(s=>s.id===sid?{...s,lectures:s.lectures.filter(l=>l.id!==lid)}:s));
  }
  function updateLecture(sid,lid,field,val) {
    onChange(value.map(s=>s.id===sid?{...s,lectures:s.lectures.map(l=>l.id===lid?{...l,[field]:val}:l)}:s));
  }

  return (
    <div>
      {value.map((section,si) => (
        <div key={section.id} style={{ border:'1px solid var(--border)', borderRadius:12, marginBottom:14, overflow:'hidden' }}>
          {/* Section header */}
          <div style={{ background:'var(--bg3)', padding:'14px 18px', display:'flex', gap:12, alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.7px', flexShrink:0 }}>Section {si+1}</span>
            <input value={section.title} onChange={e=>updateSection(section.id,e.target.value)}
              placeholder="Section title (e.g. Introduction, Getting Started…)"
              style={{ flex:1, background:'var(--bg2)', border:'1.5px solid var(--border2)', borderRadius:8, padding:'8px 12px', fontSize:14, color:'var(--text)', outline:'none' }}
              onFocus={e=>e.target.style.borderColor='var(--accent)'}
              onBlur={e=>e.target.style.borderColor='var(--border2)'}
            />
            <button onClick={()=>removeSection(section.id)}
              style={{ background:'var(--danger-bg)', border:'none', borderRadius:7, padding:'6px 10px', cursor:'pointer', color:'var(--danger)', fontSize:13, flexShrink:0 }}>
              Remove
            </button>
          </div>

          {/* Lectures */}
          <div style={{ padding:'12px 18px 14px' }}>
            {section.lectures.map((lec,li) => (
              <div key={lec.id} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10, paddingLeft:12, borderLeft:'2px solid var(--accent-border)' }}>
                <div style={{ flex:1 }}>
                  <input value={lec.title} onChange={e=>updateLecture(section.id,lec.id,'title',e.target.value)}
                    placeholder={`Lecture ${li+1} title`}
                    style={{ width:'100%', background:'var(--bg)', border:'1.5px solid var(--border2)', borderRadius:8, padding:'8px 12px', fontSize:14, color:'var(--text)', outline:'none', marginBottom:6 }}
                    onFocus={e=>e.target.style.borderColor='var(--accent)'}
                    onBlur={e=>e.target.style.borderColor='var(--border2)'}
                  />
                  <input value={lec.caption} onChange={e=>updateLecture(section.id,lec.id,'caption',e.target.value)}
                    placeholder="Caption / subtitle (optional)"
                    style={{ width:'100%', background:'var(--bg)', border:'1.5px solid var(--border2)', borderRadius:8, padding:'7px 12px', fontSize:13, color:'var(--text2)', outline:'none' }}
                    onFocus={e=>e.target.style.borderColor='var(--accent)'}
                    onBlur={e=>e.target.style.borderColor='var(--border2)'}
                  />
                </div>
                <button onClick={()=>removeLecture(section.id,lec.id)}
                  style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:18, padding:'4px', marginTop:4 }}>✕</button>
              </div>
            ))}
            <button onClick={()=>addLecture(section.id)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', background:'transparent', border:'1.5px dashed var(--border2)', borderRadius:8, cursor:'pointer', fontSize:13, color:'var(--text2)', transition:'all .18s', marginTop:section.lectures.length?6:0 }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--text2)';}}>
              + Add Lecture
            </button>
          </div>
        </div>
      ))}

      <button onClick={addSection}
        style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px', background:'var(--accent-bg)', border:'1.5px dashed var(--accent-border)', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:600, color:'var(--accent)', width:'100%', justifyContent:'center', transition:'all .18s' }}
        onMouseEnter={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.color='#fff';e.currentTarget.style.borderStyle='solid';}}
        onMouseLeave={e=>{e.currentTarget.style.background='var(--accent-bg)';e.currentTarget.style.color='var(--accent)';e.currentTarget.style.borderStyle='dashed';}}>
        + Add Section
      </button>
    </div>
  );
}

// ─── Coupon picker ────────────────────────────
function CouponPicker({ value, onChange }) {
  const [code,setCode]=useState('');
  const add=()=>{
    const c=code.toUpperCase().trim();
    if(c&&!value.includes(c)){onChange([...value,c]);setCode('');}
  };
  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:14 }}>
        <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&add()}
          placeholder="Enter coupon code (e.g. LAUNCH50)"
          style={{ flex:1, background:'var(--bg)', border:'1.5px solid var(--border2)', borderRadius:9, padding:'10px 14px', fontSize:14, color:'var(--text)', outline:'none', letterSpacing:'.5px' }}
          onFocus={e=>e.target.style.borderColor='var(--accent)'}
          onBlur={e=>e.target.style.borderColor='var(--border2)'}
        />
        <Button variant="outline" size="md" onClick={add}>Add</Button>
      </div>
      {value.length>0&&(
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {value.map(c=>(
            <div key={c} style={{ display:'flex', alignItems:'center', gap:6, background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:99, padding:'4px 12px 4px 14px', fontSize:13, color:'var(--accent)', fontWeight:600 }}>
              {c}
              <button onClick={()=>onChange(value.filter(x=>x!==c))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent)', fontSize:14, lineHeight:1, padding:0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────
export default function CreateCoursePage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const imgRef  = useRef();
  const videoRef= useRef();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [imgFile,  setImgFile]  = useState(null);
  const [imgPrev,  setImgPrev]  = useState('');
  const [errors, setErrors]     = useState({});

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
    category:        'Development',
    promoVideoUrl:   '',
    emoji:           '',
    color:           '#1565C0',
    // Pricing
    currency:        'USD',
    price:           '',
    originalPrice:   '',
    // Promotions
    coupons:         [],
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

  function validate(s) {
    const e={};
    if (s===2) {
      if (!form.title.trim())       e.title       = 'Course title is required.';
      if (!form.description.trim()) e.description = 'Short description is required.';
      if (!form.author.trim())      e.author      = 'Author / instructor name is required.';
    }
    if (s===3) {
      if (!form.price||isNaN(form.price)||Number(form.price)<0) e.price = 'Enter a valid price.';
    }
    setErrors(e);
    return Object.keys(e).length===0;
  }

  function next()  { if (validate(step)) setStep(s=>Math.min(s+1, STEPS.length-1)); }
  function prev()  { setStep(s=>Math.max(s-1,0)); }

  function handleImg(e) {
    const f=e.target.files[0]; if(!f) return;
    if(f.size>5*1024*1024){toast.error('Image must be under 5MB.');return;}
    setImgFile(f); setImgPrev(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    if (!validate(step)) return;
    setSaving(true);
    try {
      let imageUrl = '';
      if (imgFile) {
        try { imageUrl = await uploadProductImage(imgFile); }
        catch (err) { toast.warning('Image upload failed — submitting without image.'); }
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
        image:           imageUrl,
        color:           form.color,
        emoji:           form.emoji||(form.type==='ebook'?'📖':'💻'),
        tags:            form.tags.split(',').map(t=>t.trim()).filter(Boolean),
        curriculum:      form.curriculum,
        promoVideoUrl:   form.promoVideoUrl.trim(),
        welcomeMessage:  form.welcomeMessage.trim(),
        congratsMessage: form.congratsMessage.trim(),
        pages:           form.type==='ebook' ? form.pages : undefined,
        format:          form.type==='ebook' ? form.format : undefined,
        isPublished:     false,
        lastUpdated:     new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'}),
      };

      await createProduct(payload);
      toast.success('🎉 Submitted! Our team will review and publish it shortly.');
      nav('/my-courses');
    } catch (err) {
      toast.error(err.message);
    } finally { setSaving(false); }
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
                <button key={s.id} onClick={()=>setStep(i)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 18px', border:'none', borderBottom:'1px solid var(--border)', background: active?'var(--accent-bg)':'transparent', cursor:'pointer', textAlign:'left', transition:'background .15s' }}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.background='var(--bg3)';}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.background='transparent';}}>
                  <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, transition:'all .25s', background:done?'var(--success)':active?'var(--accent)':'var(--bg3)', color:done||active?'#fff':'var(--text3)' }}>
                    {done?'✓':i+1}
                  </div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:active?600:400, color:active?'var(--accent)':done?'var(--text)':'var(--text3)' }}>{s.label}</p>
                    <p style={{ fontSize:11, color:'var(--text3)' }}>{s.icon}</p>
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
              {form.price&&<p style={{ fontSize:15, fontWeight:700, color:'var(--accent)' }}>${form.price}</p>}
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
                      <p style={{ fontSize:16, fontWeight:700, color:form.type===opt.value?'var(--accent)':'var(--text)', marginBottom:8 }}>{opt.label}</p>
                      <p style={{ fontSize:13, color:'var(--text3)', lineHeight:1.6 }}>{opt.desc}</p>
                      {form.type===opt.value&&<div style={{ marginTop:12, fontSize:12, color:'var(--accent)', fontWeight:600 }}>✓ Selected</div>}
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
                <CurriculumBuilder value={form.curriculum} onChange={v=>sf('curriculum',v)} />
                {form.curriculum.length===0&&(
                  <InfoBox>Start by adding a section (e.g. "Introduction"), then add lectures inside it. You can always edit this later.</InfoBox>
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
                      <span style={{ padding:'11px 12px', fontSize:12, color:'var(--text3)', background:'var(--bg3)', borderRight:'1px solid var(--border2)', whiteSpace:'nowrap' }}>eduvault.com/product/</span>
                      <input value={form.slug} onChange={e=>sf('slug',e.target.value)}
                        style={{ flex:1, padding:'11px 14px', border:'none', background:'transparent', fontSize:14, color:'var(--text)', outline:'none' }} />
                    </div>
                  </div>
                  <Textarea label="Short Description *" {...F('description')} placeholder="1-2 sentence hook shown on cards and search results." rows={3} error={errors.description} required />
                  <Textarea label="Full Description" {...F('longDescription')} placeholder="Describe what students will learn, who it's for, prerequisites, and what makes your course unique." rows={6} />
                </Card>

                {/* Basic info */}
                <Card>
                  <h3 style={{ fontSize:18, marginBottom:20 }}>Basic Info</h3>
                  <FieldRow>
                    <Select label="Language" value={form.language} onChange={v=>sf('language',v)} options={LANGUAGES} />
                    <Select label="Category" value={form.category} onChange={v=>sf('category',v)} options={CATEGORIES} />
                    {form.type==='course'&&<Select label="Level" value={form.level} onChange={v=>sf('level',v)} options={LEVELS} />}
                    {form.type==='course'&&<Input label="Total Duration" {...F('duration')} placeholder="e.g. 24 hours" />}
                    {form.type==='ebook'&&<Input label="Number of Pages" {...F('pages')} placeholder="e.g. 220" />}
                    {form.type==='ebook'&&<Select label="File Format" value={form.format} onChange={v=>sf('format',v)} options={['PDF','ePub','PDF + ePub','PDF + ePub + Kindle']} />}
                  </FieldRow>
                  <Input label="Author / Instructor *" {...F('author')} placeholder="Your name or brand" icon="👤" error={errors.author} required />
                  <Input label="Tags (comma-separated)" {...F('tags')} placeholder="e.g. React, JavaScript, Frontend, Hooks" hint="Helps learners discover your course through search." />
                </Card>

                {/* Image & video */}
                <Card>
                  <h3 style={{ fontSize:18, marginBottom:20 }}>Media</h3>

                  {/* Thumbnail */}
                  <p style={{ fontSize:13, fontWeight:500, color:'var(--text2)', marginBottom:10 }}>Course Image</p>
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
                  <Input label="Promotional Video URL" {...F('promoVideoUrl')} placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..." icon="▶" hint="A short preview video shown on the landing page to boost conversions." />

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
                  <Select label="Currency" value={form.currency} onChange={v=>sf('currency',v)} options={CURRENCIES.map(c=>({value:c.code,label:c.label}))} />
                  <div />
                  <Input label="Price *" {...F('price')} placeholder="e.g. 79" icon={CURRENCIES.find(c=>c.code===form.currency)?.symbol??'$'} error={errors.price} required hint="The price learners will pay." />
                  <Input label="Compare-at Price" {...F('originalPrice')} placeholder="e.g. 149" icon={CURRENCIES.find(c=>c.code===form.currency)?.symbol??'$'} hint="Shows strikethrough to highlight a discount. Leave blank for no discount." />
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
                        <span style={{ fontSize:22, fontWeight:700, color:'var(--accent)' }}>{CURRENCIES.find(c=>c.code===form.currency)?.symbol}{form.price}</span>
                        {form.originalPrice&&<span style={{ fontSize:14, color:'var(--text3)', textDecoration:'line-through' }}>{CURRENCIES.find(c=>c.code===form.currency)?.symbol}{form.originalPrice}</span>}
                        {form.originalPrice&&<span style={{ fontSize:12, background:'var(--success-bg)', color:'var(--success)', borderRadius:99, padding:'2px 9px', fontWeight:700 }}>
                          -{Math.round((1-form.price/form.originalPrice)*100)}% off
                        </span>}
                      </div>
                    </div>
                  </div>
                )}

                <InfoBox>Courses priced between $49–$99 perform best on EduVault. Adding a compare-at price significantly increases perceived value and conversion rates.</InfoBox>
              </Card>
            )}

            {/* STEP 4 — Promotions */}
            {step===4&&(
              <Card>
                <SectionTitle sub="Attach existing coupon codes to offer discounts on this course.">Promotions & Coupons</SectionTitle>
                <p style={{ fontSize:14, color:'var(--text2)', marginBottom:20, lineHeight:1.65 }}>
                  Enter coupon codes you've created in the <Link to="/admin" style={{ color:'var(--accent)' }}>Admin Dashboard</Link>. Learners can apply these at checkout for a discount on this course specifically.
                </p>
                <CouponPicker value={form.coupons} onChange={v=>sf('coupons',v)} />
                {form.coupons.length===0&&(
                  <InfoBox icon="🎫" color="var(--text3)" bg="var(--bg3)" border="var(--border)">
                    No coupons attached yet. You can add them now or after publishing.
                  </InfoBox>
                )}
              </Card>
            )}

            {/* STEP 5 — Messages */}
            {step===5&&(
              <Card>
                <SectionTitle sub="These messages are shown to students at key moments in their learning journey.">Course Messages</SectionTitle>
                <div style={{ marginBottom:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:'var(--success-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👋</div>
                    <div>
                      <p style={{ fontSize:15, fontWeight:600 }}>Welcome Message</p>
                      <p style={{ fontSize:13, color:'var(--text3)' }}>Sent to students right after they enroll</p>
                    </div>
                  </div>
                  <Textarea {...F('welcomeMessage')} placeholder="Welcome to the course! I'm so excited to have you here. In this course you'll learn..." rows={5} />
                </div>

                <div style={{ borderTop:'1px solid var(--border)', paddingTop:28 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:'var(--gold-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏆</div>
                    <div>
                      <p style={{ fontSize:15, fontWeight:600 }}>Congratulations Message</p>
                      <p style={{ fontSize:13, color:'var(--text3)' }}>Sent when a student completes the course</p>
                    </div>
                  </div>
                  <Textarea {...F('congratsMessage')} placeholder="Congratulations on completing the course! You've come a long way. Here's what you can do next..." rows={5} />
                </div>

                <InfoBox icon="✨" color="var(--success)" bg="var(--success-bg)" border="var(--success-border)">
                  Personalized messages increase student engagement and completion rates by up to 30%. They also improve your course reviews.
                </InfoBox>
              </Card>
            )}

            {/* Bottom nav */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:24 }}>
              <Button variant="secondary" onClick={prev} style={{ visibility:step===0?'hidden':'visible' }}>← Back</Button>
              <div style={{ display:'flex', gap:12 }}>
                {step < STEPS.length-1
                  ? <Button variant="primary" onClick={next}>Save & Continue →</Button>
                  : <Button variant="primary" onClick={handleSubmit} loading={saving}>🚀 Submit for Review</Button>
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
