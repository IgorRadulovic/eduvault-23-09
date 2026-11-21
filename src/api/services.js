import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, sendPasswordResetEmail, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { FIREBASE_CONFIGURED, auth, googleProvider } from '../lib/firebase';
import { SUPABASE_CONFIGURED, supabase, getFirebaseToken } from '../lib/supabase';
import { MOCK_PRODUCTS, MOCK_ORDERS, MOCK_COUPONS, MOCK_USERS } from './mockData';

// Mock data is only for local development without Supabase keys.
// Once Supabase is configured, real errors are logged instead of being hidden behind demo data.
function mockOr(err, mock, empty) {
  if (SUPABASE_CONFIGURED) { console.error('[Supabase]', err?.message ?? err); return empty; }
  return mock();
}

/* ── Auth (Firebase) + profile (Supabase users table) ── */
const USER_KEY = 'eduvault_user';
function toAppUser(u, p={}) { return { id:u.uid, name:u.displayName??p.name??u.email.split('@')[0], email:u.email, avatar:u.photoURL??p.avatar_url??null, role:p.role??'student', status:p.status??'active', joined:p.created_at??u.metadata?.creationTime??new Date().toISOString(), enrolledCourses:[] }; }
function persistUser(u) { try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch {} }
function clearUser() { try { localStorage.removeItem(USER_KEY); } catch {} }
export function getStoredUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
function friendlyErr(code) { return ({'auth/user-not-found':'No account found with this email.','auth/wrong-password':'Incorrect password.','auth/invalid-credential':'Invalid email or password.','auth/email-already-in-use':'An account with this email already exists.','auth/weak-password':'Password must be at least 6 characters.','auth/invalid-email':'Please enter a valid email address.','auth/too-many-requests':'Too many attempts. Try again later.','auth/network-request-failed':'Network error. Check your connection.','auth/popup-blocked':'Popup blocked. Redirecting to Google sign-in...','auth/popup-closed-by-user':'Google sign-in was cancelled before it finished.','auth/cancelled-popup-request':'Google sign-in was cancelled before it finished.','auth/operation-not-allowed':'Google sign-in is not enabled in Firebase Authentication. Enable Google under Sign-in providers.','auth/operation-not-supported-in-this-environment':'This browser blocked the Google pop-up. Redirecting to Google sign-in...','auth/unauthorized-domain':'This domain is not authorized in Firebase. Add your published domain under Firebase Authentication settings.','auth/invalid-api-key':'Firebase is using an invalid API key. Check the VITE_FIREBASE_API_KEY deployment variable.'}[code]??`Sign-in error (${code}).`); }
function authError(err) { return new Error(err?.code ? friendlyErr(err.code) : err?.message ?? 'Sign-in failed.'); }

// Creates/refreshes the Supabase profile and returns it (it holds the role).
async function syncProfile(u, name) {
  if (!SUPABASE_CONFIGURED) return {};
  const { data, error }=await supabase.rpc('sync_profile',{ p_name:name??u.displayName??null, p_avatar_url:u.photoURL??null });
  if (error) { console.error('[Supabase] Profile sync failed:', error.message); return {}; }
  return data??{};
}

