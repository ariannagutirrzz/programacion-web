import React, { useState, useEffect } from "react";

const Dashboard = ({ user, onLogout, onStartExercise }) => {
  const [exercisesByPage, setExercisesByPage] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const totalPages = 3;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Fetch exercises for all pages on mount or user change
  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    const fetchExercisesForPage = async (page) => {
      const url = `https://pwgrupo6.miuni.kids/backend/api.php/ejercicios?usuario_id=${user.id}&pagina=${page}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch exercises for page ${page}`);
      }
      const data = await res.json();
      return data;
    };

    Promise.all(pages.map((page) => fetchExercisesForPage(page)))
      .then((results) => {
        const grouped = {};
        pages.forEach((page, idx) => {
          grouped[page] = results[idx];
        });
        setExercisesByPage(grouped);
      })
      .catch((err) => {
        console.error(err);
        setError("Error loading exercises.");
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Compute a flat progress map: { "page-exerciseIndex": true/false }
  // Using exercise.completado boolean from your fetched data
  const progress = {};
  Object.entries(exercisesByPage).forEach(([page, exercises]) => {
    exercises.forEach((ex, idx) => {
      progress[`${page}-${idx + 1}`] = !!ex.completado;
    });
  });

  // Calculate completed exercises count and percentages
  const completedExercises = Object.values(progress).filter(Boolean).length;
  const totalExercises = totalPages * 8;
  const progressPercentage = Math.round(
    (completedExercises / totalExercises) * 100
  );

  const getPageProgress = (pageNumber) => {
    // exercises ids for page: pageNumber-1 ... pageNumber-8
    const pageExercises = Array.from(
      { length: 8 },
      (_, i) => `${pageNumber}-${i + 1}`
    );
    const completed = pageExercises.filter((id) => progress[id]).length;
    return Math.round((completed / 8) * 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage === 100) return "bg-green-500";
    if (percentage < 100) return "bg-gradient-to-r from-blue-500 to-green-500";
    return "bg-gray-300";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl">
        Cargando ejercicios...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              🧮 Plataforma de Restas
            </h1>
            <p className="text-white text-lg">¡Hola, {user.username}! 👋</p>
          </div>
          <button
            onClick={onLogout}
            className="bg-black hover:bg-gray-100 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg border-2 "
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Tu Progreso</h2>
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-white hover:text-white font-bold"
            >
              {showStats ? "Ocultar" : "Ver"} Estadísticas
            </button>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progreso General</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {completedExercises}
              </div>
              <div className="text-sm text-gray-600">de {totalExercises}</div>
            </div>
          </div>

          {showStats && (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-6">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(progress).filter(Boolean).length}
                </div>
                <div className="text-sm text-gray-600">Correctos</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-600">
                  {totalExercises - completedExercises}
                </div>
                <div className="text-sm text-gray-600">Pendientes</div>
              </div>
            </div>
          )}
        </div>

        {/* Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((pageNumber) => {
            const pageProgress = getPageProgress(pageNumber);
            const isCompleted = pageProgress === 100;

            return (
              <div
                key={pageNumber}
                className={`bg-white rounded-2xl shadow-xl p-6 transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                  isCompleted ? "ring-2 ring-green-500" : ""
                }`}
                onClick={() => onStartExercise(pageNumber)}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">
                    {isCompleted ? "🎉" : "📄"}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Página {pageNumber}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {isCompleted ? "¡Completada!" : "8 ejercicios de resta"}
                  </p>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progreso</span>
                      <span>{pageProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
                          pageProgress
                        )}`}
                        style={{ width: `${pageProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <button className="w-full bg-white hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg">
                    {isCompleted ? "Repasar" : "Comenzar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="flex justify-center space-x-6 text-2xl">
            <span>🎯</span>
            <span>⭐</span>
            <span>🏆</span>
            <span>🎨</span>
            <span>🚀</span>
          </div>
          <p className="text-white mt-4 text-lg">
            ¡Practica y mejora tus habilidades matemáticas!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
