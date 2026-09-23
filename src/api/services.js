import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, sendPasswordResetEmail, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_CONFIGURED, auth, googleProvider } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { MOCK_PRODUCTS, MOCK_ORDERS, MOCK_COUPONS, MOCK_USERS } from './mockData';

const USER_KEY = 'eduvault_user';
function toAppUser(u, e={}) { return { id:u.uid, name:u.displayName??u.email.split('@')[0], email:u.email, avatar:u.photoURL??null, role:e.role??'student', status:e.status??'active', joined:u.metadata?.creationTime??new Date().toISOString(), enrolledCourses:e.enrolledCourses??[] }; }
function persistUser(u) { try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch {} }
function clearUser() { try { localStorage.removeItem(USER_KEY); } catch {} }
export function getStoredUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
function friendlyErr(code) { return ({'auth/user-not-found':'No account found with this email.','auth/wrong-password':'Incorrect password.','auth/invalid-credential':'Invalid email or password.','auth/email-already-in-use':'An account with this email already exists.','auth/weak-password':'Password must be at least 6 characters.','auth/invalid-email':'Please enter a valid email address.','auth/too-many-requests':'Too many attempts. Try again later.','auth/network-request-failed':'Network error. Check your connection.','auth/popup-blocked':'Popup blocked. Redirecting to Google sign-in...','auth/popup-closed-by-user':'Google sign-in was cancelled before it finished.','auth/cancelled-popup-request':'Google sign-in was cancelled before it finished.','auth/operation-not-allowed':'Google sign-in is not enabled in Firebase Authentication. Enable Google under Sign-in providers.','auth/operation-not-supported-in-this-environment':'This browser blocked the Google pop-up. Redirecting to Google sign-in...','auth/unauthorized-domain':'This domain is not authorized in Firebase. Add your published domain under Firebase Authentication settings.','auth/invalid-api-key':'Firebase is using an invalid API key. Check the VITE_FIREBASE_API_KEY deployment variable.'}[code]??`Sign-in error (${code}).`); }
async function syncUser(u, e={}) { try { await supabase.from('users').upsert({ id:u.uid, email:u.email, name:u.displayName??u.email.split('@')[0], avatar_url:u.photoURL??null, role:e.role??'student', status:'active' },{ onConflict:'id' }); } catch {} }
function requireFirebase() {
  if (!FIREBASE_CONFIGURED || !auth) {
    throw new Error('Authentication is not configured for this deployment yet.');
  }
}

export function onAuthStateChange(callback) {
  if (!FIREBASE_CONFIGURED || !auth) {
    clearUser();
    callback(null);
    return () => {};
  }
  getRedirectResult(auth).then(async r => { if (r?.user) { const u=toAppUser(r.user); await syncUser(r.user); persistUser(u); callback(u); } }).catch(()=>{});
  return onAuthStateChanged(auth, async fbUser => { if (fbUser) { const u=toAppUser(fbUser); persistUser(u); callback(u); } else { clearUser(); callback(null); } });
}
export async function authLogin({ email, password }) {
  requireFirebase();
  try { const { user }=await signInWithEmailAndPassword(auth,email,password); const u=toAppUser(user); await syncUser(user); persistUser(u); return u; }
  catch (err) { throw new Error(friendlyErr(err.code)??err.message); }
}
export async function authSignup({ name, email, password }) {
  requireFirebase();
  try { const { user }=await createUserWithEmailAndPassword(auth,email,password); await updateProfile(user,{ displayName:name }); await user.reload(); const u={ ...toAppUser(user), name }; await syncUser(user,{ role:'student' }); persistUser(u); return u; }
  catch (err) { throw new Error(friendlyErr(err.code)??err.message); }
}
export async function authLoginWithGoogle() {
  requireFirebase();
  try {
    try { const { user }=await signInWithPopup(auth,googleProvider); const u=toAppUser(user); await syncUser(user); persistUser(u); return u; }
    catch (pe) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(pe.code)) {
        await signInWithRedirect(auth,googleProvider);
        return null;
      }
      throw pe;
    }
  } catch (err) { const msg=friendlyErr(err.code); if (!msg) return null; throw new Error(msg); }
}
export async function authLogout() { if (auth) await signOut(auth); clearUser(); }
export async function authForgotPassword({ email }) {
  requireFirebase();
  try { await sendPasswordResetEmail(auth,email,{ url:`${window.location.origin}/login` }); return { message:'Password reset email sent.' }; }
  catch (err) { throw new Error(friendlyErr(err.code)??err.message); }
}

