// lucideEngine.js
export function createLucideEngine() {
    async function ensureLucide() {
        if (window.lucide) return;

        await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "/src/plugins/lucide/lucide.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
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
            if (!el) return;

            await ensureLucide();
            // 로컬 Lucide를 바로 사용
            window.lucide.createIcons({root: el});
        }
    };
}