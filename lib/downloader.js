
var ResourceTable = function() {
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
};

var download = function () {
    var task = taskQueue.shift();
    if (!task) {
        document.querySelector("#download").disabled = false;
        return;
    }

    var options = {
        url: task.url
        //saveAs:true //force ask user
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
    });
};

var init = function(request) {
    if (!request.course || !request.sections) {
        return;
    }
    document.querySelector("#error-info").className  = "hidden";
    document.querySelector("#main").className  = "";

    var i = 0;
    document.querySelector(".course-name").innerHTML = request.course;
    Array.prototype.forEach.call(request.sections, function (section) {
        i++;
        var j = 0;
        rt.sectionInsert(section.title);
        Array.prototype.forEach.call(section.lectures, function (lecture) {
            j++;
            rt.resourceInsert(i + "-" + j + " " + lecture.title, lecture.resources);
        });
    });

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
    document.querySelector("#download").onclick = function () {
        document.querySelector(".info").innerHTML = "Don't close the window";
        taskQueue = [];
        // create task queue
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

var rt = new ResourceTable();
var taskQueue = [];
var taskMap = new Map();

chrome.downloads.onChanged.addListener(function(downloadDelta) {
    console.log(downloadDelta);
    if (downloadDelta.error) {
        taskMap.delete(downloadDelta.id);
         download();
    }
    else if (downloadDelta.state && downloadDelta.state.current == "complete") {
        var task = taskMap.get(downloadDelta.id);
        task.state = "complete";
        task.dom.parentNode.innerHTML = "<img class='img-complete' src='images/complete.png' >";
        taskMap.delete(downloadDelta.id);
        download();
    };
});

chrome.runtime.onMessage.addListener(function(request, sender) {
    init(request);
});