const gravCoef = 150000;

let width;
let height;

let game;
let graphic;
let bounds;
let walls;
let bouncers;
let wall_moves;
let shockers;
let gravObj_offs;
let gravObj_ons;
let gravObj_fluxes;
let gravObj_movers;
let gravObj_moveFluxes;
let clickedObj;
let gravObj;
let gravObj_off;
let gravObj_on;
let level;
let player_start;
let currentSelectedObj;
let mousePosition;

let zoom = false;
let leftClicked = false;
let pathing = false;
let pathedObj;

let blockFullSize=30;
let blockHalfSize=blockFullSize/2;
let blockQuarterSize=blockHalfSize/2;

// Load locally stored levels
if(localStorage.getItem("localLevels") == null){
    console.warn("No local level storage found");
    localStorage.setItem("localLevels", "");
}
let localLevelNames = localStorage.getItem("localLevels");
let localLevelList = localLevelNames.split(",");
let localLevelCount = localLevelList.length - 1; // First level name will always be blank/not a level
let localLevelId; // This is only set on loading from localStorage

let selector = $('#localLevels');

for(let i = 0; i < localLevelCount; i++) {
    selector.append('<option ' + ' value="custom' + i + '">' + "Custom level " + (i+1) + '</option>');
}

$('.firstSection').hide();

//Loads in an existing level to change
function editorStart2() {
    let widthBlocks = $('#width')[0].value;
    let heightBlocks = $('#height')[0].value;


        let input = $('#file')[0];
        let reader = new FileReader();

        if (input.files.length) {
            let textFile = input.files[0];

            reader.readAsText(textFile);

            $(reader).on('load', function(e) {
                let file = e.target.result;

                if(file && file.length) {
                    level = file.split('\n');

                    let boundary = level[0].split(',');
                    width = parseInt(boundary[0]);
                    height = parseInt(boundary[1]);
                    makePhaserGame();
                }
            });
        } else {
            width = widthBlocks * 30;
            height = heightBlocks * 30;

            let levelText = $('#levelText')[0].value;

            if (levelText) {
                level = levelText.split('\n');
                let boundary = level[0].split(',');
                width = parseInt(boundary[0]);
                height = parseInt(boundary[1]);
            }
            makePhaserGame();
        }
    $('.sizeSelect').hide();
    $('.firstSection').show();
}

//Starts a new blank level
function editorStart1() {
    let widthBlocks = $('#width')[0].value;
    let heightBlocks = $('#height')[0].value;

    width = widthBlocks * 30;
    height = heightBlocks * 30;

    let levelText = $('#levelText')[0].value;

    if (levelText) {
        level = levelText.split('\n');
        let boundary = level[0].split(',');
        width = parseInt(boundary[0]);
        height = parseInt(boundary[1]);
    }

    makePhaserGame();

    $('.sizeSelect').hide();
    $('.firstSection').show();
}

function makePhaserGame(){
    game = new Phaser.Game(width, height, Phaser.CANVAS);
    game.state.add('main', {preload: preload, create: create, update: update});
    game.state.start('main');
}

//Loads a recently edited level from local storage. Currently not tested...
function loadFromLocal(){
    localLevelId = $("#localLevels").val();
    if(localLevelId == "lastLevel" && !(localStorage.getItem("lastLevel"))){
        console.error("Err: no previous level to load");
        return;
    }
        let widthBlocks = $('#width')[0].value;
        let heightBlocks = $('#height')[0].value;

        let file = localStorage.getItem(localLevelId);
        level = file.split('\n');
        let boundary = level[0].split(',');
        width = parseInt(boundary[0]);
        height = parseInt(boundary[1]);
        makePhaserGame();
    $('.sizeSelect').hide();
    $('.firstSection').show();
}