// Login calls and onAuthStateChanged both fire on sign-in; share one request per user.
let pendingLoad=null;
function loadUser(fbUser, name) {
  if (!name&&pendingLoad?.uid===fbUser.uid) return pendingLoad.promise;
  const promise=(async () => {
    const profile=await syncProfile(fbUser,name);
    if (profile.status==='suspended') { await signOut(auth); clearUser(); throw new Error('This account has been suspended. Please contact support.'); }
    const u=toAppUser(fbUser,profile); persistUser(u); return u;
  })();
  pendingLoad={ uid:fbUser.uid, promise };
  const done=() => { if (pendingLoad?.promise===promise) pendingLoad=null; };
  promise.then(done,done);
  return promise;
}

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
  // Completes a Google redirect sign-in; onAuthStateChanged below then picks the user up.
  getRedirectResult(auth).catch(err => console.error('[Firebase] Redirect sign-in failed:', err.code??err.message));
  return onAuthStateChanged(auth, async fbUser => {
    if (!fbUser) { clearUser(); callback(null); return; }
    try { callback(await loadUser(fbUser)); } catch { callback(null); }
  });
}
export async function authLogin({ email, password }) {
  requireFirebase();
  try { const { user }=await signInWithEmailAndPassword(auth,email,password); return await loadUser(user); }
  catch (err) { throw authError(err); }
}
export async function authSignup({ name, email, password }) {
  requireFirebase();
  try { const { user }=await createUserWithEmailAndPassword(auth,email,password); await updateProfile(user,{ displayName:name }); return await loadUser(user,name); }
  catch (err) { throw authError(err); }
}
export async function authLoginWithGoogle() {
  requireFirebase();
  try {
    try { const { user }=await signInWithPopup(auth,googleProvider); return await loadUser(user); }
    catch (pe) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(pe.code)) {
        await signInWithRedirect(auth,googleProvider);
        return null;
      }
      throw pe;
    }
  } catch (err) { throw authError(err); }
}
export async function authLogout() { if (auth) await signOut(auth); clearUser(); }
export async function authForgotPassword({ email }) {
  requireFirebase();
  try { await sendPasswordResetEmail(auth,email,{ url:`${window.location.origin}/login` }); return { message:'Password reset email sent.' }; }
  catch (err) { throw authError(err); }
}

/* ── Products ── */
function normalizeProduct(p) {
  return { id:p.id, type:p.type, title:p.title, slug:p.slug, description:p.description??'', longDescription:p.long_description??'', author:p.author, price:Number(p.price??0), originalPrice:Number(p.original_price??p.price??0), category:p.category_name??p.category??'', image:p.image_url??'', color:p.color??'#1565C0', emoji:p.emoji??'📚', rating:Number(p.rating??0), reviewCount:p.review_count??0, students:p.student_count??0, bestseller:p.is_bestseller??false, featured:p.is_featured??false, isPublished:p.is_published??false, createdBy:p.created_by??null, tags:p.tags??[], lastUpdated:p.last_updated_label??(p.updated_at?p.updated_at.split('T')[0]:''), level:p.level??'', duration:p.duration_hours?`${p.duration_hours} hours`:'', lessons:p.lesson_count??0, pages:p.page_count??0, format:p.file_format??'', curriculum:p.curriculum??[], welcomeMessage:p.welcome_message??'', congratsMessage:p.congrats_message??'', promoVideoUrl:p.promo_video_url??'', language:p.language??'English', ebookFileUrl:p.ebook_file_url??'', ebookFileSize:p.ebook_file_size??0 };
}
async function denormalizeProduct(p) {
  let category_id=null;
  try { const { data:cat }=await supabase.from('categories').select('id').eq('name',p.category).single(); category_id=cat?.id??null; } catch {}
  return { type:p.type, title:p.title?.trim(), slug:p.slug||p.title?.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''), description:p.description?.trim(), long_description:p.longDescription?.trim(), author:p.author?.trim(), price:Number(p.price)||0, original_price:p.originalPrice?Number(p.originalPrice):null, image_url:p.image||null, color:p.color||'#1565C0', emoji:p.emoji||null, is_bestseller:Boolean(p.bestseller), is_featured:Boolean(p.featured), is_published:Boolean(p.isPublished), tags:Array.isArray(p.tags)?p.tags:(p.tags??'').split(',').map(t=>t.trim()).filter(Boolean), last_updated_label:p.lastUpdated, level:p.level||null, duration_hours:p.duration?parseFloat(p.duration)||null:null, lesson_count:p.lessons?parseInt(p.lessons)||null:null, page_count:p.pages?parseInt(p.pages)||null:null, file_format:p.format||null, curriculum:p.curriculum??[], welcome_message:p.welcomeMessage||null, congrats_message:p.congratsMessage||null, promo_video_url:p.promoVideoUrl||null, language:p.language??'English', ebook_file_url:p.ebookFileUrl||null, ebook_file_size:p.ebookFileSize||null, category_id };
}

