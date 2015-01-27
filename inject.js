"use strict";
var KeyBindings = KeyBindings || {};

var Viminizer = {
	y_step: 40,
	x_step: 40,
	mode: 0, // 0: view mode; 1: selection mode; 2: search mode, 3: browse mode, 4: help mode
	hintTokens: [],
	entries: [],
	filteredEntries: [],
	firstChar: "",
	searchRegex: "",
	editableInputs: ["text", "password", "search", "email"],
	vHintMarkerContainer: null,
	searchInput: null,
	browseInput: null,
	vBookmarkHintContainer: null,
	vBookmarkHintInput: null,
	bookmarks: null,
	helpPanel: null,
	init : function () {
		this.generateHelpPanel();

		this.vHintMarkerContainer = $('<div id=vHintMarkerContainer>').appendTo($("body")).hide();
		this.searchInput = $("<div class='vSearchInput'><input id='vHintMarkerContainer' type='text'/></div>").appendTo($("body")).hide();

		var that = this;
		this.searchInput.on('keypress', function (e) {
			if (e.keyCode == 13) {
				that.startSearch($(this).children().val());
				that.exitSearchMode();
			}
		});

		this.browseInput = $("<div class='vbrowseBar'><div class='browseFrame'></div></div>").appendTo($("body")).hide();
		this.vBookmarkHintInput = $("<input class='browseBox' id='browseBox' type='text'/>").appendTo(this.browseInput.children())
		.blur(function (e) {
			that.exitBrowseMode();
		})
		.keyup(function (e) {
			var c = that.vBookmarkHintContainer.children();
			if (e.keyCode == 40 || e.keyCode == 38) {
				var index = c.index($(".vBookmarkHint.vactive"));
				var node = c.get((index - 39 + e.keyCode + c.length) % c.length);
				index != -1 && $(c.get(index)).removeClass("vactive");
				node && $(node).addClass("vactive");
				var regex = new RegExp($(this).val());
				that.vBookmarkHintInput.val(node.innerHTML);
				// var match = regex.exec(node.innerHTML);
				var input = document.getElementById("browseBox");
				// input && input.setSelectionRange(0, 9999);
				e.preventDefault();
				e.stopPropagation();
				return;
			} else if (e.keyCode == 13) {
				sogouExplorer.extension.sendMessage({
					command: "new",
					url: $(this).val(),
				});
				return;
			}
			c.remove();
			try {
				var regex = new RegExp($(this).val());
				that.searchBookmarkTree(that.bookmarks, regex);
			} catch (err) {}
		});
		this.vBookmarkHintContainer = $("<div class='vBookmarkHintContainer'></div>").appendTo(this.browseInput);

		window.onkeyup = function(e) {
			switch (e.keyCode) {
				case 27:
					// esc
					that.back2ViewMode();
					break;
				default:
					break;
			}
		};

		window.onkeypress = function(e) {
			e = e || window.event;
			if (that.isEditable()) {
				return;
			}
			if (e.ctrlKey || e.altKey)
				return;
			var c = e.keyCode;
			switch (that.mode) {
			case 0:
				that.viewModeProcessor(c);
				break;
			case 1:
				that.selectionModeProcessor(c);
				break;
			default:
				break;
			}
			e.preventDefault();
			e.stopPropagation();
		};
		that.generateTokens(26 * 26);
	},

	generateHelpPanel : function () {
		this.helpPanel = $("<div class='vhelpPanel'></div>").appendTo($("body")).hide();
		// var container = $("<div class='vHelpContainer'></div>").appendTo(this.helpPanel);
		var left_table = $("<table class='vtable vtable_left'></table>").appendTo(this.helpPanel);
		var right_table = $("<table class='vtable vtable_right'></table>").appendTo(this.helpPanel);
		var i = 0;
		for (var e in KeyBindings) {
			if (e) {
				$("<tr class='vHelpItem'></tr>").append($("<td class='vHelpItemDetail vHelpItemKey'>" + (String.fromCharCode(KeyBindings[e])) + "</td>"))
				.append($("<td class='vHelpItemDetail'>:</td>"))				
				.append($("<td class='vHelpItemDetail vHelpItemDesc'>" + (e[0].toUpperCase() + e.substr(1, 99)).replace(/_/g, " ") + "</td>"))
				.appendTo((i % 2) ? right_table : left_table);
				i += 1;
			}
		}
	},

	searchBookmarkTree : function (nodes, regex) {
		var that = this;
		nodes && nodes.forEach(function (bookmark, index) {
			if (bookmark.url && bookmark.url != "" && regex.test(bookmark.url)) {
				that.vBookmarkHintContainer.append($("<div class='vBookmarkHint'>" + bookmark.url + "</div>"));
			}
			that.searchBookmarkTree(bookmark.children, regex);
		})
	},

	retrieveCandidates : function() {
		// TODO 
		// Including all buttons, inputs and others else
		this.entries = $("a, :input, :button");
	},

	num2Char : function(num) {
		return num >= 27 || num < 0 ? "" : String.fromCharCode(65 + num);
	},

	randomPair : function(length) {
		return [Math.floor(length * Math.random()), Math.floor(length * Math.random())];
	},

	generateTokens : function(length) {
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

	showCandidates : function() {
		this.vHintMarkerContainer = $('<div id=vHintMarkerContainer>').appendTo($('body'));
		this.retrieveCandidates();
		this.filterEntries();
		var that = this;
		$(this.filteredEntries).each(function(index, elem) {
			var marker = $("<div>");
			var offset = $(elem).offset();
			if (offset.left || offset.top) {
				marker.css({
					left: offset.left,
					top: offset.top,
				});
				var token = that.hintTokens[index];
				for (var i = 0; i < token.length || 0; i++) {
					$('<span>').addClass("vReset").text(token[i]).appendTo(marker);
				}
				marker.addClass("vHintMarker").appendTo(that.vHintMarkerContainer);
			}
		});
	},

	recursiveSearch : function (node) {
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

	hideCandidates : function() {
		this.mode = 0;
		this.firstChar = '';
		this.vHintMarkerContainer.remove();
	},

	exitBrowseMode : function () {
		this.browseInput.hide();
		this.vBookmarkHintContainer.children().remove();
		this.mode = 0;
	},

	exitSearchMode : function () {
		this.mode = 0;
		this.searchInput.hide();
		this.searchResults.die();
	},

	exitHelpMode : function () {
		this.helpPanel.hide();
		this.mode = 0;
	},

	back2ViewMode : function () {
		switch (this.mode) {
		case 1:
			this.hideCandidates();
			break;
		case 2:
			this.exitSearchMode();
			break;
		case 3:
			this.exitBrowseMode();
			break;
		case 4:
			this.exitHelpMode();
			break;
		default:
			break;
		}
	},

	startSearch : function (regex) {
		this.searchResults.matches = [];
		this.searchResults.pointer = 0;
		this.searchRegex = this.searchInput.children().val().toLowerCase() + "";
		if (this.searchRegex == "") {
			return;
		}
		this.recursiveSearch($('body')[0]);
	},

	showHelpPanel : function () {
		this.helpPanel.show();
		this.mode = 4;
	},

	switch2Tab : function (direction) {
		sogouExplorer.extension.sendMessage({
			command: "switch",
			direction: direction,
		});
	},

	filterEntries : function() {
		this.filteredEntries = [];
		var that = this;
		this.entries.each(function(index, elem) {
			var offset = $(elem).offset();
			if (offset.top >= window.scrollY && offset.top <= (window.scrollY + window.innerHeight) && offset.left >= window.scrollX && offset.left <= (window.scrollX + window.innerWidth)) {
				that.filteredEntries.push(elem);
			}
		});
	},

	openLink : function(target) {
		var entry = this.filteredEntries[target];
		switch (entry.tagName) {
			case "TEXTAREA":
				$(entry).focus();
				break;
			case "INPUT":
				if (this.editableInputs.indexOf(entry.type) != -1) {
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

	isEditable : function() {
		var elem = document.activeElement;
		return (elem.tagName == "INPUT" && this.editableInputs.indexOf(elem.type) != -1)
			|| (elem.tagName == "TEXTAREA")
			|| elem.contentEditable == "true"
			|| elem.id == "vHintMarkerContainer";
	},

	selectionModeProcessor : function(keyCode) {
		keyCode = String.fromCharCode(keyCode).toUpperCase();
		if (keyCode < 'A' || keyCode > 'Z') {
			return;
		}
		var matched = false;
		for (var i = 0; i < this.filteredEntries.length; i++) {
			var token = this.hintTokens[i];
			var prefix = this.firstChar + keyCode;
			if (token && token.substr(0, prefix.length) == prefix) {
				var hint = this.vHintMarkerContainer.children().get(i);
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

	viewModeProcessor : function(keyCode) {
		switch (keyCode) {
			case KeyBindings.enter_browse_mode:
				this.browseInput.show().children().children().val("").focus();
				this.vBookmarkHintContainer.children().remove();
				this.mode = 3;
				var that = this;
				sogouExplorer.extension.sendMessage({
					command: "getBookmarks",
				}, function (response) {
					that.bookmarks = response.bookmarks;
				});
				break;
			case KeyBindings.go_back:
				history.go(-1);
				break;
			case KeyBindings.go_forward:
				history.go(1);
				break;
			case KeyBindings.switch_left:
				this.switch2Tab(-1);
				break;
			case KeyBindings.switch_right:
				this.switch2Tab(1);
				break;
			case KeyBindings.scroll_down:
				window.scrollBy(0, this.y_step);
				break;
			case KeyBindings.scroll_up:
				window.scrollBy(0, -this.y_step);
				break;
			case KeyBindings.scroll_left:
				window.scrollBy(-this.y_step, 0);
				break;
			case KeyBindings.scroll_right:
				window.scrollBy(this.y_step, 0);
				break;
			case KeyBindings.show_entries:
				this.mode = 1;
				this.showCandidates();
				break;
			case KeyBindings.reload_page:
				parent.location.reload();
				break;
			case KeyBindings.close_tab:
				sogouExplorer.extension.sendMessage({command: "close"});
				break;
			case KeyBindings.scroll_half_up:
				window.scrollBy(0, -window.innerHeight / 2);
				break;
			case KeyBindings.scroll_half_down:
				window.scrollBy(0, window.innerHeight / 2);
				break;
			case KeyBindings.scroll_page_up:
				window.scrollBy(0, - window.innerHeight);
				break;
			case KeyBindings.scroll_page_down:
				window.scrollBy(0, window.innerHeight);
				break;
			case KeyBindings.show_help_panel:
				this.showHelpPanel();
				break;
			case KeyBindings.create_tab:
				sogouExplorer.extension.sendMessage({
					command: "new",
				});
				break;
			case KeyBindings.restore_tab:
				sogouExplorer.extension.sendMessage({
					command: "restore",
				});
				break;
			case KeyBindings.search_mode:
				this.mode = 2;
				this.searchInput.show().children().val("").focus();
				break;
			case KeyBindings.previous_match:
				this.searchResults.go(-1);
				break;
			case KeyBindings.next_match:
				this.searchResults.go(1);
				break;
			default:
				// console.log(keyCode + " not found");
				break;
		}
	},

	searchResults : {
		matches: [],
		pointer: 0,
		go : function (direction) {
			if (this.matches.length) {
				$(this.matches[this.pointer]).removeClass("searchFocus");
				this.pointer = (direction + this.pointer + this.matches.length) % this.matches.length;
				window.scrollTo(0, $(this.matches[this.pointer]).addClass("searchFocus").offset().top);
			}
		},
		die : function () {
			if (this.matches.length) {
				$(this.matches[this.pointer]).removeClass("searchFocus");
				this.matches = [];
				this.pointer = 0;
			}
		},
	},
};

Viminizer.init();