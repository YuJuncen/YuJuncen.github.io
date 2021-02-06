const pug = require('pug')
const marked = require('marked')
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const { format } = require('timeago.js')

marked.use({ 
    highlight: function(code, language) {
        const hljs = require('highlight.js');
        const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
        return hljs.highlight(validLanguage, code).value;
    },
})

const PATH_RELEASE = './docs'
const PATH_META_DATABASE = './articles/meta.json'
const PATH_ARTICLE_RELEASE = path.resolve(PATH_RELEASE, "articles")
const PATH_TEMPLATE = './template'
const compilePug = (file) => pug.compile(
    fs.readFileSync(path.resolve(PATH_TEMPLATE, file)), 
    {
        basedir: PATH_TEMPLATE, 
        filename: path.resolve(PATH_TEMPLATE, file),
    })
const TEMPLATE_ARTICLE = compilePug('article.pug')
const TEMPLATE_INDEX = compilePug('index.pug')
const renderTime = t => {
    if (t instanceof Date) {
        return format(t, 'zh_CN')
    }
    return `${t}`
}

const genIndexPage = ({articles, pageNum, maxPageNum}) => {
    return TEMPLATE_INDEX({
        articles, 
        pageNum, 
        maxPageNum
    })
}

const writeIndices = async (articles) => {
    const file = await fsp.open(path.resolve(PATH_RELEASE, "index.html"), 'w')
    await file.writeFile(genIndexPage({
        articles: articles.map(article => ({ ...article, lastUpdated: renderTime(article.lastUpdated), createdAt: renderTime(article.createdAt) })),
        pageNum: 1, 
        maxPageNum: 1}))
    await file.close()
}

const genArticlePage = ({name, lastUpdated, createdAt, markdownContent, tags}) => {
    return TEMPLATE_ARTICLE({name, 
        tags,
        lastUpdated: renderTime(lastUpdated), 
        createdAt: renderTime(createdAt),
        renderedContent: marked(markdownContent)})
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
    const articleDB = await genArticleDB(articlesPath)
    const writingPages = Promise.all(
        articleDB
            .map(async article => {
                await writeArticlePage(article)
    }))
    const writingIndices = writeIndices(articleDB)
    await Promise.all([writingPages, writingIndices])
}

genWithArticles("articles")

