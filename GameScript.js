var GameCanvas;
var GameCanvasCxt;

/* -=Changelog=-
12/31/2017:
-Removed music due to bandwidth concerns.
1/1/2017 (Beta Release 1):
*Fixed bug with un-fluid movement.
*Fixed bug where the player would maintain momentum after level 4 cutscene.
*Fixed bug where incorrect dialog box would display in level 3.
+Added restart text upon game over.
1/2/2017 (Beta Release 2):
*Fixed error with audio not playing.
*Fixed issue where ControlsLocked did not affect shooting.
*The above issue also allowed the player to be invisible and still move while paused.

*/

/*
 *0: Start menu.
 *1: In-game.
 *2: Paused.
 *3: Intro.
 *4: Menu.
 *5: Game Over.
*/
var GameState = 0;

/*
 *0: Unused.
 *1: Story mode.
 *2: Survival mode.
*/
var GameMode = 2;

//See docs.
var MenuID = "STARTMENU";

/*
 * ==FOR STORY==
 * Essentially 'continue from'. Begins at 0.
 * ==FOR SURVIVAL==
 * 1: God-mode.
 * ==FOR ROM==
 * Continue from, but starts at 11.
*/
var SubGameMode = 0;

//How much time has passed since the level was started.
var CutsceneFrames = 0;
var CutsceneTimer = 0;
//If this equals 1, the player will not respond to keyboard input.
var ControlsLocked = 0;

Entities = [];
EnemiesList = ["EnemyGrunt"];

SelfDestructList = ["Depression", "Hope", "Peace", "War", "Revolution", "Loss", "Death", "Life", "Purpose", "Sadness", "Despair", "LAIN", "Drugs", "Violence", "Fear", "Anger", "Rage", "Hate"];

//Effect of gravity on entities. This includes jumping and falling.
//Updated from 0.5 to 2.5 on 10/24/2016, falling is way too slow, even for testing.
//Updated from 2.5 to 2 on [UNKNOWN]. Falling was too fast. This seems good.
var GravityForce = 2;

//Space between generated BlockBars on the X-axis.
var _XBARSPACER = 70;
//Space between generated BlockBars on the Y-axis.
var _YBARSPACER = 80;
//Maximum allowed BlockBars on screen. Multiplied by two.
var _MAXBARS = 4 * 2;

/* Garbage Collection Options
 * -1: Never delete.
 * 0: Delete if object is lower than -10 Y.
 * 1: Delete if object is higher than the canvas height.
 * 2: Delete if object is lower than -10 Y or higher than the canvas height.
 * 3: Delete if object has an X value higher than the canvas length.
 * 4: Delete if object has an X value lower than -10.
 * 5: Delete if object is out-of-bounds on any side of the canvas.
*/

/* AnimationSet options
 * 0: No animation.
 * 1: Left
 * 2: Right
 * 3: Up
 * 4: Down
*/

var EnemySpawner = setInterval(spawnEnemy, 3223);
var EnemySpawning = 1;

//Static screen effect counter.
var StaticFrame = 1;

//Old reel-to-reel sound.
var RRSound;

var _MOUSEX = 0;
var _MOUSEY = 0;

//Options.
/* Toggle Options:
 * 0: Off
 * 1: Low
 * 2: Medium
 * 3: High
*/
var PlayMusic = 2;
var PlaySFX = 0;
var UseShaders = 0;

//Music and sound effect variables.
var AudioCtx = new window.AudioContext();
var AudioGen = AudioCtx.createOscillator();
var AudioVol = AudioCtx.createGain();
var MusicGenPixels = [];

//Dialog variables.
var DialogSize = 0;
var DialogEnd = 0;

//We exist only to believe we have a purpose.

//Contains an X and a Y. JS probably has a way to do this natively, but this is just for convinience.
class Point
{
	//Pretty self-explanitory. X, Y.
	constructor(newX, newY)
	{
		this.XLoc = newX;
		this.YLoc = newY;
	}
	
	//Returns x.
	getXLoc()
	{
		return this.XLoc;
	}
	
	//Returns y.
	getYLoc()
	{
		return this.YLoc;
	}
}

//Base entity class. Shouldn't ever really be called by itself in game.
class Entity
{	
	constructor()
	{
		//Reference name.
		this.EntityTag = "UnknownEntity";
		this.EntityDamage = 0;
		this.EntityHealth = 1;
		
		//Graphic variables. This uses the sprite sheet set in SprLoc as the template. Refer to AnimationSets documentation for info on options.
		this.isGlitched = 0;
		this.SprLoc = document.getElementById("ENTITIES_FULL");
		this.AnimationTimer = -1; //CHECK DOCS
		this.AnimationSet = 0;
		this.AnimationFrame = 0;
		this.AnimationFrameMax = 2;
		this.AS_Left = [];
		this.AS_Right = [];
		this.AS_Up = [];
		this.AS_Down = [];
		
		//Movement variables.
		this.XLoc = 0;
		this.YLoc = 1;
		this.XVel = 0;
		this.YVel = 0;
		this.EntitySpeed = 0;
		this.Locked = 0;
		
		//Size variables.
		this.EntityWidth = 0;
		this.EntityHeight = 0;
		this.ClipX = 0;
		this.ClipY = 0;
		
		//See garbage collection options. -1 is default.
		this.GarbageMethod = -1;
	}
	
	//Returns the spritesheet or sprite assigned to target entity.
	getSprite()
	{
		return this.SprLoc;
	}
	
	//Returns the X location of the sprite.
	getXLoc()
	{
		return this.XLoc;
	}
	
	//Returns the Y location of the sprite.
	getYLoc()
	{
		return this.YLoc;
	}
	
	//Empty unless overridden. That's a fun word. Overridden.
	doAI()
	{
		
	}
	
	AnimateSprite()
	{
		if (this.AnimationSet != 0)
		{
			if (this.AnimationSet == 1)
			{
				if (this.AnimationFrame < this.AnimationFrameMax)
				{
					this.ClipX = this.AS_Left[this.AnimationFrame].XLoc;
					this.ClipY = this.AS_Left[this.AnimationFrame].YLoc;
					this.AnimationFrame += 1;
				} else {
					this.AnimationFrame = 0;
				}
			} else if (this.AnimationSet == 2) {
				if (this.AnimationFrame < this.AnimationFrameMax)
				{
					this.ClipX = this.AS_Right[this.AnimationFrame].XLoc;
					this.ClipY = this.AS_Right[this.AnimationFrame].YLoc;
					this.AnimationFrame += 1;
				} else {
					this.AnimationFrame = 0;
				}
			} else if (this.AnimationSet == 3) {
				if (this.AnimationFrame < this.AnimationFrameMax)
				{
					this.ClipX = this.AS_Up[this.AnimationFrame].XLoc;
					this.ClipY = this.AS_Up[this.AnimationFrame].YLoc;
					this.AnimationFrame += 1;
				} else {
					this.AnimationFrame = 0;
				}
			} else if (this.AnimationSet == 4) {
				if (this.AnimationFrame < this.AnimationFrameMax)
				{
					this.ClipX = this.AS_Down[this.AnimationFrame].XLoc;
					this.ClipY = this.AS_Down[this.AnimationFrame].YLoc;
					this.AnimationFrame += 1;
				} else {
					this.AnimationFrame = 0;
				}
			} else if (this.AnimationSet == 5) {
				if (this.AnimationFrame < this.AnimationFrameMax)
				{
					this.ClipX = this.AS_Hurt[this.AnimationFrame].XLoc;
					this.ClipY = this.AS_Hurt[this.AnimationFrame].YLoc;
					this.AnimationFrame += 1;
				} else {
					this.AnimationFrame = 0;
				}
			} else {
				//Special rendering animations unique to entities. See docs.
				if (this.EntityTag == "Player")
				{
					var tempAnimationSet = [];
					
					if (this.AnimationSet == 6)
						tempAnimationSet = this.AS_Pistol_Left;
					else if (this.AnimationSet == 7)
						tempAnimationSet = this.AS_Pistol_Right;
					else if (this.AnimationSet == 8)
						tempAnimationSet = this.AS_Shotgun_Left;
					else if (this.AnimationSet == 9)
						tempAnimationSet = this.AS_Shotgun_Right;
					else if (this.AnimationSet == 10)
						tempAnimationSet = this.AS_PistolShield_Left;
					else if (this.AnimationSet == 11)
						tempAnimationSet = this.AS_PistolShield_Right;
					else if (this.AnimationSet == 12)
						tempAnimationSet = this.AS_MachineGun_Left;
					else if (this.AnimationSet == 13)
						tempAnimationSet = this.AS_MachineGun_Right;
					
					if (this.AnimationFrame < this.AnimationFrameMax)
					{
						this.ClipX = tempAnimationSet[this.AnimationFrame].XLoc;
						this.ClipY = tempAnimationSet[this.AnimationFrame].YLoc;
						this.AnimationFrame += 1;
					} else {
						this.AnimationFrame = 0;
					}
				}
			}
		}
	}
}

//Player. The controllable entity.
class Player extends Entity
{
	constructor()
	{
		super();
		this.EntityTag = "Player";
		this.SprLoc = document.getElementById("ENTITIES_FULL");
		this.XLoc = 1;
		this.YLoc = 111;
		this.ClipX = 0;
		this.ClipY = 0;
		this.EntitySpeed = 2.5;
		this.EntityWidth = 24;
		this.EntityHeight = 24;
		this.EntityHealth = 3;
		
		this.jumpFrame = 0;
		this.jumpTimer = 0;
		
		this.AnimationTimer = setInterval(this.AnimateSprite.bind(this), 250);
		this.AnimationSet = 6;
		this.AS_Left = [new Point(0, 0), new Point(24, 0)];
		this.AS_Right = [new Point(1539, 0), new Point(1515, 0)];
		this.AS_Pistol_Left = [new Point(144, 0), new Point(168, 0)];
		this.AS_Pistol_Right = [new Point(1371, 0), new Point(1395, 0)];
		this.AS_MachineGun_Left = [new Point(46, 0), new Point(70, 0)];
		this.AS_MachineGun_Right = [new Point(1493, 0), new Point(1469, 0)];
		this.AS_Shotgun_Left = [new Point(), new Point()];
		this.AS_Shotgun_Right = [new Point(), new Point()];
		
		//See docs for weapons.
		this.CurrentWeapon = "Pistol";
		this.WeaponAmmo = -99;
		this.isShooting = 0;
		
		//Weapon specific variables.
		this.__MG_FIRE_INTERVAL = 40;
		this.__SHOTGUN_FIRE_INTERVAL = 80;
		this.__GRENADE_LAUNcHER_FIRE_INTERVAL = 160;
		this.CanFire = 0;
		this.shotUpdateTmr = setInterval(this.updateShooting.bind(this), 150);
		
		//Function bindings.
		this.updatePlayerASet.bind(this);
		this.firePlayerWeapon.bind(this);
		this.updatePlayerWeapon.bind(this);
	}
	
