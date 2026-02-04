import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../contexts/UserContext.jsx";
import { adminAPI } from "../services/communication.jsx";
import { TabArray } from "../utils/TabArray.js";

const Login = () => {
  const navigate = useNavigate();
  const { fetchUserProfile } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);

    const result = await adminAPI.login({ email, password });

    // if (result.success) {
    //   localStorage.setItem("token", result.data.token);
    //   localStorage.setItem("accessTab", JSON.stringify(result?.data?.admin?.accessTab));
    //   toast.success("Login Successful!", {
    //     position: "top-right",
    //     autoClose: 3000,
    //   });
    //   navigate("/");
    // } 
    if (result.success) {
      const accessTabs = result?.data?.admin?.accessTab || [];

      localStorage.setItem("token", result.data.token);
      localStorage.setItem("accessTab", JSON.stringify(accessTabs));
      localStorage.setItem("userData", JSON.stringify(result?.data?.admin));

      // 🔥 Find first allowed tab
      const firstAllowedTab = TabArray.find(tab =>
        accessTabs?.includes(tab.key)
      );

      toast.success("Login Successful!", {
        position: "top-right",
        autoClose: 3000,
      });

      // ✅ Redirect to allowed route
      navigate(firstAllowedTab ? firstAllowedTab.route : "/login");
    } else {
      toast.error(result.message || "Login Failed");
    }

    setLoading(false);
  };




  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-placeholder">
            <div className="logo-icon"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <h3 className="text-center">Login</h3>
            <label className="form-label mt-4">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label d-flex flex-column justify-content-between align-items-start">
              <span>Password</span>
            </label>

            <div className="input-wrapper position-relative">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input pe-5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />

              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </span>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              "Sign In"
            )}
          </button>

        </form>

        <div className="login-footer"></div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

    </div>
  );
};

export default Login;
