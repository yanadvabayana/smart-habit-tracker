import * as DataLoader from './dataLoader.js';
import * as Utils from './utils.js';
import { state } from './state.js';
import { API_URL } from './config.js';

export async function updateProfileName(newName) {
    if (!state.currentUser || !newName.trim()) return false;

    try {
        const response = await fetch(`${API_URL}/users/${state.currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        state.currentUser.name = data.user.name;
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        Utils.showNotification('Успешно', 'Имя успешно изменено');
        return true;
        
    } catch (error) {
        console.error('Ошибка при обновлении имени:', error);
        Utils.showNotification('Ошибка', error.message || 'Не удалось изменить имя', 'error');
        return false;
    }
}

// В profile.js обновляем функцию updateProfileAvatar
export async function updateProfileAvatar(file) {
    if (!state.currentUser || !file) return false;

    try {
        // Всегда сжимаем изображение перед отправкой
        const compressedFile = await compressImage(file);
        if (!compressedFile) {
            throw new Error('Не удалось сжать изображение');
        }

        // Читаем сжатый файл как base64 строку
        const avatarBase64 = await readFileAsBase64(compressedFile);

        // Проверяем размер base64 строки (примерно 1.5MB максимум)
        if (avatarBase64.length > 1.5 * 1024 * 1024) {
            throw new Error('Размер изображения слишком большой после сжатия');
        }

        const response = await fetch(`${API_URL}/users/${state.currentUser.id}/avatar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: avatarBase64 })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        state.currentUser.avatar = data.user.avatar;
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        Utils.showNotification('Успешно', 'Аватар успешно обновлен');
        return true;
        
    } catch (error) {
        console.error('Ошибка при обновлении аватара:', error);
        Utils.showNotification('Ошибка', error.message || 'Не удалось обновить аватар', 'error');
        return false;
    }
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Максимальные размеры
                const MAX_WIDTH = 300;
                const MAX_HEIGHT = 300;
                
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    }));
                }, 'image/jpeg', 0.7);
            };
        };
        reader.readAsDataURL(file);
    });
}