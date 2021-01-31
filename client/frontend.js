function openPage(curPage, page) {
    curPage.style.display = 'none';
    page.style.display = 'flex';
}

const mainPage = document.getElementById('main-page');
const pilotAuthPage = document.getElementById('pilot-auth-page');
const pilotPage = document.getElementById('pilot-page');
const pilotRequestPage = document.getElementById('pilot-request-page');
const pilotCurPage = document.getElementById('pilot-cur-page');
const adminPage = document.getElementById('admin-page');
const pilotInfoPage = document.getElementById('pilot-info-page');
const addPlanPage = document.getElementById('add-plan-page');
const nonCompleteReisPage = document.getElementById('non-complete-reis-page');

const toAdminPage = document.getElementsByClassName('.');

function checkId(id) {
    return /^\d{6}$/.test(id);
}

function checkFIO(fio) {
    return fio.match(/^([А-Я][а-я]*) ([А-Я][а-я]*) ([А-Я][а-я]*)$/);
}

function checkDateP(date) {
    return date.match(/^(0[1-9]|[12][0-9]|3[01])[.](0[1-9]|1[012])[.](19|20)\d\d$/);
}

function checkDatePl(date) {
    return date.match(/^(0[1-9]|[12][0-9]|3[01])[.](0[1-9]|1[012])[.](2021)$/);
}

function checkNumber(number) {
    return /^\d{4}$/.test(number);
}

function checkAirport(airport) {
    return airport.match(/^([A-Z]{3})$/);
}

function checkTime(time) {
    return time.match(/^([0-1]\d|2[0-3])(:[0-5]\d)$/);
}

let currentUser = 1;

function auth() {
    if (!checkId(document.getElementById('id').value)) {
        window.alert('Неверно введен ID!');
    } else if (!checkFIO(document.getElementById('name').value)) {
        window.alert('Неверно введено ФИО!');
    } else if (!checkDateP(document.getElementById('date').value)) {
        window.alert('Неверно введена дата!');
    } else if (document.getElementById('date').value.slice(6) > 1998 || document.getElementById('date').value.slice(6) < 1956) {
        window.alert('Возраст пилота не соответствует требованному!');
    } else {
        let idP = document.getElementById('id').value;
        currentUser = Number(idP);
        let nameP = document.getElementById('name').value;
        let dateP = document.getElementById('date').value;
        let newPilot = {id: idP, name: nameP, date: dateP};
        createPilot(newPilot);
        openPage(pilotAuthPage, pilotPage);
        deleteActualPlans();
        deletePilots();
        writeActual({id: currentUser});
        writeActualPlans({id: currentUser});
        setTimeout(writePilots, 2000);
    }
}

function createPlanBtn() {
    if (!checkNumber(document.getElementById('number').value)) {
        window.alert('Неверно введен номер рейса!')
    } else if (!checkAirport(document.getElementById('destination').value)) {
        window.alert('Неверно введен пункт отправления!')
    } else if (!checkAirport(document.getElementById('arrival').value)) {
        window.alert('Неверно введен пункт назначения!')
    } else if (!checkDatePl(document.getElementById('date-reis').value)) {
        window.alert('Неверно введена дата вылета!')
    } else if (!checkTime(document.getElementById('time-dest').value)) {
        window.alert('Неверно введено время вылета!')
    } else if (!checkTime(document.getElementById('time-arr').value)) {
        window.alert('Неверно введено время прибытия!')
    } else {
        let number = document.getElementById('number').value;
        let dest = document.getElementById('destination').value;
        let arr = document.getElementById('arrival').value;
        let date = document.getElementById('date-reis').value;
        let timeD = document.getElementById('time-dest').value;
        let timeA = document.getElementById('time-arr').value;
        let newPlan = {number: number, destination: dest, arrival: arr, date: date, dest: timeD, arr: timeA};
        writeActualPlans({id:currentUser});
        createPlan(newPlan);
    }
}

writePilots();
writePlans();
writeActualPlans({id:currentUser});

const infoPilots = document.getElementById('admin-content-pilot');
const infoPlans = document.getElementById('admin-content-plans');
const infoActualAdmin = document.getElementById('admin-content-reis');
const infoActual = document.getElementById('content-plans');
const pilotsFlights = document.getElementById('content-reis');

function pilotItem(obj) {
    let element = document.createElement('div');
    while (obj.id.toString().length < 6) {
        obj.id = '0' + obj.id;
    }
    element.innerHTML = '<div class="pilot-item">' + obj.id + ' | ' + obj.name + ' | ' + obj.date + '</div>';
    return element;
}

