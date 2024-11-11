const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 设置 Multer 用于文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // 保存上传文件的文件夹
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // 使用时间戳作为文件名
    }
});
const upload = multer({ storage: storage });

// 连接 SQLite 数据库
const db = new sqlite3.Database('./homework.db', (err) => {
    if (err) {
        console.error('数据库打开失败:', err.message);
    } else {
        console.log('成功连接到 SQLite 数据库');
        
        // 创建作业表
        db.run(`CREATE TABLE IF NOT EXISTS homework (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chinese TEXT,
            math TEXT,
            english TEXT,
            science TEXT,
            social TEXT,
            other TEXT
        )`);
    }
});

// 获取作业
app.get('/homework', (req, res) => {
    db.get(`SELECT * FROM homework ORDER BY id DESC LIMIT 1`, (err, row) => {
        if (err) {
            return res.status(500).send('查询失败: ' + err.message);
        }
        
        // 将数据库内容转换为 JSON 格式发送
        if (row) {
            res.json({
                chinese: JSON.parse(row.chinese || '[]'),
                math: JSON.parse(row.math || '[]'),
                english: JSON.parse(row.english || '[]'),
                science: JSON.parse(row.science || '[]'),
                social: JSON.parse(row.social || '[]'),
                other: JSON.parse(row.other || '[]')
            });
        } else {
            res.json({});
        }
    });
});

// 保存作业内容的路由
app.post('/homework', upload.fields([
    { name: 'chinese-file', maxCount: 1 },
    { name: 'math-file', maxCount: 1 },
    { name: 'english-file', maxCount: 1 },
    { name: 'science-file', maxCount: 1 },
    { name: 'social-file', maxCount: 1 },
    { name: 'other-file', maxCount: 1 }
]), (req, res) => {
    const { chinese, math, english, science, social, other } = req.body;

    const sql = `INSERT INTO homework (chinese, math, english, science, social, other) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [
        JSON.stringify(chinese),
        JSON.stringify(math),
        JSON.stringify(english),
        JSON.stringify(science),
        JSON.stringify(social),
        JSON.stringify(other)
    ], function(err) {
        if (err) {
            return res.status(500).send('保存失败: ' + err.message);
        }
        res.status(201).send('作业内容已保存');
    });
});

// 关闭数据库连接
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('关闭数据库失败:', err.message);
        }
        console.log('数据库已关闭');
        process.exit(0);
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器正在运行，访问地址：http://localhost:${PORT}`);
});
