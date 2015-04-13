function canvas(cID, pX, pY, pW, pH, pZ, pColor){
	var id = cID;
	var hasInitRan = false;
	var objCount = 0;
    var debugState = false;
	var x = pX;
	var y = pY;
	var width = pW;
	var height = pH;
	var canvas = false;
    var canvasContext = false;
	var objects = new Array();
	var world = null;
	var gravity = new b2Vec2(DEFAULT_FIXTURE_DEF.gravity.x, DEFAULT_FIXTURE_DEF.gravity.y);
	var zIndex = pZ;
	var color = pColor;
	var collisionListener = null;
	var objectsToBeCleaned = new Array();

	this.setDebugState = function(pDebugState){debugState = pDebugState;};
	this.setCollisionListener = function(pCollisionListener){collisionListener = pCollisionListener;};
	this.getX = function(){return x;};
	this.getY = function(){return y;};
	this.getWidth = function(){return width;}
	this.getHeight = function(){return height;}
	this.getCanvas = function(){return canvas;};
	this.getContext = function(){return canvasContext;};
	this.getWorld = function(){
		return world;
	};
	this.render = function(){
		this.cleanBodies();
		this.clear();
		world.Step(WORLD_FRAME_RATE, VELOCITY_CYCLES_PRE_FRAME, POSITION_CYCLES_PRE_FRAME);
		world.ClearForces();
		this.callMethodOnAllObjects(CANVAS_OBJECT_RENDER_METHOD, canvasContext);
	};
	this.renderBackgroundImage = function(imageSrc, x, y, w, h){
		if(imageSrc != null){
			var image = new Image();
			image.src = imageSrc;
			image.onload = function(){
				canvasContext.drawImage(image, x, y, w, h);
			};
		}
	};
	this.renderText = function(text, x, y){
		var font = "16px Futura, Helvetica, sans-serif";
		canvasContext.save();
		canvasContext.font = font;

        canvasContext.lineWidth=0;
        canvasContext.shadowColor="#FFF";
        canvasContext.shadowOffsetX=0;
        canvasContext.shadowOffsetY=0;
        canvasContext.shadowBlur=10;

		canvasContext.fillStyle = "#fff";
		canvasContext.fillText(text, x, y);
		canvasContext.restore();
	};
	this.init = function(){
		if(!hasInitRan){
			document.write('<canvas id="'+id+'" width="'+width+'" height="'+height+'" style="z-index:'+zIndex+';background-color:'+color+';position:absolute;left:'+x+';top:'+y+';width:'+width+';height:'+height+';border:0px solid #c3c3c3;">'+ERROR_CANVAS_NOT_SUPPORTED+'</canvas>');
			canvas = document.getElementById(id);
			canvasContext = canvas.getContext(CONTEXT_2D);

			world = new b2World(
				gravity
				,  true
			);

			if(collisionListener != null)
				world.SetContactListener(collisionListener);

			if(debugState){
				var debugDraw = new b2DebugDraw();
				debugDraw.SetSprite(canvasContext);
				debugDraw.SetDrawScale(100);
				debugDraw.SetFillAlpha(0.3);
				debugDraw.SetLineThickness(1.0);
				debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
				world.SetDebugDraw(debugDraw);

				this.render = function(){
					this.cleanBodies();
					world.Step(WORLD_FRAME_RATE, VELOCITY_CYCLES_PRE_FRAME, POSITION_CYCLES_PRE_FRAME);
					world.DrawDebugData();
					world.ClearForces();
					//this.callMethodOnAllObjects(CANVAS_OBJECT_RENDER_METHOD, canvasContext);
				};
			}

			hasInitRan = true;
		}
	};
	this.cleanBodies = function(){
		if(objectsToBeCleaned.length <= 0)
			return;

		for(var objectID in objectsToBeCleaned){
			this.removeObjectByID(objectID);
		}
	};
	this.drawShadow = function(color, blur, xo, yo){
		var canvasContext = this.getContext();
		canvasContext.shadowColor = color;
		canvasContext.shadowBlur = blur;
		canvasContext.shadowOffsetX = xo;
		canvasContext.shadowOffsetY = yo;
	};
	this.clear = function(){
		if(!canvas){this.getCanvas();}
		this.getContext().clearRect(x, y, canvas.width, canvas.height);
		var w = canvas.width;
		canvas.width = 1;
		canvas.width = w;
	};
	this.addObject = function(object){
		if(typeof object.draw == 'function'){
			if(!object.hasInitBeenCalled){
				if(typeof object.init == 'function')
					object.init();
			}

			object.setID(++objCount);
			object.fixtureDef.userData.id = objCount;
			objects.push(object);
			object.body = world.CreateBody(object.bodyDef).CreateFixture(object.fixtureDef);
		}
	};
	this.removeObject = function(object){
		if(objCount <= 0 || typeof objects != 'object')
			return;

		var cnt = objCount-1;

		do{
			if(objects[cnt] && (objects[cnt].getID() == object.getID())){
                objects[cnt].clean();
				world.DestroyBody(object.body);
				objects.splice(cnt, 1);
				objCount--;
				break;
			}
		}while(cnt--);
	};
	this.removeObjectByID = function(objectID){
		if(objCount <= 0 || typeof objects != 'object' || world.IsLocked()){
			objectsToBeCleaned[objectID] = objectID;
			return;
		}

		var cnt = objCount-1;
		objectsToBeCleaned.splice(objectID, 1);

		do{
			if(objects[cnt] && objects[cnt].getID() == objectID){
                objects[cnt].clean();
				var body = objects[cnt].body;
				world.DestroyBody(body.GetBody());
				objects.splice(cnt, 1);
				objCount--;
				break;
			}
		}while(cnt--);
	};
	this.getObjectByID = function(objectID){
		var body = null;

		if(objCount <= 0 || typeof objects != 'object')
			return body;

		var cnt = objCount-1;

		do{
			if(objects[cnt] && objects[cnt].getID() == objectID){
				body = objects[cnt];
				break;
			}
		}while(cnt--);

		return body;
	};
	this.callMethodOnAllObjects = function(method, arg){
            if(objCount <= 0)
                return;

            var cnt = objCount;

            while(cnt--){
                objects[cnt][method](arg);
            }
	};
}