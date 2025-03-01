import QuestionGeneration from './questionGeneration/QuestionGeneration.js';

class QuestionPresentation {
    constructor(container) {
        this.container = container;
        this.game = new QuestionGeneration(this);
        this.createBaseLayout();
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.rounds = 0;
        this.maxRounds = 10;
        this.game.fetchQuestions();
    }

    createBaseLayout() {
        this.container.innerHTML = `
            <div id="quiz-container">
                <h1>Adivina la Ciudad 🌍</h1>
                <img id="city-image" src="" alt="Imagen de ciudad">
                <div id="options"></div>
                <p id="result"></p>
                <p id="score"></p>
            </div>
        `;
    }

    renderQuestion(answers, correct) {
        const cityImage = document.getElementById("city-image");
        const optionsDiv = document.getElementById("options");

        cityImage.src = answers[correct];
        optionsDiv.innerHTML = "";

        Object.keys(answers).forEach(city => {
            let btn = document.createElement("button");
            btn.innerText = city;
            btn.classList.add("option");
            
            // Evento de clic con desactivación
            btn.onclick = () => {
                this.disableButtons(); // Desactivar botones
                this.game.checkAnswer(city, correct);
            };

            optionsDiv.appendChild(btn);
        });
    }

    showResult(isCorrect) {
        if (isCorrect) {
            this.correctAnswers++;
            document.getElementById("result").innerText = "¡Correcto! ✅";
        } else {
            this.incorrectAnswers++;
            document.getElementById("result").innerText = "Incorrecto ❌";
        }

        this.rounds++;

        if (this.rounds < this.maxRounds) {
            setTimeout(() => {
                this.game.fetchQuestions();
            }, 2000);
        } else {
            this.showFinalScore();
        }
    }

    disableButtons() {
        document.querySelectorAll(".option").forEach(btn => {
            btn.disabled = true;
        });
    }

    showFinalScore() {
        document.getElementById("quiz-container").innerHTML = `
            <h1>Resultados Finales</h1>
            <p>Respuestas correctas: ${this.correctAnswers}</p>
            <p>Respuestas incorrectas: ${this.incorrectAnswers}</p>
        `;
    }
}

export default QuestionPresentation;
