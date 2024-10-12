const http = require('http')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

const audioDir = path.join(__dirname, 'audio')


function shuffleArray(array) {
    let shuffled = array.slice()
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

const PORT = 3001

const server = http.createServer((req, res) => {
    cors()(req, res, () => {
        if (req.method === 'GET' && req.url.startsWith('/audio/')) {
            const filePath = path.join(audioDir, req.url.replace('/audio/', ''))
            fs.stat(filePath, (err, stats) => {
                if (err || !stats.isFile()) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' })
                    res.end('Audio file not found')
                    return
                }

                const range = req.headers.range
                if (!range) {
                    res.writeHead(200, {
                        'Content-Type': 'audio/mpeg',
                        'Content-Length': stats.size,
                    })
                    const stream = fs.createReadStream(filePath)
                    stream.pipe(res)
                } else {
                    const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
                    const start = parseInt(startStr, 10)
                    const end = endStr ? parseInt(endStr, 10) : stats.size - 1
                    const chunkSize = end - start + 1

                    res.writeHead(206, {
                        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunkSize,
                        'Content-Type': 'audio/mpeg',
                    })

                    const stream = fs.createReadStream(filePath, { start, end })
                    stream.pipe(res)
                }
            })
        }

        else if (req.method === 'GET' && req.url === '/tracks') {
            fs.readdir(audioDir, (err, files) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' })
                    res.end('Error reading audio directory')
                    return
                }

                const tracks = files
                    .filter(file => file.endsWith('.mp3'))
                    .map(file => ({
                        name: file.replace('.mp3', ''),
                        url: `/audio/${file}`,
                        cover: 'https://example.com/default-cover.jpg'
                    }))

                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(tracks))
            })
        }
        else if (req.method === 'GET' && req.url === '/shuffle') {
            fs.readdir(audioDir, (err, files) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' })
                    res.end('Error reading audio directory')
                    return
                }

                const tracks = files
                    .filter(file => file.endsWith('.mp3'))
                    .map(file => ({
                        name: file.replace('.mp3', ''),
                        url: `/audio/${file}`,
                        cover: 'https://example.com/default-cover.jpg'
                    }))

                const shuffledTracks = shuffleArray(tracks)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(shuffledTracks))
            })
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' })
            res.end('Not found')
        }
    })
})

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
