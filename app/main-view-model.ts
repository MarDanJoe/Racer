import { Observable, Application, Screen, View } from '@nativescript/core';
import { GameScene } from './game/GameScene';
import * as THREE from 'three';
import { Canvas, WebGLRenderingContext } from '@nativescript/canvas';

export class MainViewModel extends Observable {
    private gameScene: GameScene;
    private renderer: THREE.WebGLRenderer;
    private _score: number = 0;
    private _highScore: number = 0;
    private _combo: number = 1;
    private animationFrameId: number;
    private gameContainer: View;
    private canvas: Canvas;
    private _gameStarted: boolean = false;
    
    constructor() {
        super();
        this.gameScene = new GameScene();
    }
    
    public initializeGame(container: View) {
        this.gameContainer = container;
        this.setupCanvas();
        this.setupRenderer();
        this.startGameLoop();
    }

    private setupCanvas() {
        this.canvas = new Canvas();
        const width = Screen.mainScreen.widthDIPs * 2; // Increased resolution for iOS
        const height = Screen.mainScreen.heightDIPs * 2;
        this.canvas.width = width;
        this.canvas.height = height;
        
        const nativeView = this.gameContainer.nativeView;
        if (nativeView) {
            nativeView.addSubview(this.canvas);
        }
    }
    
    private setupRenderer() {
        const gl = this.canvas.getContext('webgl', {
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false
        }) as WebGLRenderingContext;
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            context: gl,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        
        const width = Screen.mainScreen.widthDIPs * 2;
        const height = Screen.mainScreen.heightDIPs * 2;
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(2); // Better quality for iOS
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    private startGameLoop() {
        let lastTime = 0;
        const animate = (time: number) => {
            this.animationFrameId = requestAnimationFrame(animate);
            
            // Limit to 60 FPS for better performance
            const delta = time - lastTime;
            if (delta < 16.67) return;
            lastTime = time;
            
            this.gameScene.update(time);
            this.renderer.render(this.gameScene.getScene(), this.gameScene.getCamera());
            
            const newScore = this.gameScene.getScore();
            if (newScore !== this._score) {
                this.score = newScore;
                if (this._score > this._highScore) {
                    this.highScore = this._score;
                }
            }
            
            const newCombo = this.gameScene.getCombo();
            if (newCombo !== this._combo) {
                this.combo = newCombo;
            }
        };
        
        animate(0);
    }
    
    public startGame() {
        this._gameStarted = true;
        this.gameScene.startGame();
        this.notifyPropertyChange('gameStarted', true);
    }
    
    public onLeftTap() {
        if (!this._gameStarted) {
            this.startGame();
            return;
        }
        this.gameScene.movePlayerCar(-1);
    }
    
    public onRightTap() {
        if (!this._gameStarted) {
            this.startGame();
            return;
        }
        this.gameScene.movePlayerCar(1);
    }
    
    get score(): number {
        return this._score;
    }
    
    set score(value: number) {
        if (this._score !== value) {
            this._score = value;
            this.notifyPropertyChange('score', value);
        }
    }
    
    get highScore(): number {
        return this._highScore;
    }
    
    set highScore(value: number) {
        if (this._highScore !== value) {
            this._highScore = value;
            this.notifyPropertyChange('highScore', value);
        }
    }
    
    get combo(): number {
        return this._combo;
    }
    
    set combo(value: number) {
        if (this._combo !== value) {
            this._combo = value;
            this.notifyPropertyChange('combo', value);
        }
    }
    
    get gameStarted(): boolean {
        return this._gameStarted;
    }
    
    public onUnloaded() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.canvas) {
            this.canvas.destroy();
        }
    }
}