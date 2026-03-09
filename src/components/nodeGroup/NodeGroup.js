import * as utils from "../../utils/utils.js";
import Node from "../node/Node.js";

/**
 * NodeGroup 클래스는 여러 Node 컴포넌트를 그룹화하여
 * 렌더링, 데이터 바인딩, 레이아웃 관리, 이벤트 처리 기능을 제공한다.
 *
 * @class NodeGroup
 */
class NodeGroup {
    /**
     * NodeGroup 생성자
     * @param {Object} [params={}]
     * @param {string} params.id - NodeGroup을 마운트할 root DOM element의 ID
     * @param {Object} [params.title={}] - NodeGroup header 제목 객체, {value: string} 형식
     * @param {Object} [params.options={}] - 사용자 옵션
     * @param {Object} [params.custom={}] - 사용자 커스텀 렌더링 설정 (header, body)
     * @param {Object|null} [params.iconEngine=null] - 아이콘 엔진 객체, 후처리 가능
     */
    constructor({id, title = {}, options: userOptions = {}, custom = {}, iconEngine = null} = {}) {
        const defaultOption = {
            emptyText: "데이터 없음",
            events: [],
        }

        this.id = id;
        this.title = title;
        this.custom = custom;
        this.options = utils.deepMerge(defaultOption, userOptions);
        this.iconEngine = iconEngine;

        this.el = null;
        this.bodyEl = null;
        this.nodes = [];

        const base = new URL(".", import.meta.url).href;
        utils.injectCss(base + "NodeGroup.css");
    }

    /**
     * 초기화 및 첫 렌더링 수행
     * @param {Array<Object>} data 렌더링 데이터
     */
    init(data) {
        this.el = document.getElementById(this.id);
        if (!this.el) {
            throw new Error(`No systemNode element with id ${this.id}`);
        }

        this.renderLayout();

        this.data = data;
        this.setViewData();

        this.draw();
    }

    /**
     * 내부 내용을 초기화한다.
     *
     * header, body, footer 영역의 자식 요소만 제거하며,
     * 루트 요소(this.el)와 레이아웃 구조는 유지된다.
     *
     * 이후 setData() 호출 시 내부 콘텐츠만 다시 렌더링할 수 있도록
     * 상태 데이터(data, viewData)도 함께 초기화한다.
     *
     * @returns {void}
     */
    clear() {
        if (this.headerEl) {
            utils.clear(this.headerEl);
        }

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
        const headerClassName = utils.makeClassName(["nodeGroup-header", "header"]);
        this.headerEl = utils.createElement("div", "", headerClassName);

        const bodyClassName = utils.makeClassName(["nodeGroup-body", "body"]);
        this.bodyEl = utils.createElement("div", "", bodyClassName);

        this.el.append(
            this.headerEl,
            this.bodyEl,
        );
    }

    /**
     * body 렌더링 및 이벤트 바인딩 수행
     */
    draw() {
        this.renderHeader();
        this.renderBody();

        utils.bindEvents(this.el, this.options.events, this.viewData);
        this.afterDraw();
    }

    /**
     * 데이터를 설정하고 다시 렌더링
     * @param {Array<Object>} data
     */
    setData(data = []) {
        this.clear();
        this.data = data;
        // 데이터 전처리
        this.setViewData();

        this.renderBody();

        uiUtils.bindEvents(this.el, this.options.events, this.viewData);
        this.afterDraw();
    }

    setViewData() {
        if (!this.el) {
            return;
        }
        this.viewData = this.data;
    }

    /**
     * 현재 데이터를 기준으로 다시 렌더링
     */
    redraw() {
        this.draw();
    }

    /**
     * NodeGroup header 렌더링
     */
    renderHeader() {
        this.headerEl.textContent = "";

        if (this.custom.header) {
            utils.renderCustom(this.headerEl, this.custom.header, this.getContext());
            return;
        }

        if (this.title && Object.keys(this.title).length > 0) {
            const title = utils.createElement("h3", this.title.value);
            this.headerEl.appendChild(title);
        }
    }

    /**
     * NodeGroup body 렌더링
     */
    renderBody() {
        if (this.custom.body) {
            utils.renderCustom(this.bodyEl, this.custom.body, this.getContext());
            return;
        }

        const wrapper = this.createBodyWrapper();
        this.bodyEl.appendChild(wrapper);

        if (this.viewData?.length) {
            this.viewData.forEach((d, index) => {
                const nodeId = `${this.id}-node-${index}`;
                const className = utils.makeClassName(["nodeGroup-node"],[utils.RULES.dataBindClass]);
                const nodeEl = utils.createElement("div", undefined, className);

                nodeEl.id = nodeId;
                nodeEl.dataset.index = index;
                nodeEl["_uiIndex"] = index;// 이벤트 성능 용
                wrapper.appendChild(nodeEl);

                const node = new Node({id: nodeId, options: {}, custom: {}, iconEngine: this.iconEngine});
                node.init(d);
                this.nodes.push(node);
            })
        }
    }

    /**
     * Body wrapper 생성
     * @returns {HTMLElement}
     */
    createBodyWrapper() {
        const className = utils.makeClassName(["nodes-grid"]);
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
        if (this.el) {
            utils.unbindEvents(this.el);
            utils.clear(this.el);
        }

        this.el = null;
        this.headerEl = null;
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

export default NodeGroup;