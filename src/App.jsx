import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/layout/ErrorBoundary';
import PageTransition from './components/layout/PageTransition';
import { RequireAuth, RequireAdmin, RequireGuest } from './components/layout/AuthGuard';
import HomePage         from './pages/HomePage';
import CatalogPage      from './pages/CatalogPage';
import ProductPage      from './pages/ProductPage';
import CartPage         from './pages/CartPage';
import CheckoutPage     from './pages/CheckoutPage';
import MyCourses        from './pages/MyCourses';
import CreateCoursePage from './pages/CreateCoursePage';
import NotFound         from './pages/NotFound';
import AdminDashboard   from './pages/admin/AdminDashboard';
import { LoginPage, SignupPage, ForgotPasswordPage } from './pages/auth/AuthPages';

if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

const BARE = ['/login','/signup','/forgot-password','/admin','/create'];

function Layout({ children }) {
  const { pathname } = useLocation();
  const bare = BARE.some(p => pathname.startsWith(p));
  if (bare) return <PageTransition>{children}</PageTransition>;
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Navbar />
      <div style={{ flex:1 }}><ErrorBoundary><PageTransition>{children}</PageTransition></ErrorBoundary></div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/"              element={<HomePage />} />
          <Route path="/courses"       element={<CatalogPage type="course" />} />
          <Route path="/ebooks"        element={<CatalogPage type="ebook" />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/cart"          element={<CartPage />} />
          <Route path="/login"           element={<RequireGuest><LoginPage /></RequireGuest>} />
          <Route path="/signup"          element={<RequireGuest><SignupPage /></RequireGuest>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/my-courses" element={<RequireAuth><MyCourses /></RequireAuth>} />
          <Route path="/checkout"   element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/create"     element={<RequireAuth><CreateCoursePage /></RequireAuth>} />
          <Route path="/admin/*"    element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="*"           element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  );
}
