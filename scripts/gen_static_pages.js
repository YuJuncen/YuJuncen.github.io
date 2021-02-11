const pug = require('pug')
const marked = require('marked')
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const uglifycss = require('uglifycss');
const childp = require('child_process');

marked.use({
    highlight: function (code, language) {
        const hljs = require('highlight.js');
        const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
        return hljs.highlight(validLanguage, code).value;
    },
    renderer: {
        image(href, title, text) {
            return `<img data-src="${href}" alt="${text}" ${(title && `title="${title}"`) || ""} />`
        }
    }
})

const PATH_RELEASE = './docs'
const PATH_META_DATABASE = './articles/meta.json'
const PATH_ARTICLE_RELEASE = path.resolve(PATH_RELEASE, "articles")
const PATH_TEMPLATE = './template'
const PATH_SOURCES = './web-resources'
const PATH_RELEASE_SOURCES = path.resolve(PATH_RELEASE, 'web-resources')
const compilePug = (file) => pug.compile(
    fs.readFileSync(path.resolve(PATH_TEMPLATE, file)),
    {
        basedir: PATH_TEMPLATE,
        filename: path.resolve(PATH_TEMPLATE, file),
    })
const TEMPLATE_ARTICLE = compilePug('article.pug')
const TEMPLATE_INDEX = compilePug('index.pug')
const TEMPLATE_404 = compilePug('404.pug')
const renderTime = t => {
    if (t instanceof Date) {
        return t.toLocaleString()
    }
    return `${t}`
}

const genIndexPage = ({ articles, pageNum, maxPageNum }) => {
    return TEMPLATE_INDEX({
        articles,
        pageNum,
        maxPageNum
    })
}

const write404 = async () => {
    await fsp.writeFile(path.resolve(PATH_RELEASE, '404.html'), TEMPLATE_404({}))
}

const writeIndices = async (articles) => {
    const file = await fsp.open(path.resolve(PATH_RELEASE, "index.html"), 'w')
    await file.writeFile(genIndexPage({
        articles: articles.map(article => ({ ...article, lastUpdated: renderTime(article.lastUpdated), createdAt: renderTime(article.createdAt) })),
        pageNum: 1,
        maxPageNum: 1
    }))
    await file.close()
}

const genArticlePage = ({ name, lastUpdated, createdAt, markdownContent, tags }) => {
    return TEMPLATE_ARTICLE({
        name,
        tags,
        lastUpdated: renderTime(lastUpdated),
        createdAt: renderTime(createdAt),
        renderedContent: marked(markdownContent)
    })
}

const getMetaDatabase = async () => {
    const fd = await fsp.open(PATH_META_DATABASE)
    const tagMapping = JSON.parse(await fd.readFile())
    await fd.close()
    return tagMapping
}


const writeArticlePage = async (article) => {
    const targetFD = await fsp.open(path.resolve(PATH_ARTICLE_RELEASE, article.name + '.html'), 'w')
    await targetFD.writeFile(genArticlePage(article))
    await targetFD.close()
}

const comparing = (f) => (a, b) => f(a) < f(b)

const genArticleDB = async (articlesPath) => {
    const files = await fsp.readdir(articlesPath)
    const metaDB = await getMetaDatabase();
    const getArticleInfo = async (file, meta) => {
        const fd = await fsp.open(path.resolve(articlesPath, file))
        const stat = await fd.stat()
        const lastUpdated = stat.mtime
        const createdAt = stat.birthtime
        const content = (await fd.readFile()).toString()
        await fd.close()
        return {
            name: file.replace(/\.md$/, ""),
            tags: meta[file]?.tags || [],
            lastUpdated, createdAt,
            markdownContent: content,
            introText: meta[file]?.introText || ""
        }
    }
    const articlesDB = await Promise.all(
        files.filter(file => /\.md$/.test(file))
            .map(file => getArticleInfo(file, metaDB))
    );
    return articlesDB.sort(comparing(article => article.createdAt))
}

const genWithArticles = async (articlesPath) => {
    await fsp.mkdir(PATH_RELEASE, { recursive: true })
    const articleDB = await genArticleDB(articlesPath)
    await fsp.mkdir(PATH_ARTICLE_RELEASE, { recursive: true })
    const writingPages = Promise.all(
        articleDB
            .map(async article => {
                await writeArticlePage(article)
            }))
    const writingIndices = writeIndices(articleDB)
    await Promise.all([writingPages, writingIndices, write404(), genSources()])
}


const genSources = async () => {
    await fsp.mkdir(PATH_RELEASE_SOURCES, { recursive: true })
    const files = await fsp.readdir(PATH_SOURCES)
    const uglifyCSSFiles = Promise.all(
        files.filter(f => /\.css$/.test(f))
            .map(async (file) => {
                const css = (await fsp.readFile(path.resolve(PATH_SOURCES, file))).toString()
                const uglified = uglifycss.processString(css, { uglyComments: true });
                await fsp.writeFile(path.resolve(PATH_RELEASE_SOURCES, file), uglified)
    }))
    const genTSFiles = new Promise((ok, err) => childp.exec("npx tsc", (e, stdout, stderr) => {
        if (stdout) {
            console.log("TS compiler stdout", stdout)
        }
        if (stderr) {
            console.error("TS compiler stderr", stderr)
        }
        if (e != undefined && e != null) {
            err(e)
            return
        }
        ok()
    }))
    await Promise.all([uglifyCSSFiles, genTSFiles])
}

genWithArticles("articles").catch((/** @type {Error} */ err) => {
    console.error(err)
    if (err.stack) {
        console.error("stack info:")
        console.error(err.stack)
    }
    process.exit(1)
})
