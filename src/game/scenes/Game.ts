import { EventBus } from "../EventBus";
import { GameObjects, Scene } from "phaser";

export class Game extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    arcadePhysics: Phaser.Physics.Arcade.ArcadePhysics;
    background: GameObjects.Image;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    
    spaceShip: Phaser.Physics.Arcade.Sprite;
    asteroidPool: Phaser.Physics.Arcade.Group;
    bulletPool:  Phaser.Physics.Arcade.Group;
    plasma: GameObjects.Particles.ParticleEmitter;
    
    // spaceShipMask: GameObjects.Graphics;
    // asteroidMasks: GameObjects.Graphics[];
    
    score = 0;
    scoreText: GameObjects.BitmapText;
    noOfLives = 3;
    noOfLivesText: GameObjects.BitmapText;

    isLeftKeyDown = false;
    isRightKeyDown = false;
    isUpKeyDown = false;
    isDownKeyDown = false;
    isSpaceKeyDown = false;

    readonly bulletCount = 30;
    readonly asteroidsCount = 6;
    readonly gameLevel = 1;


    constructor() {
        super("Game");
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x101010);
        this.arcadePhysics = this.physics;
        // this.spaceShipMask = this.add.graphics();

        this.scoreText = this.add.bitmapText(16, 16, 'arcade', 'Score: 0', 32);
        this.noOfLivesText = this.add.bitmapText(700, 16, 'arcade', 'Lives left: 3', 16);

        this.cursors = this.input.keyboard?.createCursorKeys();

        this.spaceShip = this.physics.add.sprite(512, 384, "spaceShip");
        this.spaceShip
        .setScale(0.35, 0.35)
        .setCircle(50);

        this.setAsteroidPool();

        this.setBulletPool();
    
        this.spaceShipCommandListener();
        this.plasma = this.add.particles(0, 0, 'bullet', {
            alpha: { start: 1, end: 0, ease: 'Cubic.easeIn' },
            blendMode: Phaser.BlendModes.SCREEN,
            frequency: -1,
            lifespan: 500,
            radial: false,
            scale: { start: 1, end: 5, ease: 'Cubic.easeOut' }
        });

        EventBus.emit("current-scene-ready", this);
    }

    update(time: number, delta: number): void {
        this.physics.world.timeScale = 3
        //console.log(delta);
        // this.displayObjectOutline(this.spaceShipMask, this.spaceShip, 50);
        this.flySpaceShip(delta);
        //this.handleCollision();
        if(this.asteroidPool.getLength() === 0){
            this.setAsteroidPool();
        }else{
            this.keepShoweringAsteroids();
        }

        if(this.bulletPool.getLength() === 0){
            this.setBulletPool();
        }
        this.checkCollisions();
        //this.asteroidPool.children.each(el => {console.log(el.body?.velocity); return null});
    }

    spaceShipCommandListener() {
        // Left Key down event
        this.cursors?.left.on("down", () => {
            this.isLeftKeyDown = true;
        });

        // Left Key up event
        this.cursors?.left.on("up", () => {
            this.isLeftKeyDown = false;
        });

        // Right Key down event
        this.cursors?.right.on("down", () => {
            this.isRightKeyDown = true;
        });

        // Right Key up event
        this.cursors?.right.on("up", () => {
            this.isRightKeyDown = false;
        });
        // Up Key down event
        this.cursors?.up.on("down", () => {
            this.isUpKeyDown = true;
        });

        // Up Key up event
        this.cursors?.up.on("up", () => {
            this.isUpKeyDown = false;
        });

        // Down Key down event
        this.cursors?.down.on("down", () => {
            this.isDownKeyDown = true;
        });

        // Down Key up event
        this.cursors?.down.on("up", () => {
            this.isDownKeyDown = false;
        });

        // Space Key down event
        this.cursors?.space.on("down", () => {
            this.isSpaceKeyDown = true;
        });

        // Space Key up event
        this.cursors?.down.on("up", () => {
            this.isSpaceKeyDown = false;
        });
    }

    setAsteroidPool(){
        this.asteroidPool = this.physics.add.group({
            key: 'asteroid',
            repeat: this.asteroidsCount, // Adjust the number of asteroids in the pool
            active: false,
            visible: true,
            setScale:{
                x: 0.25,
                y: 0.25
            },
            setXY: {x: 0, y: 0, stepX: 150},
            velocityY: 10,
            maxVelocityX: 25
        });
    }

    setBulletPool(){
        this.bulletPool = this.physics.add.group({
            key: 'bullet',
            quantity: this.bulletCount, // Adjust the number of bullets in the pool
            active: false,
            visible: false,
            setScale:{
                x: 0.5,
                y: 0.5
            }
        });
    }

    updateScore(){
        this.score += 100;
        this.scoreText.text = 'Score: ' + this.score;
    }

    checkCollisions(){
        this.physics.add.overlap(this.asteroidPool, this.spaceShip, this.handleSpaceShipCollision, undefined, this);

        this.physics.add.overlap(this.asteroidPool, this.bulletPool, (asteroid, bullet) => {
                asteroid.destroy();
                this.updateScore();
                bullet.destroy(false);
        });
    }

    handleSpaceShipCollision(){
        const {x, y} = this.spaceShip.body?.center || {x:0, y:0}; // TODO handle default correctly
        this.spaceShip.disableBody(true, true);
        this.plasma.emitParticleAt(x, y);
        if(--this.noOfLives > 0) {
            this.time.delayedCall(500, () => {
                this.spaceShip.enableBody(true, x, y, true, true);
            })
            this.noOfLivesText.text = 'Lives left: ' + this.noOfLives;
        }else{
            this.changeScene();
        }

        this.asteroidPool.getChildren().forEach((el) => console.log(el))
        //asteroid.disableBody( true, true);

    }


    displayObjectOutline(mask: Phaser.GameObjects.Graphics, object: Phaser.Physics.Arcade.Sprite, radius: number){
        mask.clear();
        mask.lineStyle(1, 0xFFFFFF, 1);
        mask.strokeCircle(object.x, object.y, radius);
    }

    moveLeft(delta: number) {
        this.spaceShip.x < 0
            ? this.spaceShip.setX(1024)
            : this.spaceShip.setX(this.spaceShip.x - (200 * delta) / 1000);
    }

    moveRight(delta: number) {
        this.spaceShip.x > 1024
            ? this.spaceShip.setX(0)
            : this.spaceShip.setX(this.spaceShip.x + (200 * delta) / 1000);
    }
    moveUp(delta: number) {
        this.spaceShip.y < 0
            ? this.spaceShip.setY(768)
            : this.spaceShip.setY(this.spaceShip.y - (200 * delta) / 1000);
    }

    moveDown(delta: number) {
        this.spaceShip.y > 768
            ? this.spaceShip.setY(0)
            : this.spaceShip.setY(this.spaceShip.y + (200 * delta) / 1000);
    }

    flySpaceShip(delta: number) {
        if (this.isLeftKeyDown) {
            this.moveLeft(delta);
        }
        if (this.isRightKeyDown) {
            this.moveRight(delta);
        }
        if (this.isUpKeyDown) {
            this.moveUp(delta);
        }
        if (this.isDownKeyDown) {
            this.moveDown(delta);
        }
        //if(this.isSpaceKeyDown){
            this.fireBullet(delta);
        //}
    }

    fireBullet(delta: number){
        if (this.cursors?.space && Phaser.Input.Keyboard.JustDown(this.cursors?.space)) {
            const bullet = this.bulletPool.getFirstDead();
            if (bullet) {
                bullet.setActive(true);
                bullet.setVisible(true);
                bullet.setPosition(this.spaceShip.x, this.spaceShip.y);
                bullet.setVelocityY(-300);
            }
        }
        this.bulletPool.children.each(bullet => {
            if (bullet.body && bullet.body?.position.y < 0) {
                bullet.setActive(false);
            }
            return null;
        });
        // console.log(this.bulletPool.getTotalFree(), this.bulletPool.getTotalUsed(), this.bulletPool.getLength());
    }

    keepShoweringAsteroids() {
        if (this.time.paused) {
            console.log("paused", this.time.timeScale);
        } else {
            this.asteroidPool.children.each(el => {
                if (el.body && el.body?.position.y > 768) el.body.position.y = 0;
                else el.body?.position.y && (el.body.position.y += 5);
                return null;
                //this.displayObjectOutline(this.asteroidMasks[k], el, 25);
            });
        }
    }

    changeScene() {
        this.scene.start("GameOver");
    }

    // update(time, delta){

    // }
}

