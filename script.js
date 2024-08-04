let synth = window.speechSynthesis;
let voices = [];
let currentWord = {};
let words = [];
let score = 0;
let attempts = 0;
let questionNumber = 1;
const maxAttempts = 3;
const maxScore = 100;

document.addEventListener('DOMContentLoaded', function () {
    loadVocabulary();
    populateVoiceList();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = populateVoiceList;
    }

    document.getElementById('next-question-btn').addEventListener('click', displayNextWord);
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
    document.getElementById('question-number').textContent = `Question ${questionNumber}`;
    questionNumber++; // Increment question number
    console.log('Displaying Word:', currentWord); // Debugging log
    speakWordNTimes(currentWord.english, 3); // Automatically start reading the word
}

function speakWordNTimes(word, times) {
    let count = 0;
    document.getElementById('voice-input-box').textContent = '발음을 들어보세요'; // Prompt user to listen
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

        document.getElementById('voice-input-box').textContent = '발음 해보세요'; // Prompt user to speak

        recognition.onresult = function (event) {
            const finalTranscript = event.results[0][0].transcript.trim().toLowerCase();
            const voiceInputBox = document.getElementById('voice-input-box');
            voiceInputBox.textContent = finalTranscript;

                        if (finalTranscript === currentWord.english.toLowerCase()) {
                playAudio('correct-audio');
                score += 2;
                updateScore();
                setTimeout(() => {
                    displayNextWord();
                }, 2000);
            } else {
                playAudio('incorrect-audio');
                attempts++;
                if (attempts >= maxAttempts) {
                    voiceInputBox.textContent = `No more attempts! Moving to next word.`;
                    setTimeout(() => {
                        displayNextWord();
                    }, 2000);
                } else {
                    voiceInputBox.textContent = `Incorrect. Listen again! (${attempts} of ${maxAttempts} attempts)`;
                    speakWordOnce(currentWord.english); // Re-read the word aloud once more
                }
            }
        };

        recognition.onerror = function (event) {
            console.error('Speech recognition error', event.error);
        };

        recognition.onend = function () {
            console.log('Speech recognition ended.');
        };

        recognition.start();
    } else {
        console.error('Speech recognition is not supported in this browser.');
        alert('Your browser does not support speech recognition.');
    }
}

function speakWordOnce(word) {
    const utterance = new SpeechSynthesisUtterance(word);
    const selectedVoice = document.getElementById('voice-select').selectedOptions[0]?.getAttribute('data-name');
    utterance.voice = voices.find(voice => voice.name === selectedVoice) || voices[0];
    utterance.rate = parseFloat(document.getElementById('rate').value);

    document.getElementById('voice-input-box').textContent = '발음을 들어보세요'; // Prompt user to listen again

    utterance.onerror = function (event) {
        console.error('SpeechSynthesisUtterance.onerror', event);
    };

    utterance.onend = function () {
        setTimeout(startSpeechRecognition, 1000); // Restart speech recognition after word is spoken
    };

    synth.speak(utterance);
}

function populateVoiceList() {
    voices = synth.getVoices();
    const voiceSelect = document.getElementById('voice-select');
    voiceSelect.innerHTML = ''; // Clear previous options

    // Add English voices
    voices.forEach((voice) => {
        if (voice.lang.startsWith('en')) { // Include all English voices
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        }
    });

    console.log('Available voices:', voices); // Debugging log

    // Set default voice if not selected
    if (!voiceSelect.value && voices.length > 0) {
        voiceSelect.selectedIndex = 0;
    }
}

function updateScore() {
    const scoreDisplay = document.getElementById('score-display');
    const scoreFill = document.getElementById('score-fill');
    scoreDisplay.textContent = `Score: ${score}`;
    scoreFill.style.width = `${(score / maxScore) * 100}%`;
}

function playAudio(id) {
    const audio = document.getElementById(id);
    if (audio) {
        audio.play();
    }
}

function endGame() {
    const wordCard = document.getElementById('word-card');
    wordCard.innerHTML = '<h2>축하합니다! 학습을 완료했습니다.</h2>';
    document.getElementById('voice-input-box').style.display = 'none';
    document.getElementById('next-question-btn').style.display = 'none';
}

