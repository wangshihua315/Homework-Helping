const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 创建数据库
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

// 保存作业内容的路由
app.post('/homework', (req, res) => {
    const { chinese, math, english, science, social, other } = req.body;

    // 检查是否已存在相同的作业内容
    const checkSql = `SELECT COUNT(*) as count FROM homework WHERE chinese = ? AND math = ? AND english = ? AND science = ? AND social = ? AND other = ?`;
    db.get(checkSql, [chinese, math, english, science, social, other], (err, row) => {
        if (err) {
            return res.status(500).send('查询失败: ' + err.message);
        }
        if (row.count > 0) {
            return res.status(400).send('该作业内容已存在'); // 如果已存在，返回错误
        }

        // 如果不存在，插入新作业内容
        const sql = `INSERT INTO homework (chinese, math, english, science, social, other) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [chinese, math, english, science, social, other], function(err) {
            if (err) {
                return res.status(500).send('保存失败: ' + err.message);
            }
            res.status(201).send('作业内容已保存');
        });
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