function preload() {
    game.load.image('wall', 'assets/art/bricks_gray.png');
    game.load.image('bounce', 'assets/art/bounce.png');
    game.load.image('gravObj', 'assets/art/gravObj.png');
    game.load.spritesheet('shocker', 'assets/art/electricity_sprites.png', 30, 30, 3);
    game.load.image('checkpoint', 'assets/art/flag_green.png');
    game.load.image('exit', 'assets/art/exit.png');
    game.load.image('player', 'assets/art/player.png');
    game.load.image('path', 'assets/art/path.png');
    game.load.image('mov_wall', 'assets/art/bricks_red.png');
}

function draw_gridlines(){
    // Light gridlines at halfway point
    graphic.lineStyle(1, Phaser.Color.hexToRGB("#939dff"), 1);
    for(let x=blockHalfSize; x<width; x+=blockFullSize){
        graphic.moveTo(x,0);
        graphic.lineTo(x,height);
    }
    for(let y=blockHalfSize; y<height; y+=blockFullSize){
        graphic.moveTo(0,y);
        graphic.lineTo(width, y);
    }
    // Heavy gridlines at full point
    graphic.lineStyle(1, Phaser.Color.hexToRGB("#f7f7f7"), 1);
    for(let x=0; x<width; x+=blockFullSize){
        graphic.moveTo(x,0);
        graphic.lineTo(x,height);
    }
    for(let y=0; y<height; y+=blockFullSize){
        graphic.moveTo(0,y);
        graphic.lineTo(width, y);
    }
}