function normalizeProduct(p) {
  return { id:p.id, type:p.type, title:p.title, slug:p.slug, description:p.description??'', longDescription:p.long_description??'', author:p.author, price:Number(p.price??0), originalPrice:Number(p.original_price??p.price??0), category:p.category_name??p.category??'', image:p.image_url??'', color:p.color??'#1565C0', emoji:p.emoji??'📚', rating:Number(p.rating??0), reviewCount:p.review_count??0, students:p.student_count??0, bestseller:p.is_bestseller??false, featured:p.is_featured??false, isPublished:p.is_published??false, tags:p.tags??[], lastUpdated:p.last_updated_label??(p.updated_at?p.updated_at.split('T')[0]:''), level:p.level??'', duration:p.duration_hours?`${p.duration_hours} hours`:'', lessons:p.lesson_count??0, pages:p.page_count??0, format:p.file_format??'', curriculum:p.curriculum??[], welcomeMessage:p.welcome_message??'', congratsMessage:p.congrats_message??'', promoVideoUrl:p.promo_video_url??'', language:p.language??'English', ebookFileUrl:p.ebook_file_url??'', ebookFileSize:p.ebook_file_size??0 };
}
async function denormalizeProduct(p) {
  let category_id=null;
  try { const { data:cat }=await supabase.from('categories').select('id').eq('name',p.category).single(); category_id=cat?.id??null; } catch {}
  return { type:p.type, title:p.title?.trim(), slug:p.slug||p.title?.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''), description:p.description?.trim(), long_description:p.longDescription?.trim(), author:p.author?.trim(), price:Number(p.price)||0, original_price:p.originalPrice?Number(p.originalPrice):null, image_url:p.image||null, color:p.color||'#1565C0', emoji:p.emoji||null, is_bestseller:Boolean(p.bestseller), is_featured:Boolean(p.featured), is_published:Boolean(p.isPublished), tags:Array.isArray(p.tags)?p.tags:(p.tags??'').split(',').map(t=>t.trim()).filter(Boolean), last_updated_label:p.lastUpdated, level:p.level||null, duration_hours:p.duration?parseFloat(p.duration)||null:null, lesson_count:p.lessons?parseInt(p.lessons)||null:null, page_count:p.pages?parseInt(p.pages)||null:null, file_format:p.format||null, curriculum:p.curriculum??[], welcome_message:p.welcomeMessage??null, congrats_message:p.congratsMessage??null, promo_video_url:p.promoVideoUrl??null, language:p.language??'English', ebook_file_url:p.ebookFileUrl??null, ebook_file_size:p.ebookFileSize??null, category_id };
}

export async function getProducts({ type, category, search, page=1, limit=12 }={}) {
  try {
    let q=supabase.from('products_with_category').select('*',{count:'exact'}).eq('is_published',true).order('is_featured',{ascending:false}).order('student_count',{ascending:false});
    if (type&&type!=='all') q=q.eq('type',type);
    if (category&&category!=='All') q=q.eq('category_name',category);
    if (search) q=q.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
    const from=(page-1)*limit;
    const { data, count, error }=await q.range(from,from+limit-1);
    if (error) throw error;
    return { products:(data??[]).map(normalizeProduct), total:count??0, page, totalPages:Math.ceil((count??0)/limit) };
  } catch {
    let r=[...MOCK_PRODUCTS];
    if (type&&type!=='all') r=r.filter(p=>p.type===type);
    if (category&&category!=='All') r=r.filter(p=>p.category===category);
    if (search) { const q=search.toLowerCase(); r=r.filter(p=>p.title.toLowerCase().includes(q)||p.author.toLowerCase().includes(q)); }
    return { products:r.slice((page-1)*limit,page*limit), total:r.length, page, totalPages:Math.ceil(r.length/limit) };
  }
}
export async function getProductBySlug(slug) {
  try { const { data, error }=await supabase.from('products_with_category').select('*').eq('slug',slug).eq('is_published',true).single(); if (error||!data) throw new Error('Not found'); return normalizeProduct(data); }
  catch { const p=MOCK_PRODUCTS.find(p=>p.slug===slug); if (!p) throw new Error('Product not found.'); return p; }
}
export async function getFeatured() {
  try { const { data, error }=await supabase.from('products_with_category').select('*').eq('is_published',true).eq('is_featured',true).order('student_count',{ascending:false}).limit(8); if (error) throw error; return (data??[]).map(normalizeProduct); }
  catch { return MOCK_PRODUCTS.filter(p=>p.featured); }
}
export async function createProduct(data) {
  const row=await denormalizeProduct(data);
  const { data:d, error }=await supabase.from('products').insert(row).select().single();
  if (error) throw new Error(error.message);
  return normalizeProduct(d);
}
export async function updateProduct(id, data) {
  const row=await denormalizeProduct(data);
  const { data:d, error }=await supabase.from('products').update(row).eq('id',id).select().single();
  if (error) throw new Error(error.message);
  return normalizeProduct(d);
}
export async function deleteProduct(id) {
  const { error }=await supabase.from('products').delete().eq('id',id);
  if (error) throw new Error(error.message); return { success:true };
}

