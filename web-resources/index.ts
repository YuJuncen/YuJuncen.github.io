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

    connectAll() {
        const images : HTMLImageElement[] = Array.from(document.querySelectorAll('img:not(.full)'))
        images.forEach((image) => {
           this.connect(image)
        })
    }

    connect(image: HTMLImageElement) {
        image.style.cursor = 'zoom-in'
        image.addEventListener('click', event => {
            if (event.target instanceof HTMLImageElement) {
                this.draw(event.target)
                this.target.style.display = 'flex'
            }
        })
    }
}

const lazyimg = (selector: string, onImage?: (ele: HTMLImageElement)=>void) => {
    onImage = onImage || ((_anyhow) => {})
    const selectedImages = Array.from(document.querySelectorAll(selector)) as HTMLElement[]
    typeof window.IntersectionObserver != 'undefined' ?
        byIntersectionObserver(selectedImages, onImage) :
        byEager(selectedImages, onImage)
}

const fetchImg = (src: string) => fetch(src)
        .then(result => result.blob())
        .then(blob => URL.createObjectURL(blob))

const loadImg = (src: HTMLElement, data: {alt?: string, src: string, title?: string, lazy?: boolean}) : Promise<HTMLImageElement> => {
    return new Promise((ok) => {
        fetchImg(data.src).then(blobURL => {
                const img = document.createElement('img')
                img.src = blobURL
                data.alt && (img.alt = data.alt)
                img.title && (img.title = data.title)
                data.lazy && (img.loading = 'lazy')
                src.prepend(img)
                ok(img)
            }
        )
    })
}

const byEager = (images : HTMLElement[], onImage: (ele: HTMLImageElement)=>void) => {
    for (let i = 0; i < images.length; i ++) {
        const dataSet = (images[i] as any).dataset
        loadImg(images[i], {...dataSet, lazy: true}).then(img => onImage(img))
    }
}

const byIntersectionObserver = (images : HTMLElement[], onImage: (ele: HTMLImageElement)=>void) => {
    const io = new IntersectionObserver((entries, observer) => {
        for (const entity of entries) {
            if (entity.isIntersecting && entity.target instanceof HTMLElement) {
                // In current living std, 
                // HTMLElements do have dataset field.
                // (see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*)
                const dataSet = (entity.target as any).dataset
                loadImg(entity.target, dataSet).then(img => onImage(img))
                observer.unobserve(entity.target)
            }
        }
    })
    for (let i = 0; i < images.length; i ++) {
        const image = images[i];
        io.observe(image)
    }
}

// TODO: use webpack!!!
document.addEventListener('DOMContentLoaded', () => {
    const clickImg = new ClickImg()
    lazyimg('.lazyimg-container', img => {
        clickImg.connect(img)
    })
    clickImg.connectToTargetImage()
})