	updateShooting()
	{
		if (this.CurrentWeapon != "Pistol")
		{
			clearInterval(this.shotUpdateTmr);
			if (this.CurrentWeapon == "MachineGun")
			{
				this.CanFire = 1;
				this.shotUpdateTmr = setInterval(this.updateShooting.bind(this), this.__MG_FIRE_INTERVAL);
			} else if (this.CurrentWeapon == "Shotgun") {
				this.CanFire = 1;
				this.shotUpdateTmr = setInterval(this.updateShooting.bind(this), this.__SHOTGUN_FIRE_INTERVAL);
			} else {
				console.log("***WARNING***: Unknown weapon selected. Defaulting to 150ms for shotUpdateTmr. [Player.updateShooting]");
				this.shotUpdateTmr = setInterval(this.updateShooting.bind(this), 150);
			}
		}
	}
	
	updateJumpFrame()
	{
		if (Entities[findPlayer()].jumpFrame != 1 && SubGameMode != 4)
		{
			Entities[findPlayer()].YVel = GravityForce;
		} else {
			Entities[findPlayer()].jumpFrame = 0;
			Entities[findPlayer()].YVel = 0;
			clearInterval(Entities[findPlayer()].jumpTimer);
		}
	}
	
	//Changes players animation set based on direction and weapon. See docs.
	updatePlayerASet(newDir)
	{
		if (newDir == "Left")
		{
			if (this.AnimationSet == 6 || this.AnimationSet == 7)
			{
				this.AnimationSet = 6;
			} else if (this.AnimationSet == 8 || this.AnimationSet == 9) {
				this.AnimationSet = 8;
			} else if (this.AnimationSet == 10 || this.AnimationSet == 11) {
				this.AnimationSet = 10;
			} else if (this.AnimationSet == 12 || this.AnimationSet == 13) {
				this.AnimationSet = 12;
			}
		} else if (newDir == "Right") {
			if (this.AnimationSet == 6 || this.AnimationSet == 7)
			{
				this.AnimationSet = 7;
			} else if (this.AnimationSet == 8 || this.AnimationSet == 9) {
				this.AnimationSet = 9;
			} else if (this.AnimationSet == 10 || this.AnimationSet == 11) {
				this.AnimationSet = 11;
			} else if (this.AnimationSet == 12 || this.AnimationSet == 13) {
				this.AnimationSet = 13;
			}
		} else {
			console.log("***WARNING***: Invalid argument provided for updating player animation set. [updatePlayerASet]");
		}
		this.AnimateSprite();
	}
	
	firePlayerWeapon()
	{
		if (this.CurrentWeapon == "Pistol")
		{
			if (this.AnimationSet == 6)
			{
				Entities.push(new PlayerBullet(Entities[findPlayer()].getXLoc(), Entities[findPlayer()].getYLoc(), 1));
			} else if (this.AnimationSet == 7) {
				Entities.push(new PlayerBullet(Entities[findPlayer()].getXLoc(), Entities[findPlayer()].getYLoc(), 2));
			} else {
				console.log("***WARNING***: Weapon/Animation mismatch error.");
			}
		} else if (this.CurrentWeapon == "Shotgun") {
			if (this.AnimationSet == 8)
			{
				Entities.push(new PlayerBullet(Entities[findPlayer()].getXLoc(), Entities[findPlayer()].getYLoc(), 1));
			} else if (this.AnimationSet == 9) {
				Entities.push(new PlayerBullet(Entities[findPlayer()].getXLoc(), Entities[findPlayer()].getYLoc(), 2));
			} else {
				console.log("***WARNING***: Weapon/Animation mismatch error.");
			}
		} else if (this.CurrentWeapon == "MachineGun") {
			if (this.AnimationSet == 12 && this.CanFire == 1)
			{
				Entities.push(new PlayerBullet(Entities[findPlayer()].getXLoc(), Entities[findPlayer()].getYLoc(), 1));
			} else if (this.AnimationSet == 13 && this.CanFire == 1) {
				Entities.push(new PlayerBullet(Entities[findPlayer()].getXLoc(), Entities[findPlayer()].getYLoc(), 2));
			} else if (this.CanFire != 0) {
				console.log("***WARNING***: Weapon/Animation mismatch error.");
			}
			this.CanFire = 0;
		} else if (this.CurrentWeapon == "PistolShield") {
			if (this.AnimationSet == 10)
			{
				
			} else if (this.AnimationSet == 11) {
				
			} else {
				console.log("***WARNING***: Weapon/Animation mismatch error.");
			}
		} else {
			console.log("***WARNING***: Invalid player weapon. Current weapon is: " + this.CurrentWeapon + ".");
		}
	}
	
	//newWeapon is a string that designates what weapon will be given to the player along with the appropriate animation set.
	updatePlayerWeapon(newWeapon)
	{
		this.CurrentWeapon = newWeapon;
		if (this.CurrentWeapon == "Pistol")
			this.AnimationSet = 6;
		else if (this.CurrentWeapon == "Shotgun")
			this.AnimationSet = 8;
		else if (this.CurrentWeapon == "MachineGun")
			this.AnimationSet = 12;
		else if (this.AnimationSet == "PistolShield")
			this.AnimationSet = 10;
	}
	
	doAI()
	{
		if (this.isShooting == 1)
		{
			//Just to double check, in case it somehow gets through.
			if (this.CurrentWeapon != "Pistol")
			{
				this.firePlayerWeapon();
			}
		}
	}
	
	//NAMING STYLE CONSISTENCY? BAH.
	DamageTest()
	{
		
	}
}

class SNR extends Entity
{
	constructor()
	{
		super();
		this.EntityTag = "SNR";
		this.SprLoc = document.getElementById("ENTITIES_FULL");
		this.XLoc = 300;
		this.YLoc = 116;
		
		this.EntityWidth = 18;
		this.EntityHeight = 22;
		this.AS_Left = [new Point(4, 650), new Point(28, 650)];
		this.AS_Right = [new Point(1517, 650), new Point(1541, 650)];
		this.AnimationSet = 1;
		this.AnimationFrameMax = 2;
		this.AnimationTimer = setInterval(this.AnimateSprite.bind(this), 90);
	}
}

//Pushes player. This enemy is meant to disrupt player thought patterns.
class EnemyBrute extends Entity
{
	constructor(newX, newY)
	{
		super();
		this.EntityTag = "EnemyBrute";
		this.EntityHealth = 3;
		this.EntitySpeed = 2;
		this.EntityWidth = 23;
		this.EntityHeight = 24;
		this.XLoc = newX;
		this.YLoc = newY;
		this.YVel = GravityForce;
		this.GarbageMethod = 7;
		this.AnimationSet = 1;
		this.AS_Left = [new Point(241, 384), new Point(266, 384)];
		this.AS_Right = [new Point(1274, 384), new Point(1299, 384)];
		
		this.AnimateSprite();
		this.AnimationTimer = setInterval(this.AnimateSprite.bind(this), 250);
		
		this.doAI.bind(this);
	}
	
	doAI()
	{
		//Activate if player is on the say Y-Level as the Brute.
		if (Entities[findPlayer()].YLoc > this.YLoc)
		{
			if (Entities[findPlayer()].XLoc < this.XLoc)
			{
				this.XVel = -this.EntitySpeed;
				this.AnimationSet = 1;
			} else {
				this.AnimationSet = 2;
				this.XVel = this.EntitySpeed;
			}
		}
		
		//If the brute hits a wall, reverse him.
		if (this.XLoc < 5)
		{
			this.XVel = this.EntitySpeed;
			this.AnimationSet = 2;
		} else if (this.XLoc > GameCanvas.width - 5) {
			this.XVel = -this.EntitySpeed;
			this.AnimationSet = 1;
		}
	}
}

//Glitched blockbar. newX is the starting X, newY is the starting Y, and placeType is currently unused, but may be needed in the future.
class BlockBar extends Entity
{
	constructor(newX, newY, newWidth = 0, placeType)
	{
		super();
		this.EntityTag = "BlockBar";
		this.SprLoc = document.getElementById("TILES_FULL");
		this.isGlitched = 0;
		this.XLoc = newX;
		this.YLoc = newY;
		this.PlaceType;
		this.XVel = 0;
		this.YVel = -0.8;
		this.EntityWidth = newWidth;
		this.EntityHeight = 24;
		this.GarbageMethod = 0;
		
		//For unglitched.
		this.ClipX = 169;
		this.ClipY = 288;
	}
}

//Basic enemy. Attacks player with melee.
class EnemyGrunt extends Entity
{
	constructor(newX, newY)
	{
		super();
		this.EntityTag = "EnemyGrunt";
		this.SprLoc = document.getElementById("ENTITIES_FULL");
		this.isGlitched = 0;
		this.EntitySpeed = 2;
		this.XLoc = newX;
		this.YLoc = newY;
		this.XVel = this.EntitySpeed;
		this.YVel = GravityForce;
		this.GarbageMethod = 7;
		this.EntityWidth = 23;
		this.EntityHeight = 22;
		this.EntityHealth = 2;
		this.EntityDamage = 1;
		
		this.AnimationSet = 2;
		this.AnimationFrameMax = 2;
		this.AnimationTimer = setInterval(this.AnimateSprite.bind(this), 150);
		this.AS_Left = [new Point(192, 554), new Point(216, 554)];
		this.AS_Right = [new Point(1324, 554), new Point(1348, 554)];
		
		//Fixes bug where the enemy will momentarily be displayed as the player. Cause unknown.
		this.AnimateSprite();
		
		this.doAI.bind(this);
	}
	
