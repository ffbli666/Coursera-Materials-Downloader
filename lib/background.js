chrome.browserAction.onClicked.addListener(function(tab) {
    var currentID = tab.id;
    return chrome.tabs.create({url: chrome.runtime.getURL("downloader.html")}, function(tab){
        setTimeout(function(){
            chrome.tabs.executeScript(currentID, {file: "lib/resource.js"}, function() {
                if (chrome.runtime.lastError) {
                    console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
                }
            });
        }, 100);
    });
});