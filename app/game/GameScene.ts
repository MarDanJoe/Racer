import { Screen } from '@nativescript/core';
import * as THREE from 'three';

export class GameScene {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private playerCar: THREE.Group;
    private trafficCars: THREE.Group[] = [];
    private score: number = 0;
    private road: THREE.Mesh;
    private lastTime: number = 0;
    private speed: number = 30;
    private particles: THREE.Points;
    private buildings: THREE.Group[] = [];
    private trees: THREE.Group[] = [];
    private gameStarted: boolean = false;
    private difficulty: number = 1;
    private combo: number = 1;
    private comboTimer: number = 0;
    
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 20, 100);
        this.setupCamera();
        this.setupLights();
        this.setupEnvironment();
        this.setupPlayerCar();
        this.setupParticles();
        this.spawnInitialObjects();
    }
    
    private setupCamera() {
        const aspect = Screen.mainScreen.widthDIPs / Screen.mainScreen.heightDIPs;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 7, 18);
        this.camera.lookAt(0, 0, 0);
    }
    
    private setupLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        
        const sunLight = new THREE.DirectionalLight(0xffffff, 1);
        sunLight.position.set(10, 20, 10);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -30;
        sunLight.shadow.camera.right = 30;
        sunLight.shadow.camera.top = 30;
        sunLight.shadow.camera.bottom = -30;
        this.scene.add(sunLight);

        // Add colored street lights
        const colors = [0xff0000, 0x00ff00, 0x0000ff];
        colors.forEach((color, i) => {
            const light = new THREE.PointLight(color, 0.5, 20);
            light.position.set(i * 10 - 10, 5, -10);
            this.scene.add(light);
        });
    }

    private setupEnvironment() {
        // Improved road with better texture
        const roadTexture = new THREE.TextureLoader().load('assets/road.jpg');
        roadTexture.wrapS = THREE.RepeatWrapping;
        roadTexture.wrapT = THREE.RepeatWrapping;
        roadTexture.repeat.set(1, 50);
        
        const roadGeometry = new THREE.PlaneGeometry(15, 1000);
        const roadMaterial = new THREE.MeshStandardMaterial({
            map: roadTexture,
            roughness: 0.8,
            metalness: 0.2
        });
        this.road = new THREE.Mesh(roadGeometry, roadMaterial);
        this.road.rotation.x = -Math.PI / 2;
        this.road.receiveShadow = true;
        this.scene.add(this.road);

        // Add sky
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            side: THREE.BackSide
        });
        this.scene.add(new THREE.Mesh(skyGeometry, skyMaterial));

        // Add ground
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a472a,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    private createBuilding(): THREE.Group {
        const building = new THREE.Group();
        const height = Math.random() * 20 + 10;
        
        const geometry = new THREE.BoxGeometry(8, height, 8);
        const material = new THREE.MeshPhongMaterial({
            color: Math.random() * 0xffffff,
            shininess: 50
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = height / 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        building.add(mesh);
        
        // Add windows
        for (let i = 0; i < height - 2; i += 2) {
            for (let j = -2; j <= 2; j += 2) {
                const windowGeom = new THREE.PlaneGeometry(0.8, 0.8);
                const windowMat = new THREE.MeshPhongMaterial({
                    color: 0xffff00,
                    emissive: 0x555500
                });
                const window = new THREE.Mesh(windowGeom, windowMat);
                window.position.set(4, i + 1, j);
                window.rotation.y = Math.PI / 2;
                building.add(window);
                
                const window2 = window.clone();
                window2.position.x = -4;
                window2.rotation.y = -Math.PI / 2;
                building.add(window2);
            }
        }
        
        return building;
    }

    private createTree(): THREE.Group {
        const tree = new THREE.Group();
        
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x4a2810 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.castShadow = true;
        tree.add(trunk);
        
        // Leaves
        const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 8);
        const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x0a5a0a });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 2;
        leaves.castShadow = true;
        tree.add(leaves);
        
        return tree;
    }

    private setupParticles() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 20;
            positions[i + 1] = Math.random() * 20;
            positions[i + 2] = (Math.random() - 0.5) * 100;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.1,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    private spawnInitialObjects() {
        // Spawn initial buildings
        for (let i = 0; i < 20; i++) {
            const building = this.createBuilding();
            building.position.x = (Math.random() - 0.5) * 100 + (Math.random() > 0.5 ? 20 : -20);
            building.position.z = -i * 20;
            this.buildings.push(building);
            this.scene.add(building);
        }
        
        // Spawn initial trees
        for (let i = 0; i < 30; i++) {
            const tree = this.createTree();
            tree.position.x = (Math.random() - 0.5) * 100 + (Math.random() > 0.5 ? 15 : -15);
            tree.position.z = -i * 10;
            this.trees.push(tree);
            this.scene.add(tree);
        }
        
        // Spawn initial traffic
        for (let i = 0; i < 5; i++) {
            this.spawnTrafficCar();
        }
    }

    private createCarModel(color: number): THREE.Group {
        const car = new THREE.Group();
        
        // Enhanced car body with better materials
        const bodyGeometry = new THREE.BoxGeometry(1.4, 0.5, 3);
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: color,
            metalness: 0.9,
            roughness: 0.4,
            clearcoat: 0.8,
            clearcoatRoughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.position.y = 0.5;
        car.add(body);
        
        // Enhanced roof
        const roofGeometry = new THREE.BoxGeometry(1.2, 0.4, 1.5);
        const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
        roof.castShadow = true;
        roof.position.y = 0.9;
        roof.position.z = -0.2;
        car.add(roof);
        
        // Enhanced wheels with better detail
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 60
        });
        
        const wheelPositions = [
            [-0.8, 0.3, -0.7],
            [0.8, 0.3, -0.7],
            [-0.8, 0.3, 0.7],
            [0.8, 0.3, 0.7]
        ];
        
        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...position);
            wheel.castShadow = true;
            car.add(wheel);
        });
        
        // Add headlights
        const headlightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const headlightMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xffffcc
        });
        
        [-0.5, 0.5].forEach(x => {
            const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight.position.set(x, 0.5, -1.5);
            car.add(headlight);
        });
        
        // Add taillights
        const taillightMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0x660000
        });
        
        [-0.5, 0.5].forEach(x => {
            const taillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
            taillight.position.set(x, 0.5, 1.5);
            car.add(taillight);
        });
        
        return car;
    }

    public update(time: number) {
        const delta = (time - this.lastTime) / 1000;
        this.lastTime = time;
        
        if (!this.gameStarted) return;
        
        // Update speed based on score
        this.speed = 30 + Math.min(this.score / 1000, 30);
        
        // Update combo system
        this.comboTimer -= delta;
        if (this.comboTimer <= 0) {
            this.combo = 1;
        }
        
        // Update traffic cars
        this.trafficCars.forEach((car, index) => {
            car.position.z += this.speed * delta;
            
            // Check for near misses
            if (Math.abs(car.position.z - this.playerCar.position.z) < 2) {
                const distance = Math.abs(car.position.x - this.playerCar.position.x);
                if (distance < 2 && distance > 0.8) {
                    this.score += 10 * this.combo;
                    this.combo++;
                    this.comboTimer = 3;
                }
            }
            
            if (car.position.z > 20) {
                this.scene.remove(car);
                this.trafficCars.splice(index, 1);
            }
        });
        
        // Update buildings and trees
        [...this.buildings, ...this.trees].forEach(object => {
            object.position.z += this.speed * delta;
            if (object.position.z > 50) {
                object.position.z -= 200;
            }
        });
        
        // Update particles
        const positions = this.particles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 2] += this.speed * 2 * delta;
            if (positions[i + 2] > 50) {
                positions[i + 2] -= 150;
            }
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
        
        // Spawn new traffic cars
        if (Math.random() < 0.02 * this.difficulty) {
            this.spawnTrafficCar();
        }
        
        // Gradually increase difficulty
        this.difficulty = 1 + Math.min(this.score / 2000, 1);
        
        // Update camera to follow player with smooth motion
        const targetCameraZ = this.playerCar.position.z + 15;
        this.camera.position.z += (targetCameraZ - this.camera.position.z) * 0.1;
        this.camera.lookAt(this.playerCar.position);
    }
    
    public startGame() {
        this.gameStarted = true;
        this.score = 0;
        this.combo = 1;
        this.difficulty = 1;
    }
    
    public movePlayerCar(direction: number) {
        const maxX = 6;
        const newX = this.playerCar.position.x + direction * 0.5;
        if (Math.abs(newX) < maxX) {
            this.playerCar.position.x = newX;
            this.playerCar.rotation.z = -direction * 0.1;
        }
    }
    
    private spawnTrafficCar() {
        const colors = [0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        const trafficCar = this.createCarModel(
            colors[Math.floor(Math.random() * colors.length)]
        );
        
        trafficCar.position.x = (Math.random() - 0.5) * 10;
        trafficCar.position.z = -50;
        
        this.trafficCars.push(trafficCar);
        this.scene.add(trafficCar);
    }
    
    public getScore(): number {
        return this.score;
    }
    
    public getCombo(): number {
        return this.combo;
    }
    
    public getScene(): THREE.Scene {
        return this.scene;
    }
    
    public getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }
}