	doAI()
	{
		if (this.XLoc < 0)
		{
			this.XVel = this.EntitySpeed;
			this.AnimationSet = 2;
		} else if (this.XLoc + this.EntityWidth > GameCanvas.width) {
			this.XVel = -this.EntitySpeed;
			this.AnimationSet = 1;
		}
	}
}

//Spawns random enemy after finishing corrupt animation.
class EnemyPortal extends Entity
{
	constructor(newX, newY, toSpawn)
	{
		super();
		this.EntityTag = "EnemyPortal";
		this.XLoc = newX;
		this.YLoc = newY;
		this.isGlitched = 1;
		this.EntityWidth = 26;
		this.EntityHeight = 28;
		this.SprLoc = document.getElementById("ENTITIES_FULL");
		this.ClipX = 1083;
		this.ClipY = 743;
		this.YVel = 0;
		this.GarbageMethod = 5;
		
		this.AnimationSet = 1;
		this.AnimationFrameMax = 2;
		this.AS_Left = [new Point(1083, 743), new Point(1107, 743)];
		
		this.doAI.bind(this);
		//this.AnimationTimer = setInterval(this.AnimateSprite.bind(this), 10);
		
		this.SpawnEnemy = toSpawn;
		this.FramesToSpawn = 22;
		this.FrameCounter = 0;
	}
	
	doAI()
	{
		this.FrameCounter += 1;
		if(this.FrameCounter > this.FramesToSpawn)
		{
			if (this.SpawnEnemy == "EnemyGrunt")
			{
				Entities.push(new EnemyGrunt(this.XLoc, this.YLoc));
			} else if (this.SpawnEnemy == "EnemyBrute") {
				Entities.push(new EnemyBrute(this.XLoc, this.YLoc));
			}
			//Feed him to the garbage collector!
			this.XLoc = 9999;
			this.FrameCounter = -1000; //In case there's lag.
		}
	}
}

//Self-explanitory. First argument is starting X, second is starting Y, third is direction to travel.
class PlayerBullet extends Entity
{
	//newX: Starting X. newY: Starting Y. newDir: Direction for bullet to travel. 1: Left, 2: Right, 3: Gravity left, 4: Gravity right.
	constructor(newX, newY, newDir)
	{
		super();
		this.EntityTag = "PlayerBullet";
		this.XLoc = newX;
		this.YLoc = newY + 6;
		this.EntitySpeed = 12;
		this.isGlitched = 0;
		this.GarbageMethod = 5;
		this.AnimationSet = 0;
		this.EntityWidth = 7;
		this.EntityHeight = 4;
		this.SprLoc = document.getElementById("SPECIAL_FULL");
		this.ClipX = 153;
		this.ClipY = 130;
		this.YVel = 0;
		
		this.doAI.bind(this);
		
		this.ShootDirection = newDir;
		
		if (newDir == 1)
		{
			this.XVel = -this.EntitySpeed;
		} else if (newDir == 2) {
			this.XVel = this.EntitySpeed;
		}
	}
	
	doAI()
	{
		this.EntitySpeed += 0.7;
		if (this.ShootDirection == 1)
			this.XVel = -this.EntitySpeed;
		else
			this.XVel = this.EntitySpeed;
	}
}

//Used for background effects in a few cores/levels.
class BackgroundFireball extends Entity
{
	constructor()
	{
		super();
		this.EntityTag = "BackgroundFireball";
		this.EntityWidth = 32;
		this.EntityHeight = 32;
		this.SprLoc = document.getElementById("FIREBALL_FULL");
		this.AS_Left = [new Point(0, 0), new Point(32, 0)];
		this.AnimationSet = 1;
		this.MaxAnimationFrames = 2;
		
		this.AnimationTimer = setInterval(this.AnimateSprite.bind(this), 50);
		this.XVel = -1;
		this.YVel = 1;
	}
	
	doAI()
	{
		if (this.XLoc < 0)
		{
			this.XLoc = Math.floor(Math.random() * GameCanvas.width);
			this.YLoc = -10;
			var newSpeed = Math.floor(Math.random() * 1.5) + 0.5;
			this.XVel = -newSpeed;
			this.YVel = newSpeed;
		}
	}
}

//Good memory. Simply disappears upon being approached.
class Memory extends Entity
{
	constructor(newX, newY, newCDir = 0)
	{
		super();
		this.EntityTag = "Memory";
		this.SprLoc = document.getElementById("Memories_Good");
		this.GarbageMethod = 3;
		this.isGlitched = 0;
		this.AnimationFrameMax = 4;
		this.EntityWidth = 32;
		this.EntityHeight = 32;
		this.EntitySpeed = 2;
		this.AS_Left = [new Point(0, 32), new Point(32, 32), new Point(64, 32), new Point(96, 32)];
		this.AS_Right = [new Point(0, 0), new Point(32, 0), new Point(64, 0), new Point(96, 0)];
		this.AnimationTimer = setInterval(this.AnimateSprite.bind(this), 125);
		
		//0 is right, 1 is left.
		this.ChargeDirection = newCDir;
		if (this.ChargeDirection == 0)
			this.AnimationSet = 2;
		else
			this.AnimationSet = 1;
		this.XLoc = newX;
		this.YLoc = newY;
		this.YVel = -0.8;
		//this.doAI.bind(this);
	}
	
	//IF THERE'S AN ISSUE WITH MOVEMENT CHECK HERE!!!!
	doAI()
	{
		if (this.YLoc < Entities[findPlayer()].YLoc)
		{
			if (this.ChargeDirection == 0)
			{
				this.XVel = this.EntitySpeed;
			} else {
				this.XVel = -this.EntitySpeed;
			}
		}
	}
}

class EvilMemory extends Entity
{
	constructor()
	{
		super();
		this.EntityTag = "EvilMemory";
		this.SprLoc = document.getElementById("Memories_Bad");
		GarbageMethod = 3;
		this.isGlitched = 0;
		this.AnimationSet = 2;
		this.AnimationFrameMax = 4;
		this.EntityWidth = 32;
		this.EntityHeight = 32;
		this.AS_Left = [new Point(0, 32), new Point(32, 32), new Point(64, 32), new Point(96, 0)];
		this.AS_Right = [new Point(0, 0), new Point(32, 0), new Point(64, 0), new Point(96, 0)];
		this.AnimationTimer = setInterval(this.AnimateSprite.bind(this), 125);
		
		this.doAI.bind(this);
	}
	
	//Currently a duplicate of Charger/Brute AI with minor changes.
	doAI()
	{
		//Activate if player is on the say Y-Level as the BadMemory.
		if (Entities[findPlayer()].YLoc > this.YLoc)
		{
			if (Entities[findPlayer()].XLoc < this.XLoc)
			{
				this.XVel = -this.EntitySpeed;
				this.AnimationSet = 1;
			} else {
				this.AnimationSet = 2;
				this.XVel = this.EntitySpeed;
			}
		}
	}
}

//Returns a random int from randMin (Minimum) to randMax (Maximum).
function getRand(randMin, randMax)
{
	return Math.floor((Math.random() * randMax) + randMin);
}

