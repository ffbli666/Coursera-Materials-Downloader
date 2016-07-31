var getCourseName = function() {
    return document.querySelector('title').textContent.split('|')[0].trim();
}
var getExt = function(str) {
    var extension = '';
    var matches = str.match(/[^\\]*\.(\w+)$/);
    if (matches) {
        extension = '.' + matches[1];
    }
    return extension;
};

var getResources = function() {
    var resources = document.querySelectorAll('.resources-list .resource-list-item a');
    var courseName = getCourseName();
    var lessonName = document.querySelector('.lesson-name').textContent.trim();
    var itemName = document.querySelector('.rc-ItemRowSummary.current-item .item-name div').textContent.trim();
    

    return Array.prototype.map.call(resources, function(resource) {
        var ext = getExt(resource.pathname);
        return {
            filename : courseName + '_' +lessonName + '_' + itemName + ext,
            url      : resource.href
        };
    });
};

chrome.runtime.sendMessage({
    courseName : getCourseName(),
    resources  : getResources()
});