class BuruakaGame {
    constructor() {
        this.students = [];
        this.currentStudent = null;
        this.availableStudents = [];
        this.filteredStudents = [];
        this.score = 0;
        this.hintsUsed = 0;
        this.guessAttempts = 0;
        this.currentZoom = 8;
        this.zoomLevels = [12, 25, 55, 80, 100];
        this.currentZoomIndex = 0;
        this.randomOffsetX = 0;
        this.randomOffsetY = 0;
        
        this.init();
    }

    async init() {
        // Load game settings from localStorage
        const gameSettings = localStorage.getItem('gameSettings');
        if (!gameSettings) {
            alert('No game settings found! Redirecting to home page.');
            window.location.href = 'index.html';
            return;
        }

        const settings = JSON.parse(gameSettings);
        this.students = settings.allStudents;
        this.availableStudents = settings.availableStudents;

        console.log('Game initialized with', this.availableStudents.length, 'students');
        
        this.setupEventListeners();
        this.startNewRound();
    }

    setupEventListeners() {
        // Game page
        document.getElementById('homeButton').addEventListener('click', () => this.goHome());
        document.getElementById('hintButton').addEventListener('click', () => this.useHint());
        document.getElementById('skipButton').addEventListener('click', () => this.skipRound());
        
        // Result page
        document.getElementById('homeButtonResult').addEventListener('click', () => this.goHome());
        document.getElementById('nextRoundButton').addEventListener('click', () => this.nextRound());
        
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.selectFirstMatch();
            }
        });
        
        // Click outside to close dropdown
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideDropdown();
            }
        });
    }

    async startNewRound() {
        // Reset round variables
        this.hintsUsed = 0;
        this.guessAttempts = 0;
        this.currentZoomIndex = 0;
        this.currentZoom = this.zoomLevels[0];
        
        // Pick random student
        this.currentStudent = this.availableStudents[Math.floor(Math.random() * this.availableStudents.length)];
        
        // Reset filtered students for dropdown
        this.filteredStudents = [...this.availableStudents];
        
        // Generate random zoom position (async because it checks pixels)
        await this.generateRandomZoomPosition();
        
        // Update UI
        this.updateGameImage();
        this.updateHintButton();
        document.getElementById('searchInput').value = '';
        this.hideDropdown();
        this.showPage('gamePage');
    }

    async generateRandomZoomPosition() {
        // Create a temporary image to check pixel transparency
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        return new Promise((resolve) => {
            img.onload = () => {
                // Create canvas to read pixel data
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                
                try {
                    ctx.drawImage(img, 0, 0);
                    
                    let attempts = 0;
                    const maxAttempts = 50;
                    
                    while (attempts < maxAttempts) {
                        // Generate random position
                        const x = Math.floor(Math.random() * img.width);
                        const y = Math.floor(Math.random() * img.height);
                        
                        // Get pixel data at this position
                        const pixelData = ctx.getImageData(x, y, 1, 1).data;
                        const alpha = pixelData[3]; // Alpha channel
                        
                        // If pixel is not transparent (alpha > 0)
                        if (alpha > 0) {
                            // Convert pixel position to percentage
                            this.randomOffsetX = (x / img.width - 0.5) * 60; // -30% to +30%
                            this.randomOffsetY = (y / img.height - 0.5) * 60; // -30% to +30%
                            resolve();
                            return;
                        }
                        
                        attempts++;
                    }
                    
                    // Fallback if no non-transparent pixel found
                    console.warn('Could not find non-transparent pixel, using center');
                    this.randomOffsetX = 0;
                    this.randomOffsetY = 0;
                    resolve();
                    
                } catch (error) {
                    // CORS error or other issues - use center as fallback
                    console.warn('Could not analyze image pixels due to CORS, using center');
                    this.randomOffsetX = 0;
                    this.randomOffsetY = 0;
                    resolve();
                }
            };
            
            img.onerror = () => {
                // Error loading image - use center as fallback
                console.warn('Error loading image for pixel analysis, using center');
                this.randomOffsetX = 0;
                this.randomOffsetY = 0;
                resolve();
            };
            
            img.src = this.currentStudent.portrait;
        });
    }

    updateGameImage() {
        const gameImage = document.getElementById('gameImage');
        
        gameImage.style.backgroundImage = `url(${this.currentStudent.portrait})`;
        
        // If it's the final hint (100%), show the complete image
        if (this.currentZoom === 100) {
            gameImage.style.backgroundSize = 'contain';
            gameImage.style.backgroundPosition = 'center';
            gameImage.style.backgroundRepeat = 'no-repeat';
        } else {
            // Normal zoom behavior
            const scale = this.currentZoom / 100;
            gameImage.style.backgroundSize = `${100/scale}%`;
            gameImage.style.backgroundPosition = `${50 + this.randomOffsetX}% ${50 + this.randomOffsetY}%`;
            gameImage.style.backgroundRepeat = 'no-repeat';
        }
        
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
        } else {
            hintButton.disabled = false;
            hintButton.style.opacity = '1';
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
        this.startNewRound();
    }

    goHome() {
        // Clear localStorage
        localStorage.removeItem('gameSettings');
        // Redirect to home page
        window.location.href = 'index.html';
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
    new BuruakaGame();
});
