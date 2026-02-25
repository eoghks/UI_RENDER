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
 * UI 네이밍 규칙 및 클래스 규약을 중앙에서 관리하는 객체입니다.
 *
 * UI 엔진 전반에서 일관된 클래스 네이밍 전략을 제공하며,
 * 동적으로 생성되는 모든 클래스명은 이 객체를 기반으로 정의되어야 합니다.
 * 이를 통해 예측 가능성과 유지보수성을 확보할 수 있습니다.
 *
 * 구성 설명:
 * - `classPrefix` : 모든 UI 관련 클래스의 기본 네임스페이스 접두사
 * - `dataBindClass` : 데이터 바인딩 대상 요소를 식별하기 위한 클래스명
 * - `eventClass` : `classPrefix`를 기반으로 생성되는 이벤트 대상 클래스
 * - `eventActiveClass` : 이벤트 요소의 활성 상태를 나타내는 클래스
 *
 * ⚠ `classPrefix`를 변경하면 이를 기반으로 생성되는 모든 클래스명에 영향을 미칩니다.
 *
 * @readonly
 *
 * @property {string} classPrefix
 * UI 클래스의 루트 네임스페이스 접두사
 * 기본값: `"dh"`
 *
 * @property {string} dataBindClass
 * 데이터 바인딩 요소를 식별하기 위한 클래스명
 * 기본값: `"data-bind-item"`
 *
 * @property {string} eventClass
 * 이벤트 처리가 가능한 요소에 적용되는 클래스명
 * 형식: `${classPrefix}-event`
 *
 * @property {string} eventActiveClass
 * 이벤트 요소의 활성(active) 상태를 나타내는 클래스명
 * 형식: `${classPrefix}-event-active`
 *
 * @example
 * // 접두사를 활용한 클래스 생성
 * const cls = `${RULES.classPrefix}-panel`; // "dh-panel"
 *
 * @example
 * // 데이터 바인딩 요소 선택
 * const items = document.querySelectorAll(`.${RULES.dataBindClass}`);
 *
 * @example
 * // 활성 상태 클래스 적용
 * element.classList.add(RULES.eventActiveClass);
 */
