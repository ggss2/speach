let synth = window.speechSynthesis;
let voices = [];
let currentWord = '';
let words = [];

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function () {
    // Load vocabulary
    loadVocabulary();

    // Populate voice list
    populateVoiceList();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = populateVoiceList;
    }

    // Set up event listeners
    document.getElementById('read-word-btn').addEventListener('click', readWordAloud);
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
    if (words.length > 0) {
        currentWord = words[Math.floor(Math.random() * words.length)].english;
        const wordCard = document.getElementById('word-card');
        wordCard.textContent = currentWord;
        console.log('Displaying Word:', currentWord); // Debugging log
    } else {
        console.error('No words available to display.');
    }
}

function readWordAloud() {
    if (currentWord) {
        const utterance = new SpeechSynthesisUtterance(currentWord);
        const selectedVoice = document.getElementById('voice-select').selectedOptions[0]?.getAttribute('data-name');
        utterance.voice = voices.find(voice => voice.name === selectedVoice) || voices[0];
        utterance.rate = parseFloat(document.getElementById('rate').value);
        
        utterance.onerror = function (event) {
            console.error('SpeechSynthesisUtterance.onerror', event);
        };

        console.log('Reading Aloud:', currentWord); // Debugging log
        synth.speak(utterance);
    } else {
        console.error('No word to read aloud.');
    }
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
