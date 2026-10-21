import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function PublicRoute({ children }) {
  const { userData, isLoading } = useSelector((state) => state.user);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (userData) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PublicRoute;