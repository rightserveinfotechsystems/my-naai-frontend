import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Users from "./pages/Users.jsx";
import Salons from "./pages/Salons.jsx";
import SalonDetail from "./pages/SalonDetail.jsx";
import Bookings from "./pages/Bookings.jsx";
import SalonRequest from "./pages/SalonRequest.jsx";
import NotFound from "./pages/NotFound.jsx";
import Login from "./pages/Login.jsx";
import { UserProvider } from "./contexts/UserContext.jsx";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token'); 
  return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/" replace /> : children;
};

const App = () => {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />

        {/* All admin routes protected */}
        <Route
          path="/salons"
          element={
            <ProtectedRoute>
              <Salons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salons/:id"
          element={
            <ProtectedRoute>
              <SalonDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salonrequest"
          element={
            <ProtectedRoute>
              <SalonRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </UserProvider>
  );
};

export default App;

