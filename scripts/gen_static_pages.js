import { compile } from 'pug'
import { use, marked } from 'marked'
import { writeFile, open, readdir, mkdir, stat as _stat, copyFile, access, readFile } from 'fs/promises'
import { resolve } from 'path'
import { processString } from 'uglifycss'
import { exec as _exec } from 'child_process'
import hljs from 'highlight.js'

use({
   
    renderer: {
        image({href, title, text}) {
            return `<div class="lazyimg-container container" data-src="${href}" data-alt="${text}" ${(title && `data-title="${title}"`) || ""}>
                <div class="lazyimg-loading-placeholder container justify-center align-center">
                    <div>“${text.replace('“','‘').replace('”','’') || "加载中的图片"}”</div>
                </div>
            </div>`
        },
        code({ text, lang }) {
            const validLanguage = hljs.getLanguage(lang) ? lang : 'plaintext';
            return `<pre><code data-lang="${lang}">${hljs.highlight(validLanguage, text).value}</code></pre>`;
        }
    }
})

const PATH_RELEASE = './docs'
const PATH_META_DATABASE = './articles/meta.json'
const PATH_ARTICLE_RELEASE = resolve(PATH_RELEASE, "articles")
const PATH_TEMPLATE = './template'
const PATH_SOURCES = './web-resources'
const PATH_BLOB = resolve(PATH_SOURCES, 'blob')
const PATH_FAVICON = resolve(PATH_SOURCES, 'favicons')
const PATH_RELEASE_SOURCES = resolve(PATH_RELEASE, 'web-resources')
const PATH_RELEASE_BLOB = resolve(PATH_RELEASE_SOURCES, 'blob')
const PATH_RELEASE_FAVICON = resolve(PATH_RELEASE_SOURCES, 'favicons')
const compilePug = async (file) => compile(
    await readFile(resolve(PATH_TEMPLATE, file)),
    {
        basedir: PATH_TEMPLATE,
        filename: resolve(PATH_TEMPLATE, file),
    })
const TEMPLATE_ARTICLE = await compilePug('article.pug')
const TEMPLATE_INDEX = await compilePug('index.pug')
const TEMPLATE_404 = await compilePug('404.pug')

const genIndexPage = ({ articles, pageNum, maxPageNum }) => {
    return TEMPLATE_INDEX({
        articles,
        pageNum,
        maxPageNum
    })
}

const write404 = async () => {
    await writeFile(resolve(PATH_RELEASE, '404.html'), TEMPLATE_404({}))
}

const writeIndices = async (articles) => {
    const file = await open(resolve(PATH_RELEASE, "index.html"), 'w')
    await file.writeFile(genIndexPage({
        articles: articles.map(article => ({ ...article })),
        pageNum: 1,
        maxPageNum: 1
    }))
    await file.close()
}

const genArticlePage = ({ name, lastUpdated, createdAt, markdownContent, tags }) => {
    return TEMPLATE_ARTICLE({
        name,
        tags,
        lastUpdated: lastUpdated,
        createdAt: createdAt,
        renderedContent: marked(markdownContent)
    })
}

const getMetaDatabase = async () => {
    const fd = await open(PATH_META_DATABASE)
    const tagMapping = JSON.parse(await fd.readFile())
    await fd.close()
    return tagMapping
}


const writeArticlePage = async (article) => {
    const targetFD = await open(resolve(PATH_ARTICLE_RELEASE, article.name + '.html'), 'w')
    await targetFD.writeFile(genArticlePage(article))
    await targetFD.close()
}

const comparing = (f) => (a, b) => f(a) < f(b)

const genArticleDB = async (articlesPath) => {
    const files = await readdir(articlesPath)
    const metaDB = await getMetaDatabase();
    const getArticleInfo = async (file, meta) => {
        const fd = await open(resolve(articlesPath, file))
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

const copyFiles = async (source, target) => {
    if (!await exists(target)) {
        await mkdir(target, {recursive: true})
    }
    return readdir(source)
        .then(arr => Promise.all(
            arr.map(async f => {
                const stat = await _stat(resolve(source, f));
                if (stat.isDirectory()) {
                    if (!await exists(resolve(target, f))) {
                        await mkdir(resolve(target, f), {'recursive': true})
                    }
                    await copyFiles(resolve(source, f), resolve(target, f))
                    return
                }
                await copyFile(resolve(source, f), resolve(target, f))
            })))
}

const genWithArticles = async (articlesPath) => {
    await mkdir(PATH_RELEASE, { recursive: true })
    const articleDB = await genArticleDB(articlesPath)
    await mkdir(PATH_ARTICLE_RELEASE, { recursive: true })
    const writingPages = Promise.all(
        articleDB
            .map(async article => {
                await writeArticlePage(article)
            }))
    const writingIndices = writeIndices(articleDB)
    await Promise.all([writingPages, writingIndices, write404(), genSources()])
}

/** @type {(cmd: string)=>Promise<[string,string]>} */
const exec = (cmd) => new Promise((ok, err) => _exec(cmd, (e, stdout, stderr) => {
    if (e != undefined && e != null) {
        err(e)
        return
    }
    ok([stdout, stderr])
}))

/** @type {(path: string)=>Promise<boolean>} */
const exists = async (path) => {
    try {
        await access(path)
        return true
    } catch {
        return false
    }
}

const genSources = async () => {
    await mkdir(PATH_RELEASE_SOURCES, { recursive: true })
    const files = await readdir(PATH_SOURCES)
    const uglifyCSSFiles = Promise.all(
        files.filter(f => /\.css$/.test(f))
            .map(async (file) => {
                const css = (await readFile(resolve(PATH_SOURCES, file))).toString()
                const uglified = processString(css, { uglyComments: true });
                await writeFile(resolve(PATH_RELEASE_SOURCES, file), uglified)
    }))
    const genTSFiles = exec("npx webpack build").then(([stdout, stderr]) => {
        if (stdout) { console.log(">>> webpack stdout\n", stdout, "<<< end webpack stdout") }
        if (stderr) { console.error(">>> webpack stderr\n", stderr, "<<< end webpack stderr") }
    })
    const copyBlob = copyFiles(PATH_BLOB, PATH_RELEASE_BLOB)
    const copyFavicon = copyFiles(PATH_FAVICON, PATH_RELEASE_FAVICON)
    await Promise.all([uglifyCSSFiles, genTSFiles, copyBlob, copyFavicon])
}

genWithArticles("articles").catch((/** @type {Error} */ err) => {
    console.error(err)
    if (err.stack) {
        console.error("stack info:")
        console.error(err.stack)
    }
    process.exit(1)
})
