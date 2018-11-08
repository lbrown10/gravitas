let PauseHandler = function(game, optionsHandler, activeStateChanged) {
    let active = false;
    //Create pause menu
//    let levelreadout = game.add.text(200, 100, "Level 0", { font: "64px AR Destine", fill: "#ffffff", align: "center" });
//    levelreadout.text = "level 0";
//    levelreadout.anchor.set(.5, .5);
    
    
    let pauseBackground = game.add.sprite(game.width/2, game.height, 'pauseBackground');
    pauseBackground.anchor.set(.5, .5);
    pauseBackground.alpha = .7;
    let resumeButton = game.add.button(game.width/2, game.height - 100, 'resumeButton', resumeGame);
    resumeButton.anchor.set(.5, .5);
    let menuButton = game.add.button(game.width/2, game.height, 'menuButton', returnToMenu);
    menuButton.anchor.set(.5, .5);
    let optionsButton = game.add.button(game.width - 30, game.height - 30, 'optionsButton', gotoOptionsMenu);
    optionsButton.anchor.set(.5, .5);
    
        //  The Text is positioned at 0, 100
    let levelreadout = game.add.text(0, 130, "Level 0", { font: "24px AR Destine", fill: "#ffffff" });;

    //  We'll set the bounds to be from x0, y100 and be 800px wide by 100px high
    levelreadout.setTextBounds(0, 100, 800, 100);
    
    //Create Mouseover Highlights
    resumeButton.alpha = 0.6;
    menuButton.alpha = 0.6;
    resumeButton.onInputOver.add(highlightButton, this);
    resumeButton.onInputOut.add(unhighlightButton, this);
    menuButton.onInputOver.add(highlightButton, this);
    menuButton.onInputOut.add(unhighlightButton, this);
    
    let buttons = game.add.group();
    buttons.add(pauseBackground);
    buttons.add(resumeButton);
    buttons.add(menuButton);
    buttons.add(optionsButton);
    buttons.add(levelreadout);
    pauseBackground.visible = false;
    resumeButton.visible = false;
    menuButton.visible = false;
    optionsButton.visible = false;
    levelreadout.visible = false;
        
    function startPauseMenu(currentLevel) {
        game.world.bringToTop(buttons);
        let centerX = game.camera.view.centerX;
        let centerY = game.camera.view.centerY;
        resumeButton.position.setTo(centerX, centerY - 100);
        menuButton.position.setTo(centerX, centerY);
        pauseBackground.position.setTo(centerX, centerY - 50);
        optionsButton.position.setTo(centerX + game.width/2 - 37, centerY + game.height/2 - 30);
        levelreadout.position.setTo(centerX - 40, centerY - 290);
        levelreadout.text = "Level " + currentLevel;
        pauseBackground.visible = true;
        resumeButton.visible = true;
        menuButton.visible = true;
        optionsButton.visible = true;
        levelreadout.visible = true;

        active = true;
        activeStateChanged();
    }
    
    function resumeGame() {
        pauseBackground.visible = false;
        resumeButton.visible = false;
        menuButton.visible = false;
        optionsButton.visible = false;
        levelreadout.visible = false;

        active = false;
        activeStateChanged();
    }
    
    function returnToMenu() {
        buttons.destroy();

        active = false;
        activeStateChanged();

        game.state.start('menu');
    }
    
    function gotoOptionsMenu() {
        
        pauseBackground.visible = false;
        resumeButton.visible = false;
        menuButton.visible = false;
        optionsButton.visible = false;
        levelreadout.visible = false;
        optionsHandler.startOptionsMenu();
    }
    
    return {
        startPauseMenu: startPauseMenu,
        resume: resumeGame,
        isActive: function () {
            return active;
        }
    }
    
    function highlightButton(selected_button){
        selected_button.alpha = 1;
    }
    function unhighlightButton(selected_button){
        selected_button.alpha = 0.6;
    }
};