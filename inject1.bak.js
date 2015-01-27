console.log("loading");
var Viminizer = {
	y_step: 40,
	x_step: 40,
	vimiumHintMarkerContainer: $('<div id=vimiumHintMarkerContainer>'),
	mode: 0,
	hintTokens: [],
	entries: [],
	filteredEntries: [],
	firstChar: "",
	searchRegex: "",
	searchInput: $("<div class='vimiumSearchInput'><input id='vimiumSearchBox' type='text'/></div>"),
	init: function () {
		console.log("injected");
		this.vimiumHintMarkerContainer.appendTo($("body")).hide();
		this.searchInput.appendTo($("body")).hide();
		this.searchInput.on('keypress', function (e) {
			if (e.keyCode == 13) {
				this.startSearch($(this).children().val());
				this.exitSearchMode();
			}
		});

		window.onkeyup = function(e) {
			switch (e.keyCode) {
				case 27:
					// esc
					this.back2ViewMode();
					break;
				default:
					break;
			}
		};

		window.onkeypress = function(e) {
			e = e || window.event;
			// console.log(e.keyCode);
			if (this.isEditable()) {
				return;
			}
			if (e.ctrlKey || e.altKey)
				return;
			var c = e.keyCode;
			switch (this.mode) {
			case 0:
				this.viewModeProcessor(c);
				break;
			case 1:
				this.selectionModeProcessor(c);
				break;
			default:
				break;
			}
			e.preventDefault();
			e.stopPropagation();
		};
		this.generateTokens(26 * 26);
		console.log("listeners added");
	},
	retrieveCandidates: function() {
		// TODO 
		// Including all buttons, inputs and others else
		this.entries = $("a, :input, :button");
	},

	num2Char: function(num) {
		return num >= 27 || num < 0 ? "" : String.fromCharCode(65 + num);
	},

	randomPair: function(length) {
		return [Math.floor(length * Math.random()), Math.floor(length * Math.random())];
	},

	generateTokens: function(length) {
		this.hintTokens = [];
		for (var i = 0; i < length; i++) {
			this.hintTokens[i] = "" + this.num2Char(Math.floor(i / 27)) + this.num2Char((i % 26));
		}
		// Shuffle
		for (var i = 0; i < length / 1.5 + 30 * Math.random(); i++) {
			var pair = this.randomPair(length);
			var t = this.hintTokens[pair[0]];
			this.hintTokens[pair[0]] = this.hintTokens[pair[1]];
			this.hintTokens[[pair[1]]] = t;
		}
	},

	showCandidates: function() {
		this.vimiumHintMarkerContainer = $('<div id=vimiumHintMarkerContainer>').appendTo($('body'));

		this.retrieveCandidates();
		this.filterEntries();
		$(this.filteredEntries).each(function(index, elem) {
			var marker = $("<div>");
			var offset = $(elem).offset();
			marker.css({
				left: offset.left,
				top: offset.top,
			});
			var token = this.hintTokens[index];
			for (var i = 0; i < token.length; i++) {
				$('<span>').addClass("vimiumReset").text(token[i]).appendTo(marker);
			}
			marker.addClass("vimiumHintMarker").appendTo(this.vimiumHintMarkerContainer);
		});
	},

	recursiveSearch: function (node) {
		var nodes = node.children;
		for (var i = 0; i < nodes.length; i ++) {
			var n = $(nodes[i]);
			if ((n.text() + "").toLowerCase().indexOf(this.searchRegex) != -1) {
				var k = this.searchResults.matches.indexOf(n.parent());
				this.searchResults.matches[k == -1 ? (this.searchResults.matches.length) : k] = n[0];
			}
			this.recursiveSearch(nodes[i]);
		}
	},

	hideCandidates: function() {
		this.mode = 0;
		this.firstChar = '';
		this.vimiumHintMarkerContainer.remove();
	},

	exitSearchMode: function () {
		this.mode = 0;
		this.searchInput.hide();
	},

	back2ViewMode: function () {
		if (this.mode == 1) {
			this.hideCandidates();
		} else if (this.mode == 2) {
			this.exitSearchMode();
		}
	},

	startSearch: function (regex) {
		this.searchResults.matches = [];
		this.searchResults.pointer = 0;
		this.searchRegex = this.searchInput.children().val().toLowerCase() + "";
		if (this.searchRegex == "") {
			return;
		}
		this.recursiveSearch($('body')[0]);
	},

	showHelpPanel: function () {

	},

	switch2Tab: function (direction) {
		sogouExplorer.extension.sendMessage({
			command: "switch",
			direction: direction,
		});
	},

	filterEntries: function() {
		this.filteredEntries = [];
		this.entries.each(function(index, elem) {
			var offset = $(elem).offset();
			if (offset.top >= window.scrollY && offset.top <= (window.scrollY + window.innerHeight) && offset.left >= window.scrollX && offset.left <= (window.scrollX + window.innerWidth)) {
				this.filteredEntries.push(elem);
			}
		});
	},

	openLink: function(target) {
		var entry = this.filteredEntries[target];
		switch (entry.tagName) {
			case "INPUT":
				if (["text", "password", "search"].indexOf(entry.type) != -1) {
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
	},

	isEditable: function() {
		var elem = document.activeElement;
		return (elem.tagName == "INPUT" && ["text", "password", "search"].indexOf(elem.type) != -1)
			|| (elem.tagName == "TEXTAREA")
			|| elem.contentEditable == "true"
			|| elem.id == "vimiumSearchBox";
	},

	selectionModeProcessor: function(keyCode) {
		keyCode = String.fromCharCode(keyCode).toUpperCase();
		if (keyCode < 'A' || keyCode > 'Z') {
			return;
		}
		var matched = false;
		for (var i = 0; i < this.filteredEntries.length; i++) {
			var token = this.hintTokens[i];
			var prefix = this.firstChar + keyCode;
			if (token.substr(0, prefix.length) == prefix) {
				var hint = this.vimiumHintMarkerContainer.children().get(i);
				if (hint) {
					var c = $(hint).children().get(this.firstChar.length);
					$(c).addClass('matchingCharacter');
					matched = true;
					if (this.firstChar != '') {
						this.firstChar = '';
						matched = false;
						this.hideCandidates();
						this.openLink(i);
						return;
					}
				}
			}
		}
		if (matched) {
			this.firstChar = keyCode;
		}
	},

	viewModeProcessor: function(keyCode) {
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
				this.switch2Tab(-1);
				break;
			case 75:
				// K: switch to the right tab
				this.switch2Tab(1);
				break;
			case 106:
				// j: scroll down
				window.scrollBy(0, this.y_step);
				break;
			case 107:
				// k: scroll up
				window.scrollBy(0, -this.y_step);
				break;
			case 104:
				// h: scroll left
				window.scrollBy(-this.y_step, 0);
				break;
			case 108:
				// l: scroll right
				window.scrollBy(this.y_step, 0);
				break;
			case 102:
				// f: show all available entries
				this.mode = 1;
				this.showCandidates();
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
				this.showHelpPanel();
				break;
			case 116:
				// t: create a new tab
				sogouExplorer.extension.sendMessage({
					command: "new",
				});
				break;
			case 88:
				// X: restored last tab
				console.log("restore");
				sogouExplorer.extension.sendMessage({
					command: "restore",
				});
				break;
			case 47:
				// /: enter search mode
				this.mode = 2;
				this.searchInput.show().children().val("").focus();
				break;
			case 78:
				// N: previous search match
				this.searchResults.go(-1);
				break;
			case 110:
				// n: next search match
				this.searchResults.go(1);
				break;
			default:
				break;
		}
	},

	searchResults : {
		matches: [],
		pointer: 0,
		go: function (direction) {
			if (this.matches.length) {
				this.pointer = (direction + this.pointer + this.matches.length) % this.matches.length;
				console.log(this.matches[this.pointer]);
				window.scrollTo(0, $(this.matches[this.pointer]).offset().top);
			}
		},
	},
};

Viminizer.init();