import * as utils from "../../utils/utils.js";

class ListView {
    constructor(options = {}) {
        this.options = utils.deepMerge({
            size: 5,
            events: [],
            emptyText: "데이터 없음"
        }, options);

        const base = new URL(".", import.meta.url).href;
        utils.injectCss(base + "listView.css");
    }
    /**
     * ListView 렌더링
     * @param {string} id
     * @param {string} title
     * @param {Array<Object>} data
     * @param {Object} schema
     * @param {Object} [options]
     * @param {Object} [custom] - {header, body, footer} 커스텀 함수
     */
    render(id, title, data, schema, options = {}, custom = {}) {
        const listViewEl = document.getElementById(id);
        if (!listViewEl) {
            throw new Error(`No listView element with id ${id}`);
        }

        // listViewEl 초기화
        listViewEl.innerHTML = "";

        const listViewOptions = utils.deepMerge({...this.options}, options);

        // Header
        if (custom.header) {
            custom.header(listViewEl);
        } else {
            this.renderHeader(listViewEl, title);
        }

        // 데이터 전처리
        let viewData;
        if (!schema) {
            viewData = data;
        } else {
            const mapper = utils.createMapper(schema);
            viewData = data.slice(0, listViewOptions.size).map(mapper);
        }

        // Body
        if (custom.body) {
            custom.body(listViewEl, viewData);
        } else {
            this.renderBody(listViewEl, viewData, listViewOptions);
        }

        // Footer
        if (custom.footer) {
            custom.footer(listViewEl);
        }

        // Events
        utils.bindEvents(listViewEl, listViewOptions.events, viewData);

        if (typeof listViewOptions.afterRender === "function") {
            // context 생성
            const context = Object.freeze({
                id,
                listViewEl,
                title,
                rawData: data,
                viewData,
                schema,
                options: listViewOptions,
                ui: this
            });

            listViewOptions.afterRender(context);
        }
    }

    /**
     * 기본 ListView Header 영역을 렌더링한다.
     *
     * @param {HTMLElement} listView ListView 루트 요소
     * @param {string} title ListView 제목 텍스트
     */
    renderHeader(listView, title) {
        const div = document.createElement("div");
        div.className = utils.makeClassName(["listView-header"]);
        div.innerHTML = `<h3>${title}</h3>`;
        listView.appendChild(div);
    }

    /**
     * 기본 ListView Body 영역을 렌더링한다.
     *
     * viewData 기반으로 item 목록을 생성하며,
     * 각 item에는 데이터 바인딩을 위한 index dataset과 dataBindClass가 부여된다.
     *
     * @param {HTMLElement} listView ListView 루트 요소
     * @param {Object[]} viewData 렌더링에 사용할 데이터 목록
     * @param {Object} listViewOptions ListView 옵션
     * @param {string} listViewOptions.emptyText 데이터가 없을 때 표시할 문구
     */
    renderBody(listView, viewData, listViewOptions) {
        const body = document.createElement("div");
        body.className = utils.makeClassName(["listView-body"]);

        const ul = document.createElement("ul");
        ul.className = utils.makeClassName(["listView-item-list"]);

        if (viewData?.length) {
            viewData.forEach((item, index) => {
                const li = document.createElement("li");
                li.className = utils.makeClassName(["listView-item"], [utils.RULES.dataBindClass]);
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
            emptyDiv.className = utils.makeClassName(["listView-item"], "empty");
            emptyDiv.textContent = listViewOptions.emptyText; // 원하는 문구로 변경 가능
            ul.appendChild(emptyDiv);
        }

        body.appendChild(ul);
        listView.appendChild(body);
    }

    /**
     * ListView item의 텍스트 콘텐츠 영역을 생성한다.
     *
     * @param {Object} data item 데이터
     * @param {string} data.title 제목 텍스트
     * @param {string} [data.subText] 보조 텍스트
     * @returns {HTMLElement} 콘텐츠 요소
     */
    createIcon(icon) {
        const div = document.createElement("div");
        div.className = utils.makeClassName(["listView-item-icon"]);
        const i = document.createElement("i");
        i.setAttribute("data-lucide", icon);
        div.appendChild(i);
        return div;
    }

    /**
     * ListView item의 텍스트 콘텐츠 영역을 생성한다.
     *
     * @param {Object} data item 데이터
     * @param {string} data.title 제목 텍스트
     * @param {string} [data.subText] 보조 텍스트
     * @returns {HTMLElement} 콘텐츠 요소
     */
    createContent(data) {
        const div = document.createElement("div");
        div.className = utils.makeClassName(["listView-item-content"]);

        const title = document.createElement("span");
        title.className = utils.makeClassName(["listView-item-title"]);
        title.textContent = data.title;
        div.appendChild(title);

        if (data.subText) {
            const subText = document.createElement("span");
            subText.className = utils.makeClassName(["listView-item-subText"]);
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
        span.className = utils.makeClassName(["listView-right"], ["ip"]);
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
        span.className = utils.makeClassName(["listView-right"], ["status-badge", (status || "").toLowerCase()]);
        span.textContent = status;
        return span;
    }
}

export default ListView;