export const RULES = {
    classPrefix: "dh",
    dataBindClass: "data-bind-item",
    get eventClass() {
        return `${this.classPrefix}-event`;
    },

    get eventActiveClass() {
        return `${this.eventClass}-active`;
    }
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

            // 표시용 class 제거
            if (selectors) {
                selectors.forEach(selector => {
                    const targets = el.querySelectorAll(selector);
                    targets.forEach(target => {
                        target.classList.remove(RULES.eventClass);
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
    unbindEvents(el);
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
                    target.classList.add(RULES.eventClass);
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
    // Event 활성화 이벤트
    enableNearestHover(el);
}

/**
 * 지정한 컨테이너 요소에 위임 방식(delegate)의 hover 동작을 활성화합니다.
 *
 * 이 함수는 컨테이너에 `mouseover` 및 `mouseout` 이벤트를 등록하고,
 * `RULES.eventClass`에 해당하는 가장 가까운 요소를 찾아
 * 동적으로 활성 클래스(active class)를 적용합니다.
 *
 * 동작 방식:
 * - 마우스가 올라간 가장 가까운 요소에 `RULES.eventActiveClass`를 추가합니다.
 * - 동시에 하나의 요소만 활성 상태를 유지합니다.
 * - 포인터가 해당 요소를 완전히 벗어나면 활성 클래스를 제거합니다.
 * - 동일한 활성 요소 내부에서의 이동은 무시합니다.
 *
 * 등록된 이벤트 리스너는 이후 해제를 위해 내부 `EVENT_STORE`에 저장됩니다.
 *
 * @param {HTMLElement} el
 * hover 위임을 적용할 컨테이너 요소
 *
 * @example
 * enableNearestHover(containerEl);
 *
 * @remarks
 * - 성능을 위해 이벤트 위임 방식을 사용합니다.
 * - 동적으로 생성/변경되는 리스트 또는 그리드 UI 구조에 적합합니다.
 * - 필요 시 별도의 unbind 함수로 이벤트 리스너를 제거해야 합니다.
 */
export function enableNearestHover(el) {
    if (!el) {
        return;
    }

    let currentActive = null;

    const mouseOver = e => {
        const target = e.target.closest(`.${RULES.eventClass}`);
        if (!target || !el.contains(target)) return;

        if (currentActive && currentActive !== target) {
            currentActive.classList.remove(RULES.eventActiveClass);
        }

        currentActive = target;
        currentActive.classList.add(RULES.eventActiveClass);
    };

    const mouseOut = e => {
        if (!currentActive) {
            return;
        }

        const related = e.relatedTarget;

        // 완전히 DOM 밖으로 나감
        if (!related) {
            currentActive.classList.remove(RULES.eventActiveClass);
            currentActive = null;
            return;
        }

        // 2현재 active 영역 내부 이동이면 무시
        if (currentActive.contains(related)) {
            return;
        }

        // 다른 eventClass 요소로 이동하면 mouseOver가 처리
        const nextTarget = related.closest(`.${RULES.eventClass}`);
        if (nextTarget) {
            return;
        }

        // 완전히 벗어난 경우만 제거
        currentActive.classList.remove(RULES.eventActiveClass);
        currentActive = null;
    };

    el.addEventListener("mouseover", mouseOver);
    el.addEventListener("mouseout", mouseOut);

    // unbind 대비 저장
    const stored = EVENT_STORE.get(el) || [];
    stored.push({type: "mouseover", listener: mouseOver});
    stored.push({type: "mouseout", listener: mouseOut});
    EVENT_STORE.set(el, stored);
}

/**
 * DOM 노드로부터 바인딩된 아이템 데이터를 조회합니다.
 *
 * 전달된 노드(node)에서 시작하여 상위 DOM 트리를 탐색하고,
 * data-bind 선택자에 해당하는 가장 가까운 요소를 찾습니다.
 * 이후 해당 요소의 인덱스를 추출한 뒤,
 * 전달받은 viewData 배열에서 대응하는 데이터를 반환합니다.
 *
 * 인덱스는 다음 우선순위로 결정됩니다:
 * 1. `element._uiIndex` (내부에서 사용하는 빠른 접근용 인덱스)
 * 2. `element.dataset.index`
 *
 * 유효한 아이템 요소 또는 인덱스를 찾지 못한 경우,
 * `{ index: NaN, data: null }`을 반환합니다.
 *
 * @param {HTMLElement | Element} node
 * 탐색을 시작할 DOM 노드 (예: event.target)
 *
 * @param {Array<any>} viewData
 * 현재 렌더링에 사용 중인 데이터 배열
 *
 * @returns {{ index: number, data: any | null }}
 * 다음 정보를 포함한 객체:
 * - `index`: 계산된 아이템 인덱스 (유효하지 않으면 NaN)
 * - `data`: 해당 인덱스에 대응하는 데이터 (없으면 null)
 *
 * @example
 * element.addEventListener("click", (e) => {
 *   const { index, data } = resolveItemData(e.target, viewData);
 *   if (!Number.isNaN(index)) {
 *     console.log("클릭된 항목:", index, data);
 *   }
 * });
 */
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

/**
 * 지정된 DOM 요소의 모든 자식 노드를 제거합니다.
 *
 * <p>
 * 내부적으로 {@code innerHTML = ""}을 사용하여
 * 요소의 콘텐츠를 초기화합니다.
 * </p>
 *
 * @param {HTMLElement} el 초기화할 DOM 요소
 */
export function clear(el) {
    el.innerHTML = "";
}

/**
 * 사용자 정의 렌더링 함수를 실행하고,
 * 반환된 결과를 지정된 대상 요소에 렌더링합니다.
 *
 * 렌더 함수는 전달된 `context` 객체를 인자로 받아
 * {@link HTMLElement} 또는 HTML 문자열을 반환해야 합니다.
 *
 * 동작 방식:
 * - {@link HTMLElement} 반환 → `appendChild()`로 추가
 * - 문자열 반환 → `innerHTML`로 설정
 * - 그 외 타입 반환 → {@link TypeError} 발생
 *
 * @param {HTMLElement} targetEl
 * 렌더링 대상이 되는 DOM 요소
 *
 * @param {(context: Object) => (HTMLElement|string)} fn
 * 사용자 정의 렌더 함수.
 * UI 컨텍스트를 인자로 받아 HTMLElement 또는 HTML 문자열을 반환해야 합니다.
 *
 * @param {Object} context
 * 렌더 함수에 전달할 UI 컨텍스트 객체
 *
 * @throws {TypeError}
 * 렌더 함수가 HTMLElement 또는 문자열을 반환하지 않는 경우 발생
 *
 * @example
 * renderCustom(container, (ctx) => {
 *   const el = document.createElement("div");
 *   el.textContent = ctx.title;
 *   return el;
 * }, ui.getContext());
 *
 * @remarks
 * - 문자열 반환 시 기존 자식 노드는 모두 교체됩니다.
 * - HTMLElement 반환 시 기존 내용 뒤에 추가됩니다.
 */
export function renderCustom(targetEl, fn, context) {
    const node = fn(context);
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