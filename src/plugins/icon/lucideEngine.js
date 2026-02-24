// lucideEngine.js

export function createLucideEngine() {

    let _loaded = false;
    let _loadingPromise = null;

    let _createIcons = null;
    let _icons = null;

    async function ensureLoaded() {
        if (_loaded) return;

        if (_loadingPromise) {
            await _loadingPromise;
            return;
        }

        _loadingPromise = import(
            "https://unpkg.com/lucide@latest/dist/esm/lucide.js"
            ).then(mod => {
            _createIcons = mod.createIcons;
            _icons = mod.icons;
            _loaded = true;
        });

        await _loadingPromise;
    }

    return {

        /**
         * 아이콘 placeholder 생성
         */
        getIcon(icon) {
            const i = document.createElement("i");
            i.setAttribute("data-lucide", icon);
            return i;
        },

        /**
         * root 내부 아이콘 변환
         * draw마다 호출해도 안전
         */
        async afterRender(el) {
            if (!el) {
                return;
            }

            await ensureLoaded();

            _createIcons({
                icons: _icons,
                root: el
            });
        }
    };
}