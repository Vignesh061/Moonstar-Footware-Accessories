/**
 * App — Root component with React Router configuration.
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          {/* Sprint 2: Product routes */}
          {/* Sprint 4: Auth routes */}
          {/* Sprint 5: Checkout routes */}
          {/* Sprint 6: Order routes */}
          {/* Sprint 7: Admin routes */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
