var protocols = ["http", "https", "ftp", "mms"];

var visits = {
    tabIDs: [],
    urls: [],
};

var isProtocolSupported = function (url) {
    return url && protocols.indexOf(url.split(":").shift()) != -1;
};

sogouExplorer.tabs.query({
    currentWindow: true,
}, function (tabs) {
    tabs.forEach(function (tab, index) {
        if (isProtocolSupported(tab.url)) {
            visits.tabIDs.push(tab.id);
            visits.urls.push(tab.url);
        }
    });
});

var history = [];

var switch2Tab = function(tab, next) {
    sogouExplorer.tabs.query({
        windowId: tab.windowId,
    }, function(tabs) {
        var len = tabs.length;
        if (len) {
            sogouExplorer.tabs.query({
                index: (tab.index + next + len) % len,
                windowId: tab.windowId,
            }, function(tabs) {
                if (tabs.length) {
                    sogouExplorer.tabs.update(tabs[0].id, {
                        selected: true,
                    });
                }
            });
        }
    });
};

sogouExplorer.tabs.onRemoved.addListener(
    function(tabId, removeInfo) {
        var k = visits.tabIDs.indexOf(tabId);
        if (k != -1) {
            var i = visits.tabIDs.length - 1;
            history.push(visits.urls[k]);
            visits.tabIDs[k] = visits.tabIDs[i];
            visits.urls[k] = visits.urls[i];
            visits.tabIDs.pop();
            visits.urls.pop();
            // console.log("history updated: " + history[history.length - 1]);
        }
    });

sogouExplorer.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
        if (changeInfo.status != "complete") {
            return;
        }

        if (isProtocolSupported(tab.url)) {
            var k = visits.tabIDs.indexOf(tabId);
            k = k == -1 ? visits.tabIDs.length : k;
            visits.tabIDs[k] = tabId;
            visits.urls[k] = tab.url;
            // console.log("visits updated: " + tabId + " " + changeInfo.url);
        }

        sogouExplorer.tabs.executeScript(tabId, {
            file: "inject.js",
        }, function(r) {});
        sogouExplorer.tabs.insertCSS(tabId, {
            file: "vim.css",
        });
    });

sogouExplorer.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (!sender.tab)
            return;
        switch (request.command) {
            case "close":
                sogouExplorer.tabs.remove(sender.tab.id);
                break;
            case "switch":
                switch2Tab(sender.tab, request.direction);
                break;
            case "new":
                sogouExplorer.tabs.create({
                    selected: true,
                    url: request.url,
                });
                break;
            case "restore":
                if (history.length) {
                    sogouExplorer.tabs.create({
                        url: history.pop(),
                        selected: true,
                    });
                }
                break;
            case "getBookmarks":
                sogouExplorer.bookmarks.getTree(function (bookmarkTree) {
                    sendResponse({
                        bookmarks: bookmarkTree
                    });
                });
                break;
            default:
                break;
        }
    });

// sogouExplorer.browserAction.setPopup({
//     popup: "popup.html",
//     width: 300,
//     height: 60,
// });