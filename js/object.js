function object(pBodyDef, pFixtureDef, pImageSrc){
	this.bodyDef = pBodyDef;
	this.fixtureDef = pFixtureDef;
	this.body = null;
	var image = null;
	var imageSrc = pImageSrc;
	var id = -1;
	var tempX = 0;
	var tempY = 0;
	var tempTheta = 0;
	var offsetX = 0;
	var offsetY = 0;
	var imageStages = 1;
	var width = 0;
	var height = 0;
	var currImageStage = 0;
	var audio = null;
	this.hasInitBeenCalled = false;

	this.init = function(){
		if(imageSrc != null){
			image = new Image();
			image.onload = this.imageLoaded;
			image.src = imageSrc;
		}
		this.hasInitBeenCalled = true;
	};
	this.imageLoaded  = function(){
		offsetX = image.width/2;
		offsetY = image.height/2;
		width = image.width;

		if(imageStages <=0)
			imageStages = 1;

		height = (image.height/imageStages);
		offsetY = (offsetY/imageStages);
	};
	this.playSoundByte = function(){
		if(audio){
			audio.play();
		}
	};
	this.addSoundByte = function(name){
		audio = new Audio();

        if (audio != null){
			audio.loop = false;
			audio.controls = false;
			audio.autoplay = false;
			audio.src = name + (audio.canPlayType("audio/ogg") ? ".ogg" : ".mp3");
		}
	};
	this.SetSize = function(w,h){
		this.width = w;
		this.height = h;
	};
	this.setImageStages = function(stageCount){
		imageStages = stageCount
	};
	this.stepCurrImageStage = function(){
		currImageStage = ((currImageStage+1) % imageStages);
	};
	this.getCurrImageStage = function(){
		return currImageStage;
	};
	this.draw = function(canvasContext){
		if(imageSrc != null){
            var b = this.body.GetBody();
            var p = b.GetPosition();
			tempTheta = b.GetAngle();
			tempX = p.x*game.config.box2DUnitToPixelRatio-offsetX;
			tempY = p.y*game.config.box2DUnitToPixelRatio-offsetY;

			canvasContext.save();

			if(Math.abs(parseFloat(tempTheta).toFixed(3)) != 0){
				canvasContext.translate(tempX+offsetX, tempY+offsetY);
				canvasContext.rotate(tempTheta);
				canvasContext.translate(-tempX-offsetX, -tempY-offsetY);
			}

			if(imageStages > 1){
				canvasContext.drawImage(image, 0, currImageStage * height, width, height, tempX, tempY, width, height);
			}else{
				canvasContext.drawImage(image, tempX, tempY);
			}
			canvasContext.restore();
		}
	};
    this.clean = function(){
        if(image != null){
            image.src = null;
            image = null;
        }

        if(audio != null){
            //audio.pause(); fix for bug where audio for last brick stage wasn't being played upon collision
            audio.src = null;
            audio = null;
        }
    }
	this.getID 		= function() {return id;};
	this.setID 		= function(pid) {if(id < 0){id = pid;}};
}