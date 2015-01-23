var y_step = 40;
var x_step = 40;
var scrolling = false;
var semaphore = 0;
console.log("injected");
var vimiumHintMarkerContainer;
var mode = 0; // 0: view mode; 1: selection mode

var loadScript = function(url, callback) {
	console.log('load jQuery');
	// Adding the script tag to the head as suggested before
	var head = document.getElementsByTagName('head')[0];
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;

	// Then bind the event to the callback function.
	// There are several events for cross browser compatibility.
	// script.onreadystatechange = callback;
	script.onload = callback;

	// Fire the loading
	head.appendChild(script);
};

window.onload = function() {
	var switch2Tab = function(next) {
		// TODO
		// Wait for Sougou Explorer implement tabs.query
		return;
		sogouExplorer.tabs.query({
			active: true,
			currentWindow: true,
		}, function(tabs) {
			var len = tabs.length;
			if (len) {
				var activeTab = tabs[0];
				tabId = activeTab.id;
				currentIndex = activeTab.index;

				sogouExplorer.tabs.query({
					index: (currentIndex + next) % num
				}, function(tabs) {
					if (tabs.length) {
						var tab2Activate = tabs[0];
						var tab2Activate_id = tab2Activate.id;
						sogouExplorer.tabs.update(tab2Activate_id, {
							active: true,
						});
					}
				});
			}
		});
	};

	var showCandidates = function () {
		console.log("show");
		if (!vimiumHintMarkerContainer) {
			vimiumHintMarkerContainer = $('<div id=vimiumHintMarkerContainer>').appendTo($('body'));
		
			$('a').each(function (index, elem) {
				var marker = $("<div>");
				marker.css({
					left: elem.offsetLeft,
					top: elem.offsetTop,
				});
				var span = $('<span>').addClass("vimiumReset").text("S" + elem.innerText + "S");
				marker.addClass("vimiumHintMarker").append(span).appendTo(vimiumHintMarkerContainer);
			});
		} else {
			if (vimiumHintMarkerContainer.css("display") == "none") {
				vimiumHintMarkerContainer.show();
			}
		}
	};

	var hideCandidates = function () {
		if (vimiumHintMarkerContainer) {
			vimiumHintMarkerContainer.hide();
		}
	};

	var viewModeProcessor = function (keyCode) {
		switch (keyCode) {
			case 74:
				// J
				switch2Tab(-1);
				break;
			case 75:
				// K
				switch2Tab(1);
				break;
			case 106:
				// j
				window.scrollBy(0, y_step);
				// semaphore = semaphore >= 0 ? (semaphore + 1) : 1;
				// if (!scrolling) {
				// 	scrolling = true;
				// 	scroller();
				// }
				break;
			case 107:
				// k
				window.scrollBy(0, -y_step);
				// semaphore = semaphore <= 0 ? (semaphore - 1) : -1;
				// if (!scrolling) {
				// 	scrolling = true;
				// 	scroller();
				// }
				break;
			case 104:
				// h
				window.scrollBy(-x_step, 0);
				break;
			case 108:
				// l
				window.scrollBy(x_step, 0);
				break;
			case 102:
				// f
				showCandidates();
				break;
			default:
				break;
		}
	}

	var createListeners = function() {
		console.log("create listeners");
		window.addEventListener('keyup', function (e) {
			switch (e.keyCode) {
				case 27:
					console.log("esc");
					hideCandidates();
					break;
			}
		});
		window.addEventListener('keypress', function(e) {
			e = e || window.event;
			console.log(e.keyCode);
			if (e.ctrlKey || e.altKey)
				return;
			if (mode) {

			} else {
				viewModeProcessor(e.keyCode);
			}
			
		});
	};
	// window.jQuery || loadScript("http://code.jquery.com/jquery-2.1.1.js", createListeners);
	createListeners();
};