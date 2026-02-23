import * as utils from './utils.js';

/**
 * UiRender v1.0(컴포넌트 렌더러 (JSP/브라우저 환경))
 * TODO: v2.0이상 공용 DOM Builder 유틸, Fragment 랜더링 or Virtual DOM
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
        this.classPrefix = "ui";
        this.dataBindClass = "data-bind-item";

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

        // ⭐ 핵심: ES Module 대응 방식
        const base = new URL(".", import.meta.url).href;
        link.href = base + "uiRender.css";

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
            for (const [key, mapper] of Object.entries(schema)) {
                if (typeof mapper === "function") {
                    result[key] = mapper(data, key);
                } else {
                    result[key] = mapper;
                }
            }
            return result;
        };
    }

    /**
     * 클래스명을 생성한다.
     *
     * - prefixed: 자동으로 prefix(ui-)가 붙는 클래스명 목록
     * - raw: prefix 없이 그대로 사용할 클래스명 목록
     *
     * 둘 다 문자열 또는 배열을 받을 수 있으며,
     * falsy 값(null, undefined, "") 은 자동으로 제거된다.
     *
     * @example
     * makeClassName("panel")
     * → "ui-panel"
     *
     * @example
     * makeClassName(["panel", "item"])
     * → "ui-panel ui-item"
     *
     * @example
     * makeClassName("panel", "active")
     * → "ui-panel active"
     *
     * @example
     * makeClassName(["panel"], ["active", "large"])
     * → "ui-panel active large"
     *
     * @param {string|string[]} [prefixed=[]] prefix가 붙을 클래스명
     * @param {string|string[]} [raw=[]] prefix 없이 그대로 사용할 클래스명
     * @returns {string} 공백으로 구분된 className 문자열
     */
    makeClassName(prefixed = [], raw = []) {
        const prefArr = Array.isArray(prefixed) ? prefixed : [prefixed];
        const rawArr = Array.isArray(raw) ? raw : [raw];

        const prefixClasses = prefArr.filter(Boolean).map(p => `${this.classPrefix}-${p}`);

        return [...prefixClasses, ...rawArr.filter(Boolean)].join(" ");
    }

    /**
     * selector용 클래스명을 생성한다. (OR 선택자 형태)
     *
     * - prefixed: prefix(ui-)가 자동으로 붙는 클래스명 목록
     * - raw: prefix 없이 그대로 사용할 클래스명 목록
     *
     * 두 파라미터 모두 문자열 또는 배열을 받을 수 있으며,
     * 여러 개를 전달하면 comma(,)로 연결된 OR selector가 생성된다.
     *
     * 내부적으로 makeClassName을 사용하여
     * prefixed 클래스는 자동으로 prefix가 적용된다.
     *
     * @example
     * makeSelectorClassName(["panel-item"])
     * → ".ui-panel-item"
     *
     * @example
     * makeSelectorClassName(["panel-item", "panel-header"])
     * → ".ui-panel-item,.ui-panel-header"
     *
     * @example
     * makeSelectorClassName([], ["data-bind-item"])
     * → ".data-bind-item"
     *
     * @example
     * makeSelectorClassName(["panel-item"], ["active"])
     * → ".ui-panel-item,.active"
     *
     * @param {string|string[]} [prefixed=[]] prefix가 적용될 클래스명
     * @param {string|string[]} [raw=[]] prefix 없이 그대로 사용할 클래스명
     * @returns {string} CSS selector 문자열 (OR 형태)
     */
    makeSelectorClassName(prefixed = [], raw = []) {
        const prefArr = Array.isArray(prefixed) ? prefixed : [prefixed];
        const rawArr = Array.isArray(raw) ? raw : [raw];

        const prefSelectors = prefArr.map(n => "." + this.makeClassName([n]));
        const rawSelectors = rawArr.filter(Boolean).map(n => "." + n);

        return [...prefSelectors, ...rawSelectors].join(",");
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
        if (!panelEl) {
            throw new Error(`No panel element with id ${panelId}`);
        }

        // panelEl 초기화
        panelEl.innerHTML = "";

        const panelOptions = this.deepMerge({...this.options.panel}, options);

        // Header
        if (custom.header) {
            custom.header(panelEl);
        } else {
            this.renderDefaultHeader(panelEl, title);
        }

        // 데이터 전처리
        let viewData;
        if (!schema) {
            viewData = data;
        } else {
            const mapper = this.createMapper(schema);
            viewData = data.slice(0, panelOptions.size).map(mapper);
        }

        // Body
        if (custom.body) {
            custom.body(panelEl, viewData);
        } else {
            this.renderDefaultBody(panelEl, viewData, panelOptions);
        }

        // Footer
        if (custom.footer) {
            custom.footer(panelEl);
        }

        // Events
        this.bindEvents(panelEl, panelOptions.events, viewData);

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
    renderDefaultHeader(panel, title) {
        const div = document.createElement("div");
        div.className = this.makeClassName(["panel-header"]);
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
    renderDefaultBody(panel, viewData, panelOptions) {
        const body = document.createElement("div");
        body.className = this.makeClassName(["panel-body"]);

        const ul = document.createElement("ul");
        ul.className = this.makeClassName(["panel-item-list"]);

        if (viewData?.length) {
            viewData.forEach((item, index) => {
                const li = document.createElement("li");
                li.className = this.makeClassName(["panel-item"], [this.dataBindClass]);
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
            emptyDiv.className = this.makeClassName(["panel-item"], "empty");
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
        div.className = this.makeClassName(["panel-item-icon"]);
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
        div.className = this.makeClassName(["panel-item-content"]);

        const title = document.createElement("span");
        title.className = this.makeClassName(["panel-item-title"]);
        title.textContent = data.title;
        div.appendChild(title);

        if (data.subText) {
            const subText = document.createElement("span");
            subText.className = this.makeClassName(["panel-item-subText"]);
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
                return this.createStatus(data);
            case "ip":
                return this.createIp(data);
            default:
                return null;
        }
    }

    /**
     * IP 표시 컴포넌트를 생성한다.
     *
     * @param {Object} data item 데이터
     * @param {string} data.ip IP 주소
     * @returns {HTMLElement}
     */
    createIp(data) {
        const span = document.createElement("span");
        span.className = this.makeClassName(["panel-right"], ["ip"]);
        span.textContent = data.ip;
        return span;
    }

    /**
     * 상태 배지 컴포넌트를 생성한다.
     *
     * @param {Object} data item 데이터
     * @param {string} data.status 상태 텍스트
     * @returns {HTMLElement}
     */
    createStatus(data) {
        const span = document.createElement("span");
        span.className = this.makeClassName(["panel-right"], ["status-badge", (data.status || "").toLowerCase()]);
        span.textContent = data.status;
        return span;
    }

    /**
     * 이벤트 위임 방식으로 패널에 이벤트를 바인딩한다.
     *
     * - 이벤트 타입별로 listener는 1개만 등록된다.
     * - selector 매칭은 가장 가까운 DOM부터 탐색된다.
     * - dataBindClass가 부여된 요소에서 index 기반 데이터가 자동 전달된다.
     *
     * handler 호출 파라미터:
     * (event, matchedElement, itemData, index, rootElement)
     *
     * @param {HTMLElement} el 이벤트 루트 요소
     * @param {Array<Object>} events 이벤트 설정 목록
     * @param {string} events[].type 이벤트 타입 (click, change 등)
     * @param {string} [events[].selector] 이벤트 대상 selector
     * @param {Function} events[].handler 이벤트 핸들러
     * @param {Object[]} viewData 데이터 바인딩 목록
     */
    bindEvents(el, events = [], viewData = []) {
        // events Type 별로 그룹 핑
        const grouped = events.reduce((acc, event) => {
            if (!acc[event.type]) {
                acc[event.type] = [];
            }

            acc[event.type].push(event);
            return acc;
        }, {});

        // 이벤트 타입별 listener 하나만 등록
        Object.entries(grouped).forEach(([type, eventList]) => {

                const selectorMap = new Map();
                const elEvents = [];

                eventList.forEach(ev => {
                    if (!ev.selector) {
                        elEvents.push(ev);
                        return;
                    }

                    const list = selectorMap.get(ev.selector) || [];
                    list.push(ev);
                    selectorMap.set(ev.selector, list);
                });

                el.addEventListener(type, e => {
                    // 선택한 Element부터 위로 올라가며 가장 가까운 이벤트 탐색
                    let node = e.target;

                    while (node && node !== el) {
                        for (const [selector, evList] of selectorMap) {
                            if (!node.matches(selector)) continue;

                            // 데이터 item 찾기 (최적화)
                            const {index, data} = this.resolveItemData(node, viewData);

                            // 같은 selector에 여러 이벤트 실행
                            evList.forEach(ev => {
                                ev.handler(e, node, data, index, el);
                            });

                            // 가장 가까운 매칭만 실행
                            return;
                        }

                        node = node.parentElement;
                    }

                    // selector 없는 element 자체 이벤트 처리
                    elEvents.forEach(ev => {
                        ev.handler(e, el, null, NaN, el);
                    });
                });
            }
        );
    }

    resolveItemData(node, viewData) {
        const itemEl = node.closest(
            this.makeSelectorClassName([], [this.dataBindClass])
        );

        if (!itemEl) {
            return {index: NaN, data: null};
        }

        const index = itemEl._uiIndex ?? parseInt(itemEl.dataset.index ?? "", 10);

        if (Number.isNaN(index)) {
            return {index: NaN, data: null};
        }

        return {
            index,
            data: viewData[index]
        };
    }
}

export default UiRender;