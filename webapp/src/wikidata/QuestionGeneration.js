

export default class QuestionGeneration {
    constructor(ui) {
        this.ui = ui; // Recibir instancia de QuestionPresentation
    }

    async fetchQuestions() {
        const { answers, correct } = await this.shuffleAnswers();
        this.ui.renderQuestion(answers, correct);
    }

    async generateQuestions() {
        const WikidataUrl = "https://query.wikidata.org/sparql";
        const sparqlQuery = `
        SELECT ?city ?cityLabel ?image WHERE {
            ?city wdt:P31 wd:Q515.
            ?city wdt:P18 ?image.
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        ORDER BY RAND()
        LIMIT 10`;

        // Agregar un timestamp único para evitar la caché
        const url = WikidataUrl + "?query=" + encodeURIComponent(sparqlQuery) + "&format=json&timestamp=" + new Date().getTime();
        
        try {
            const response = await fetch(url, { headers: { 'Accept': 'application/sparql-results+json' } });
            const data = await response.json();

            const results = {};
            data.results.bindings.forEach(item => {
                results[item.cityLabel.value] = item.image.value;
            });

            return results;
        } catch (error) {
            console.error("Error fetching data:", error);
            return {};
        }
    }

    async shuffleAnswers() {
        let options = await this.generateQuestions();

        let keys = Object.keys(options);
        if (keys.length < 4) {
            console.error("No hay suficientes ciudades para generar preguntas.");
            return { answers: {}, correct: null };
        }

        let shuffledKeys = keys.sort(() => 0.5 - Math.random()).slice(0, 4);
        let correct = shuffledKeys[Math.floor(Math.random() * shuffledKeys.length)];

        let answers = shuffledKeys.reduce((acc, key) => {
            acc[key] = options[key];
            return acc;
        }, {});

        return { answers, correct };
    }

    checkAnswer(selected, correct) {
        // Pasa un valor booleano a showResult
        this.ui.showResult(selected === correct);
    }
}

    


new QuestionGeneration();