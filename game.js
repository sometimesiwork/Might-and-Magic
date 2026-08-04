// Инициализация Three.js сцены для игры в стиле Might and Magic
let scene, camera, renderer;
let player, enemies = [], items = [];
let gameWorld = {};
let playerStats = {
    health: 100,
    maxHealth: 100,
    gold: 0,
    items: [],
    level: 1,
    experience: 0,
    experienceToNextLevel: 100
};
let keys = {};

// Элементы UI
const levelElement = document.getElementById('level');
const experienceElement = document.getElementById('experience');
const expToNextLevelElement = document.getElementById('expToNextLevel');
const goldElement = document.getElementById('gold');
const itemsElement = document.getElementById('items');
const healthBarFill = document.querySelector('#healthBar .stat-fill');
const expBarFill = document.querySelector('#expBar .stat-fill');
const loadingScreen = document.getElementById('loadingScreen');

// Инициализация игры
function init() {
    // Создание сцены
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Голубой фон неба
    
    // Создание камеры
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    
    // Создание рендерера
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('gameContainer').appendChild(renderer.domElement);
    
    // Добавление освещения
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Создание игрового мира
    createWorld();
    
    // Создание игрока
    createPlayer();
    
    // Добавление обработчиков событий
    setupEventListeners();
    
    // Скрытие экрана загрузки
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 2000);
    
    // Запуск игрового цикла
    animate();
}

// Создание игрового мира
function createWorld() {
    // Создание земли
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2E8B57 }); // Зеленый
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Создание стен лабиринта
    createMazeWalls();
    
    // Создание деревьев
    createTrees();
    
    // Создание сундуков и других предметов
    createGameItems();
}

// Создание стен лабиринта
function createMazeWalls() {
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Коричневый
    
    // Пример простого лабиринта
    const walls = [
        { x: 0, y: 1, z: 5, width: 10, height: 2, depth: 1 },
        { x: -5, y: 1, z: 0, width: 1, height: 2, depth: 10 },
        { x: 5, y: 1, z: 0, width: 1, height: 2, depth: 10 },
        { x: 0, y: 1, z: -5, width: 10, height: 2, depth: 1 }
    ];
    
    walls.forEach(wallData => {
        const wallGeometry = new THREE.BoxGeometry(wallData.width, wallData.height, wallData.depth);
        const wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(wallData.x, wallData.y, wallData.z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
    });
}

// Создание деревьев
function createTrees() {
    const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Темно-зеленый
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Коричневый
    
    for (let i = 0; i < 10; i++) {
        // Случайное положение для дерева
        const x = Math.random() * 80 - 40;
        const z = Math.random() * 80 - 40;
        
        // Создание ствола
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 1, z);
        trunk.castShadow = true;
        scene.add(trunk);
        
        // Создание кроны дерева
        const crownGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        const crown = new THREE.Mesh(crownGeometry, treeMaterial);
        crown.position.set(x, 2.5, z);
        crown.castShadow = true;
        scene.add(crown);
    }
}

// Создание сундуков и других предметов
function createGameItems() {
    const chestMaterial = new THREE.MeshLambertMaterial({ color: 0xDAA520 }); // Золотистый
    
    for (let i = 0; i < 5; i++) {
        const chestGeometry = new THREE.BoxGeometry(1, 0.8, 0.8);
        const chest = new THREE.Mesh(chestGeometry, chestMaterial);
        
        // Случайное положение для сундука
        chest.position.set(Math.random() * 80 - 40, 0.4, Math.random() * 80 - 40);
        chest.castShadow = true;
        scene.add(chest);
        
        // Сохраняем информацию о сундуке
        items.push({
            mesh: chest,
            type: 'chest',
            opened: false,
            contents: {
                gold: Math.floor(Math.random() * 50) + 10
            }
        });
    }
}

// Создание игрока
function createPlayer() {
    const playerGeometry = new THREE.ConeGeometry(0.5, 1.5, 8);
    const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 }); // Синий
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 0.75, 0);
    player.castShadow = true;
    scene.add(player);
    
    // Обновляем позицию камеры за игроком
    updateCameraPosition();
}

// Обновление позиции камеры за игроком
function updateCameraPosition() {
    // Камера следует за игроком с небольшим отставанием
    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 5;
    camera.position.y = player.position.y + 3;
    camera.lookAt(player.position.x, player.position.y, player.position.z);
}