//This function changes the editor from the opening screen to the actual edit mode.
//Primarily, it builds up the level to user specifications.
function create() {
    game.stage.backgroundColor = '#6970db';
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.enableBody = true;

    game.canvas.oncontextmenu = function (e) {
        e.preventDefault();
    }

    bounds = new Phaser.Rectangle(0,0,width, height);
    graphic = game.add.graphics(bounds.x, bounds.y);
    graphic.drawRect(0, 0, bounds.width, bounds.height);

    draw_gridlines()

    //Create groups for all objects of same type
    walls = game.add.group();
    bouncers = game.add.group();
    wall_moves = game.add.group();
    gravObj_offs = game.add.group();
    gravObj_ons = game.add.group();
    gravObj_fluxes = game.add.group();
    gravObj_movers = game.add.group();
    gravObj_moveFluxes = game.add.group();
    shockers = game.add.group();
    checkpoints = game.add.group();
    exits = game.add.group();

    //Here we load in all previously established objects in the level
    if (level) {
        for (let i = 2; i < level.length; i++) {
            console.log("object "+i+" is: "+level[i]);
            let element = level[i];
            let objectInfo = element.split(',');
            let objectName = objectInfo[0];
            let objectX = parseFloat(objectInfo[1]);
            let objectY = parseFloat(objectInfo[2]);
            let obj;
            let movementList;

            switch(objectName) {
                case 'wall':
                    obj = game.add.sprite(objectX, objectY, objectName);
                    walls.add(obj);
                    break;
                case 'wall_move':
                    obj = game.add.sprite(objectX, objectY, 'mov_wall');
                    obj.movementPathing = game.add.group();
                    obj.currentNumber = 1;
                    movementList = objectInfo[3].split('-');
                    movementList.splice(1, movementList.length).forEach(function(ele){
                        let loc = ele.split('#');
                        let path = game.add.sprite(parseFloat(loc[0]), parseFloat(loc[1]), 'path');
                        path.anchor.set(.5, .5);
                        obj.movementPathing.add(path);
                        path.inputEnabled = true;
                        path.events.onInputDown.add(deleteObject, this);
                        path.events.onInputUp.add(inputUp, this);
                        path.input.boundsRect = bounds;
                        let num = game.add.text(path.position.x, path.position.y + 3, obj.currentNumber, {fill: "#000", fontSize: '16px'});
                        num.anchor.set(.5, .5);
                        obj.currentNumber += 1;
                        path.number = num;
                    });
                    wall_moves.add(obj);
                    break;
                case 'bounce':
                    obj = game.add.sprite(objectX, objectY, objectName);
                    bouncers.add(obj);
                    break;
                case 'gravObj_off':
                    obj = game.add.sprite(objectX, objectY, 'gravObj');
                    obj.gravMin = parseFloat(objectInfo[3]);
                    obj.gravMax = parseFloat(objectInfo[4]);
                    gravObj_offs.add(obj);
                    obj.tint = 0xffffff;
                    break;
                case 'gravObj_on':
                    obj = game.add.sprite(objectX, objectY, 'gravObj');
                    obj.gravMin = parseFloat(objectInfo[3]);
                    obj.gravMax = parseFloat(objectInfo[4]);
                    gravObj_ons.add(obj);
                    break;
                case 'gravObj_flux':
                    obj = game.add.sprite(objectX, objectY, 'gravObj');
                    obj.gravMin = parseFloat(objectInfo[3]);
                    obj.gravMax = parseFloat(objectInfo[4]);
                    gravObj_fluxes.add(obj);
                    obj.tint = 0xb0e0e6;
                    break;
                case 'gravObj_move':
                    obj = game.add.sprite(objectX, objectY, 'gravObj');
                    obj.gravMin = parseFloat(objectInfo[3]);
                    obj.gravMax = parseFloat(objectInfo[4]);
                    gravObj_movers.add(obj);
                    obj.movementPathing = game.add.group();
                    obj.currentNumber = 1;
                    movementList = objectInfo[5].split('-');
                    movementList.splice(1, movementList.length).forEach(function(ele){
                        let loc = ele.split('#');
                        let path = game.add.sprite(parseFloat(loc[0]), parseFloat(loc[1]), 'path');
                        path.anchor.set(.5, .5);
                        obj.movementPathing.add(path);
                        path.inputEnabled = true;
                        path.events.onInputDown.add(deleteObject, this);
                        path.events.onInputUp.add(inputUp, this);
                        path.input.boundsRect = bounds;
                        let num = game.add.text(path.position.x, path.position.y + 3, obj.currentNumber, {fill: "#000", fontSize: '16px'});
                        num.anchor.set(.5, .5);
                        obj.currentNumber += 1;
                        path.number = num;
                    });
                    break;
                case 'gravObj_moveFlux':
                    obj = game.add.sprite(objectX, objectY, 'gravObj');
                    obj.gravMin = parseFloat(objectInfo[3]);
                    obj.gravMax = parseFloat(objectInfo[4]);
                    gravObj_moveFluxes.add(obj);
                    obj.tint = 0xb0e0e6;
                    obj.movementPathing = game.add.group();
                    obj.currentNumber = 1;
                    movementList = objectInfo[5].split('-');
                    movementList.splice(1, movementList.length).forEach(function(ele){
                        let loc = ele.split('#');
                        let path = game.add.sprite(parseFloat(loc[0]), parseFloat(loc[1]), 'path');
                        path.anchor.set(.5, .5);
                        obj.movementPathing.add(path);
                        path.inputEnabled = true;
                        path.events.onInputDown.add(deleteObject, this);
                        path.events.onInputUp.add(inputUp, this);
                        path.input.boundsRect = bounds;
                        let num = game.add.text(path.position.x, path.position.y + 3, obj.currentNumber, {fill: "#000", fontSize: '16px'});
                        num.anchor.set(.5, .5);
                        obj.currentNumber += 1;
                        path.number = num;
                    });
                    break;
                case 'shocker':
                    obj = game.add.sprite(objectX, objectY, objectName);
                    shockers.add(obj);
                    obj.animations.add('crackle');
                    obj.animations.play('crackle', 10, true);
                    break;
                case 'checkpoint':
                    obj = game.add.sprite(objectX, objectY, objectName);
                    checkpoints.add(obj);
                    break;
                case 'exit':
                    obj = game.add.sprite(objectX, objectY, objectName);
                    exits.add(obj);
                    break;
                case 'player':
                    player_start = game.add.sprite(objectX, objectY, objectName);
                    obj = player_start;
                    break;
                default:
                    break;
            }
            obj.anchor.set(.5,.5);
            obj.inputEnabled = true;
            obj.events.onInputDown.add(deleteObject, this);
            obj.events.onInputUp.add(inputUp, this);
            obj.input.boundsRect = bounds;
        }
    } else {
        // In case of new level, Make walls around edges
        for (let i = blockHalfSize; i <= width; i += blockFullSize){
            makeWall(i, blockHalfSize);
            makeWall(i, height - blockHalfSize);
        }
        for (let i = blockHalfSize; i < height; i += blockFullSize){
            makeWall(blockHalfSize, i);
            makeWall(width - blockHalfSize, i);
        }

        player_start = game.add.sprite(blockFullSize + blockQuarterSize, height - blockFullSize - blockQuarterSize, 'player');
        player_start.anchor.set(.5, .5);
        player_start.inputEnabled = true;
        player_start.events.onInputDown.add(deleteObject, this);
        player_start.events.onInputUp.add(inputUp, this);
        player_start.input.boundsRect = bounds;
    }

    // Buttons for adding objects to canvas
    let adders = $('.adders');
    adders.show();
    adders.click(function() {
        currentSelectedObj = $(this).attr('id');
        if ($(this).attr('class') != 'adders current') {
            adders.removeClass('current');
            $(this).addClass('current');
        } else {
            adders.removeClass('current');
            currentSelectedObj = null;
        }

        if (currentSelectedObj == 'gravObj_on' || currentSelectedObj == 'gravObj_flux' || currentSelectedObj == 'gravObj_move' || currentSelectedObj == 'gravObj_moveFlux') {
            $(".list").addClass('show');
            $(".break").hide();
        } else {
            $(".list").removeClass('show');
            $(".break").show();
        }
    });

    // Display string representation of canvas
    $('#display').click(buildLevelString);

    $('#zoom').click(zoomToggle);

}

