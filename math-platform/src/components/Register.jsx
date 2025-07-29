import { useState } from "react";
import React from "react";

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [birthdate, setBirthdate] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !username.trim() ||
      !password.trim() ||
      password !== confirmPassword ||
      !birthdate
    ) {
      setError("Por favor completa todos los campos correctamente");
      return;
    }

    if (!isBirthdateValid()) {
      setError("Debes tener entre 7 y 12 años para registrarte");
      return;
    }

    try {
      const response = await fetch(
        "https://pwgrupo6.miuni.kids/backend/api.php/registrar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: username, // Match API expected field name
            contraseña: password, // Match API expected field name
            fecha_nacimiento: birthdate, // Match API expected field name
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Handle successful registration
      console.log("User registered:", data);
      onRegister({
        username,
        birthdate,
        id: Date.now(),
      });
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error.message || "Error en el registro. Por favor intenta nuevamente."
      );
    }
  };

  // Calculate age from birthdate to validate (7-12 years old)
  const calculateAge = (birthdate) => {
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const isBirthdateValid = () => {
    if (!birthdate) return false;
    const age = calculateAge(birthdate);
    return age >= 7 && age <= 12;
  };

  const isFormValid =
    username.trim() &&
    password.trim() &&
    password === confirmPassword &&
    isBirthdateValid();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌟</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Únete a la Aventura!
          </h1>
          <p className="text-gray-600">
            Crea tu cuenta para empezar a practicar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Nombre de Usuario
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus: focus:outline-none text-lg transition-colors"
              placeholder="Elige un nombre divertido"
              required
            />
          </div>

          <div>
            <label
              htmlFor="birthdate"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              id="birthdate"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus: focus:outline-none text-lg transition-colors"
              required
              max={
                new Date(new Date().setFullYear(new Date().getFullYear() - 7))
                  .toISOString()
                  .split("T")[0]
              }
              min={
                new Date(new Date().setFullYear(new Date().getFullYear() - 12))
                  .toISOString()
                  .split("T")[0]
              }
            />
            {birthdate && !isBirthdateValid() && (
              <p className="text-red-500 text-sm mt-1">
                Debes tener entre 7 y 12 años para registrarte
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus: focus:outline-none text-lg transition-colors pr-12"
                placeholder="Crea una contraseña segura"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-bold text-gray-700 mb-2"
            >
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-lg transition-colors pr-12 ${
                  confirmPassword && password !== confirmPassword
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:"
                }`}
                placeholder="Repite tu contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                Las contraseñas no coinciden
              </p>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-center mb-4">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-white hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg text-lg"
            disabled={!isFormValid}
          >
            Crear Cuenta
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-4">¿Ya tienes una cuenta?</p>
          <button
            onClick={onSwitchToLogin}
            className="w-full bg-white hover:bg-gray-100 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg border-2  text-lg"
          >
            Iniciar Sesión
          </button>
        </div>

        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-4 text-2xl">
            <span>🎮</span>
            <span>📚</span>
            <span>🎯</span>
            <span>🚀</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
