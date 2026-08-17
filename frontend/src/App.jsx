/**
 * App — Root component with React Router configuration.
 *
 * Customer routes: /, /products/:id, /category/:slug, /search, /cart,
 *                  /login, /checkout, /orders, /orders/:id
 * Admin routes:    /admin/login, /admin, /admin/products, /admin/categories, /admin/orders
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Customer pages
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import AdminOrders from './pages/admin/AdminOrders';

import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* ── Customer Routes ── */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />
            </Route>

            {/* ── Admin Routes ── */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="orders" element={<AdminOrders />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
