import * as utils from "../../utils/utils.js";

/**
 * ListView UI 컴포넌트
 *
 * 지정한 DOM element 내부에 리스트 레이아웃을 생성하고
 * 데이터 기반으로 아이템을 렌더링한다.
 *
 * @example
 * const listView = new ListView({
 *   id: "myList",
 *   title: "사용자 목록",
 *   schema: userSchema,
 *   options: {
 *     size: 10,
 *     events: [
 *       {
 *         type: "click",
 *         selector: ".listView-item",
 *         handler: (e, node, data, index) => {
 *           console.log(data);
 *         }
 *       }
 *     ]
 *   }
 * });
 *
 * listView.init(data);
 */
class ListView {
    /**
     * @param {Object} config
     * @param {string} config.id 렌더링 대상 DOM element id
     * @param {string} [config.title] ListView 제목
     * @param {Object} [config.schema] 데이터 매핑 스키마
     * @param {Object} [config.options] 사용자 옵션
     * @param {number} [config.options.size=5] 표시할 최대 데이터 개수
     * @param {Array<Object>} [config.options.events=[]] 이벤트 정의 배열
     * @param {string} [config.options.emptyText="데이터 없음"] 데이터가 없을 때 표시 문구
     * @param {Function} [config.options.afterDraw] draw 완료 후 실행되는 콜백
     * @param {Object} [config.custom] header/body/footer 커스텀 렌더 함수
     * @param iconEngine
     */
    constructor({id, title, schema, options: userOptions = {}, custom = {}, iconEngine = null} = {}) {
        const defaultOption = {
            size: 5,
            events: [],
            emptyText: "데이터 없음"
        }

        this.id = id;
        this.title = title;
        this.schema = schema;
        this.custom = custom;
        this.options = utils.deepMerge(defaultOption, userOptions);
        this.iconEngine = iconEngine;

        this.el = null;
        this.headerEl = null;
        this.bodyEl = null;
        this.footerEl = null;
        this.data = [];

        const base = new URL(".", import.meta.url).href;
        utils.injectCss(base + "listView.css");
    }

    /**
     * ListView를 초기화하고 최초 렌더링을 수행한다.
     *
     * @param {Object[]} data 초기 데이터 배열
     */
    init(data) {
        this.el = document.getElementById(this.id);
        if (!this.el) {
            throw new Error(`No listView element with id ${this.id}`);
        }

        this.clear();
        this.renderLayout();
        this.setData(data);
    }

    /**
     * ListView 루트 요소의 모든 자식 DOM을 제거한다.
     *
     * header, body, footer 영역도 함께 제거된다.
     * 루트 요소(this.el) 자체는 유지된다.
     */
    clear() {
        if (this.el) {
            utils.clear(this.el);
        }
    }

    /**
     * ListView의 기본 레이아웃 구조를 생성한다.
     *
     * header, body, footer 영역을 생성하고
     * 루트 요소(this.el)에 append한다.
     *
     * @private
     */
    renderLayout() {
        this.headerEl = document.createElement("div");
        this.bodyEl = document.createElement("div");
        this.footerEl = document.createElement("div");

        this.headerEl.className = utils.makeClassName(["listView-header"]);
        this.bodyEl.className = utils.makeClassName(["listView-body"]);
        this.footerEl.className = utils.makeClassName(["listView-footer"]);

        this.el.append(
            this.headerEl,
            this.bodyEl,
            this.footerEl
        );
    }

    /**
     * 내부 렌더링 메서드
     *
     * 현재 this.data 기준으로 viewData를 생성하고
     * header, body, footer를 다시 렌더링한다.
     *
     * @private
     */
    draw() {
        // 데이터 전처리
        if (!this.schema) {
            this.viewData = this.data.slice(0, this.options.size);
        } else {
            const mapper = utils.createMapper(this.schema);
            this.viewData = this.data.slice(0, this.options.size).map(mapper);
        }

        this.renderHeader();
        this.renderBody();
        this.renderFooter();

        this.afterDraw();
        utils.bindEvents(this.el, this.options.events, this.viewData);
    }

    /**
     * Header 영역을 렌더링한다.
     *
     * custom.header가 정의되어 있으면 해당 렌더러를 사용하고,
     * 그렇지 않으면 기본 제목(h3)을 출력한다.
     *
     * @private
     */
    renderHeader() {
        this.headerEl.innerHTML = "";

        if (this.custom.header) {
            utils.renderCustom(this.headerEl, this.custom.header);
            return;
        }

        this.headerEl.innerHTML = `<h3>${this.title}</h3>`;
    }

