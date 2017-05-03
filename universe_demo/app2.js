(function() {
    var SPACESHIP_SPEED = 2; //飞船飞行速度
    var SPACESHIP_SIZE = 40; //飞船大小
    var SPACESHIP_COUNT = 4; //飞船数量
    var DEFAULT_CHARGE_RATE = 0.3; //飞船充电速度
    var DEFAULT_DISCHARGE_RATE = 0.2; //飞船放电速度

    var POWERBAR_POS_OFFSET = 5; //电量条位置位移
    var POWERBAR_COLOR_GOOD = "#70ed3f"; //电量良好状态颜色
    var POWERBAR_COLOR_MEDIUM = "#fccd1f"; //电量一般状态颜色
    var POWERBAR_COLOR_BAD = "#fb0000"; //电量差状态颜色
    var POWERBAR_WIDTH = 5; //电量条宽度

    var SCREEN_WIDTH = 800; //屏幕宽度
    var SCREEN_HEIGHT = 800; //屏幕高度
    var SCREEN_CENTER_X = SCREEN_WIDTH / 2; //屏幕X轴中心坐标
    var SCREEN_CENTER_Y = SCREEN_HEIGHT / 2; //屏幕Y轴中心坐标

    var PLANET_RADIUS = 50; //行星半径
    var ORBIT_COUNT = 4; //轨道数量
    var FAILURE_RATE = 0.3; //消息发送失败率

    //根据浏览器类型设置相应的requestAnimationFrame
    requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    
    var Spaceship = function(id) {
        this.id = id;
        this.power = 100; //飞船初始电量
        this.currState = "stop"; //飞船初始状态
        this.mediator = null; //飞船注册的mediator
        this.orbit = 100 + 50 * id - SPACESHIP_SIZE / 2; //飞船所在轨道的半径
        this.deg = 0; //飞船初始位置的角度
        this.timer = null;
    };

    
    Spaceship.prototype.dynamicManager = function() {
        var self = this;
        var fly = function() {
            self.timer = setInterval(function() {
                self.deg += SPACESHIP_SPEED;
                if (self.deg >= 360) self.deg = 0; //飞完一圈时，重置角度
            }, 20);
            ConsoleUtil.show("Spaceship No." + self.id + " is flying.");
        };

        var stop = function() {
            clearInterval(self.timer);
            ConsoleUtil.show("Spaceship No." + self.id + " has stop.");
        };

        return {
            fly: fly,
            stop: stop
        };
    };

    //能源系统 控制飞船能源
    Spaceship.prototype.powerManager = function() {
        var self = this;
        
        var charge = function() {
            var chargeRate = DEFAULT_CHARGE_RATE;
            var timer = setInterval(function() {
                //若飞船在飞行或者被销毁则不再充电
                if (self.currState == "fly" || self.currState == "destroy") {
                    clearInterval(timer);
                    return false;
                }
                if (self.power >= 100) { //如果飞船满电则不再充电
                    clearInterval(timer);
                    self.power = 100;
                    return false;
                }
                self.power += chargeRate;
                return true;
            }, 20);
            ConsoleUtil.show("Spaceship No." + self.id + " is charging.");
        };

        
        var discharge = function() {
            var dischargeRate = DEFAULT_DISCHARGE_RATE;
            var timer = setInterval(function() {
                //若飞船停止或者被销毁则不再放电
                if (self.currState == "stop" || self.currState == "destroy") {
                    clearInterval(timer);
                    return false;
                }
                if (self.power <= 0) {
                    clearInterval(timer);
                    self.power = 0;
                    self.stateManager().changeState("stop");
                    return false;
                }
                self.power -= dischargeRate;
            }, 20);
            ConsoleUtil.show("Spaceship No." + self.id + " is discharging.");
        };

        return {
            charge: charge,
            discharge: discharge
        };
    };

    
    Spaceship.prototype.stateManager = function() {
        var self = this;
        //istantiate several states of the spaceship
        var states = {
            fly: function(state) {
                self.currState = "fly";
                self.dynamicManager().fly();
                self.powerManager().discharge();
            },
            stop: function(state) {
                self.currState = "stop";
                self.dynamicManager().stop();
                self.powerManager().charge();
            },
            destroy: function(state) {
                self.currState = "destroy";
                self.mediator.remove(self);
                // AnimUtil.onDraw(self.mediator.getSpaceships());
            }
        };

        
        var changeState = function(state) {
            //根据状态执行指令
            states[state] && states[state]();
            ConsoleUtil.show("Spaceship No." + self.id + " state is " + state);
        };

        return {
            changeState: changeState
        };
    };

    //信号系统 飞船接收指令模块
    Spaceship.prototype.signalManager = function() {
        var self = this;
        return {
            receive: function(msg, from) {
                if (self.currState != msg.cmd && self.id == msg.id) {
                    self.stateManager().changeState(msg.cmd);
                }
            }
        };
    };


    
    var Commander = function() {
        this.id = "Don";
        this.cmds = [];
        this.mediator = null;
    };

    
    Commander.prototype.send = function(msg) {
        this.mediator.send(msg);
        this.cmds.push(msg);
    };


    
    var Mediator = function() {
        var spaceships = [];
        var commander = null;
        return {
            
            register: function(obj) {
                if (obj instanceof Commander) {
                    commander = obj;
                    obj.mediator = this;
                    ConsoleUtil.show("mediator register " + "Commander " + obj.id);
                    return true;
                } else if (obj instanceof Spaceship) {
                    spaceships[obj.id] = obj;
                    obj.mediator = this;
                    ConsoleUtil.show("mediator register " + "Spaceship " + obj.id);
                    return true;
                }
                ConsoleUtil.show("mediator register failed");
                return false;
            },

            
            send: function(msg, from, to) {
                var self = this;
                setTimeout(function() {
                    var success = Math.random() > FAILURE_RATE ? true : false; //若随机数大于发送失败率则执行消息发送
                    if (success) {
                        if (to) { //unicast
                            to.receive(msg, from);
                        } else { //broadcast;
                            if (msg.cmd == "launch") { //若收到的指令是Launch则执行创建对象
                                self.create(msg);
                            }
                            for (var key in spaceships) {
                                if (spaceships[key] !== from) { //所有飞船迭代接收消息
                                    spaceships[key].signalManager().receive(msg, from);
                                }
                            }

                        }
                        ConsoleUtil.show("send success");
                        return true;
                    } else {
                        ConsoleUtil.show("send failed");
                        return false;
                    }
                }, 1000);
            },

            
            remove: function(obj) {
                if (obj instanceof Spaceship) {
                    ConsoleUtil.show("destroy spaceship No." + obj.id);
                    delete spaceships[obj.id];
                    // spaceships[obj.id] = undefined;
                    return true;
                }
                ConsoleUtil.show("mediator remove failed");
                return false;
            },

            
            create: function(msg) {
                if (spaceships[msg.id] !== undefined) {
                    ConsoleUtil.show("Spaceship already exists");
                    return false;
                }
                var spaceship = new Spaceship(msg.id);
                this.register(spaceship);
                return true;
            },

            
            getSpaceships: function() {
                return spaceships;
            }
        };
    };

    
    var Message = function(target, command) {
        this.id = target;
        this.cmd = null;
        switch (command) {
            case "launch":
            case "stop":
            case "fly":
            case "destroy":
                this.cmd = command;
                break;
            default:
                alert("invalid command");
        }
    };

    
    var butttonHandler = function(commander) {
        var id = null;
        var cmd = null;
        $(".btn").on("click", function() {
            var cmdName = $(this).attr("name");
            switch (cmdName) {
                case "launch":
                case "fly":
                case "stop":
                case "destroy":
                    id = $(this).parent().index();
                    cmd = cmdName;
                    break;
                default:
                    alert("invalid command!");
                    return false;
            }
            var message = new Message(id, cmd);
            commander.send(message);
            return true;
        });
    };

    
    var AnimUtil = (function() {
        var canvas = document.getElementById("screen");
        canvas.width = SCREEN_WIDTH;
        canvas.height = SCREEN_HEIGHT;
        var ctx = canvas.getContext("2d"); //获取屏幕画布

        var cacheCanvas = document.createElement("canvas");
        cacheCanvas.width = SCREEN_WIDTH;
        cacheCanvas.height = SCREEN_HEIGHT;
        var cacheCtx = cacheCanvas.getContext("2d"); //生成缓存画布

        var timer = null; //定时器
        var mediator = null; //控制动画刷新的mediator

        
        var drawPlanet = function(_ctx) {
            // ctx.fillStyle = "#1b93ef";
            var x = SCREEN_CENTER_X - PLANET_RADIUS;
            var y = SCREEN_CENTER_Y - PLANET_RADIUS;
            var planet = new Image();
            planet.src = "min-iconfont-planet.png";
            planet.onload = function() {
                _ctx.drawImage(planet, x, y, PLANET_RADIUS * 2, PLANET_RADIUS * 2);
            };
        };

        
        var drawOrbit = function(_ctx) {
            for (var i = 0; i < ORBIT_COUNT; i++) {
                _ctx.strokeStyle = "#999";
                _ctx.beginPath();
                _ctx.arc(SCREEN_CENTER_X, SCREEN_CENTER_Y, 100 + 50 * i, 0, 2 * Math.PI);
                _ctx.closePath();
                _ctx.stroke();
            }
        };

        
        (function() {
            var canvas = document.getElementById("background");
            canvas.width = SCREEN_WIDTH;
            canvas.height = SCREEN_HEIGHT;
            var _ctx = canvas.getContext("2d");
            _ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            drawPlanet(_ctx);
            drawOrbit(_ctx);
        })();

        
        var drawSpaceship = function(_ctx, spaceship) {
            var spaceshipImg = new Image(); //创建飞船贴图
            spaceshipImg.src = "min-iconfont-rocket-active.png";
            spaceshipImg.onload = function() { //当飞船贴图加载后开始在画布上画(由于onload是异步进行的，所以执行顺序上会不是太清晰)
                try { //由于存在获取不了画布的情况产生错误，因此采用try..catch将错误丢弃
                    _ctx.save(); //保存画布原有状态
                    _ctx.translate(SCREEN_CENTER_X, SCREEN_CENTER_Y); //更改画布坐标系，将画布坐标原点移到画布中心
                    _ctx.rotate(-spaceship.deg * Math.PI / 180); //根据飞船飞行角度进行画布选择

                    //画电量条，根据电量状态改变颜色
                    _ctx.beginPath();
                    if (spaceship.power > 60) {
                        _ctx.strokeStyle = POWERBAR_COLOR_GOOD;
                    } else if (spaceship.power <= 60 && spaceship.power >= 20) {
                        _ctx.strokeStyle = POWERBAR_COLOR_MEDIUM;
                    } else {
                        _ctx.strokeStyle = POWERBAR_COLOR_BAD;
                    }
                    _ctx.lineWidth = POWERBAR_WIDTH;
                    _ctx.moveTo(spaceship.orbit, -POWERBAR_POS_OFFSET);
                    _ctx.lineTo(spaceship.orbit + SPACESHIP_SIZE * (spaceship.power / 100), -POWERBAR_POS_OFFSET);
                    _ctx.stroke();

                    _ctx.drawImage(spaceshipImg, spaceship.orbit, 0, SPACESHIP_SIZE, SPACESHIP_SIZE); //画飞船贴图
                    _ctx.restore(); //恢复画布到原有状态
                    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
                    ctx.drawImage(cacheCanvas, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); //将缓存画布内容复制到屏幕画布上
                    return true;
                } catch (error) {
                    return false;
                }
            };
        };

        
        var onDraw = function(spaceships) {
            if (!(spaceships === undefined || spaceships.every(function(item, index, array) {
                    return item === undefined; //判断飞船队列是否存在，以及飞船队列是否为空；若不是则执行下面步骤
                }))) {
                cacheCtx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT); //每次更新清空缓存画布
                for (var i = 0; i < spaceships.length; i++) { //迭代绘制飞船
                    if (spaceships[i] !== undefined) {
                        drawSpaceship(cacheCtx, spaceships[i]);
                    }
                }
            } else {
                ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
            }
        };

        
        var animLoop = function() {
            requestAnimationFrame(animLoop);
            onDraw(mediator.getSpaceships());
        };

        
        var setMediator = function(_mediator) {
            mediator = _mediator;
        };

        return {
            setMediator: setMediator,
            animLoop: animLoop
        };
    })();

    
    var ConsoleUtil = (function() {
        var $consoleLog = $("#console ul");
        var show = function(msg) {
            var $msg = $("<li></li>");
            $msg.text(msg);
            $consoleLog.prepend($msg);
        };

        return {
            show: show
        };
    })();

    //主线程
    window.onload = function() {
        var commander = new Commander();
        var mediator = new Mediator();
        mediator.register(commander);
        butttonHandler(commander);
        AnimUtil.setMediator(mediator);
        AnimUtil.animLoop();
    };

})();
