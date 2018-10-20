let ShadowHandler = function() {
    let playerShadowLeft,
        playerShadowRight,
        playerShadowBottom,
        playerShadowTop;

    const maxJumpFrames = 10;
    const jumpVelocity = 300;

    function setUp(game, player) {
        playerShadowLeft = game.add.sprite(player.body.position.x, player.body.position.y, 'shadow');
        playerShadowLeft.anchor.set(.5, .5);
        playerShadowLeft.body.setSize(5, 1, 0, 8);

        playerShadowRight = game.add.sprite(player.body.position.x, player.body.position.y, 'shadow');
        playerShadowRight.anchor.set(.5, .5);
        playerShadowRight.body.setSize(15, 1, 0, 8);

        playerShadowBottom = game.add.sprite(player.body.position.x, player.body.position.y, 'shadow');
        playerShadowBottom.anchor.set(.5, .5);
        playerShadowBottom.body.setSize(15, 1, 0, 14);

        playerShadowTop = game.add.sprite(player.body.position.x, player.body.position.y, 'shadow');
        playerShadowTop.anchor.set(.5, .5);
        playerShadowTop.body.setSize(13, 1, 0, 0);
    }

    function update(game, player, walls, bouncers) {
        player.isTouchingRight = false;
        player.isTouchingLeft = false;
        player.isTouchingBottom = false;
        player.isTouchingTop = false;

        playerShadowLeft.body.position.set(player.body.position.x - 2, player.body.position.y);
        playerShadowRight.body.position.set(player.body.position.x + .5, player.body.position.y);
        playerShadowBottom.body.position.set(player.body.position.x - 1, player.body.position.y + 15);
        playerShadowTop.body.position.set(player.body.position.x + 1, player.body.position.y - 17);

        game.physics.arcade.overlap(playerShadowRight, walls, function() {
            player.isTouchingRight = true;
        }, null, null);
        game.physics.arcade.overlap(playerShadowLeft, walls, function() {
            player.isTouchingLeft = true;
        }, null, null);
        game.physics.arcade.overlap(playerShadowBottom, walls, function() {
            player.isTouchingBottom = true;
        }, null, null);
        game.physics.arcade.overlap(playerShadowTop, walls, function() {
            player.isTouchingTop = true;
        }, null, null);

        game.physics.arcade.overlap(playerShadowRight, bouncers, function() {
            player.isTouchingRight = true;
        }, null, null);
        game.physics.arcade.overlap(playerShadowLeft, bouncers, function() {
            player.isTouchingLeft = true;
        }, null, null);
        game.physics.arcade.overlap(playerShadowBottom, bouncers, function() {
            player.isTouchingBottom = true;
        }, null, null);
        game.physics.arcade.overlap(playerShadowTop, bouncers, function() {
            player.isTouchingTop = true;
        }, null, null);
    }

    return {
        setUp: setUp,
        update: update,
    }
};
