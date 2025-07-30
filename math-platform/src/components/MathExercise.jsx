import { useState, useEffect } from "react";
import React from "react";

const MathExercise = ({
  pageNumber,
  onBackToDashboard,
  onUpdateProgress,
  progress,
  currentUserId,
}) => {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageExercises = 8;
  const [completedCount, setCompletedCount] = useState(null);
  const [isIncorrect, setIsIncorrect] = useState(false);

  // Fetch exercises from PHP API
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://pwgrupo6.miuni.kids/backend/api.php/ejercicios/?usuario_id=${currentUserId}&pagina=${pageNumber}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON");
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Transform the API data to match your component's expected format
        const formattedExercises = data.map((exercise) => ({
          id: exercise.id, // Use the actual database ID
          minuend: exercise.minuendo,
          subtrahend: exercise.sustraendo,
          correctAnswer: exercise.resultado,
          page: exercise.pagina, // Include the page number from database
          completed: exercise.completado,
        }));

        setCompletedCount(
          formattedExercises.filter((ex) => ex.completed).length
        );
        setExercises(formattedExercises);
      } catch (error) {
        console.error("Error fetching exercises:", error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [pageNumber, progress, currentUserId]);

  const resetExercises = async () => {
    // Ask confirmation first
    const shouldReset = window.confirm(
      "¿Estás seguro que quieres reiniciar todos los ejercicios de esta página? Se generarán nuevos ejercicios."
    );

    if (!shouldReset) return; // Exit early if user cancels

    try {
      setLoading(true);

      // Call API to reset exercises first
      const response = await fetch(
        "https://pwgrupo6.miuni.kids/backend/api.php/reiniciar-ejercicios",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuario_id: currentUserId,
            pagina: pageNumber,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // After reset, fetch the new exercises
      const fetchResponse = await fetch(
        `https://pwgrupo6.miuni.kids/backend/api.php/ejercicios/?usuario_id=${currentUserId}&pagina=${pageNumber}`
      );
      const newExercises = await fetchResponse.json();

      const formattedExercises = newExercises.map((exercise) => ({
        id: exercise.id,
        minuend: exercise.minuendo,
        subtrahend: exercise.sustraendo,
        correctAnswer: exercise.resultado,
        page: exercise.pagina,
        completed: undefined,
      }));

      setExercises(formattedExercises);
      setSelectedExercise(null);
      setCompletedCount(0);
    } catch (error) {
      console.error("Error resetting exercises:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProgressInDatabase = async (exerciseId) => {
    try {
      const response = await fetch(
        "https://pwgrupo6.miuni.kids/backend/api.php/actualizar-progreso",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usuario_id: currentUserId,
            ejercicio_id: exerciseId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error updating progress:", error);
      return false;
    }
  };

  const handleExerciseClick = (exercise) => {
    if (exercise.completed) return;
    setSelectedExercise(exercise);
    setUserAnswer("");
    setShowResult(false);
    setIsLocked(false);
  };

  const handleNumberClick = (number) => {
    if (isLocked) return;
    setUserAnswer((prev) => prev + number.toString());
  };

  const handleClear = () => {
    if (isLocked) return;
    setUserAnswer("");
  };

  const handleDelete = () => {
    if (isLocked) return;
    setUserAnswer((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!userAnswer || isLocked) return;

    exercises.forEach((exercise) => {
      if (!exercise.isCorrect) {
        setIsIncorrect(true);
      }
    });

    const answer = parseInt(userAnswer);
    const correct = answer === parseInt(selectedExercise.correctAnswer);

    setIsCorrect(correct);
    setShowResult(true);

    const updateSuccess = updateProgressInDatabase(selectedExercise.id);
    console.log("Update success:", updateSuccess);

    if (updateSuccess) {
      // Only update local state if database update was successful
      setCompletedCount(
        exercises.filter((ex) => ex.isCorrect).length + (correct ? 1 : 0)
      );

      onUpdateProgress(selectedExercise.id, correct);

      setExercises((prev) =>
        prev.map((ex) =>
          ex.id === selectedExercise.id
            ? { ...ex, completed: correct, isCorrect: correct }
            : ex
        )
      );
    } else {
      // Handle database update failure
      console.error("Failed to update progress in database");
      setIsLocked(false);
    }
    // Use the database exercise ID
    onUpdateProgress(selectedExercise.id, correct);

    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === selectedExercise.id
          ? { ...ex, completed: correct, isCorrect: correct }
          : ex
      )
    );
  };

  const handleBackToExercises = () => {
    if (isLocked && !isCorrect) return;
    setSelectedExercise(null);
    setUserAnswer("");
    setShowResult(false);
    setIsLocked(false);
  };

  const handleNextExercise = () => {
    const nextExercise = exercises.find((ex) => !ex.completed);
    if (nextExercise) {
      handleExerciseClick(nextExercise);
    } else {
      onBackToDashboard();
    }
  };

  const getExerciseStatus = (exercise) => {
    if (!exercise.completed) return "pending";
    return exercise.completed && "completed";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "✅";
      case "incorrect":
        return "❌";
      default:
        return "📝";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-white text-2xl">Cargando ejercicios...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="text-red-500 text-xl">
          Error al cargar los ejercicios: {error}
        </div>
        <button
          onClick={onBackToDashboard}
          className="ml-4 bg-white hover:bg-gray-100 text-white font-bold py-2 px-4 rounded"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  if (!selectedExercise) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Página {pageNumber}
              </h1>
              <p className="text-white text-lg">
                Selecciona un ejercicio para comenzar
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetExercises}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Reiniciar Ejercicios
              </button>
              <button
                onClick={onBackToDashboard}
                className="bg-white hover:bg-gray-100 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg border-2 "
              >
                Volver al Dashboard
              </button>
            </div>
          </div>

          {/* Exercises Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {exercises.map((exercise) => {
              const status = getExerciseStatus(exercise);
              return (
                <div
                  key={exercise.id}
                  className={`bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 shadow-lg border-2 border-blue-200 transition-all duration-300 cursor-pointer hover:shadow-xl hover:border-blue-300 ${
                    status === "completed"
                      ? "bg-gradient-to-br from-green-50 to-green-100 border-green-500"
                      : ""
                  } ${
                    status === "incorrect"
                      ? "bg-gradient-to-br from-red-50 to-red-100 border-red-500"
                      : ""
                  } ${
                    !exercise.completed ? "cursor-pointer" : "cursor-default"
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
                        ? "Completado"
                        : "Haz clic para resolver"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress */}
          <div className="mt-8 text-center">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Progreso de la Página
              </h3>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Ejercicios completados</span>
                <span>
                  {completedCount > 0 ? completedCount : 0} / {pageExercises}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      (exercises.filter((ex) => ex.completed).length / 8) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Ejercicio{" "}
              {exercises.findIndex((ex) => ex.id === selectedExercise.id) + 1}
            </h1>
            <p className="text-white text-lg">Página {selectedExercise.page}</p>
          </div>
          <button
            onClick={handleBackToExercises}
            className="bg-white hover:bg-gray-100 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg border-2 "
            disabled={isIncorrect && !isCorrect}
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
                <div className="text-center font-mono">
                  {selectedExercise.minuend}
                </div>
                <div className="text-center font-mono">
                  - {selectedExercise.subtrahend}
                </div>
                <div className="border-b-4 border-gray-800 mt-2"></div>
              </div>
            </div>

            {/* Answer Display */}
            <div className="mb-8">
              <div className="text-2xl text-gray-600 mb-2">Tu respuesta:</div>
              <div className="text-4xl font-bold text-black bg-gray-100 rounded-xl p-4 min-h-[80px] flex items-center justify-center">
                {userAnswer || "?"}
              </div>
            </div>

            {/* Result Display */}
            {showResult && (
              <div
                className={`mb-8 p-6 rounded-xl ${
                  isCorrect
                    ? "bg-green-100 border-2 border-green-500"
                    : "bg-red-100 border-2 border-red-500"
                }`}
              >
                <div className="text-4xl mb-2">
                  {isCorrect ? "🎉 ¡Correcto!" : "😔 Incorrecto"}
                </div>
                <div className="text-xl text-gray-700">
                  {isCorrect ? "¡Excelente trabajo!" : "Inténtalo de nuevo"}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={handleSubmit}
                className="bg-white hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg"
                disabled={!userAnswer || isLocked}
              >
                Verificar Respuesta
              </button>

              {showResult && isCorrect && (
                <button
                  onClick={handleNextExercise}
                  className="bg-white hover:bg-gray-100 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg border-2 "
                >
                  {exercises.filter((ex) => !ex.completed).length > 1
                    ? "Siguiente Ejercicio"
                    : "Finalizar"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Number Pad */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
            Teclado Numérico
          </h3>
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <button
                key={number}
                onClick={() => handleNumberClick(number)}
                className="bg-white hover:bg-white text-2xl font-bold text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-2 border-gray-200 transition-all duration-200 transform hover:scale-110 hover:shadow-xl"
                disabled={selectedExercise.isCorrect}
              >
                {number}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="bg-red-500 hover:bg-red-600 text-white text-2xl font-bold rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-2 border-red-500 transition-all duration-200 transform hover:scale-110 hover:shadow-xl"
              disabled={selectedExercise.isCorrect}
            >
              C
            </button>
            <button
              onClick={() => handleNumberClick(0)}
              className="bg-white hover:bg-white text-2xl font-bold text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-2 border-gray-200 transition-all duration-200 transform hover:scale-110 hover:shadow-xl"
              disabled={selectedExercise.isCorrect}
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="bg-gray-500 hover:bg-gray-600 text-white text-2xl font-bold rounded-full w-16 h-16 flex items-center justify-center shadow-lg border-2 border-gray-500 transition-all duration-200 transform hover:scale-110 hover:shadow-xl"
              disabled={selectedExercise.isCorrect}
            >
              ←
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathExercise;
