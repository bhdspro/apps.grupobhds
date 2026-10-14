const API_URL = "https://app.grupobhds.com/super-gym";
let exercises = JSON.parse(localStorage.getItem('super_gym_exercises')) || [];
let timerInterval;

function renderExercises() {
    const list = document.getElementById('exercise-list');
    list.innerHTML = '';
    exercises.forEach((ex, index) => {
        const item = document.createElement('div');
        item.className = 'ex-item';
        item.innerHTML = `
            <div class="ex-header">
                <span>${ex.name} <small>(${ex.machine})</small></span>
            </div>
            <div class="ex-details">
                <input type="number" value="${ex.reps}" onchange="updateEx(${index}, 'reps', this.value)"> reps
                <input type="number" value="${ex.kg}" onchange="updateEx(${index}, 'kg', this.value)"> kg
            </div>
            <div class="ex-actions">
                <button class="icon-btn" onclick="startTimer()"><span class="material-symbols-rounded">timer</span></button>
                <button class="icon-btn" onclick="showInstructions('${ex.name}', '${ex.machine}')"><span class="material-symbols-rounded">visibility</span></button>
                <button class="icon-btn" onclick="deleteEx(${index})"><span class="material-symbols-rounded">delete</span></button>
            </div>
        `;
        list.appendChild(item);
    });
    localStorage.setItem('super_gym_exercises', JSON.stringify(exercises));
}

document.getElementById('btn-add').addEventListener('click', () => {
    const name = document.getElementById('ex-name').value;
    const machine = document.getElementById('ex-machine').value;
    const reps = document.getElementById('ex-reps').value;
    const kg = document.getElementById('ex-kg').value;
    if(name && reps && kg) {
        exercises.push({ id: Date.now(), name, machine, reps, kg });
        renderExercises();
        document.getElementById('ex-name').value = '';
        document.getElementById('ex-machine').value = '';
    }
});

function updateEx(index, field, value) {
    exercises[index][field] = value;
    localStorage.setItem('super_gym_exercises', JSON.stringify(exercises));
}

function deleteEx(index) {
    exercises.splice(index, 1);
    renderExercises();
}

function startTimer(seconds = 60) {
    clearInterval(timerInterval);
    const timerEl = document.getElementById('rest-timer');
    const display = document.getElementById('time-display');
    timerEl.classList.remove('hidden');
    let timeLeft = seconds;
    timerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        let s = (timeLeft % 60).toString().padStart(2, '0');
        display.innerText = `${m}:${s}`;
        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 500]);
            }
            timerEl.classList.add('hidden');
        }
    }, 1000);
}

document.getElementById('btn-stop-timer').addEventListener('click', () => {
    clearInterval(timerInterval);
    document.getElementById('rest-timer').classList.add('hidden');
});

async function showInstructions(name, machine) {
    const modal = document.getElementById('modal-instructions');
    const body = document.getElementById('modal-body');
    document.getElementById('modal-title').innerText = name;
    body.innerHTML = '<span class="material-symbols-rounded">sync</span>';
    modal.classList.remove('hidden');
    try {
        const response = await fetch(`${API_URL}/api/instrucoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, machine })
        });
        const data = await response.json();
        body.innerHTML = data.instruction; 
    } catch (e) {
        body.innerHTML = 'Erro de comunicação.';
    }
}

document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('modal-instructions').classList.add('hidden');
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

renderExercises();