function planItem(obj) {
    let element = document.createElement('div');
    while (obj.number.toString().length < 4) {
        obj.number = '0' + obj.number;
    }
    element.innerHTML = '<div class="pilot-item">' + obj.number + ' | ' + obj.destination + ' | ' + obj.arrival + ' | ' + obj.date + ' | ' + obj.dest + ' | ' + obj.arr + '</div>';
    return element;
}

function deletePilots() {
    infoPilots.innerHTML = '';
}

function deleteActualPlans() {
    infoActual.innerHTML = '';
}

function deletePilotsFlights(){
    pilotsFlights.innerHTML = '';
}

function deleteInfoActualAdmin(){
    infoActualAdmin.innerHTML = '';
}

function planItemDinamic(obj) {
    let element = document.createElement('div');
    while (obj.number.toString().length < 4) {
        obj.number = '0' + obj.number;
    }
    element.innerHTML = '<div class="pilot-item"><input class="in" type="checkbox" id="' + obj.number + '">' + obj.number + ' | ' + obj.destination + ' | ' + obj.arrival + ' | ' + obj.date + ' | ' + obj.dest + ' | ' + obj.arr + '</div>';
    return element;
}

async function writePilots() {
    const data = await request('/api/pilots');
    if (data) {
        for (let i = 0; i < data.length; i++) {
            infoPilots.appendChild(pilotItem(data[i]));
        }
    }
}

async function createPilot(obj) {
    const response = await request('/api/pilots', 'POST', obj);
    if (response) {
        console.log('Все хорошо)');
    }
}

async function writePlans() {
    const data = await request('/api/plans');
    if (data) {
        for (let i = 0; i < data.length; i++) {
            infoPlans.appendChild(planItem(data[i]));
        }
    }
}

async function writeActual(id){
    deletePilotsFlights();
    const data = await request('/api/writeActual', 'POST', id);
    if(data != null){
        for (let i = 0; i < data.length; i++) {
            pilotsFlights.appendChild(planItemDelete(data[i]));
        }
    }
}

async function createPlan(obj) {
    const response = await request('/api/plans', 'POST', obj);
    if (response !== null) {
        infoPlans.appendChild(planItem(obj));
    }
}

async function writeActualPlans(id) {
    deleteActualPlans();
    deleteInfoActualAdmin();
    const response = await request('/api/actual', 'POST', id);
    if (response !== null) {
        for (let i = 0; i < response.length; i++) {
            infoActual.appendChild(planItemDinamic(response[i]));
            infoActualAdmin.appendChild(planItem(response[i]));
        }
    }
}

async function getSize(id, res){
    const response = await request('/api/size', 'POST', id);
    res(response);
}

function getCheckboxes() {
    let checkboxes = document.getElementsByClassName('in');
    let activeCheckboxes = {};
    activeCheckboxes[0] = {id:currentUser};
    getSize({id:currentUser}, (size) => {
        console.log(size);
        let j = 1;
        for (let i = 0; i < checkboxes.length && j < 4 - size; i++) {
            if (checkboxes[i].checked === true) {
                activeCheckboxes[j] = {id: Number(checkboxes[i].id)};
                j++;
            }
        }
        if (j !== 1) {
            makeRequest(activeCheckboxes, () => {
                writeActualPlans({id:currentUser});
            });
        }
    });
}

function planItemDelete(obj){
    let element = document.createElement('div');
    let number = obj.number;
    while (obj.number.toString().length < 4) {
        obj.number = '0' + obj.number;
    }
    element.innerHTML = '<div class="pilot-item"><div class="del" onclick=deleteRequest('+currentUser+','+number+')>X</div>' + obj.number + ' | ' + obj.destination + ' | ' + obj.arrival + ' | ' + obj.date + ' | ' + obj.dest + ' | ' + obj.arr + '</div>';
    return element;
}

async function deleteRequest(id, number){
    let obj = {id:id, number:number};
    await request('/api/delete', 'POST', obj);
    writeActual({id:currentUser});
    writeActualPlans({id:currentUser});
}

async function makeRequest(obj, res) {
    const response = await request('/api/request', 'POST', obj);
    console.log(response);
    if (response != null) {
        for (let i = 0; i < response.length; i++) {
            pilotsFlights.appendChild(planItemDelete(response[i]));
        }
    }
    res();
}

async function request(url, method = 'GET', data = null) {
    try {
        const headers = {};
        let body;
        if (data) {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(data);
        }
        const response = await fetch(url, {
            method,
            headers,
            body
        });
        return await response.json();
    } catch (e) {
        console.warn('Error: ', e.message);
    }
}