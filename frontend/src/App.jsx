import React, { useEffect } from "react";
import { getMe } from "./features/me";
import { useDispatch } from "react-redux";
import { setUserdata, setAuthChecked } from "./redux/userSlice";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ProjectPage from "./pages/ProjectPage";
import Plans from "./components/Plans";
import PublicRoute from "./components/PublicRoute";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const getUser = async () => {
      try {
        const data = await getMe();
        console.log(data);
        dispatch(setUserdata(data));
      } catch (error) {
        console.log(error);
        dispatch(setAuthChecked());
      }
    };
    getUser();
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:id"
        element={
          <ProtectedRoute>
            <ProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute>
            <Plans />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