// includeDrafts: admin only — RLS still hides other people's drafts from everyone else.
export async function getProducts({ type, category, search, page=1, limit=12, includeDrafts=false }={}) {
  try {
    let q=supabase.from('products_with_category').select('*',{count:'exact'}).order('is_featured',{ascending:false}).order('student_count',{ascending:false});
    if (!includeDrafts) q=q.eq('is_published',true);
    if (type&&type!=='all') q=q.eq('type',type);
    if (category&&category!=='All') q=q.eq('category_name',category);
    // Strip characters that have meaning in PostgREST filter syntax
    const term=search?.replace(/[,()%*\\]/g,' ').trim();
    if (term) q=q.or(`title.ilike.%${term}%,author.ilike.%${term}%`);
    const from=(page-1)*limit;
    const { data, count, error }=await q.range(from,from+limit-1);
    if (error) throw error;
    return { products:(data??[]).map(normalizeProduct), total:count??0, page, totalPages:Math.ceil((count??0)/limit) };
  } catch (err) {
    return mockOr(err, () => {
      let r=[...MOCK_PRODUCTS];
      if (type&&type!=='all') r=r.filter(p=>p.type===type);
      if (category&&category!=='All') r=r.filter(p=>p.category===category);
      if (search) { const q=search.toLowerCase(); r=r.filter(p=>p.title.toLowerCase().includes(q)||p.author.toLowerCase().includes(q)); }
      return { products:r.slice((page-1)*limit,page*limit), total:r.length, page, totalPages:Math.ceil(r.length/limit) };
    }, { products:[], total:0, page, totalPages:0 });
  }
}
export async function getProductBySlug(slug) {
  try { const { data, error }=await supabase.from('products_with_category').select('*').eq('slug',slug).eq('is_published',true).maybeSingle(); if (error) throw error; if (!data) throw new Error('Product not found.'); return normalizeProduct(data); }
  catch (err) {
    if (SUPABASE_CONFIGURED) throw err;
    const p=MOCK_PRODUCTS.find(p=>p.slug===slug); if (!p) throw new Error('Product not found.'); return p;
  }
}
export async function getFeatured() {
  try { const { data, error }=await supabase.from('products_with_category').select('*').eq('is_published',true).eq('is_featured',true).order('student_count',{ascending:false}).limit(8); if (error) throw error; return (data??[]).map(normalizeProduct); }
  catch (err) { return mockOr(err, () => MOCK_PRODUCTS.filter(p=>p.featured), []); }
}
export async function createProduct(data) {
  const row={ ...(await denormalizeProduct(data)), created_by:auth?.currentUser?.uid??null };
  const { data:d, error }=await supabase.from('products').insert(row).select().single();
  if (error) throw new Error(error.code==='23505'?'A product with this title/slug already exists. Choose a different title.':error.message);
  return normalizeProduct({ ...d, category_name:data.category });
}
export async function updateProduct(id, data) {
  const row=await denormalizeProduct(data);
  const { data:d, error }=await supabase.from('products').update(row).eq('id',id).select().single();
  if (error) throw new Error(error.message);
  return normalizeProduct({ ...d, category_name:data.category });
}
export async function deleteProduct(id) {
  const { error }=await supabase.from('products').delete().eq('id',id);
  if (error) throw new Error(error.code==='23503'?'This product has orders and cannot be deleted. Unpublish it instead.':error.message);
  return { success:true };
}

