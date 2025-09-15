class User {
    constructor(id, name, balance) {
        this.id = id;
        this.name = name;
        this.balance = balance;
    }
}

class PaidState {
    constructor(order) {
        this.order = order;
    }

    pay() {
        throw new Error("Заказ уже оплачен");
    }

    ship() {
        this.order.history.push({
            action: "ship",
            state: "Shipped",
            timestamp: new Date().toLocaleString()
        });

        this.order.setState(new ShippedState(this.order));
    }

    deliver() {
        throw new Error("Ошибка: нельзя доставить неотправленный заказ");
    }

    cancel() {
        const user = users.find(u => u.id === this.order.userId);
        if (user) {
            user.balance += this.order.amount;
        }

        this.order.history.push({
            action: "cancel",
            state: "Cancelled",
            timestamp: new Date().toLocaleString()
        });

        this.order.setState(new CancelledState(this.order));
    }
}

class ShippedState {
    constructor(order) {
        this.order = order;
    }

    pay() {
        console.log("Ошибка: заказ уже оплачен");
    }

    ship() {
        console.log("Заказ уже в доставке");
    }

    deliver() {
        console.log("Заказ доставлен клиенту");

        this.order.history.push({
            action: "deliver",
            state: "Delivered",
            timestamp: new Date().toLocaleString()
        });

        this.order.setState(new DeliveredState(this.order));
    }

    cancel() {
        console.log("Ошибка: нельзя отменить заказ в доставке");
    }
}

class CreatedState {
    constructor(order) {
        this.order = order;
    }

    pay() {
        const user = users.find(u => u.id === this.order.userId);

        if (!user) {
            throw new Error("Ошибка: пользователь не найден");
        }

        if (user.balance >= this.order.amount) {
            user.balance -= this.order.amount;

            this.order.history.push({
                action: "pay",
                state: "Paid",
                timestamp: new Date().toLocaleString()
            });

            this.order.setState(new PaidState(this.order));
        } else {
            throw new Error(`Ошибка: недостаточно средств. Нужно: ${this.order.amount}, есть: ${user.balance}`);
        }
    }

    ship() {
        throw new Error("Ошибка: нельзя отправить неоплаченный заказ");
    }

    deliver() {
        throw new Error("Ошибка: нельзя доставить неоплаченный заказ");
    }

    cancel() {
        this.order.history.push({
            action: "cancel",
            state: "Cancelled",
            timestamp: new Date().toLocaleString()
        });

        this.order.setState(new CancelledState(this.order));
    }
}
class CancelledState {
    constructor(order) {
        this.order = order;
    }

    pay() {
        console.log("Ошибка: нельзя оплатить отмененный заказ");
    }

    ship() {
        console.log("Ошибка: нельзя отправить отмененный заказ");
    }

    deliver() {
        console.log("Ошибка: нельзя доставить отмененный заказ");
    }

    cancel() {
        console.log("Заказ уже отменен");
    }
}

class DeliveredState {
    constructor(order) {
        this.order = order;
    }

    pay() {
        console.log("Ошибка: заказ уже доставлен и оплачен");
    }

    ship() {
        console.log("Ошибка: заказ уже доставлен");
    }

    deliver() {
        console.log("Заказ уже доставлен");
    }

    cancel() {
        console.log("Ошибка: нельзя отменить доставленный заказ");
    }
}

class Order {
    constructor(userId) {
        this.id = Date.now();
        this.userId = userId;
        this.amount = 100; // фиксированная сумма заказа
        this.history = [];
        this.setState(new CreatedState(this));
    }

    setState(state) {
        this.state = state;
    }

    pay() {
        this.state.pay();
    }

    ship() {
        this.state.ship();
    }

    deliver() {
        this.state.deliver();
    }

    cancel() {
        this.state.cancel();
    }
}

const orders = [];
const users = [
    new User(1, "Артём", 1000),
    new User(2, "Денис", 200)
];

function refreshUsers() {
    const usersDiv = document.getElementById('users');
    const select = document.getElementById('userSelect');

    usersDiv.innerHTML = users.map(user =>
        `<div>${user.id}. ${user.name} - Баланс: ${user.balance}</div>`
    ).join('');

    select.innerHTML = users.map(user =>
        `<option value="${user.id}">${user.name} (${user.balance})</option>`
    ).join('');
}

function refreshOrders() {
    const select = document.getElementById('orderSelect');
    select.innerHTML = '<option value="">Выберите заказ</option>' +
        orders.map(order => {
            const user = users.find(u => u.id === order.userId);
            return `<option value="${order.id}">Заказ #${order.id} - ${user.name} (${order.state.constructor.name.replace('State', '')})</option>`;
        }).join('');
}

function createOrder() {
    const userId = parseInt(document.getElementById('userSelect').value);
    if (!userId) return alert('Выберите пользователя');

    const order = new Order(userId);
    orders.push(order);

    refreshOrders();
    showMessage(`Создан заказ #${order.id}`);
}

let currentOrder = null;
function selectOrder() {
    const orderId = parseInt(document.getElementById('orderSelect').value);
    if (!orderId) {
        currentOrder = null;
        document.getElementById('orderInfo').innerHTML = '';
        document.getElementById('actions').innerHTML = '';
        document.getElementById('history').innerHTML = '';
        return;
    }

    currentOrder = orders.find(o => o.id === orderId);
    if (currentOrder) {
        const user = users.find(u => u.id === currentOrder.userId);
        document.getElementById('orderInfo').innerHTML = `
            <strong>Заказ #${currentOrder.id}</strong><br>
            Пользователь: ${user.name}<br>
            Состояние: ${currentOrder.state.constructor.name.replace('State', '')}<br>
            Сумма: ${currentOrder.amount}
        `;

        updateActions();
        showHistory();
    }
}

function updateActions() {
    const actionsDiv = document.getElementById('actions');
    actionsDiv.innerHTML = `
        <button onclick="executeAction('pay')">Оплатить</button>
        <button onclick="executeAction('ship')">Отправить</button>
        <button onclick="executeAction('deliver')">Доставить</button>
        <button onclick="executeAction('cancel')">Отменить</button>
        <button onclick="showHistory()">Обновить историю</button>
    `;
}

function executeAction(action) {
    if (!currentOrder) return alert('Выберите заказ');

    try {
        switch(action) {
            case 'pay': currentOrder.pay(); break;
            case 'ship': currentOrder.ship(); break;
            case 'deliver': currentOrder.deliver(); break;
            case 'cancel': currentOrder.cancel(); break;
        }

        refreshOrders();
        selectOrder();
        refreshUsers();

    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function showHistory() {
    if (!currentOrder) return;

    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = currentOrder.history.length ?
        currentOrder.history.map(record =>
            `<div class="history">${record.timestamp} - ${record.action} → ${record.state}</div>`
        ).join('') :
        'История пуста';
}

function showMessage(text, type = 'success') {
    const message = document.createElement('div');
    message.className = type;
    message.textContent = text;
    document.body.appendChild(message);

    setTimeout(() => message.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    refreshUsers();
    refreshOrders();
});