sogouExplorer.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab){
    	console.log(changeInfo);
    	console.log(tab);
    	if (changeInfo.status != "complete")
    		return;
        sogouExplorer.tabs.executeScript(tabId, {
        	file: "inject.js",
        }, function () {});
        sogouExplorer.tabs.insertCSS(tabId, {
            file: "vim.css",
        })
    }
);