function buildLevelString(){
    let result = game.world.width + ',' + game.world.height + '\n' + $('#playerGrav')[0].value + '\n';

    for (let i = 0; i < walls.children.length; i++) {
        let obj = walls.children[i];
        result += 'wall,' + obj.position.x + ',' + obj.position.y + '\n'
    }
    for (let i = 0; i < bouncers.children.length; i++) {
        let obj = bouncers.children[i];
        result += 'bounce,' + obj.position.x + ',' + obj.position.y + '\n'
    }
    for (let i = 0; i < shockers.children.length; i++) {
        let obj = shockers.children[i];
        result += 'shocker,' + obj.position.x + ',' + obj.position.y + '\n'
    }
    for (let i = 0; i < gravObj_offs.children.length; i++) {
        let obj = gravObj_offs.children[i];
        result += 'gravObj_off,' + obj.position.x + ',' + obj.position.y + ',' + obj.gravMin + ',' + obj.gravMax + '\n'
    }
    for (let i = 0; i < gravObj_ons.children.length; i++) {
        let obj = gravObj_ons.children[i];
        result += 'gravObj_on,' + obj.position.x + ',' + obj.position.y + ',' + obj.gravMin + ',' + obj.gravMax + '\n'
    }

    gravObj_fluxes.forEach(function(obj) {
        result += 'gravObj_flux,' + obj.position.x + ',' + obj.position.y + ',' + obj.gravMin + ',' + obj.gravMax + '\n'
    });

    wall_moves.forEach(function(obj) {
        result += 'wall_move,' + obj.position.x + ',' + obj.position.y + ',' + + obj.position.x + '#' + obj.position.y + '-';
        obj.movementPathing.forEach(function(ele) {
            result += ele.position.x + '#' + ele.position.y + '-';
        });
        result = result.slice(0, -1) + '\n';
    });

    gravObj_movers.forEach(function(obj) {
        result += 'gravObj_move,' + obj.position.x + ',' + obj.position.y + ',' + obj.gravMin + ',' + obj.gravMax + ',' + obj.position.x + '#' + obj.position.y + '-';
        obj.movementPathing.forEach(function(ele) {
            result += ele.position.x + '#' + ele.position.y + '-';
        });
        result = result.slice(0, -1) + '\n';
    });

    gravObj_moveFluxes.forEach(function(obj) {
        result += 'gravObj_moveFlux,' + obj.position.x + ',' + obj.position.y + ',' + obj.gravMin + ',' + obj.gravMax + ',' + obj.position.x + '#' + obj.position.y + '-';
        obj.movementPathing.forEach(function(ele) {
            result += ele.position.x + '#' + ele.position.y + '-'
        });
        result = result.slice(0, -1) + '\n';
    });

    checkpoints.children.forEach(function(obj) {
        result += 'checkpoint,' + obj.position.x + ',' + obj.position.y + '\n';
    });

    exits.children.forEach(function(obj) {
        result += 'exit,' + obj.position.x + ',' + obj.position.y + '\n'
    });

    result += 'player,' + player_start.position.x + ',' + player_start.position.y + '\n';

    $(this).hide();
    $('.firstSection').remove();
    let gameText = result.slice(0,-1);
    $('#response').text(gameText);
    localStorage.setItem("lastLevel", gameText);
    let newLevelName = "custom"+localLevelCount;
    localStorage.setItem("localLevels", localLevelNames+","+newLevelName);
    localStorage.setItem(newLevelName, gameText);
    game.destroy();

}