function normOrder(o) { return { id:o.order_number??o.id, userId:o.user_id, user:o.user??'—', email:o.email??'—', amount:Number(o.total??o.amount??0), status:o.status, date:(o.created_at??o.date??'').split('T')[0], item:o.order_items?.[0]?.title??o.item??'—', type:o.order_items?.[0]?.type??o.type??'—' }; }
export async function getOrders({ status }={}) {
  try { let q=supabase.from('orders').select('*, order_items(title,type)').order('created_at',{ascending:false}); if (status) q=q.eq('status',status); const { data, error }=await q; if (error) throw error; return { orders:(data??[]).map(normOrder), total:data?.length??0 }; }
  catch { let r=[...MOCK_ORDERS]; if(status) r=r.filter(o=>o.status===status); return { orders:r, total:r.length }; }
}
export async function getOrderStats() {
  try { const { data, error }=await supabase.from('revenue_stats').select('*').single(); if (error) throw error; return { revenue:Number(data.total_revenue), total:Number(data.completed_orders)+Number(data.pending_orders)+Number(data.refunded_orders), completed:Number(data.completed_orders), pending:Number(data.pending_orders), refunded:Number(data.refunded_orders) }; }
  catch { const done=MOCK_ORDERS.filter(o=>o.status==='completed'); return { revenue:done.reduce((a,b)=>a+b.amount,0), total:MOCK_ORDERS.length, completed:done.length, pending:MOCK_ORDERS.filter(o=>o.status==='pending').length, refunded:MOCK_ORDERS.filter(o=>o.status==='refunded').length }; }
}

export async function getUsers() {
  try { const { data, count, error }=await supabase.from('users').select('*',{count:'exact'}).order('created_at',{ascending:false}); if (error) throw error; return { users:data??[], total:count??0 }; }
  catch { return { users:MOCK_USERS.map(({password:_,...u})=>u), total:MOCK_USERS.length }; }
}
export async function createUser(data) {
  const { data:d, error }=await supabase.from('users').insert({ id:data.id??crypto.randomUUID(), email:data.email, name:data.name, role:data.role??'student', status:'active' }).select().single();
  if (error) throw new Error(error.message); return d;
}
export async function updateUserStatus(id, status) { const { error }=await supabase.from('users').update({status}).eq('id',id); if (error) throw new Error(error.message); return { id, status }; }
export async function deleteUser(id) { const { error }=await supabase.from('users').delete().eq('id',id); if (error) throw new Error(error.message); return { success:true }; }

function normCoupon(c) { return { id:c.id, code:c.code, discount:Number(c.discount_value), type:c.discount_type, uses:c.uses, maxUses:c.max_uses??'∞', expires:c.expires_at?c.expires_at.split('T')[0]:'Never', active:c.is_active, createdAt:c.created_at?.split('T')[0] }; }
export async function getCoupons() {
  try { const { data, error }=await supabase.from('coupons').select('*').order('created_at',{ascending:false}); if (error) throw error; return (data??[]).map(normCoupon); }
  catch { return [...MOCK_COUPONS]; }
}
export async function validateCoupon(code) {
  try {
    const { data, error }=await supabase.from('coupons').select('*').eq('code',code.toUpperCase()).eq('is_active',true).single();
    if (error||!data) throw new Error('Invalid or expired coupon code.');
    if (data.expires_at&&new Date(data.expires_at)<new Date()) throw new Error('This coupon has expired.');
    if (data.max_uses&&data.uses>=data.max_uses) throw new Error('This coupon has reached its usage limit.');
    return normCoupon(data);
  } catch (e) { if (e.message) throw e; const c=MOCK_COUPONS.find(c=>c.code===code.toUpperCase()&&c.active); if (!c) throw new Error('Invalid or expired coupon code.'); return c; }
}
export async function createCoupon(data) {
  const { data:d, error }=await supabase.from('coupons').insert({ code:data.code.toUpperCase(), discount_type:data.type, discount_value:Number(data.discount), max_uses:data.maxUses?Number(data.maxUses):null, expires_at:data.expires?new Date(data.expires).toISOString():null, is_active:true }).select().single();
  if (error) throw new Error(error.message); return normCoupon(d);
}
export async function updateCoupon(id, data) {
  const { data:d, error }=await supabase.from('coupons').update({ is_active:data.active??data.is_active }).eq('id',id).select().single();
  if (error) throw new Error(error.message); return normCoupon(d);
}
export async function deleteCoupon(id) { const { error }=await supabase.from('coupons').delete().eq('id',id); if (error) throw new Error(error.message); return { success:true }; }

