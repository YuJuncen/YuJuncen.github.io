export const lazyimg = (selector: string, onImage?: (ele: HTMLImageElement)=>void) => {
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