function zoomToggle() {
    if (! zoom) {
        game.scale.maxWidth = window.innerWidth - 15;
        game.scale.maxHeight = window.innerHeight - 170;
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        $(this)[0].value = 'Zoom In';

    } else {
        game.scale.maxWidth = width;
        game.scale.maxHeight = height;
        game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
        $(this)[0].value = 'Zoom Out';
    }
    zoom = ! zoom;
}

function initializeObj(objectName) {
    let obj;

    // Default spawn at center of area
    // Change this if spawning on click / from mouse position
    let spawnPosX = game.input.activePointer.position.x;
    let spawnPosY = game.input.activePointer.position.y;

    // Move spawn positions to fit major gridlines
    //spawnPosX -= spawnPosX%blockFullSize + blockHalfSize;
    //spawnPosY -= spawnPosY%blockFullSize + blockHalfSize;

    if (objectName == 'gravObj_off') {
        obj = game.add.sprite(spawnPosX, spawnPosY, 'gravObj');
        obj.tint = 0xffffff;
        gravObj_offs.add(obj);
        obj.gravMin = parseInt($('#gravMin')[0].value);
        obj.gravMax = parseInt($('#gravMax')[0].value);
    } else if (objectName == 'gravObj_on') {
        obj = game.add.sprite(spawnPosX, spawnPosY, 'gravObj');
        gravObj_ons.add(obj);
        obj.gravMin = parseInt($('#gravMin')[0].value);
        obj.gravMax = parseInt($('#gravMax')[0].value);
    } else if (objectName == 'gravObj_flux') {
        obj = game.add.sprite(spawnPosX, spawnPosY, 'gravObj');
        obj.tint = 0xb0e0e6;
        gravObj_fluxes.add(obj);
        obj.gravMin = parseInt($('#gravMin')[0].value);
        obj.gravMax = parseInt($('#gravMax')[0].value);
    } else if (objectName == 'wall_move') {
        obj = game.add.sprite(spawnPosX, spawnPosY, 'wall');
        wall_moves.add(obj);
        obj.movementPathing = game.add.group();
        obj.currentNumber = 1;
        pathing = true;
        currentSelectedObj = 'path';
        pathedObj = obj;
    } else if (objectName == 'gravObj_move') {
        obj = game.add.sprite(spawnPosX, spawnPosY, 'gravObj');
        obj.tint = 0x351777;
        gravObj_movers.add(obj);
        obj.gravMin = parseInt($('#gravMin')[0].value);
        obj.gravMax = parseInt($('#gravMax')[0].value);
        obj.movementPathing = game.add.group();
        obj.currentNumber = 1;
        pathing = true;
        currentSelectedObj = 'path';
        pathedObj = obj;
    } else if (objectName == 'gravObj_moveFlux') {
        obj = game.add.sprite(spawnPosX, spawnPosY, 'gravObj');
        obj.tint = 0xb0e0e6;
        gravObj_moveFluxes.add(obj);
        obj.gravMin = parseInt($('#gravMin')[0].value);
        obj.gravMax = parseInt($('#gravMax')[0].value);
        obj.movementPathing = game.add.group();
        obj.currentNumber = 1;
        pathing = true;
        currentSelectedObj = 'path';
        pathedObj = obj;
    } else {
        obj = game.add.sprite(spawnPosX, spawnPosY, objectName);
    }


    obj.inputEnabled = true;
    obj.events.onInputDown.add(deleteObject, this);
    obj.anchor.set(.5, .5);
    //obj.input.enableDrag();
    obj.events.onInputUp.add(inputUp, this);

    obj.input.boundsRect = bounds;
    inputUp(obj);

    switch(objectName){
        case 'wall':
            walls.add(obj);
            break;
        case 'bounce':
            bouncers.add(obj);
            break;
        case 'shocker':
            shockers.add(obj);
            obj.animations.add('crackle');
            obj.animations.play('crackle', 10, true);
            break;
        case 'checkpoint':
            checkpoints.add(obj);
            break;
        case 'exit':
            exits.add(obj);
            break;
        case 'path':
            pathedObj.movementPathing.add(obj);
            let num = game.add.text(obj.position.x, obj.position.y + 3, pathedObj.currentNumber, {fill: "#000", fontSize: '16px'});
            num.anchor.set(.5, .5);
            pathedObj.currentNumber += 1;
            obj.number = num;
            break;
        default:
            break;
    }
}

