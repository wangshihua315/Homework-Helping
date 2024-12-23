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
        cb(null, 'uploads'); // 上传文件夹路径
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // 确保文件名唯一
    }
});
const upload = multer({ storage });

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
        if (err) return res.status(500).send('查询失败: ' + err.message);

        if (row) {
            res.json({
                chinese: JSON.parse(row.chinese || '{"tasks": [], "files": []}'),
                math: JSON.parse(row.math || '{"tasks": [], "files": []}'),
                english: JSON.parse(row.english || '{"tasks": [], "files": []}'),
                science: JSON.parse(row.science || '{"tasks": [], "files": []}'),
                social: JSON.parse(row.social || '{"tasks": [], "files": []}'),
                other: JSON.parse(row.other || '{"tasks": [], "files": []}')
            });
        } else {
            res.json({});
        }
    });
});



// 保存作业内容的路由
app.post('/homework', upload.any(), (req, res) => {
    try {
        const homeworkData = JSON.parse(req.body.homeworkData || '{}');
        const files = req.files;

        // 处理文件名和学科
        files.forEach(file => {
            const subject = file.fieldname.replace('-file', '');
            if (!homeworkData[subject].files) homeworkData[subject].files = [];
            homeworkData[subject].files.push(file.filename);
        });

        // 整合后的数据存储到数据库
        const sql = `INSERT INTO homework (chinese, math, english, science, social, other) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(sql, [
            JSON.stringify(homeworkData.chinese || { tasks: [], files: [] }),
            JSON.stringify(homeworkData.math || { tasks: [], files: [] }),
            JSON.stringify(homeworkData.english || { tasks: [], files: [] }),
            JSON.stringify(homeworkData.science || { tasks: [], files: [] }),
            JSON.stringify(homeworkData.social || { tasks: [], files: [] }),
            JSON.stringify(homeworkData.other || { tasks: [], files: [] })
        ], function(err) {
            if (err) return res.status(500).send('保存失败: ' + err.message);
            res.status(201).send('作业内容已保存');
        });
    } catch (error) {
        res.status(400).send('请求处理失败: ' + error.message);
    }
});

app.post('/delete-file', (req, res) => {
    const { subject, fileName } = req.body;

    if (!subject || !fileName) {
        return res.status(400).send('参数缺失');
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.unlink(filePath, err => {
        if (err) {
            console.error('删除文件失败:', err.message);
            return res.status(500).send('文件删除失败');
        }

        // 从数据库中删除文件记录
        db.get(`SELECT ${subject} FROM homework ORDER BY id DESC LIMIT 1`, (err, row) => {
            if (err || !row) {
                return res.status(500).send('无法更新数据库');
            }

            const data = JSON.parse(row[subject] || '{"tasks": [], "files": []}');
            data.files = data.files.filter(file => file !== fileName);

            db.run(
                `UPDATE homework SET ${subject} = ? WHERE id = (SELECT id FROM homework ORDER BY id DESC LIMIT 1)`,
                [JSON.stringify(data)],
                err => {
                    if (err) {
                        console.error('更新数据库失败:', err.message);
                        return res.status(500).send('数据库更新失败');
                    }
                    res.status(200).send('文件已删除');
                }
            );
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
