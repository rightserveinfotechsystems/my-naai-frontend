import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Users from "./pages/Users.jsx";
import Salons from "./pages/Salons.jsx";
import SalonDetail from "./pages/SalonDetail.jsx";
import Bookings from "./pages/Bookings.jsx";
import SalonRequest from "./pages/SalonRequest.jsx";
import NotFound from "./pages/NotFound.jsx";
import Login from "./pages/Login.jsx";
import { UserProvider } from "./contexts/UserContext.jsx";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/" replace /> : children;
};



const router = createBrowserRouter(
  [
    {
      path: "/login",
      element: (
        <PublicRoute>
          <Login />
        </PublicRoute>
      ),
    },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      ),
    },
    {
      path: "/salons",
      element: (
        <ProtectedRoute>
          <Salons />
        </ProtectedRoute>
      ),
    },
    {
      path: "/salons/:id",
      element: (
        <ProtectedRoute>
          <SalonDetail />
        </ProtectedRoute>
      ),
    },
    {
      path: "/bookings",
      element: (
        <ProtectedRoute>
          <Bookings />
        </ProtectedRoute>
      ),
    },
    {
      path: "/salonrequest",
      element: (
        <ProtectedRoute>
          <SalonRequest />
        </ProtectedRoute>
      ),
    },
    {
      path: "*",
      element: (
        <ProtectedRoute>
          <NotFound />
        </ProtectedRoute>
      ),
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);


const App = () => {
  return (
    <UserProvider>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        pauseOnHover
        theme="light"
      />
    </UserProvider>
  );
};

export default App;

