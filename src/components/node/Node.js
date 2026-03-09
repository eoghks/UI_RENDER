import * as utils from "../../utils/utils.js";

/**
 * 데이터 기반으로 동적으로 렌더링되는 Node UI 컴포넌트
 *
 * 지원 타입:
 * - tag
 * - details
 * - actions
 * - status
 *
 * custom body를 통해 외부 렌더링 확장 가능
 */
class Node {
    /**
     * @typedef {Object} NodeOptions
     * @property {string} [emptyText] 데이터가 없을 때 표시할 문구
     * @property {Array<Object>} [events] bindEvents에 전달될 이벤트 목록
     * @property {Function} [afterDraw] 렌더링 완료 후 실행될 콜백
     */

    /**
     * @typedef {Object} NodeContext
     * @property {string} id root element id
     * @property {HTMLElement} el root element
     * @property {Array<Object>} rawData 원본 데이터
     * @property {NodeOptions} options 설정 옵션
     * @property {Node} ui 현재 Node 인스턴스
     */

    /**
     * @param {Object} params
     * @param {string} params.id 렌더링 대상 DOM id
     * @param {NodeOptions} [params.options]
     * @param {Object} [params.custom] custom 렌더링 옵션
     * @param {Object} [params.iconEngine] 아이콘 처리 엔진
     */
    constructor({id, options: userOptions = {}, custom = {}, iconEngine = null} = {}) {
        const defaultOption = {
            emptyText: "데이터 없음",
            events: [],
            errorMsg: "처리중 오류가 발생했습니다.",
        }

        this.id = id;
        this.custom = custom;
        this.options = utils.deepMerge(defaultOption, userOptions);
        this.iconEngine = iconEngine;

        this.el = null;
        this.bodyEl = null;

        const base = new URL(".", import.meta.url).href;
        utils.injectCss(base + "Node.css");
    }

    /**
     * 초기화 및 첫 렌더링 수행
     * @param {Array<Object>} data 렌더링 데이터
     */
    init(data) {
        this.el = document.getElementById(this.id);
        if (!this.el) {
            throw new Error(`No node element with id ${this.id}`);
        }

        this.renderLayout();

        this.data = data;
        this.setViewData();

        this.draw();
    }

    /**
     * 내부 내용을 초기화한다.
     *
     *  body  영역의 자식 요소만 제거하며,
     * 루트 요소(this.el)와 레이아웃 구조는 유지된다.
     *
     * 이후 setData() 호출 시 내부 콘텐츠만 다시 렌더링할 수 있도록
     * 상태 데이터(data, viewData)도 함께 초기화한다.
     *
     * @returns {void}
     */
    clear() {
        if (this.bodyEl) {
            utils.clear(this.bodyEl);
        }
    }

    reset() {
        this.clear()
        this.data = [];
        this.viewData = [];
    }

    /**
     * 기본 레이아웃 DOM 구조 생성
     * root 내부에 body 영역을 구성한다.
     * @private
     */
    renderLayout() {
        const className = utils.makeClassName(["node", "body"]);
        this.bodyEl = utils.createElement("div", "", className);

        this.el.appendChild(this.bodyEl);
    }

    /**
     * body 렌더링 및 이벤트 바인딩 수행
     */
    draw() {
        this.renderBody();

        utils.bindEvents(this.el, this.options.events, this.viewData);
        this.afterDraw();
    }

    /**
     * 데이터를 설정하고 다시 렌더링
     * @param {Array<Object>} data
     */
    setData(data = []) {
        this.data = data;
        this.setViewData();

        this.draw();
    }

    setViewData() {
        this.viewData = this.data;
    }

    /**
     * 현재 데이터를 기준으로 다시 렌더링
     */
    redraw() {
        if (!this.el) {
            return;
        }
        this.draw();
    }

    /**
     * 데이터 타입에 따라 body 영역을 렌더링
     * custom.body가 존재하면 해당 렌더러를 사용
     */
    renderBody() {
        this.bodyEl.textContent = "";

        if (this.custom.body) {
            utils.renderCustom(this.bodyEl, this.custom.body, this.getContext());
            return;
        }

        const wrapper = this.createBodyWrapper();

        if('error' in this.viewData) {
            this.renderError(wrapper);
        } else if (Array.isArray(this.viewData) && this.viewData.length > 0) {
            wrapper.classList.add(utils.makeClassName([], [utils.RULES.dataBindClass]));
            wrapper.dataset.index = "0";
            wrapper["_uiIndex"] = 0;// 이벤트 성능 용
            this.viewData.forEach(d => {
                switch (d.type) {
                    case "tag":
                        wrapper.appendChild(this.renderTag(d));
                        break;
                    case "details":
                        wrapper.appendChild(this.renderDetails(d.detailData));
                        break;
                    case "actions":
                        wrapper.appendChild(this.renderActions(d.actionData))
                        break;
                    case "status":
                        wrapper.appendChild(this.renderStatus(d));
                        break;
                }
            });
        } else {
            this.renderEmpty(wrapper);
        }

        this.bodyEl.appendChild(wrapper);
    }

