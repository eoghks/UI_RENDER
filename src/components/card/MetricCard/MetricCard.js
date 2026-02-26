import * as utils from "../../../utils/utils.js";

/**
 * MetricCard UI Component
 *
 * 메트릭 정보를 카드 형태로 렌더링하는 컴포넌트.
 * header, body, footer 영역을 가지며 커스텀 렌더링 및 이벤트 바인딩을 지원한다.
 *
 * @class
 */
class MetricCard {
    /**
     * @typedef {Object} MetricCardTitle
     * @property {string} [value] - 제목 텍스트
     * @property {string} [icon] - 아이콘 이름
     * @property {"left"|"right"} [iconPosition="right"] - 아이콘 위치
     * @property {string} [backgroundColor] - header 배경 클래스명
     */

    /**
     * @typedef {Object} MetricCardDelta
     * @property {"up"|"down"} type - 증감 방향
     * @property {string|number} value - 증감 값
     */

    /**
     * @typedef {Object} MetricCardData
     * @property {string|number} value - 메인 값
     * @property {string} [unit] - 단위
     * @property {MetricCardDelta} [delta] - 증감 정보
     */

    /**
     * @typedef {Object} MetricCardFooter
     * @property {string} [url] - 이동 링크
     * @property {string} [value] - 링크 텍스트
     */

    /**
     * @typedef {Object} MetricCardOptions
     * @property {string} [emptyText="데이터 없음"] - 데이터가 없을 때 표시 텍스트
     * @property {Array<Object>} [events] - 바인딩 이벤트 목록
     * @property {Function} [afterDraw] - draw 완료 후 실행 콜백
     */

    /**
     * @param {Object} params
     * @param {string} params.id - 카드가 렌더링될 DOM element id
     * @param {MetricCardTitle} [params.title]
     * @param {MetricCardFooter} [params.footer]
     * @param {MetricCardOptions} [params.options]
     * @param {Object} [params.custom] - header/body/footer 커스텀 렌더링 설정
     * @param {Object} [params.iconEngine] - 아이콘 렌더링 엔진
     */
    constructor({id, title = {}, footer = {}, options: userOptions = {}, custom = {}, iconEngine = null} = {}) {
        const defaultOption = {
            emptyText: "데이터 없음",
            events: [],
        }

        this.id = id;
        this.title = title;
        this.footer = footer;
        this.custom = custom;
        this.options = utils.deepMerge(defaultOption, userOptions);
        this.iconEngine = iconEngine;

        this.el = null;
        this.headerEl = null;
        this.bodyEl = null;
        this.footerEl = null;

        const base = new URL(".", import.meta.url).href;
        utils.injectCss(base + "MetricCard.css");
    }

    /**
     * 컴포넌트 초기화
     * @param {MetricCardData} data - 초기 데이터
     */
    init(data) {
        this.el = document.getElementById(this.id);
        if (!this.el) {
            throw new Error(`No metricCard element with id ${this.id}`);
        }

        this.clear();
        this.renderLayout();
        this.setData(data);
    }

    /**
     * 카드 내부 초기화
     */
    clear() {
        if (this.el) {
            utils.clear(this.el);
        }
    }

    /**
     * 기본 레이아웃 생성 (header, body, footer)
     */
    renderLayout() {
        this.headerEl = document.createElement("div");
        this.bodyEl = document.createElement("div");
        this.footerEl = document.createElement("div");

        this.headerEl.className = utils.makeClassName(["metricCard-header"]);
        this.bodyEl.className = utils.makeClassName(["metricCard-body"]);
        this.footerEl.className = utils.makeClassName(["metricCard-footer"]);

        this.el.append(
            this.headerEl,
            this.bodyEl,
            this.footerEl
        );
    }

    /**
     * 전체 UI 렌더링
     */
    draw() {
        this.renderHeader();
        this.renderBody();
        this.renderFooter();

        this.afterDraw();
        utils.bindEvents(this.el, this.options.events, [this.data]);
    }

    /**
     * 데이터 설정 후 렌더링
     * @param {MetricCardData} data
     */
    setData(data = {}) {
        this.data = data;
        this.draw();
    }

    /**
     * 현재 데이터로 다시 렌더링
     */
    redraw() {
        this.draw();
    }

