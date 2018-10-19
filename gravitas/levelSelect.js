let LevelSelect = function (game, gameState) {
    
    let background,
        thumbCols = 2,
        thumbRows = 5,
        thumbWidth = 96,
        thumbHeight = 96,
        thumbSpacing = 20,
        levelWidth = thumbWidth * thumbRows + thumbSpacing * (thumbRows - 1),
        levelHeight = thumbHeight * thumbCols + thumbSpacing * (thumbCols - 1),
        currentPage = 0,
        playerDataList = [],
        buttons,
        levelCount;
    
 
    function loadLevelSelect() {
        let levelList = game.cache.getText('levelList').split('\n');
        levelCount = levelList.length;
        
        game.load.image('lockedThumbnail', 'assets/art/levelSelectImages/locked.png', thumbHeight, thumbWidth);
        game.load.image('levelSelectBackground', 'assets/art/LevelSelectBackground.png');
        game.load.image('backButton', 'assets/art/backButton.png');
        
        for (let i = 1; i <= levelCount; i ++) {
            game.load.image('icon' + i, 'assets/art/levelSelectImages/icon' + i + '.png', thumbHeight, thumbWidth);
        }
    } 
    
    function updateFromLocalStorage() {
        playerDataList = localStorage.getItem('user_progress');
        if (playerDataList == null) {
            playerDataList = [0];
            for (let i = 1; i < levelCount; i++) {
                playerDataList[i] = 1;
            }
            localStorage.setItem('user_progress', playerDataList);
        } else {
            playerDataList = playerDataList.split(',');
        }
    }
    
    function createLevelSelect() {
        updateFromLocalStorage();
        renderLevelSelect();
    }
    
    function clearLevel() {
        background.kill();
        buttons.destroy();
        texts.destroy();
    }
    
    function renderLevelSelect() {
        background = game.add.sprite(game.width/2, game.height/2, 'levelSelectBackground');
        background.anchor.set(0.5, 0.5);
        background.immovable = true;
        
        controlButtons = game.add.group();
        buttons = game.add.group();
        texts = game.add.group();
        
        let back = game.add.button(45, 56, 'backButton', function() {
            clearLevel();
            game.state.start('menu');
        });
        controlButtons.add(back);
        
        renderPage(currentPage);
        
        if (levelCount > thumbCols * thumbRows) {
            let down = game.add.button((game.width - levelWidth)/2 + (thumbWidth + thumbSpacing) * thumbRows + 10, (game.height - levelHeight)/2 + 10 + thumbCols * (thumbHeight + thumbSpacing), 'backButton', function() {
                currentPage = Math.min(Math.floor(levelCount/thumbRows) - 1, currentPage + 1);
                renderPage(currentPage);
            });
            down.angle = -90;
            controlButtons.add(down);
            
            let up = game.add.button((game.width - levelWidth)/2 + (thumbWidth + thumbSpacing) * thumbRows + 40, (game.height - levelHeight)/2 - 40 + (thumbCols - 1) * (thumbHeight + thumbSpacing), 'backButton', function() {
                currentPage = Math.max(0, currentPage - 1);
                
                renderPage(currentPage);
            });
            up.angle = 90;
            controlButtons.add(up);
        }
        controlButtons.forEach(function(arrow) {
            arrow.alpha = 0.6;
            arrow.onInputOver.add(highlightButton, this);            
            arrow.onInputOut.add(unhighlightButton, this);
        });
    }
    
    function renderPage(pageNum) {
        // horizontal offset to have lock thumbnails horizontally centered in the page
        let offsetX = (game.width - levelWidth)/2;
        let offsetY = (game.height - levelHeight)/2 + 60;
        
        buttons.forEach(function(ele) {
            ele.kill();
        });
        texts.forEach(function(ele) {
            ele.kill();
        });
        
        currCount = levelCount;
        currDataList = playerDataList;
        
        controlButtons.visible = true;
        
        let associatedLevel = thumbRows * pageNum+1;
        for (let i = 0; i < thumbCols; i++) {
            for (let j = 0; j < thumbRows; j++) {
                if (associatedLevel != currCount) {
                    
                    let button;
                    
                    if (currDataList[associatedLevel] == 0) {
                        
                        iconPrefix = 'icon';
                        
                        // level is unlocked
                        button = game.add.button(offsetX + j * (thumbWidth + thumbSpacing), offsetY + i * (thumbHeight + thumbSpacing), iconPrefix + (associatedLevel), function(){
                            clearLevel();
                            gameState.setLevel(button.associatedLevel);
                            game.state.start('game');
                        });
                        let text = game.add.text(offsetX + j * (thumbWidth + thumbSpacing) + 25 - 20 * (associatedLevel> 9), offsetY + i * (thumbHeight + thumbSpacing), associatedLevel, {fill: "#000", fontSize: '70px'});
                        texts.add(text);
                    } else {
                        // level is locked
                        button = game.add.sprite(offsetX + j * (thumbWidth + thumbSpacing), offsetY + i * (thumbHeight + thumbSpacing), 'lockedThumbnail');
                    }
                    button.alpha=0.6;
                    button.associatedLevel = associatedLevel;
                    buttons.add(button);
                    if (currDataList[associatedLevel] == 0) {
                        button.onInputOver.add(highlightButton, this);
                        button.onInputOut.add(unhighlightButton, this);
                    }
                    associatedLevel++;
                }
            } 
        }
    }
    
    function highlightButton(selected_button){
        selected_button.alpha = 1;
    }
    function unhighlightButton(selected_button){
        selected_button.alpha = 0.6;
    }
    
    return {
        preload: loadLevelSelect,
        create: createLevelSelect
    };
    
};