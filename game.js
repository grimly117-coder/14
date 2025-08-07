// Конфигурация игры (можно менять)
const config = {
    // Пути к текстурам (можно заменить на свои)
    textures: {
        background: 'bg.png',
        doodler: 'doodler.png',
        coin: 'coin.png',
        bonus: 'bonus.png',
        trap: 'trap.png'
    },
    // Настройки физики
    gravity: 0.4,
    jumpForce: 12,
    moveSpeed: 5,
    // Настройки генерации
    platformCount: 10,
    coinChance: 0.3,
    bonusChance: 0.1,
    trapChance: 0.2,
    blackHoleChance: 0.1,
    // Размеры элементов
    doodlerWidth: 40,
    doodlerHeight: 60,
    platformWidth: 70,
    platformHeight: 16,
    coinSize: 20,
    bonusSize: 30,
    trapSize: 40,
    blackHoleSize: 50
};

// Инициализация игры
document.addEventListener("DOMContentLoaded", function() {
    // Получаем элементы DOM
    const gameContainer = document.getElementById('game-container');
    const gameBg = document.getElementById('game-bg');
    const gameElements = document.getElementById('game-elements');
    const doodler = document.createElement('div');
    doodler.id = 'doodler';
    gameElements.appendChild(doodler);
    
    const scoreDisplay = document.getElementById('score-display');
    const highScoreDisplay = document.getElementById('high-score-display');
    const finalScoreDisplay = document.getElementById('final-score');
    const finalHighScoreDisplay = document.getElementById('final-high-score');
    const gameOverScreen = document.getElementById('game-over');
    const restartBtn = document.getElementById('restart-btn');
    
    // Управление
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    
    // Загрузка текстур
    gameBg.style.backgroundImage = `url(${config.textures.background})`;
    doodler.style.backgroundImage = `url(${config.textures.doodler})`;
    doodler.style.width = `${config.doodlerWidth}px`;
    doodler.style.height = `${config.doodlerHeight}px`;
    
    // Игровые переменные
    let doodlerX = window.innerWidth / 2 - config.doodlerWidth / 2;
    let doodlerY = window.innerHeight - 150;
    let doodlerVelocityX = 0;
    let doodlerVelocityY = 0;
    let isJumping = false;
    let isFalling = false;
    let platforms = [];
    let coins = [];
    let bonuses = [];
    let traps = [];
    let blackHoles = [];
    let score = 0;
    let highScore = localStorage.getItem('doodleJumpHighScore') || 0;
    let gameRunning = true;
    let keysPressed = { left: false, right: false };
    
    // Инициализация игры
    function initGame() {
        // Сброс переменных
        doodlerX = window.innerWidth / 2 - config.doodlerWidth / 2;
        doodlerY = window.innerHeight - 150;
        doodlerVelocityX = 0;
        doodlerVelocityY = 0;
        isJumping = false;
        isFalling = false;
        score = 0;
        gameRunning = true;
        
        // Очистка элементов
        gameElements.innerHTML = '';
        gameElements.appendChild(doodler);
        platforms = [];
        coins = [];
        bonuses = [];
        traps = [];
        blackHoles = [];
        
        // Создание начальных платформ
        createInitialPlatforms();
        
        // Обновление интерфейса
        updateScore();
        highScoreDisplay.textContent = `Рекорд: ${highScore}`;
        gameOverScreen.style.display = 'none';
        
        // Запуск игрового цикла
        requestAnimationFrame(gameLoop);
    }
    
    // Создание начальных платформ
    function createInitialPlatforms() {
        // Первая платформа под персонажем
        createPlatform(
            window.innerWidth / 2 - config.platformWidth / 2,
            window.innerHeight - 100,
            'normal'
        );
        
        // Остальные платформы
        for (let i = 1; i < config.platformCount; i++) {
            createRandomPlatform(i);
        }
    }
    
    // Создание случайной платформы
    function createRandomPlatform(index) {
        const types = ['normal', 'breakable', 'moving'];
        const weights = [0.7, 0.2, 0.1]; // Вероятности для каждого типа
        const type = weightedRandom(types, weights);
        
        let x = Math.random() * (window.innerWidth - config.platformWidth);
        let y = platforms[index-1].y - 150 + Math.random() * 50;
        
        createPlatform(x, y, type);
    }
    
    // Взвешенный случайный выбор
    function weightedRandom(items, weights) {
        let totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        let weightSum = 0;
        
        for (let i = 0; i < items.length; i++) {
            weightSum += weights[i];
            if (random <= weightSum) return items[i];
        }
        
        return items[0];
    }
    
    // Создание платформы
    function createPlatform(x, y, type) {
        const platform = document.createElement('div');
        platform.className = `platform ${type}`;
        platform.style.left = `${x}px`;
        platform.style.top = `${y}px`;
        platform.style.width = `${config.platformWidth}px`;
        platform.style.height = `${config.platformHeight}px`;
        gameElements.appendChild(platform);
        
        const platformObj = {
            element: platform,
            x: x,
            y: y,
            width: config.platformWidth,
            height: config.platformHeight,
            type: type,
            moveDirection: type === 'moving' ? (Math.random() > 0.5 ? 1 : -1) : 0
        };
        
        platforms.push(platformObj);
        
        // Создание монет и бонусов на платформах
        if (type !== 'breakable' && Math.random() < config.coinChance) {
            createCoin(x + config.platformWidth/2 - config.coinSize/2, y - config.coinSize - 5);
        }
        
        if (type === 'normal' && Math.random() < config.bonusChance) {
            createBonus(x + config.platformWidth/2 - config.bonusSize/2, y - config.bonusSize - 5);
        }
        
        if (type === 'normal' && Math.random() < config.trapChance) {
            createTrap(x + config.platformWidth/2 - config.trapSize/2, y - config.trapSize - 5);
        }
        
        if (Math.random() < config.blackHoleChance && platforms.length > 3) {
            createBlackHole(
                Math.random() * (window.innerWidth - config.blackHoleSize),
                y - 100 - Math.random() * 50
            );
        }
        
        return platformObj;
    }
    
    // Создание монеты
    function createCoin(x, y) {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.style.left = `${x}px`;
        coin.style.top = `${y}px`;
        coin.style.width = `${config.coinSize}px`;
        coin.style.height = `${config.coinSize}px`;
        coin.style.backgroundImage = `url(${config.textures.coin})`;
        gameElements.appendChild(coin);
        
        coins.push({
            element: coin,
            x: x,
            y: y,
            width: config.coinSize,
            height: config.coinSize,
            collected: false
        });
    }
    
    // Создание бонуса
    function createBonus(x, y) {
        const bonus = document.createElement('div');
        bonus.className = 'bonus';
        bonus.style.left = `${x}px`;
        bonus.style.top = `${y}px`;
        bonus.style.width = `${config.bonusSize}px`;
        bonus.style.height = `${config.bonusSize}px`;
        bonus.style.backgroundImage = `url(${config.textures.bonus})`;
        gameElements.appendChild(bonus);
        
        bonuses.push({
            element: bonus,
            x: x,
            y: y,
            width: config.bonusSize,
            height: config.bonusSize,
            collected: false
        });
    }
    
    // Создание ловушки
    function createTrap(x, y) {
        const trap = document.createElement('div');
        trap.className = 'trap';
        trap.style.left = `${x}px`;
        trap.style.top = `${y}px`;
        trap.style.width = `${config.trapSize}px`;
        trap.style.height = `${config.trapSize}px`;
        trap.style.backgroundImage = `url(${config.textures.trap})`;
        gameElements.appendChild(trap);
        
        traps.push({
            element: trap,
            x: x,
            y: y,
            width: config.trapSize,
            height: config.trapSize,
            active: true
        });
    }
    
    // Создание черной дыры
    function createBlackHole(x, y) {
        const blackHole = document.createElement('div');
        blackHole.className = 'black-hole';
        blackHole.style.left = `${x}px`;
        blackHole.style.top = `${y}px`;
        blackHole.style.width = `${config.blackHoleSize}px`;
        blackHole.style.height = `${config.blackHoleSize}px`;
        gameElements.appendChild(blackHole);
        
        blackHoles.push({
            element: blackHole,
            x: x,
            y: y,
            width: config.blackHoleSize,
            height: config.blackHoleSize,
            rotation: 0
        });
    }
    
    // Прыжок
    function jump() {
        if (isJumping) return;
        isJumping = true;
        isFalling = false;
        doodlerVelocityY = config.jumpForce;
    }
    
    // Проверка столкновений
    function checkCollisions() {
        // Столкновение с платформами
        let onPlatform = false;
        
        platforms.forEach((platform, index) => {
            // Движение подвижных платформ
            if (platform.type === 'moving') {
                platform.x += platform.moveDirection * 2;
                platform.element.style.left = `${platform.x}px`;
                
                if (platform.x <= 0 || platform.x >= window.innerWidth - platform.width) {
                    platform.moveDirection *= -1;
                }
            }
            
            // Проверка столкновения
            if (doodlerX + config.doodlerWidth > platform.x && 
                doodlerX < platform.x + platform.width &&
                doodlerY + config.doodlerHeight >= platform.y && 
                doodlerY + config.doodlerHeight <= platform.y + platform.height &&
                doodlerVelocityY <= 0) {
                
                // Разные типы платформ
                if (platform.type === 'breakable') {
                    // Разрушаемая платформа
                    doodlerVelocityY = config.jumpForce * 0.8;
                    platform.element.style.display = 'none';
                    platforms.splice(index, 1);
                } else {
                    // Обычная или подвижная платформа
                    doodlerVelocityY = config.jumpForce;
                    onPlatform = true;
                }
            }
            
            // Регенерация платформ
            if (platform.y > window.innerHeight + 50) {
                platform.element.remove();
                platforms.splice(index, 1);
                createRandomPlatform(platforms.length);
            }
        });
        
        // Столкновение с монетами
        coins.forEach((coin, index) => {
            if (!coin.collected && 
                doodlerX + config.doodlerWidth > coin.x && 
                doodlerX < coin.x + coin.width &&
                doodlerY + config.doodlerHeight > coin.y && 
                doodlerY < coin.y + coin.height) {
                
                coin.collected = true;
                coin.element.remove();
                coins.splice(index, 1);
                score += 10;
                updateScore();
            }
        });
        
        // Столкновение с бонусами
        bonuses.forEach((bonus, index) => {
            if (!bonus.collected && 
                doodlerX + config.doodlerWidth > bonus.x && 
                doodlerX < bonus.x + bonus.width &&
                doodlerY + config.doodlerHeight > bonus.y && 
                doodlerY < bonus.y + bonus.height) {
                
                bonus.collected = true;
                bonus.element.remove();
                bonuses.splice(index, 1);
                doodlerVelocityY = config.jumpForce * 1.5; // Усиленный прыжок
                score += 30;
                updateScore();
            }
        });
        
        // Столкновение с ловушками
        traps.forEach((trap, index) => {
            if (trap.active && 
                doodlerX + config.doodlerWidth > trap.x && 
                doodlerX < trap.x + trap.width &&
                doodlerY + config.doodlerHeight > trap.y && 
                doodlerY < trap.y + trap.height) {
                
                trap.active = false;
                trap.element.remove();
                traps.splice(index, 1);
                gameOver();
            }
        });
        
        // Столкновение с черными дырами
        blackHoles.forEach((hole, index) => {
            hole.rotation += 0.02;
            hole.element.style.transform = `rotate(${hole.rotation}rad)`;
            
            // Проверка расстояния
            const dx = (hole.x + hole.width/2) - (doodlerX + config.doodlerWidth/2);
            const dy = (hole.y + hole.height/2) - (doodlerY + config.doodlerHeight/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < hole.width/2 + config.doodlerWidth/2) {
                // Притяжение
                if (distance < 30) {
                    gameOver();
                } else {
                    const pullForce = 0.5 * (1 - distance/100);
                    doodlerX += dx * 0.05 * pullForce;
                    doodlerY += dy * 0.05 * pullForce;
                }
            }
            
            // Регенерация черных дыр
            if (hole.y > window.innerHeight + 100) {
                hole.element.remove();
                blackHoles.splice(index, 1);
            }
        });
        
        return onPlatform;
    }
    
    // Обновление счета
    function updateScore() {
        scoreDisplay.textContent = score;
        
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('doodleJumpHighScore', highScore);
            highScoreDisplay.textContent = `Рекорд: ${highScore}`;
        }
    }
    
    // Конец игры
    function gameOver() {
        gameRunning = false;
        finalScoreDisplay.textContent = `Очки: ${score}`;
        finalHighScoreDisplay.textContent = `Рекорд: ${highScore}`;
        gameOverScreen.style.display = 'flex';
    }
    
    // Игровой цикл
    function gameLoop() {
        if (!gameRunning) return;
        
        // Применение гравитации
        if (!checkCollisions()) {
            doodlerVelocityY -= config.gravity;
        }
        
        // Движение персонажа
        if (keysPressed.left && doodlerX > 0) {
            doodlerVelocityX = -config.moveSpeed;
        } else if (keysPressed.right && doodlerX < window.innerWidth - config.doodlerWidth) {
            doodlerVelocityX = config.moveSpeed;
        } else {
            doodlerVelocityX = 0;
        }
        
        doodlerX += doodlerVelocityX;
        doodlerY -= doodlerVelocityY;
        
        // Проверка границ экрана
        if (doodlerX < 0) doodlerX = window.innerWidth - config.doodlerWidth;
        if (doodlerX > window.innerWidth - config.doodlerWidth) doodlerX = 0;
        
        // Обновление позиции персонажа
        doodler.style.left = `${doodlerX}px`;
        doodler.style.top = `${doodlerY}px`;
        
        // Смещение платформ вниз, если персонаж поднялся выше середины экрана
        if (doodlerY < window.innerHeight / 3) {
            const delta = window.innerHeight / 3 - doodlerY;
            doodlerY = window.innerHeight / 3;
            
            // Смещаем все элементы вниз
            platforms.forEach(platform => {
                platform.y += delta;
                platform.element.style.top = `${platform.y}px`;
            });
            
            coins.forEach(coin => {
                coin.y += delta;
                coin.element.style.top = `${coin.y}px`;
            });
            
            bonuses.forEach(bonus => {
                bonus.y += delta;
                bonus.element.style.top = `${bonus.y}px`;
            });
            
            traps.forEach(trap => {
                trap.y += delta;
                trap.element.style.top = `${trap.y}px`;
            });
            
            blackHoles.forEach(hole => {
                hole.y += delta;
                hole.element.style.top = `${hole.y}px`;
            });
            
            // Увеличиваем счет
            score += Math.floor(delta / 5);
            updateScore();
        }
        
        // Проверка падения
        if (doodlerY > window.innerHeight) {
            gameOver();
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    // Обработчики управления
    leftBtn.addEventListener('touchstart', () => { keysPressed.left = true; });
    leftBtn.addEventListener('touchend', () => { keysPressed.left = false; });
    leftBtn.addEventListener('mousedown', () => { keysPressed.left = true; });
    leftBtn.addEventListener('mouseup', () => { keysPressed.left = false; });
    
    rightBtn.addEventListener('touchstart', () => { keysPressed.right = true; });
    rightBtn.addEventListener('touchend', () => { keysPressed.right = false; });
    rightBtn.addEventListener('mousedown', () => { keysPressed.right = true; });
    rightBtn.addEventListener('mouseup', () => { keysPressed.right = false; });
    
    // Обработчики клавиатуры для тестирования
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') keysPressed.left = true;
        if (e.key === 'ArrowRight') keysPressed.right = true;
        if (e.key === ' ') jump();
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') keysPressed.left = false;
        if (e.key === 'ArrowRight') keysPressed.right = false;
    });
    
    // Кнопка рестарта
    restartBtn.addEventListener('click', initGame);
    
    // Начало игры
    initGame();
});