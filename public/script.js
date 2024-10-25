// 显示今天的日期
const today = new Date();
const options = { year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('today-date').innerText = today.toLocaleDateString('zh-CN', options);

// 加载保存的作业内容
async function loadHomework() {
    try {
        const response = await fetch('/homework');
        if (!response.ok) throw new Error('加载作业失败');

        const homeworkData = await response.json();
        const subjects = ['chinese', 'math', 'english', 'science', 'social', 'other'];

        subjects.forEach(subject => {
            const homeworkEntries = homeworkData[subject] || [];
            
            // 将第一个作业内容放入主作业框
            document.getElementById(`${subject}-homework`).value = homeworkEntries[0] || '';

            // 加载其余的作业框
            for (let i = 1; i < homeworkEntries.length; i++) {
                addHomeworkEntry(subject, homeworkEntries[i]);
            }
        });
    } catch (error) {
        alert(error.message);
    }
}

// 保存作业内容到数据库
document.getElementById('save-button').addEventListener('click', async () => {
    const subjects = ['chinese', 'math', 'english', 'science', 'social', 'other'];
    const homeworkData = {};

    subjects.forEach(subject => {
        const mainHomeworkValue = document.getElementById(`${subject}-homework`).value.trim();
        const additionalHomeworks = [...document.querySelectorAll(`#${subject}-subject .homework-entry input`)]
            .map(input => input.value.trim())
            .filter(Boolean);
        homeworkData[subject] = [mainHomeworkValue, ...additionalHomeworks];
    });

    try {
        const response = await fetch('/homework', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(homeworkData)
        });
        if (!response.ok) throw new Error(await response.text());

        alert('作业已保存！');
    } catch (error) {
        alert('保存失败：' + error.message);
    }
});

// 添加作业框
document.querySelectorAll('.add-homework').forEach(button => {
    button.addEventListener('click', function () {
        const subject = this.getAttribute('data-subject');
        addHomeworkEntry(subject);
    });
});

// 辅助函数：添加新的作业框
function addHomeworkEntry(subject, value = '') {
    const newHomeworkDiv = document.createElement('div');
    newHomeworkDiv.classList.add('homework-entry');

    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.placeholder = '无';
    newInput.value = value;

    const removeButton = document.createElement('button');
    removeButton.classList.add('remove-homework');
    removeButton.textContent = '✖';
    removeButton.addEventListener('click', () => {
        newHomeworkDiv.classList.add('fade-out');
        setTimeout(() => {
            newHomeworkDiv.remove();
        }, 300);
    });

    newHomeworkDiv.appendChild(newInput);
    newHomeworkDiv.appendChild(removeButton);
    document.getElementById(`${subject}-subject`).appendChild(newHomeworkDiv);

    requestAnimationFrame(() => {
        newHomeworkDiv.classList.add('show');
    });
}

// 加载保存的作业内容
loadHomework();
