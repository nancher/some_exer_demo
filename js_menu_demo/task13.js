//实现跨浏览器事件绑定
function addEvent(ele, event, handler){
	if(ele.addEventListener){
		return ele.addEventListener(event, handler);
	}
	else if(ele.attachEvent){
		return ele.attachEvent("on" + event, handler);
	}
	else{
		return ele["on" + event] = handler;
	}
}

function TreeNode(obj){
	this.parent = obj.parent;
	this.childs = obj.childs || [];
	this.data = obj.data  || "";
	this.selfElement = obj.selfElement;
	this.selfElement.TreeNode = this;
}

TreeNode.prototype = {
	constructor: TreeNode,

	//
	render: function(arrow, visibility){
		if(arrow){
			if(this.isLeaf()){
				this.selfElement.getElementsByClassName("arrow")[0].className = "arrow empty-arrow";
			}
			else if(this.isFolded()){
				this.selfElement.getElementsByClassName("arrow")[0].className = "arrow right-arrow";
			}
			else{
				this.selfElement.getElementsByClassName("arrow")[0].className = "arrow down-arrow";
			}
		}
		if(visibility){
			if(this.selfElement.className == "nodebody-visible"){
				this.selfElement.className = "nodebody-unvisible";
			}
			else{
				this.selfElement.className = "nodebody-visible";
			}
		}
	},

	addChild: function(childText){
		if(childText == ""){
			alert("节点的内容不能为空!");
		}
		else if(childText != "" && childText != null){
			var newNode = document.createElement("div");
			newNode.className = "nodebody-visible";
			var newHeader = document.createElement("label");
			newHeader.className = "node-header";
			var newArrow = document.createElement("div");
			newArrow.className = "arrow empty-arrow";
			var newTitle = document.createElement("span");
			newTitle.className = "node-title";
			var text = document.createTextNode(childText);
			newTitle.appendChild(text);
			var addImg = document.createElement("img");
			addImg.className = "addIcon";
			addImg.src = "images/add.png";
			var deleteImg = document.createElement("img");
			deleteImg.className = "deleteIcon";
			deleteImg.src = "images/delete.png"
			newHeader.appendChild(newArrow);
			newHeader.appendChild(newTitle);
			newHeader.appendChild(addImg);
			newHeader.appendChild(deleteImg);
			newNode.appendChild(newHeader);
			this.selfElement.appendChild(newNode);
			this.childs.push(new TreeNode({parent: this, data: childText, childs: [], selfElement: newNode}));
			//console.log(this);
			this.render(true, false);
			return this;
		}
	},

	delete: function(node){
		this.childs.pop(node);
		this.selfElement.removeChild(node);
		this.render(true, false);
		return this;
	},

	isFolded: function(){
		if(this.isLeaf()){
			return false;
		}
		if(!this.isLeaf()){
			if(this.childs[0].selfElement.className == "nodebody-visible"){
				return false;
			}
			else{
				return true;
			}
		}
	},

	toggleOpen: function(){
		if(this.isLeaf()){
		 	return this;
		}
		for(var i = 0; i < this.childs.length; i++){
			this.childs[i].render(false, true);
		}
		this.render(true, false);
		return this;
	},

	isLeaf: function(){
		if(this.childs.length == 0){
			return true;
		}
		else{
			return false;
		}
	}
};

var rootNode = new TreeNode({parent: null, data: "前端攻城狮", childs: [], selfElement: document.getElementsByClassName("nodebody-visible")[0]});

//rootNode绑定搜索函数
rootNode.search = function(query){
	searchResul = [];
	//存储待访问节点
	var queue = [];
	var current = this;
	queue.push(current);
	while(queue.length > 0){
		current = queue.shift();
		if(current.data == query){
			searchResul.push(current);
		}
		for(var i = 0; i < current.childs.length; i++){
			queue.push(current.childs[i]);
		}
	}
	return searchResul;
};

rootNode.clear = function(){
	for(var i = 0; i < searchResul.length; i++){
		searchResul[i].selfElement.getElementsByTagName("span")[0].style.color = "CornflowerBlue";
	}
}

addEvent(rootNode.selfElement, "click", function(e){
	var target = e.target || e.srcElement;
	var domNode = target;
	while(domNode.className.indexOf("nodebody") == -1){
		domNode = domNode.parentNode;
	}
	var selectNode = domNode.TreeNode;
	if(target.className == "addIcon"){
		selectNode.addChild(prompt("请输入子节点的内容："));
	}
	if(target.className == "deleteIcon"){
		selectNode.parent.delete(domNode);
	}
	if(target.className.indexOf("node-title") != -1 || target.className.indexOf("arrow") != -1){
		selectNode.toggleOpen();
	}
});


addEvent(document.getElementById("search-btn"), "click", function(){
	if(typeof searchResul != "undefined"){
		rootNode.clear();
	}
	var searchValue = document.getElementById("search-input").value.trim();
	if(searchValue == "" || searchValue == null){
		alert("请输入搜索内容!");
	}
	else{
		var result =  rootNode.search(searchValue);
		if(result.length == 0){
			alert("未找到您要搜索的内容!");
		}
		else{
			var pathNode;
			for(var i = 0; i < result.length; i++){
				result[i].selfElement.getElementsByTagName("span")[0].style.color = "red";
				pathNode = result[i];
				while(pathNode.parent){
					if(pathNode.selfElement.className == "nodebody-unvisible"){
						pathNode.parent.toggleOpen();
					}
					pathNode = pathNode.parent;
				}
			}
			alert("找到" + result.length + "个符合条件的结果!");
		}
	}
	
});


addEvent(document.getElementById("clear-btn"), "click", function(){
	rootNode.clear();
});

rootNode.addChild("技术").addChild("IT公司").addChild("谈笑风生");
rootNode.childs[0].addChild("HTML5").addChild("CSS3").addChild("JavaScript").addChild("PHP").addChild("Node.JS").toggleOpen();
rootNode.childs[0].childs[4].addChild("JavaScript").toggleOpen();
rootNode.childs[1].addChild("百度").addChild("腾讯").addChild("阿里").toggleOpen();
rootNode.childs[2].addChild("不学无术").addChild("玩物丧志").addChild("有一句诗").toggleOpen();
rootNode.childs[2].childs[2].addChild("书山有路勤为径，学海无涯苦作舟").toggleOpen();

document.getElementById("search-input").value = "JavaScript";