class QuestionGeneration {
    constructor(setQuestion) {
        this.setQuestion = setQuestion;
        this.questionsCache = [];
        this.currentIndex = 0;
    }

    async fetchQuestions() {
        if (this.questionsCache.length === 0) {
            this.questionsCache = await this.generateQuestions();
            this.currentIndex = 0;
        }

        const { answers, correct } = this.getNextQuestion();
        this.setQuestion({ answers, correct });
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
        LIMIT 40`;

        try {
            const response = await fetch(WikidataUrl + "?query=" + encodeURIComponent(sparqlQuery) + "&format=json", {
                headers: { 'Accept': 'application/sparql-results+json' }
            });
            const data = await response.json();

            return data.results.bindings.map(item => ({
                city: item.cityLabel.value,
                image: item.image.value
            }));
        } catch (error) {
            console.error("Error fetching data:", error);
            return [];
        }
    }

    getNextQuestion() {
        if (this.currentIndex + 4 > this.questionsCache.length) {
            console.warn("Recargando preguntas...");
            this.questionsCache = [];
            this.fetchQuestions();
            return { answers: {}, correct: null };
        }

        let options = this.questionsCache.slice(this.currentIndex, this.currentIndex + 4);
        this.currentIndex += 4;

        let correctCity = options[Math.floor(Math.random() * options.length)];

        let answers = options.reduce((acc, item) => {
            acc[item.city] = item.image;
            return acc;
        }, {});

        return { answers, correct: correctCity.city };
    }
}

export default QuestionGeneration;
