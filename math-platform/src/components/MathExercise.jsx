import { useState, useEffect } from 'react'
import React from "react"

const MathExercise = ({ pageNumber, onBackToDashboard, onUpdateProgress, progress }) => {
  const [exercises, setExercises] = useState([])
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  useEffect(() => {
    const generateExercises = () => {
      const newExercises = []
      for (let i = 1; i <= 8; i++) {
        const minuend = Math.floor(Math.random() * 90000) + 10000
        const maxSubtrahend = minuend - 1000
        const subtrahend = Math.floor(Math.random() * (maxSubtrahend - 10000 + 1)) + 10000
        const correctAnswer = minuend - subtrahend
        
        newExercises.push({
          id: `${pageNumber}-${i}`,
          minuend,
          subtrahend,
          correctAnswer,
          completed: progress[`${pageNumber}-${i}`] !== undefined,
          isCorrect: progress[`${pageNumber}-${i}`]
        })
      }
      setExercises(newExercises)
    }

    generateExercises()
  }, [pageNumber, progress])

  const handleExerciseClick = (exercise) => {
    if (exercise.completed) return
    setSelectedExercise(exercise)
    setUserAnswer('')
    setShowResult(false)
    setIsLocked(false)
  }

  const handleNumberClick = (number) => {
    if (isLocked) return
    setUserAnswer(prev => prev + number.toString())
  }

  const handleClear = () => {
    if (isLocked) return
    setUserAnswer('')
  }

  const handleDelete = () => {
    if (isLocked) return
    setUserAnswer(prev => prev.slice(0, -1))
  }

  const handleSubmit = () => {
    if (!userAnswer || isLocked) return
    
    const answer = parseInt(userAnswer)
    const correct = answer === selectedExercise.correctAnswer
    
    setIsCorrect(correct)
    setShowResult(true)
    setIsLocked(true)
    
    onUpdateProgress(selectedExercise.id, correct)
    
    setExercises(prev => prev.map(ex => 
      ex.id === selectedExercise.id 
        ? { ...ex, completed: true, isCorrect: correct }
        : ex
    ))
  }

  const handleBackToExercises = () => {
    if (isLocked && !isCorrect) return
    setSelectedExercise(null)
    setUserAnswer('')
    setShowResult(false)
    setIsLocked(false)
  }

  const handleNextExercise = () => {
    const nextExercise = exercises.find(ex => !ex.completed)
    if (nextExercise) {
      handleExerciseClick(nextExercise)
    } else {
      onBackToDashboard()
    }
  }

  const getExerciseStatus = (exercise) => {
    if (!exercise.completed) return 'pending'
    return exercise.isCorrect ? 'completed' : 'incorrect'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅'
      case 'incorrect': return '❌'
      default: return '📝'
    }
  }

  if (!selectedExercise) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Página {pageNumber}</h1>
              <p className="text-white text-lg">Selecciona un ejercicio para comenzar</p>
            </div>
            <button onClick={onBackToDashboard} className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-blue-500">
              Volver al Dashboard
            </button>
          </div>

          {/* Exercises Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {exercises.map((exercise) => {
              const status = getExerciseStatus(exercise)
              return (
                <div
                  key={exercise.id}
                  className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 shadow-lg border-2 border-blue-200 transition-all duration-300 cursor-pointer hover:shadow-xl hover:border-blue-300 ${
                    status === 'completed' ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-500' : ''
                  } ${
                    status === 'incorrect' ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-500' : ''
                  } ${
                    !exercise.completed ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  onClick={() => handleExerciseClick(exercise)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{getStatusIcon(status)}</div>
                    <div className="text-lg font-bold text-gray-800 mb-2 font-mono">
                      <div>{exercise.minuend}</div>
                      <div>- {exercise.subtrahend}</div>
                    </div>
                    <div className="text-lg text-gray-600">
                      {exercise.completed 
                        ? exercise.isCorrect 
                          ? '¡Correcto!' 
                          : 'Incorrecto'
                        : 'Haz clic para resolver'
                      }
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress */}
          <div className="mt-8 text-center">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Progreso de la Página</h3>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Ejercicios completados</span>
                <span>{exercises.filter(ex => ex.completed).length} / 8</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(exercises.filter(ex => ex.completed).length / 8) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Ejercicio {selectedExercise.id.split('-')[1]}
            </h1>
            <p className="text-white text-lg">Página {pageNumber}</p>
          </div>
          <button 
            onClick={handleBackToExercises} 
            className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-blue-500"
            disabled={isLocked && !isCorrect}
          >
            Volver a Ejercicios
          </button>
        </div>

        {/* Exercise Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="text-center">
            <div className="text-6xl mb-6">🧮</div>
            <div className="text-4xl font-bold text-gray-800 mb-8">
              <div className="mb-4">
                <div className="text-right font-mono">{selectedExercise.minuend}</div>
                <div className="text-right font-mono">- {selectedExercise.subtrahend}</div>
                <div className="border-b-4 border-gray-800 mt-2"></div>
                <div className="text-right font-mono mt-2">?</div>
              </div>
            </div>
            
            {/* Answer Display */}
            <div className="mb-8">
              <div className="text-2xl text-gray-600 mb-2">Tu respuesta:</div>
              <div className="text-4xl font-bold text-blue-600 bg-gray-100 rounded-xl p-4 min-h-[80px] flex items-center justify-center">
                {userAnswer || '?'}
              </div>
            </div>

            {/* Result Display */}
            {showResult && (
              <div className={`mb-8 p-6 rounded-xl ${
                isCorrect ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'
              }`}>
                <div className="text-4xl mb-2">
                  {isCorrect ? '🎉 ¡Correcto!' : '😔 Incorrecto'}
                </div>
                <div className="text-xl text-gray-700">
                  {isCorrect 
                    ? '¡Excelente trabajo!' 
                    : `La respuesta correcta es: ${selectedExercise.correctAnswer}`
                  }
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={handleSubmit}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg"
                disabled={!userAnswer || isLocked}
              >
                Verificar Respuesta
              </button>
              
              {showResult && (
                <button
                  onClick={handleNextExercise}
                  className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-blue-500"
                >
                  {exercises.filter(ex => !ex.completed).length > 1 ? 'Siguiente Ejercicio' : 'Finalizar'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Number Pad */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Teclado Numérico</h3>
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => (
              <button
                key={number}
                onClick={() => handleNumberClick(number)}
                className="bg-white hover:bg-blue-50 text-2xl font-bold text-gray-800 rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-2 border-gray-200 transition-all duration-200 transform hover:scale-110 hover:shadow-xl"
                disabled={isLocked}
              >
                {number}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="bg-red-500 hover:bg-red-600 text-white text-2xl font-bold rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-2 border-red-500 transition-all duration-200 transform hover:scale-110 hover:shadow-xl"
              disabled={isLocked}
            >
              C
            </button>
            <button
              onClick={() => handleNumberClick(0)}
              className="bg-white hover:bg-blue-50 text-2xl font-bold text-gray-800 rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-2 border-gray-200 transition-all duration-200 transform hover:scale-110 hover:shadow-xl"
              disabled={isLocked}
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="bg-gray-500 hover:bg-gray-600 text-white text-2xl font-bold rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-2 border-gray-500 transition-all duration-200 transform hover:scale-110 hover:shadow-xl"
              disabled={isLocked}
            >
              ←
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MathExercise 