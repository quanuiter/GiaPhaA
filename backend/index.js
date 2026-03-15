require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const morgan  = require('morgan')
const path    = require('path')

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use(morgan('dev'))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/', (req, res) => res.json({ message: '✅ Gia Phả API đang chạy', version: '1.0' }))

app.use('/api/auth',   require('./src/routes/auth'))
app.use('/api/trees',  require('./src/routes/trees'))

app.use('/api/trees/:treeId/members',    require('./src/routes/members'))
app.use('/api/trees/:treeId/marriages',  require('./src/routes/marriages'))
app.use('/api/trees/:treeId/events',     require('./src/routes/events'))
app.use('/api/trees/:treeId/tree',       require('./src/routes/treeView'))
app.use('/api/trees/:treeId/reports',    require('./src/routes/reports'))
// Achievements lồng trong members
app.use('/api/trees/:treeId/members/:memberId/achievements', require('./src/routes/achievements'))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`✅ Server chạy tại http://localhost:${PORT}`))