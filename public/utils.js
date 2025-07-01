export function formatDate(date) {
    return date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
}

export function showNotification(title, message, type = 'success') {
    const icon = document.querySelector('.notification-icon');
    const content = document.querySelector('.notification-content');
    
    content.innerHTML = `<h4>${title}</h4><p>${message}</p>`;
    
    icon.className = 'notification-icon ' + 
        (type === 'success' ? 'notification-success' : 'notification-error');
    icon.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check' : 'fa-exclamation'}"></i>`;
    
    document.getElementById('notification').classList.add('show');
    
    setTimeout(() => {
        document.getElementById('notification').classList.remove('show');
    }, 3000);
}