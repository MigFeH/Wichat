import axios from 'axios';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8001';

const saveStats = async (username, score, correctAnswers, incorrectAnswers, totalRounds) => {
  try {
    const response = await axios.post(`${apiEndpoint}/api/stats`, {
      username,
      score,
      correctAnswers,
      incorrectAnswers,
      totalRounds
    });
    console.log('Statistics saved:', response.data);
  } catch (error) {
    console.error('Failed to save statistics:', error);
  }
};

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
        const WikidataUrl = "https://query.wikidata.org/sparql";
        const sparqlQuery = `
        SELECT DISTINCT ?city ?cityLabel ?image WHERE {
            ?city wdt:P31 wd:Q515.
            ?city wdt:P18 ?image.
            SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
            FILTER(CONTAINS(STR(?image), "http"))
        }
        ORDER BY RAND()
        LIMIT 40`;

        try {
            const response = await fetch(`${WikidataUrl}?query=${encodeURIComponent(sparqlQuery)}&format=json`, {
                headers: { 'Accept': 'application/sparql-results+json' }
            });
            const data = await response.json();
            
            return data.results.bindings
                .filter(item => item.image?.value)
                .map(item => ({
                    city: item.cityLabel.value,
                    image: item.image.value
                }));
        } catch (error) {
            console.error("API Error:", error);
            return [];
        }
    }

    getNextQuestion() {
        if (!this.questionsCache.length || this.currentIndex + 4 > this.questionsCache.length) {
            this.questionsCache = [];
            return null;
        }

        const options = this.questionsCache.slice(this.currentIndex, this.currentIndex + 4);
        this.currentIndex += 4;
        const correctCity = options[Math.floor(Math.random() * options.length)];

        return {
            answers: options.reduce((acc, item) => {
                acc[item.city] = item.image;
                return acc;
            }, {}),
            correct: correctCity.city
        };
    }
}

export default QuestionGeneration;