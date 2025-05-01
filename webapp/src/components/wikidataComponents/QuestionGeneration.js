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
            if (this.questionsCache.length < this.currentIndex + 4) {
                this.questionsCache = await this.generateAndShuffleQuestions();
                this.currentIndex = 0;
            }

            if (this.questionsCache.length >= this.currentIndex + 4) {
                const question = this.getNextQuestion();
                if (question) {
                    this.setQuestion(question);
                } else {
                     this.setQuestion(null);
                }
            } else {
                 this.setQuestion(null);
            }
        } catch (error) {
            console.error("Error fetching questions:", error);
            this.questionsCache = [];
            this.currentIndex = 0;
            this.setQuestion(null);
        } finally {
            this.isFetching = false;
        }
    }

    async generateAndShuffleQuestions() {
        const WikidataUrl = "https://query.wikidata.org/sparql";
        const sparqlQuery = `
        SELECT DISTINCT ?city ?cityLabel ?image WHERE {
            ?city wdt:P31 wd:Q515.
            ?city wdt:P18 ?image.
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
            FILTER(STRSTARTS(STR(?image), "http"))
        }
        LIMIT 100`;

        try {
            const response = await fetch(`${WikidataUrl}?query=${encodeURIComponent(sparqlQuery)}&format=json`, {
                headers: { 'Accept': 'application/sparql-results+json' }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            let processedResults = data.results.bindings
                .filter(item => item.image?.value && item.cityLabel?.value)
                .map(item => ({
                    city: item.cityLabel.value,
                    image: item.image.value
                }));

             processedResults = Array.from(new Map(processedResults.map(item => [item.city, item])).values());

            this.shuffleArray(processedResults);

            return processedResults;

        } catch (error) {
            console.error("Error fetching or processing Wikidata results:", error);
            return [];
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.getSecureRandom(i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    getSecureRandom(max) {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return Math.floor((array[0] / (0xFFFFFFFF + 1)) * max);
    }

    getNextQuestion() {
        if (!this.questionsCache || this.currentIndex + 4 > this.questionsCache.length) {
            return null;
        }

        const options = this.questionsCache.slice(this.currentIndex, this.currentIndex + 4);
        this.currentIndex += 4;

        const randomIndex = this.getSecureRandom(options.length);
        const correctOption = options[randomIndex];

        const question = {
            answers: options.reduce((acc, item) => {
                acc[item.city] = item.image;
                return acc;
            }, {}),
            correct: correctOption.city
        };

        return question;
    }
}

export default QuestionGeneration;