//Code for drawing the start menu and whatever other menu should be displayed. Created to prevent drawScreen from getting cluttered.
function drawMenus()
{
	//Here be dragons.
	if (GameState != 1 || GameState != 2)
	{
		if (GameState == 0)
		{
			GameCanvasCxt.fillStyle = "#000000";
			GameCanvasCxt.fillRect(0, 0, GameCanvas.width, GameCanvas.height);
			GameCanvasCxt.fillStyle = "#00FF00";
			GameCanvasCxt.font = "15px Lucida Console";
			GameCanvasCxt.drawImage(document.getElementById("GameLogo"), (GameCanvas.width / 4), 20);
			GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 4, 80, 150, 60);
			GameCanvasCxt.fillText("[START]", 120, 100);
			GameCanvasCxt.fillText("[ABOUT]", 120, 115);
			GameCanvasCxt.fillText("[OPTIONS]", 110, 130);
			//GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 616, 310, 9, 12, parseInt(_MOUSEX - GameCanvas.offsetLeft), parseInt(_MOUSEY - GameCanvas.offsetTop), 9, 12);
		} else if (GameState == 4) {
			if (MenuID == "CORE_SELECT")
			{
				GameCanvasCxt.fillStyle = "#000000";
				GameCanvasCxt.fillRect(0, 0, GameCanvas.width, GameCanvas.height);
				GameCanvasCxt.fillStyle = "#00FFFF";
				GameCanvasCxt.font = "10px Lucida Console";
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, 15, 10, 275, 140);
				GameCanvasCxt.fillText("SELECT_TARGET_CORE", 95, 45);
				GameCanvasCxt.fillText("CORE01:[CORRUPTED]", 30, 75);
				GameCanvasCxt.fillText("CORE02:ILLUSIONS", 160, 75);
				GameCanvasCxt.fillText("CORE03:AXIOM", 30, 95);
				GameCanvasCxt.fillText("CORE04:SYS_THREAD", 160, 95);
				GameCanvasCxt.fillText("CORE05:INSIDE", 30, 115);
				GameCanvasCxt.fillText("CORE06:SELF-DESTRUCT", 160, 115);
				GameCanvasCxt.fillText("CORE07:[UNDEFINED]", 95, 135);
			} else if (MenuID == "ABOUT") {
				GameCanvasCxt.fillStyle = "#00FFFF";
				GameCanvasCxt.font = "10px Lucida Console";
				/*See, this would be a great time to use a with statement, but ECMAScript standards say no for strict mode. Fantastic. -11/20/16*/
				/*OH FANTASTIC, CANVAS WITH CARRIGE RETURN/NEW LINE DOESN'T WORK. :| -11/20/16*/
				var AboutTextSpacer = 10;
				var AboutText = ["MissileFall: Zero is a passion project of mine", "that tells the story of what was happening on", "Earth while the MissileFall project was taking", "place.\nFor the uninitiated, the MissileFall", "project takes place many years in the future", "in a world completely overrun by pollution,", "and in an attempt to find another planet", "inhabbitable by humans, the United Nations", "and most other countries sent their leaders,", "diplomats, and smartest citizens into space."];
				for (var i = 0; i < AboutText.length; i++)
				{
					GameCanvasCxt.fillText(AboutText[i], 15, (i * AboutTextSpacer) + AboutTextSpacer * 4);
				}
				GameCanvasCxt.font = "20px Lucida Console";
				GameCanvasCxt.fillText("-=ABOUT=-", 95, 15);
			} else if (MenuID == "GAMEMODE_SELECT") {
				GameCanvasCxt.fillStyle = "#000000";
				GameCanvasCxt.fillRect(0, 0, GameCanvas.width, GameCanvas.height);
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, 15, 10, 275, 140);
				GameCanvasCxt.fillStyle = "#00FF00";
				GameCanvasCxt.font = "20px Courier New";
				GameCanvasCxt.fillText("SELECT_LOG_MODE", 55, 45);
				GameCanvasCxt.fillText("[STORY]", 105, 95);
				GameCanvasCxt.fillText("[SURVIVAL]", 85, 125);
			} else if (MenuID == "OPTIONS") {
				GameCanvasCxt.fillStyle = "#000000";
				GameCanvasCxt.fillRect(0, 0, GameCanvas.width, GameCanvas.height);
				GameCanvasCxt.fillStyle = "#00FF00";
				GameCanvasCxt.font = "16px Courier New";
				//Option boxes.
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, 15, 10, 275, 140);
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 88, 72, 32, 88, 55, 122, 32);
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 88, 72, 32, 88, 88, 122, 32);
				//GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 88, 72, 32, 88, 111, 122, 32);
				GameCanvasCxt.fillText("-=CONFIGURATION=-", 68, 45);
				GameCanvasCxt.font = "11px Courier New";
				GameCanvasCxt.fillText("MUSIC", 132, 67);
				GameCanvasCxt.fillText("SOUND_FX", 120, 100);
				//GameCanvasCxt.fillText("SHADERS", 25, 125);
				GameCanvasCxt.fillText("[8]RETURN", 115, 135);
				GameCanvasCxt.font = "8px Courier New";
				//Text for Music options.
				GameCanvasCxt.fillText("LOW", 100, 73);
				GameCanvasCxt.fillText("MEDIUM", 120, 73);
				GameCanvasCxt.fillText("HIGH", 155, 73);
				GameCanvasCxt.fillText("OFF", 180, 73);
				//Text for SFX options.
				GameCanvasCxt.fillText("LOW", 100, 106);
				GameCanvasCxt.fillText("MEDIUM", 120, 106);
				GameCanvasCxt.fillText("HIGH", 155, 106);
				GameCanvasCxt.fillText("OFF", 180, 106);
				//Checkboxes for Music.
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 482, 337, 13, 13, 103, 73, 11, 11);
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 482, 337, 13, 13, 130, 73, 11, 11);
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 482, 337, 13, 13, 160, 73, 11, 11);
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 482, 337, 13, 13, 182, 73, 11, 11);
				var MusicPlayer = document.getElementById("GameMusic");
				switch (PlayMusic)
				{
					case 0:
						GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 329, 225, 13, 13, 182, 73, 13, 11);
						MusicPlayer.volume = 0.0;
						break;
					case 1:
						GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 329, 225, 13, 13, 103, 73, 13, 11);
						MusicPlayer.volume = 0.2;
						break;
					case 2:
						GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 329, 225, 13, 13, 130, 73, 13, 11);
						MusicPlayer.volume = 0.5;
						break;
					case 3:
						GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 329, 225, 13, 13, 160, 73, 13, 11);
						MusicPlayer.volume = 1.0;
						break;
					default:
						PlayMusic = 0;
						break;
				}
				//Checkboxes for Sound Effects.
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 482, 337, 13, 13, 103, 106, 11, 11);
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 482, 337, 13, 13, 130, 106, 11, 11);
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 482, 337, 13, 13, 160, 106, 11, 11);
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 482, 337, 13, 13, 182, 106, 11, 11);
				switch (PlaySFX)
				{
					case 0:
						GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 329, 225, 13, 13, 103, 106, 13, 11);
						break;
					case 1:
						GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 329, 225, 13, 13, 130, 106, 13, 11);
						break;
					case 2:
						GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 329, 225, 13, 13, 160, 106, 13, 11);
						break;
					case 3:
						GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 329, 225, 13, 13, 182, 106, 13, 11);
						break;
					default:
						PlaySFX = 0;
						break;
				}
			} else if (MenuID == "ROM_MENU") {
				GameCanvasCxt.font = "7px 'Press Start 2P'";
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, 15, 10, 275, 140);
				GameCanvasCxt.fillStyle = "#00FF00";
				GameCanvasCxt.fillText("SELECT_ROM_ADDRESS", 90, 45);
				GameCanvasCxt.fillText("0x01:Memories", 30, 75);
				GameCanvasCxt.fillText("0x02:Fire", 160, 75);
				GameCanvasCxt.fillText("0x03:[Corrupted]", 30, 95);
				GameCanvasCxt.fillText("0x04:[Corrupted]", 160, 95);
				GameCanvasCxt.fillText("0x05:[Corrupted]", 30, 115);
				GameCanvasCxt.fillText("0x06:[Corrupted]", 160, 115);
				GameCanvasCxt.fillText("0x07:[Corrupted]", 95, 135);
			}
		}
	}
}