export async function getUserEnrollments(userId) {
  const { data, error }=await supabase.from('enrollments').select('*, products(id,title,slug,type,image_url,color,author,description)').eq('user_id',userId);
  if (error) throw new Error(error.message); return data??[];
}
export async function enrollUser(userId, productId, orderId) {
  const { error }=await supabase.from('enrollments').upsert({ user_id:userId, product_id:productId, order_id:orderId, progress:0 },{ onConflict:'user_id,product_id' });
  if (error) throw new Error(error.message);
}
export async function updateProgress(userId, productId, progress) {
  const { error }=await supabase.from('enrollments').update({ progress, completed_at:progress===100?new Date().toISOString():null }).eq('user_id',userId).eq('product_id',productId);
  if (error) throw new Error(error.message);
}

export async function uploadProductImage(file) {
  const ext=file.name.split('.').pop().toLowerCase();
  const path=`products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error }=await supabase.storage.from('product-images').upload(path,file,{ upsert:false, contentType:file.type });
  if (error) throw new Error('Image upload failed: '+error.message);
  const { data:{ publicUrl } }=supabase.storage.from('product-images').getPublicUrl(path);
  return publicUrl;
}
export async function uploadLectureVideo(file, onProgress) {
  const ext=file.name.split('.').pop().toLowerCase();
  const path=`lectures/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  if (onProgress) {
    return new Promise((resolve,reject) => {
      const url=`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/course-videos/${path}`;
      const xhr=new XMLHttpRequest(); xhr.open('POST',url);
      xhr.setRequestHeader('Authorization',`Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`);
      xhr.setRequestHeader('Content-Type',file.type); xhr.setRequestHeader('x-upsert','false');
      xhr.upload.onprogress=e=>{ if(e.lengthComputable) onProgress(Math.round((e.loaded/e.total)*100)); };
      xhr.onload=()=>xhr.status===200?resolve(path):reject(new Error('Video upload failed'));
      xhr.onerror=()=>reject(new Error('Network error')); xhr.send(file);
    });
  }
  const { error }=await supabase.storage.from('course-videos').upload(path,file,{ upsert:false, contentType:file.type });
  if (error) throw new Error('Video upload failed: '+error.message); return path;
}
export async function uploadEbookFile(file, onProgress) {
  const ext=file.name.split('.').pop().toLowerCase();
  const path=`ebooks/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  if (onProgress) {
    return new Promise((resolve,reject) => {
      const url=`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/ebook-files/${path}`;
      const xhr=new XMLHttpRequest(); xhr.open('POST',url);
      xhr.setRequestHeader('Authorization',`Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`);
      xhr.setRequestHeader('Content-Type',file.type); xhr.setRequestHeader('x-upsert','false');
      xhr.upload.onprogress=e=>{ if(e.lengthComputable) onProgress(Math.round((e.loaded/e.total)*100)); };
      xhr.onload=()=>xhr.status===200?resolve(path):reject(new Error('File upload failed'));
      xhr.onerror=()=>reject(new Error('Network error')); xhr.send(file);
    });
  }
  const { error }=await supabase.storage.from('ebook-files').upload(path,file,{ upsert:false, contentType:file.type });
  if (error) throw new Error('eBook upload failed: '+error.message); return path;
}
export async function getSignedUrl(bucket, path, expiresIn=3600) {
  const { data, error }=await supabase.storage.from(bucket).createSignedUrl(path,expiresIn);
  if (error) throw new Error('Could not generate download link: '+error.message); return data.signedUrl;
}
