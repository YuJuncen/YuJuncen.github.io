const lazyimg = () => {
    const selectedImages = document.getElementsByTagName('img')
    const images = Array.from(selectedImages).filter(x => x.dataset['src']) as HTMLImageElement[]
    if (typeof window.IntersectionObserver != 'undefined') {
        byIntersectionObserver(images)
        return
    }
    byEager(images)
}

const byEager = (images : HTMLImageElement[]) => {
    for (let i = 0; i < images.length; i ++) {
        const image = images[i];
        image.loading = 'lazy';
        image.src = image.dataset['src'];
    }
}

const byIntersectionObserver = (images : HTMLImageElement[]) => {
    const io = new IntersectionObserver((entries, observer) => {
        for (const entity of entries) {
            if (entity.isIntersecting && entity.target instanceof HTMLImageElement) {
                const img = entity.target
                img.src = img.dataset['src']
                observer.unobserve(img)
            }
        }
    })
    for (let i = 0; i < images.length; i ++) {
        const image = images[i];
        io.observe(image)
    }
}

document.addEventListener('DOMContentLoaded', lazyimg)