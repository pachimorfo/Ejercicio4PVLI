// By Carlos León, 2016
// Licensed under Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)

'use strict';


//////////////////////////////////////////////////////////////////////////////


//Hemos "resuelto", no sabemos con certeza el nivel de resolucion conseguido, pero hemos trabajado en los ejercicios 1,2 y 4. 
//Tenemos alguna dudilla sobre el presence y el healer que hemos puesto en comun con otros compañeros...
//EJERCICIO 3: No sabemos donde poner lo de presence, ni como cambiarlo, es decir, no sabemos como modificar el tick().
//El ejercicio 1 hemos pensado que era bueno crear una variable dentro de cada componente y comprobar si estaba dormido o no
//El 2, creamos dos componentes nuevos, uno que añada vida a la entidad y otro la capacidad de curarse cada tick.
//El 4, creamos dos nuevos componentes, que añadan las capacidades de moverse y de tener volumen fisico, controlando tambien si estan dormidos o no.
//Añadimos tambien los 3 tipos de entidades nuevas.

///
// Entity type to differentiate entities and have them attack those not
// belonging to the same kind
var EntityType = {
    GOOD: 0,
    EVIL: 1
};

// Entity constructor
// 
// Entities have a name (it doesn't have to be unique, but it helps) and a type
//
// Additionally, entities accept a list of instantiated components
function Entity(entityName, entityType, components) {
    var self = this;
    this.entityName = entityName;

    // Instead of assigning the parameter, we call `addComponent`, which is a
    // bit smarter than default assignment
    this.components = [];
    components.forEach(function(component) {
        self.addComponent(component);
    });
    this.type = entityType;
}

Entity.prototype.addComponent = function(component) {
    this.components.push(component);
    component.entity = this;
};

// This function delegates the tick on the components, gathering their messages
// and aggregating them into a single list of messages to be delivered by the
// message manager (the game itself in this case
Entity.prototype.tick = function() {
    var outcoming = [];
    this.components.forEach(function(component) {
        var messages = component.tick();
        messages.forEach(function (message) {
            outcoming.push(message);
        });
    });
    return outcoming;
};

// All received messages are forwarded to the components
Entity.prototype.receive = function(message) {
    // If the receiver is `null`, this is a broadcast message that must be
    // accepted by all entities
	if(!message.receiver || message.receiver === this) {
		this.components.forEach(function(component) {
           	component.receive(message);
		});
	}
};
//////////////////////////////////////////////////////////////////////////////
// if the receiver is null, it is a broadcast message
function Message(receiver) {
    this.receiver = receiver;
}

//////////////////////////////////////////////////////////////////////////////
function Component(entity) {
    this.entity = entity;
    this.messageQueue = [];
}

Component.prototype.tick = function() {
    // We return a copy of the `messageQueue`, and we empty it
    var aux = this.messageQueue;
    this.messageQueue = [];
    return aux;
};
Component.prototype.receive = function(message) {
};


////////////////////////////////////////////////////////////////////////////// !U!*

function Game(entities) {
    this.entities = entities;
    this.messageQueue = [];
}

Game.prototype.mainLoop = function (ticks) {
    var i = 0;
    function line() {
        console.log("-----------------------------------------");
    }
    while(!ticks || i < ticks) {
        line();
        console.log("Tick number " + i);
        line();
        this.tick();
        i++;
    }
};

/*ejercico esta aqui 3*/
// Each tick, all entities are notified by calling their `tick` function
Game.prototype.tick = function () {
    var self = this;

    // We create `Presence` messages for all entities to let others that they
    // exists in the game
    this.entities.forEach(function(entity) {
        self.messageQueue.push(new Presence(entity));
    });

    // All messages coming from the entities are put in the queue
    this.entities.forEach(function(entity) {
        var tickMessages = entity.tick();

        tickMessages.forEach(function(tickMessage) {
            self.messageQueue.push(tickMessage);
        });
    });

    this.deliver();
};


