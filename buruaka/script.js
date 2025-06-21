class BuruakaGuesser {
    constructor() {
        this.students = [];
        this.currentStudent = null;
        this.availableStudents = [];
        this.filteredStudents = [];
        this.score = 0;
        this.hintsUsed = 0;
        this.guessAttempts = 0;
        this.currentZoom = 10;
        this.zoomLevels = [10, 20, 30, 40, 100];
        this.currentZoomIndex = 0;
        this.randomOffsetX = 0;
        this.randomOffsetY = 0;
        
        this.init();
    }

    async init() {
        await this.loadStudents();
        this.setupEventListeners();
        this.showRandomPortrait();
    }

    async loadStudents() {
        try {
            const response = await fetch('./students.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.students = await response.json();
            console.log('Loaded students:', this.students.length);
        } catch (error) {
            console.error('Error loading students.json:', error);
            alert('Could not load students.json file. Please make sure the file exists in the same folder as index.html');
            this.students = [];
        }
    }

    setupEventListeners() {
        // Home page
        document.getElementById('playButton').addEventListener('click', () => this.startGame());
    }

    showRandomPortrait() {
        if (this.students.length === 0) return;
        
        const randomStudent = this.students[Math.floor(Math.random() * this.students.length)];
        const backgroundPortrait = document.querySelector('.background-portrait');
        if (backgroundPortrait) {
            backgroundPortrait.style.backgroundImage = `url(${randomStudent.portrait})`;
        }
    }

    getSelectedRarities() {
        const rarities = [];
        if (document.getElementById('rarity1').checked) rarities.push(1);
        if (document.getElementById('rarity2').checked) rarities.push(2);
        if (document.getElementById('rarity3').checked) rarities.push(3);
        return rarities;
    }

    startGame() {
        const selectedRarities = this.getSelectedRarities();
        if (selectedRarities.length === 0) {
            alert('Please select at least one rarity!');
            return;
        }

        this.availableStudents = this.students.filter(student => 
            selectedRarities.includes(student.rarity)
        );

        if (this.availableStudents.length === 0) {
            alert('No students found with selected rarities!');
            return;
        }

        // Store game settings in localStorage for the game page
        localStorage.setItem('gameSettings', JSON.stringify({
            selectedRarities: selectedRarities,
            availableStudents: this.availableStudents,
            allStudents: this.students
        }));

        // Redirect to game page
        window.location.href = 'guesser.html';
    }

    startNewRound() {
        // Reset round variables
        this.hintsUsed = 0;
        this.guessAttempts = 0;
        this.currentZoomIndex = 0;
        this.currentZoom = this.zoomLevels[0];
        
        // Pick random student
        this.currentStudent = this.availableStudents[Math.floor(Math.random() * this.availableStudents.length)];
        
        // Reset filtered students for dropdown
        this.filteredStudents = [...this.availableStudents];
        
        // Generate random zoom position
        this.generateRandomZoomPosition();
        
        // Update UI
        this.updateGameImage();
        this.updateHintButton();
        document.getElementById('searchInput').value = '';
        this.hideDropdown();
        
        console.log('Current student:', this.currentStudent.name); // Debug
    }

    generateRandomZoomPosition() {
        // Generate random offsets for zoom position
        this.randomOffsetX = Math.random() * 80 - 40; // -40% to +40%
        this.randomOffsetY = Math.random() * 80 - 40; // -40% to +40%
    }

    updateGameImage() {
        const gameImage = document.getElementById('gameImage');
        const scale = this.currentZoom / 100;
        
        gameImage.style.backgroundImage = `url(${this.currentStudent.portrait})`;
        gameImage.style.backgroundSize = `${100/scale}%`;
        gameImage.style.backgroundPosition = `${50 + this.randomOffsetX}% ${50 + this.randomOffsetY}%`;
        gameImage.style.transform = 'none';
    }

    useHint() {
        if (this.hintsUsed >= 4) return;
        
        this.hintsUsed++;
        this.currentZoomIndex++;
        
        if (this.currentZoomIndex < this.zoomLevels.length) {
            this.currentZoom = this.zoomLevels[this.currentZoomIndex];
            this.updateGameImage();
        }
        
        this.updateHintButton();
    }

    updateHintButton() {
        const hintButton = document.getElementById('hintButton');
        const hintsLeft = 4 - this.hintsUsed;
        
        document.getElementById('hintsLeft').textContent = hintsLeft;
        
        if (hintsLeft === 0) {
            hintButton.disabled = true;
            hintButton.style.opacity = '0.5';
        }
    }

    handleSearch(query) {
        if (query.trim() === '') {
            this.hideDropdown();
            return;
        }

        const matches = this.filteredStudents.filter(student =>
            student.name.toLowerCase().includes(query.toLowerCase())
        );

        this.showDropdown(matches);
    }

    showDropdown(matches) {
        const dropdown = document.getElementById('dropdown');
        dropdown.innerHTML = '';

        if (matches.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        matches.forEach(student => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = student.name;
            item.addEventListener('click', () => this.selectStudent(student));
            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    }

    hideDropdown() {
        document.getElementById('dropdown').style.display = 'none';
    }

    selectFirstMatch() {
        const dropdown = document.getElementById('dropdown');
        const firstItem = dropdown.querySelector('.dropdown-item');
        if (firstItem) {
            const studentName = firstItem.textContent;
            const student = this.filteredStudents.find(s => s.name === studentName);
            if (student) {
                this.selectStudent(student);
            }
        }
    }

    selectStudent(student) {
        this.guessAttempts++;
        this.hideDropdown();
        document.getElementById('searchInput').value = '';

        if (student.name === this.currentStudent.name) {
            // Correct guess!
            this.handleCorrectGuess();
        } else {
            // Wrong guess - remove from dropdown
            this.filteredStudents = this.filteredStudents.filter(s => s.name !== student.name);
        }
    }

    handleCorrectGuess() {
        const points = this.calculatePoints();
        this.score += points;
        this.showResult(points);
    }

    calculatePoints() {
        let points = 25; // Base points
        
        // Subtract points for hints used
        points -= this.hintsUsed * 5;
        
        // Add bonus points for guess attempts
        if (this.guessAttempts === 1) {
            points += 10;
        } else if (this.guessAttempts === 2) {
            points += 5;
        }
        // 3+ attempts: no bonus
        
        // Minimum 5 points
        return Math.max(5, points);
    }

    skipRound() {
        this.showResult(0);
    }

    showResult(points) {
        // Update result page
        document.getElementById('pointsEarned').textContent = `+${points} Points`;
        document.getElementById('scoreValue').textContent = this.score;
        
        const resultImage = document.getElementById('resultImage');
        resultImage.style.backgroundImage = `url(${this.currentStudent.portrait})`;
        resultImage.onclick = () => window.open(this.currentStudent.url, '_blank');
        
        document.getElementById('studentName').textContent = this.currentStudent.name;
        
        const rarityStars = '★'.repeat(this.currentStudent.rarity);
        document.getElementById('studentRarity').textContent = rarityStars;
        
        this.showPage('resultPage');
    }

    nextRound() {
        this.showPage('gamePage');
        this.startNewRound();
    }

    goHome() {
        this.score = 0;
        document.getElementById('scoreValue').textContent = '0';
        this.showRandomPortrait();
        this.showPage('homePage');
    }

    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show selected page
        document.getElementById(pageId).classList.add('active');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BuruakaGuesser();
});