    /**
     * Header 영역 렌더링
     */
    renderHeader() {
        this.headerEl.innerHTML = "";

        if (this.custom.header) {
            utils.renderCustom(this.headerEl, this.custom.header, this.getContext());
            return;
        }

        // heaeder 카드색 class 추가
        if (this.title.backgroundColor) {
            this.headerEl.classList.add(this.title.backgroundColor);
        }

        // title 추가
        const title = document.createElement("span");
        title.innerHTML = this.title.value;

        const elements = [title]; // 기본적으로 title만 있음

        // Icon 추가
        if (this.title.icon) {
            const icon = this.iconEngine.getIcon(this.title.icon);
            // iconPosition에 따라 순서 조정
            if (this.title.iconPosition === "left") {
                elements.unshift(icon); // 앞에 넣기
            } else {
                elements.push(icon);    // 뒤에 넣기 (기본)
            }
        }

        // 한 번에 append
        elements.forEach(el => this.headerEl.appendChild(el));
    }

    /**
     * Body 영역 렌더링
     */
    renderBody() {
        this.bodyEl.innerHTML = "";

        if (this.custom.body) {
            utils.renderCustom(this.bodyEl, this.custom.body, this.getContext());
            return;
        }

        const wrapper = this.createBodyWrapper();

        if (this.data) {
            wrapper.classList.add(utils.makeClassName([],[utils.RULES.dataBindClass]));
            wrapper.dataset.index = "0";
            wrapper["_uiIndex"] = 0;// 이벤트 성능 용
            wrapper.appendChild(this.createMainSection());

            if (this.shouldRenderDelta()) {
                wrapper.appendChild(this.createDeltaSection());
            }
        } else {
            this.renderEmpty(wrapper);
        }

        this.bodyEl.appendChild(wrapper);
    }

    /**
     * Body wrapper 생성
     * @returns {HTMLElement}
     */
    createBodyWrapper() {
        const wrapper = document.createElement("div");
        wrapper.className = utils.makeClassName(["metricCard-row"]);
        return wrapper;
    }

    /**
     * 메인 값 영역 생성
     * @returns {HTMLElement}
     */
    createMainSection() {
        const main = document.createElement("div");
        main.className = utils.makeClassName([], ["counter-group"]);

        const counter = document.createElement("span");
        counter.className = utils.makeClassName([], ["counter"]);
        counter.innerHTML = this.data.value;

        const unit = document.createElement("span");
        unit.className = utils.makeClassName([], ["unit"]);
        unit.innerHTML = this.data.unit;

        main.append(counter, unit);
        return main;
    }

    /**
     * delta 표시 여부 판단
     * @returns {boolean}
     */
    shouldRenderDelta() {
        return this.data?.delta && Number(this.data.delta.value) > 0;
    }

    /**
     * delta 영역 생성
     * @returns {HTMLElement}
     */
    createDeltaSection() {
        const {type, value} = this.data.delta;

        const delta = document.createElement("div");
        delta.className = utils.makeClassName([], ["delta", type]);

        const arrow = document.createElement("span");
        arrow.className = utils.makeClassName([], ["delta-arrow"]);
        arrow.textContent = type === "up" ? "▲" : "▼";

        const deltaValue = document.createElement("span");
        deltaValue.className = utils.makeClassName([], ["delta-value"]);
        deltaValue.textContent = value;

        delta.append(arrow, deltaValue);
        return delta;
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
     * Footer 영역 렌더링
     */
    renderFooter() {
        this.footerEl.innerHTML = "";

        if (this.custom.footer) {
            utils.renderCustom(this.footerEl, this.custom.footer, this.getContext());
            return;
        }

        if (this.footer && Object.keys(this.footer).length > 0) {
            const link = document.createElement("a");
            link.href = this.footer.url ? this.footer.url : "#";
            link.className = utils.makeClassName([], ["view-detail"]);
            link.textContent = this.footer.value;

            const icon = this.iconEngine.getIcon("chevron-right");
            link.appendChild(icon);

            this.footerEl.appendChild(link);
        }
    }

    /**
     * draw 이후 처리 (아이콘 렌더링, 사용자 afterDraw 실행)
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
     * 컴포넌트 제거 및 이벤트 해제
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
    }

    /**
     * 외부로 전달할 context 객체 생성
     * @returns {Object}
     */
    getContext() {
        return {
            id: this.id,
            el: this.el,
            title: this.title,
            rawData: this.data,
            options: this.options,
            ui: this
        };
    }
}


export default MetricCard;