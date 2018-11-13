let LevelLoader = function (game) {
    const playerSize = 14;
    let levels;

    function setUp() {
        let levelList = game.cache.getText('levelList').split('\n');
        let levelNames = [];
        for(let i = 0; i < levelList.length; i++){
            levelNames[i]="assets/levels/"+levelList[i];
            game.load.text("level"+i, levelNames[i]);
        }

        levels = [];
        game.load.onLoadComplete.add(function() {
            for(let i = 0; i < levelList.length; i++){
                levels[i] = game.cache.getText("level"+i).split('\n');
            }
        }, null);
    }

    function getLevelCount() {
        return levels.length;
    }

    function makePlayer(x, y, playerGrav) {
        let player = game.add.sprite(x, y, 'player');
        player.anchor.set(.5, .5);
        player.body.setSize(playerSize, playerSize, 1, 1);
        player.body.gravity.y = playerGrav;
        player.body.collideWorldBounds = true;
        game.camera.follow(player, Phaser.Camera.FOLLOW_PLATFORMER, 0.2);
        let dzone = game.camera.deadzone;
        dzone.y +=60;
        dzone.height+=40;
        return player;
    }

    function loadObject(levelObjects, objectName, objectX, objectY, playerGrav, objectInfo){
        let gravObj;
        let movementList;
        let wall;
        switch(objectName) {
            case 'wall':
                wall = game.add.sprite(objectX, objectY, objectName);
                wall.moving = false;
                wall.body.immovable = true;
                wall.anchor.set(.5,.5);
                levelObjects.walls.add(wall);
                break;
            case 'wall_move':
                wall = game.add.sprite(objectX, objectY, 'wall');
                movementList = objectInfo[3].split('-');
                wall.moving = true;
                wall.movementList = movementList;
                wall.movementIndex = 0;
                wall.body.immovable = true;
                wall.anchor.set(.5, .5);
                wall.startingX = objectX;
                wall.startingY = objectY;
                levelObjects.walls.add(wall);
                levelObjects.movers.push(wall);
                break;
            case 'bounce':
                wall = game.add.sprite(objectX, objectY, objectName);
                wall.moving = false;
                wall.body.immovable = true;
                wall.anchor.set(.5,.5);
                levelObjects.bouncers.add(wall);
                break;
            case 'grass':
                wall = game.add.sprite(objectX, objectY, objectName);
                wall.moving = false;
                wall.body.immovable = true;
                wall.anchor.set(.5,.5);
                levelObjects.walls.add(wall);
                break;
            case 'gravObj_off':
                // x Location, y location, gravMin, gravMax, on?, flux?, moving?
                gravObj = GravObj(game, objectX, objectY, parseFloat(objectInfo[3]), parseFloat(objectInfo[4]),
                    false, false, false);
                levelObjects.gravObjects.add(gravObj);
                break;
            case 'gravObj_on':
                gravObj = GravObj(game, objectX, objectY, parseFloat(objectInfo[3]), parseFloat(objectInfo[4]),
                    true, false, false);
                levelObjects.gravObjects.add(gravObj);
                break;
            case 'gravObj_flux':
                gravObj = GravObj(game, objectX, objectY, parseFloat(objectInfo[3]), parseFloat(objectInfo[4]),
                    true, true, false);
                levelObjects.gravObjects.add(gravObj);
                break;
            case 'gravObj_move':
                //list in format x1#y1-x2#y2-x3#y3...
                movementList = objectInfo[5].split('-');
                gravObj = GravObj(game, objectX, objectY, parseFloat(objectInfo[3]), parseFloat(objectInfo[4]),
                    true, false, true, movementList);
                gravObj.startingX = objectX;
                gravObj.startingY = objectY;
                levelObjects.gravObjects.add(gravObj);
                levelObjects.movers.push(gravObj);
                break;
            case 'gravObj_moveFlux':
                movementList = objectInfo[5].split('-');
                gravObj = GravObj(game, objectX, objectY, parseFloat(objectInfo[3]), parseFloat(objectInfo[4]),
                    true, true, true, movementList);
                gravObj.startingX = objectX;
                gravObj.startingY = objectY;
                levelObjects.gravObjects.add(gravObj);
                levelObjects.movers.push(gravObj);
                break;
            case 'shocker':
                let shocker = game.add.sprite(objectX, objectY, objectName);
                shocker.blendMode = PIXI.blendModes.ADD;
                shocker.anchor.set(.5, .5);
                shocker.animations.add('crackle');
                shocker.animations.play('crackle', Math.random() * 6 + 4, true);


                // let shocker2 = game.add.sprite(objectX, objectY, objectName);
                // shocker2.blendMode = PIXI.blendModes.DIFFERENCE;
                // shocker2.anchor.set(.5, .5);
                // shocker2.animations.add('crackle');
                // shocker2.animations.play('crackle', Math.random() * 10 + 10, true);
                // shocker2.rotation = Math.PI / 2;

                levelObjects.shockers.add(shocker);
                // levelObjects.shockers.add(shocker2);
                break;
            case 'checkpoint':
                let checkpoint = game.add.sprite(objectX, objectY, objectName);
                checkpoint.anchor.set(.5, .5);
                //checkpoint.body.immovable = true;
                checkpoint.hasBeenHitBefore = false;
                levelObjects.checkpoints.add(checkpoint);
                break;
            case 'door':
                let door = game.add.sprite(objectX, objectY, objectName);
                door.anchor.set(.5, .5);
                door.body.immovable = true;
                levelObjects.exits.add(door);
                break;
            case 'exit':
                let exit = game.add.sprite(objectX, objectY, objectName);
                exit.anchor.set(.5, .5);
                exit.body.immovable = true;
                levelObjects.exits.add(exit);
                break;
            case 'tutorial_movement':
            case 'tutorial_esc_pause':
            case 'tutorial_time_freeze':
            case 'tutorial_gravity_change':
            case 'tutorial_gravity_select':
            case 'tutorial_bounce':
            case 'tutorial_restart':
                let sign = game.add.sprite(objectX, objectY, objectName);
                levelObjects.tutorialSigns.add(sign);
                break;
            case 'player':
                levelObjects.player = makePlayer(objectX, objectY, playerGrav);
                break;
            default:
                break;
        }

        return levelObjects;
    }

    function initializeLevelObjects(){
        let levelObjects = {};
        //levelObjects.player = makePlayer(0,0,0);
        levelObjects.backgrounds = game.add.group();
        levelObjects.walls = game.add.group();
        levelObjects.gravObjects = game.add.group();
        levelObjects.shockers = game.add.group();
        levelObjects.exits = game.add.group();
        levelObjects.emitters = game.add.group();
        levelObjects.checkpoints = game.add.group();
        levelObjects.tutorialSigns = game.add.group();
        levelObjects.bouncers = game.add.group();
        levelObjects.movers = [];


        return levelObjects;
    }

    // Function to determine which tile to use for backgrounds
    function stoneBG(x, y, lnum, spriteNumMax){
        let n1 = x+(lnum+3);
        let n2 = y;

        let out = (3*n1 + (n2));
        out = Math.pow(out, (lnum%2)+21);


        return (out%spriteNumMax) +1; // Put sprite values into correct range
    }

    // Function to determine which starry night tile to use
    // The stoneBG function always returns 1 when there's 4 sprites, so we need a different one for the starry sky
    function skyBG(x, y, lnum, spriteNumMax){
//        let h = x%2;
//        let v = y;
//        if(x%4<2)
//            v++;
//        let out = 1 + h + 2*(v%2);
//        return (out%spriteNumMax) + 1;
        if ((x+y) % 4 != 0){
            return ((x+y) % 4);
        } else {
            return 1;
        }
    }

    function buildBackground(levelObjects, width, height, levelNumber, spriteNumMax, spritePrefix = "bg_large_stone_", blockSize = 30, tileFunction = stoneBG){
        let xMax = parseInt(width) + blockSize;
        let yMax = parseInt(height) + blockSize;
        
        for(let x=0; x<xMax; x+=blockSize){
            for(let y=0; y<yMax; y+=blockSize){
                let tileType = tileFunction((x/blockSize), (y/blockSize), levelNumber, spriteNumMax);
                let newBG = game.add.sprite(x, y, spritePrefix+tileType);
                newBG.anchor.set(.5, .5);
                newBG.body.immovable = true;
               
                levelObjects.backgrounds.add(newBG);
            }
        }
        console.log("Generated "+levelObjects.backgrounds.countLiving() + " bg tiles");
        return levelObjects;
    }

    function loadLevel(levelNumber) {
        let level = levels[levelNumber];
        let levelObjects = initializeLevelObjects();

        // Get bounds
        let bounds = level[0].split(',');
        game.world.setBounds(0,0,parseInt(bounds[0]), parseInt(bounds[1]));

        // Get player gravity
        let playerGrav = parseInt(level[1]);

        // Load background
        if(levelNumber == 0){
            levelObjects = buildBackground(levelObjects, bounds[0], bounds[1], levelNumber, 1, "bg_sky_", 90, skyBG);
        } else {
            levelObjects = buildBackground(levelObjects, bounds[0], bounds[1], levelNumber, 7, "bg_large_stone_", 90, stoneBG);
        }

        // Load level objects
        for (let i = 2; i < level.length; i++) {
            let element = level[i];
            let objectInfo = element.split(',');
            let objectName = objectInfo[0];
            let objectX = parseFloat(objectInfo[1]);
            let objectY = parseFloat(objectInfo[2]);

            levelObjects = loadObject(levelObjects, objectName, objectX, objectY, playerGrav, objectInfo);

        }

        console.log("Loaded "+level.length + " level objects");

        // Add player start location
        levelObjects.playerStartX = levelObjects.player.x;
        levelObjects.playerStartY = levelObjects.player.y;
        levelObjects.playerGrav = levelObjects.player.body.gravity.y;

        return levelObjects;
    }

    return {
        setUp: setUp,
        getLevelCount: getLevelCount,
        loadLevel: loadLevel,
        makePlayer: makePlayer,
    }
};