/* ── Orders ── */
function normOrder(o) { return { id:o.order_number??o.id, userId:o.user_id, user:o.users?.name??o.user??'—', email:o.users?.email??o.email??'—', amount:Number(o.total??o.amount??0), status:o.status, date:(o.created_at??o.date??'').split('T')[0], item:o.order_items?.[0]?.title??o.item??'—', type:o.order_items?.[0]?.type??o.type??'—' }; }
export async function getOrders({ status }={}) {
  try { let q=supabase.from('orders').select('*, order_items(title,type), users(name,email)').order('created_at',{ascending:false}); if (status) q=q.eq('status',status); const { data, error }=await q; if (error) throw error; return { orders:(data??[]).map(normOrder), total:data?.length??0 }; }
  catch (err) { return mockOr(err, () => { let r=[...MOCK_ORDERS]; if(status) r=r.filter(o=>o.status===status); return { orders:r, total:r.length }; }, { orders:[], total:0 }); }
}
export async function getOrderStats() {
  try { const { data, error }=await supabase.from('revenue_stats').select('*').single(); if (error) throw error; return { revenue:Number(data.total_revenue), total:Number(data.completed_orders)+Number(data.pending_orders)+Number(data.refunded_orders), completed:Number(data.completed_orders), pending:Number(data.pending_orders), refunded:Number(data.refunded_orders) }; }
  catch (err) { return mockOr(err, () => { const done=MOCK_ORDERS.filter(o=>o.status==='completed'); return { revenue:done.reduce((a,b)=>a+b.amount,0), total:MOCK_ORDERS.length, completed:done.length, pending:MOCK_ORDERS.filter(o=>o.status==='pending').length, refunded:MOCK_ORDERS.filter(o=>o.status==='refunded').length }; }, { revenue:0, total:0, completed:0, pending:0, refunded:0 }); }
}
// Checkout. Prices, coupon and enrollments are all computed by the place_order() database function.
export async function placeOrder(productIds, couponCode) {
  if (!SUPABASE_CONFIGURED) throw new Error('Checkout is not available until Supabase is connected.');
  const { data, error }=await supabase.rpc('place_order',{ p_product_ids:productIds, p_coupon_code:couponCode??null });
  if (error) throw new Error(error.code==='22P02'?'Your cart contains outdated items. Please clear it and add them again.':error.message);
  return { id:data.id, orderNumber:data.order_number, subtotal:Number(data.subtotal), discount:Number(data.discount), total:Number(data.total) };
}

/* ── Users ── */
function normUser(u) { return { id:u.id, name:u.name, email:u.email, avatar:u.avatar_url??u.avatar??null, role:u.role, status:u.status, joined:(u.created_at??u.joined??'').split('T')[0] }; }
export async function getUsers() {
  try { const { data, count, error }=await supabase.from('users').select('*',{count:'exact'}).order('created_at',{ascending:false}); if (error) throw error; return { users:(data??[]).map(normUser), total:count??0 }; }
  catch (err) { return mockOr(err, () => ({ users:MOCK_USERS.map(({password:_,...u})=>u), total:MOCK_USERS.length }), { users:[], total:0 }); }
}
export async function updateUserRole(id, role) { const { error }=await supabase.from('users').update({role}).eq('id',id); if (error) throw new Error(error.message); return { id, role }; }
export async function updateUserStatus(id, status) { const { error }=await supabase.from('users').update({status}).eq('id',id); if (error) throw new Error(error.message); return { id, status }; }
export async function deleteUser(id) {
  const { error }=await supabase.from('users').delete().eq('id',id);
  if (error) throw new Error(error.code==='23503'?'This user has orders and cannot be deleted. Suspend them instead.':error.message);
  return { success:true };
}

