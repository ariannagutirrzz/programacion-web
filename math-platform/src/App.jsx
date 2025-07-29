import React from "react";

import { useState } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import MathExercise from "./components/MathExercise";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState("login");
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [progress, setProgress] = useState({});

  const handleLogin = (userData) => {
    setUser({
      id: userData.id,
      username: userData.username,
      birthdate: userData.birthdate,
    });
    setCurrentView("dashboard");
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("login");
    setProgress({});
  };

  const startExercise = (pageNumber) => {
    setCurrentPage(pageNumber);
    setCurrentView("exercise");
  };

  const updateProgress = (exerciseId, isCorrect) => {
    setProgress((prev) => ({
      ...prev,
      [exerciseId]: isCorrect,
    }));
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "login":
        return (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView("register")}
          />
        );
      case "register":
        return (
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentView("login")}
          />
        );
      case "dashboard":
        return (
          <Dashboard
            user={user}
            onLogout={handleLogout}
            onStartExercise={startExercise}
            progress={progress}
          />
        );
      case "exercise":
        return (
          <MathExercise
            pageNumber={currentPage}
            onBackToDashboard={() => setCurrentView("dashboard")}
            onUpdateProgress={updateProgress}
            progress={progress}
            currentUserId={user.id} // Assuming user object has an id property
          />
        );
      default:
        return (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView("register")}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      {renderCurrentView()}
    </div>
  );
}

export default App;
