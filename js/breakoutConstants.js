var game  = {
	config:{
		names:{
			deadZone:"deadzone",
			breakable:"breakable",
			wall:"wall",
			canvas:"gameCanvas",
			level:"level_"
		},
		paths:{
			images:"images/",
			levels:"levels/",
			audio:"audio/"
		},
		keyCode:{
			ESC:27,
			S:83,
            M:77,
            LEFT_ARROW:37,
            RIGHT_ARROW:39
		},
		box2DUnitToPixelRatio:100, 
		JSfps:1000/60, 
		maxSpeed:6, 
		minSpeed:2, 
		dim:{
			width:640,
			height:640
		},
		ballSpeed:{
			x:0.03,
			y:0.03
		}
	},
	state:{
		running:false,
		score:0,
		level:0,
		blockCount:0,
		lives:3,
		livesMagic:0,
        soundMuted:false,
        oneUp:false,
        oneUpTimer:false,
        statsChanged:false,
        isMuted:function(){return this.soundMuted;},
        isOneUp:function(){return this.oneUp;},
		isRunning:function(){return this.running;}
	},
	playSoundByte : function(audio){
		if(typeof audio.play == 'function'){
			audio.play();
		}
	},
	addSoundByte : function(name) {
		audio = document.createElement("audio");

		if (audio != null){
			audio.loop = false;
			audio.controls = false;
			audio.autoplay = false;
			audio.src = name + (audio.canPlayType("audio/ogg") ? ".ogg" : ".mp3");
			audio.onload = function(){
			};
		}
		return audio;
	}
};
game.sounds = {
	lifeLose:game.config.paths.audio + "lifeLose",
	lifeGain:game.config.paths.audio + "lifeGain",
	levelLoad:game.config.paths.audio + "levelLoad",
	gameLose:game.config.paths.audio + "gameLose",
	gameWin:game.config.paths.audio + "gameWin"
};
game.config.pos = {
			x:(window.innerWidth/2) - (game.config.dim.width/2),
			y:25
};
game.config.scoreBoard = {
    dim:{
        width: game.config.dim.width,
        height: 40
    }
};
var DEFAULT_FILE_EXT			= {
	image:{
		PNG:".png"
	}
};
var DEFAULT_FIXTURE_DEF			= {
	density:1,
	friction:0,
	restitution:1,
	stage:0,
	angle:0,
	gravity:{
		x:0,
		y:0
	}
};
var PLAYER_DIM					= {
	type:"paddle",
	width:40,
    rblw:(40/3)/game.config.box2DUnitToPixelRatio,
    b2dwidth:40/game.config.box2DUnitToPixelRatio,
	height:8,
	density:DEFAULT_FIXTURE_DEF.density,
	friction:DEFAULT_FIXTURE_DEF.friction,
	restitution:DEFAULT_FIXTURE_DEF.restitution,
	stage:DEFAULT_FIXTURE_DEF.stage,
	soundByte:game.config.paths.audio + "paddleHit"
};
var BALL_DIM					= {
	type:"ball",
	radius:8,
    radiusb2d:(4/game.config.box2DUnitToPixelRatio),
	angle:DEFAULT_FIXTURE_DEF.angle,
	density:DEFAULT_FIXTURE_DEF.density,
	friction:DEFAULT_FIXTURE_DEF.friction,
	restitution:DEFAULT_FIXTURE_DEF.restitution,
	stage:DEFAULT_FIXTURE_DEF.stage
};
var WALL_DIM					= {
	type:"wall",
	density:DEFAULT_FIXTURE_DEF.density,
	friction:DEFAULT_FIXTURE_DEF.friction,
	restitution:DEFAULT_FIXTURE_DEF.restitution,
	stage:DEFAULT_FIXTURE_DEF.stage,
	soundByte:game.config.paths.audio + "wallHit"
};

//player aka paddle
var playerFixtureDef               = new b2FixtureDef();
    playerFixtureDef.density       = PLAYER_DIM.density;
    playerFixtureDef.friction      = PLAYER_DIM.friction;
    playerFixtureDef.restitution   = PLAYER_DIM.restitution;
    playerFixtureDef.shape         = new b2PolygonShape();
    playerFixtureDef.shape.SetAsBox(PLAYER_DIM.width/game.config.box2DUnitToPixelRatio, PLAYER_DIM.height/game.config.box2DUnitToPixelRatio);
    playerFixtureDef.userData      = {type:PLAYER_DIM.type, stage:PLAYER_DIM.stage};

