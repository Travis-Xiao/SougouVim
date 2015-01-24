var switch2Tab = function(tab, next) {
    console.log("switch");
    sogouExplorer.tabs.query({
        windowId: tab.windowId,
    }, function(tabs) {
        var len = tabs.length;
        if (len) {
            sogouExplorer.tabs.query({
                index: (tab.index + next + len) % len,
                windowId: tab.windowId,
            }, function (tabs) {
                if (tabs.length) {
                    sogouExplorer.tabs.update(tabs[0].id, {
                        selected: true,
                    });
                }
            });
        }
    });
};

sogouExplorer.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
        console.log(changeInfo);
        if (changeInfo.status != "complete") {
            console.log("skip event");
            return;
        }
        sogouExplorer.tabs.executeScript(tabId, {
            file: "inject.js",
        }, function() {});
        sogouExplorer.tabs.insertCSS(tabId, {
            file: "vim.css",
        });
        console.log("inject");
    }
);
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
            default:
                break;
        }
    });