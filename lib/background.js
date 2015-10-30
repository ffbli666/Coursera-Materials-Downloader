chrome.pageAction.onClicked.addListener(function(tab) {
    var currentID = tab.id;
    return chrome.tabs.create({url: chrome.runtime.getURL("downloader.html")}, function(downloaderTab){
        setTimeout(function(){
            chrome.tabs.executeScript(currentID, {file: "lib/resource.js"}, function() {
                if (chrome.runtime.lastError) {
                    console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
                }
            });
        }, 100);
    });
});


function checkForValidUrl(tabId, changeInfo, tab) {
    if (tab.url.match('https?://class.coursera.org/.*/lecture')) {
        chrome.pageAction.show(tabId);
    }
};
chrome.tabs.onUpdated.addListener(checkForValidUrl);