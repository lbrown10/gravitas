$(function() {
    const width = 810;
    const height = 420;

    playerDataList = localStorage.getItem('user_progress').split(',');
    for (let i = 0; i < playerDataList.length; i++) {
      playerDataList[i] = parseInt(playerDataList[i]);
    }
    let startNum;
    for (let i = 0; i < playerDataList.length; i++) {
      if (playerDataList[i] == 1) {
        startNum = i - 1;
        break;
      }
    }
    const startingLevelNum = startNum;

    let game = new Phaser.Game(width, height, Phaser.AUTO, 'gameWindow', null, false, false);

    let optionsData = new OptionsData();

    let bootState = new BootState(game);
    let gameState = new Game(game, optionsData);

    // will merge Win State
    let menu = new Menu(game, optionsData, function() {
        gameState.setLevel(startingLevelNum);
        game.state.start('game');
    }, function() {
        game.state.start('levelselect');
    });

    let win = new Win(game, optionsData);

    let levelSelect = new LevelSelect(game, gameState);

    game.state.add('boot', {preload: bootState.boot, create: bootState.postBoot});
    game.state.add('menu', {preload: menu.loadMenu, create: menu.createMenu});
    game.state.add('win', {preload: win.loadWin, create: win.displayWinMessage, update: win.update});
    game.state.add('game', {preload: gameState.preload, create: gameState.create, update: gameState.update, render: gameState.render});
    game.state.add('levelselect', {preload: levelSelect.preload, create: levelSelect.create});

    game.state.start('boot');
});
