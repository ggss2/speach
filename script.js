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

    if (currentWord) {
        wordCard.innerHTML = `
            <p class="english-word">${currentWord.english}</p>
            <p class="korean-word">${currentWord.korean}</p>
        `;
        document.getElementById('result').textContent = '';
        document.getElementById('voice-input-box').innerHTML = '<p>정답을 말해보세요</p>';
        document.getElementById('question-number').textContent = `Question ${questionNumber}`;

        // Speak the word 3 times
        speakWordNTimes(currentWord.english, 3);
    } else {
        console.error('Failed to retrieve the next word.');
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function checkAnswer(transcript) {
    const resultElement = document.getElementById('result');

    if (transcript.toLowerCase().includes(currentWord.english.toLowerCase())) {
        resultElement.textContent = '정답입니다!';
        resultElement.style.color = 'green';
        score += 2;
        playAudio('correct-audio');

        setTimeout(() => {
            questionNumber++;
            nextWord();
        }, 2000); // 2-second delay
    } else {
        resultElement.textContent = '틀렸습니다. 다시 시도하세요.';
        resultElement.style.color = 'red';
        attempts++; // Increment attempts

        if (attempts >= maxAttempts) {
            resultElement.textContent = `기회를 모두 소진했습니다. 다음 문제로 넘어갑니다.`;
            setTimeout(() => {
                questionNumber++;
                nextWord();
            }, 2000); // Wait 2 seconds before moving to next word
        } else {
            playAudio('incorrect-audio');
        }
    }
    updateScore();
}

function updateScore() {
    const scoreDisplay = document.getElementById('score-display');
    const scoreFill = document.getElementById('score-fill');
    scoreDisplay.textContent = `Score: ${score}`;
    scoreFill.style.width = `${(score / 100) * 100}%`;
}

function speakWordNTimes(word, times) {
    let count = 0;
    speaking = true; // Set the flag to indicate speaking is in progress

    function speak() {
        if (count < times) {
            const utterance = new SpeechSynthesisUtterance(word);
            const selectedVoice = document.getElementById('voice-select').selectedOptions[0]?.getAttribute('data-name');
            // Choose the selected voice or default to the first voice
            utterance.voice = voices.find(voice => voice.name === selectedVoice) || voices[0];
            utterance.rate = parseFloat(document.getElementById('rate').value);

            utterance.onerror = function (event) {
                console.error('SpeechSynthesisUtterance.onerror', event);
                speaking = false; // Reset flag on error
            };

            utterance.onend = function () {
                count++;
                if (count < times) {
                    speak(); // Continue speaking until the count is reached
                } else {
                    // Ensure we move to the next question after all repetitions are done
                    setTimeout(() => {
                        speaking = false; // Reset the speaking flag
                        startSpeechRecognition(); // Restart recognition after speech
                    }, 1000); // Small delay to transition smoothly
                }
            };

            synth.speak(utterance);
        }
    }
    speak();
}

function initializeSpeechRecognition() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = function (event) {
            const finalTranscript = event.results[0][0].transcript;
            const voiceInputBox = document.getElementById('voice-input-box');
            voiceInputBox.innerHTML = finalTranscript;
            console.log('User said:', finalTranscript); // Debugging log

            if (!speaking) {
                checkAnswer(finalTranscript);
                recognition.stop();
            }
        };

        recognition.onerror = function (event) {
            console.error('Speech recognition error', event.error);
        };

        recognition.onend = function () {
            console.log('Speech recognition ended. Waiting for user input...');
            if (attempts < maxAttempts) {
                startSpeechRecognition();
            }
        };
    } else {
        console.error('Speech recognition is not supported in this browser.');
        alert('Your browser does not support speech recognition.');
    }
}

function startSpeechRecognition() {
    if (recognition && !speaking) {
        recognition.start();
        console.log('Speech recognition started');
    } else {
        console.error('Speech recognition instance not initialized.');
    }
}

function populateVoiceList() {
    voices = synth.getVoices();
    const voiceSelect = document.getElementById('voice-select');
    voiceSelect.innerHTML = ''; // Clear previous options

    // Add US English voices
    voices.forEach((voice) => {
        if (voice.lang === 'en-US') {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        }
    });

    // Log available voices for debugging
    console.log('Available voices:', voices);

    // Set default voice if not selected
    if (!voiceSelect.value && voices.length > 0) {
        voiceSelect.selectedIndex = 0;
    }
}

function endGame() {
    const wordCard = document.getElementById('word-card');
    wordCard.innerHTML = '<h2>축하합니다! 학습을 완료했습니다.</h2>';
    document.getElementById('voice-input-box').style.display = 'none';
    document.getElementById('voice-input-btn').style.display = 'none';
}

function playAudio(id) {
    const audio = document.getElementById(id);
    audio.play();
}

document.getElementById('voice-input-btn').addEventListener('click', () => {
    if (!synth.speaking && !speaking) {
        startSpeechRecognition();
    }
});

document.getElementById('rate').addEventListener('input', function () {
    document.getElementById('rate-value').textContent = this.value;
});
