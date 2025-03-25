import React, { useState, useEffect } from "react";

const TimedQuestionPresentation = ({ game, navigate, question }) => {
    const [score, setScore] = useState({ correct: 0, incorrect: 0, rounds: 0 });
    const [feedback, setFeedback] = useState(null);
    const [buttonsDisabled, setButtonsDisabled] = useState(false);
    const [timer, setTimer] = useState(10); // Tiempo en segundos
    const maxRounds = 10;

    useEffect(() => {
        const saveStats = async () => {
            try {
                const response = await fetch('http://localhost:8001/api/stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: localStorage.getItem('username'),
                        score:score.correct,
                        correctAnswers: score.correct,
                        incorrectAnswers: score.incorrect,
                        totalRounds: maxRounds
                    })
                });

                if (!response.ok) throw new Error('Error al guardar estadísticas');

            } catch (error) {
                console.error('Error:', error);
            }
        };

        if (score.rounds >= maxRounds) saveStats();
    }, [score,maxRounds]);

    useEffect(() => {
        if (!question) return;

        setTimer(10); // Reiniciar el temporizador al iniciar una nueva pregunta

        const countdown = setInterval(() => {
            setTimer(prev => {
                if (prev === 1) {
                    clearInterval(countdown);
                    handleTimeout(); // Llamar a la función de tiempo agotado
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdown); // Limpiar el temporizador al cambiar de pregunta
    }, [question]);

    const handleTimeout = () => {
        if (!buttonsDisabled) {
            setFeedback("⏳ Time's over ❌ wrong answer");
            setButtonsDisabled(true);

            setScore(prev => ({
                ...prev,
                incorrect: prev.incorrect + 1,
                rounds: prev.rounds + 1
            }));

            setTimeout(() => {
                if (score.rounds + 1 < maxRounds) {
                    game.fetchQuestions();
                    setFeedback(null);
                    setButtonsDisabled(false);
                }
            }, 1500);
        }
    };

    const checkAnswer = (selected) => {
        if (!question || buttonsDisabled) return;

        const isCorrect = selected === question.correct;
        setFeedback(isCorrect ? "✅ Correct answer" : "❌ Wrong answer");
        setButtonsDisabled(true);

        setScore(prev => ({
            correct: isCorrect ? prev.correct + 1 : prev.correct,
            incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect,
            rounds: prev.rounds + 1
        }));

        setTimeout(() => {
            if (score.rounds + 1 < maxRounds) {
                game.fetchQuestions();
                setFeedback(null);
                setButtonsDisabled(false);
            }
        }, 1500);
    };

    if (score.rounds >= maxRounds) {
        const total = score.correct + score.incorrect;
        const ratio = total > 0 ? Math.round((score.correct / total) * 100) : 0;

        return (
            <div>
                <h1>Final results</h1>
                <p>Correct answers: {score.correct}</p>
                <p>Incorrect answers: {score.incorrect}</p>
                <p>Ratio: {ratio}%</p>
                <button onClick={() => navigate("/menu")}>Main menu</button>
            </div>
        );
    }

    return (
        <div>
            <h1>Guess the City 🌍</h1>
            {question ? (
                <>
                    <p style={{ fontSize: "18px", fontWeight: "bold", color: timer <= 3 ? "red" : "black" }}>
                        ⏳ Tiempo restante: {timer}s
                    </p>
                    <div style={{ margin: '20px 0' }}>
                        <img
                            src={question.answers[question.correct]}
                            alt="Ciudad"
                            style={{
                                maxWidth: '100%',
                                height: '300px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            onError={(e) => {
                                e.target.src = 'fallback-image-url';
                                e.target.alt = 'Imagen no disponible';
                            }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {Object.keys(question.answers).map((city) => (
                            <button
                                key={city}
                                onClick={() => checkAnswer(city)}
                                disabled={buttonsDisabled}
                                style={{
                                    padding: '12px',
                                    fontSize: '16px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    backgroundColor: buttonsDisabled
                                        ? (city === question.correct ? '#4CAF50' : '#f44336')
                                        : '#2196F3',
                                    color: 'white',
                                    cursor: buttonsDisabled ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                    {feedback && <p style={{
                        fontSize: '20px',
                        marginTop: '20px',
                        animation: 'fadeIn 0.5s ease'
                    }}>{feedback}</p>}
                </>
            ) : (
                <p style={{ fontSize: '18px', color: '#666' }}>Loading Question...</p>
            )}
        </div>
    );
};

export default TimedQuestionPresentation;
