var init = function(request) {
    if (!request.course || !request.sections) {
        return;
    }
    //close error info and show the downloader
    document.querySelector("#error-info").className  = "hidden";
    document.querySelector("#main").className  = "";

    //use resource create table
    var i = 0;
    document.querySelector(".course-name").innerHTML = request.course;
    Array.prototype.forEach.call(request.sections, function (section) {
        i++;
        var j = 0;
        resourceTable.sectionInsert(section.title);
        Array.prototype.forEach.call(section.lectures, function (lecture) {
            j++;
            resourceTable.resourceInsert(i + "-" + j + " " + lecture.title, lecture.resources);
        });
    });

    //check all button init
    Array.prototype.forEach.call(document.querySelectorAll("#check-all"), function(btn){
        btn.onclick = function() {
            var checked = this.checked;
            var modal   = this.getAttribute("data-modal");
            var checkboxs = document.querySelectorAll("input[data-modal=" + modal + "]");
            Array.prototype.forEach.call(checkboxs, function(checkbox){
                checkbox.checked = checked;
            });
        };
    });

    //download button init
    document.querySelector("#download").onclick = function () {
        taskQueue = [];
        taskMap.clear();
        notification.clear();
        document.querySelector(".info").innerHTML = "Don't close the window";
        var container = document.querySelector(".resource-container");
        var resources = container.querySelectorAll(".resource-template");
        Array.prototype.forEach.call(resources, function(resource) {
            var items = resource.querySelectorAll("input[type=checkbox]:checked");
            Array.prototype.forEach.call(items, function(download) {
                var task = {
                    url      : download.value,
                    type     : download.getAttribute("data-modal"),
                    dom      : download,
                    filename : resource.querySelector(".name").textContent,
                    state    : "wait",
                    hack     : download.getAttribute("hack")
                };
                taskQueue.push(task);
            });
        });
        this.disabled = true;
        download();
    };
};

var resourceTable = function() {
    var container = document.querySelector(".resource-container");
    var sectionTmp = document.querySelector(".section-template").cloneNode(true);
    var resourceTmp = document.querySelector(".resource-template").cloneNode(true);
    container.innerHTML = "";
    var sectionInsert = function (title) {
        sectionTmp.content.querySelector(".title").innerHTML = title;
        var clone = sectionTmp.content.cloneNode(true);
        container.appendChild(clone);
    };

    var resourceInsert = function (name, resource) {
        var tmp = resourceTmp.cloneNode(true);
        tmp.querySelector(".name").innerHTML = name;
        if (resource.slide) {
            tmp.querySelector(".slide input[type=checkbox]").value = resource.slide;
        }
        else {
            tmp.querySelector(".slide").innerHTML = "";
        }

        if (resource.video) {
            tmp.querySelector(".video input[type=checkbox]").value = resource.video;
        }
        else {
            if (resource.hack) {
                tmp.querySelector(".video input[type=checkbox]").value = resource.hack;
                tmp.querySelector(".video input[type=checkbox]").setAttribute("hack", "true");
            }
            else {
                tmp.querySelector(".video").innerHTML = "";
            }
        }
        if (resource.srt) {
            tmp.querySelector(".subtitle input[type=checkbox]").value = resource.srt;
        }
        else {
            tmp.querySelector(".subtitle").innerHTML = "";
        }
        container.appendChild(tmp);
    };
    return {
        sectionInsert  : sectionInsert,
        resourceInsert : resourceInsert,
    };
}();

var notification = function () {
    var id;
    var create = function() {
        if (id) return;
        var opt = {
            type: "progress",
            title: "Course Resources Downloader",
            message: "Resources downloading",
            iconUrl: "images/icon_128.png",
            progress: 0
        };

        chrome.notifications.create(opt, function(notificationID) {
            id = notificationID;
        });
    };

    var update = function (message) {
        if (!id) return;
        var opt = {
            message: message
        };
        chrome.notifications.update(id, opt);
    };

    var progress = function (progress) {
        if (!id) return;
        var opt = {
            progress: parseInt(progress, 10)
        };
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
        progress: progress,
        clear: clear
    };
}();

var download = function () {
    var task = taskQueue.shift();
    if (!task) {
        document.querySelector("#download").disabled = false;
        notification.update("Download Complete !");
        return;
    }

    var options = {
        url: task.url,
        saveAs:(document.querySelector("#askSaveAs").checked) ? true : false //force ask user
    };

    if (task.hack) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", task.url, false);
        xhr.onload = function() {
            if (this.readyState == 4 && this.status == 200) {
                var match = this.response.match(/.*?(<source.*?>).*/g);
                var div = document.createElement('div');
                div.innerHTML = match[0].trim();
                var source = div.firstChild;
                options.url = source.src.trim();
                var ext = options.url.split('.').pop();
                options.filename = task.filename.replace(/[\\\/:\*\?\"<>\|]+/g, '') + "." + ext;
            }
        };
        xhr.send();
    }
    chrome.downloads.download(options, function(id) {
        task.state = "progress";
        taskMap.set(id, task);
        var progress = taskMap.size / (taskMap.size + taskQueue.length) * 100;
        notification.progress(progress);
    });
    notification.create();
};

var taskQueue = [];
var taskMap = new Map();

//download event state register
chrome.downloads.onChanged.addListener(function(downloadDelta) {
    console.log(downloadDelta);
    if (downloadDelta.error) {
        //taskMap.delete(downloadDelta.id);
        download();
    }
    else if (downloadDelta.state && downloadDelta.state.current == "complete") {
        var task = taskMap.get(downloadDelta.id);
        task.state = "complete";
        task.dom.parentNode.innerHTML = "<img class='img-complete' src='images/complete.png' >";
        //taskMap.delete(downloadDelta.id);
        download();
    };
});

//get message event register
chrome.runtime.onMessage.addListener(function(request, sender) {
    init(request);
});