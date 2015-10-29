var getType = function(string) {
    if (string.match(/download.mp4/i)) {
        return "video";
    }
    if (string.match(/subtitles.*format=srt/i)) {
        return "srt";
    }
    if (string.match(/subtitles.*format=txt/i)) {
        return "txt";
    }
    return "slide";
};

var getResources = function (lecture) {
    var resources = lecture.parentNode.querySelector(".course-lecture-item-resource");
    var list = {
        hack: lecture.getAttribute("data-modal-iframe").trim()
    };
    Array.prototype.forEach.call(resources.children, function(item) {
        list[getType(item.href)] = item.href.trim();
    });
    return list;
};

var getLecture = function(sections) {
    return Array.prototype.map.call(sections.nextSibling.querySelectorAll(".lecture-link"), function(lecture) {
        return {
            title     : lecture.textContent.trim(),
            resources : getResources(lecture)
            //video: lecture.getAttribute("data-modal-iframe").trim()
        };
    });
};

var sections = Array.prototype.map.call(document.querySelectorAll(".course-item-list-header"), function(section) {
    return {
        title    : section.querySelector("h3").textContent.trim(),
        lectures : getLecture(section)
    };
});

var course = document.querySelector(".course-topbanner-name").textContent.trim();

chrome.runtime.sendMessage({
    course   : course,
    sections : sections
});