function addEvent(ele, event, handler){
			if(ele.addEventListener){
				return ele.addEventListener(event, handler);
			}
			else if(ele.attachEvent){
				return ele.attachEvent("on"+event, handler);
			}
			else{
				return ele["on"+event] = handler;
			}
		}

		var countryLabel = document.getElementById("country-label");
		var countryUl = document.getElementById("country-ul");
		var countryValue = document.getElementById("countryValue"); //此处只是在界面上模仿输入框的值，并非输入框的实际value
		var provinceLabel = document.getElementById("province-label");
		var provinceUl = document.getElementById("province-ul");
		var provinceValue = document.getElementById("provinceValue");

		addEvent(countryLabel, "click", function(){
			countryUl.style.display = "block";
		});

		addEvent(countryUl, "click", function(e){
			var target = e.target || e.srcElement;
			countryValue.innerHTML = target.innerHTML;
			countryUl.style.display = "none"	
		});

		addEvent(provinceLabel, "click", function(){
			provinceUl.style.display = "block";
		});

		addEvent(provinceUl, "click", function(e){
			var target = e.target || e.srcElement;
			provinceValue.innerHTML = target.innerHTML;
			provinceUl.style.display = "none"	
		});

		var radio = document.getElementsByClassName("page");
		var radio_1 = document.getElementById("first");
		var radio_2 = document.getElementById("second");
		var radio_3 = document.getElementById("third");
		var pageNumber = document.getElementById("page-number");

		function changePage(radio){
			if(radio == radio_1){
				pageNumber.innerHTML = "01";
			}
			if(radio == radio_2){
				pageNumber.innerHTML = "02";
			}
			if(radio == radio_3){
				pageNumber.innerHTML = "03";
			}
		}

		for(var i = 0; i < radio.length; i++){
			addEvent(radio[i], "click", function(i){
				return function(){
					return changePage(radio[i]);
				}
			}(i))
		}