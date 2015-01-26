console.log("injected");

(function() {
	var y_step = 40;
	var x_step = 40;
	var scrolling = false;
	var semaphore = 0;
	var vimiumHintMarkerContainer;
	var mode = 0; // 0: view mode; 1: selection mode; 2: search mode
	var hintTokens, entries, filteredEntries;
	var firstChar = "";
	var searchRegex = "";
	var searchInput = $("<div class='vimiumSearchInput'><input id='vimiumSearchBox' type='text'/></div>").appendTo($('body')).hide();
	var searchResults = {
		matches: [],
		pointer: 0,
		go: function (direction) {
			if (this.matches.length) {
				this.pointer = (direction + this.pointer + this.matches.length) % this.matches.length;
				console.log(this.matches[this.pointer]);
				window.scrollTo(0, $(this.matches[this.pointer]).offset().top);
			}
		},
	};

	searchInput.on('keypress', function (e) {
		if (e.keyCode == 13) {
			startSearch($(this).children().val());
			exitSearchMode();
		}
	});

	var retrieveCandidates = function() {
		// TODO 
		// Including all buttons, inputs and others else
		entries = $("a, :input, :button");
	};

	var num2Char = function(num) {
		return num >= 27 || num < 0 ? "" : String.fromCharCode(65 + num);
	};

	var randomPair = function(length) {
		return [Math.floor(length * Math.random()), Math.floor(length * Math.random())];
	};

	var generateTokens = function(length) {
		hintTokens = [];
		for (var i = 0; i < length; i++) {
			hintTokens[i] = "" + num2Char(Math.floor(i / 27)) + num2Char((i % 26));
		}
		// Shuffle
		for (var i = 0; i < length / 1.5 + 30 * Math.random(); i++) {
			var pair = randomPair(length);
			var t = hintTokens[pair[0]];
			hintTokens[pair[0]] = hintTokens[pair[1]];
			hintTokens[[pair[1]]] = t;
		}
	};

	var showCandidates = function() {
		vimiumHintMarkerContainer = $('<div id=vimiumHintMarkerContainer>').appendTo($('body'));

		retrieveCandidates();
		filterEntries();
		$(filteredEntries).each(function(index, elem) {
			var marker = $("<div>");
			var offset = $(elem).offset();
			marker.css({
				left: offset.left,
				top: offset.top,
			});
			var token = hintTokens[index];
			for (var i = 0; i < token.length; i++) {
				$('<span>').addClass("vimiumReset").text(token[i]).appendTo(marker);
			}
			marker.addClass("vimiumHintMarker").appendTo(vimiumHintMarkerContainer);
		});
	};

	var recursiveSearch = function (node) {
		var nodes = node.children;
		for (var i = 0; i < nodes.length; i ++) {
			var n = $(nodes[i]);
			if ((n.text() + "").toLowerCase().indexOf(searchRegex) != -1) {
				var k = searchResults.matches.indexOf(n.parent());
				searchResults.matches[k == -1 ? (searchResults.matches.length) : k] = n[0];
			}
			recursiveSearch(nodes[i]);
		}
	};

	var hideCandidates = function() {
		mode = 0;
		firstChar = '';
		vimiumHintMarkerContainer.remove();
	};

	var exitSearchMode = function () {
		mode = 0;
		searchInput.hide();
	};

	var back2ViewMode = function () {
		if (mode == 1) {
			hideCandidates();
		} else if (mode == 2) {
			exitSearchMode();
		}
	};

	var startSearch = function (regex) {
		searchResults.matches = [];
		searchResults.pointer = 0;
		searchRegex = searchInput.children().val().toLowerCase() + "";
		if (searchRegex == "") {
			return;
		}
		recursiveSearch($('body')[0]);

	};

	var showHelpPanel = function () {

	};

	var switch2Tab = function (direction) {
		sogouExplorer.extension.sendMessage({
			command: "switch",
			direction: direction,
		});
	};

	var viewModeProcessor = function(keyCode) {
		console.log(keyCode);
		switch (keyCode) {
			case 72:
				// H: go back in history
				history.go(-1);
				break;
			case 76:
				// L: go forward in history
				history.go(1);
				break;
			case 74:
				// J: switch to the left tab
				switch2Tab(-1);
				break;
			case 75:
				// K: switch to the right tab
				switch2Tab(1);
				break;
			case 106:
				// j: scroll down
				window.scrollBy(0, y_step);
				break;
			case 107:
				// k: scroll up
				window.scrollBy(0, -y_step);
				break;
			case 104:
				// h: scroll left
				window.scrollBy(-x_step, 0);
				break;
			case 108:
				// l: scroll right
				window.scrollBy(x_step, 0);
				break;
			case 102:
				// f: show all available entries
				mode = 1;
				showCandidates();
				break;
			case 114:
				// r: reload the page
				parent.location.reload();
				break;
			case 120:
				// x: close the tab
				sogouExplorer.extension.sendMessage({command: "close"});
				break;
			case 117:
				// u: scroll up half page height
				console.log("scroll up");
				window.scrollBy(0, -window.innerHeight / 2);
				break;
			case 100:
				// d: scroll down half page height
				console.log("scroll down");
				window.scrollBy(0, window.innerHeight / 2);
				break;
			case 85:
				// U: scroll up one page height
				window.scrollBy(0, - window.innerHeight);
				break;
			case 68:
				// D: scroll down one page height
				window.scrollBy(0, window.innerHeight);
				break;
			case 63:
				// ?: show help panel
				showHelpPanel();
				break;
			case 116:
				// t: create a new tab
				sogouExplorer.extension.sendMessage({
					command: "new",
				});
				break;
			case 84:
				// T: restored last tab
				console.log("restore");
				sogouExplorer.extension.sendMessage({
					command: "restore",
				});
				break;
			case 47:
				// /: enter search mode
				mode = 2;
				searchInput.show().children().val("").focus();
				break;
			case 78:
				// N: previous search match
				searchResults.go(-1);
				break;
			case 110:
				// n: next search match
				searchResults.go(1);
				break;
			default:
				break;
		}
	};

	var filterEntries = function() {
		filteredEntries = [];
		entries.each(function(index, elem) {
			var offset = $(elem).offset();
			if (offset.top >= window.scrollY && offset.top <= (window.scrollY + window.innerHeight) && offset.left >= window.scrollX && offset.left <= (window.scrollX + window.innerWidth)) {
				filteredEntries.push(elem);
			}
		});
	};

	var openLink = function(target) {
		var entry = filteredEntries[target];
		switch (entry.tagName) {
			case "INPUT":
				if (["text", "password"].indexOf(entry.type) != -1) {
					$(entry).focus();
					break;
				}
			case "A":
			case "BUTTON":
				entry.click();
				break;
			default:
				break;
		}
	};

	var isEditable = function() {
		var elem = document.activeElement;
		return (elem.tagName == "INPUT" && ["text", "password"].indexOf(elem.type) != -1)
			|| (elem.tagName == "TEXTAREA")
			|| elem.contentEditable == "true"
			|| elem.id == "vimiumSearchBox";
	};

	var selectionModeProcessor = function(keyCode) {
		keyCode = String.fromCharCode(keyCode).toUpperCase();
		if (keyCode < 'A' || keyCode > 'Z') {
			return;
		}
		var matched = false;
		for (var i = 0; i < filteredEntries.length; i++) {
			var token = hintTokens[i];
			var prefix = firstChar + keyCode;
			if (token.substr(0, prefix.length) == prefix) {
				var hint = vimiumHintMarkerContainer.children().get(i);
				if (hint) {
					var c = $(hint).children().get(firstChar.length);
					$(c).addClass('matchingCharacter');
					matched = true;
					if (firstChar != '') {
						firstChar = '';
						matched = false;
						hideCandidates();
						openLink(i);
						return;
					}
				}
			}
		}
		if (matched) {
			firstChar = keyCode;
		}
	};

	window.onkeyup = function(e) {
		switch (e.keyCode) {
			case 27:
				// esc
				back2ViewMode();
				break;
			default:
				break;
		}
	};

	window.onkeypress = function(e) {
		e = e || window.event;
		// console.log(e.keyCode);
		if (isEditable()) {
			return;
		}
		if (e.ctrlKey || e.altKey)
			return;
		var c = e.keyCode;
		switch (mode) {
		case 0:
			viewModeProcessor(c);
			break;
		case 1:
			selectionModeProcessor(c);
			break;
		default:
			break;
		}
		e.preventDefault();
		e.stopPropagation();
	};
	generateTokens(26 * 26);
	console.log("listeners added");
})();