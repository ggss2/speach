let synth = window.speechSynthesis;
let voices = [];
let currentWord = {};
let words = [];
let score = 0;
let attempts = 0;
const maxAttempts = 3;
const maxScore = 100;

document.addEventListener('DOMContentLoaded', function () {
    loadVocabulary();
    populateVoiceList();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = populateVoiceList;
    }

    document.getElementById('read-word-btn').addEventListener('click', startGame);
    document.getElementById('rate').addEventListener('input', function () {
        document.getElementById('rate-value').textContent = this.value;
    });
});

function loadVocabulary() {
    fetch('vocabulary.csv')
        .then(response => response.text())
        .then(data => {
            words = parseCSV(data);
            console.log('Parsed Words:', words); // Debugging log
            if (words.length > 0) {
                displayNextWord();
            } else {
                alert('No words available. Please check the CSV file.');
            }
        })
        .catch(error => {
            console.error('Error loading vocabulary:', error);
            alert('Failed to load vocabulary. Please try again later.');
        });
}

function parseCSV(data) {
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const parsedData = lines.slice(1).map(line => {
        const [english, korean] = line.split(',').map(item => item.trim());
        if (english && korean) {
            return { english, korean };
        }
        return null;
    }).filter(item => item !== null);

    console.log('Parsed CSV:', parsedData); // Debugging log
    return parsedData;
}

function displayNextWord() {
    if (score >= maxScore) {
        endGame();
        return;
    }
    attempts = 0; // Reset attempts
    currentWord = words[Math.floor(Math.random() * words.length)];
    const wordCard = document.getElementById('word-card');
    wordCard.innerHTML = `<p>${currentWord.english} - ${currentWord.korean}</p>`;
    console.log('Displaying Word:', currentWord); // Debugging log
}

function startGame() {
    if (!synth.speaking) {
        speakWordNTimes(currentWord.english, 3);
    }
}

function speakWordNTimes(word, times) {
    let count = 0;
    function speak() {
        if (count < times) {
            const utterance = new SpeechSynthesisUtterance(word);
            const selectedVoice = document.getElementById('voice-select').selectedOptions[0]?.getAttribute('data-name');
            utterance.voice = voices.find(voice => voice.name === selectedVoice) || voices[0];
            utterance.rate = parseFloat(document.getElementById('rate').value);

            utterance.onerror = function (event) {
                console.error('SpeechSynthesisUtterance.onerror', event);
            };

            utterance.onend = function () {
                count++;
                if (count < times) {
                    speak(); // Continue speaking until the count is reached
                } else {
                    setTimeout(startSpeechRecognition, 1000); // Start recognition after delay
                }
            };

            synth.speak(utterance);
        }
    }
    speak();
}

function startSpeechRecognition() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = function (event) {
            const finalTranscript = event.results[0][0].transcript.trim().toLowerCase();
            const voiceInputBox = document.getElementById('voice-input-box');
            voiceInputBox.textContent = finalTranscript;

            if (finalTranscript === currentWord.english.toLowerCase()) {
                score += 2;
                updateScore();
                setTimeout(() => {
                    displayNextWord();
                }, 2000);
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    voiceInputBox.textContent = `No more attempts! Moving to next word.`;
                    setTimeout(() => {
                        displayNextWord();
                    }, 2000);
                } else {
                    voice
