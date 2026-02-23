import * as utils from "../../utils/utils.js";

class PanelRender {
    constructor(options = {}) {
        this.options = utils.deepMerge({
            size: 5,
            events: [],
            emptyText: "데이터 없음"
        }, options);

        const base = new URL(".", import.meta.url).href;
        utils.injectCss(base + "panel.css");
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
    render(panelId, title, data, schema, options = {}, custom = {}) {
        const panelEl = document.getElementById(panelId);
        if (!panelEl) {
            throw new Error(`No panel element with id ${panelId}`);
        }

        // panelEl 초기화
        panelEl.innerHTML = "";

        const panelOptions = utils.deepMerge({...this.options}, options);

        // Header
        if (custom.header) {
            custom.header(panelEl);
        } else {
            this.renderHeader(panelEl, title);
        }

        // 데이터 전처리
        let viewData;
        if (!schema) {
            viewData = data;
        } else {
            const mapper = utils.createMapper(schema);
            viewData = data.slice(0, panelOptions.size).map(mapper);
        }

        // Body
        if (custom.body) {
            custom.body(panelEl, viewData);
        } else {
            this.renderBody(panelEl, viewData, panelOptions);
        }

        // Footer
        if (custom.footer) {
            custom.footer(panelEl);
        }

        // Events
        utils.bindEvents(panelEl, panelOptions.events, viewData);

        if (typeof panelOptions.afterRender === "function") {
            // context 생성
            const context = Object.freeze({
                panelId,
                panelEl,
                title,
                rawData: data,
                viewData,
                schema,
                options: panelOptions,
                ui: this
            });

            panelOptions.afterRender(context);
        }
    }

    /**
     * 기본 패널 Header 영역을 렌더링한다.
     *
     * @param {HTMLElement} panel 패널 루트 요소
     * @param {string} title 패널 제목 텍스트
     */
    renderHeader(panel, title) {
        const div = document.createElement("div");
        div.className = utils.makeClassName(["panel-header"]);
        div.innerHTML = `<h3>${title}</h3>`;
        panel.appendChild(div);
    }

    /**
     * 기본 패널 Body 영역을 렌더링한다.
     *
     * viewData 기반으로 item 목록을 생성하며,
     * 각 item에는 데이터 바인딩을 위한 index dataset과 dataBindClass가 부여된다.
     *
     * @param {HTMLElement} panel 패널 루트 요소
     * @param {Object[]} viewData 렌더링에 사용할 데이터 목록
     * @param {Object} panelOptions 패널 옵션
     * @param {string} panelOptions.emptyText 데이터가 없을 때 표시할 문구
     */
    renderBody(panel, viewData, panelOptions) {
        const body = document.createElement("div");
        body.className = utils.makeClassName(["panel-body"]);

        const ul = document.createElement("ul");
        ul.className = utils.makeClassName(["panel-item-list"]);

        if (viewData?.length) {
            viewData.forEach((item, index) => {
                const li = document.createElement("li");
                li.className = utils.makeClassName(["panel-item"], [utils.RULES.dataBindClass]);
                li.dataset.index = index.toString();
                li["_uiIndex"] = index;// 이벤트 성능 용

                if (item.icon) {
                    li.appendChild(this.createIcon(item.icon));
                }
                if (item.title) {
                    li.appendChild(this.createContent(item));
                }
                if (item.rightType) {
                    const right = this.createRightComponent(item);
                    if (right) {
                        li.appendChild(right);
                    }
                }

                ul.appendChild(li);
            });
        } else {
            const emptyDiv = document.createElement("div");
            emptyDiv.className = utils.makeClassName(["panel-item"], "empty");
            emptyDiv.textContent = panelOptions.emptyText; // 원하는 문구로 변경 가능
            ul.appendChild(emptyDiv);
        }

        body.appendChild(ul);
        panel.appendChild(body);
    }

    /**
     * 패널 item의 텍스트 콘텐츠 영역을 생성한다.
     *
     * @param {Object} data item 데이터
     * @param {string} data.title 제목 텍스트
     * @param {string} [data.subText] 보조 텍스트
     * @returns {HTMLElement} 콘텐츠 요소
     */
    createIcon(icon) {
        const div = document.createElement("div");
        div.className = utils.makeClassName(["panel-item-icon"]);
        const i = document.createElement("i");
        i.setAttribute("data-lucide", icon);
        div.appendChild(i);
        return div;
    }

    /**
     * 패널 item의 텍스트 콘텐츠 영역을 생성한다.
     *
     * @param {Object} data item 데이터
     * @param {string} data.title 제목 텍스트
     * @param {string} [data.subText] 보조 텍스트
     * @returns {HTMLElement} 콘텐츠 요소
     */
    createContent(data) {
        const div = document.createElement("div");
        div.className = utils.makeClassName(["panel-item-content"]);

        const title = document.createElement("span");
        title.className = utils.makeClassName(["panel-item-title"]);
        title.textContent = data.title;
        div.appendChild(title);

        if (data.subText) {
            const subText = document.createElement("span");
            subText.className = utils.makeClassName(["panel-item-subText"]);
            subText.textContent = data.subText;
            div.appendChild(subText);
        }

        return div;
    }

    /**
     * item의 우측 컴포넌트를 생성한다.
     *
     * @param {Object} data item 데이터
     * @param {"status"|"ip"} data.rightType 우측 표시 타입
     * @returns {HTMLElement} 생성된 우측 컴포넌트
     */
    createRightComponent(data) {
        switch (data.rightType) {
            case "status":
                return this.createStatus(data.status);
            case "ip":
                return this.createIp(data.ip);
            default:
                return null;
        }
    }

    /**
     * IP 표시 컴포넌트를 생성한다.
     *
     * @param {string} ip IP 주소
     * @returns {HTMLElement}
     */
    createIp(ip) {
        const span = document.createElement("span");
        span.className = utils.makeClassName(["panel-right"], ["ip"]);
        span.textContent = ip;
        return span;
    }

    /**
     * 상태 배지 컴포넌트를 생성한다.
     *
     * @param {string} status 상태 텍스트
     * @returns {HTMLElement}
     */
    createStatus(status) {
        const span = document.createElement("span");
        span.className = utils.makeClassName(["panel-right"], ["status-badge", (status || "").toLowerCase()]);
        span.textContent = status;
        return span;
    }
}

export default PanelRender;