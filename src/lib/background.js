chrome.pageAction.onClicked.addListener(function(tab) {
    var currentID = tab.id;
    chrome.tabs.executeScript(currentID, {file: 'lib/resource.js'}, function() {
        if (chrome.runtime.lastError) {
            console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
        }
    });
});


function checkForValidUrl(tabId, changeInfo, tab) {
    if (tab.url.match('https?://www.coursera.org/learn/.*/lecture')) {
        chrome.pageAction.show(tabId);
    }
    else {
        chrome.pageAction.hide(tabId);
    }
    //chrome.pageAction.show(tabId);
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);

var courseName = '';
chrome.runtime.onMessage.addListener(function(request, sender) {
    courseName = request.courseTitle;
    startDownload(request.resources);
});



var startDownload = function(resources) {
    Array.prototype.forEach.call(resources, function(resource) {      
        var task = {
            url      : resource.url,
            filename : resource.filename,
            state    : 'wait',
            //hack     : download.getAttribute('hack')
        };
        taskQueue.push(task);
    });
    download();
};

var notification = function () {
    var id;
    var create = function() {
        if (id) return;
        var opt = {
            type: 'progress',
            title: courseName,
            message: 'Downloading',
            iconUrl: 'images/icon_128.png',
            progress: 0
        };

        chrome.notifications.create(opt, function(notificationID) {
            id = notificationID;
        });
    };

    var update = function (opt) {
        if (!id) return;
        chrome.notifications.update(id, opt);
    };

    var clear = function () {
        if (!id) return;
        chrome.notifications.clear(id);
        id = undefined;
    };

    return {
        create: create,
        update: update,
        clear: clear
    };
}();


var download = function () {
    var task = taskQueue.shift();
    if (!task) {
        var total = (taskMap.size + taskQueue.length);
        notification.update({ message: 'Download Complete (' + taskMap.size + '/' + total + ')' });
        return;
    }

    var options = {
        url: task.url,
        saveAs: false //force ask user
    };

    // if (task.hack) {
    //     var xhr = new XMLHttpRequest();
    //     xhr.open('GET', task.url, false);
    //     xhr.onload = function() {
    //         if (this.readyState == 4 && this.status == 200) {
    //             var match = this.response.match(/.*?(<source.*?>).*/g);
    //             var div = document.createElement('div');
    //             div.innerHTML = match[0].trim();

    //             var source = div.firstChild;
    //             options.url = source.src.trim();
    //             var ext = options.url.split('.').pop();
    //             options.filename = task.filename.replace(/[\\\/:\*\?\'<>\|]+/g, '') + '.' + ext;
    //         }
    //     };
    //     xhr.send();
    // }
    options.filename = task.filename
    notification.create();
    chrome.downloads.download(options, function(id) {
        task.state = 'progress';
        taskMap.set(id, task);
        var total = (taskMap.size + taskQueue.length);
        var progress = parseInt(taskMap.size / total * 100);
        notification.update({
            progress: progress,
            message:  'Downloading (' + taskMap.size + '/' + total + ')'
        });
    });

};

var taskQueue = [];
var taskMap = new Map();
notification.clear();

//download event state register
chrome.downloads.onChanged.addListener(function(downloadDelta) {
    if (downloadDelta.error) {
        download();
    }
    else if (downloadDelta.state && downloadDelta.state.current == 'complete') {
        download();
    };
});