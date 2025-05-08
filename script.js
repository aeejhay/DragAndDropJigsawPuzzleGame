class JigsawPuzzle {
    constructor() {
        this.imageUpload = document.getElementById('imageUpload');
        this.pieceCount = document.getElementById('pieceCount');
        this.startButton = document.getElementById('startGame');
        this.stopButton = document.getElementById('stopTime');
        this.resetButton = document.getElementById('resetGame');
        this.puzzleArea = document.getElementById('puzzleArea');
        this.piecesArea = document.getElementById('piecesArea');
        this.winMessage = document.getElementById('winMessage');
        this.finalTime = document.getElementById('finalTime');
        this.playAgainButton = document.getElementById('playAgain');
        this.timerDisplay = document.getElementById('time');

        this.image = null;
        this.pieces = [];
        this.correctPieces = 0;
        this.timer = null;
        this.seconds = 0;
        this.rows = 0;
        this.cols = 0;
        this.maxWidth = 800;
        this.maxHeight = 600;
        this.isGameStarted = false;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.startButton.addEventListener('click', () => this.startGame());
        this.stopButton.addEventListener('click', () => this.stopTime());
        this.playAgainButton.addEventListener('click', () => this.resetGame());
        this.resetButton.addEventListener('click', () => this.resetGame());
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.image = new Image();
                this.image.onload = () => {
                    this.startButton.disabled = false;
                    this.resetButton.disabled = false;
                    this.scaleImageToFit();
                };
                this.image.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    scaleImageToFit() {
        const scaleX = this.maxWidth / this.image.width;
        const scaleY = this.maxHeight / this.image.height;
        const scale = Math.min(scaleX, scaleY);

        this.scaledWidth = Math.floor(this.image.width * scale);
        this.scaledHeight = Math.floor(this.image.height * scale);

        this.puzzleArea.style.width = `${this.scaledWidth}px`;
        this.puzzleArea.style.height = `${this.scaledHeight}px`;
    }

    startGame() {
        if (!this.image) return;

        this.resetGame();
        this.calculateGrid();
        this.createPuzzlePieces();
        this.startTimer();
        this.isGameStarted = true;
        this.stopButton.disabled = false;
    }

    calculateGrid() {
        const totalPieces = parseInt(this.pieceCount.value);
        
        // Calculate rows and columns based on the total pieces
        if (totalPieces <= 16) {
            // For 12 and 16 pieces, use 4 columns
            this.cols = 4;
            this.rows = Math.ceil(totalPieces / this.cols);
        } else if (totalPieces <= 30) {
            // For 20-30 pieces, use 5 columns
            this.cols = 5;
            this.rows = Math.ceil(totalPieces / this.cols);
        } else if (totalPieces <= 48) {
            // For 36-48 pieces, use 6 columns
            this.cols = 6;
            this.rows = Math.ceil(totalPieces / this.cols);
        } else {
            // For 56 pieces, use 7 columns
            this.cols = 7;
            this.rows = Math.ceil(totalPieces / this.cols);
        }
    }

    createPuzzlePieces() {
        const pieceWidth = this.scaledWidth / this.cols;
        const pieceHeight = this.scaledHeight / this.rows;

        // Clear any existing pieces
        this.piecesArea.innerHTML = '';
        this.pieces = [];

        // Calculate the center position of the game container
        const gameContainer = this.puzzleArea.parentElement;
        const containerRect = gameContainer.getBoundingClientRect();
        const puzzleRect = this.puzzleArea.getBoundingClientRect();

        // Calculate the offset to center the puzzle
        const offsetX = (containerRect.width - this.scaledWidth) / 2;
        const offsetY = (containerRect.height - this.scaledHeight) / 2;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                // Skip if we've created enough pieces
                if (this.pieces.length >= parseInt(this.pieceCount.value)) {
                    break;
                }

                const piece = document.createElement('div');
                piece.className = 'puzzle-piece';
                piece.style.width = `${pieceWidth}px`;
                piece.style.height = `${pieceHeight}px`;
                piece.style.backgroundImage = `url(${this.image.src})`;
                piece.style.backgroundSize = `${this.scaledWidth}px ${this.scaledHeight}px`;
                piece.style.backgroundPosition = `-${col * pieceWidth}px -${row * pieceHeight}px`;

                // Set initial random position within the game container
                const maxX = containerRect.width - pieceWidth;
                const maxY = containerRect.height - pieceHeight;
                
                const randomX = Math.random() * maxX;
                const randomY = Math.random() * maxY;
                piece.style.left = `${randomX}px`;
                piece.style.top = `${randomY}px`;

                // Store correct position with offset
                piece.dataset.correctX = offsetX + (col * pieceWidth);
                piece.dataset.correctY = offsetY + (row * pieceHeight);
                piece.dataset.row = row;
                piece.dataset.col = col;

                this.makePieceDraggable(piece);
                this.piecesArea.appendChild(piece);
                this.pieces.push(piece);
            }
        }
    }

    makePieceDraggable(piece) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const dragStart = (e) => {
            if (piece.classList.contains('correct') || !this.isGameStarted) return;
            
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX;
                initialY = e.touches[0].clientY;
            } else {
                initialX = e.clientX;
                initialY = e.clientY;
            }

            const rect = piece.getBoundingClientRect();
            xOffset = initialX - rect.left;
            yOffset = initialY - rect.top;
            
            isDragging = true;
            piece.style.zIndex = '1000';
            piece.classList.add('dragging');
        };

        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            let currentX, currentY;

            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX;
                currentY = e.touches[0].clientY;
            } else {
                currentX = e.clientX;
                currentY = e.clientY;
            }

            const newX = currentX - xOffset;
            const newY = currentY - yOffset;

            // Constrain the piece within the game container
            const gameContainer = this.puzzleArea.parentElement;
            const containerRect = gameContainer.getBoundingClientRect();
            const pieceRect = piece.getBoundingClientRect();

            const maxX = containerRect.width - pieceRect.width;
            const maxY = containerRect.height - pieceRect.height;

            const constrainedX = Math.max(0, Math.min(newX, maxX));
            const constrainedY = Math.max(0, Math.min(newY, maxY));

            piece.style.left = `${constrainedX}px`;
            piece.style.top = `${constrainedY}px`;

            this.checkPiecePosition(piece);
        };

        const dragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            piece.style.zIndex = '1';
            piece.classList.remove('dragging');
        };

        piece.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        piece.addEventListener('touchstart', dragStart);
        document.addEventListener('touchmove', drag);
        document.addEventListener('touchend', dragEnd);
    }

    checkPiecePosition(piece) {
        if (piece.classList.contains('correct')) return;

        const rect = piece.getBoundingClientRect();
        const puzzleRect = this.puzzleArea.getBoundingClientRect();
        
        const correctX = parseInt(piece.dataset.correctX);
        const correctY = parseInt(piece.dataset.correctY);
        
        const currentX = rect.left - puzzleRect.left;
        const currentY = rect.top - puzzleRect.top;

        const threshold = 20; // Snap threshold in pixels

        if (Math.abs(currentX - correctX) < threshold && 
            Math.abs(currentY - correctY) < threshold) {
            
            // Snap to correct position
            piece.style.left = `${correctX}px`;
            piece.style.top = `${correctY}px`;
            piece.classList.add('correct');
            
            // Add a small animation
            piece.style.transform = 'scale(1.05)';
            setTimeout(() => {
                piece.style.transform = 'scale(1)';
            }, 200);
        }
    }

    startTimer() {
        this.seconds = 0;
        this.timer = setInterval(() => {
            this.seconds++;
            const minutes = Math.floor(this.seconds / 60);
            const remainingSeconds = this.seconds % 60;
            this.timerDisplay.textContent = 
                `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    handleWin() {
        clearInterval(this.timer);
        this.finalTime.textContent = this.timerDisplay.textContent;
        this.winMessage.classList.remove('hidden');
        this.isGameStarted = false;
    }

    stopTime() {
        if (!this.isGameStarted) return;
        
        clearInterval(this.timer);
        this.finalTime.textContent = this.timerDisplay.textContent;
        this.winMessage.classList.remove('hidden');
        this.isGameStarted = false;
        this.stopButton.disabled = true;
    }

    resetGame() {
        clearInterval(this.timer);
        this.piecesArea.innerHTML = '';
        this.pieces = [];
        this.correctPieces = 0;
        this.seconds = 0;
        this.timerDisplay.textContent = '00:00';
        this.winMessage.classList.add('hidden');
        this.startButton.disabled = !this.image;
        this.stopButton.disabled = true;
        this.resetButton.disabled = !this.image;
        this.isGameStarted = false;
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new JigsawPuzzle();
}); 