var playerBodyDef                  = new b2BodyDef();
    playerBodyDef.type             = b2Body.b2_staticBody;
    playerBodyDef.position.Set((game.config.dim.width/2)/game.config.box2DUnitToPixelRatio, (game.config.dim.height-PLAYER_DIM.height)/game.config.box2DUnitToPixelRatio);
    playerBodyDef.angle            = 0;

//ball
var ballFixtureDef               = new b2FixtureDef();
    ballFixtureDef.density       = BALL_DIM.density;
    ballFixtureDef.friction      = BALL_DIM.friction;
    ballFixtureDef.restitution   = BALL_DIM.restitution;
	ballFixtureDef.fixedRotation = true;
    ballFixtureDef.shape         = new b2CircleShape();
    ballFixtureDef.shape.SetRadius(BALL_DIM.radius/game.config.box2DUnitToPixelRatio);
    ballFixtureDef.userData      = {type:BALL_DIM.type, stage:BALL_DIM.stage};

var ballBodyDef                  = new b2BodyDef();
    ballBodyDef.type             = b2Body.b2_dynamicBody;
    ballBodyDef.position.Set((game.config.dim.width/2)/game.config.box2DUnitToPixelRatio, (game.config.dim.height/2)/game.config.box2DUnitToPixelRatio);
    ballBodyDef.angle            = BALL_DIM.angle;

	//bottom aka ground
var groundFixtureDef = new b2FixtureDef();
    groundFixtureDef.density       = 1.0;
    groundFixtureDef.friction      = 0;
    groundFixtureDef.restitution   = 1;
    groundFixtureDef.shape         = new b2PolygonShape();
    groundFixtureDef.shape.SetAsBox(game.config.dim.width/game.config.box2DUnitToPixelRatio, 1/game.config.box2DUnitToPixelRatio);
    groundFixtureDef.userData      = {type:game.config.names.deadZone, stage:WALL_DIM.stage};

//top aka ceiling
var ceilingFixtureDef = new b2FixtureDef();
    ceilingFixtureDef.density       = WALL_DIM.density;
    ceilingFixtureDef.friction      = WALL_DIM.friction;
    ceilingFixtureDef.restitution   = WALL_DIM.restitution;
    ceilingFixtureDef.shape         = new b2PolygonShape();
    ceilingFixtureDef.shape.SetAsBox(game.config.dim.width/game.config.box2DUnitToPixelRatio, 1/game.config.box2DUnitToPixelRatio);
    ceilingFixtureDef.userData      = {type:WALL_DIM.type, stage:WALL_DIM.stage};

var wallFixtureDef = new b2FixtureDef();
    wallFixtureDef.density       = WALL_DIM.density;
    wallFixtureDef.friction      = WALL_DIM.friction;
    wallFixtureDef.restitution   = WALL_DIM.restitution;
    wallFixtureDef.shape         = new b2PolygonShape();
    wallFixtureDef.shape.SetAsBox(1/game.config.box2DUnitToPixelRatio, game.config.dim.height/game.config.box2DUnitToPixelRatio);
    wallFixtureDef.userData      = {type:WALL_DIM.type, stage:WALL_DIM.stage};

var groundBodyDef = new b2BodyDef();
    groundBodyDef.type             = b2Body.b2_staticBody;
    groundBodyDef.position.Set(0/game.config.box2DUnitToPixelRatio, (game.config.dim.height + BALL_DIM.radius*4)/game.config.box2DUnitToPixelRatio);

var ceilingBodyDef = new b2BodyDef();
    ceilingBodyDef.type             = b2Body.b2_staticBody;
    ceilingBodyDef.position.Set(0/game.config.box2DUnitToPixelRatio, 0/game.config.box2DUnitToPixelRatio);

var leftWallBodyDef = new b2BodyDef();
    leftWallBodyDef.type             = b2Body.b2_staticBody;
    leftWallBodyDef.position.Set(0/game.config.box2DUnitToPixelRatio, 0/game.config.box2DUnitToPixelRatio);

var rightWallBodyDef = new b2BodyDef();
    rightWallBodyDef.type             = b2Body.b2_staticBody;
    rightWallBodyDef.position.Set(game.config.dim.width/game.config.box2DUnitToPixelRatio, 0/game.config.box2DUnitToPixelRatio);