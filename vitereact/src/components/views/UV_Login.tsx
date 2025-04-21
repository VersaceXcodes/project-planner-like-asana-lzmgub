import React, { useState, FormEvent } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { set_auth_token, set_current_user, set_is_authenticated } from "@/store/main";

const UV_Login: React.FC = () => {
  // Local component states
  const [email, set_email] = useState<string>("");
  const [password, set_password] = useState<string>("");
  const [error_message, set_error_message] = useState<string>("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Backend base URL from environment variables (must be prefixed with VITE_)
  const base_url = import.meta.env.VITE_API_BASE_URL || "http://localhost:1337";

  // Handler for form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    set_error_message(""); // reset previous error
    try {
      const response = await axios.post(
        `${base_url}/api/auth/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.status === 200) {
        const { token, uid, role } = response.data;
        // update global auth state via redux
        dispatch(set_auth_token(token));
        dispatch(set_current_user({ uid, name: "", role, created_at: "", updated_at: "" })); 
        // We don't have name, created_at and updated_at from login response details
        // but we assume at least uid and role are provided.
        dispatch(set_is_authenticated(true));
        // Redirect based on first-time login check stored in localStorage.
        if (!localStorage.getItem("hasVisited")) {
          localStorage.setItem("hasVisited", "true");
          navigate("/onboarding");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error:any) {
      // Capture error from backend (400/401 etc.)
      if (error.response && error.response.data && error.response.data.error) {
        set_error_message(error.response.data.error);
      } else {
        set_error_message("An unexpected error occurred.");
      }
    }
  };

  // Handler for key down event to allow Enter key submitting on inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // Prevent default submission to avoid duplicate events when inside input
      e.preventDefault();
      (e.target as HTMLInputElement).form?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Login
          </h2>
          {error_message && (
            <div className="p-3 text-red-700 bg-red-100 border border-red-400 rounded">
              {error_message}
            </div>
          )}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => set_email(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div className="mt-4">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => set_password(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Login
              </button>
            </div>
          </form>
          <div className="text-sm text-center">
            <span className="text-gray-600">New user? </span>
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Login;