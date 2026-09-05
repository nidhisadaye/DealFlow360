import { useState } from "react";
import Login from "./pages/Login";
import MainLayout from "./layouts/MainLayout";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("dealflow360_token"))
  );

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return <MainLayout />;
}

export default App;