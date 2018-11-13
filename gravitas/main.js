$(function() {
    const width = 810;
    const height = 420;

    let game = new Phaser.Game(width, height, Phaser.CANVAS, 'gameWindow', null, false, false);

    let optionsData = new OptionsData();

    let bootState = new BootState(game);
    let gameState = new Game(game, optionsData);

    let menu = new Menu(game, optionsData, function() {
        let playerDataList = localStorage.getItem('user_progress');

        // Creates 'user_progress' in localStorage.
        if (playerDataList == null) { // User first plays game
          resetUserProgress();
          gameState.setLevel(0);
          game.state.start('game');
        } else {
          // Properly sets current game level.
          playerDataList = playerDataList.split(',');
          if (playerDataList.indexOf(1) === -1) { // User has finished the game
            resetUserProgress();
            gameState.setLevel(0);
            localStorage.setItem('death_count', 0);
            game.state.start('game');
          } else { // User is continuing game
            for (let i = 0; i < levelList.length; i++) {
              if (playerDataList[i] == 1) {
                gameState.setLevel(i - 1);
                game.state.start('game');
                break;
              }
            }
          }
        }
    }, function() {
        game.state.start('levelselect');
    });

    let win = new Win(game, optionsData);

    let levelSelect = new LevelSelect(game, gameState);

    function resetUserProgress() {
      let levelList = game.cache.getText('levelList').split('\n');
      let playerDataList = [0];
      for (let i = 1; i < levelList.length; i++) {
          playerDataList[i] = 1;
      }
      localStorage.setItem('user_progress', playerDataList);
    }

    game.state.add('boot', {preload: bootState.boot, create: bootState.postBoot});
    game.state.add('menu', {preload: menu.loadMenu, create: menu.createMenu});
    game.state.add('win', {preload: win.loadWin, create: win.displayWinMessage, update: win.update});
    game.state.add('game', {preload: gameState.preload, create: gameState.create, update: gameState.update, render: gameState.render});
    game.state.add('levelselect', {preload: levelSelect.preload, create: levelSelect.create});

    game.state.start('boot');
});
