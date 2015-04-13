function breakout(){
	var iID          = 0;
	var iIDs         = 0;
	var iIDm         = 0;
	var myCanvas          = new canvas(
        game.config.names.canvas, 
        game.config.pos.x, 
        game.config.pos.y + game.config.scoreBoard.dim.height, 
        game.config.dim.width, 
        game.config.dim.height, 
        3, 
        "transparent"
    );
	var scoreBoardCanvas  = new canvas(
        game.config.names.canvas+"_scoreBoard", 
        game.config.pos.x, 
        game.config.pos.y, 
        game.config.dim.width, 
        game.config.scoreBoard.dim.height, 
        2, 
        "#222"
    );
	var backgroundCanvas  = new canvas(
        game.config.names.canvas+"_Background", 
        game.config.pos.x, 
        game.config.pos.y + game.config.scoreBoard.dim.height, 
        game.config.dim.width, 
        game.config.dim.height, 
        1, 
        "#000"
    );
	var paddle      = new object(playerBodyDef, playerFixtureDef, game.config.paths.images + PLAYER_DIM.type + DEFAULT_FILE_EXT.image.PNG);
	var ball        = new object(ballBodyDef, ballFixtureDef, game.config.paths.images + BALL_DIM.type + DEFAULT_FILE_EXT.image.PNG);
	var ground      = new object(groundBodyDef, groundFixtureDef, null);
	var leftWall    = new object(leftWallBodyDef, wallFixtureDef, null);
	var rightWall   = new object(rightWallBodyDef, wallFixtureDef, null);
	var ceiling     = new object(ceilingBodyDef, ceilingFixtureDef, null);
	var collisionListener = new b2ContactListener();
	var lifeLose    = game.addSoundByte(game.sounds.lifeLose);
	var lifeGain    = game.addSoundByte(game.sounds.lifeGain);
    var levelLoad   = game.addSoundByte(game.sounds.levelLoad);
    var gameLose    = game.addSoundByte(game.sounds.gameLose);
    var gameWin     = game.addSoundByte(game.sounds.gameWin);
	var bgMusic     = null;

	leftWall.addSoundByte(WALL_DIM.soundByte);
	rightWall.addSoundByte(WALL_DIM.soundByte);
	ceiling.addSoundByte(WALL_DIM.soundByte);
	ground.addSoundByte(game.sounds.lifeLose);
	paddle.addSoundByte(PLAYER_DIM.soundByte);

	collisionListener.EndContact = function(contact){
		if(game.state.isRunning()){
			var ballBody = ball.body.GetBody();
			var velocity = ballBody.GetLinearVelocity();
            var ballPosition = ballBody.GetPosition();
            var vx = velocity.x;
            var vy = velocity.y;
			var impulseX = 0.001;
			var impulseY = 0.001;
			var dirx = -1;
			var diry = -1;

			if (velocity.x > game.config.maxSpeed || velocity.y > game.config.maxSpeed) {
				ballBody.SetLinearDamping(0.5);
			}
			if (velocity.x < game.config.minSpeed || velocity.y < game.config.minSpeed) {
				ballBody.SetLinearDamping(0.0);
			}

			if(velocity.x > 0){
				dirx*=-1;
			}
			if(velocity.y > 0){
				diry*=-1;
			}

			if(Math.abs(velocity.x) < 1){
				impulseX+=0.05;
			}
			if(Math.abs(velocity.y) < 1){
				impulseY+=0.05;
			}

			ballBody.ApplyImpulse(new b2Vec2(impulseX*dirx, impulseY*diry), ballPosition);
			var userData = contact.GetFixtureA().GetUserData();

			switch(userData.type){
				case WALL_DIM.type:
					ceiling.playSoundByte();
					break;
				case PLAYER_DIM.type:
					paddle.playSoundByte();

                    if(ballPosition.x+PLAYER_DIM.rblw > paddle.body.GetBody().GetPosition().x+BALL_DIM.radiusb2d){
                        if(vx < 0)
                            vx*=-1;

                        ball.body.GetBody().SetLinearVelocity(new b2Vec2(vx, vy));
                        break;
                    }
                    if(ballPosition.x-PLAYER_DIM.rblw < paddle.body.GetBody().GetPosition().x+BALL_DIM.radiusb2d){
                        if(vx > 0)
                            vx*=-1;

                        ball.body.GetBody().SetLinearVelocity(new b2Vec2(vx, vy));
                        break;
                    }
					break;
				case game.config.names.breakable:
					var blockObject = myCanvas.getObjectByID(userData.id);
                    blockObject.playSoundByte();
					blockObject.stepCurrImageStage();

					if(blockObject.getCurrImageStage() == 0){
						game.state.score += userData.pointValue;
						game.state.blockCount--;

						if(game.state.livesMagic == game.state.blockCount){
							game.state.lives++;
							game.playSoundByte(lifeGain);
                            game.state.oneUp = {x:ballPosition.x*game.config.box2DUnitToPixelRatio,y:ballPosition.y*game.config.box2DUnitToPixelRatio};
                            game.state.oneUpTimer = false;
						}
                        myCanvas.removeObjectByID(userData.id);
					}
                    game.state.statsChanged = true;
					break;
				case game.config.names.deadZone:
					game.state.lives--;
					game.playSoundByte(lifeLose);
					game.state.running = false;
					setTimeout(function(){
						ball.body.GetBody().SetLinearVelocity(new b2Vec2(0,0));
						ball.body.GetBody().SetPosition(new b2Vec2((Math.random()*game.config.dim.width)/game.config.box2DUnitToPixelRatio, (game.config.dim.height/2)/game.config.box2DUnitToPixelRatio));
					},1);
                    game.state.statsChanged = true;
					break;
			}
		}
	}

	this.init = function(){
		myCanvas.setDebugState(false);
		myCanvas.setCollisionListener(collisionListener);

		scoreBoardCanvas.init();
		backgroundCanvas.init();
		myCanvas.init();

		paddle.init();
		ball.init();
		ground.init();
		ceiling.init();
		leftWall.init();
		rightWall.init();

		myCanvas.addObject(paddle);
		myCanvas.addObject(ground);
		myCanvas.addObject(ceiling);
		myCanvas.addObject(leftWall);
		myCanvas.addObject(rightWall);
		myCanvas.addObject(ball);

		this.showStats();

		$(document).delegate('*', 'keyup', $.proxy(this.onKeyUp, this));
		$(document).delegate('*', 'keydown', $.proxy(this.onKeyDown, this));
		$(document).delegate('*', 'mousemove', $.proxy(this.handleMouseMove, this));
		$(document).delegate('*', 'click', $.proxy(this.handleMouseClick, this));
	}

	var loadData = function(url){
		var req = new XMLHttpRequest();  

		if(req)
			req.open('GET', url, false);  
		else
			return null;

		if (req.overrideMimeType)
			req.overrideMimeType('text/plain; charset=x-user-defined');  

		req.send(null);

		if (req.status != 200) return null;

		return req.responseText;
	} 

	var addBlocksToGame = function(canvas, gameData){
		var gameObject = $.parseJSON(gameData);
		var level = gameObject.level.map;
		var blocks = gameObject.blocks;
		var block = null;
		var xStart = gameObject.level.x;
		var yStart = gameObject.level.y;
		var xPos = xStart;
		var yPos = yStart;
		var blockCount = level.length;

		backgroundCanvas.renderBackgroundImage(game.config.paths.images + gameObject.level.backgroundImage, 0, 0, game.config.dim.width, game.config.dim.height);
        game.playSoundByte(levelLoad);

		if(gameObject.level.backgroundAudio){
            if(bgMusic){
                bgMusic.pause();
                bgMusic.src = null;
                bgMusic = null;
            }
            bgMusic = game.addSoundByte(game.config.paths.audio + gameObject.level.backgroundAudio);
            bgMusic.autoplay = true;
            bgMusic.loop = true;
		}
		game.state.livesMagic = Math.floor(Math.random()*blockCount);
		game.state.blockCount = (blockCount);

        ball.body.GetBody().SetLinearVelocity(new b2Vec2(0,0));
        ball.body.GetBody().SetPosition(new b2Vec2((Math.random()*game.config.dim.width)/game.config.box2DUnitToPixelRatio, ((game.config.dim.height/2))/game.config.box2DUnitToPixelRatio));
        game.state.running = false;

		while(blockCount--){
			 block = blocks[level[blockCount]];

			var blockFixtureDef               = new b2FixtureDef();
				blockFixtureDef.density       = block.density;
				blockFixtureDef.friction      = block.friction;
				blockFixtureDef.restitution   = block.restitution;
				blockFixtureDef.shape         = new b2PolygonShape();
				blockFixtureDef.shape.SetAsBox(block.width/game.config.box2DUnitToPixelRatio, block.height/game.config.box2DUnitToPixelRatio);
                blockFixtureDef.userData      = {type:block.type, stage:block.stages, pointValue:block.pointValue};

			var blockBodyDef                  = new b2BodyDef();
				blockBodyDef.type             = b2Body.b2_staticBody;
				blockBodyDef.position.Set(xPos/game.config.box2DUnitToPixelRatio, (yPos+block.height)/game.config.box2DUnitToPixelRatio);
				blockBodyDef.angle            = block.angle;

			var blockObject = new object(blockBodyDef, blockFixtureDef, game.config.paths.images + block.src);
				blockObject.addSoundByte(game.config.paths.audio + block.audioSrc);
				blockObject.setImageStages(block.stages);

			myCanvas.addObject(blockObject);

			xPos += (block.width*2);

			if((xPos+block.width) > game.config.dim.width){
				yPos += (block.height*2);
				xPos = xStart;
			}
		}
	}

	var manageLevel = function(e){
		if(game.state.blockCount <= 0){
            myCanvas.cleanBodies();
			var gameData = loadData(game.config.paths.levels + game.config.names.level + game.state.level++);

			if(gameData == null || gameData == '')
			{
				myCanvas.clear();
				scoreBoardCanvas.clear();
				$('*').css("cursor", "auto");
				scoreBoardCanvas.renderText("You Win!", 20, 30);
				stop();
                game.playSoundByte(gameWin);
                return;
			}

			addBlocksToGame(myCanvas, gameData);
            game.state.statsChanged = true;
		}
		if(game.state.lives <= 0){
			$('*').css("cursor", "auto");
			scoreBoardCanvas.clear();
			scoreBoardCanvas.renderText("You Lose!", 20, 30);
			stop();
            game.playSoundByte(gameLose);
            return;
		}
	}

//change the stats for the game from html5 canvas to html5 css/html based?
	this.showStats = function(){// TODO : do some math so that stats scale properly with other screen sizes
        if(game.state.statsChanged == true)
        {
            scoreBoardCanvas.clear();

            scoreBoardCanvas.renderText("Level : " + game.state.level, 20, 30);
            scoreBoardCanvas.renderText("Blocks : " + game.state.blockCount, 150, 30);
            scoreBoardCanvas.renderText("Score : " + game.state.score, 380, 30);
            scoreBoardCanvas.renderText("Lives : " + game.state.lives, game.config.dim.width-80, 30);
            game.state.statsChanged = false;
        }

        if(game.state.isOneUp() != false){
            myCanvas.renderText("1 UP", game.state.oneUp.x, game.state.oneUp.y);

            if(!game.state.oneUpTimer){
                setTimeout(function(){game.state.oneUp = false;}, 1000);
                game.state.oneUpTimer = true;
            }
        }
        manageLevel(this);
	}

	this.render = function(){
            myCanvas.render();
	}

	this.start = function(){
        iID = setInterval(this.render, game.config.JSfps);
        iIDs = setInterval(this.showStats, game.config.JSfps);
        manageLevel(this);
	}

	var stop = function(){
		clearInterval(iID);
		clearInterval(iIDs);
		clearInterval(iIDm);
	}

	this.stop = stop;

	this.onKeyUp = function(evt){
        evt.stopImmediatePropagation();
        evt.preventDefault();

		if(parseInt(evt.keyCode) == game.config.keyCode.M){
            if(game.state.isMuted()){
                game.playSoundByte(bgMusic);
                game.state.soundMuted = false;
            }else{
                bgMusic.pause();
                game.state.soundMuted = true;
            }
		}
		if(parseInt(evt.keyCode) == game.config.keyCode.S){
			if(!game.state.isRunning()){
                ball.body.GetBody().ApplyImpulse(new b2Vec2((((Math.random()*1 <= 0.5) ? 1 : -1)*game.config.ballSpeed.x), game.config.ballSpeed.y), ball.body.GetBody().GetPosition());
                $('*').css("cursor", "none");
                game.state.running = true;
			}
		}
	}

    this.onKeyDown = function(evt){
        var ppx = paddle.body.GetBody().GetPosition().x;
        var value = ppx

		if(parseInt(evt.keyCode) == game.config.keyCode.LEFT_ARROW){
            value -= PLAYER_DIM.b2dwidth;

            if((value) > 0)
                paddle.body.GetBody().SetPosition(new b2Vec2(value, (game.config.dim.height-PLAYER_DIM.height)/game.config.box2DUnitToPixelRatio));

            return;
		}
		if(parseInt(evt.keyCode) == game.config.keyCode.RIGHT_ARROW){
            value += PLAYER_DIM.b2dwidth;

            if((value*game.config.box2DUnitToPixelRatio) < game.config.dim.width)
                paddle.body.GetBody().SetPosition(new b2Vec2(value, (game.config.dim.height-PLAYER_DIM.height)/game.config.box2DUnitToPixelRatio));

            return;
		}
    }

    this.handleMouseClick = function(e){
        if(!game.state.isRunning()){
            ball.body.GetBody().ApplyImpulse(new b2Vec2((((Math.random()*1 <= 0.5) ? 1 : -1)*game.config.ballSpeed.x), game.config.ballSpeed.y), ball.body.GetBody().GetPosition());
            $('*').css("cursor", "none");
            game.state.running = true;
        }
	}

	this.handleMouseMove = function(e){
		if(((e.clientX - game.config.pos.x) - 10) > 0 && ((e.clientX - game.config.pos.x) + 10) < game.config.dim.width)
			paddle.body.GetBody().SetPosition(new b2Vec2((e.clientX - game.config.pos.x) / game.config.box2DUnitToPixelRatio, paddle.body.GetBody().GetPosition().y));
	}
};