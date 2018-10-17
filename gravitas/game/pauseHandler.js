let PauseHandler = function(game, optionsHandler) {
    let active = false;
    let pauseBackground = game.add.sprite(game.width/2, game.height, 'pauseBackground');
    pauseBackground.anchor.set(.5, .5);
    pauseBackground.alpha = .7;
    let resumeButton = game.add.button(game.width/2, game.height - 100, 'resumeButton', resumeGame);
    resumeButton.anchor.set(.5, .5);
    let menuButton = game.add.button(game.width/2, game.height, 'menuButton', returnToMenu);
    menuButton.anchor.set(.5, .5);
    let optionsButton = game.add.button(game.width - 30, game.height - 30, 'optionsButton', gotoOptionsMenu);
    optionsButton.anchor.set(.5, .5);
    
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
    pauseBackground.visible = false;
    resumeButton.visible = false;
    menuButton.visible = false;
    optionsButton.visible = false;
        
    function startPauseMenu() {
        game.physics.arcade.isPaused = true;
        game.time.events.pause();
        
        game.world.bringToTop(buttons);
        let centerX = game.camera.view.centerX;
        let centerY = game.camera.view.centerY;
        resumeButton.position.setTo(centerX, centerY - 100);
        menuButton.position.setTo(centerX, centerY);
        pauseBackground.position.setTo(centerX, centerY - 50);
        optionsButton.position.setTo(centerX + game.width/2 - 37, centerY + game.height/2 - 30);
        pauseBackground.visible = true;
        resumeButton.visible = true;
        menuButton.visible = true;
        optionsButton.visible = true;
        active = true;
    }
    
    function resumeGame() {
        game.physics.arcade.isPaused = false;
        game.time.events.resume();
        
        pauseBackground.visible = false;
        resumeButton.visible = false;
        menuButton.visible = false;
        optionsButton.visible = false;
        active = false;
    }
    
    function returnToMenu() {
        buttons.destroy();
        game.physics.arcade.isPaused = false;
        game.time.events.resume();
        game.state.start('menu');
    }
    
    function gotoOptionsMenu() {
        
        pauseBackground.visible = false;
        resumeButton.visible = false;
        menuButton.visible = false;
        optionsButton.visible = false;
        
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