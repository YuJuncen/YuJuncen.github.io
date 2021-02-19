import { ClickImg } from "./clickimg"
import { lazyimg } from "./lazyimg"

// TODO: use webpack!!!
document.addEventListener('DOMContentLoaded', () => {
    const clickImg = new ClickImg()
    lazyimg('.lazyimg-container', img => {
        clickImg.connect(img)
    })
    clickImg.connectToTargetImage()
})
