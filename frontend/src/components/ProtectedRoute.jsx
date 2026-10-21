import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { userData, isLoading } = useSelector((state) => state.user)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!userData) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute