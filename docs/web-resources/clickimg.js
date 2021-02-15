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
    ClickImg.prototype.connect = function () {
        var _this = this;
        var images = Array.from(document.querySelectorAll('img:not(.full)'));
        images.forEach(function (image) {
            image.style.cursor = 'zoom-in';
            image.addEventListener('click', function (event) {
                if (event.target instanceof HTMLImageElement) {
                    _this.draw(event.target);
                    _this.target.style.display = 'flex';
                }
            });
        });
    };
    return ClickImg;
}());
document.addEventListener('DOMContentLoaded', function () {
    var clickImage = new ClickImg();
    clickImage.connect();
    clickImage.connectToTargetImage();
});
