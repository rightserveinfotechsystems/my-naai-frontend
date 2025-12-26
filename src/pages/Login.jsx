import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");

    try{
      const resposne = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/login`,
      {email,password}
      );
   

    if(resposne.data?.status === "SUCCESS"){
      localStorage.setItem("token", resposne.data.data.token);

      alert("Login Successfull");
      //naviagte
      navigate("/");
    }else{
      setError(resposne.data?.message || "Login Failed")
    }
  }catch(error){
    console.log(error);
    setError(error.resposne?.data.message || "Something went wrong. Please try again.");
  }
  finally{
    setLoading(false);
  }
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
            <label className="form-label d-flex flex-column  justify-content-between align-items-start ">
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

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : (
              "Sign In"
            )}
          </button>

         <label className="form-label d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
              {/* <span>Forgot Password?</span> */}
              <a
                href="#"
                className="forgot-link text-nowrap"
                onClick={(e) => e.preventDefault()}
              >
                Forgot Password?
              </a>
            </label>
        </form>

        <div className="login-footer">
          {/* <p>
            Don't have an account?
             <a href="/register" className="register-link">Sign up</a>
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
