console.log("injected");
(function() {
	var y_step = 40;
	var x_step = 40;
	var scrolling = false;
	var semaphore = 0;
	var vimiumHintMarkerContainer;
	var mode = 0; // 0: view mode; 1: selection mode
	var hintTokens, entries, filteredEntries;
	var firstChar = '';

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

	var hideCandidates = function() {
		mode = 0;
		firstChar = '';
		vimiumHintMarkerContainer.remove();
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
				break;
			case 107:
				// k
				window.scrollBy(0, -y_step);
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
				mode = 1;
				showCandidates();
				break;
			case 120:
				// x
				sogouExplorer.extension.sendMessage({command: "close"});
				break;
			case 63:
				// ?
				showHelpPanel();
			default:
				break;
		}
	};

	var filterEntries = function() {
		filteredEntries = [];
		entries.each(function(index, elem) {
			// console.log(elem);
			var offset = $(elem).offset();
			if (offset.top >= window.scrollY && offset.top <= (window.scrollY + window.innerHeight) && offset.left >= window.scrollX && offset.left <= (window.scrollX + window.innerWidth)) {
				filteredEntries.push(elem);
			}
		});
	};

	var openLink = function(target) {
		var entry = filteredEntries[target];
		// console.log(entry);
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
			|| elem.contentEditable == "true";
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
					// console.log(token);
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

	window.addEventListener('keyup', function(e) {
		switch (e.keyCode) {
			case 27:
				// esc
				// console.log("esc");
				hideCandidates();
				break;
			default:
				break;
		}
	});

	window.addEventListener('keypress', function(e) {
		e = e || window.event;
		// console.log(e.keyCode);
		if (isEditable()) {
			console.log("input focused");
			return;
		}

		if (e.ctrlKey || e.altKey)
			return;
		if (mode) {
			selectionModeProcessor(e.keyCode);
		} else {
			viewModeProcessor(e.keyCode);
		}
		e.preventDefault();
		e.stopPropagation();
	});
	generateTokens(26 * 26);
	console.log("listeners added");
})();