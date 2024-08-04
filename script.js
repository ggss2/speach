let words = [];
let currentWord;
let score = 0;
let questionNumber = 1;
let synth = window.speechSynthesis;
let voices = [];
let recognition;
let speaking = false; // Flag to track if speaking is in progress
let attempts = 0; // Number of attempts for current question
const maxAttempts = 3; // Maximum number of attempts per question

document.addEventListener('DOMContentLoaded', function () {
    loadVocabulary();
    initializeSpeechRecognition();

    // Ensure voices are loaded and populate the list
    populateVoiceList();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = populateVoiceList;
    }
});

function loadVocabulary() {
    fetch('vocabulary.csv')
        .then(response => response.text())
        .then(data => {
            words = parseCSV(data);
            console.log('Loaded words:', words); // Debugging log
            if (words.length > 0) {
                nextWord();
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
    // Split the CSV data by new lines and remove any empty lines
    const lines = data.split('\n').filter(line => line.trim() !== '');

    // Map each line to an object with the expected structure
    return lines.slice(1).map(line => {
        const [english, korean] = line.split(',').map(item => item.trim());
        if (english && korean) {
            return { english, korean };
        }
        return null;
    }).filter(item => item !== null);
}

function nextWord() {
    if (score >= 100) {
        endGame();
        return;
    }
    attempts = 0; // Reset attempts for the new word
    currentWord = words[Math.floor(Math.random() * words.length)];
    const wordCard = document.getElementById('word-card');

    wordCard.innerHTML = `
        <p
