const lazyimg = () => {
    const io = new IntersectionObserver((entries, observer) => {
        for (const entity of entries) {
            if (entity.isIntersecting) {
                entity.target.src = entity.target.dataset['src']
                observer.unobserve(entity.target)
            }
        }
    })
    const images = document.getElementsByTagName("img")
    for (const img of images) {
        io.observe(img)
    }
}

document.addEventListener('DOMContentLoaded', lazyimg)