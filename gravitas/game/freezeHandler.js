let FreezeHandler = function(optionsData) {
    let stopFreezeAnimation = false;
    let freezeAnimation = false;
    let freezeAnimationTick = 0;
    let arrow;
    let frozenTime;

    const freezeMaxTick = 30;
    const arrowDist = 7;    
    
    function startFreeze(game) {

        game.time.events.pause();

        this.arrow.visible = true;
        this.freezeAnimationTick = 0;
        this.freezeAnimation = true;

        let freezeEffect = game.add.audio('freeze');
        freezeEffect.volume = 0.3 * optionsData.master * optionsData.soundFX;
        freezeEffect.play();
    }
    
    function endFreeze(game) {
        
        this.stopFreezeAnimation = true;
        this.freezeAnimation = false;
        game.time.events.resume();
        
        this.arrow.visible = false;
        this.freezeAnimationTick = freezeMaxTick;

        let unFreezeEffect = game.add.audio('unfreeze');
        unFreezeEffect.volume = 0.3 * optionsData.master * optionsData.soundFX;
        unFreezeEffect.play();
    }
    
    function doFreezeGraphics(game, graphics, player, easing) {
        let freezeRectSize = game.width * easing(this.freezeAnimationTick, freezeMaxTick);

        graphics.beginFill(0xa3c6ff, .5);
        graphics.drawRect(player.x - freezeRectSize, player.y - freezeRectSize, 2 * freezeRectSize, 2 * freezeRectSize);
        graphics.endFill();

        if (this.stopFreezeAnimation) {
            if (this.freezeAnimationTick > 0) {
                this.freezeAnimationTick -= 1.5;
            } else {
                this.stopFreezeAnimation = false;
            }
        } else if (this.freezeAnimation) {
            if (this.freezeAnimationTick < freezeMaxTick) {
                this.freezeAnimationTick += 1;
            }
        }
    }
    
    function doArrowChange(player) {
        let xDelta = player.body.velocity.x + player.body.acceleration.x/14;
        let yDelta = player.body.velocity.y + (player.body.acceleration.y + player.body.gravity.y)/14;

        let theta = Math.atan2(yDelta, xDelta);
        let scale = Math.sqrt(Math.sqrt(xDelta*xDelta + yDelta*yDelta)) / 20;

        this.arrow.x = player.x + xDelta/14 + scale * arrowDist * Math.cos(theta);
        this.arrow.y = player.y + yDelta/14 + scale * arrowDist * Math.sin(theta);
        this.arrow.rotation = theta;
        this.arrow.scale.setTo(scale, scale);
    }
    
    function addArrow(game, player) {
        this.arrow = game.add.sprite(player.x, player.y, 'arrow');
        this.arrow.anchor.set(.5, .5);
        this.arrow.visible = false;
    }
    
    function killArrow() {
        this.arrow.destroy();
    }
    
    
    return {
        stopFreezeAnimation: stopFreezeAnimation,
        freezeAnimationTick: freezeAnimationTick,
        freezeAnimation: freezeAnimation,
        startFreeze: startFreeze,
        endFreeze: endFreeze,
        addArrow: addArrow,
        doFreezeGraphics: doFreezeGraphics,
        doArrowChange: doArrowChange,
        killArrow: killArrow,
    }
};