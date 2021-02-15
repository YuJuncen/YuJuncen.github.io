class ClickImg {
    target : HTMLDivElement
    targetContainer : HTMLDivElement
    targetImg : HTMLImageElement

    transforms : {
        translate: [number, number],
        scale: number
    }

    syncTransform() {
        const [x, y] = this.transforms.translate
        const scale = this.transforms.scale
        this.targetImg.style.transform = `scale(${scale}) translate(${x}px, ${y}px)`
    }

    constructor() {
        this.transforms = {
            translate: [0, 0],
            scale: 1.0
        }
        this.target = document.createElement('div')
        this.target.classList.add("click-img", "container", "align-center", "justify-center")
        this.target.style.minHeight = '100vh'
        this.target.style.width = '100vw'
        this.target.style.backgroundColor = 'var(--selection-color)'
        this.target.style.display = 'none'
        this.target.style.position = 'fixed'
        this.target.style.top = '0'
        this.target.style.left = '0'
        this.target.addEventListener('click', event => {
            this.target.style.display = 'none'
        })
        document.querySelector('body').appendChild(this.target)

        this.targetContainer = document.createElement('div')
        this.target.appendChild(this.targetContainer)

        this.targetImg = document.createElement('img')
        this.targetImg.style.display = 'block'
        this.targetImg.style.maxHeight = '85vh'
        this.targetImg.style.maxWidth = '85vw'
        this.targetImg.style.cursor = 'zoom-in'
        this.targetImg.style.transition = 'transform .3s'
        this.targetImg.src = ""
        this.targetImg.classList.add('full')
        this.targetContainer.appendChild(this.targetImg)
    }

    draw(src: HTMLImageElement) {
        this.targetImg.src = src.src
        this.resetImage()
    }

    connectToTargetImage() {
        this.targetImg.addEventListener('click', event => {
            if (this.transforms.scale < 1.1) {
                this.transforms.scale = 3.0
                const offsetX = this.target.clientWidth / 2 - event.clientX
                const offsetY = this.target.clientHeight / 2 - event.clientY
                this.transforms.translate = [offsetX, offsetY]
                this.targetImg.style.cursor = 'zoom-out'
                this.syncTransform()
            } else {
                this.targetImg.style.cursor = 'zoom-in'
                this.resetImage()
            }
            event.stopPropagation()
        })
    }

    resetImage() {
        this.transforms = {
            'scale': 1.0,
            'translate': [0, 0]
        }
        this.syncTransform()
    }

    connect() {
        const images : HTMLImageElement[] = Array.from(document.querySelectorAll('img:not(.full)'))
        images.forEach((image) => {
            image.style.cursor = 'zoom-in'
            image.addEventListener('click', event => {
                if (event.target instanceof HTMLImageElement) {
                    this.draw(event.target)
                    this.target.style.display = 'flex'
                }
            })
        })
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const clickImage = new ClickImg()
    clickImage.connect()
    clickImage.connectToTargetImage()
})