import QuestionGeneration from './QuestionGeneration.js';

class QuestionPresentation {
    constructor() {
        this.game = new QuestionGeneration(this);
        this.createBaseLayout();
        this.game.fetchQuestions();
    }

    createBaseLayout() {
        document.body.innerHTML = `
            <div id="quiz-container">
                <h1>Adivina la Ciudad 🌍</h1>
                <img id="city-image" src="" alt="Imagen de ciudad">
                <div id="options"></div>
                <p id="result"></p>
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

    showResult(text) {
        document.getElementById("result").innerText = text;

        // Esperar 2 segundos antes de cargar una nueva pregunta
        setTimeout(() => {
            this.game.fetchQuestions();
        }, 2000);
    }

    disableButtons() {
        document.querySelectorAll(".option").forEach(btn => {
            btn.disabled = true;
        });
    }
}

// Instancia de la presentación del juego
let c = new QuestionPresentation();

