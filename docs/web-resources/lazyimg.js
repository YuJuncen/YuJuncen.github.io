var lazyimg = function () {
    var selectedImages = document.getElementsByTagName('img');
    var images = Array.from(selectedImages).filter(function (x) { return x.dataset['src']; });
    if (typeof window.IntersectionObserver != 'undefined') {
        byIntersectionObserver(images);
        return;
    }
    byEager(images);
};
var byEager = function (images) {
    for (var i = 0; i < images.length; i++) {
        var image = images[i];
        image.loading = 'lazy';
        image.src = image.dataset['src'];
    }
};
var byIntersectionObserver = function (images) {
    var io = new IntersectionObserver(function (entries, observer) {
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entity = entries_1[_i];
            if (entity.isIntersecting && entity.target instanceof HTMLImageElement) {
                var img = entity.target;
                img.src = img.dataset['src'];
                observer.unobserve(img);
            }
        }
    });
    for (var i = 0; i < images.length; i++) {
        var image = images[i];
        io.observe(image);
    }
};
document.addEventListener('DOMContentLoaded', lazyimg);
