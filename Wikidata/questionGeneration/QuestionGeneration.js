class QuestionGeneration {
    constructor() {
        this.fetchQuestions();
    }

    async fetchQuestions() {
        const { answers, correct } = await this.shuffleAnswers();

        document.getElementById("city-image").src = answers[correct];

        const optionsDiv = document.getElementById("options");
        optionsDiv.innerHTML = "";

        Object.keys(answers).forEach(city => {
            let btn = document.createElement("button");
            btn.innerText = city;
            btn.classList.add("option");
            btn.onclick = () => this.checkAnswer(city, correct);
            optionsDiv.appendChild(btn);
        });
    }

    checkAnswer(selected, correct) {
        const resultText = selected === correct ? "Correct! 🎉" : "Wrong! ❌";
        document.getElementById("result").innerText = resultText;
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

        const url = WikidataUrl + "?query=" + encodeURIComponent(sparqlQuery) + "&format=json";

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
        let options = await this.generateQuestions(); // Espera a obtener los datos

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
}

let c = new QuestionGeneration();