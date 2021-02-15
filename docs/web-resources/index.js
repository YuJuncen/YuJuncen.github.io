var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var ClickImg = /** @class */ (function () {
    function ClickImg() {
        var _this = this;
        this.transforms = {
            translate: [0, 0],
            scale: 1.0
        };
        this.target = document.createElement('div');
        this.target.classList.add("click-img", "container", "align-center", "justify-center");
        this.target.style.minHeight = '100vh';
        this.target.style.width = '100vw';
        this.target.style.backgroundColor = 'var(--selection-color)';
        this.target.style.display = 'none';
        this.target.style.position = 'fixed';
        this.target.style.top = '0';
        this.target.style.left = '0';
        this.target.addEventListener('click', function (event) {
            _this.target.style.display = 'none';
        });
        document.querySelector('body').appendChild(this.target);
        this.targetContainer = document.createElement('div');
        this.target.appendChild(this.targetContainer);
        this.targetImg = document.createElement('img');
        this.targetImg.style.display = 'block';
        this.targetImg.style.maxHeight = '85vh';
        this.targetImg.style.maxWidth = '85vw';
        this.targetImg.style.cursor = 'zoom-in';
        this.targetImg.style.transition = 'transform .3s';
        this.targetImg.src = "";
        this.targetImg.classList.add('full');
        this.targetContainer.appendChild(this.targetImg);
    }
    ClickImg.prototype.syncTransform = function () {
        var _a = this.transforms.translate, x = _a[0], y = _a[1];
        var scale = this.transforms.scale;
        this.targetImg.style.transform = "scale(" + scale + ") translate(" + x + "px, " + y + "px)";
    };
    ClickImg.prototype.draw = function (src) {
        this.targetImg.src = src.src;
        this.resetImage();
    };
    ClickImg.prototype.connectToTargetImage = function () {
        var _this = this;
        this.targetImg.addEventListener('click', function (event) {
            if (_this.transforms.scale < 1.1) {
                _this.transforms.scale = 3.0;
                var offsetX = _this.target.clientWidth / 2 - event.clientX;
                var offsetY = _this.target.clientHeight / 2 - event.clientY;
                _this.transforms.translate = [offsetX, offsetY];
                _this.targetImg.style.cursor = 'zoom-out';
                _this.syncTransform();
            }
            else {
                _this.targetImg.style.cursor = 'zoom-in';
                _this.resetImage();
            }
            event.stopPropagation();
        });
    };
    ClickImg.prototype.resetImage = function () {
        this.transforms = {
            'scale': 1.0,
            'translate': [0, 0]
        };
        this.syncTransform();
    };
    ClickImg.prototype.connectAll = function () {
        var _this = this;
        var images = Array.from(document.querySelectorAll('img:not(.full)'));
        images.forEach(function (image) {
            _this.connect(image);
        });
    };
    ClickImg.prototype.connect = function (image) {
        var _this = this;
        image.style.cursor = 'zoom-in';
        image.addEventListener('click', function (event) {
            if (event.target instanceof HTMLImageElement) {
                _this.draw(event.target);
                _this.target.style.display = 'flex';
            }
        });
    };
    return ClickImg;
}());
var lazyimg = function (selector, onImage) {
    onImage = onImage || (function (_anyhow) { });
    var selectedImages = Array.from(document.querySelectorAll(selector));
    typeof window.IntersectionObserver != 'undefined' ?
        byIntersectionObserver(selectedImages, onImage) :
        byEager(selectedImages, onImage);
};
var fetchImg = function (src) { return fetch(src)
    .then(function (result) { return result.blob(); })
    .then(function (blob) { return URL.createObjectURL(blob); }); };
var loadImg = function (src, data) {
    return new Promise(function (ok) {
        fetchImg(data.src).then(function (blobURL) {
            var img = document.createElement('img');
            img.src = blobURL;
            data.alt && (img.alt = data.alt);
            img.title && (img.title = data.title);
            data.lazy && (img.loading = 'lazy');
            src.prepend(img);
            ok(img);
        });
    });
};
var byEager = function (images, onImage) {
    for (var i = 0; i < images.length; i++) {
        var dataSet = images[i].dataset;
        loadImg(images[i], __assign(__assign({}, dataSet), { lazy: true })).then(function (img) { return onImage(img); });
    }
};
var byIntersectionObserver = function (images, onImage) {
    var io = new IntersectionObserver(function (entries, observer) {
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entity = entries_1[_i];
            if (entity.isIntersecting && entity.target instanceof HTMLElement) {
                // In current living std, 
                // HTMLElements do have dataset field.
                // (see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*)
                var dataSet = entity.target.dataset;
                loadImg(entity.target, dataSet).then(function (img) { return onImage(img); });
                observer.unobserve(entity.target);
            }
        }
    });
    for (var i = 0; i < images.length; i++) {
        var image = images[i];
        io.observe(image);
    }
};
// TODO: use webpack!!!
document.addEventListener('DOMContentLoaded', function () {
    var clickImg = new ClickImg();
    lazyimg('.lazyimg-container', function (img) {
        clickImg.connect(img);
    });
    clickImg.connectToTargetImage();
});
