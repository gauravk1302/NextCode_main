import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../utils/firebase";
import api from "../utils/axios";
import { setUserdata } from "../redux/userSlice";
import LoginImage from "../assets/Login.svg";

function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      const { data } = await api.post("/api/auth/login", { token });

      dispatch(setUserdata(data));
      navigate("/");
    } catch (err) {
      console.log(err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 border-r border-white/10 bg-black">
        <div className="flex items-center gap-2">
          <span className="bg-brand-lime px-3 py-1 rounded-md font-display text-[26px] uppercase tracking-wide text-black">
            NextCode
          </span>
        </div>

        <div>
          <h1 className="font-display text-[72px] uppercase leading-[0.95] text-white lg:text-[112px]">
            Build.
            <br />
            <span className="text-brand-lavender">Ship.</span>
            <br />
            <span className="text-brand-orange">Repeat.</span>
          </h1>
          <p className="mt-4 text-white/60 text-lg max-w-sm">
            Your projects, your terminal, your AI pair — all in one workspace.
          </p>
        </div>

        <p className="text-white/40 text-sm">
          &copy; {new Date().getFullYear()} NextCode
        </p>
      </div>

      {/* Right panel — login */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-black">
        <div className="w-full max-w-sm">
          <img
            src={LoginImage}
            alt="Login"
            className="w-full max-w-[260px] mx-auto mb-8"
          />

          <h2 className="font-display text-[44px] uppercase leading-none text-white mb-3">
            Welcome
          </h2>
          <p className="text-white/60 mb-8">
            Sign in to pick up where you left off.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black px-6 py-3.5 rounded-xl font-medium hover:bg-brand-lime transition-colors disabled:opacity-50"
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {error && <p className="mt-4 text-sm text-brand-coral">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default Login;