function inputUp(obj) {
    // Set dragged object velocity to zero
    obj.body.velocity.x = 0;
    obj.body.velocity.y = 0;

    // Snap to grid
    let diff = obj.body.x % blockHalfSize;
    if(diff >blockQuarterSize)
        diff -=blockHalfSize;
    obj.x-=diff;
    diff = obj.body.y % blockHalfSize;
    if(diff >blockQuarterSize)
        diff -=blockHalfSize;
    obj.y-=diff;

    // If the object has a number on top of it, keep them together
    if (obj.number) {
        obj.number.body.velocity.x = 0;
        obj.number.body.velocity.y = 0;
        obj.number.x = obj.x;
        obj.number.y = obj.y + 3;
    }

    // Only relevant for collision detection, makes object still on collision
    //obj.body.immovable = true;
    //clickedObj.body.immovable = true;
    clickedObj = null;
}

function makeWall(x, y){

    let wall = game.add.sprite(x, y, 'wall');
    wall.inputEnabled = true;
    wall.events.onInputDown.add(deleteObject, this);
    wall.events.onInputUp.add(inputUp, this);
    wall.anchor.set(.5, .5);
    //wall.input.enableDrag();
    wall.input.boundsRect = bounds;
    wall.body.immovable = true;
    walls.add(wall);

}

function deleteObject(obj) {
    obj.body.immovable = false;
    clickedObj = obj;
    if (game.input.activePointer.rightButton.isDown) {

        if (gravObj_movers.children.indexOf(obj) > -1 ||           gravObj_moveFluxes.children.indexOf(obj) > -1 ||       wall_moves.children.indexOf(obj) > -1) {

            currentSelectedObj = 'wall';
            obj.movementPathing.forEach(function(ele) {
                ele.number.destroy();
            });
            obj.movementPathing.destroy();
        }
        walls.remove(obj);
        wall_moves.remove(obj);
	    shockers.remove(obj);
	    gravObj_ons.remove(obj);
        gravObj_offs.remove(obj);
        gravObj_fluxes.remove(obj);
        gravObj_movers.remove(obj);
        gravObj_moveFluxes.remove(obj);
        if (pathedObj) {
            pathedObj.movementPathing.remove(obj);
        }
        if (obj.number) {
            pathedObj.currentNumber -= 1;
            obj.number.kill();
        }
        checkpoints.remove(obj);
        exits.remove(obj);
        if (obj !== player_start) {
            obj.kill();
        }
        clickedObj = null;
    }

}