// All messages in the queue are delivered to all the entities
Game.prototype.deliver = function() {
    var self = this;

    this.messageQueue.forEach(function(message) {
        if(!message.receiver) {         
            self.entities.forEach(function(entity) {
                entity.receive(message);
            });
        }
        else {
            message.receiver.receive(message);
        }
    });

    this.messageQueue = [];
};

//////////////////////////////////////////////////////////////////////////////
// Components
//////////////////////////////////////////////////////////////////////////////
function Attacker(entity) {
    Component.call(this, entity);
}
Attacker.prototype = Object.create(Component.prototype);
Attacker.prototype.constructor = Attacker;

Attacker.prototype.receive = function(message) {
	var dormido = false;//Variable booleana para saber si esta dormido
	if(dormido){
		if(message instanceof WakeUp){//si le llega el mensaje wake up se despierta
			console.log(this.entity.entityName + " is awake");
			dormido = false;
		}
	}
	else{//si esta despierto se ejecuta
   	  if(message instanceof Presence) {
            if(message.who.type != this.entity.type) {
              this.messageQueue.push(new Attack(this.entity, message.who));
       		 }
              }

	   else if(message instanceof Sleep){// en caso de que el mensaje que llegue sea sleep se duerme
		   console.log(this.entity.entityName + "is sleeping")
		   dormido = true;
	   }
	}
};

//////////////////////////////////////////////////////////////////////////////
function Defender(entity) {
    Component.call(this, entity);
}
Defender.prototype = Object.create(Component.prototype);
Defender.prototype.constructor = Defender;

Defender.prototype.receive = function(message) {
	var dormido = false;
	if(dormido){
		if(message instanceof WakeUp){
			console.log(this.entity.entityName + " is awake");
			dormido = false;
		}
	}
	else{
   	    if(message instanceof Attack) {
        console.log(this.entity.entityName + " was attacked by " + message.who.entityName);
	    } 

	   else if(message instanceof Sleep){
		   console.log(this.entity.entityName + "is sleeping")
		   dormido = true;
	   }
	}

};

//////////////////////////////////////////////////////////////////////////////
function Healer(entity){//ejercicio 2 creamos la funcion que suma la vida por cada turno
	Component.call(this, entity);
}
Healer.prototype = Object.create(Component.prototype);
Healer.prototype.constructor = Healer;

Healer.prototype.receive = function(message) {
	var dormido = false;
	if(dormido){
		if(message instanceof WakeUp){
			console.log(this.entity.entityName + " is awake");
			dormido = false;
		}
	}
	else{
		if(message instanceof Presence) {
			this.messageQueue.push(new Heal(this.entity, message.who))
		}
		else if(message instanceof Heal){ //(Es necesario crear un nuevo mensaje o podemos hacer esto en Presence?¿ Sin tener que crear un nuevo mensaje...)
			console.log(this.entity.entityName + " was cured");
			this.life += 10;
		}	
		else if(message instanceof Sleep){
			console.log(this.entity.entityName + "is sleeping")
			dormido = true;
		}
	}
};

/////////////////////////////////////////////////////////////////////////////
function Life(entity){//ejercicio2 componente que da la variable vida 
	Component.call(this,entity);
	var life = 100;
}
Life.prototype = Object.create(Component.prototype);
Life.prototype.constructor = Life;



/////////////////////////////////////////////////////////////////////////////
function Move (entity){//ejercicio4 componente que permite el movimiento
	Component.call(this, entity);
}
Move.prototype = Object.create(Component.prototype);
Move.prototype.constructor = Move;
Move.prototype.receive = function (message){

	var dormido = false;
	if(dormido){
		if(message instanceof WakeUp) {
			console.log(this.entity.entityName + " is awake");
			dormido = false;
		}}
	else if{
			if(message instanceof Presence){
				this.messageQueue.push(new Moving(message.who));
			}
			else if(message instanceof Moving){
				console.log(this.entity.entityName + " is moving");
			}
			else if(message instanceof Sleep) {
				console.log(this.entity.entityName + " is sleeping");
				dormido = true;
			}
	}
	
};


