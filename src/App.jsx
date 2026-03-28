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
import Advertisement from "./pages/Advertisement.jsx";
import NotFound from "./pages/NotFound.jsx";
import Login from "./pages/Login.jsx";
import TermsAndConditions from "./pages/TermsAndConditions.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import { UserProvider } from "./contexts/UserContext.jsx";
import AccountDeletion from "./pages/AccountDeletion.jsx";
import RoleManagement from "./pages/RoleManagement.jsx";
import { TabArray } from "./utils/TabArray.js";
import AgentSalons from "./pages/AgentSalons.jsx";
import Notifications from "./pages/PushNotifications.jsx";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const accessTabs = localStorage.getItem("accessTabs");
  const firstTab = TabArray?.find(tab =>
    accessTabs?.includes(tab.key)
  )
  // return (token && accessTabs) ? <Navigate to={firstTab.route} replace /> : children;
    if (token && accessTabs && firstTab) {
    return <Navigate to={firstTab.route} replace />;
  }
  return children;
};

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: (
        <PublicRoute>
          <Login />
        </PublicRoute>
      ),
    },
    {
      path: "/login",
      element: (
        <PublicRoute>
          <Login />
        </PublicRoute>
      ),
    },

    {
      path: "/account-deletion",
      element: <AccountDeletion />,
    },
    {
      path: "/privacy-policy",
      element: <PrivacyPolicy />,
    },

    {
      path: "/user",
      element: (
        <ProtectedRoute>
          <RoleManagement />
        </ProtectedRoute>
      ),
    },
    {
      path: "/customer",
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
      path: "/agent-salons/:agentId",
      element: (
        <ProtectedRoute>
          <AgentSalons />
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
    // {
    //   path: "/salonrequest",
    //   element: (
    //     <ProtectedRoute>
    //       <SalonRequest />
    //     </ProtectedRoute>
    //   ),
    // },
    {
      path: "/advertisement",
      element: (
        <ProtectedRoute>
          <Advertisement />
        </ProtectedRoute>
      ),
    },
       {
      path: "/notifications",
      element: (
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      ),
    },
    {
      path: "*",
      element: (
        // NotFound ko bhi open rakh sakte hain ya protected, aapki marzi
        // Filhal ye protected hai
        <PublicRoute>
          <Login />
        </PublicRoute>
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