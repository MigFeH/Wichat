class QuestionGeneration {
    constructor(setQuestion) {
        this.setQuestion = setQuestion;
        this.questionsCache = [];
        this.currentIndex = 0;
        this.isFetching = false;
    }

    async fetchQuestions() {
        if (this.isFetching) return;
        this.isFetching = true;

        try {
            if (this.questionsCache.length === 0) {
                this.questionsCache = await this.generateQuestions();
                this.currentIndex = 0;
            }

            if (this.questionsCache.length > 0) {
                const question = this.getNextQuestion();
                if (question) this.setQuestion(question);
            }
        } catch (error) {
            console.error("Error fetching questions:", error);
        } finally {
            this.isFetching = false;
        }
    }

    async generateQuestions() {
        try {
            // Llamar a la API Gateway en lugar de generar preguntas localmente
            const response = await fetch("http://localhost:8000/game/questions");
            if (!response.ok) throw new Error("Error fetching questions");

            const question = await response.json();
            return [question]; // Lo guardamos en caché para que `getNextQuestion()` lo use
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    }

    getNextQuestion() {
        if (!this.questionsCache.length) {
            return null;
        }

        // Obtener la pregunta de la caché (si hay más, las puede ir usando en rondas siguientes)
        return this.questionsCache.shift();
    }
}

export default QuestionGeneration;
