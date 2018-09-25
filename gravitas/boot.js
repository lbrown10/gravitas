let BootState = function(game) {

    function resizeGame() {
        // game.scale.maxWidth = window.innerWidth/(1.5);
        // game.scale.maxHeight = game.scale.maxWidth * (42/81);
        game.scale.maxWidth = window.screen.width;
        game.scale.maxHeight = window.screen.height;
    }

    return {
        boot: function() {
            // Load file lists here
            game.load.text('levelList', 'assets/levels/levelList.txt');

            game.load.audio('theme', ['assets/audio/gravitasTheme.mp3', 'assets/audio/gravitasTheme.ogg']);
            // need .ogg if using Firefox

            game.stage.smoothed = false;
            resizeGame();
            game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

        },
        postBoot: function() {

            $(document).ready(function() {

                // Pause music when the window loses focus
                let mainTheme = $('#mainTheme');
                $(window).focus(function() {
                    mainTheme[0].play();
                });
                $(window).blur(function() {
                    mainTheme[0].pause();
                });

                //On window resize, resize the game
                $(window).resize(resizeGame);

                mainTheme.prop("volume", 0.1);
                mainTheme.trigger("play");
                mainTheme.animate({volume: 1}, 1500);

                game.state.start('menu');
            });
        }
    };
};
