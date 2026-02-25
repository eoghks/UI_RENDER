import * as utils from "../utils/utils.js";
import {ListView} from "../index.js";
import { createLucideEngine } from "../plugins/lucide/lucideEngine.js";

/**
 * UI Factory v1.1
 * - 클래스 기반 컴포넌트를 new 없이 DOM 선택자로 초기화
 * - JSP/브라우저 환경에서 사용 가능
 * TODO: v2.0이상 공용 DOM Builder 유틸, Fragment 랜더링 or Virtual DOM
 */
if (!window.UI) {
    window.UI = {}; // window.UI에 객체 초기화
}

const UI = window.UI;

/**
 * 공통 CSS 로드
 */
(function () {
    const base = new URL(".", import.meta.url).href;
    utils.injectCss(base + "../styles/uiCommon.css");
})();

/**
 * 기본 Icon Engine 설정
 */
UI.iconEngine = createLucideEngine();

/**
 * 아이콘 엔진 교체 가능
 */
UI.setIconEngine = function (engine) {
    UI.iconEngine = engine;
};

/**
 * 특정 listView를 생성하고 렌더링합니다.
 *
 * - 내부적으로 `listView를`를 통해 ListView 인스턴스를 사용합니다.
 * - 패널 ID로 DOM 요소를 찾아서 렌더링하며, 커스텀 옵션과 후처리도 지원합니다.
 *
 * @param {string} id - 렌더링할 ListView의 DOM ID
 * @param {string} title - ListView의 제목
 * @param {Array<Object>} data - 렌더링할 데이터 배열
 * @param {Object} [schema] - 데이터 매핑 스키마 (옵션)
 * @param {Object} [options={}] - ListView 전달할 추가 옵션
 * @param {Object} [custom={}] - 커스텀 렌더링 함수
 * @param {Function} [custom.header] - 헤더 커스텀 함수 (panelEl 인자)
 * @param {Function} [custom.body] - 바디 커스텀 함수 (panelEl, viewData 인자)
 * @param {Function} [custom.footer] - 푸터 커스텀 함수 (panelEl 인자)
 */
UI.initListView = function ({id, title, data, schema, options = {}, custom = {}} = {}) {
    // ListView 인스턴스 생성
    const lv = new ListView({id, title, schema, options, custom, iconEngine: UI.iconEngine});

    // ListView Render
    lv.init(data);

    return lv;
}

/**
 * 향후 다른 컴포넌트 초기화 함수도 같은 패턴으로 추가 가능
 * 예)
 * UI.initCard("#myCard", options)
 * UI.initCardGroup(".cards", options)
 */

export default UI;