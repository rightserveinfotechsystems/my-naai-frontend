import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Dashboard from "./pages/Dashboard.jsx";
import Users from "./pages/Users.jsx";
import Salons from "./pages/Salons.jsx";
import SalonDetail from "./pages/SalonDetail.jsx";
import Bookings from "./pages/Bookings.jsx";
import NotFound from "./pages/NotFound.jsx";
import Login from "./pages/Login.jsx";


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<Dashboard />} /> */}
        
        <Route path="/" element={<Users />} />
        <Route path="/salons" element={<Salons />} />
        <Route path="/salons/:id" element={<SalonDetail />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