    /**
     * error 상태 렌더링
     * @param {HTMLElement} wrapper
     */
    renderError(wrapper) {
        wrapper.classList.add(uiUtils.makeClassName(["error"]));
        wrapper.textContent = this.viewData.error || this.options.errorMsg;
    }

    /**
     * Body wrapper 생성
     * @returns {HTMLElement}
     */
    createBodyWrapper() {
        const className = utils.makeClassName(["node-row"]);
        return utils.createElement("div", undefined, className);
    }

    /**
     * empty 상태 렌더링
     * @param {HTMLElement} wrapper
     */
    renderEmpty(wrapper) {
        wrapper.classList.add("empty");
        wrapper.textContent = this.options.emptyText;
    }

    /**
     * tag 타입 렌더링
     * @param {{ type: "tag", value: string }} data
     * @returns {HTMLDivElement}
     */
    renderTag(data) {
        const className = utils.makeClassName(["tag"], [data.value.toLowerCase()]);
        return utils.createElement("div", data.value, className);
    }

    /**
     * details 타입 렌더링
     * @param {Array<Object>} detailData
     * @returns {HTMLDivElement}
     */
    renderDetails(detailData) {
        const detailsClassName = utils.makeClassName(["node-details"], []);
        const nodeDetailsEl = utils.createElement("div", "", detailsClassName);

        detailData.forEach((d, index) => {
            nodeDetailsEl.appendChild(this.renderDetailItem(d, index));
        });

        return nodeDetailsEl;
    }

    /**
     * detail item 렌더링
     * key-value 구조를 span으로 생성
     * @param {Object.<string, string>} data
     * @param index
     * @returns {HTMLDivElement}
     */
    renderDetailItem(data, index) {
        const className = utils.makeClassName(["detail-item"], []);
        const detailItemEl = utils.createElement("div", "", className);

        detailItemEl.dataset.index = index;     // dataset 방식 (추천)
        detailItemEl._uiIndex = index;          // 기존 패턴 유지용

        Object.entries(data).forEach(([key, value]) => {
            const span = utils.createElement(
                "span",
                value,
                key  // key를 class로 사용
            );

            detailItemEl.appendChild(span);
        });

        return detailItemEl;
    }

    /**
     * actions 영역 렌더링
     * @param {Array<Object>} actionData
     * @returns {HTMLDivElement}
     */
    renderActions(actionData) {
        const detailsClassName = utils.makeClassName(["node-actions"], []);
        const actionEl = utils.createElement("div", "", detailsClassName);

        actionData.forEach((d, index) => {
            switch (d.type) {
                case "button":
                    actionEl.appendChild(this.renderButton(d, index));
                    break;
                default:
                    break;
            }
        });

        return actionEl;
    }

    /**
     * 버튼 렌더링
     * @param {Object} buttonData
     * @param index
     * @param {string} buttonData.value 버튼 텍스트 또는 아이콘 이름
     * @param {"icon"|"text"} buttonData.valueType 값 타입
     * @param {string} [buttonData.class] 추가 클래스
     * @param {boolean} [buttonData.disabled]
     * @param {Function} [buttonData.onClick]
     * @returns {HTMLButtonElement}
     */
    renderButton(buttonData, index) {
        const className = utils.makeClassName(["detail-button", "button"], [buttonData.class])

        let button;
        if (buttonData.valueType === "icon") {
            const iconEl = this.iconEngine.getIcon(buttonData.value);
            button = utils.createElement("button", undefined, className);
            button.appendChild(iconEl);
        } else {
            button = utils.createElement("button", buttonData.value, className);
        }

        button.dataset.index = index;     // dataset 방식 (추천)
        button._uiIndex = index;          // 기존 패턴 유지용

        if (buttonData.disabled) {
            button.disabled = true;
        }

        if (buttonData.onClick) {
            button.addEventListener("click", buttonData.onClick);
        }

        return button;
    }

    renderStatus(data) {
        const className = utils.makeClassName([], ["status-badge", data.value.toLowerCase()]);
        return utils.createElement("div", data.value, className);
    }

    /**
     * 렌더링 완료 후 실행
     * iconEngine 후처리 및 사용자 afterDraw 콜백 실행
     * @returns {Promise<void>}
     */
    async afterDraw() {
        if (this.iconEngine) {
            await this.iconEngine.afterRender(this.el);
        }

        if (typeof this.options.afterDraw === "function") {
            // context 생성
            const context = Object.freeze(this.getContext());

            this.options.afterDraw(context);
        }
    }

    /**
     * DOM 및 이벤트 정리
     */
    destroy() {
               if (!this.el) {
            return;
        }

        utils.unbindEvents(this.el);

        this.el = null;
        this.bodyEl = null;

        this.data = null;
        this.viewData = null;
    }

    /**
     * 외부에서 사용할 context 객체 반환
     * freeze 처리되어 불변 객체로 제공됨
     * @returns {NodeContext}
     */
    getContext() {
        return {
            id: this.id,
            el: this.el,
            rawData: this.data,
            viewData: this.viewData,
            options: this.options,
            ui: this
        };
    }
}

export default Node;