// 显示今天的日期
const today = new Date();
const options = { year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('today-date').innerText = today.toLocaleDateString('zh-CN', options);

// 加载保存的作业内容
// TODO(): Fix the display
async function loadHomework() {
    try {
        const response = await fetch('/homework');
        if (!response.ok) throw new Error('加载作业失败');

        const homeworkData = await response.json();
        const subjects = ['chinese', 'math', 'english', 'science', 'social', 'other'];

        subjects.forEach(subject => {
            const data = homeworkData[subject] || { tasks: [], files: [] };

            // 加载作业内容
            const homeworkInput = document.getElementById(`${subject}-homework`);
            if (homeworkInput) {
                const mainTask = data.tasks[0] || '';
                homeworkInput.value = mainTask;
            }

            for (let i = 1; i < data.tasks.length; i++) {
                addHomeworkEntry(subject, data.tasks[i]);
            }

            // 处理文件上传和显示
            const fileUploadInput = document.getElementById(`${subject}-file-upload`);
            const existingFileContainer = document.getElementById(`${subject}-existing-files`);

            if (fileUploadInput && existingFileContainer) {
                existingFileContainer.innerHTML = ''; // 清空现有文件显示容器

                if (data.files.length > 0) {
                    // 存在已上传文件，隐藏文件选择器，显示文件列表
                    fileUploadInput.style.display = 'none';

                    data.files.forEach(file => {
                        const fileLink = document.createElement('a');
                        fileLink.href = `/uploads/${file}`;
                        fileLink.textContent = file;
                        fileLink.download = file;

                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = '删除';
                        deleteButton.classList.add('delete-file');
                        deleteButton.dataset.fileName = file;

                        existingFileContainer.appendChild(fileLink);
                        existingFileContainer.appendChild(deleteButton);

                        // 删除按钮逻辑
                        deleteButton.addEventListener('click', async () => {
                            try {
                                const deleteResponse = await fetch(`/homework/${subject}/file`, {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ file }),
                                });

                                if (!deleteResponse.ok) throw new Error('删除文件失败');

                                // 重新加载作业数据
                                loadHomework();
                            } catch (error) {
                                alert(error.message);
                            }
                        });
                    });
                } else {
                    // 无文件，显示文件选择器
                    fileUploadInput.style.display = 'block';
                }
            } else {
                console.warn(`元素缺失：${subject}-file-upload 或 ${subject}-existing-files`);
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

    const formData = new FormData();

    subjects.forEach(subject => {
        // 获取主作业内容和其他作业框
        const mainHomeworkValue = document.getElementById(`${subject}-homework`).value.trim();
        const additionalHomeworks = [...document.querySelectorAll(`#${subject}-subject .homework-entry input[type="text"]`)]
            .map(input => input.value.trim())
            .filter(Boolean);

        // 整理作业任务
        homeworkData[subject] = {
            tasks: [mainHomeworkValue, ...additionalHomeworks]
        };

        // 获取文件
        const fileInput = document.getElementById(`${subject}-file`);
        if (fileInput && fileInput.files.length > 0) {
            // homeworkData[subject].files = [];
            for (const file of fileInput.files) {
                formData.append(`${subject}-file`, file);
                // homeworkData[subject].files.push(file.name); // 添加文件名
            }
        } else {
            homeworkData[subject].files = []; // 空文件数组
        }
    });

    // 将 homeworkData 添加到 FormData 中
    formData.append('homeworkData', JSON.stringify(homeworkData));

    try {
        const response = await fetch('/homework', {
            method: 'POST',
            body: formData
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