function expand_level_right() {
    width = width + 30;
    game.scale.setGameSize(width, height)
    draw_gridlines();
}

function expand_level_up() {
    height = height + 30;
    game.scale.setGameSize(width, height)

    for (let i = 0; i < walls.children.length; i++) {
        let current_obj = walls.children[i];
        current_obj.y = current_obj.y+30;
    }
    for (let i = 0; i < wall_moves.children.length; i++) {
        let current_obj = wall_moves.children[i];
        current_obj.y = current_obj.y+30;
    }
    for (let i = 0; i < gravObj_offs.children.length; i++) {
        let current_obj = gravObj_offs.children[i];
        current_obj.y = current_obj.y+30;
    }
    for (let i = 0; i < gravObj_ons.children.length; i++) {
        let current_obj = gravObj_ons.children[i];
        current_obj.y = current_obj.y+30;
    }
    for (let i = 0; i < gravObj_fluxes.children.length; i++) {
        let current_obj = gravObj_fluxes.children[i];
        current_obj.y = current_obj.y+30;
    }
    for (let i = 0; i < gravObj_movers.children.length; i++) {
        let current_obj = gravObj_movers.children[i];
        current_obj.y = current_obj.y+30;
    }
    for (let i = 0; i < gravObj_moveFluxes.children.length; i++) {
        let current_obj = gravObj_moveFluxes.children[i];
        current_obj.y = current_obj.y+30;
    }
    for (let i = 0; i < shockers.children.length; i++) {
        let current_obj = shockers.children[i];
        current_obj.y = current_obj.y+30;
    }
    for (let i = 0; i < checkpoints.children.length; i++) {
        let current_obj = checkpoints.children[i];
        current_obj.y = current_obj.y+30;
    }
    for (let i = 0; i < exits.children.length; i++) {
        let current_obj = exits.children[i];
        current_obj.y = current_obj.y+30;
    }
    player_start.y = player_start.y+30;

    draw_gridlines();
}

function update() {
    /*
    game.physics.arcade.collide(walls, walls);
    game.physics.arcade.collide(walls, gravObj_ons);
    game.physics.arcade.collide(walls, gravObj_offs);
    game.physics.arcade.collide(walls, shockers);
    game.physics.arcade.collide(gravObj_ons, gravObj_ons);
    game.physics.arcade.collide(gravObj_ons, gravObj_offs);
    game.physics.arcade.collide(gravObj_ons, shockers);
    game.physics.arcade.collide(gravObj_offs, gravObj_offs);
    game.physics.arcade.collide(gravObj_offs, shockers);
    game.physics.arcade.collide(shockers, shockers);
    //*/

    if (game.input.activePointer.leftButton.isDown && clickedObj != null) {
        clickedObj.body.velocity.x = 20 * (game.input.activePointer.position.x - clickedObj.position.x);
        clickedObj.body.velocity.y = 20 * (game.input.activePointer.position.y - clickedObj.position.y);

        if(clickedObj.number) {
            clickedObj.number.body.velocity.x = 20 * (game.input.activePointer.position.x - clickedObj.position.x)
            clickedObj.number.body.velocity.y = 20 * (game.input.activePointer.position.y - clickedObj.position.y)
        }
    }

    if ((game.input.activePointer.leftButton.isDown && clickedObj == null && ! leftClicked) || (mousePosition != null && (Math.abs(game.input.activePointer.position.x - mousePosition.x) > 28 || Math.abs(game.input.activePointer.position.y - mousePosition.y) > 28))) {

        initializeObj(currentSelectedObj);
        leftClicked = true;
        mousePosition = new Phaser.Point(game.input.activePointer.position.x, game.input.activePointer.position.y);
    }

    if (game.input.activePointer.leftButton.isUp && clickedObj == null) {
        leftClicked = false;
        mousePosition = null;
    }

    if(currentSelectedObj != 'path') {
        pathedObj = null;
    }
}
