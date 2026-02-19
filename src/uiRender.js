/**
 * UiRender - Panel 컴포넌트 렌더러 (JSP/브라우저 환경)
 */
class UiRender {
    /**
     * @param {Object} [options] - 글로벌 기본 옵션
     * @param {Object} [options.panel] - 패널 기본 옵션
     * @param {number} [options.panel.size=5] - 최대 표시 데이터 개수
     * @param {Array<Object>} [options.panel.events=[]] - 이벤트 설정 목록
     * @param {Array<Object>} [options.icons=[]] - 추가 커스텀 아이콘
     */
    constructor(options = {}) {
        const defaults = {
            panel: {
                size: 5,
                events: []
            },
            icons: []
        };
        this.options = this.deepMerge(defaults, options);
        this.initIconScript();
    }

    /**
     * 두 객체를 재귀적으로 병합하는 Deep Merge
     * @param {Object} target
     * @param {Object} source
     * @returns {Object}
     */
    deepMerge(target, source) {
        const result = {...target};
        for (const key in source) {
            if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    /**
     * 아이콘 라이브러리 초기화 (비동기)
     * @returns {Promise<void>}
     */
    initIconScript() {

        // 사용자 커스텀 아이콘
        for (const icon of this.options.icons) {
            if (icon.script && typeof icon.callback === "function") {
                this.loadScript(icon.script);
            }
        }

        // Lucide 기본
        if (!window.Lucide) {
            this.loadScript(
                "https://unpkg.com/lucide@latest"
            );
        }
    }

    /**
     * 스크립트 동적 로드 Promise 버전
     * @param {string} url
     * @returns {Promise<void>}
     */
    loadScript(url) {
        const script = document.createElement("script");
        script.src = url;
        document.head.appendChild(script);
    }

    /**
     * Schema 기반 Mapper 생성
     * @param {Object} schema
     * @returns {Function}
     */
    createMapper(schema) {
        return (data) => {
            const result = {};
            for (const key in schema) {
                if (schema[key]) result[key] = schema[key](data);
            }
            return result;
        };
    }

    /**
     * 패널 렌더링
     * @param {string} panelId
     * @param {string} title
     * @param {Array<Object>} data
     * @param {Object} schema
     * @param {Object} [options]
     * @param {Object} [custom] - {header, body, footer} 커스텀 함수
     */
    renderPanel(panelId, title, data, schema, options = {}, custom = {}) {
        const panelEl = document.getElementById(panelId);
        if (!panelEl) throw new Error(`No panel element with id ${panelId}`);

        const panelClassId = panelId.replace(/[^a-zA-Z0-9_-]/g, "_");
        const opt = this.deepMerge(this.options.panel, options);

        // Header
        if (custom.header) {
            custom.header(panelEl);
        } else {
            this.renderDefaultHeader(panelEl, panelClassId, title);
        }

        // 데이터 전처리
        const mapper = this.createMapper(schema);
        const viewData = data.map(mapper).slice(0, opt.size);

        // Body
        if (custom.body) {
            custom.body(panelEl, viewData);
        } else {
            this.renderDefaultBody(panelEl, panelClassId, viewData);
        }

        // Footer
        if (custom.footer) custom.footer(panelEl);

        // Events
        this.bindEvents(panelEl, opt.events, viewData);

        if (window.Lucide) {
            window.Lucide.createIcons();
        }
    }

    renderDefaultHeader(panel, panelClassId, title) {
        const div = document.createElement("div");
        div.className = `panel-header ${panelClassId}-header`;
        div.innerHTML = `<h3>${title}</h3>`;
        panel.appendChild(div);
    }

    renderDefaultBody(panel, panelClassId, viewData) {
        const body = document.createElement("div");
        body.className = `panel-body ${panelClassId}-body`;

        const ul = document.createElement("ul");
        ul.className = `panel-item-list ${panelClassId}-list`;

        viewData.forEach((item, index) => {
            const li = document.createElement("li");
            li.className = `panel-item ${panelClassId}-item`;
            li.dataset.index = index;

            if (item.icon) {
                li.appendChild(this.createIcon(item.icon));
            }
            if (item.title) {
                li.appendChild(this.createContent(item));
            }
            if (item.rightType) {
                li.appendChild(this.createRightComponent(item));
            }

            ul.appendChild(li);
        });

        body.appendChild(ul);
        panel.appendChild(body);
    }

    createIcon(icon) {
        const div = document.createElement("div");
        div.className = "panel-item-icon";
        const i = document.createElement("i");
        i.setAttribute("data-lucide", icon);
        div.appendChild(i);
        return div;
    }

    createContent(data) {
        const div = document.createElement("div");
        div.className = "panel-item-content";

        const title = document.createElement("span");
        title.className = "panel-item-title";
        title.textContent = data.title;
        div.appendChild(title);

        if (data.subText) {
            const subText = document.createElement("span");
            subText.className = "panel-item-subText";
            subText.textContent = data.subText;
            div.appendChild(subText);
        }

        return div;
    }

    createRightComponent(data) {
        switch (data.rightType) {
            case "status":
                return this.createStatus(data);
            case "ip":
                return this.createIp(data);
            default:
                return document.createElement("span");
        }
    }

    createIp(data) {
        const span = document.createElement("span");
        span.className = "ip-masked";
        span.textContent = data.ip;
        return span;
    }

    createStatus(data) {
        const span = document.createElement("span");
        span.className = `status-badge ${data.status}`;
        span.textContent = data.status;
        return span;
    }

    // TODO:dhwi MVP
    bindEvents(panel, events, viewData) {
        events.forEach(evt => {
            panel.addEventListener(evt.type, e => {
                const target = evt.selector ? e.target.closest(evt.selector) : panel;
                if (!target) return;

                const itemEl = target.closest(".panel-item");
                const index = Number(itemEl?.dataset.index);
                const itemData = !isNaN(index) ? viewData[index] : null;

                evt.handler({event: e, element: target, item: itemData, index: !isNaN(index) ? index : null});
            });
        });
    }
}

// 브라우저 전역 노출
window.UiRender = UiRender;