// Установка обработчиков событий
function setupEventListeners() {
    window.addEventListener('keydown', (event) => {
        keys[event.key.toLowerCase()] = true;
    });
    
    window.addEventListener('keyup', (event) => {
        keys[event.key.toLowerCase()] = false;
    });
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Обновление состояния игрока
function updatePlayer(deltaTime) {
    const moveSpeed = 5 * deltaTime;
    const rotationSpeed = 3 * deltaTime;
    
    // Вращение игрока
    if (keys['a'] || keys['ф']) { // A или Ф
        player.rotation.y += rotationSpeed;
    }
    if (keys['d'] || keys['в']) { // D или В
        player.rotation.y -= rotationSpeed;
    }
    
    // Движение игрока
    if (keys['w'] || keys['ц']) { // W или Ц
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(player.quaternion);
        direction.normalize();
        player.position.add(direction.multiplyScalar(moveSpeed));
    }
    if (keys['s'] || keys['ы']) { // S или Ы
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(player.quaternion);
        direction.normalize();
        player.position.add(direction.multiplyScalar(moveSpeed));
    }
    
    // Проверка столкновений со стенами (упрощенная)
    checkWallCollisions();
    
    // Проверка столкновений с предметами
    checkItemCollisions();
    
    // Ограничение перемещения игрока в пределах игрового мира
    player.position.x = Math.max(-45, Math.min(45, player.position.x));
    player.position.z = Math.max(-45, Math.min(45, player.position.z));
    
    // Обновление позиции камеры
    updateCameraPosition();
}

// Проверка столкновений со стенами
function checkWallCollisions() {
    // Простая проверка - если игрок слишком близко к границам лабиринта
    const mazeBoundaries = {
        minX: -5,
        maxX: 5,
        minZ: -5,
        maxZ: 5
    };
    
    // Если игрок выходит за пределы лабиринта, возвращаем его обратно
    if (player.position.x < mazeBoundaries.minX && player.position.z >= mazeBoundaries.minZ && player.position.z <= mazeBoundaries.maxZ) {
        player.position.x = mazeBoundaries.minX + 0.1;
    } else if (player.position.x > mazeBoundaries.maxX && player.position.z >= mazeBoundaries.minZ && player.position.z <= mazeBoundaries.maxZ) {
        player.position.x = mazeBoundaries.maxX - 0.1;
    }
    
    if (player.position.z < mazeBoundaries.minZ && player.position.x >= mazeBoundaries.minX && player.position.x <= mazeBoundaries.maxX) {
        player.position.z = mazeBoundaries.minZ + 0.1;
    } else if (player.position.z > mazeBoundaries.maxZ && player.position.x >= mazeBoundaries.minX && player.position.x <= mazeBoundaries.maxX) {
        player.position.z = mazeBoundaries.maxZ - 0.1;
    }
}

// Проверка столкновений с предметами
function checkItemCollisions() {
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.opened) {
            const distance = player.position.distanceTo(item.mesh.position);
            if (distance < 1.5) {
                // Игрок столкнулся с предметом
                if (item.type === 'chest') {
                    openChest(item);
                }
            }
        }
    }
}

// Открытие сундука
function openChest(chest) {
    chest.opened = true;
    playerStats.gold += chest.contents.gold;
    
    // Добавляем случайный предмет в инвентарь
    const randomItem = getRandomItem();
    playerStats.items.push(randomItem);
    
    // Добавляем опыт за открытие сундука
    playerStats.experience += 25;
    checkLevelUp();
    
    scene.remove(chest.mesh); // Удаляем сундук из сцены

    // Обновляем UI
    updateUI();

    console.log(`Открыт сундук! Получено золото: ${chest.contents.gold}, предмет: ${randomItem.name} и опыт: 25`);
}

// Получение случайного предмета
function getRandomItem() {
    const itemsList = [
        { name: "Меч", type: "weapon", damage: 10 },
        { name: "Щит", type: "armor", defense: 5 },
        { name: "Зелье здоровья", type: "potion", effect: "heal", value: 20 },
        { name: "Кольцо силы", type: "accessory", bonus: 5 },
        { name: "Амулет защиты", type: "accessory", bonus: 3 }
    ];
    
    return itemsList[Math.floor(Math.random() * itemsList.length)];
}

// Проверка уровня
function checkLevelUp() {
    if (playerStats.experience >= playerStats.experienceToNextLevel) {
        playerStats.level++;
        playerStats.experience -= playerStats.experienceToNextLevel;
        playerStats.experienceToNextLevel = Math.floor(playerStats.experienceToNextLevel * 1.5);
        
        // Увеличиваем максимальное здоровье при повышении уровня
        playerStats.maxHealth += 20;
        playerStats.health = playerStats.maxHealth; // Полностью восстанавливаем здоровье при левелапе
        
        console.log(`Поздравляем! Вы достигли уровня ${playerStats.level}!`);
        
        // Обновляем UI
        updateUI();
    }
}

// Обновление интерфейса пользователя
function updateUI() {
    levelElement.textContent = playerStats.level;
    experienceElement.textContent = playerStats.experience;
    expToNextLevelElement.textContent = playerStats.experienceToNextLevel;
    
    // Обновляем полосы прогресса
    const healthPercent = (playerStats.health / playerStats.maxHealth) * 100;
    const expPercent = (playerStats.experience / playerStats.experienceToNextLevel) * 100;
    healthBarFill.style.width = `${healthPercent}%`;
    expBarFill.style.width = `${expPercent}%`;
    
    goldElement.textContent = playerStats.gold;
    itemsElement.textContent = playerStats.items.length;
}

// Основной игровой цикл
function animate() {
    requestAnimationFrame(animate);
    
    const currentTime = Date.now();
    const deltaTime = (currentTime - (gameWorld.lastTime || currentTime)) / 1000;
    gameWorld.lastTime = currentTime;
    
    updatePlayer(deltaTime);
    
    renderer.render(scene, camera);
}

// Запуск игры при загрузке страницы
window.onload = init;