    /**
     * ListView 데이터를 설정하고 다시 렌더링한다.
     *
     * @param {Object[]} data 렌더링할 데이터 배열
     */
    setData(data = []) {
        this.data = data;
        this.draw();
    }

    /**
     * 현재 데이터를 기준으로 ListView를 다시 렌더링한다.
     *
     * 데이터 변경 없이 UI만 갱신할 때 사용한다.
     */
    redraw() {
        this.draw();
    }

    /**
     * Body 영역을 렌더링한다.
     *
     * viewData를 기반으로 item 목록을 생성한다.
     * 데이터가 없으면 emptyText를 표시한다.
     *
     * custom.body가 정의되어 있으면 해당 렌더러를 사용한다.
     *
     * @private
     */
    renderBody() {
        this.bodyEl.innerHTML = "";

        if (this.custom.body) {
            utils.renderCustom(this.bodyEl, this.custom.body);
            return;
        }

        const ul = document.createElement("ul");
        ul.className = utils.makeClassName(["listView-item-list"]);

        if (this.viewData?.length ) {
            this.viewData.forEach((item, index) => {
                const li = document.createElement("li");
                li.className = utils.makeClassName(["listView-item"], [utils.RULES.dataBindClass]);
                li.dataset.index = index.toString();
                li["_uiIndex"] = index;// 이벤트 성능 용

                if (item.icon) {
                    const iconEl = this.renderIcon(item.icon);
                    if(iconEl) {
                        li.appendChild(iconEl);
                    }
                }
                if (item.title) {
                    li.appendChild(this.renderContent(item));
                }
                if (item.rightType) {
                    const right = this.renderRightComponent(item);
                    if (right) {
                        li.appendChild(right);
                    }
                }

                ul.appendChild(li);
            });
        } else {
            const emptyLi = document.createElement("li");
            emptyLi.className = utils.makeClassName(["listView-item"], "empty");
            emptyLi.textContent = this.options.emptyText;
            ul.appendChild(emptyLi);
        }

        this.bodyEl.appendChild(ul);
    }

    /**
     * Footer 영역을 렌더링한다.
     *
     * custom.footer가 정의되어 있으면 해당 렌더러를 사용한다.
     *
     * @private
     */
    renderFooter() {
        this.footerEl.innerHTML = "";

        if (this.custom.footer) {
            utils.renderCustom(this.footerEl, this.custom.footer);
        }
    }

    /**
     * draw 완료 후 실행되는 lifecycle 메서드
     *
     * options.afterDraw가 정의되어 있으면 context 객체와 함께 호출된다.
     *
     * context 구조:
     * {
     *   id: string,
     *   el: HTMLElement,
     *   title: string,
     *   rawData: Object[],
     *   viewData: Object[],
     *   schema: Object,
     *   options: Object,
     *   ui: ListView
     * }
     */
    async afterDraw() {
        if (this.iconEngine) {
            await this.iconEngine.afterRender(this.el);
        }

        if (typeof this.options.afterDraw === "function") {
            // context 생성
            const context = Object.freeze({
                id: this.id,
                el: this.el,
                title: this.title,
                rawData: this.data,
                viewData: this.viewData,
                schema: this.schema,
                options: this.options,
                ui: this
            });

            this.options.afterDraw(context);
        }
    }

    /**
     * ListView를 제거하고 내부 상태를 초기화한다.
     * 이벤트 및 DOM 참조를 해제한다.
     */
    destroy() {
        if (this.el) {
            utils.unbindEvents(this.el);
            utils.clear(this.el);
        }

        this.el = null;
        this.headerEl = null;
        this.bodyEl = null;
        this.footerEl = null;
        this.data = [];
        this.viewData = [];
    }

    //TODO: refresh Title(필요할때 만들기)

    /**
     * ListView item의 텍스트 콘텐츠 영역을 생성한다.
     */
    renderIcon(icon) {
        if (!this.iconEngine) {
            return null;
        }
        const div = document.createElement("div");
        div.className = utils.makeClassName(["listView-item-icon"]);
        const iconEl = this.iconEngine.getIcon(icon);
        if (iconEl) {
            div.appendChild(iconEl);
        }
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
    renderContent(data) {
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
    renderRightComponent(data) {
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