///////////////////////////////////////////////////////////////////////////////////
function Volume (entity){//ejercicio4 componente que otorga un volumen fisico
Component.call(this, entity);
}
Volume.prototype = Object.create(Component.prototype);
Volume.prototype.constructor = Volume;

Volume.prototype.receive = function (message){
	var dormido = false;
	if(dormido){
		if(message instanceof WakeUp) { 
			console.log(this.entity.entityName + " is awake ");
			dormido = false;
		}
		else{
			if(message instanceof Presence){
				this.messageQueue.push(new VolumeM(message.who));
			}
			else if(message instanceof VolumeM){
				console.log(this.entity.entityName + " has volume");
			}
			else if(message instanceof Sleep) {
				console.log(this.entity.entityName + " is asleep ");
				dormido = true;
			}
		}
	}
};

//////////////////////////////////////////////////////////////////////////////
// Messages
//////////////////////////////////////////////////////////////////////////////
function Presence(who, receiver) {
    Message.call(this, receiver);
    this.who = who;
}
Presence.prototype = Object.create(Message.prototype);
Presence.prototype.constructor = Presence;
//////////////////////////////////////////////////////////////////////////////
function Attack(who, receiver) {
    Message.call(this, receiver);
    this.who = who;
}
Attack.prototype = Object.create(Message.prototype);
Attack.prototype.constructor = Attack;
//Mensajes nuevos
//////////////////////////////////////////////////////////////////////////////
function Sleep(who, receiver){
	Message.call(this, receiver);
	this.who = who;
}
Sleep.prototype = Object.create(Message.prototype);
Sleep.prototype.constructor = Sleep;

/////////////////////////////////////////////////////////////////////////////
function WakeUp(who, receiver){
	Message.call(this, receiver);
	this.who = who;
}
WakeUp.prototype = Object.create(Message.prototype);
WakeUp.prototype.constructor = WakeUp;

//////////////////////////////////////////////////////////////////////////////
function Heal(who, receiver) {//a espensas de una respuesta
	Message.call(this, receiver);
	this.who = who;
}
Heal.prototype = Object.create(Message.prototype);
Heal.prototype.constructor = Heal;

//////////////////////////////////////////////////////////////////////////////
function Moving(who, receiver) {//a espensas de una respuesta
	Message.call(this,receiver);
	this.who = who;
}
Moving.prototype = Object.create(Message.prototype);
Moving.prototype.constructor = Moving;

//////////////////////////////////////////////////////////////////////////////
function VolumeMessage(who, receiver) {//a espensas de una respuesta
	Message.call(this,receiver);
	this.who = who;
}
VolumeMessage.prototype = Object.create(Message.prototype);
VolumeMessage.prototype.constructor = VolumeMessage;



// helper functions creating new components
var attacker = function() { return new Attacker(); };
var defender = function() { return new Defender(); };
var healer = function() { return new Healer(); };
var moveable = function() { return new Move(); };
var volumoner = function() { return new Volume(); };


// entities in the game
var link = new Entity("link", EntityType.GOOD, [attacker(), defender()]);
var ganon = new Entity("ganon", EntityType.EVIL, [attacker(), defender()]);
var octorok = new Entity("octorok", EntityType.EVIL, [defender()]);
var armos = new Entity("armos", EntityType.EVIL, [attacker()]);
var unMoveable= new Entity("polvo", [mover()]);//ejercicio4 nuevos personajes
var unVolumoner = new Entity("stone", [volumer()]);//ejercicio4 nuevos personajes
var MoveVol = new Entity("bird", [mover(), volumer()]);//ejercicio4 nuevos personajes

// we create the game with the entities
var game = new Game([link, ganon, armos, octorok, aMover, aVolumener, both]);

game.mainLoop(10);