/* ── Coupons ── */
function normCoupon(c) { return { id:c.id, code:c.code, discount:Number(c.discount_value), type:c.discount_type, uses:c.uses, maxUses:c.max_uses??'∞', expires:c.expires_at?c.expires_at.split('T')[0]:'Never', active:c.is_active, createdAt:c.created_at?.split('T')[0] }; }
export async function getCoupons() {
  try { const { data, error }=await supabase.from('coupons').select('*').order('created_at',{ascending:false}); if (error) throw error; return (data??[]).map(normCoupon); }
  catch (err) { return mockOr(err, () => [...MOCK_COUPONS], []); }
}
export async function validateCoupon(code) {
  if (!SUPABASE_CONFIGURED) { const c=MOCK_COUPONS.find(c=>c.code===code.toUpperCase()&&c.active); if (!c) throw new Error('Invalid or expired coupon code.'); return c; }
  const { data, error }=await supabase.rpc('validate_coupon',{ p_code:code });
  if (error) throw new Error(error.message);
  const c=data?.[0]; if (!c) throw new Error('Invalid or expired coupon code.');
  return { code:c.code, discount:Number(c.discount_value), type:c.discount_type, active:true };
}
export async function createCoupon(data) {
  const { data:d, error }=await supabase.from('coupons').insert({ code:data.code.toUpperCase(), discount_type:data.type, discount_value:Number(data.discount), max_uses:data.maxUses?Number(data.maxUses):null, expires_at:data.expires?new Date(data.expires).toISOString():null, is_active:true }).select().single();
  if (error) throw new Error(error.code==='23505'?'A coupon with this code already exists.':error.message); return normCoupon(d);
}
export async function updateCoupon(id, data) {
  const { data:d, error }=await supabase.from('coupons').update({ is_active:data.active??data.is_active }).eq('id',id).select().single();
  if (error) throw new Error(error.message); return normCoupon(d);
}
export async function deleteCoupon(id) { const { error }=await supabase.from('coupons').delete().eq('id',id); if (error) throw new Error(error.message); return { success:true }; }

/* ── Enrollments ── */
export async function getUserEnrollments(userId) {
  const { data, error }=await supabase.from('enrollments').select('*, products(id,title,slug,type,image_url,color,author,description)').eq('user_id',userId).order('enrolled_at',{ascending:false});
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

/* ── Storage ── */
// XHR upload (for progress events) authenticated as the signed-in Firebase user.
async function xhrUpload(bucket, path, file, onProgress, failMsg) {
  const token=(await getFirebaseToken())??import.meta.env.VITE_SUPABASE_ANON_KEY;
  return new Promise((resolve,reject) => {
    const xhr=new XMLHttpRequest(); xhr.open('POST',`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`);
    xhr.setRequestHeader('Authorization',`Bearer ${token}`);
    xhr.setRequestHeader('apikey',import.meta.env.VITE_SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type',file.type); xhr.setRequestHeader('x-upsert','false');
    xhr.upload.onprogress=e=>{ if(e.lengthComputable) onProgress(Math.round((e.loaded/e.total)*100)); };
    xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve(path):reject(new Error(failMsg));
    xhr.onerror=()=>reject(new Error('Network error')); xhr.send(file);
  });
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
  if (onProgress) return xhrUpload('course-videos',path,file,onProgress,'Video upload failed');
  const { error }=await supabase.storage.from('course-videos').upload(path,file,{ upsert:false, contentType:file.type });
  if (error) throw new Error('Video upload failed: '+error.message); return path;
}
export async function uploadEbookFile(file, onProgress) {
  const ext=file.name.split('.').pop().toLowerCase();
  const path=`ebooks/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  if (onProgress) return xhrUpload('ebook-files',path,file,onProgress,'File upload failed');
  const { error }=await supabase.storage.from('ebook-files').upload(path,file,{ upsert:false, contentType:file.type });
  if (error) throw new Error('eBook upload failed: '+error.message); return path;
}
export async function getSignedUrl(bucket, path, expiresIn=3600) {
  const { data, error }=await supabase.storage.from(bucket).createSignedUrl(path,expiresIn);
  if (error) throw new Error('Could not generate download link: '+error.message); return data.signedUrl;
}
