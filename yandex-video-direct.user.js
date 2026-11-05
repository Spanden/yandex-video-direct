// ==UserScript==
// @name         Яндекс.Видео — Прямые ссылки
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Открывает видео из поиска Яндекса напрямую на сайтах-источниках
// @match        https://yandex.ru/*
// @match        https://yandex.com/*
// @match        https://yandex.by/*
// @match        https://yandex.kz/*
// @match        https://ya.ru/*
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/Spanden/yandex-video-direct/refs/heads/main/yandex-video-direct.user.js
// @downloadURL  https://raw.githubusercontent.com/Spanden/yandex-video-direct/refs/heads/main/yandex-video-direct.user.js
// ==/UserScript==

(function () {
    'use strict';

    const YANDEX_HOST = /(^|\.)(yandex\.[a-z.]+|ya\.ru|ya\.cc)$/i;

    // Селекторы ссылки на источник для обеих вёрсток карточек
    const HOST_SELECTOR = '.VideoHostExtended-Host[href], .VideoSnippetHosts a[href]';

    function getDirectUrl(card) {
        for (const a of card.querySelectorAll(HOST_SELECTOR)) {
            const href = a.getAttribute('href');
            if (!/^https?:\/\//i.test(href)) continue;
            try {
                if (!YANDEX_HOST.test(new URL(href).hostname)) return href;
            } catch (_) {}
        }
        return null;
    }

    function isPlayerLink(a) {
        return a.dataset.directPatched === '1' ||
               (a.getAttribute('href') || '').includes('/video/preview/');
    }

    document.addEventListener('click', function (e) {
        if (e.button !== 0) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey) return; // пусть браузер обработает сам

        const link = e.target.closest('a');
        if (!link || !isPlayerLink(link)) return;

        const card = link.closest('.VideoSnippet');
        if (!card) return;

        const directUrl = getDirectUrl(card);
        if (!directUrl) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        if (link.target === '_blank') {
            window.open(directUrl, '_blank', 'noopener');
        } else {
            location.assign(directUrl);
        }
    }, true);

    // Подмена href заранее: работают «Открыть в новой вкладке», средняя кнопка и подсказка при наведении
    function rewrite() {
        document.querySelectorAll('.VideoSnippet').forEach(card => {
            const directUrl = getDirectUrl(card);
            if (!directUrl) return;
            card.querySelectorAll('a[href*="/video/preview/"]').forEach(a => {
                a.dataset.directPatched = '1';
                a.href = directUrl;
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        rewrite();
        new MutationObserver(rewrite).observe(document.body, { childList: true, subtree: true });
    });
})();