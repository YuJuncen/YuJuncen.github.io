const lazyimg = () => {
    const images = document.getElementsByTagName("img")
    if (typeof window.IntersectionObserver != 'undefined') {
        byIntersectionObserver(images)
        return
    }
    byEager(images)
}

const byEager = (images : HTMLCollectionOf<HTMLImageElement>) => {
    for (let i = 0; i < images.length; i ++) {
        const image = images[i];
        image.loading = 'lazy';
        image.src = image.dataset['src'];
    }
}

const byIntersectionObserver = (images : HTMLCollectionOf<HTMLImageElement>) => {
    const io = new IntersectionObserver((entries, observer) => {
        for (const entity of entries) {
            if (entity.target instanceof HTMLImageElement && entity.isIntersecting) {
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