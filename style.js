document.addEventListener('DOMContentLoaded', () => {
    // UI Selectors
    const loginForm = document.getElementById('login-form');
    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const borrowForm = document.getElementById('borrow-form');
    const borrowSection = document.getElementById('borrow-form-section');
    const roleBadge = document.getElementById('role-badge');
    
    // Data (Persistent)
    let activeLoans = JSON.parse(localStorage.getItem('eco_active')) || [];
    let totalHistory = JSON.parse(localStorage.getItem('eco_total')) || [];
    let returnedHistory = JSON.parse(localStorage.getItem('eco_returned')) || [];
    let currentRole = "user";

    // 1. LOGIN LOGIC
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;

        if ((u === "admin" || u === "viewer") && p === "1234") {
            currentRole = u;
            loginPage.classList.add('hidden');
            dashboardPage.classList.remove('hidden');
            applyPermissions();
            renderAll();
        } else {
            document.getElementById('error-msg').innerText = "Access Denied";
        }
    });

    function applyPermissions() {
        if (currentRole === "viewer") {
            borrowSection.style.display = 'none';
            document.body.classList.add('view-only');
            roleBadge.innerText = "VIEWER MODE";
        } else {
            borrowSection.style.display = 'block';
            document.body.classList.remove('view-only');
            roleBadge.innerText = "ADMIN MODE";
        }
    }

    // 2. BORROW LOGIC
    borrowForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const entry = {
            id: Date.now(),
            name: document.getElementById('borrower-name').value,
            equip: document.getElementById('equipment-select').value,
            area: document.getElementById('area-select').value,
            time: new Date().toLocaleString(),
            ts: new Date().getTime()
        };

        activeLoans.push(entry);
        totalHistory.push(entry);
        saveAndRefresh();
        borrowForm.reset();
    });

    // 3. RETURN LOGIC
    window.returnItem = function(id) {
        const idx = activeLoans.findIndex(x => x.id === id);
        if (idx > -1) {
            const item = activeLoans[idx];
            item.retTime = new Date().toLocaleString();
            returnedHistory.push(item);
            activeLoans.splice(idx, 1);
            saveAndRefresh();
        }
    };

    function saveAndRefresh() {
        localStorage.setItem('eco_active', JSON.stringify(activeLoans));
        localStorage.setItem('eco_total', JSON.stringify(totalHistory));
        localStorage.setItem('eco_returned', JSON.stringify(returnedHistory));
        renderAll();
    }

    // 4. RENDER & OVERDUE LOGIC
    function renderAll() {
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        let overdueCount = 0;

        // Active Table
        const activeTbl = document.querySelector('#borrow-table tbody');
        activeTbl.innerHTML = '';
        activeLoans.forEach(item => {
            const isLate = (now - item.ts) > oneDay;
            if (isLate) overdueCount++;
            activeTbl.innerHTML += `
                <tr class="${isLate ? 'late' : ''}">
                    <td>${item.name}</td><td>${item.equip}</td><td>${item.area}</td><td>${item.time}</td>
                    <td><span class="badge ${isLate ? 'overdue' : 'borrowed'}">${isLate ? 'Overdue' : 'Borrowed'}</span></td>
                    <td class="action-col"><button onclick="returnItem(${item.id})">Return</button></td>
                </tr>`;
        });

        // Other Tables
        document.querySelector('#total-table tbody').innerHTML = totalHistory.map(i => `<tr><td>${i.name}</td><td>${i.equip}</td><td>${i.area}</td><td>${i.time}</td></tr>`).join('');
        document.querySelector('#returned-table tbody').innerHTML = returnedHistory.map(i => `<tr><td>${i.name}</td><td>${i.equip}</td><td>${i.area}</td><td>${i.retTime}</td></tr>`).join('');
        document.querySelector('#overdue-table tbody').innerHTML = activeLoans.filter(i => (now - i.ts) > oneDay).map(i => `<tr><td>${i.name}</td><td>${i.equip}</td><td>${i.area}</td><td>${i.time}</td></tr>`).join('');

        // Stats
        document.getElementById('stat-total').innerText = totalHistory.length;
        document.getElementById('stat-active').innerText = activeLoans.length;
        document.getElementById('stat-returned').innerText = returnedHistory.length;
        document.getElementById('stat-overdue').innerText = overdueCount;
    }

    // 5. NAVIGATION
    const navMap = { 'nav-dash': 'view-dashboard', 'nav-total': 'view-total', 'nav-returned': 'view-returned', 'nav-overdue': 'view-overdue' };
    Object.keys(navMap).forEach(id => {
        document.getElementById(id).addEventListener('click', function() {
            Object.values(navMap).forEach(v => document.getElementById(v).classList.add('hidden'));
            document.querySelectorAll('nav li').forEach(li => li.classList.remove('active'));
            document.getElementById(navMap[id]).classList.remove('hidden');
            this.classList.add('active');
        });
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        dashboardPage.classList.add('hidden');
        loginPage.classList.remove('hidden');
    });
});