//Draws whatever dialog should be shown based on SubGameMode and CutsceneFrames.
function drawDialog()
{
	//Just for optimization, so drawScreen doesn't get bogged down.
	if (GameMode == 1)
	{
		var DialogOffsetX = Math.floor((Math.random() * 12) - 6);
		var DialogOffsetY = Math.floor((Math.random() * 4) - 2);
		switch(SubGameMode)
		{
			case 2:
				if (CutsceneFrames < 20)
				{
					EnemySpawning = 0;
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 171, 299, 50, 50, (GameCanvas.width / 6) + DialogOffsetX, GameCanvas.height - (GameCanvas.height / 3) + DialogOffsetY, 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("BEHOLD! THE VOICE OF GOD!", (GameCanvas.width / 4), GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("REPENT AND FACE JUSTICE", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("FOR YOUR UNHOLY EXISTENCE!", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 40) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 171, 299, 50, 50, (GameCanvas.width / 6) + DialogOffsetX, GameCanvas.height - (GameCanvas.height / 3) + DialogOffsetY, 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("YOU DARE REJECT THE WILL", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("OF GOD?! THEN DIE BY THE", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("HAND OF YOUR OWN SINS!", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
					EnemySpawning = 1;
				} else if (CutsceneFrames < 60) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 171, 299, 50, 50, (GameCanvas.width / 6) + DialogOffsetX, GameCanvas.height - (GameCanvas.height / 3) + DialogOffsetY, 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("YOU RUN AS IF YOUR", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("ACTIONS WILL CHANGE YOUR", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("FATE! YOU WILL SUBMIT!", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 80) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 171, 299, 50, 50, (GameCanvas.width / 6) + DialogOffsetX, GameCanvas.height - (GameCanvas.height / 3) + DialogOffsetY, 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("MAY THOSE WHO FELL", GameCanvas.width / 3.8, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("BEFORE YOU CRUSH", GameCanvas.width / 3.8, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("YOU FROM WITHIN!!", GameCanvas.width / 3.8, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 100) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 171, 299, 50, 50, (GameCanvas.width / 6) + DialogOffsetX, GameCanvas.height - (GameCanvas.height / 3) + DialogOffsetY, 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("YOU CAN RUN FOREVER, BUT", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 6));
					GameCanvasCxt.fillText("YOUR FATE IS SEALED!", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
				} else if (CutsceneFrames < 110) {
					SubGameMode = 0;
					MenuID = "CORE_SELECT";
					GameState = 4;
					clearInterval(CutsceneTimer);
					CutsceneFrames = 0;
					Entities[findPlayer()].EntityHealth = 3;
				}
				break;
			case 3:
				if (CutsceneFrames < 20)
				{
					EnemySpawning = 0;
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FF0000";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("I've thought about it", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("more, this artificial", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("world.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 40) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FF0000";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("At first, I wanted",  GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("simply to cleanse you", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("from this world for", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
					GameCanvasCxt.fillText("refusing reality.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 20));
				} else if (CutsceneFrames < 60) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FF0000";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("But now I realize", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("that I can fix all of", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
					GameCanvasCxt.fillText("this. I have unlimited", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 12));
					GameCanvasCxt.fillText("power to create and destroy.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 22));
				} else if (CutsceneFrames < 80) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 184, 368, 24, 24, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FF0000";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("I wIlL cReAtE a", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("CoMpLeTeLy SiNlEsS", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
					GameCanvasCxt.fillText("wOrLd!", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 12));
					EnemySpawning = 1;
				} else if (CutsceneFrames < 180) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FF0000";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("How do you go on,", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("knowing how it will", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
					GameCanvasCxt.fillText("end? Why do you fight", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 12));
					GameCanvasCxt.fillText("a losing battle?", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 22));
				} else if (CutsceneFrames < 200) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Have you ever looked", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("at the Yin/Yang sign?", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
					GameCanvasCxt.fillText("On one side, pitch black.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 12));
					GameCanvasCxt.fillText("The other, pure white.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 22));
				} else if (CutsceneFrames < 220) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("There is no center.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("It's an axiom. Only", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
					GameCanvasCxt.fillText("one extreme or the", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 12));
					GameCanvasCxt.fillText("other.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 22));
				} else if (CutsceneFrames < 240) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("No matter what happens", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("today, I will die", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
					GameCanvasCxt.fillText("eventually, either here,", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 12));
					GameCanvasCxt.fillText("by you, or by something else.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 22));
				} else if (CutsceneFrames < 260) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Either way, it's an", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("unavoidable extreme.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
				} else if (CutsceneFrames < 280) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FF0000";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Then why do you refuse", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("to die here?", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
					GameCanvasCxt.fillText("Would it not be easier?", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 12));
				} else if (CutceneFrames < 300) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("It would be. They say", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("always take the enemy", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
					GameCanvasCxt.fillText("you know over the one", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 12));
					GameCanvasCxt.fillText("you don't.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 22));
				} else if (CutsceneFrames < 320) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("But that's why I will", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("never stop fighting you:", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
					GameCanvasCxt.fillText("Because I know who you are.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 12));
				} else if (CutsceneFrames < 340) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("And if I'm going to", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("die, I will do my", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
					GameCanvasCxt.fillText("damndest to make sure", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 12));
					GameCanvasCxt.fillText("it isn't by your hand.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 22));
				} else if (CutsceneFrames < 360) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Not for you, not for", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("anyone else, but for me.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
				} else if (CutsceneFrames < 380) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("You've dealt more damage", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("to me than death ever", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 8));
					GameCanvasCxt.fillText("could, but like Hell will", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 12));
					GameCanvasCxt.fillText("I let you do the final blow.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 22));
				} else if (CutsceneFrames < 390) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FF0000";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Well, I've come to the", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("conclusion that, since this", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("world is now only rubble,", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 405) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FF0000";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("I will start from scratch.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("May you rot with the world of sin", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("you so desprately clutch to.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 415) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FF0000";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("The corruption will", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("finish of what is left of", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("your will.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 425) {
					SubGameMode = 0;
					clearInterval(CutsceneTimer);
					CutsceneFrames = 0;
					MenuID = "CORE_SELECT";
					GameState = 4;
					EnemySpawning = 0;
					Entities[findPlayer()].EntityHealth = 3;
				}
				break;
			case 4:
				if (CutsceneFrames < 3)
				{
					Entities[findPlayer()].XLoc = 128;
					Entities[findEntity("SNR")].XVel = -0.4;
				} else {
					Entities[findEntity("SNR")].XVel = 0.0;
				}
				
				if (CutsceneFrames < 6 && CutsceneFrames > 3)
				{
					Entities[findPlayer()].AnimationSet = 0;
					GameCanvasCxt.fillStyle = "#FFF600";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("I know this has been", 123, 100);
					GameCanvasCxt.fillText("rough on you, lately.", 123, 106);
				} else if (CutsceneFrames < 10 && CutsceneFrames > 6) {
					GameCanvasCxt.fillStyle = "#FFF600";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Watching the whole", 123, 100);
					GameCanvasCxt.fillText("world be crushed...", 123, 106);
				} else if (CutsceneFrames < 14 && CutsceneFrames > 10) {
					GameCanvasCxt.fillStyle = "#828282";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("You have no idea.", 100, 100);
					GameCanvasCxt.fillText("But talking won't fix it.", 100, 106);
				} else if (CutsceneFrames < 18 && CutsceneFrames > 14) {
					GameCanvasCxt.fillStyle = "#828282";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("What do you want?", 100, 106);
				} else if (CutsceneFrames < 22 && CutsceneFrames > 18) {
					GameCanvasCxt.fillStyle = "#FFF600";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("To give you a chance", 123, 100);
					GameCanvasCxt.fillText("to start over.", 123, 106);
				} else if (CutsceneFrames < 26 && CutsceneFrames > 22) {
					GameCanvasCxt.fillStyle = "#FFF600";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("We found something", 123, 100);
					GameCanvasCxt.fillText("that will let us make", 123, 106);
					GameCanvasCxt.fillText("a new world. A safe one.", 123, 112);
				} else if (CutsceneFrames < 30 && CutsceneFrames > 26) {
					GameCanvasCxt.fillStyle = "#828282";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Assuming you are safe", 100, 100);
					GameCanvasCxt.fillText("is the first step to", 100, 106);
					GameCanvasCxt.fillText("danger.", 100, 112);
				} else if (CutsceneFrames < 34 && CutsceneFrames > 30) {
					GameCanvasCxt.fillStyle = "#828282";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("And what about the others?", 100, 100);
					GameCanvasCxt.fillText("We've lost contact with", 100, 106);
					GameCanvasCxt.fillText("so many...", 100, 112);
				} else if (CutsceneFrames < 38 && CutsceneFrames > 34) {
					GameCanvasCxt.fillStyle = "#FFF600";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("We've found some people", 123, 100);
					GameCanvasCxt.fillText("from another world. They", 123, 106);
					GameCanvasCxt.fillText("will be coming along.", 123, 112);
				} else if (CutsceneFrames < 42 && CutsceneFrames > 38) {
					GameCanvasCxt.fillStyle = "#FFF600";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("We can only hope that", 123, 100);
					GameCanvasCxt.fillText("those that we lost are", 123, 106);
					GameCanvasCxt.fillText("doing alright.", 123, 112);
				} else if (CutsceneFrames < 46 && CutsceneFrames > 42) {
					GameCanvasCxt.fillStyle = "#828282";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("I no longer believe in hope.", 100, 100);
					GameCanvasCxt.fillText("Hope is to willingly deny", 100, 106);
					GameCanvasCxt.fillText("yourself of a possible truth.", 100, 112);
				} else if (CutsceneFrames < 50 && CutsceneFrames > 46) {
					GameCanvasCxt.fillStyle = "#828282";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("We don't know what is beyond", 85, 100);
					GameCanvasCxt.fillText("this plane of existence. Possibly", 65, 106);
					GameCanvasCxt.fillText("a God, or simply void.", 85, 112);
				} else if (CutsceneFrames < 54 && CutsceneFrames > 50) {
					GameCanvasCxt.fillStyle = "#828282";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("I do know what it offers, though.", 100, 100);
					GameCanvasCxt.fillText("Release.", 100, 106);
				} else if (CutsceneFrames < 58 && CutsceneFrames > 54) {
					GameCanvasCxt.fillStyle = "#828282";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Maybe you will be able to", 100, 100);
					GameCanvasCxt.fillText("recreate what once gave me hope,", 65, 106);
					GameCanvasCxt.fillText("but I cannot take that chance.", 100, 112);
				} else if (CutsceneFrames < 62 && CutsceneFrames > 58) {
					Entities[findPlayer()].XVel = -0.2;
				} else if (CutsceneFrames < 66 && CutsceneFrames > 62) {
					Entities[findPlayer()].XVel = 0;
					GameCanvasCxt.fillStyle = "#828282";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Don't build a kingdom", Entities[findPlayer()].XLoc - 15, 100);
					GameCanvasCxt.fillText("with ash while the wind", Entities[findPlayer()].XLoc - 15, 106);
					GameCanvasCxt.fillText("still blows.", Entities[findPlayer()].XLoc - 15, 112);
				} else if (CutsceneFrames < 70 && CutsceneFrames > 66) {
					Entities[findPlayer()].XVel = -0.2;
				} else if (CutsceneFrames < 75 && CutsceneFrames > 70) {
					MenuID = "CORE_SELECT";
					GameState = 4;
					Entities.splice(findEntity("SNR"), 1);
					GameCanvasCxt.globalAlpha = 1.0;
					clearInterval(CutsceneTimer);
					CutsceneFrames = 0;
					SubGameMode = 0;
					Entities[findPlayer()].EntityHealth = 3;
					ControlsLocked = 0;
					Entities[findPlayer()].XVel = 0;
				}
				break;
			case 5:
				if (CutsceneFrames < 3)
				{
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Man, you're odd.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("You fight this meaningless", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("war, and for what?", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 10) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("So you can pretend", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("like you matter for", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("some reason?", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 15) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("You mean NOTHING.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("Do you even know", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("what reality is anymore?", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 25) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("As far as you know,", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("as soon as you die,", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("so does the world.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 35) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Yet here we are.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("You dodging bullets", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("for people you think are real.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 45) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Actually, you know what?", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("Prove it. Prove you're in", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("the 'real' world.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
					EnemySpawning = 0;
					setLock(1, 1);
				} else if (CutsceneFrames < 50) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Go ahead, take your", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("time. I'll wait.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
				} else if (CutsceneFrames < 60) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("You can't do it.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("But you can prove God exists, right?", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("Or, perhaps, that he doesn't?", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
					EnemySpawning = 1;
					setLock(0, 0);
				} else if (CutsceneFrames < 75) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Once again, you can't do it.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("You don't even know the basics", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("of how you came to exist.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 85) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("All you have is fables", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("and theories. Myths and", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("guesses.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 95) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Can you honestly tell", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("yourself that the", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("universe cares if you exist?", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 105) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("That you have some", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("purpose in life?", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
				} else if (CutsceneFrames < 115) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("But the best part is the", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("irony of it all. The most", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("hilarious part.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 125) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Even if you lived", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("forever, you'll never", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("know the answer.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 135) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("You are less than", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("a pawn in a game you", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("don't know how to play.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 145) {
					SubGameMode = 0;
					MenuID = "CORE_SELECT";
					GameState = 4;
					Entities[findPlayer()].EntityHealth = 3;
				}
				break;
			case 6:
				if (CutsceneFrames < 8)
				{
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("Once more into the.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("fray, I see.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					EnemySpawning = 1;
				} else if (CutsceneFrames < 16) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("You know, this would have", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("eventually happened anyway.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("Even without him.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 24) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("I honestly thought", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("you would be dead by", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("now.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 32) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("But once again,", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("you prove your", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("persistence.", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 40) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.font = "6px 'Press Start 2P'";
					GameCanvasCxt.fillText("ENOUGH OF THESE", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 5));
					GameCanvasCxt.fillText("MIND GAMES, WHO THE", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 7));
					GameCanvasCxt.fillText("HELL ARE YOU?!", GameCanvas.width / 4, GameCanvas.height - (GameCanvas.height / 10));
				} else if (CutsceneFrames < 52) {
					GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 168, 120, 72, 32, GameCanvas.width / 6, GameCanvas.height - (GameCanvas.height / 3), 200, 50);
					GameCanvasCxt.fillStyle = "#FFF400";
					GameCanvasCxt.font = "20px 'Press Start 2P'";
					clearInterval(EnemySpawner);
					EnemySpawner = setInterval(spawnEnemy, 1332);
					GameCanvasCxt.fillText("I AM", GameCanvas.width / 5, GameCanvas.height - (GameCanvas.height / 9));
					GameCanvasCxt.fillStyle = "#00FF00";
					GameCanvasCxt.fillText("YOU!", GameCanvas.width / 2, GameCanvas.height - (GameCanvas.height / 9));
					
				}
				break;
		}
	}
}

//Did you compromise, then realized the price was too much to pay?
//Winners and Losers.
//Which one will I be today?
//-Social Distortion

function drawScreen()
{
	for (var i = 0; i < Entities.length; i++)
	{
		if (Entities[i].EntityTag == "BackgroundFireball" && SubGameMode != 6 && MenuID != "ROM_MENU")
		{
			GameCanvasCxt.drawImage(Entities[i].getSprite(), Entities[i].ClipX, Entities[i].ClipY, Entities[i].EntityWidth, Entities[i].EntityHeight, Entities[i].getXLoc(), Entities[i].getYLoc(), Entities[i].EntityWidth, Entities[i].EntityHeight);
		}
	}
	
	//Draw correct background.
	if (GameState == 1)
	{
		GameCanvasCxt.fillStyle = "#FF0000";
		GameCanvasCxt.font = "30px 'Press Start 2P'";
		if (SubGameMode == 2)
		{
			GameCanvasCxt.drawImage(document.getElementById("SUNSET_TESTBG"), 0, 0);
		} else if (SubGameMode == 4) {
			GameCanvasCxt.drawImage(document.getElementById("SYSTEMTHREAD_BG"), -15, -40);
		} else if (SubGameMode == 6) {
			GameCanvasCxt.fillText(SelfDestructList[getRand(0, SelfDestructList.length)], getRand(0, GameCanvas.width), getRand(0, GameCanvas.height));
			var newFill = getRand(1, 3);
			GameCanvasCxt.lineWidth = 5;
			if (newFill == 1)
				GameCanvasCxt.strokeStyle = "#00FF00";
			else if (newFill == 2)
				GameCanvasCxt.strokeStyle = "#0000FF";
			else
				GameCanvasCxt.strokeStyle = "#FF0000";
			GameCanvasCxt.strokeRect(getRand(0, GameCanvas.width), getRand(0, GameCanvas.height), getRand(50, 100), getRand(50, 100));
			GameCanvasCxt.lineWidth = 2;
			GameCanvasCxt.beginPath();
			GameCanvasCxt.moveTo(getRand(0, GameCanvas.width), getRand(0, GameCanvas.height));
			GameCanvasCxt.lineTo(getRand(0, GameCanvas.width), getRand(0, GameCanvas.height));
			GameCanvasCxt.stroke();
			GameCanvasCxt.closePath();
		}
	}
	drawMenus();
	
	//Draw all entities.
	for (var i = 0; i < Entities.length; i++)
	{
		if (Entities[i].isGlitched == 1)
		{
			GameCanvasCxt.drawImage(Entities[i].getSprite(), getRand(1, 346), getRand(1, 853), Entities[i].EntityWidth, Entities[i].EntityHeight, Entities[i].getXLoc(), Entities[i].getYLoc(), Entities[i].EntityWidth, Entities[i].EntityHeight);
		} else if (Entities[i].EntityTag != "BackgroundFireball" && Entities[i].EntityTag != "Player") {
			if (Entities[i].EntityTag == "BlockBar")
			{
				GameCanvasCxt.drawImage(Entities[i].getSprite(), 168, 288, 72, 24, Entities[i].getXLoc(), Entities[i].getYLoc(), Entities[i].EntityWidth, Entities[i].EntityHeight);
			} else {
				GameCanvasCxt.drawImage(Entities[i].getSprite(), Entities[i].ClipX, Entities[i].ClipY, Entities[i].EntityWidth, Entities[i].EntityHeight, Entities[i].getXLoc(), Entities[i].getYLoc(), Entities[i].EntityWidth, Entities[i].EntityHeight);
			}
		}
	}
	
	if (GameState == 1)
	{
		for (var i = 0; i < Entities[findPlayer()].EntityHealth; i++)
		{
			if (SubGameMode != 4)
				GameCanvasCxt.drawImage(document.getElementById("GUI_FULL"), 104, 9, 16, 14, i * 16, 0, 16, 14);
		}
		GameCanvasCxt.drawImage(Entities[findPlayer()].getSprite(), Entities[findPlayer()].ClipX, Entities[findPlayer()].ClipY, Entities[findPlayer()].EntityWidth, Entities[findPlayer()].EntityHeight, Entities[findPlayer()].getXLoc(), Entities[findPlayer()].getYLoc(), Entities[findPlayer()].EntityWidth, Entities[findPlayer()].EntityHeight);
	} else if (GameState == 2) {
		GameCanvasCxt.fillStyle = "#00FF00";
		GameCanvasCxt.font = "11px 'Press Start 2P'";
		GameCanvasCxt.fillText("Press 'Enter' to return to the Main Menu, or escape to resume.", GameCanvas.width / 2, GameCanvas.height / 2);
	}
	
	if (StaticFrame == 1)
	{
		if (SubGameMode == 4)
			GameCanvasCxt.globalAlpha = 0.5;
		GameCanvasCxt.drawImage(document.getElementById("SCREENEFFECT_STATIC1"), 0, 0, 800, 600);
		GameCanvasCxt.globalAlpha = 1.0;
		StaticFrame += 1;
	} else if (StaticFrame == 2) {
		if (SubGameMode == 4)
			GameCanvasCxt.globalAlpha = 0.5;
		GameCanvasCxt.drawImage(document.getElementById("SCREENEFFECT_STATIC2"), 0, 0, 800, 600);
		GameCanvasCxt.globalAlpha = 1.0;
		StaticFrame += 1;
	} else if (StaticFrame == 3) {
		if (SubGameMode == 4)
			GameCanvasCxt.globalAlpha = 0.5;
		GameCanvasCxt.drawImage(document.getElementById("SCREENEFFECT_STATIC3"), 0, 0, 800, 600);
		GameCanvasCxt.globalAlpha = 1.0;
		StaticFrame += 1;
	} else {
		if (SubGameMode == 4)
			GameCanvasCxt.globalAlpha = 0.5;
		GameCanvasCxt.drawImage(document.getElementById("SCREENEFFECT_STATIC4"), 0, 0, 800, 600);
		GameCanvasCxt.globalAlpha = 1.0;
		StaticFrame = 1;
	}
	
	drawDialog();
	
	GameCanvasCxt.fillStyle = "#0000FF";
	GameCanvasCxt.font = "30px Arial";
	//GameCanvasCxt.fillText(Entities[findPlayer()].YLoc.toString(), 12, 60);
	
	if (GameState == 5)
	{
		GameCanvasCxt.fillStyle = "#FF0000";
		GameCanvasCxt.font = "8px 'Courier New'";
		GameCanvasCxt.fillText("¿niw yllɒɘɿ ɘnoynɒ nɒƆ", GameCanvas.width / 3, GameCanvas.height / 2.8);
		var GameOverStyle = GameCanvasCxt.createLinearGradient(GameCanvas.width / 3.85, GameCanvas.height / 3.5, GameCanvas.width / 3.85, (GameCanvas.height / 3.5) - 16);
		GameOverStyle.addColorStop(1, "#FF0000");
		GameOverStyle.addColorStop(0, "#FFFF00");
		GameCanvasCxt.fillStyle = GameOverStyle;
		GameCanvasCxt.font = "16px 'Press Start 2P'";
		GameCanvasCxt.fillText("GAME OVER", GameCanvas.width / 3.85, GameCanvas.height / 3.5);
	}
}

function findPlayer()
{
	for (var i = 0; i < Entities.length; i++)
	{
		if (Entities[i].EntityTag == "Player")
			return i;
	}
	//This should never be reached.
	console.log("**WARNING**: Player not found in Entity array. Defaulting to first element.");
	return 0;
}

//Quickly finds the last instance of an entity by its tag.
function findEntity(targetTag)
{
	for (var i = 0; i < Entities.length; i++)
	{
		if (Entities[i].EntityTag == targetTag)
			return i;
	}
	
	console.log ("Failed to locate entity " + targetTag + ".");
	return 1;
}

//e is an event arg for keys. This only monitors keys being pressed down.
function readControlsDown(e)
{
	var key = e.keyCode;
	switch(key)
	{
		//W
		case 87:
			//Entities[findPlayer()].YVel = -Entities[findPlayer()].EntitySpeed;
			break;
		//A
		case 65:
			if (ControlsLocked != 1)
			{
				Entities[findPlayer()].XVel = -Entities[findPlayer()].EntitySpeed;
				Entities[findPlayer()].updatePlayerASet("Left");
			}
			Entities[findPlayer()].AnimateSprite();
			break;
		//S
		case 83:
			//Entities.push(new EnemyPortal(50, 50));
			break;
		//D
		case 68:
			if (ControlsLocked != 1)
			{
				Entities[findPlayer()].XVel = Entities[findPlayer()].EntitySpeed;
				Entities[findPlayer()].updatePlayerASet("Right");
			}
			Entities[findPlayer()].AnimateSprite();
			break;
		case 32:
			if (Entities[findPlayer()].CurrentWeapon != "Pistol")
				Entities[findPlayer()].isShooting = 1;
			break;
	}
}

function generateLivePlatform()
{
	if (GameState == 1 && SubGameMode != 4)
	{
		var barCount = 0;
		var lastBarY = 0;
		for (var i = 0; i < Entities.length; i++)
		{
			if (Entities[i].EntityTag == "BlockBar")
				barCount += 1;
		}
		if (barCount < _MAXBARS)
		{
			for (var bi = 0; bi < Entities.length; bi++)
			{
				if (Entities[bi].EntityTag == "BlockBar")
					lastBarY = Entities[bi].getYLoc();
			}
			Entities.push(new BlockBar(0, lastBarY + _YBARSPACER, getRand(25, 120), 0));
			Entities.push(new BlockBar(Entities[Entities.length - 1].EntityWidth + _XBARSPACER, Entities[Entities.length - 1].getYLoc(), Entities[Entities.length - 1].EntityWidth + 100, 1));
		}
	}
}

//Checks collisions for all entities in the Entities array.
function doCollisions()
{
	for (var i = 0; i < Entities.length; i++)
	{
		//Mildly ugly fix due to collision issues. Bug #2
		//I'll fix this one day, I swear. -11/20/16
		if (Entities[i].EntityTag == "EnemyGrunt")
			Entities[i].YVel = GravityForce;
		else if (Entities[i].EntityTag == "EnemyBrute")
			Entities[i].YVel = GravityForce;
		for (var i2 = 0; i2 < Entities.length; i2++)
		{
			
			if (Entities[i].XLoc < Entities[i2].XLoc + Entities[i2].EntityWidth && Entities[i].XLoc + Entities[i].EntityWidth > Entities[i2].XLoc && Entities[i].YLoc < Entities[i2].YLoc + Entities[i2].EntityHeight && Entities[i].YLoc + Entities[i].EntityHeight > Entities[i2].YLoc)
			{
				if (Entities[i].EntityTag == "Player")
				{
					if (Entities[i2].EntityTag == "BlockBar")
					{
						clearInterval(Entities[findPlayer()].jumpTimer);
							Entities[i].jumpFrame = 0;
						if (Entities[i].YLoc > Entities[i2].YLoc)
						{
							
						} else {
							Entities[i].YLoc = Entities[i2].YLoc - Entities[i].EntityHeight;
							Entities[i].YVel = Entities[i2].YVel;
						}
					} else if (Entities[i].jumpFrame == 0 && SubGameMode != 4){
						Entities[i].YVel = GravityForce; //Quick fix. TODO: Find permanent solution later.
					}
					
					if (Entities[i2].EntityTag == "EnemyGrunt") {
						Entities[i].EntityHealth -= Entities[i2].EntityDamage;
						Entities.splice(i2, 1);
					}
				} else if (Entities[i].EntityTag == "EnemyGrunt") {
					if (Entities[i2].EntityTag == "BlockBar")
					{
						Entities[i].YLoc = Entities[i2].getYLoc() - Entities[i].EntityHeight;
						Entities[i].YVel = Entities[i2].YVel;
					}
				} else if (Entities[i].EntityTag == "PlayerBullet") {
					if (Entities[i2].EntityTag == "EnemyGrunt")
					{
						Entities[i2].EntityHealth -= 1;
						Entities[i].XLoc = 1000;
					} else if (Entities[i2].EntityTag == "EnemyBrute") {
						Entities[i2].EntityHealth -= 1;
						Entities[i].XLoc = 1000;
					}
				} else if (Entities[i].EntityTag == "EnemyBrute") {
					if (Entities[i2].EntityTag == "BlockBar")
					{
						Entities[i].YVel = Entities[i2].YVel;
						Entities[i].YLoc = Entities[i2].YLoc - Entities[i].EntityHeight;
					} else if (Entities[i2].EntityTag == "Player") {
						Entities[i2].XVel = Entities[i].XVel * 1.2;
					}
				}
			}
		}
	}
}

//Runs on a timer to collect any entity not applying to its GarbageMethod variable.
function GarbageCollector()
{
	for (var i = 0; i < Entities.length; i++)
	{
		if (Entities[i].GarbageMethod == 0)
		{
			if (Entities[i].getYLoc() < -10)
			{
				//mfw MDN tells you the wrong heigharchy. http://s2.quickmeme.com/img/fe/febd76af6a0be4f07634e50e5f35eb4261779f1f9efacb47a6db02257d239bd9.jpg
				Entities.splice(i, 1);
			}
		} else if (Entities[i].GarbageMethod == 1) {
			if (Entities[i].getYLoc() > GameCanvas.height)
			{
				Entities.splice(i, 1);
			}
		} else if (Entities[i].GarbageMethod == 2) {
			if (Entities[i].getYLoc() > GameCanvas.height || Entities[i].getYLoc() < -10)
			{
				Entities.splice(i, 1);
			}
		} else if (Entities[i].GarbageMethod == 3) {
			if (Entities[i].getXLoc() > GameCanvas.width)
			{
				Entities.splice(i, 1);
			}
		} else if (Entities[i].GarbageMethod == 4) {
			if (Entities[i].getXLoc() < 0)
			{
				Entities.splice(i, 1);
			}
		} else if (Entities[i].GarbageMethod == 5) {
			if (Entities[i].getXLoc() < 0 || Entities[i].getXLoc() > GameCanvas.width || Entities[i].getYLoc() > GameCanvas.height || Entities[i].getYLoc() < -10)
			{
				Entities.splice(i, 1);
			}
		} else if (Entities[i].GarbageMethod == 6) {
			if (Entities[i].getXLoc() < 0 || Entities[i].getXLoc() > GameCanvas.width || Entities[i].getYLoc() > GameCanvas.height || Entities[i].getYLoc() < -10 || Entities[i].EntityHealth < 1)
			{
				Entities.splice(i, 1);
			}
		} else if (Entities[i].GarbageMethod == 7) {
			if (Entities[i].getYLoc() < -10 || Entities[i].getYLoc() > GameCanvas.height || Entities[i].EntityHealth < 1)
			{
				Entities.splice(i, 1);
			}
		} else if (Entities[i].GarbageMethod != -1) {
			console.log("**WARNING**: Unknown garbage collection method on entity ID " + Entities[i].EntityTag + " in cell " + i + " of Entities");
		}
	}
}

//Generates music based on the red pixels on screen. Currently not used due to taking up over 20% extra CPU usage.
function doMusicGen()
{
	//Used for local testing.
	GameCanvasCxt.crossOrigin = "Annonymous";
	var rawPixelData = GameCanvasCxt.getImageData(0, 0, GameCanvas.width, GameCanvas.height);
	MusicGenPixels = rawPixelData.data;
	for (var i = 0; i < Math.floor(MusicGenPixels.length / 8); i++)
	{
		AudioGen.frequency.value = MusicGenPixels[i];
	}
}

//Runs at a set interval, started from initGame().
function GameLoop()
{
	if (GameState == 1)
		generateLivePlatform();
	drawScreen();
	for (var i = 0; i < Entities.length; i++)
	{
		if (Entities[i].EntityTag == "Player")
		{
			if (Entities[i].YLoc > 0 && Entities[i].YLoc < GameCanvas.height)
			{
				Entities[i].YLoc += Entities[i].YVel;
				//AudioGen.frequency.value += 1;
			} else {
				Entities[i].YLoc = 1;
				//AudioGen.frequency.value = 1;
			}
			if (Entities[i].XLoc > 0 && Entities[i].XLoc < GameCanvas.width)
			{
				Entities[i].XLoc += Entities[i].XVel;
			} else {
				Entities[i].XLoc = 1;
			}
			
			if (Entities[i].XLoc < 0)
			{
				Entities[i].XLoc = GameCanvas.width - Entities[i].EntityWidth;
			}
			Entities[i].doAI();
			if (Entities[i].EntityHealth < 0)
				doGameOver();
		} else {
			if (Entities[i].Locked == 0)
			{
				Entities[i].doAI();
				Entities[i].XLoc += Entities[i].XVel;
				Entities[i].YLoc += Entities[i].YVel;
			}
		}
	}
	doCollisions();
	GarbageCollector();
	//doMusicGen();
}

//This will generate a single instance of two beams. To begin constant spawning, use generateLivePlatform.
function generateLevel()
{
	Entities.push(new BlockBar(0, getRand(0, 100), getRand(1, 150), 0));
	Entities.push(new BlockBar(Entities[Entities.length - 1].EntityWidth + _XBARSPACER, Entities[Entities.length - 1].getYLoc(), Entities[Entities.length - 1].EntityWidth + GameCanvas.width, 1));
}

//Useless. Left only for comedic effect.
function initClasses()
{
	//It's 11 o'clock...
	//Do I really wanna write the animation function only to have to re-write it tomorrow with the entity class after I change classes to extend eachother?
	//Nope.
	//10/29/2016
	
	//Alright, it's a new day, let's do this!
	//10/30/2016
}

function spawnEnemy()
{
	if (GameState == 1 && EnemySpawning == 1)
	{
		if (SubGameMode != 11)
		{
			var EnemyToSpawn = getRand(0, 2);
			if (EnemyToSpawn == 0)
			{
				Entities.push(new EnemyPortal(Math.floor(Math.random() * GameCanvas.width), Math.floor(Math.random() * GameCanvas.height), "EnemyGrunt"));
			} else {
				Entities.push(new EnemyPortal(Math.floor(Math.random() * GameCanvas.width), Math.floor(Math.random() * GameCanvas.height), "EnemyBrute"));
			}
		} else {
			for (var i = 0; i < Entities.length; i++)
			{
				//This is not how I wanted to do it, however there is an issue with the garbage collector that prevents my prefered method.
				if (Entities[i].EntityTag == "BlockBar")
				{
					if (getRand(0, 10) == 2)
					{
						if (getRand(0, 2) == 1)
						{
							Entities.push(new Memory(GameCanvas.width - 32, Entities[i].YLoc - 32, 1));
						} else {
							Entities.push(new Memory(0, Entities[i].YLoc - 32));
						}
					}
				}
			}
		}
	}
}

//To test something. Prints 'Test complete.' to console.
function TESTFUNC()
{
	console.log("Test complete.");
}

//There's cowards and heroes
//Both have been known to break the rules.
//-Social Distortion

//Are you happy now, with all the choices you've made?
//Are there times in life where you know you should have stayed?
//-Social Distortion

function countCutsceneFrames()
{
	if (GameMode == 1)
	{
		CutsceneFrames += 1;
	}
}

//Created to prevent the readControlsUp functions from becoming cluttered. If no key pressed has a previous case, this will be executed.
function doMenuInput(KeyPressed)
{
	var KeyString = "";
	switch (KeyPressed)
	{
		case 49:
			KeyString = "1";
			break;
		case 50:
			KeyString = "2";
			break;
		case 51:
			KeyString = "3";
			break;
		case 52:
			KeyString = "4";
			break;
		case 53:
			KeyString = "5";
			break;
		case 54:
			KeyString = "6";
			break;
		case 55:
			KeyString = "7";
			break;
		case 56:
			KeyString = "8";
			break;
		case 57:
			KeyString = "9";
			break;
		case 58:
			KeyString = "0";
			break;
	}
	if (MenuID != "NONE")
	{
		if (MenuID == "STARTMENU")
		{
			if (KeyString == "1")
			{
				/*
				var speechMaker = window.speechSynthesis;
				var speechText = new SpeechSynthesisUtterance("Login accepted.");
				var voices = window.speechSynthesis.getVoices();
				speechText.rate = 0.3;
				speechText.pitch = 2;
				speechText.voice = voices[4];
				speechMaker.speak(speechText);
				*/
				GameState = 4;
				MenuID = "GAMEMODE_SELECT";
			} else if (KeyString == "2") {
				MenuID = "ABOUT";
				GameState = 4;
			} else if (KeyString == "3") {
				MenuID = "OPTIONS";
				GameState = 4;
			}
		} else if (MenuID == "GAMEMODE_SELECT") {
			if (KeyString == "1")
			{
				MenuID = "CORE_SELECT";
			} else if (KeyString == "2") {
				MenuID = "NONE";
				GameState = 1;
				GameMode = 2;
			}
		} else if (MenuID == "CORE_SELECT") {
			//Each number corresponds to the appropriate core number. ex. Core01 is 1, Core02 is 2, etc.
			switch(KeyString)
			{
				//Core01:[Corrupted]
				case "1":
					/*
					console.log("LOADING:CORE01");
					setMusic("MAINGAME");
					MenuID = "NONE";
					EnemySpawning = 0;
					break;
					*/
					break;
				//Core02:Illusions
				case "2":
					console.log("LOADING:CORE02");
					GameMode = 1;
					GameState = 1;
					MenuID = "NONE";
					SubGameMode = 2;
					CutsceneTimer = setInterval(countCutsceneFrames, 1000);
					generateLivePlatform();
					setMusic("MAINGAME");
					EnemySpawning = 1;
					break;
				//Core03:Axiom
				case "3":
					console.log("LOADING:CORE03");
					setMusic("PEACEFUL");
					GameState = 1;
					GameMode = 1;
					SubGameMode = 3;
					CutsceneTimer = setInterval(countCutsceneFrames, 1000);
					generateLivePlatform();
					MenuID = "NONE";
					EnemySpawning = 0;
					break;
				//Core04:Sys_Thread
				case "4":
					Entities[findPlayer()].YLoc = 115;
					Entities[findPlayer()].XLoc = 250;
					console.log("LOADING:CORE04");
					setMusic("SYSTEMTHREAD");
					GameMode = 1;
					GameState = 1;
					MenuID = "NONE";
					SubGameMode = 4;
					CutsceneTimer = setInterval(countCutsceneFrames, 1000);
					EnemySpawning = 0;
					Entities[findPlayer()].YVel = 0;
					Entities[findPlayer()].AnimationSet = 1;
					ControlsLocked = 1;
					Entities.push(new SNR());
					break;
				//Core05:Inside
				case "5":
					console.log("LOADING:CORE05");
					setMusic("MAINGAME");
					MenuID = "NONE";
					GameState = 1;
					GameMode = 1;
					SubGameMode = 5;
					CutsceneTimer = setInterval(countCutsceneFrames, 1000);
					EnemySpawning = 1;
					break;
				//Core06:Self-Destruct
				case "6":
					console.log("LOADING:CORE06");
					setMusic("MAINGAME");
					MenuID = "NONE";
					GameState = 1;
					GameMode = 1;
					SubGameMode = 6;
					CutsceneTimer = setInterval(countCutsceneFrames, 1000);
					EnemySpawning = 0;
					break;
				//[Undefined]
				case "7":
					console.log("LOADING:CORE07");
					setMusic("MAINGAME");
					break;
				//[Unused] Ending battle after enemy spawning in Core06.
				case "8":
					console.log("LOADING:CORE08");
					setMusic("MAINGAME");
					console.log("(؛ ˙ʇɐdʇɐɯ 'buıʇıɐʍ ǝq ןן,ı")
					break;
				//ROM Menu.
				case "9":
					console.log("ROM Menu accessed.");
					setMusic("MAINGAME");
					MenuID = "ROM_MENU";
					break;
			}
		} else if (MenuID == "ABOUT") {
			//Since it only has one option, if is just the cleaner way to do it I think.
			if (KeyString == "1")
			{
				GameState = 0;
				MenuID = "STARTMENU";
			}
		} else if (MenuID == "OPTIONS") {
			//All of these are toggle switches unless mentioned otherwise.
			switch (KeyString)
			{
				//In-game music.
				case "1":
					if (PlayMusic < 4)
						PlayMusic += 1;
					else
						PlayMusic = 0;
					break;
				//In-game sound effects.
				case "2":
					if (PlaySFX < 4)
						PlaySFX += 1;
					else
						PlaySFX = 0;
					break;
				//Disable or enable shaders. This does not include the static. If you want to disable the box-shadow, fine, but you're keeping that static, like it or not.
				case "3":
					
					break;
				case "8":
					GameState = 0;
					MenuID = "STARTMENU";
					break;
			}
		} else if (MenuID == "ROM_MENU") {
			switch (KeyString)
			{
				//Return to Core Select screen.
				case "9":
					MenuID = "CORE_SELECT";
					console.log("Loading Core Menu...");
					break;
				//ROM0x01:Memories
				case "1":
					console.log("LOADING:ROM0x01");
					MenuID = "NONE";
					GameState = 1;
					SubGameMode = 11;
					break;
			}
		}
	}
}

//e is an event arg for keys. This only monitors keys being pressed up.
function readControlsUp(e)
{
	var key = e.keyCode;
	switch(key)
	{
		//W.
		case 87:
			if (Entities[findPlayer()].jumpFrame == 0)
			{
				Entities[findPlayer()].jumpFrame = 1;
				if (SubGameMode != 4)
					Entities[findPlayer()].YVel = -(GravityForce / 1.5);
				Entities[findPlayer()].jumpTimer = setInterval(Entities[findPlayer()].updateJumpFrame, 350); //Nerfed from 500 on 10/24/2016.
			}
			break;
		//A.
		case 65:
			if (ControlsLocked != 1)
			{
				if (Entities[findPlayer()].XVel != Entities[findPlayer()].EntitySpeed)
					Entities[findPlayer()].XVel = 0;
				Entities[findPlayer()].updatePlayerASet("Left");
			}
			break;
		//S.
		case 83:
			
			break;
		//D.
		case 68:
			if (ControlsLocked != 1)
			{
				if (Entities[findPlayer()].XVel != -Entities[findPlayer()].EntitySpeed)
					Entities[findPlayer()].XVel = 0;
				Entities[findPlayer()].updatePlayerASet("Right");
			}
			break;
		//Space.
		case 32:
			if (ControlsLocked != 1)
			{
				Entities[findPlayer()].isShooting = 0;
				Entities[findPlayer()].firePlayerWeapon();
			}
			break;
		//Shift.
		case 16:
			break;
		//Escape.
		case 27:
			if (GameState != 2)
			{
				setLock(1);
				GameState = 2;
				ControlsLocked = 1;
			} else {
				setLock(0);
				GameState = 1;
				ControlsLocked = 0;
			}
		break;
		//Enter.
		case 13:
			if (GameState == 5)
			{
				clearInterval(CutsceneTimer);
				CutsceneFrames = 0;
				CutsceneTimer = setInterval(countCutsceneFrames, 1000);
				GameState = 1;
				Entities[findPlayer()].EntityHealth = 3;
				setLock(0);
			}
			break;
		//Everything below this is for menus. Due to some laptops and keyboards not having the number pad, the normal 1-10 keys at the top will be used.
		default:
			doMenuInput(key);
			break;
	}
}

//Unused. Was previously meant to track mouse location to allow for clickable canvas buttons.
function updateMouseCords(event)
{
	_MOUSEX = event.clientX;
	_MOUSEY = event.clientY;
}

/*
Sets what music should be play. Argument is a string. Available tracks are:
STARTMENU
MAINGAME
SYSTEMTHREAD
PEACEFUL
*/
function setMusic(newTrack)
{
	/* DEAR GOD THE BANDWIDTH
	var MusicPlayer = document.getElementById("GameMusic");
	if (newTrack == "STARTMENU")
	{
		MusicPlayer.src = "Audio/Music/STARTMENU.mp3";
	} else if (newTrack == "SYSTEMTHREAD") {
		MusicPlayer.src = "Audio/Music/SYSTEMTHREAD.mp3";
	} else if (newTrack == "MAINGAME") {
		MusicPlayer.src = "Audio/Music/MAINGAME.mp3";
	} else if (newTrack == "PEACEFUL") {
		MusicPlayer.src = "Audio/Music/PEACEFUL.ogg";
	}
	MusicPlayer.play();
	*/
}

//Lock or unlock all entities. 0 is to unlock, 1 is to lock.
function setLock(newVal, exemptPlayer = 0)
{
	for (var i = 0; i < Entities.length; i++)
	{
		if (Entities[i].EntityTag != "Player")
			Entities[i].Locked = newVal;
		else if (exemptPlayer == 0 && Entities[i].EntityTag == "Player")
			Entities[i].Locked = newVal;
	}
}

function doGameOver()
{
	GameState = 5;
	setLock(1);
	clearInterval(CutsceneTimer);
	CutsceneFrames = 0;
}

//Life's a gamble, and you might lose.
//-Social Distortion
function initGame()
{
	console.log("-=Loading Copland OS Enterprise=-");
	//Init classes.
	console.log("Initializing classes...");
	initClasses();
	
	Entities.push(new Player());
	Entities.push(new BackgroundFireball());
	Entities.push(new BackgroundFireball());
	Entities.push(new BackgroundFireball());
	
	console.log("Starting game loop...");
	setInterval(GameLoop, 10);
	
	//Get canvas element.
	console.log("Retrieving canvas element...");
	GameCanvas = document.getElementById("GameCanvas");
	GameCanvasCxt = GameCanvas.getContext('2d');
	
	//Add keyboard event listeners.
	console.log("Adding keyboard event listeners...");
	document.addEventListener("keydown", readControlsDown, false);
	document.addEventListener("keyup", readControlsUp, false);
	
	GameCanvasCxt.imageSmoothingEnabled = false;
	GameCanvasCxt.fillStyle = "#FF0000";
	GameCanvasCxt.fillRect(0, 0, GameCanvas.width, GameCanvas.height);
	
	GameCanvasCxt.fillStyle = "#0000FF";
	GameCanvasCxt.font = "30px Arial";
	GameCanvasCxt.fillText("HELLO, NAVI.", 10, 50);
	
	GameCanvasCxt.drawImage(Entities[0].getSprite(), 0, 0);
	console.log("Login accepted. Hello, Lain.");
	//generateLevel();
	
	RRSound = new Audio("Audio/RRNoise.ogg");
	
	/*
	<!--Thanks to shooting_sparks on StackOverflow for this one!-->
	RRSound.addEventListener("timeupdate", function() {
		var buffer = 1;
		if (this.currentTime > this.duration - buffer)
		{
			this.currentTime = 0;
			this.play();
		}	
	}, false);
	document.getElementById("GameMusic").addEventListener("timeupdate", function() {
		var buffer = 1;
		if (this.currentTime > this.duration - buffer)
		{
			this.currentTime = 0;
			this.play();
		}	
	}, false);
	*/
	Entities.push(new SNR());
	
	//RRSound.play();
	
	//AudioGen.type = "square";
	//AudioGen.frequency.value = 440;
	//AudioGen.connect(AudioVol);
	//AudioVol.gain.value = 0.05;
	//AudioVol.connect(AudioCtx.destination);
	//AudioGen.start();
	
	//TODO: Create initSurvival function.
}