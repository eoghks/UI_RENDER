import * as utils from "../utils/utils.js";
import {ListView} from "../index.js";

/**
 * UiRender v1.0(컴포넌트 렌더러 (JSP/브라우저 환경))
 * TODO: v2.0이상 공용 DOM Builder 유틸, Fragment 랜더링 or Virtual DOM
 */
class UiRender {
    /**
     * @param {Object} [options] - 글로벌 기본 옵션
     * @param {Object} [options.listView] - listView 기본 옵션
     * @param {number} [options.listView.size=5] - 최대 표시 데이터 개수
     * @param {Array<Object>} [options.listView.events=[]] - 이벤트 설정 목록
     */
    constructor(options = {}) {
        const defaults = {};
        this.options = utils.deepMerge(defaults, options);

        const base = new URL(".", import.meta.url).href;
        utils.injectCss(base + "../styles/uiRender.css");

        this._listView = null;
    }

    /**
     * ListView 인스턴스를 lazy하게 생성하여 반환합니다.
     *
     * - 처음 접근 시에만 ListView 생성하며, 이후에는 동일한 인스턴스를 재사용합니다.
     * - 생성 시, UiRender의 `options.listView` 옵션을 전달합니다.
     *
     * @type {ListView}
     */
    get listView() {
        if (!this._listView) {
            // 필요 시에만 생성
            this._listView = new ListView(this.options.listView);
        }
        return this._listView;
    }

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
    createListView(id, title, data, schema, options = {}, custom = {}) {
        this.listView.render(id, title, data, schema, options, custom);
    }
}

export default UiRender;