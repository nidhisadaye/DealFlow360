import { useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MainLayout from "./layouts/MainLayout";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("dealflow360_token"))
  );
  const [showSignup, setShowSignup] = useState(false);

  if (!isLoggedIn) {
    return showSignup ? (
      <Signup onLogin={() => setShowSignup(false)} />
    ) : (
      <Login onLogin={() => setIsLoggedIn(true)} onRegister={() => setShowSignup(true)} />
    );
  }

  return <MainLayout />;
}

export default App;