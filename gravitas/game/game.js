let Game = function (game, optionsData) {

    // Displayables from level file
    let player,
        walls,
        setUp,
        shockers,
        gravObjects,
        checkpoints,
        exits,
        emitters,
        backgrounds,
        movers,
        tutorialSigns,
        bouncers;

    // Dynamic displayables
    let freezeGraphics;
    let selectedObjGraphics;
    let gravCirclesTop;
    let gravCirclesBottom;

    let levelLoader;
    let currentLevel;
    let deathCount = localStorage.getItem('death_count');
    let deathIcon;

    // State info
    let selectableGravObjects;
    let currentHighlightedObjIndex;
    let rightKeyWasPressed,
        leftKeyWasPressed;
    let playerHasHitCheckpoint;
    let framesHoldingR;
    let isBouncing;

    let pauseHandler;
    let deathHandler;
    let exitHandler;
    let freezeHandler;
    let jumpHandler;
    let shadowHandler;
    let optionsHandler;

    let playerDataList = [];

    // Player movement
    let previous_velocity_y;

    // Player start position
    let playerStartX,
        playerStartY,
        playerGrav;

    //Debug
    let skipPressed;
    let lastDzoneRect;
    let doubleCheckDeadness;//Deals with making sure deaths don't double count

    // Constants

    // Physics
    const frictionCoef = 0.5;
    const groundAcceleration = 30;
    const airAcceleration = 5;
    const maxHorizontalVelocity = 250;
    const millisecondsPerFrame = 100/6;
    const movingObjSpeed = 30;

    // Display
    const blockSize = 30;
    const selectedObjWidth = 8;

    function unpackObjects(loaderObjects) {
        player = loaderObjects.player;
        walls = loaderObjects.walls;
        shockers = loaderObjects.shockers;
        gravObjects = loaderObjects.gravObjects;
        checkpoints = loaderObjects.checkpoints;
        exits = loaderObjects.exits;
        emitters = loaderObjects.emitters;
        playerStartX = loaderObjects.playerStartX;
        playerStartY = loaderObjects.playerStartY;
        playerGrav = loaderObjects.playerGrav;
        backgrounds = loaderObjects.backgrounds;
        movers = loaderObjects.movers;
        tutorialSigns = loaderObjects.tutorialSigns;
        bouncers = loaderObjects.bouncers;
    }

    function loadLevel() {
        let levelObjects = levelLoader.loadLevel(currentLevel);
        unpackObjects(levelObjects);
        setLayerOrder();
    }

    function setLayerOrder() {
        game.world.bringToTop(emitters);
        game.world.sendToBack(shockers);
        game.world.sendToBack(gravCirclesBottom);
        game.world.sendToBack(backgrounds);
        game.world.bringToTop(freezeGraphics);
        game.world.bringToTop(selectedObjGraphics);
        game.world.bringToTop(gravCirclesTop);

        doubleCheckDeadness = false;//Have to reset this debug variable here, to insure the kill count only registers a new death after a load.
        freezeHandler.addArrow(game, player);
    }

    function isIntractive() {
        return deathHandler.notCurrentlyDying && exitHandler.notCurrentlyExiting;
    }

    function isStopped() {
        return pauseHandler.isActive() || freezeHandler.isActive();
    }

    function pausedOrFrozenStateChanged() {
        let gameStopped = isStopped();

        game.physics.arcade.isPaused = gameStopped;

        shockers.children.forEach(function(ele) {
            ele.animations.paused = gameStopped;
        });

        if (gameStopped) {
            game.time.events.pause();
        } else {
            game.time.events.resume();
        }
    }

    function setUpFreezeButton() {
        let freezeBtn = game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
        freezeBtn.onDown.add(function() {
            if (!isIntractive()) {
                return;
            }

            if (!pauseHandler.isActive()) {
                if (freezeHandler.isActive()) {
                    selectableGravObjects.length = 0;
                    freezeHandler.endFreeze(game);
                    gravObjects.forEach(function(gravObj) {
                        gravObj.animateParticles(true);
                    });
                } else {
                    handleGravObjSelection();
                    freezeHandler.startFreeze(game);
                }
            }
        }, null);
    }

    function setUpJumpButton() {
      game.input.keyboard.addKey(Phaser.KeyCode.UP).onDown.add(function() {
        if (isIntractive() && !isStopped()) {
            jumpHandler.userRequestedJump();
        }
      });
      game.input.keyboard.addKey(Phaser.KeyCode.W).onDown.add(function() {
        if (isIntractive() && !isStopped()) {
            jumpHandler.userRequestedJump();
        }
      });
    }

    function handleGravObjSelection() {
        // Place all objects currently on the screen into a list
        gravObjects.forEach(function(gravObj) {
            if    ((gravObj.x + 10 < game.camera.x + game.width ) && (gravObj.x - 10 > game.camera.x)
                && (gravObj.y + 10 < game.camera.y + game.height) && (gravObj.y - 10 > game.camera.y)) {
                if(!gravObj.flux && !gravObj.moving) {
                    selectableGravObjects.push(gravObj);
                }
            }
        });

        // Sort the objects from left to right
        selectableGravObjects.sort(function(a, b) {
            if (a.x < b.x) {
                return -1;
            } else {
                return 1;
            }
        });

        // Find the closest object to the player and make it the selected one
        let currentMinObjIndex = 0;
        for(let i = 0; i < selectableGravObjects.length; i++) {
            let gravObj = selectableGravObjects[i];

            let diff_1 = Phaser.Point.subtract(player.position, gravObj.position);
            let r_1 = diff_1.getMagnitude();

            let diff_2 = Phaser.Point.subtract(player.position, selectableGravObjects[currentMinObjIndex].position);
            let r_2 = diff_2.getMagnitude();

            if (r_1 < r_2) {
                currentMinObjIndex = i;
            }
        }

        currentHighlightedObjIndex = currentMinObjIndex;
    }


    function preload() {
        // Sprites
        game.load.image('player', 'assets/art/player.png');
        game.load.image('exit', 'assets/art/exit.png');
        game.load.image('door', 'assets/art/door.png');
        game.load.image('wall', 'assets/art/bricks_gray.png');
        game.load.image('bounce', 'assets/art/bounce.png');
        game.load.image('grass', 'assets/art/grass.png');
        game.load.image('gravObj', 'assets/art/gravObj.png');
        game.load.image('shadow', 'assets/art/shadow.png');
        game.load.image('checkpoint', 'assets/art/flag_red.png');
        game.load.image('checkpointActivated', 'assets/art/flag_green.png');
        game.load.image('arrow', 'assets/art/arrow.png');
        game.load.image('groundParticle', 'assets/art/groundParticle.png');
        game.load.image('bounceParticle', 'assets/art/bounceParticle.png')
        game.load.image('gravParticle', 'assets/art/gravParticle.png');
        game.load.image('circle', 'assets/art/gravCircle.png');

        game.load.image('tutorial_movement', 'assets/art/tutorial/movement.png');
        game.load.image('tutorial_esc_pause', 'assets/art/tutorial/esc_pause.png');
        game.load.image('tutorial_time_freeze', 'assets/art/tutorial/time_freeze.png');
        game.load.image('tutorial_gravity_change', 'assets/art/tutorial/gravity_change.png');
        game.load.image('tutorial_gravity_select', 'assets/art/tutorial/gravity_select.png');
        game.load.image('tutorial_restart', 'assets/art/tutorial/restart.png');
        game.load.image('tutorial_bounce', 'assets/art/tutorial/hold_up_to_bounce.png');

        game.load.image('resumeButton', 'assets/art/resumeButton.png');
        game.load.image('menuButton', 'assets/art/menuButton.png');
        game.load.image('optionsButton', 'assets/art/optionsButton.png');
        game.load.image('pauseBackground', 'assets/art/pauseBackground.png');

        game.load.image('optionsBar', 'assets/art/optionsBar.png');
        game.load.image('addButton', 'assets/art/addButton.png');
        game.load.image('minusButton', 'assets/art/minusButton.png');
        game.load.image('backButton', 'assets/art/backButton.png');
        game.load.image('coin', 'assets/art/coin.png')
        game.load.image('blankBackground', 'assets/art/blankBackground.png');
        game.load.image('masterAudioLabel', 'assets/art/masterAudioLabel.png');
        game.load.image('musicAudioLabel', 'assets/art/musicAudioLabel.png');
        game.load.image('soundFXAudioLabel', 'assets/art/soundFXAudioLabel.png');
        game.load.image('optionsLabel', 'assets/art/optionsLabel.png');
        game.load.image('deathCounter', 'assets/art/death_counter.png');

        // Background tile sprites
        for(let i=1; i<=7; i++){
            game.load.image("bg_debug_"+i, "assets/art/bg/bg_debug_"+i+".png");
        }
        for(let i=1; i<=7; i++){
            game.load.image("bg_large_stone_"+i, "assets/art/bg/bg_large_stone_"+i+".png");
        }
        for(let i=1; i<=4; i++){
            game.load.image("bg_sky_"+i, "assets/art/bg/bg_sky_"+i+".png");
        }
        game.load.image("bg_sky_solid_1", "assets/art/bg/bg_sky_solid_1.png");

        // Audio
        game.load.audio('death', ['assets/audio/death.mp3', 'assets/audio/death.ogg']);
        game.load.audio('freeze', ['assets/audio/Freeze.mp3', 'assets/audio/Freeze.ogg']);
        game.load.audio('unfreeze', ['assets/audio/Unfreeze.mp3', 'assets/audio/Unfreeze.ogg']);
        game.load.audio('jump4', ['assets/audio/Jump4.mp3', 'assets/audio/Jump4.ogg']);
        game.load.audio('landing', ['assets/audio/Landing.mp3', 'assets/audio/Landing.ogg']);
        game.load.audio('checkpointHit', ['assets/audio/checkpoint.mp3', 'assets/audio/checkpoint.ogg']);
        game.load.audio('exitSound', ['assets/audio/exit.mp3', 'assets/audio/exit.ogg']);
        game.load.audio('frozenTime', 'assets/audio/frozenTime.mp3');

        // Animated sprites
        game.load.spritesheet('shocker', 'assets/art/electricity_sprites2.png', 30, 30, 3);

        levelLoader = new LevelLoader(game);
        levelLoader.setUp();
    }

    function create() {
        console.log("Starting Game state at Level #"+currentLevel);
        game.stage.backgroundColor = '#faebd7';
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.world.enableBody = true;
        game.canvas.oncontextmenu = function (e) {
            e.preventDefault();
        };

        freezeGraphics = game.add.graphics();
        selectedObjGraphics = game.add.graphics();

        gravCirclesTop = game.add.group();
        gravCirclesBottom = game.add.group();

        playerHasHitCheckpoint = false;
        isBouncing = false;

        optionsHandler = new OptionsHandler(game, optionsData, function() {
            pauseHandler.startPauseMenu(currentLevel);
            pausedOrFrozenStateChanged();
        });
        pauseHandler = new PauseHandler(game, optionsHandler, pausedOrFrozenStateChanged);
        deathHandler = new DeathHandler(optionsData);
        exitHandler = new ExitHandler(optionsData);
        freezeHandler = new FreezeHandler(optionsData, pausedOrFrozenStateChanged);
        jumpHandler = new JumpHandler(optionsData);
        shadowHandler = new ShadowHandler();

        loadLevel();

        setUpFreezeButton();
        setUpJumpButton();

        game.input.keyboard.onUpCallback = function (event) {
            if(!isIntractive()) {
                return;
            }

            if (event.keyCode === Phaser.Keyboard.RIGHT || event.keyCode === Phaser.KeyCode.D) {
                rightKeyWasPressed = true;
            }
            if (event.keyCode === Phaser.Keyboard.LEFT || event.keyCode === Phaser.KeyCode.A) {
                leftKeyWasPressed = true;
            }
            if (event.keyCode === Phaser.KeyCode.ESC) {
                if (pauseHandler.isActive()) {
                    pauseHandler.resume();
                } else {
                    pauseHandler.startPauseMenu(currentLevel);
                }
            }
        };

        shadowHandler.setUp(game, player);

        rightKeyWasPressed = false;
        leftKeyWasPressed = false;

        selectableGravObjects = [];

        skipPressed = false;
        framesHoldingR = 0;

        //death counter
        if (deathCount == null) {
            deathCount = 0;
            localStorage.setItem('death_count', deathCount);
        } else {
          deathCount = parseInt(deathCount);
        }
        deathReadout = game.add.text(100, 30, deathCount, { font: "64px AR Destine", fill: "#ffffff", align: "left" });
        deathReadout.text = deathCount;
        death_icon = game.add.sprite(30, 30, 'deathCounter');
        death_icon.fixedToCamera = true;
        deathReadout.fixedToCamera = true;
        death_icon.bringToTop();
        deathReadout.bringToTop();
        death_icon.alpha=0.6;
        deathReadout.alpha=0.6;
    }

    function update() {
        // Move the player in a parabolic death animation when dead,
        // Reset the game when the player falls below the game window
        if (deathHandler.deathFall) {
            deathHandler.doDeathFallAnimation(game, player, blockSize, onPlayerDeath);
        }

        if (exitHandler.inExitAnimation) {
            exitHandler.doExitAnimation(player, blockSize, quadraticEase);
        }
        player.body.moves = true;
        doControlButtons();

        doCollision();
        doGravityPhysics();

        if (! isStopped()){
            doPlayerMovement();
            doObjMovement();
            // When the player hits the ground after jumping, play a you hit the ground particle effect
            doHitGroundAnimation();
            checkWallCollision();
            jumpHandler.doJumpPhysics(game, player);
            gravObjects.forEach(function(gravObj) {
                gravObj.animateParticles();
            }, null);

            previous_velocity_y = player.body.velocity.y;

            jumpHandler.update(player);

            rightKeyWasPressed = false;
            leftKeyWasPressed = false;

        } else {
            // If time is frozen, keep the particles in the same state until time is unfrozen
            emitters.forEach(function(emitter) {
                emitter.forEachAlive(function(p) {
                    p.lifespan += millisecondsPerFrame;
                }, null);
            }, null);

            if (isIntractive()) {
                // Adjust attraction of clicked object
                adjustAttractorsPull();
            }

            freezeHandler.doArrowChange(player);
        }
    }

    function render() {

        let drawGravObjCircle = function(circleGroup, gravObj, alpha) {
            // these are heuristic constants which look okay
            const subAmount = 50;
            let diameter = 2 * gravObj.radius;
            gravObj.gravCircles.removeAll();

            while (diameter > 0) {
                let circle = game.add.sprite(gravObj.x, gravObj.y, 'circle');
                circle.anchor.set(.5, .5);
                circle.alpha = alpha;
                circle.blendMode = PIXI.blendModes.ADD;
                circle.width = diameter;
                circle.height = diameter;
                circleGroup.add(circle);
                gravObj.gravCircles.add(circle);
                diameter -= subAmount;
                alpha -= alpha / 10;
            }
        };

        freezeGraphics.clear();
        selectedObjGraphics.clear();

        gravObjects.children.forEach(function(gravObj) {
            if(gravObj.weightHasBeenChanged || gravObj.flux || gravObj.moving) {
                gravObj.gravCircles.removeAll(true);
                drawGravObjCircle(gravCirclesBottom, gravObj, .1);
                drawGravObjCircle(gravCirclesTop, gravObj, .1);
                gravObj.weightHasBeenChanged = false;
            }
        });

        if ((freezeHandler.freezeAnimation && isIntractive()) || freezeHandler.stopFreezeAnimation) {
            freezeHandler.doFreezeGraphics(game, freezeGraphics, player, quadraticEase);
        }

        if (selectableGravObjects.length > 0) {
            drawSelectedObjBox();
        }
    }

    function drawSelectedObjBox() {
        let selectedObj = selectableGravObjects[currentHighlightedObjIndex];
        selectedObjGraphics.beginFill(0xffffff, 1);

        selectedObjGraphics.drawRect(
            selectedObj.x - 15,
            selectedObj.y - 15,
            selectedObjWidth, 30);
        selectedObjGraphics.drawRect(
            selectedObj.x - 15,
            selectedObj.y - 15,
            30, selectedObjWidth);
        selectedObjGraphics.drawRect(
            selectedObj.x - 15,
            selectedObj.y + 15 - selectedObjWidth,
            30, selectedObjWidth);
        selectedObjGraphics.drawRect(
            selectedObj.x + 15 - selectedObjWidth, selectedObj.y - 15,
            selectedObjWidth, 30);

        selectedObjGraphics.endFill();
    }

    function resetLevel() {
        //Handles resetting the player to last checkpoint upon death, as well as resetting all grav & moving blocks
        player.destroy();
        freezeHandler.killArrow();
        player = levelLoader.makePlayer(playerStartX, playerStartY, playerGrav);

        gravObjects.children.forEach(function(gravObj) {
            gravObj.resetWeight();
            gravObj.animateParticles(true);
            gravObj.weightHasBeenChanged = true;
        });

        movers.forEach(function(obj) {
            obj.x = obj.startingX;
            obj.y = obj.startingY;
            obj.movementIndex = 0;
        });
        setLayerOrder();
    }

    function clearLevel() {
        //Destroys eveything in the current level
        player.kill();
        walls.destroy();
        bouncers.destroy();
        shockers.destroy();
        gravObjects.forEach(function(gravObj) {
            if (gravObj.gravParticles !== undefined) {
                gravObj.gravParticles.destroy();
            }
            gravObj.gravCircles.destroy();
        }, null);
        gravObjects.destroy();
        exits.destroy();
        backgrounds.destroy();
        freezeHandler.killArrow();
        checkpoints.destroy();
        movers.length = 0;
        tutorialSigns.destroy();
    }

    function doCollision() {
        game.physics.arcade.collide(emitters, walls);
        game.physics.arcade.collide(emitters, bouncers);
        game.physics.arcade.collide(player, walls);
        game.physics.arcade.collide(player, bouncers);
        game.physics.arcade.collide(player, gravObjects);

        game.physics.arcade.overlap(player, checkpoints, onCheckpointHit, null, null);

        gravObjects.forEach(function(gravObj) {
            game.physics.arcade.collide(gravObjects, gravObj.gravParticles, function(_, p) {
                    p.life = 0;
            }, null, null);
        }, null);

        isBouncing = false;
        if (shadowHandler.update(game, player, walls, bouncers)){ // Update returns TRUE if the player is touching a bouncer
          jumpHandler.userRequestedJump();
          isBouncing = true;
        }

        // If the player is not dead, play the death animation on contact with shockers or the exit animation on contact with an exit
        if (isIntractive() && !deathHandler.diedRecently) {
            game.physics.arcade.overlap(player, exits, onExit, null, null);
//            game.physics.arcade.overlap(player, shockers, function() {
//            deathHandler.deathAnimation(game, player);}, null, null);
            game.physics.arcade.overlap(player, shockers, function() {
                    deathHandler.deathAnimation(game, player);
                    if (!doubleCheckDeadness){
                        deathCount+=1;
                        localStorage.setItem('death_count', deathCount);
                        doubleCheckDeadness = true;
                    }
                    deathReadout.text = deathCount;
                    deathReadout.addColor("#ff0000", 0);
                    death_icon.alpha=1;
                    deathReadout.alpha=1;
                }, null, null);
        }
    }

    function adjustAttractorsPull() {

        if (rightKeyWasPressed) {
            currentHighlightedObjIndex = (currentHighlightedObjIndex + 1) % selectableGravObjects.length;
            rightKeyWasPressed = false;
        }
        if (leftKeyWasPressed) {
            currentHighlightedObjIndex = (currentHighlightedObjIndex - 1) % selectableGravObjects.length;
            if (currentHighlightedObjIndex === -1) {
                currentHighlightedObjIndex = selectableGravObjects.length - 1;
            }
            leftKeyWasPressed = false;
        }
        if (game.input.keyboard.isDown(Phaser.KeyCode.UP) || game.input.keyboard.isDown(Phaser.KeyCode.W)) {
            let obj = selectableGravObjects[currentHighlightedObjIndex];
            if (obj) {                
                obj.gravWeight = Math.min(obj.gravMax, obj.gravWeight + 5000);
                obj.weightHasBeenChanged = true;
            }
        }
        if (game.input.keyboard.isDown(Phaser.KeyCode.DOWN) || game.input.keyboard.isDown(Phaser.KeyCode.S)) {
            let obj = selectableGravObjects[currentHighlightedObjIndex];
            if (obj) {
                obj.gravWeight = Math.max(obj.gravMin, obj.gravWeight - 5000);
                obj.weightHasBeenChanged = true;
            }
        }
    }

    function doControlButtons(){
        if(game.input.keyboard.isDown(Phaser.KeyCode.R)){
            framesHoldingR++;
            if(framesHoldingR > 60) {
                onPlayerDeath();
                framesHoldingR = -30;
                // Immediately resetting again takes 50% longer to avoid accidental double resets
            }
        } else {
            if(framesHoldingR < 0)
                framesHoldingR++;
            framesHoldingR = Math.max(0, framesHoldingR);
        }
    }

    function doPlayerMovement(){
        if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT) || game.input.keyboard.isDown(Phaser.KeyCode.A)) {
            if (player.body.touching.down && !jumpHandler.recentlyJumped()) {
                player.body.velocity.x = Math.max(-maxHorizontalVelocity, player.body.velocity.x - groundAcceleration);
            } else {
                player.body.velocity.x -= airAcceleration;
            }
        } else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT) || game.input.keyboard.isDown(Phaser.KeyCode.D)) {
            if (player.body.touching.down && !jumpHandler.recentlyJumped()) {
                player.body.velocity.x = Math.min(maxHorizontalVelocity, player.body.velocity.x + groundAcceleration);
            } else {
                player.body.velocity.x += airAcceleration;
            }
        } else {
            if (player.body.touching.down && !jumpHandler.isJumping) {
                player.body.velocity.x = player.body.velocity.x * frictionCoef;
            }
        }

        if (player.body.velocity.x < 0 && player.isTouchingLeft) {
            player.body.velocity.x = 0;
        }
        if (player.body.velocity.x > 0 && player.isTouchingRight) {
            player.body.velocity.x = 0;
        }
    }

    function doObjMovement() {
        movers.forEach(function(obj) {
            moveObjInPattern(obj);
        })
    }

    function doHitGroundAnimation() {
        if (jumpHandler.isJumping && player.isTouchingBottom) {
            // add player.body.velocity.x / 14 so that particles appear where player *will* be next frame
            let emitter = game.add.emitter(player.x + player.body.velocity.x/14, player.bottom + 2);
            let numParticles = Math.max(5, (previous_velocity_y - 220)/40) ;

            if (isBouncing) {
              emitter.makeParticles('bounceParticle', 0, numParticles, true);
            } else {
              emitter.makeParticles('groundParticle', 0, numParticles, true);
            }
            emitter.gravity = 300;
            emitter.width = 20;
            emitter.setYSpeed(-100);
            emitter.start(true, 500, null, numParticles);
            game.time.events.add(1000, function() {
                emitter.destroy(true);
            }, null);
            emitters.add(emitter);

            if (!game.input.keyboard.isDown(Phaser.KeyCode.UP || !game.input.keyboard.isDown(Phaser.KeyCode.W))) {
                let hitGroundSound = game.add.audio('landing');
                hitGroundSound.volume = 0.1  * optionsData.master * optionsData.soundFX;
                hitGroundSound.allowMultiple = false;
                hitGroundSound.play();
            }
        }

        // Fade out the particles over their lifespan
        emitters.forEach(function(emitter) {
            emitter.forEachAlive(function(p) {
                //p.alpha = p.lifespan / emitter.lifespan;
                p.alpha = quadraticEase(p.lifespan, emitter.lifespan);
            }, null);
        }, null);
    }

    function checkWallCollision() {
        //If just landed on top of a block under another, get out of the wall and keep moving
        if ((player.body.touching.down || player.isTouchingBottom) && jumpHandler.isJumping && (player.isTouchingLeft || player.isTouchingRight)) {
            player.body.velocity.x = player.isTouchingLeft * groundAcceleration - player.isTouchingRight * groundAcceleration;
            player.body.velocity.y = previous_velocity_y;
        }

        //If stuck in a wall, get out of the wall and keep moving
        if ((player.body.touching.down || player.isTouchingBottom) && player.isTouchingTop && jumpHandler.isJumping) {
            player.body.velocity.x = player.isTouchingLeft * groundAcceleration - player.isTouchingRight * groundAcceleration;
            player.x = player.x + player.isTouchingLeft * ((blockSize/2) - (player.body.left % (blockSize/2))) - player.isTouchingRight * (player.body.right % (blockSize/2));
            if (player.body.velocity.y === 0) {
                player.body.velocity.y = previous_velocity_y;
            }
        }

        // Handles platforms
        if (player.body.velocity.x == 0 && (player.isTouchingLeft||player.isTouchingRight) && player.body.touching.down) {
            player.body.moves = false;
        }
    }

    function doGravityPhysics(){

        gravityEffectsOnObject(player);
        emitters.forEach(function(emitter) {
            emitter.forEachAlive(function(p) {
                gravityEffectsOnObject(p);
            }, null);
        }, null);

        // Gravity object changes

        gravObjects.forEach(function(gravObj) {
            gravObj.gravParticles.forEachAlive(function(p) {
                gravityEffectsOnObject(p);
            }, null);

            if (gravObj.flux && !isStopped()) {
                gravObj.gravWeight += 2000 * gravObj.fluxConst;
                if (gravObj.gravWeight >= gravObj.gravMax || gravObj.gravWeight <= gravObj.gravMin) {
                    gravObj.fluxConst *= -1;
                }
            }

        });
    }

    function moveObjInPattern(obj) {
        let loc = obj.body.position;
        let movementList = obj.movementList;
        let movementIndex = obj.movementIndex;
        let movingToX = movementList[movementIndex].split('#')[0] - blockSize/2;
        let movingToY = movementList[movementIndex].split('#')[1] - blockSize/2;

        if (parseInt(loc.x) === movingToX && parseInt(loc.y) === movingToY) {
            obj.movementIndex = (movementIndex + 1) % movementList.length;
        } else {
            obj.body.velocity.x = (loc.x < movingToX) * movingObjSpeed -
                                  (loc.x > movingToX) * movingObjSpeed;
            obj.body.velocity.y = (loc.y < movingToY) * movingObjSpeed -
                                  (loc.y > movingToY) * movingObjSpeed;
        }
    }

    function gravityEffectsOnObject(obj) {
        let xGravCoef = 0;
        let yGravCoef = 0;

        gravObjects.forEach(function(gravObj) {

            let diff = Phaser.Point.subtract(obj.position, gravObj.position);
            let r = diff.getMagnitude();
            diff.normalize();

            if ( r < gravObj.radius) {
                xGravCoef += gravObj.gravWeight * diff.x / r;
                yGravCoef += gravObj.gravWeight * diff.y / r;
            }
        });

        if (obj.gravConstant !== undefined) {
            xGravCoef *= obj.gravConstant;
            yGravCoef *= obj.gravConstant;
        }

        if (xGravCoef > 0) {
            obj.body.acceleration.x = -xGravCoef * !obj.isTouchingLeft;
        } else {
            obj.body.acceleration.x = -xGravCoef * !obj.isTouchingRight;
        }

        obj.body.acceleration.y = -yGravCoef;

    }

    function onPlayerDeath() {
        //Handles resetting levels after player is dead
        game.camera.setPosition(0,0);
        deathReadout.addColor("#ffffff", 0);
        death_icon.alpha=0.6;
        deathReadout.alpha=0.6;

        if(playerHasHitCheckpoint) {
            resetLevel();
        } else {
            clearLevel();
            loadLevel();
            death_icon.bringToTop();
            deathReadout.bringToTop();
        }
    }

    function onExit(obj, exit) {
        exitHandler.onExit(obj, exit, game, processExit);
    }

    function processExit() {
        //Handles the player reaching the end of a level
        updateLocalStorage();

        playerHasHitCheckpoint = false;
        clearLevel();

        exitHandler.reset();

        game.physics.arcade.isPaused = false;
        if (currentLevel + 1 === levelLoader.getLevelCount()) {
            game.state.start('win');
        } else {
            loadLevel();
            death_icon.bringToTop();
            deathReadout.bringToTop();
        }
    }

    function updateLocalStorage() {
        //Handles the local save data
        let levelList = game.cache.getText('levelList').split('\n');
        playerDataList = localStorage.getItem('user_progress').split(',');
        currentLevel++;
        playerDataList[Math.min(levelList.length - 1, currentLevel)] = 0;
        localStorage.setItem('user_progress', playerDataList);
    }

    function onCheckpointHit(player, checkpoint) {
        if (! checkpoint.hasBeenHitBefore) {
            checkpoint.hasBeenHitBefore = true;
            playerHasHitCheckpoint = true;
            playerStartX = checkpoint.x;
            playerStartY = checkpoint.y - 15;
            checkpoint.loadTexture('checkpointActivated');

            let checkpointSound = game.add.audio('checkpointHit');
            checkpointSound.volume = .1 * optionsData.master * optionsData.soundFX;
            checkpointSound.play();
        }
    }

    function quadraticEase(t, tmax) {
        return 1 - Math.pow(tmax - t, 2)/Math.pow(tmax, 2);
    }

    function setLevel(lnum){
        currentLevel = lnum;
    }

    return {
        preload: preload,
        create: create,
        update: update,
        render: render,
        setLevel: setLevel,
    };
};
