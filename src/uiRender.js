import * as utils from './utils.js';

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
            autoCss: true,
            panel: {
                size: 5,
                events: [],
                emptyText: "데이터 없음"
            },
        };
        this.options = this.deepMerge(defaults, options);

        // CSS 자동 주입
        if (this.options.autoCss) {
            this.injectCss();
        }
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
     * UI Render CSS를 문서에 삽입합니다.
     *
     * <p>
     * 문서에 ID가 "ui-render-style"인 <code>link</code> 요소가 이미 존재하면
     * 아무 작업도 수행하지 않습니다. 존재하지 않으면 새로운 <code>link</code> 요소를 생성하고,
     * 현재 실행 중인 스크립트(src에 "uiRender" 포함)와 같은 디렉토리에 있는
     * "uiRender.css" 파일을 참조하도록 설정합니다.
     * </p>
     *
     * <p>
     * 사용 예시:
     * <pre>
     *     injectCss();
     * </pre>
     * </p>
     */
    injectCss() {
        if (document.getElementById("ui-render-style")) return;

        const link = document.createElement("link");
        link.id = "ui-render-style";
        link.rel = "stylesheet";

        const script = document.currentScript ||
            [...document.scripts].find(s => s.src.includes("uiRender"));

        if (script) {
            const base = script.src.substring(0, script.src.lastIndexOf("/") + 1);
            link.href = base + "uiRender.css";
        }

        document.head.appendChild(link);
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
        const panelOptions = this.deepMerge(this.options.panel, options);

        // Header
        if (custom.header) {
            custom.header(panelEl);
        } else {
            this.renderDefaultHeader(panelEl, panelClassId, title);
        }

        // 데이터 전처리
        const mapper = this.createMapper(schema);
        const viewData = data.map(mapper).slice(0, panelOptions.size);

        // Body
        if (custom.body) {
            custom.body(panelEl, viewData);
        } else {
            this.renderDefaultBody(panelEl, panelClassId, viewData, panelOptions);
        }

        // Footer
        if (custom.footer) custom.footer(panelEl);

        // Events
        this.bindEvents(panelEl, panelOptions.events, viewData);

        if (typeof panelOptions.afterRender === "function") {
            // context 생성
            const context = {
                panelId,
                panelEl,
                title,
                rawData: data,
                viewData,
                schema,
                options: panelOptions,
                ui: this
            };

            panelOptions.afterRender(context);
        }
    }

    renderDefaultHeader(panel, panelClassId, title) {
        const div = document.createElement("div");
        div.className = `panel-header ${panelClassId}-header`;
        div.innerHTML = `<h3>${title}</h3>`;
        panel.appendChild(div);
    }

    renderDefaultBody(panel, panelClassId, viewData, panelOptions) {
        const body = document.createElement("div");
        body.className = `panel-body ${panelClassId}-body`;

        const ul = document.createElement("ul");
        ul.className = `panel-item-list ${panelClassId}-list`;

        if (!utils.isEmpty(viewData)) {
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
        } else {
            const emptyDiv = document.createElement("div");
            emptyDiv.className = `panel-item ${panelClassId}-item panel-empty`;
            emptyDiv.textContent = panelOptions.emptyText; // 원하는 문구로 변경 가능
            ul.appendChild(emptyDiv);
        }

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
        span.className = `status-badge ${data.status.toLowerCase()}`;
        span.textContent = data.status;
        return span;
    }

    bindEvents(panel, events, viewData) {
        events.forEach(event => {
            panel.addEventListener(event.type, e => {
                const target = event.selector ? e.target.closest(event.selector) : panel;
                if (!target) return;

                const itemEl = target.closest(".panel-item");
                const index = Number(itemEl?.dataset.index);
                const itemData = !isNaN(index) ? viewData[index] : null;

                event.handler({event: e, element: target, item: itemData, index: !isNaN(index) ? index : null});
            });
        });
    }
}