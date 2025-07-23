import { useState } from 'react'
import React from "react"


const Login = ({ onLogin, onSwitchToRegister }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username.trim() && password.trim()) {
      onLogin({ username, id: Date.now() })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧮</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">¡Bienvenido!</h1>
          <p className="text-gray-600">Practica las restas de manera divertida</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2">
              Nombre de Usuario
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg transition-colors"
              placeholder="Escribe tu nombre"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg transition-colors pr-12"
                placeholder="Escribe tu contraseña"
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

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg text-lg"
            disabled={!username.trim() || !password.trim()}
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-4">¿No tienes una cuenta?</p>
          <button
            onClick={onSwitchToRegister}
            className="w-full bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-blue-500 text-lg"
          >
            Crear Cuenta Nueva
          </button>
        </div>

        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-4 text-2xl">
            <span>🎯</span>
            <span>⭐</span>
            <span>🏆</span>
            <span>🎨</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login 