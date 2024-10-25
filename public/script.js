// 显示今天的日期
const today = new Date();
const options = { year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('today-date').innerText = today.toLocaleDateString('zh-CN', options);

// 加载保存的作业内容
function loadHomework() {
    const subjects = ['chinese', 'math', 'english', 'science', 'social', 'other'];
    subjects.forEach(subject => {
        const savedHomework = JSON.parse(localStorage.getItem(`${subject}-homework`)) || [];
        
        // 还原主作业框内容
        const mainHomework = savedHomework[0] || '';
        document.getElementById(`${subject}-homework`).value = mainHomework;

        // 加载额外的作业框
        for (let i = 1; i < savedHomework.length; i++) {
            addHomeworkEntry(subject, savedHomework[i]);
        }
    });
}

// 保存作业内容到本地存储
document.getElementById('save-button').addEventListener('click', () => {
    const subjects = ['chinese', 'math', 'english', 'science', 'social', 'other'];
    let isValid = true;

    subjects.forEach(subject => {
        const mainHomeworkValue = document.getElementById(`${subject}-homework`).value.trim();
        
        if (!mainHomeworkValue) {
            alert(`${subject}的主作业不能为空！`);
            isValid = false;
            return;
        }
    });

    if (!isValid) return;

    subjects.forEach(subject => {
        const mainHomeworkValue = document.getElementById(`${subject}-homework`).value;
        const additionalHomeworks = [...document.querySelectorAll(`#${subject}-subject .homework-entry input`)]
            .map(input => input.value.trim())
            .filter(Boolean);
        
        const homeworkArray = [mainHomeworkValue, ...additionalHomeworks];
        localStorage.setItem(`${subject}-homework`, JSON.stringify(homeworkArray));
    });

    alert('作业已保存！');
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
    newInput.value = value; // 设置输入框值为传入的值

    const removeButton = document.createElement('button');
    removeButton.classList.add('remove-homework');
    removeButton.textContent = '✖';
    removeButton.addEventListener('click', () => {
        newHomeworkDiv.classList.add('fade-out'); // 添加消失效果
        setTimeout(() => {
            newHomeworkDiv.remove(); // 在动画结束后删除元素
        }, 300); // 等待300ms以匹配过渡时间
    });

    newHomeworkDiv.appendChild(newInput);
    newHomeworkDiv.appendChild(removeButton);
    document.getElementById(`${subject}-subject`).appendChild(newHomeworkDiv);

    // 触发添加动画效果
    requestAnimationFrame(() => {
        newHomeworkDiv.classList.add('show'); // 添加显示效果
    });
}

// 加载保存的作业内容
loadHomework();
