/**
 * 값이 비었는지(empty) 확인합니다.
 *
 * <p>다음 경우에 true를 반환합니다:</p>
 * <ul>
 *   <li>null 또는 undefined</li>
 *   <li>빈 배열 또는 빈 문자열</li>
 *   <li>빈 Map 또는 Set</li>
 *   <li>키가 없는 객체</li>
 * </ul>
 *
 * <p>그 외 숫자, boolean 등은 false를 반환합니다.</p>
 *
 * @param {*} value 검사할 값
 * @returns {boolean} 값이 비어있으면 true, 아니면 false
 *
 * @example
 * isEmpty(null); // true
 * isEmpty([]); // true
 * isEmpty({}); // true
 * isEmpty("text"); // false
 * isEmpty(0); // false
 */
export function isEmpty(value) {
    if (value == null) return true; // null 또는 undefined

    if (Array.isArray(value) || typeof value === 'string') {
        return value.length === 0;      // 배열이나 문자열이면 길이 체크
    }

    if (value instanceof Map || value instanceof Set) {
        return value.size === 0;        // Map, Set이면 size 체크
    }

    if (typeof value === 'object') {
        return Object.keys(value).length === 0; // 객체이면 key 체크
    }

    return false; // 그 외 숫자, boolean 등은 empty가 아님
}

/**
 * UI 컴포넌트 관련 규칙 및 상수 모음
 *
 * @property {string} classPrefix - UI 클래스명 접두사 (기본값: "ui")
 * @property {string} dataBindClass - 데이터 바인딩용 클래스명 (기본값: "data-bind-item")
 *
 * @example
 * // 클래스명 생성 시 접두사 사용
 * const cls = `${RULES.classPrefix}-panel`; // "ui-panel"
 *
 * // 데이터 바인딩 요소 선택
 * const elements = document.querySelectorAll(`.${RULES.dataBindClass}`);
 */
export const RULES = {
    classPrefix: "dh",
    dataBindClass: "data-bind-item",
};

/**
 * 문서에 CSS를 동적으로 삽입합니다.
 *
 * <p>
 * 지정한 URL의 CSS 파일을 <code>link</code> 요소로 생성하여 <code>head</code>에 추가합니다.
 * 이미 동일한 CSS가 삽입되어 있다면 아무 작업도 수행하지 않습니다.
 * </p>
 *
 * @param {string} url - 삽입할 CSS 파일 경로 (절대 또는 상대 URL)
 *
 * @example
 * // 현재 스크립트 기준 상대 경로로 CSS 삽입
 * const base = new URL(".", import.meta.url).href;
 * injectCss(base + "uiCommon.css");
 *
 * @example
 * // 절대 URL 사용
 * injectCss("https://cdn.example.com/styles/main.css");
 */
export function injectCss(url) {
    if (!url || typeof url !== "string")
        return;

    const id = "css-" + url.split("/").pop().replace(/\W/g, "");
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = url;

    document.head.appendChild(link);
}

/**
 * 두 객체를 재귀적으로 병합하는 Deep Merge
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
export function deepMerge(target, source) {
    const result = {...target};
    for (const key in source) {
        if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

/**
 * Schema 기반 Mapper 생성
 * @param {Object} schema
 * @returns {Function}
 */
export function createMapper(schema) {
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
export function makeClassName(prefixed = [], raw = []) {
    const prefArr = Array.isArray(prefixed) ? prefixed : [prefixed];
    const rawArr = Array.isArray(raw) ? raw : [raw];

    const prefixClasses = prefArr.filter(Boolean).map(p => `${RULES.classPrefix}-${p}`);

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
export function makeSelectorClassName(prefixed = [], raw = []) {
    const prefArr = Array.isArray(prefixed) ? prefixed : [prefixed];
    const rawArr = Array.isArray(raw) ? raw : [raw];

    const prefSelectors = prefArr.map(n => "." + makeClassName([n]));
    const rawSelectors = rawArr.filter(Boolean).map(n => "." + n);

    return [...prefSelectors, ...rawSelectors].join(",");
}

/**
 * DOM 요소별로 등록된 이벤트 리스너 정보를 저장하는 내부 캐시.
 *
 * <p>
 * key:   이벤트가 바인딩된 {@link HTMLElement}
 * value: 해당 요소에 등록된 이벤트 리스너 목록
 *        ({ type: string, listener: Function }[])
 * </p>
 *
 * <p>
 * {@link WeakMap}을 사용하여 DOM 요소가 제거되면
 * 자동으로 가비지 컬렉션 대상이 되도록 설계되었습니다.
 * </p>
 *
 * @private
 * @type {WeakMap<HTMLElement, Array<{type: string, listener: EventListener}>>}
 */
const EVENT_STORE = new WeakMap();

/**
 * 지정된 DOM 요소에 바인딩된 모든 이벤트 리스너를 제거합니다.
 *
 * <p>
 * {@link WeakMap}에 저장된 이벤트 정보를 기반으로,
 * 해당 요소에 등록된 모든 이벤트 리스너를 제거합니다.
 * </p>
 *
 * <p>
 * 이 함수는 {@link bindEvents}를 통해 등록된 이벤트만 제거합니다.
 * </p>
 *
 * @param {HTMLElement} el 이벤트를 제거할 대상 DOM 요소
 */
export function unbindEvents(el) {
    if (!el) {
        return;
    }

    const stored = EVENT_STORE.get(el);
    if (stored) {
        stored.forEach(({type, listener, selectors}) => {
            el.removeEventListener(type, listener);

            // 👇 표시용 class 제거
            if (selectors) {
                selectors.forEach(selector => {
                    const targets = el.querySelectorAll(selector);
                    targets.forEach(target => {
                        target.classList.remove(this.makeClassName("event"));
                    });
                });
            }
        });
    }
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
export function bindEvents(el, events = [], viewData = []) {
    if (!el || !events.length) {
        return;
    }
    this.unbindEvents(el);
    // events Type 별로 그룹 핑
    const grouped = events.reduce((acc, event) => {
        if (!acc[event.type]) {
            acc[event.type] = [];
        }

        acc[event.type].push(event);
        return acc;
    }, {});

    // 이벤트 타입별 listener 하나만 등록
    const listeners = [];
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

                // 실제 DOM에 표시용 클래스 추가
                const targets = el.querySelectorAll(ev.selector);
                targets.forEach(target => {
                    target.classList.add(this.makeClassName("event"));
                });
            });

            const listener = e => {
                let node = e.target;

                while (node && node !== el) {
                    for (const [selector, evList] of selectorMap) {
                        if (!node.matches(selector)) continue;

                        const {index, data} = resolveItemData(node, viewData);

                        evList.forEach(ev => {
                            ev.handler(e, node, data, index, el);
                        });

                        return;
                    }
                    node = node.parentElement;
                }

                elEvents.forEach(ev => {
                    ev.handler(e, el, null, NaN, el);
                });
            }
            el.addEventListener(type, listener);
            listeners.push({type, listener, selectors: [...selectorMap.keys()]});
        }
    );
    EVENT_STORE.set(el, listeners);
}

export function resolveItemData(node, viewData) {
    const itemEl = node.closest(
        makeSelectorClassName([], [RULES.dataBindClass])
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

export function clear(el) {
    el.innerHTML = "";
}

export function renderCustom(targetEl, fn) {
    const node = fn(this.title);
    if (node instanceof HTMLElement) {
        targetEl.appendChild(node);
    } else if (typeof node === "string") {
        targetEl.innerHTML = node;
    } else {
        throw new TypeError(
            "Custom render function must return an HTMLElement or HTML string."
        );
    }
}